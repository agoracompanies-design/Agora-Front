import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { tryMockResponse } from './mockFallback';

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

const TOKEN_KEY = 'agora_token';
const REFRESH_KEY = 'agora_refresh';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * El token de refresco vive aquí porque el backend lo devuelve en el cuerpo del
 * login, no en una cookie. Guardarlo en `localStorage` es lo único que se puede
 * hacer desde el navegador con eso, pero conviene saber lo que implica: al
 * alcance de cualquier script de la página, y con una semana de validez por
 * delante. Con una cookie `httpOnly` no lo estaría; está pedido al equipo.
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}

export function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_KEY);
}

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Qué hacer cuando ya no hay manera de seguir: lo registra el contexto de
 * sesión para cerrar la suya. El cliente no sabe de React ni de rutas.
 */
let alPerderLaSesion: (() => void) | null = null;

export function registrarCierreDeSesion(fn: () => void): void {
  alPerderLaSesion = fn;
}

/** Las rutas donde un 401 significa «credenciales malas», no «token caducado». */
const SIN_REINTENTO = ['/auth/login', '/auth/refresh'];

/**
 * El refresco en curso, si lo hay.
 *
 * Al caducar el token suelen fallar varias peticiones a la vez —el catálogo,
 * la empresa, la suscripción—. Sin esto cada una pediría su propio refresco:
 * tantas renovaciones simultáneas como peticiones hubiera en vuelo.
 */
let refrescando: Promise<string> | null = null;

function refrescarToken(): Promise<string> {
  if (refrescando) return refrescando;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.reject(new ApiError('Sin token de refresco', 401));

  // Con una instancia limpia: la de siempre añadiría el token caducado y
  // volvería a entrar por este mismo interceptor.
  refrescando = axios
    .post<{ accessToken: string }>(`${API_BASE_URL}/auth/refresh`, { refreshToken })
    .then((res) => {
      const nuevo = res.data.accessToken;
      setToken(nuevo);
      return nuevo;
    })
    .finally(() => {
      refrescando = null;
    });

  return refrescando;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string | string[] }>) => {
    // Dev-only convenience: if the real backend simply isn't reachable
    // (no response at all — not a real 4xx/5xx), fall back to local sample
    // data so the app isn't just error toasts right after `git clone`.
    if (import.meta.env.DEV && !error.response && error.config) {
      const mocked = tryMockResponse(error.config);
      if (mocked !== undefined) {
        return Promise.resolve({
          data: mocked,
          status: 200,
          statusText: 'OK (mock)',
          headers: {},
          config: error.config,
        });
      }
    }

    const status = error.response?.status ?? 0;
    const peticion = error.config as (AxiosRequestConfig & { _reintentada?: boolean }) | undefined;
    const esDeAuth = SIN_REINTENTO.some((ruta) => peticion?.url?.includes(ruta));

    // Un 401 aquí casi siempre es el token caducado, no una sesión perdida: se
    // renueva y se repite la petición una sola vez. Si el refresco también
    // falla —caducó, o lo revocó un «cerrar sesión»— entonces sí se acabó.
    if (status === 401 && peticion && !peticion._reintentada && !esDeAuth && getRefreshToken()) {
      peticion._reintentada = true;
      try {
        const nuevo = await refrescarToken();
        peticion.headers = { ...peticion.headers, Authorization: `Bearer ${nuevo}` };
        return apiClient.request(peticion);
      } catch {
        clearToken();
        clearRefreshToken();
        alPerderLaSesion?.();
      }
    }

    const raw = error.response?.data?.message;
    const message = Array.isArray(raw)
      ? raw.join(', ')
      : raw ?? error.message ?? 'Ocurrió un error inesperado';
    return Promise.reject(new ApiError(message, status));
  },
);

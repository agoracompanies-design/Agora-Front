import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { tryMockResponse } from './mockFallback';

/**
 * Dónde está la API.
 *
 * La dirección de reserva es **solo para desarrollo**: el puerto 3000 es donde
 * escucha el backend aquí, el mismo que dice `.env.example`. Antes ponía 3001,
 * que no es ningún sitio.
 *
 * Al construir para producción no se llega a usar: el plugin de la política de
 * seguridad para el build si falta `VITE_API_URL`, porque un sitio publicado
 * apuntando a `localhost` no falla —se queda en blanco— y eso no se ve hasta
 * que alguien lo abre.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'https://backend-production-36b1.up.railway.app/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,  
  /**
   * Sin esto el navegador no manda la cookie del token de refresco: la web y la
   * API están en orígenes distintos (`:5173` y `:3000`), y ahí las cookies solo
   * viajan si se piden. El servidor ya responde con `credentials: true`.
   */
  withCredentials: true,
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
 * El token de refresco se guarda aquí porque el backend, además de ponerlo en
 * una cookie `httpOnly`, lo sigue devolviendo en el cuerpo del login, y de
 * momento es la única vía que funciona: el servidor no llega a leer la cookie.
 *
 * `localStorage` es lo único que se puede hacer desde el navegador con un token
 * que llega en el cuerpo, pero conviene saber lo que implica: al alcance de
 * cualquier script de la página, y con una semana de validez por delante. En la
 * cookie no lo estaría. Cuando el servidor la lea y deje de mandar el token en
 * el cuerpo, esto se queda vacío y el refresco sigue funcionando igual.
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

  /**
   * El cuerpo del error, cuando el servidor manda un objeto en vez de un texto.
   *
   * Lo hace en el baneo: `POST /auth/login` responde 403 con
   * `{ code: 'USER_BANNED', reason, bannedAt, groupName, groupPhone }`, y con
   * eso se arma la pantalla de cuenta bloqueada. Antes llegaba como JSON
   * metido dentro de `message` y había que parsearlo dos veces; desde
   * `51aa8fe` ya es un objeto.
   */
  datos?: Record<string, unknown>;

  constructor(message: string, status: number, datos?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.datos = datos;
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

/**
 * Pide un token de acceso nuevo ahora mismo, sin esperar a que el actual
 * caduque.
 *
 * Los permisos viajan dentro del token, no se consultan en cada petición: el
 * servidor firma los que tenía el usuario al emitirlo. Así que cuando concede
 * uno nuevo —dar de alta la empresa concede los de publicar—, el token que hay
 * en la mano se queda corto y sigue recibiendo 403 hasta que se renueve. El
 * refresco relee los permisos guardados, de modo que con esto basta.
 */
export function renovarAcceso(): Promise<string> {
  return refrescarToken();
}

function refrescarToken(): Promise<string> {
  if (refrescando) return refrescando;

  // Si no hay token guardado se pide igual: puede que el único que exista sea
  // el de la cookie, que desde aquí no se puede leer pero el navegador manda.
  const refreshToken = getRefreshToken();

  // Con una instancia limpia: la de siempre añadiría el token caducado y
  // volvería a entrar por este mismo interceptor. `withCredentials` hay que
  // repetirlo porque esta llamada no pasa por `apiClient`.
  refrescando = axios
    .post<{ accessToken: string; refreshToken?: string }>(
      `${API_BASE_URL}/auth/refresh`,
      refreshToken ? { refreshToken } : {},
      { withCredentials: true },
    )
    .then((res) => {
      const nuevo = res.data.accessToken;
      setToken(nuevo);
      // Si el servidor rota el token de refresco, quedarse con el viejo dejaría
      // la sesión colgada en el siguiente intento.
      if (res.data.refreshToken) setRefreshToken(res.data.refreshToken);
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
    //
    // Basta con que haya habido sesión para intentarlo: el token de refresco
    // puede estar guardado o vivir solo en la cookie. Sin nada de eso no se
    // intenta, para no añadir una petición perdida a cada 401 de quien ni
    // siquiera ha entrado.
    const huboSesion = Boolean(getRefreshToken() || getToken());
    if (status === 401 && peticion && !peticion._reintentada && !esDeAuth && huboSesion) {
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
    const datos =
      raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : undefined;
    const message = Array.isArray(raw)
      ? raw.join(', ')
      : typeof raw === 'string'
        ? raw
        : (typeof datos?.message === 'string' ? datos.message : null) ??
          error.message ??
          'Ocurrió un error inesperado';
    return Promise.reject(new ApiError(message, status, datos));
  },
);

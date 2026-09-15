import { apiClient } from './client';
import type { LoginResponse } from '@/types';

export function login(username: string, password: string) {
  return apiClient
    .post<LoginResponse>('/auth/login', { username, password })
    .then((res) => res.data);
}

/**
 * Si el servidor guarda ya un contacto —correo o teléfono— de la cuenta.
 *
 * Hoy no: la tabla `users` solo tiene `id`, `username`, `permissions`,
 * `password`, `planType` e `image`, y `POST /user` únicamente acepta usuario y
 * contraseña. Mandarle un contacto lo descartaría en silencio, y pedirlo para
 * tirarlo es peor que no pedirlo: da la impresión de que la cuenta quedó
 * verificada cuando no hay nada guardado.
 *
 * Por eso el campo está escrito y validado pero no se enseña mientras esto sea
 * `false`. Está pedido en `bugs-para-arreglar.md` con el esquema que hace
 * falta; cuando llegue, esto pasa a `true` y aparece.
 */
export const CONTACTO_EN_REGISTRO_LISTO = false;

export interface DatosDeRegistro {
  username: string;
  password: string;
  /** Correo o teléfono: uno de los dos, para que la cuenta tenga dueño. */
  contacto?: string;
}

export function register(username: string, password: string, contacto?: string) {
  const cuerpo: Record<string, string> = { username, password };
  if (CONTACTO_EN_REGISTRO_LISTO && contacto) cuerpo.contacto = contacto;
  return apiClient.post<void>('/user', cuerpo).then((res) => res.data);
}

/**
 * Cierra la sesión en el servidor: revoca el token de refresco, de modo que
 * nadie pueda renovar desde este equipo.
 *
 * Ojo con lo que NO hace: el `accessToken` ya emitido sigue siendo válido hasta
 * que caduque por tiempo, porque el backend no lleva lista de tokens
 * revocados. Cuánto dura eso depende de `JWT_EXPIRES_IN`.
 */
export function logout() {
  return apiClient.post<void>('/auth/logout').then((res) => res.data);
}

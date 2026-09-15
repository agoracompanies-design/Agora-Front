import { contactoParaElServidor } from '@/lib/contacto-cuenta';
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
 * Desde el commit `92abc88` sí, y además **lo exige**: `users` tiene `email` y
 * `phone`, los dos con índice único, y `POST /user` responde 400 si no llega
 * ninguno de los dos. Así que esto ya no es opcional para nosotros: sin
 * mandarlo no se puede crear una cuenta.
 *
 * Van en dos campos separados porque es lo que espera el servidor; en pantalla
 * se pide en uno solo y `contactoParaElServidor()` decide cuál es. El teléfono
 * viaja sin espacios: el backend lo valida con `/^\+?\d{8,15}$/`.
 */
export const CONTACTO_EN_REGISTRO_LISTO = true;

export function register(username: string, password: string, contacto?: string) {
  const cuerpo: Record<string, string> = { username, password };
  if (contacto) Object.assign(cuerpo, contactoParaElServidor(contacto));
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

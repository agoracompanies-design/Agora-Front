import { apiClient } from './client';
import type { LoginResponse } from '@/types';

export function login(username: string, password: string) {
  return apiClient
    .post<LoginResponse>('/auth/login', { username, password })
    .then((res) => res.data);
}

export function register(username: string, password: string) {
  return apiClient.post<void>('/user', { username, password }).then((res) => res.data);
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

import { apiClient } from './client';

/**
 * Avisos del usuario, guardados en el servidor.
 *
 * Hasta el 2026-10-06 la bandeja vivía en `localStorage` —se perdía al cambiar
 * de equipo y no la veía nadie más—, porque el backend no tenía dónde ponerla.
 * Desde su commit `9c56b97` existe el módulo de notificaciones.
 *
 * **El usuario no viaja en la petición**: el servidor sabe de quién es la sesión
 * por el token y filtra por él, también al marcar leído, que comprueba el par
 * (aviso, usuario). Mandarlo desde aquí sería dejar que el cliente diga de quién
 * son los avisos que quiere.
 */

/** Los tres tipos que guarda el backend. */
export type TipoAvisoApi = 'account' | 'conduct' | 'demand';

export interface AvisoApi {
  id: string;
  kind: TipoAvisoApi;
  title: string;
  body: string;
  sentAt: string;
  read: boolean;
  /** Mensaje ya escrito para responder por WhatsApp, en los que lo piden. */
  whatsappMessage?: string | null;
}

export interface BandejaApi {
  items: AvisoApi[];
  unread: number;
}

export function listarAvisos() {
  return apiClient.get<BandejaApi>('/notifications').then((res) => res.data);
}

/** Devuelve la bandeja ya actualizada, así que no hace falta volver a pedirla. */
export function marcarAvisoLeido(id: string) {
  return apiClient
    .patch<BandejaApi>(`/notifications/${encodeURIComponent(id)}/read`)
    .then((res) => res.data);
}

/** Lo único que el usuario puede silenciar: las promociones. */
export interface AjustesDeAvisos {
  promotions: boolean;
}

export function leerAjustesDeAvisos() {
  return apiClient.get<AjustesDeAvisos>('/notification-settings').then((res) => res.data);
}

export function guardarAjustesDeAvisos(promotions: boolean) {
  return apiClient
    .patch<AjustesDeAvisos>('/notification-settings', { promotions })
    .then((res) => res.data);
}

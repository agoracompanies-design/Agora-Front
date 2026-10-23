import { apiClient } from './client';
import type { Rating } from '@/types';

export function listRatingsByProduct(productId: string) {
  return apiClient.get<Rating[]>(`/ratings/product/${productId}`).then((res) => res.data);
}

export function listRatingsByService(serviceId: string) {
  return apiClient.get<Rating[]>(`/ratings/service/${serviceId}`).then((res) => res.data);
}

/**
 * Califica un producto o un servicio, o **cambia** la nota ya puesta.
 *
 * Dos cosas cambiaron en el servidor con el commit `392c430` y las dos importan
 * aquí:
 *
 * - **`userId` ya no va en el cuerpo**, sale del token. Mandarlo responde
 *   `400 property userId should not exist`, así que con el código anterior no
 *   entraba ni una calificación. Que lo decida el token es lo correcto: antes
 *   se podía calificar en nombre de otra persona.
 * - **Volver a mandarla no crea otra fila**: reescribe la de uno. Por eso esta
 *   misma función sirve para calificar y para cambiar la nota, y no hace falta
 *   el `PATCH` —que además pide un permiso que las cuentas normales no
 *   tienen—.
 */
export function createRating(input: { quantity: number; productId?: string; serviceId?: string }) {
  return apiClient.post<Rating>('/ratings', input).then((res) => res.data);
}

export function updateRating(id: string, quantity: number) {
  return apiClient.patch<Rating>(`/ratings/${id}`, { quantity }).then((res) => res.data);
}

export function deleteRating(id: string) {
  return apiClient.delete<void>(`/ratings/${id}`).then((res) => res.data);
}

export function averageRating(ratings: Rating[]): number {
  if (ratings.length === 0) return 0;
  return ratings.reduce((sum, r) => sum + r.quantity, 0) / ratings.length;
}

/**
 * El resumen de un producto: media, cuántos votos y la nota de quien pregunta.
 *
 * Existe desde el commit `55c1994` del backend. Antes había que bajarse **todas**
 * las calificaciones del producto —con el usuario de cada una— para calcular una
 * media en el teléfono: cientos de filas para enseñar un número, con la conexión
 * que hay aquí, y datos de otras personas que no pintaban nada en el navegador.
 */
export interface ResumenDeCalificacion {
  average: number | null;
  count: number;
  /** La nota de quien pregunta, o `null` si todavía no calificó. */
  mine: number | null;
}

export function getProductRatingSummary(productId: string) {
  return apiClient
    .get<ResumenDeCalificacion>(`/ratings/product/${productId}/summary`)
    .then((res) => res.data);
}

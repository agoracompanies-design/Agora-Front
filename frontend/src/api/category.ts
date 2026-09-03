import { apiClient } from './client';
import type { Category } from '@/types';

/**
 * Las categorías del catálogo.
 *
 * Al publicar un producto no se llama a nada de aquí: se manda el nombre en
 * `category` y el backend resuelve solo —si no existe, la crea pendiente y deja
 * el producto en «Otros»—. Estos endpoints son para leer la lista y para lo que
 * hace un moderador.
 */

/** Todas, aprobadas y pendientes. Cualquier cuenta puede leerlas. */
export function listCategories() {
  return apiClient.get<Category[]>('/categories').then((res) => res.data);
}

/** Solo las que esperan revisión. Pide `category:approve`. */
export function listPendingCategories() {
  return apiClient.get<Category[]>('/categories/pending').then((res) => res.data);
}

/** Aprobar: a partir de ahí la categoría clasifica de verdad. */
export function approveCategory(id: string) {
  return apiClient.patch<Category>(`/categories/${id}/approve`).then((res) => res.data);
}

/** Cambiar el nombre —para corregir la ortografía antes de aprobarla— o el estado. */
export function updateCategory(id: string, input: Partial<Pick<Category, 'name' | 'approved'>>) {
  return apiClient.patch<Category>(`/categories/${id}`, input).then((res) => res.data);
}

/** Descartar una sugerencia. */
export function deleteCategory(id: string) {
  return apiClient.delete<void>(`/categories/${id}`).then((res) => res.data);
}

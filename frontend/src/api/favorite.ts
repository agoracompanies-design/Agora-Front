import { apiClient } from './client';
import type { Product, UserEnterprise } from '@/types';

/**
 * Favoritos guardados en el servidor.
 *
 * Hasta el 2026-09-15 vivían solo en el navegador, así que se perdían al
 * cambiar de equipo o al limpiar el navegador —para algo que la gente usa como
 * su lista de la compra, no se sostenía—. Ya existe la tabla `favorites`, con
 * una fila por usuario y producto (o negocio).
 *
 * Los productos y los negocios comparten tabla pero tienen rutas propias, así
 * que aquí van como dos pares de funciones y no como uno genérico: se lee mejor
 * en quien las llama.
 */

export function listFavoriteProducts() {
  return apiClient.get<Product[]>('/favorites/products').then((res) => res.data);
}

export function addFavoriteProduct(productId: string) {
  return apiClient.post<void>(`/favorites/product/${productId}`).then((res) => res.data);
}

export function removeFavoriteProduct(productId: string) {
  return apiClient.delete<void>(`/favorites/product/${productId}`).then((res) => res.data);
}

export function listFavoriteEnterprises() {
  return apiClient.get<UserEnterprise[]>('/favorites/enterprises').then((res) => res.data);
}

export function addFavoriteEnterprise(enterpriseId: string) {
  return apiClient.post<void>(`/favorites/enterprise/${enterpriseId}`).then((res) => res.data);
}

export function removeFavoriteEnterprise(enterpriseId: string) {
  return apiClient.delete<void>(`/favorites/enterprise/${enterpriseId}`).then((res) => res.data);
}

/**
 * Los productos que más gente ha guardado, para el carrusel de la comunidad.
 *
 * `GET /products/most-favorited` está escrito y responde lo que hace falta
 * —producto y recuento—, pero hoy devuelve **500**: en el controlador se
 * declara después de `@Get(':id')`, que al ser de un solo tramo se queda con
 * «most-favorited» y lo busca como si fuera el id de un producto. Se arregla
 * moviendo la ruta por encima; está pedido en `bugs-para-arreglar.md`.
 *
 * Mientras tanto esto no se llama desde ninguna pantalla. Queda escrito para
 * enchufarlo con una línea el día que la ruta responda.
 */
export const MAS_GUARDADOS_LISTO = false;

export interface ProductoMasGuardado {
  product: Product;
  count: number;
}

export function listMostFavoritedProducts(limit = 20) {
  return apiClient
    .get<ProductoMasGuardado[]>('/products/most-favorited', { params: { limit } })
    .then((res) => res.data);
}

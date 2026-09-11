import { API_BASE_URL, apiClient } from './client';
import type { Paginated, Product, ProductFilters } from '@/types';

export interface ProductInput {
  name: string;
  priceCup?: number | null;
  priceUsd?: number | null;
  description: string;
  unit: string;
  stock?: boolean;
  category: string;
  userEnterpriseId: string;
  image?: File | null;
}

function toFormData(input: ProductInput): FormData {
  const form = new FormData();
  form.append('name', input.name);
  form.append('description', input.description);
  form.append('unit', input.unit);
  form.append('category', input.category);
  form.append('userEnterpriseId', input.userEnterpriseId);
  form.append('stock', String(input.stock ?? true));
  if (input.priceCup !== undefined && input.priceCup !== null) {
    form.append('priceCup', String(input.priceCup));
  }
  if (input.priceUsd !== undefined && input.priceUsd !== null) {
    form.append('priceUsd', String(input.priceUsd));
  }
  if (input.image) {
    form.append('image', input.image);
  }
  return form;
}

export function listProducts(filters: ProductFilters = {}) {
  return apiClient
    .get<Paginated<Product>>('/products', { params: filters })
    .then((res) => res.data);
}

export function getProduct(id: string) {
  return apiClient.get<Product>(`/products/${id}`).then((res) => res.data);
}

export function createProduct(input: ProductInput) {
  return apiClient
    .post<Product>('/products', toFormData(input), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
}

/**
 * Si el servidor admite ya cambiar la foto al editar un producto.
 *
 * Hoy `PATCH /products/:id` solo lee el cuerpo JSON: no tiene `FileInterceptor`,
 * que sí tiene el alta. Mandarle un `multipart` no guardaría la imagen y además
 * echaría a perder el resto de la edición, así que la foto se queda fuera hasta
 * que lo añadan —está pedido en `bugs-para-arreglar.md`—. El día que llegue,
 * basta con poner esto en `true`.
 */
export const EDICION_DE_IMAGEN_LISTA = false;

export function updateProduct(id: string, input: Partial<ProductInput>) {
  // Con foto nueva hay que ir en multipart, como el alta; sin ella, el JSON de
  // siempre, que es más barato de servir.
  if (EDICION_DE_IMAGEN_LISTA && input.image) {
    const form = new FormData();
    for (const [clave, valor] of Object.entries(input)) {
      if (valor === undefined || valor === null) continue;
      form.append(clave, valor instanceof File ? valor : String(valor));
    }
    return apiClient
      .patch<void>(`/products/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => res.data);
  }
  const { image: _descartada, ...resto } = input;
  return apiClient.patch<void>(`/products/${id}`, resto).then((res) => res.data);
}

export function deleteProduct(id: string) {
  return apiClient.delete<void>(`/products/${id}`).then((res) => res.data);
}

// Product.image is stored as "/products/image/<file>" (relative to the API's
// global "api" prefix), so we splice it onto the API origin ourselves.
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function productImageUrl(image: string | null | undefined): string | null {
  if (!image) return null;
  return `${API_ORIGIN}/api${image}`;
}

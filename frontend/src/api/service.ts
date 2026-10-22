import { API_BASE_URL, apiClient } from './client';
import type { Service } from '@/types';

export interface ServiceInput {
  name: string;
  priceCup?: number | null;
  priceUsd?: number | null;
  description: string;
  userEnterpriseId: string;
  /** La foto, ya convertida a WebP. Opcional: un servicio puede no tenerla. */
  image?: File | null;
}

/**
 * Si el servidor guarda ya la foto de un servicio.
 *
 * **Todavía no.** La entidad `Service` del backend no tiene columna de imagen,
 * `POST /services` y `PATCH /services/:id` no llevan `FileInterceptor`, y no
 * existe `GET /services/image/:filename`. Está pedido, con el mismo contrato
 * que ya funciona en producto.
 *
 * Mientras valga `false`, el formulario no enseña el campo de la foto: pedirla
 * para tirarla por el camino sería mentirle a quien publica. En cuanto el
 * servidor lo admita, esto pasa a `true` y lo demás ya está escrito: el envío
 * en multipart, la miniatura en el panel y la foto en la página del negocio.
 */
export const IMAGEN_DE_SERVICIO_LISTA = false;

// El `image` que devuelve el servidor es una ruta sin el prefijo global `api`,
// así que se le pega delante el origen, igual que en producto.
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function serviceImageUrl(image: string | null | undefined): string | null {
  if (!image) return null;
  return `${API_ORIGIN}/api${image}`;
}

/**
 * El cuerpo de la petición: multipart si hay foto, JSON si no.
 *
 * Sin foto se manda JSON a secas, que pesa menos que un multipart con sus
 * separadores; aquí cada byte cuenta.
 */
function cuerpo(input: Partial<ServiceInput>): FormData | Partial<ServiceInput> {
  const { image, ...datos } = input;
  if (!image) return datos;

  const form = new FormData();
  for (const [clave, valor] of Object.entries(datos)) {
    if (valor === undefined) continue;
    /*
     * Un `null` es una orden —«deja este precio en blanco»—, no un campo que
     * sobra. Descartarlo hacía imposible borrar un precio al editar con foto
     * nueva: el campo se quedaba con el valor viejo. Viaja como cadena vacía,
     * que es lo único que admite un multipart.
     */
    form.append(clave, valor === null ? '' : String(valor));
  }
  // El servidor lo espera en `image`, el mismo nombre que la foto de producto.
  form.append('image', image);
  return form;
}

export function listServices() {
  return apiClient.get<Service[]>('/services').then((res) => res.data);
}

export function listServicesByEnterprise(enterpriseId: string) {
  return apiClient.get<Service[]>(`/services/enterprise/${enterpriseId}`).then((res) => res.data);
}

export function getService(id: string) {
  return apiClient.get<Service>(`/services/${id}`).then((res) => res.data);
}

/** Con multipart hay que decirlo; con JSON, dejar que axios ponga lo suyo. */
const comoVa = (body: FormData | unknown) =>
  body instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;

export function createService(input: ServiceInput) {
  const body = cuerpo(input);
  return apiClient.post<Service>('/services', body, comoVa(body)).then((res) => res.data);
}

export function updateService(id: string, input: Partial<ServiceInput>) {
  const body = cuerpo(input);
  return apiClient.patch<void>(`/services/${id}`, body, comoVa(body)).then((res) => res.data);
}

export function deleteService(id: string) {
  return apiClient.delete<void>(`/services/${id}`).then((res) => res.data);
}

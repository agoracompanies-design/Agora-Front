import { API_BASE_URL, apiClient, renovarAcceso, setToken } from './client';
import type { UserEnterprise, Address, Contact } from '@/types';

export interface UserEnterpriseInput {
  companyName: string;
  address: Address;
  contact: Contact;
  code?: number;
  /** El logo del negocio. Solo viaja cuando el servidor sepa recibirlo. */
  logo?: File | null;
}

/**
 * Si el servidor guarda ya el logo de un negocio.
 *
 * Desde el 2026-09-12 sí: `user_enterprises` tiene columna `image`, el `PATCH`
 * admite el archivo en el campo `image` y el logo se sirve público y cacheado
 * en `/user-enterprise/image/<fichero>`. Comprobado contra la API.
 *
 * Con una salvedad, que es la razón de `subirLogoAparte()` más abajo: el alta
 * guarda en esa columna la ruta del disco del servidor
 * (`D:\...\uploads\enterprises\...png`) en vez de la dirección servible, así
 * que un logo puesto al crear la empresa no se vería. El `PATCH` sí guarda la
 * dirección buena, y por ahí va el logo mientras no lo igualen —está pedido en
 * `bugs-para-arreglar.md`—.
 */
export const LOGO_DE_EMPRESA_LISTO = true;

const ORIGEN = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * La dirección del logo, o nada si el negocio no tiene.
 *
 * Solo sirve lo que el servidor guardó como ruta servible (`/user-enterprise/
 * image/...`). Las empresas dadas de alta con logo antes de este arreglo tienen
 * ahí la ruta del disco del servidor, que no es una dirección: para esas se
 * devuelve nada y la ficha enseña el cuadrado con la inicial, que es lo que
 * había antes, en vez de una imagen rota.
 */
export function enterpriseLogoUrl(logo: string | null | undefined): string | null {
  if (!logo || !logo.startsWith('/')) return null;
  return `${ORIGEN}/api${logo}`;
}

/**
 * El multipart lleva el logo y nada más.
 *
 * `address` y `contact` son objetos, y en multipart solo pueden viajar como
 * texto JSON, que el servidor no sabe leer: el `PATCH` responde 400 («address
 * must be an object») y el alta responde 200 pero los guarda vacíos. Medido el
 * 2026-09-16 contra `641de2e`. Así que los datos van siempre en JSON y el logo,
 * si lo hay, en una petición aparte.
 */
function soloLogo(logo: File) {
  const form = new FormData();
  // El servidor lo espera en `image`, el mismo nombre que la foto de producto.
  form.append('image', logo);
  return form;
}

/**
 * Sube el logo con un `PATCH` aparte, después de crear la empresa.
 *
 * El alta guarda en la columna la ruta del disco del servidor en vez de la
 * dirección servible, así que el logo puesto ahí no se vería. El `PATCH` sí la
 * guarda bien, y cuesta una petición más que nadie nota. Cuando el servidor
 * iguale los dos caminos, esto sobra y el logo vuelve a viajar en el alta.
 */
async function subirLogoAparte(empresa: UserEnterprise, logo: File): Promise<UserEnterprise> {
  try {
    return await updateEnterprise(empresa.idUserEnterprise, { logo });
  } catch {
    // Si falla, la empresa ya está creada: se sigue adelante sin logo antes que
    // dejar al usuario con un error después de haberla dado de alta.
    return empresa;
  }
}

export async function createEnterprise(input: UserEnterpriseInput): Promise<UserEnterprise> {
  const { logo, ...sinLogo } = input;
  const respuesta = await apiClient
    .post<UserEnterprise | { enterprise: UserEnterprise; accessToken?: string }>('/user-enterprise', sinLogo)
    .then((res) => res.data);

  // Dar de alta la empresa concede los permisos para publicar, pero quien los
  // lleva es el token: con el que había en la mano, el primer «publicar
  // producto» respondería 403.
  //
  // Desde el 2026-09-11 el servidor devuelve ya el token renovado junto con la
  // empresa, así que basta con guardarlo. Se sigue admitiendo la respuesta
  // antigua —la empresa a secas— por si se trabaja contra una API sin ese
  // cambio: entonces se pide el refresco, como hasta ahora.
  if (respuesta && typeof respuesta === 'object' && 'enterprise' in respuesta) {
    if (respuesta.accessToken) setToken(respuesta.accessToken);
    else await renovarAcceso().catch(() => {});
    return logo ? subirLogoAparte(respuesta.enterprise, logo) : respuesta.enterprise;
  }

  await renovarAcceso().catch(() => {});
  return logo ? subirLogoAparte(respuesta, logo) : respuesta;
}

export function getMyEnterprise() {
  return apiClient.get<UserEnterprise>('/user-enterprise').then((res) => res.data);
}

/**
 * La ficha de un negocio, sin necesidad de sesión.
 *
 * Desde el 2026-09-12 vive en `/user-enterprise/public/:id`: la ruta antigua
 * `/user-enterprise/:id` se retiró y hoy responde 404.
 */
export function getEnterprise(id: string) {
  return apiClient.get<UserEnterprise>(`/user-enterprise/public/${id}`).then((res) => res.data);
}

/**
 * Guarda los cambios de la empresa: primero los datos en JSON y después, si se
 * eligió uno, el logo solo en multipart (ver `soloLogo()`). Devuelve la empresa
 * tal como quedó tras la última petición.
 */
export async function updateEnterprise(id: string, input: Partial<UserEnterpriseInput>): Promise<UserEnterprise> {
  const { logo, ...datos } = input;
  const ruta = `/user-enterprise/${id}`;
  let empresa: UserEnterprise | undefined;
  if (Object.values(datos).some((v) => v !== undefined)) {
    empresa = await apiClient.patch<UserEnterprise>(ruta, datos).then((res) => res.data);
  }
  if (LOGO_DE_EMPRESA_LISTO && logo) {
    try {
      empresa = await apiClient
        .patch<UserEnterprise>(ruta, soloLogo(logo), { headers: { 'Content-Type': 'multipart/form-data' } })
        .then((res) => res.data);
    } catch (error) {
      // Si los datos ya entraron, decirlo: un «no se pudo actualizar» a secas
      // haría creer que no se guardó nada y se repetiría el cambio a ciegas.
      if (empresa) throw new Error('Los datos se guardaron, pero el logo no se pudo subir');
      throw error;
    }
  }
  // Sin datos ni logo no hay nada que mandar: se relee para devolver lo mismo.
  return empresa ?? getMyEnterprise();
}

export function deleteEnterprise(id: string) {
  return apiClient.delete<void>(`/user-enterprise/${id}`).then((res) => res.data);
}

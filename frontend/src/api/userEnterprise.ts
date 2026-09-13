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
 * Prepara el cuerpo: con logo va en multipart, como las fotos de producto; sin
 * él —o mientras el servidor no lo admita— se manda el JSON de siempre, que es
 * más barato y es lo único que hoy entiende la API.
 */
function cuerpo(input: Partial<UserEnterpriseInput>) {
  const { logo, ...resto } = input;
  if (!LOGO_DE_EMPRESA_LISTO || !logo) return { datos: resto, opciones: undefined };

  const form = new FormData();
  // El servidor lo espera en `image`, el mismo nombre que la foto de producto.
  form.append('image', logo);
  for (const [clave, valor] of Object.entries(resto)) {
    if (valor === undefined || valor === null) continue;
    // `address` y `contact` son objetos: viajan como JSON dentro del campo.
    form.append(clave, typeof valor === 'object' ? JSON.stringify(valor) : String(valor));
  }
  return { datos: form, opciones: { headers: { 'Content-Type': 'multipart/form-data' } } };
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
  const { datos, opciones } = cuerpo(sinLogo);
  const respuesta = await apiClient
    .post<UserEnterprise | { enterprise: UserEnterprise; accessToken?: string }>(
      '/user-enterprise',
      datos,
      opciones,
    )
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

export function updateEnterprise(id: string, input: Partial<UserEnterpriseInput>) {
  const { datos, opciones } = cuerpo(input);
  return apiClient.patch<UserEnterprise>(`/user-enterprise/${id}`, datos, opciones).then((res) => res.data);
}

export function deleteEnterprise(id: string) {
  return apiClient.delete<void>(`/user-enterprise/${id}`).then((res) => res.data);
}

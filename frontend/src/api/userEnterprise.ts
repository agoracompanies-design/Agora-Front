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
 * **Desde el 2026-10-06 el alta guarda igual que el `PATCH`.** Antes ponía en
 * esa columna la ruta del disco del servidor en vez de la dirección servible,
 * así que un logo puesto al crear la empresa no se veía y había que subirlo en
 * una segunda petición. Comprobado contra la API: las dos guardan
 * `/user-enterprise/image/<fichero>`.
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
 * El multipart del `PATCH`, que lleva el logo y nada más.
 *
 * En la edición los datos siguen yendo en JSON y el logo aparte. En el **alta**
 * ya no hace falta: desde el commit `9c56b97` del backend el `POST` sabe leer
 * `address` y `contact` como texto JSON dentro del multipart, así que todo viaja
 * junto (ver `createEnterprise`). Queda por igualar el `PATCH`.
 */
function soloLogo(logo: File) {
  const form = new FormData();
  // El servidor lo espera en `image`, el mismo nombre que la foto de producto.
  form.append('image', logo);
  return form;
}

/**
 * RETIRADA el 2026-10-06. Ya no la llama nadie.
 *
 * Subía el logo con un `PATCH` aparte después de crear la empresa, porque el
 * alta guardaba mal la ruta. Desde el commit `9c56b97` del backend las dos
 * guardan igual y el logo viaja en el alta, así que el alta cuesta **una
 * petición en vez de dos** — con la conexión de allá, eso se nota.
 *
 * Se deja marcada y no borrada hasta la revisión previa a producción, que es la
 * regla del proyecto.
 */
export async function subirLogoAparte(empresa: UserEnterprise, logo: File): Promise<UserEnterprise> {
  try {
    return await updateEnterprise(empresa.idUserEnterprise, { logo });
  } catch {
    // Si falla, la empresa ya está creada: se sigue adelante sin logo antes que
    // dejar al usuario con un error después de haberla dado de alta.
    return empresa;
  }
}

/**
 * El cuerpo del alta: multipart si hay logo, JSON si no.
 *
 * Con logo tiene que ser multipart, y ahí los objetos viajan como texto JSON,
 * que es justo lo que el backend aprendió a leer en su commit `9c56b97`. Sin
 * logo se manda JSON a secas: pesa menos que un multipart con sus separadores,
 * y aquí cada byte cuenta.
 */
function cuerpoDelAlta(input: UserEnterpriseInput): FormData | Omit<UserEnterpriseInput, 'logo'> {
  const { logo, ...datos } = input;
  if (!logo) return datos;

  const form = new FormData();
  form.append('companyName', datos.companyName);
  form.append('address', JSON.stringify(datos.address));
  form.append('contact', JSON.stringify(datos.contact));
  if (datos.code !== undefined) form.append('code', String(datos.code));
  // El servidor lo espera en `image`, el mismo nombre que la foto de producto.
  form.append('image', logo);
  return form;
}

/**
 * Da de alta el negocio en **una sola petición**.
 *
 * Hasta el 2026-10-06 eran dos —los datos en JSON y el logo en un `PATCH`
 * después—, porque el backend no sabía leer `address` ni `contact` en multipart
 * y el alta guardaba mal la ruta del logo. Las dos cosas están resueltas, y se
 * comprobó contra la API: el alta con logo guarda la dirección servible y los
 * dos objetos llegan enteros.
 */
export async function createEnterprise(input: UserEnterpriseInput): Promise<UserEnterprise> {
  const respuesta = await apiClient
    .post<UserEnterprise | { enterprise: UserEnterprise; accessToken?: string }>(
      '/user-enterprise',
      cuerpoDelAlta(input),
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
    return respuesta.enterprise;
  }

  await renovarAcceso().catch(() => {});
  return respuesta;
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

import { API_BASE_URL, apiClient, renovarAcceso } from './client';
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
 * Hoy no: `user_enterprises` no tiene columna de imagen, ni sus DTO aceptan
 * ningún archivo. El formulario lo pide igualmente y la ficha reserva su sitio,
 * porque el trabajo de pantalla está hecho; lo que no se hace es mandarlo y
 * dejar creer que se guardó. Está pedido en `bugs-para-arreglar.md`: cuando
 * llegue, esto pasa a `true`.
 */
export const LOGO_DE_EMPRESA_LISTO = false;

const ORIGEN = API_BASE_URL.replace(/\/api\/?$/, '');

/** La dirección del logo, o nada si el negocio no tiene. */
export function enterpriseLogoUrl(logo: string | null | undefined): string | null {
  if (!logo) return null;
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
  form.append('logo', logo);
  for (const [clave, valor] of Object.entries(resto)) {
    if (valor === undefined || valor === null) continue;
    // `address` y `contact` son objetos: viajan como JSON dentro del campo.
    form.append(clave, typeof valor === 'object' ? JSON.stringify(valor) : String(valor));
  }
  return { datos: form, opciones: { headers: { 'Content-Type': 'multipart/form-data' } } };
}

export async function createEnterprise(input: UserEnterpriseInput) {
  const { datos, opciones } = cuerpo(input);
  const empresa = await apiClient
    .post<UserEnterprise>('/user-enterprise', datos, opciones)
    .then((res) => res.data);

  // Dar de alta la empresa es lo que concede los permisos para publicar, pero
  // el servidor los guarda en el usuario y quien los lleva es el token: sin
  // renovarlo, el primer «publicar producto» respondería 403 y el negocio
  // recién creado se quedaría mirando su panel vacío. Si el refresco falla no
  // se pierde la empresa, que ya está creada; se arreglará al volver a entrar.
  await renovarAcceso().catch(() => {});

  return empresa;
}

export function getMyEnterprise() {
  return apiClient.get<UserEnterprise>('/user-enterprise').then((res) => res.data);
}

export function getEnterprise(id: string) {
  return apiClient.get<UserEnterprise>(`/user-enterprise/${id}`).then((res) => res.data);
}

export function updateEnterprise(id: string, input: Partial<UserEnterpriseInput>) {
  const { datos, opciones } = cuerpo(input);
  return apiClient.patch<UserEnterprise>(`/user-enterprise/${id}`, datos, opciones).then((res) => res.data);
}

export function deleteEnterprise(id: string) {
  return apiClient.delete<void>(`/user-enterprise/${id}`).then((res) => res.data);
}

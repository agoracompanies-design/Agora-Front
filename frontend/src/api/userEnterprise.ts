import { apiClient, renovarAcceso } from './client';
import type { UserEnterprise, Address, Contact } from '@/types';

export interface UserEnterpriseInput {
  companyName: string;
  address: Address;
  contact: Contact;
  code?: number;
}

export async function createEnterprise(input: UserEnterpriseInput) {
  const empresa = await apiClient
    .post<UserEnterprise>('/user-enterprise', input)
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
  return apiClient.patch<UserEnterprise>(`/user-enterprise/${id}`, input).then((res) => res.data);
}

export function deleteEnterprise(id: string) {
  return apiClient.delete<void>(`/user-enterprise/${id}`).then((res) => res.data);
}

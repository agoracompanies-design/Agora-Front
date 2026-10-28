import { apiClient } from './client';

/**
 * Empresas afiliadas: los otros negocios del mismo dueño.
 *
 * Quien paga un plan VIP puede meter hasta cinco negocios suyos sin pagar por
 * cada uno, y llevarlos por separado. Cada plaza se da con un **código de un
 * solo uso**: se genera aquí, se entrega, y quien lo usa al registrar su
 * empresa entra con el plan de la madre y su misma fecha de caducidad.
 */

/** Una empresa que ya ocupa plaza. */
export interface Afiliada {
  idUserEnterprise: string;
  companyName: string;
  createdAt: string;
}

/** Un código repartido que todavía no ha gastado nadie. */
export interface CodigoLibre {
  id: string;
  code: string;
  createdAt: string;
}

export interface ResumenAfiliadas {
  /** Si esta empresa puede dar plazas ahora mismo. */
  esVip: boolean;
  plazas: number;
  /** Afiliadas **más** códigos sin gastar: un código repartido ya tiene dueño. */
  ocupadas: number;
  disponibles: number;
  afiliadas: Afiliada[];
  codigosLibres: CodigoLibre[];
}

export function verAfiliadas() {
  return apiClient
    .get<ResumenAfiliadas>('/user-enterprise/affiliates')
    .then((r) => r.data);
}

export function pedirCodigo() {
  return apiClient
    .post<CodigoLibre>('/user-enterprise/affiliates/code')
    .then((r) => r.data);
}

/**
 * Suelta una afiliada: deja de contar como plaza y pierde el acceso que venía
 * de este plan. Su cuenta y su catálogo no se tocan.
 */
export function soltarAfiliada(idUserEnterprise: string) {
  return apiClient
    .delete<void>(`/user-enterprise/affiliates/${idUserEnterprise}`)
    .then((r) => r.data);
}

/**
 * La dirección que lleva el QR.
 *
 * Abre el registro de empresa con el código ya puesto, para que quien lo
 * escanea no tenga que teclearlo. El código suelto se comparte por mensaje;
 * esto es para cuando se está delante de la persona.
 */
export function enlaceDeAfiliacion(code: string): string {
  const base = (import.meta.env.VITE_WEB_URL as string | undefined)?.replace(
    /\/+$/,
    '',
  );
  return `${base ?? window.location.origin}/vender?afiliada=${encodeURIComponent(code)}`;
}

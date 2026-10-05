/**
 * Bandeja de avisos del usuario.
 *
 * Se conserva lo decidido para la web anterior (`_negocio/notificaciones.md`):
 * la bandeja es **de solo lectura** y solo para lo importante —vencimientos,
 * conducta, demanda—; la conversación ocurre por WhatsApp, no aquí dentro. Las
 * promociones no entran: viven en el carrusel.
 *
 * **La bandeja viene del servidor** desde el 2026-10-06: el backend tiene módulo
 * de notificaciones desde su commit `9c56b97`. Antes vivía en el navegador, así
 * que se perdía al cambiar de equipo.
 *
 * Queda **una excepción**: el aviso de «pediste una categoría». Ese lo escribe
 * la propia aplicación, y el backend no tiene todavía ni ese tipo de aviso ni
 * forma de crear uno (pedido como SOL-10 y SOL-14). Hasta que exista, ese y
 * solo ese sigue guardándose aquí, con el id marcado para distinguirlo.
 */

import { WHATSAPP_VENTAS, enlaceWhatsapp } from './contacto';

export type TipoAviso =
  /** Vencimientos de la suscripción, altas y bajas de plan. */
  | 'cuenta'
  /** Avisos de conducta. */
  | 'conducta'
  /** Qué busca la gente y nadie publica. */
  | 'demanda'
  /** Estado de una categoría que el negocio pidió crear. */
  | 'categoria';

export interface Aviso {
  readonly id: string;
  readonly tipo: TipoAviso;
  readonly titulo: string;
  readonly cuerpo: string;
  readonly enviadoEn: string;
  readonly leido: boolean;
  /** WhatsApp con el mensaje ya escrito, para los avisos que piden respuesta. */
  readonly enlace?: string;
  /** Qué hace ese enlace, en dos palabras. */
  readonly enlaceTexto?: string;
}

/** Lo que manda el servidor, traducido al vocabulario de la aplicación. */
const TIPOS: Record<string, TipoAviso> = {
  account: 'cuenta',
  conduct: 'conducta',
  demand: 'demanda',
};

/** Un aviso del servidor. Lo que no se reconozca se trata como de cuenta. */
export function desdeApi(a: {
  id: string;
  kind: string;
  title: string;
  body: string;
  sentAt: string;
  read: boolean;
  whatsappMessage?: string | null;
}): Aviso {
  // El servidor manda el **mensaje**, no la dirección. `enlace` es un `href`,
  // así que hay que armar el `wa.me`: meter ahí el texto pelado pintaría un
  // enlace que no lleva a ninguna parte, y `enlaceSeguro` lo dejaría pasar por
  // resolverlo como ruta relativa.
  const haciaVentas = a.whatsappMessage
    ? enlaceWhatsapp(WHATSAPP_VENTAS, a.whatsappMessage)
    : null;

  return {
    id: a.id,
    // Ante la duda, el tipo que NO se puede silenciar: más vale que llegue.
    tipo: TIPOS[a.kind] ?? 'cuenta',
    titulo: a.title,
    cuerpo: a.body,
    enviadoEn: a.sentAt,
    leido: a.read,
    ...(haciaVentas ? { enlace: haciaVentas, enlaceTexto: 'Responder por WhatsApp' } : {}),
  };
}

/**
 * El prefijo de los avisos que escribe la aplicación y el servidor no conoce.
 *
 * Sirve para saber a dónde va el «marcar leído»: los del servidor por su
 * endpoint, estos al navegador. Cuando el backend genere el de categoría, esto
 * y el almacén local se van juntos.
 */
const PREFIJO_LOCAL = 'local-';
export const esAvisoLocal = (id: string) => id.startsWith(PREFIJO_LOCAL);

const CLAVE = 'agora_avisos';

function clavePara(userId: string) {
  return `${CLAVE}:${userId}`;
}

export function leerBandeja(userId: string): Aviso[] {
  try {
    const bruto = localStorage.getItem(clavePara(userId));
    if (!bruto) return [];
    const datos: unknown = JSON.parse(bruto);
    return Array.isArray(datos) ? (datos as Aviso[]) : [];
  } catch {
    return [];
  }
}

function guardarBandeja(userId: string, avisos: Aviso[]) {
  try {
    localStorage.setItem(clavePara(userId), JSON.stringify(avisos));
  } catch {
    // Sin almacenamiento la bandeja vive solo en memoria: no es motivo para romper.
  }
}

/** Lo urgente es lo último que ha pasado: del más reciente al más antiguo. */
export function ordenarPorFecha(avisos: readonly Aviso[]): Aviso[] {
  return [...avisos].sort((a, b) => b.enviadoEn.localeCompare(a.enviadoEn));
}

export function contarSinLeer(avisos: readonly Aviso[]): number {
  return avisos.filter((a) => !a.leido).length;
}

export function anadirAviso(userId: string, aviso: Omit<Aviso, 'id' | 'enviadoEn' | 'leido'>): Aviso[] {
  const nuevo: Aviso = {
    ...aviso,
    id: `${PREFIJO_LOCAL}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    enviadoEn: new Date().toISOString(),
    leido: false,
  };
  const avisos = [nuevo, ...leerBandeja(userId)];
  guardarBandeja(userId, avisos);
  return ordenarPorFecha(avisos);
}

export function marcarLeido(userId: string, avisoId: string): Aviso[] {
  const avisos = leerBandeja(userId).map((a) => (a.id === avisoId ? { ...a, leido: true } : a));
  guardarBandeja(userId, avisos);
  return ordenarPorFecha(avisos);
}

export function marcarTodoLeido(userId: string): Aviso[] {
  const avisos = leerBandeja(userId).map((a) => (a.leido ? a : { ...a, leido: true }));
  guardarBandeja(userId, avisos);
  return ordenarPorFecha(avisos);
}

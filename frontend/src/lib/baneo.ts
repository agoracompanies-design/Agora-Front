import { ApiError } from '@/api/client';

/**
 * Lo que el servidor cuenta cuando una cuenta está bloqueada.
 *
 * Llega en el 403 de `POST /auth/login`, como objeto:
 *
 * ```json
 * { "code": "USER_BANNED", "message": "Tu cuenta está suspendida",
 *   "reason": "…", "bannedAt": "2026-09-19T14:16:08.956Z",
 *   "groupName": null, "groupPhone": null }
 * ```
 *
 * `groupPhone` es el del grupo de trabajo que atendió al cliente, que es a
 * quien tiene que escribir para negociar. Puede venir vacío mientras nadie le
 * haya asignado un grupo; entonces se usa el número general de moderación.
 */
export interface InfoBaneo {
  motivo: string | null;
  desde: string | null;
  grupo: string | null;
  telefono: string | null;
}

/**
 * Si este error es un baneo, lo traduce; si no, devuelve `null`.
 *
 * Se mira el `code`, no el texto: los mensajes cambian y el código no.
 */
export function baneoDeError(error: unknown): InfoBaneo | null {
  if (!(error instanceof ApiError) || error.status !== 403) return null;
  const d = error.datos;
  if (!d || d.code !== 'USER_BANNED') return null;

  const texto = (valor: unknown) => (typeof valor === 'string' && valor.trim() ? valor : null);
  return {
    motivo: texto(d.reason),
    desde: texto(d.bannedAt),
    grupo: texto(d.groupName),
    telefono: texto(d.groupPhone),
  };
}

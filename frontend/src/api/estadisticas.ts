import { apiClient } from './client';

/**
 * Los dos números públicos: cuántos negocios y cuántos clientes hay.
 *
 * Se piden para enseñarlos en la portada como señal de que el sitio está vivo:
 * quien entra por primera vez no sabe si hay cien negocios o tres.
 *
 * **Solo dos enteros.** Nada que identifique a nadie, que es lo que permite que
 * la ruta sea pública.
 */

export interface EstadisticasPublicas {
  negocios: number;
  clientes: number;
}

/**
 * Lo que diga el servidor, o `null`.
 *
 * `null` cuando la ruta todavía no existe —está pedida en el punto 6.3— o
 * cuando el servidor no responde. Devolverlo así, y no un cero ni un número
 * inventado, es a propósito: quien lo use no pinta nada, y nunca se enseña una
 * cifra que no venga de la base.
 */
export function estadisticasPublicas(): Promise<EstadisticasPublicas | null> {
  return apiClient
    .get<EstadisticasPublicas>('/public/stats')
    .then((r) => {
      const { negocios, clientes } = r.data ?? {};
      // Un servidor antiguo puede responder 200 con otra cosa. Si no son dos
      // números, no hay nada que enseñar.
      return Number.isFinite(negocios) && Number.isFinite(clientes)
        ? { negocios, clientes }
        : null;
    })
    .catch(() => null);
}

import { apiClient } from './client';

/**
 * Los planes, de la base y no del código.
 *
 * Hasta el 2026-10-26 los precios vivían escritos a mano en `lib/plans.ts`, así
 * que cambiar uno era tocar dos repositorios y volver a publicar. Ya existe la
 * tabla y el panel los administra; esto es el otro extremo.
 *
 * `GET /plans` es **pública y devuelve solo los activos**, que es justo lo que
 * la web necesita enseñar.
 */

export type Publico = 'buyer' | 'seller';

export interface Plan {
  idPlan: string;
  audience: Publico;
  /**
   * `monthly`, `quarterly`, `yearly`… Es texto libre a propósito: el día que se
   * quiera un cuarto ciclo no hay que tocar ningún enum.
   */
  cycle: string;
  name: string;
  cost: number;
  currency: string;
  durationDays: number;
  features: string[];
  active: boolean;
  orden: number;
}

export function listarPlanes() {
  return apiClient.get<Plan[]>('/plans').then((r) => r.data);
}

/** Cómo se lee cada ciclo. Lo que no se conozca se enseña tal cual. */
const CICLOS: Record<string, string> = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

export function nombreDeCiclo(cycle: string): string {
  return CICLOS[cycle] ?? cycle;
}

/** Lo que cuesta al mes, que es lo único que deja comparar ciclos distintos. */
export function porMes(plan: Plan): number {
  return plan.durationDays > 0 ? plan.cost / (plan.durationDays / 30) : plan.cost;
}

/**
 * Lo que se ahorra frente a pagar el mensual, en tanto por ciento.
 *
 * Devuelve `null` cuando no hay mensual con el que comparar o cuando no se
 * ahorra nada: una etiqueta de «ahorra 0 %» es peor que ninguna.
 */
export function ahorroFrenteAlMensual(plan: Plan, todos: Plan[]): number | null {
  // Contra el mensual **de su mismo grupo**. Sin mirar el asterisco, el mensual
  // de proveedor (2 200) se comparaba con el VIP (3 300) —el primero que
  // devolvía la lista— y la tarjeta mensual salía con un «Ahorra 33%» que no
  // significa nada: el mensual es la referencia, no ahorra frente a sí mismo.
  const esVip = (p: Plan) => p.name.trim().endsWith('*');
  const mensual = todos.find(
    (p) => p.audience === plan.audience && p.cycle === 'monthly' && esVip(p) === esVip(plan),
  );
  if (!mensual || mensual.idPlan === plan.idPlan) return null;
  const ahorro = 1 - porMes(plan) / porMes(mensual);
  return ahorro > 0.005 ? Math.round(ahorro * 100) : null;
}

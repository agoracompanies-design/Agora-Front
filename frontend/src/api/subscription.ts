import { apiClient } from './client';

export interface Subscription {
  idSubscription: string;
  userId: string;
  /**
   * A qué empresa pertenece la suscripción. En el diagrama acordado
   * `Subscription` se conecta con `User` y con `UserEnterprise`, y es esa
   * conexión la que dice de qué tipo es el plan. Ya llega rellena en las
   * suscripciones nuevas. Ver `daAccesoDeNegocio`.
   */
  userEnterpriseId?: string | null;
  /**
   * El mismo dato dicho de otra forma: `seller` si el usuario tenía empresa al
   * contratar, `buyer` si no. Las suscripciones anteriores a que existiera la
   * columna quedaron todas en `buyer`, incluidas las de vendedor, así que sola
   * no basta para negar el acceso: se usa para concederlo, nunca para quitarlo.
   */
  planType?: string | null;
  name: string;
  cost: number;
  description: string | null;
  status: boolean;
  quantityAccounts: number;
  durationDays: number;
  createdAt: string;
  expiresAt: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  userEnterprise?: {
    idUserEnterprise: string;
    companyName: string;
  } | null;
}

export type PlanType = 'buyer' | 'seller';

/**
 * Quien lleva el estado es el backend: al pedir la suscripción activa la
 * verifica y, si ya venció, la guarda con `status: false`. Lo que no hace es
 * responder 404 en ese caso —devuelve la suscripción caducada—, así que aquí
 * se lee el campo en vez de dar por buena cualquier respuesta.
 */
export function estaVigente(s: Subscription | null | undefined): boolean {
  return Boolean(s?.status);
}

/**
 * Si una copia guardada sigue valiendo, sin preguntarle a nadie.
 *
 * `estaVigente` se fía de `status`, que es lo que acaba de decir el servidor.
 * Para una copia local eso no basta: nadie la va a apagar cuando caduque, así
 * que hay que mirar la fecha. Sin `expiresAt` —la prueba gratuita de antes era
 * así— se da por buena mientras el servidor no diga otra cosa.
 */
export function vigentePorFecha(s: Subscription | null | undefined): boolean {
  if (!estaVigente(s)) return false;
  if (!s?.expiresAt) return true;
  const hasta = new Date(s.expiresAt).getTime();
  return Number.isFinite(hasta) && hasta > Date.now();
}

export function getMyActiveSubscription() {
  return apiClient.get<Subscription>('/subscription').then((res) => res.data);
}

export function getMySubscriptionHistory() {
  return apiClient.get<Subscription[]>('/subscription/history').then((res) => res.data);
}

export function cancelSubscription(id: string) {
  return apiClient.delete<void>(`/subscription/${id}`).then((res) => res.data);
}

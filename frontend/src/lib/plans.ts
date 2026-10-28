import { WHATSAPP_VENTAS } from './contacto';
import { formatPlanPrice } from './utils';

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface PlanTier {
  cycle: BillingCycle;
  label: string;
  cost: number;
  /**
   * En qué moneda está el coste. Viaja con el precio y no se da por supuesta:
   * la decide la base, y el día que haya un plan en otra el rótulo cambia solo.
   */
  currency: string;
  durationDays: number;
  savingsLabel: string | null;
}

export interface PlanConfig {
  name: string;
  tiers: PlanTier[];
  features: string[];
}

export const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

/*
 * Los precios de aquí son **el respaldo**: lo que se enseña si la API no
 * responde. Los de verdad salen de la tabla `plans` —ver `usePlanes`—, así que
 * estos solo tienen que estar al día, no ser la fuente.
 *
 * Puestos en CUP el 2026-10-28, copiados de la base: antes decían 3 y 10 USD,
 * cifras de cuando el precio vivía en el código. Un respaldo con el precio
 * equivocado es peor que ninguno, porque nadie sospecha de él.
 */
export const BUYER_PLAN: PlanConfig = {
  name: 'Plan Comprador',
  tiers: [
    { cycle: 'monthly', label: 'Mensual', cost: 150, currency: 'CUP', durationDays: 30, savingsLabel: null },
    { cycle: 'quarterly', label: 'Trimestral', cost: 405, currency: 'CUP', durationDays: 90, savingsLabel: 'Ahorra 10%' },
    { cycle: 'yearly', label: 'Anual', cost: 1530, currency: 'CUP', durationDays: 365, savingsLabel: 'Ahorra 16%' },
  ],
  features: [
    'Búsqueda y filtros ilimitados',
    'Ubicación y reseñas de proveedores',
    'Contacto directo con mypimes y mercados',
  ],
};

export const SELLER_PLAN: PlanConfig = {
  name: 'Plan Proveedor',
  tiers: [
    { cycle: 'monthly', label: 'Mensual', cost: 2200, currency: 'CUP', durationDays: 30, savingsLabel: null },
    { cycle: 'quarterly', label: 'Trimestral', cost: 5940, currency: 'CUP', durationDays: 90, savingsLabel: 'Ahorra 10%' },
    { cycle: 'yearly', label: 'Anual', cost: 22440, currency: 'CUP', durationDays: 365, savingsLabel: 'Ahorra 16%' },
  ],
  features: [
    'Productos, servicios y precios',
    'Ubica a los clientes cerca de ti',
    'Conoce la calidad de tus productos',
    'Publica tu catálogo',
  ],
};

/**
 * La prueba se concede sola al crear la cuenta y vale para todo, panel de
 * negocio incluido: la idea es que un vendedor pueda publicar su catálogo antes
 * de pagar nada. Se guarda como una suscripción más, con coste cero.
 *
 * Desde el commit `641de2e` la crea el servidor al registrar la cuenta, con este
 * mismo nombre —así se sigue reconociendo—. Dura 7 días (decidido el
 * 2026-09-16); ese commit aún da 30 y está pedido corregirlo en el backend.
 */
export const TRIAL_PLAN: PlanConfig = {
  name: 'Prueba gratuita',
  tiers: [
    { cycle: 'monthly', label: 'Prueba', cost: 0, currency: 'CUP', durationDays: 7, savingsLabel: null },
  ],
  features: ['Acceso completo durante 7 días', 'Incluye el panel de negocio'],
};

/**
 * Si una suscripción es de un plan dado. Se compara por prefijo porque al
 * contratarla se le pega el ciclo al nombre: «Plan Vendedor Trimestral».
 */
export function esPlanDe(plan: PlanConfig, nombreSuscripcion: string | undefined | null): boolean {
  return Boolean(nombreSuscripcion?.startsWith(plan.name));
}

/**
 * El plan que el backend da solo al crear la empresa: 30 días y coste cero. No
 * viene enlazado con la empresa ni se llama como los planes de aquí, así que si
 * no se reconociera por el nombre el negocio recién creado entraría en la
 * aplicación sin poder abrir su propio panel.
 */
const PLAN_AL_CREAR_EMPRESA = 'Plan Inicial';

/**
 * Qué clase de plan es, para que el servidor lo archive bien. La prueba cuenta
 * como de vendedor porque abre el panel igual que el de pago.
 */
export function tipoDePlan(plan: PlanConfig): 'buyer' | 'seller' {
  return plan === BUYER_PLAN ? 'buyer' : 'seller';
}

/**
 * Si la suscripción abre la parte de administrar un negocio.
 *
 * El tipo de plan lo da la conexión: en el modelo acordado una `Subscription`
 * cuelga de un `User` o de un `UserEnterprise`, y la que cuelga de la empresa
 * es la de negocio. El backend ya la rellena, junto con un `planType` que dice
 * lo mismo con otras palabras, y cualquiera de las dos basta.
 *
 * Se sigue mirando el nombre porque las suscripciones anteriores a esas dos
 * columnas se quedaron sin ellas —la migración las dio todas por `buyer`,
 * incluidas las de vendedor—, así que un negocio de los de antes solo se
 * reconoce por cómo se llama su plan. Cada señal suma; ninguna quita.
 */
export function daAccesoDeNegocio(suscripcion: PlanReconocible): boolean {
  if (typeof suscripcion === 'object' && suscripcion) {
    if (suscripcion.userEnterpriseId) return true;
    if (suscripcion.planType === 'seller') return true;
  }
  const nombre = typeof suscripcion === 'string' ? suscripcion : suscripcion?.name;
  return (
    esPlanDe(SELLER_PLAN, nombre) ||
    esPlanDe(TRIAL_PLAN, nombre) ||
    Boolean(nombre?.startsWith(PLAN_AL_CREAR_EMPRESA))
  );
}

/** Lo mínimo que hace falta para reconocer un plan: la suscripción o su nombre. */
type PlanReconocible =
  | { name?: string; userEnterpriseId?: string | null; planType?: string | null }
  | string
  | undefined
  | null;

export function getTier(plan: PlanConfig, cycle: BillingCycle): PlanTier {
  return plan.tiers.find((t) => t.cycle === cycle) ?? plan.tiers[0];
}

/**
 * El enlace de WhatsApp para pedir un plan, con el mensaje ya escrito.
 *
 * Desde el commit `641de2e` del backend un cliente ya no puede activarse un plan:
 * `POST /subscription` es solo del panel administrativo. El cobro va por
 * WhatsApp y, confirmado el pago, el administrador lo activa desde el panel.
 */
export function enlaceParaSolicitar(plan: PlanConfig, tier: PlanTier, usuario?: string): string {
  const mensaje =
    `Hola, quiero activar el ${plan.name} de Ágora (${tier.label}, ${formatPlanPrice(tier.cost, tier.currency)} por ${tier.durationDays} días).` +
    (usuario ? ` Mi usuario es ${usuario}.` : '');
  return `https://wa.me/${WHATSAPP_VENTAS}?text=${encodeURIComponent(mensaje)}`;
}

export function monthlyEquivalent(tier: PlanTier): number {
  return tier.cost / (tier.durationDays / 30);
}

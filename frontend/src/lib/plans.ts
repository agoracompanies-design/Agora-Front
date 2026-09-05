export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface PlanTier {
  cycle: BillingCycle;
  label: string;
  cost: number;
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

export const BUYER_PLAN: PlanConfig = {
  name: 'Plan Comprador',
  tiers: [
    { cycle: 'monthly', label: 'Mensual', cost: 3, durationDays: 30, savingsLabel: null },
    { cycle: 'quarterly', label: 'Trimestral', cost: 8, durationDays: 90, savingsLabel: 'Ahorra 11%' },
    { cycle: 'yearly', label: 'Anual', cost: 28, durationDays: 365, savingsLabel: 'Ahorra 22%' },
  ],
  features: [
    'Búsqueda y filtros ilimitados',
    'Ubicación y reseñas de vendedores',
    'Contacto directo con mypimes y mercados',
    'Favoritos y alertas de tus búsquedas',
  ],
};

export const SELLER_PLAN: PlanConfig = {
  name: 'Plan Vendedor',
  tiers: [
    { cycle: 'monthly', label: 'Mensual', cost: 10, durationDays: 30, savingsLabel: null },
    { cycle: 'quarterly', label: 'Trimestral', cost: 27, durationDays: 90, savingsLabel: 'Ahorra 10%' },
    { cycle: 'yearly', label: 'Anual', cost: 96, durationDays: 365, savingsLabel: 'Ahorra 20%' },
  ],
  features: [
    'Productos y servicios ilimitados',
    'Apareces en búsquedas por ubicación',
    'Recibe calificaciones de tus clientes',
    'Panel para gestionar tu catálogo',
  ],
};

/**
 * La prueba se concede sola al crear la cuenta y vale para todo, panel de
 * negocio incluido: la idea es que un vendedor pueda publicar su catálogo antes
 * de pagar nada. Se guarda como una suscripción más, con coste cero.
 */
export const TRIAL_PLAN: PlanConfig = {
  name: 'Prueba gratuita',
  tiers: [{ cycle: 'monthly', label: 'Prueba', cost: 0, durationDays: 7, savingsLabel: null }],
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

export function monthlyEquivalent(tier: PlanTier): number {
  return tier.cost / (tier.durationDays / 30);
}

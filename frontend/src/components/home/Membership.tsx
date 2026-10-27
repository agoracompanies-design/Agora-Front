import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown, ShoppingBag, Store } from 'lucide-react';
import { CYCLE_LABELS, esPlanDe, getTier } from '@/lib/plans';
import type { BillingCycle } from '@/lib/plans';
import { familiasDePlanes, usePlanes, type Familia } from '@/hooks/usePlanes';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const CYCLES: BillingCycle[] = ['monthly', 'quarterly', 'yearly'];

const ICONOS: Record<string, typeof ShoppingBag> = {
  buyer: ShoppingBag,
  seller: Store,
  'seller-vip': Crown,
};

/**
 * Las membresías, **con los precios que hay en el backend**.
 *
 * Hasta el 2026-10-26 esto eran dos tarjetas escritas a mano con los precios
 * dentro del código. Ahora se pinta una por cada familia que devuelve
 * `GET /plans`, así que un plan nuevo aparece solo y uno retirado desaparece,
 * sin tocar este fichero.
 */
export function Membership() {
  const { isAuthenticated, isSeller, subscription } = useAuth();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const { planes } = usePlanes();

  const familias = familiasDePlanes(planes);
  const planActual = isAuthenticated ? subscription?.name : undefined;

  return (
    <section id="plans" className="plans mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <div id="plans__intro" className="plans__intro mb-8 max-w-lg">
        <span id="plans__eyebrow" className="plans__eyebrow text-xs font-semibold uppercase tracking-wider text-ink-500">Membresías</span>
        <h2 id="plans__title" className="plans__title mt-2 text-2xl sm:text-3xl font-semibold text-ink-900">
          Elige cómo usar <span className="font-bold">Ágora</span>
        </h2>
      </div>

      <div id="plans__toggle" className="plans__toggle mb-8 inline-flex gap-1.5 rounded-xl bg-ink-100 p-1">
        {CYCLES.map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              cycle === c ? 'bg-ink-50 text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-800',
            )}
          >
            {CYCLE_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Tres caben en una fila de escritorio; en tableta van de dos en dos y
          en móvil, una debajo de otra. */}
      <div id="plans__grid" className="plans__grid grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {familias.map((familia) => (
          <TarjetaDePlan
            key={familia.clave}
            familia={familia}
            cycle={cycle}
            esElSuyo={esPlanDe(familia.config, planActual)}
            isAuthenticated={isAuthenticated}
            isSeller={isSeller}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Una familia de planes, con el precio del ciclo elegido.
 *
 * La destacada lleva el azul sólido y el borde grueso: de las tres, la que
 * importa es la de proveedor. Las otras dos quedan en el tono neutro para que
 * no compitan entre ellas.
 */
function TarjetaDePlan({
  familia,
  cycle,
  esElSuyo,
  isAuthenticated,
  isSeller,
}: {
  familia: Familia;
  cycle: BillingCycle;
  esElSuyo: boolean;
  isAuthenticated: boolean;
  isSeller: boolean;
}) {
  const tier = getTier(familia.config, cycle);
  const Icono = ICONOS[familia.clave] ?? Store;
  const paraNegocio = familia.audience === 'seller';

  // Un ciclo que esta familia no tiene no se inventa.
  if (!tier) return null;

  return (
    <div
      id={`plans__${familia.clave}`}
      className={cn(
        'plans__card relative rounded-2xl p-7',
        familia.destacada
          ? 'border-2 border-primary bg-primary-light/40'
          : 'border border-ink-200/80 bg-ink-50',
      )}
    >
      {(esElSuyo || familia.destacada) && (
        <span
          className={cn(
            'plans__badge absolute -top-3 right-6 rounded-full px-3 py-1 text-xs font-semibold',
            familia.destacada ? 'bg-primary text-white' : 'bg-ink-900 text-ink-50',
          )}
        >
          {esElSuyo ? 'Tu plan actual' : 'Para negocios'}
        </span>
      )}

      <div
        className={cn(
          'plans__icon mb-4 flex h-11 w-11 items-center justify-center rounded-xl',
          familia.destacada ? 'bg-primary text-white' : 'bg-ink-100 text-ink-600',
        )}
      >
        <Icono size={19} aria-hidden="true" />
      </div>

      <h3 className="plans__card-title text-lg font-semibold text-ink-900">{familia.titulo}</h3>
      <p className="plans__card-subtitle mt-1 text-sm text-ink-500">{familia.descripcion}</p>

      <div className="plans__price mt-5 flex items-baseline gap-2">
        <span className="plans__cost text-3xl font-semibold text-ink-900">{tier.cost}</span>
        <span className="plans__period text-sm text-ink-500">/ {tier.durationDays} días</span>
        {/* Un ahorro ES una promoción: aquí el fucsia sí está en su sitio, en
            la variante oscura, que es la que pasa contraste con blanco. */}
        {tier.savingsLabel && (
          <span className="plans__savings ml-auto rounded-full bg-secondary-dark px-2.5 py-1 text-xs font-semibold text-white">
            {tier.savingsLabel}
          </span>
        )}
      </div>

      <ul className="plans__features mt-6 space-y-2.5 text-sm text-ink-600">
        {familia.config.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <Check size={14} className="text-ink-400" aria-hidden="true" /> {feature}
          </li>
        ))}
      </ul>

      {esElSuyo ? (
        <span className="plans__cta mt-7 inline-flex w-full items-center justify-center rounded-xl border border-ink-200 py-2.5 text-sm font-medium text-ink-500">
          Ya tienes esta membresía
        </span>
      ) : (
        <Link
          to={destinoDe(paraNegocio, isAuthenticated, isSeller)}
          className={cn(
            'plans__cta mt-7 inline-flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition-colors',
            familia.destacada
              ? 'bg-primary text-white hover:bg-primary-dark'
              : 'border border-ink-300 text-ink-900 hover:border-ink-400 hover:bg-ink-100',
          )}
        >
          {textoDe(paraNegocio, isAuthenticated, isSeller)}
        </Link>
      )}
    </div>
  );
}

/** A dónde lleva el botón según quién mire y qué plan sea. */
function destinoDe(paraNegocio: boolean, isAuthenticated: boolean, isSeller: boolean): string {
  if (paraNegocio) return isSeller ? '/panel' : '/vender';
  return isAuthenticated ? '/planes' : '/registrarse';
}

function textoDe(paraNegocio: boolean, isAuthenticated: boolean, isSeller: boolean): string {
  if (paraNegocio) return isSeller ? 'Ir a mi negocio' : 'Empezar a vender';
  return isAuthenticated ? 'Elegir membresía' : 'Crear cuenta de comprador';
}

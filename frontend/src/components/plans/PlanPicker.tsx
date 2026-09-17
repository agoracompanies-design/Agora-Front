import { useState } from 'react';
import { Check, MessageCircle } from 'lucide-react';
import type { BillingCycle, PlanConfig, PlanTier } from '@/lib/plans';
import { CYCLE_LABELS, getTier } from '@/lib/plans';
import { cn } from '@/lib/utils';

const CYCLES: BillingCycle[] = ['monthly', 'quarterly', 'yearly'];

interface PlanPickerProps {
  plan: PlanConfig;
  /**
   * A dónde lleva el botón con el ciclo elegido. Es un enlace y no una acción:
   * el plan no se activa aquí, se pide por WhatsApp y lo activa el panel.
   */
  enlace: (tier: PlanTier) => string;
  ctaLabel?: string;
}

export function PlanPicker({ plan, enlace, ctaLabel = 'Solicitar por WhatsApp' }: PlanPickerProps) {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const tier = getTier(plan, cycle);

  return (
    <div>
      <div id="plan__cycles" className="plan__cycles mb-6 grid grid-cols-3 gap-1.5 rounded-xl bg-ink-100 p-1">
        {CYCLES.map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            className={cn(
              'rounded-lg py-2 text-sm font-medium transition-colors',
              cycle === c ? 'bg-ink-50 text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-800',
            )}
          >
            {CYCLE_LABELS[c]}
          </button>
        ))}
      </div>

      <div id="plan__price" className="plan__price flex items-baseline gap-2">
        <span id="plan__cost" className="plan__cost text-3xl font-semibold text-ink-900">{tier.cost} USD</span>
        <span id="plan__period" className="plan__period text-sm text-ink-400">/ {tier.durationDays} días</span>
        {tier.savingsLabel && (
          <span id="plan__savings" className="plan__savings ml-auto rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-700">{tier.savingsLabel}</span>
        )}
      </div>

      <ul id="plan__features" className="plan__features mt-5 space-y-2 text-sm text-ink-600">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <Check size={14} className="text-ink-900 shrink-0" /> {feature}
          </li>
        ))}
      </ul>

      <a
        href={enlace(tier)}
        target="_blank"
        rel="noreferrer"
        id="plan__request"
        className="plan__request mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-3xl bg-primary px-8 text-base font-medium text-white shadow-soft transition-colors hover:bg-primary-dark"
      >
        <MessageCircle size={18} aria-hidden="true" />
        {ctaLabel}
      </a>
    </div>
  );
}

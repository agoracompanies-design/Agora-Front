import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Option<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
}

interface SegmentedToggleProps<T extends string> {
  /** Identificador del bloque, para engancharlo desde fuera. */
  id?: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedToggle<T extends string>({ id, options, value, onChange, className }: SegmentedToggleProps<T>) {
  return (
    // `flex-wrap` y el relleno corto no son adorno: a 320 px —el teléfono más
    // estrecho que se sigue usando— las tres opciones no caben en una línea y
    // «Precio» se salía de la pantalla. Partido en dos líneas se lee entero.
    <div id={id} className={cn('segmented inline-flex flex-wrap gap-1 rounded-xl bg-ink-100 p-1', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors sm:px-4',
            value === opt.value ? 'bg-ink-50 text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

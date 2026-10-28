import { useId } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (valor: boolean) => void;
  /** Lo que se lee al lado. Sin él queda solo el interruptor. */
  children?: ReactNode;
  /** Para cuando no hay texto visible: lo que oye un lector de pantalla. */
  label?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Un interruptor de encendido y apagado.
 *
 * Por dentro es un `input type="checkbox"` de verdad, escondido con `sr-only`
 * y pintado con `peer-checked`: así se enfoca con el tabulador, se activa con
 * la barra espaciadora y los lectores de pantalla lo anuncian solos. El
 * `role="switch"` solo cambia cómo lo nombran —«activado» en vez de
 * «marcado»—, que es lo que significa aquí.
 *
 * Reconstruirlo con un `div` costaría teclado, foco y estado, y se quedaría
 * peor que esto.
 */
export function Switch({
  checked,
  onChange,
  children,
  label,
  disabled = false,
  id,
  className,
}: SwitchProps) {
  const propio = useId();
  const idCampo = id ?? propio;

  return (
    <label
      htmlFor={idCampo}
      className={cn(
        'switch inline-flex items-center gap-2',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      )}
    >
      <input
        id={idCampo}
        type="checkbox"
        role="switch"
        className="switch__input peer sr-only"
        checked={checked}
        disabled={disabled}
        aria-label={children ? undefined : label}
        onChange={(e) => onChange(e.target.checked)}
      />
      {/* La pista. El anillo de foco se pinta aquí porque el campo no se ve.
          El pulgar lleva su propio `peer-checked` y no un selector desde la
          pista: `peer-*` solo mira al hermano anterior, y desde dentro de la
          pista el campo ya no lo es. */}
      <span
        aria-hidden="true"
        className="switch__track relative h-5 w-9 shrink-0 rounded-full bg-ink-300 transition-colors peer-checked:bg-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"
      >
        <span
          className={cn(
            'switch__thumb absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-soft transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </span>
      {children && <span className="switch__label text-sm text-ink-700">{children}</span>}
    </label>
  );
}

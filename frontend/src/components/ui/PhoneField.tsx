import { useId } from 'react';
import { PAISES, PAIS_POR_DEFECTO, numeroValido, paisDe, telefonoCompleto } from '@/lib/paises';

interface PhoneFieldProps {
  label?: string;
  /** País elegido, por su código ISO. */
  pais: string;
  onPais: (iso: string) => void;
  /** El número nacional, sin prefijo. */
  numero: string;
  onNumero: (valor: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  autoFocus?: boolean;
  id?: string;
}

/**
 * Teléfono con selector de código de país.
 *
 * El número se guarda en dos piezas —país y número nacional— y se junta al
 * mandarlo (`telefonoCompleto`). Así el país nunca se pierde ni se escribe dos
 * veces el prefijo, que es lo que pasaba cuando todo iba en un solo campo.
 *
 * Cuba sale por defecto. La bandera es el emoji del país, sin imágenes.
 */
export function PhoneField({
  label = 'Teléfono',
  pais,
  onPais,
  numero,
  onNumero,
  hint,
  error,
  required = false,
  autoFocus = false,
  id,
}: PhoneFieldProps) {
  const generado = useId();
  const base = id ?? generado;
  const elegido = paisDe(pais || PAIS_POR_DEFECTO);
  const ayuda = error ? base + '__error' : hint ? base + '__hint' : undefined;

  return (
    <div id={base + '__field'} className="phone block">
      <span id={base + '__label'} className="phone__label mb-1.5 block text-sm font-medium text-ink-800">
        {label}
      </span>

      <div className="phone__row flex gap-2">
        <label htmlFor={base + '__country'} className="sr-only">País</label>
        <select
          id={base + '__country'}
          value={elegido.iso}
          onChange={(e) => onPais(e.target.value)}
          className="phone__country h-10 w-[7.5rem] shrink-0 cursor-pointer rounded-xl border border-ink-200 bg-ink-50 px-2 text-sm text-ink-900 outline-none focus:border-primary"
        >
          {PAISES.map((p) => (
            <option key={p.iso} value={p.iso}>
              {p.bandera} +{p.codigo}
            </option>
          ))}
        </select>

        <input
          id={base}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          required={required}
          aria-describedby={ayuda}
          aria-invalid={error ? true : undefined}
          value={numero}
          onChange={(e) => onNumero(e.target.value.replace(/[^\d\s-]/g, '').slice(0, 15))}
          placeholder={elegido.iso === 'CU' ? '5 555 5555' : 'Número'}
          className="phone__number h-10 w-full min-w-0 rounded-xl border border-ink-200 bg-ink-50 px-3 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-primary"
        />
      </div>

      {error ? (
        <span id={base + '__error'} className="phone__error mt-1.5 block text-xs text-red-600">
          {error}
        </span>
      ) : hint ? (
        <span id={base + '__hint'} className="phone__hint mt-1.5 block text-xs text-ink-500">
          {hint}
        </span>
      ) : (
        <span id={base + '__preview'} className="phone__preview mt-1.5 block text-xs text-ink-500">
          {numero.trim() ? 'Se guardará como ' + telefonoCompleto(elegido.iso, numero) : elegido.nombre}
        </span>
      )}
    </div>
  );
}

/** Para quien use el campo: si lo escrito vale como teléfono. */
export function telefonoListo(pais: string, numero: string): boolean {
  return numeroValido(pais || PAIS_POR_DEFECTO, numero);
}

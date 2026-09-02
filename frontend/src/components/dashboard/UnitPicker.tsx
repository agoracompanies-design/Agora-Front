import { useMemo, useRef, useState } from 'react';
import { Check, Ruler } from 'lucide-react';
import { UNIDADES } from '@/lib/unidades';
import { cn } from '@/lib/utils';

/**
 * Campo de unidad de venta: ofrece las corrientes y admite cualquier otra.
 *
 * A diferencia de la categoría, aquí no hay aprobación de por medio: la unidad
 * no organiza el catálogo, solo dice cómo se vende esto. La lista está para
 * que no convivan «kg», «Kg» y «kilogramo» diciendo lo mismo, no para cerrar
 * el paso a lo que no esté prevista.
 */
export function UnitPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

  const escrito = value.trim().toLowerCase();
  const grupos = useMemo(() => {
    if (!escrito) return UNIDADES;
    return UNIDADES.map((g) => ({
      ...g,
      unidades: g.unidades.filter((u) => u.includes(escrito)),
    })).filter((g) => g.unidades.length > 0);
  }, [escrito]);

  function elegir(unidad: string) {
    onChange(unidad);
    setAbierto(false);
    campo.current?.blur();
  }

  return (
    <div id="unit-picker" className="unit-picker relative">
      <label id="unit-picker__label" className="unit-picker__label mb-1.5 block text-sm font-medium text-ink-800" htmlFor="unit-picker__input">
        Unidad
      </label>

      <div id="unit-picker__field" className="unit-picker__field relative">
        <Ruler
          size={15}
          aria-hidden="true"
          className="unit-picker__icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
        />
        <input
          ref={campo}
          id="unit-picker__input"
          type="text"
          required
          autoComplete="off"
          role="combobox"
          aria-expanded={abierto}
          aria-controls="unit-picker__list"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          // El clic en una opción llega después del blur: se cierra con retraso
          // para que le dé tiempo a registrarse.
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          placeholder="Elige una o escribe la tuya"
          className="unit-picker__control h-10 w-full rounded-xl border border-ink-200 bg-ink-50 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary"
        />
      </div>

      {abierto && (
        <div
          id="unit-picker__list"
          role="listbox"
          aria-label="Unidades de venta"
          className="unit-picker__list absolute left-0 right-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-ink-200 bg-ink-50 py-1 shadow-lift"
        >
          {grupos.length === 0 ? (
            <p id="unit-picker__free" className="unit-picker__free px-3 py-2 text-sm text-ink-500">
              Ninguna coincide: se guardará «{value.trim()}» tal cual.
            </p>
          ) : (
            grupos.map((grupo) => (
              <div key={grupo.titulo} className="unit-picker__group">
                <p className="unit-picker__group-title px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  {grupo.titulo}
                </p>
                {grupo.unidades.map((unidad) => (
                  <button
                    key={unidad}
                    type="button"
                    role="option"
                    aria-selected={unidad === value}
                    // `mousedown` y no `click`: el blur del campo se dispara antes.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      elegir(unidad);
                    }}
                    id={`unit-picker__option--${unidad}`}
                    className={cn(
                      'unit-picker__option flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-ink-100',
                      unidad === value ? 'font-medium text-ink-900' : 'text-ink-700',
                    )}
                  >
                    {unidad}
                    {unidad === value && <Check size={13} className="text-primary" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

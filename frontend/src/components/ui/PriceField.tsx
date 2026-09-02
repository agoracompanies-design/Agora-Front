import { useEffect, useId, useRef, useState } from 'react';
import { Input } from '@/components/ui/Field';
import { soloPrecio } from '@/lib/utils';
import { cn } from '@/lib/utils';

/** Lo que dura el aviso en pantalla si no se vuelve a teclear. */
const DURACION = 2600;

/**
 * Campo de precio: filtra lo que no puede formar parte de un precio y lo dice.
 *
 * Filtrar en silencio deja a quien escribe sin saber por qué su tecla no hace
 * nada —parece que el campo está roto—, así que la primera vez que se descarta
 * algo aparece un globo señalando el campo. Se va solo; no es un error que haya
 * que resolver, solo una aclaración.
 */
export function PriceField({
  label,
  value,
  onChange,
  ...props
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [avisando, setAvisando] = useState(false);
  const temporizador = useRef<number | undefined>(undefined);
  const avisoId = useId();

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  function manejar(escrito: string) {
    const limpio = soloPrecio(escrito);
    // Se avisa solo cuando de verdad se descartó algo, no al borrar ni al
    // escribir un número: comparar con lo tecleado es lo único que lo dice.
    if (limpio !== escrito) {
      setAvisando(true);
      window.clearTimeout(temporizador.current);
      temporizador.current = window.setTimeout(() => setAvisando(false), DURACION);
    }
    onChange(limpio);
  }

  return (
    <div className="price-field relative">
      <Input
        label={label}
        inputMode="decimal"
        value={value}
        onChange={(e) => manejar(e.target.value)}
        aria-describedby={avisando ? avisoId : undefined}
        {...props}
      />

      {avisando && (
        <div
          id={avisoId}
          role="status"
          aria-live="polite"
          className={cn(
            'price-field__tip absolute left-0 top-full z-20 mt-2 w-max max-w-[15rem]',
            'animate-fade-up rounded-lg bg-ink-900 px-3 py-2 text-xs font-medium text-ink-50 shadow-lift',
          )}
        >
          {/* La punta del globo: un cuadrado girado bajo el borde superior. */}
          <span
            aria-hidden="true"
            className="price-field__tip-arrow absolute -top-1 left-5 h-2 w-2 rotate-45 bg-ink-900"
          />
          Solo números. Usa la coma para los decimales.
        </div>
      )}
    </div>
  );
}

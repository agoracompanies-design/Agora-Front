import { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Lo que se queda la burbuja en pantalla cuando se abre con un toque. */
const DURACION = 3700;

/**
 * Botón de ayuda: una «i» que explica algo sin ocupar sitio diciéndolo.
 *
 * Con ratón basta pasar por encima. Donde no hay ratón no existe el hover, así
 * que ahí manda el toque y la burbuja se va sola: sin eso quedaría abierta
 * hasta tocar en otra parte, que es justo lo que nadie sabe que tiene que
 * hacer. El teclado la abre al enfocar, como el ratón.
 */
export function InfoTip({ children, className }: { children: React.ReactNode; className?: string }) {
  const [visible, setVisible] = useState(false);
  const temporizador = useRef<number | undefined>(undefined);
  const id = useId();

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  // Sin preguntar por `(hover: hover)`: si esa consulta responde mal —y hay
  // navegadores que lo hacen— la ayuda se queda inalcanzable por las dos vías.
  // Cada gesto abre por su cuenta: donde no hay ratón el hover no llega nunca,
  // y donde lo hay, un clic de más tampoco estorba.
  function abrir() {
    window.clearTimeout(temporizador.current);
    setVisible(true);
  }

  function cerrar() {
    setVisible(false);
  }

  /** El toque no tiene con qué cerrarla: se va sola. */
  function alTocar() {
    setVisible(true);
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setVisible(false), DURACION);
  }

  return (
    <span className={cn('info-tip relative inline-flex', className)}>
      <button
        type="button"
        aria-label="Más información"
        aria-describedby={visible ? id : undefined}
        onMouseEnter={abrir}
        onMouseLeave={cerrar}
        onFocus={abrir}
        onBlur={cerrar}
        onClick={alTocar}
        className="info-tip__button flex h-5 w-5 items-center justify-center rounded-full border border-ink-300 text-ink-500 transition-colors hover:border-ink-400 hover:text-ink-900"
      >
        <Info size={11} aria-hidden="true" />
      </button>

      {visible && (
        <span
          id={id}
          role="tooltip"
          className="info-tip__bubble absolute right-0 top-full z-30 mt-2 w-max max-w-[15rem] animate-fade-up rounded-lg bg-ink-900 px-3 py-2 text-xs font-medium leading-relaxed text-ink-50 shadow-lift"
        >
          {/* La punta: un cuadrado girado bajo el borde superior. */}
          <span aria-hidden="true" className="info-tip__arrow absolute -top-1 right-1.5 h-2 w-2 rotate-45 bg-ink-900" />
          {children}
        </span>
      )}
    </span>
  );
}

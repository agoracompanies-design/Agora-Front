import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Cuánto hay que bajar antes de que aparezca. Menos que esto, subir es un gesto. */
const DESDE_PX = 480;

/**
 * Vuelve al principio de la página.
 *
 * Aparece al bajar y se va al volver arriba, para no estar siempre en medio.
 *
 * **Dónde se coloca.** En el margen lateral derecho, no encima del contenido
 * —antes estaba en `right-6`, tapando la esquina de la última tarjeta—. Las
 * páginas centran lo suyo en un ancho máximo, y la más ancha, la de explorar,
 * usa 72rem; en una pantalla grande sobra sitio a los lados y ahí es donde va.
 * La cuenta reparte ese margen y centra el botón dentro:
 *
 *     margen  = (ancho de la ventana − ancho del contenido) / 2
 *     derecha = (margen − ancho del botón) / 2
 *
 * Cuando la ventana es más estrecha que el contenido no hay margen que repartir
 * y la cuenta daría un número negativo; ahí el `max()` lo deja pegado al borde.
 * Se mide contra 72rem y no contra el ancho de cada pantalla porque es el
 * contenedor más ancho que hay: lo que cabe en su margen cabe en el del resto.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function alDesplazar() {
      setVisible(window.scrollY > DESDE_PX);
    }
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => window.removeEventListener('scroll', alDesplazar);
  }, []);

  return (
    <button
      type="button"
      id="scroll-top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Volver arriba"
      // Fuera del orden de tabulación mientras no se ve: si no, se llega a él
      // con el tabulador sin que haya nada en pantalla.
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      style={{ right: 'max(0.75rem, calc((100vw - min(100vw, 72rem)) / 4 - 1.375rem))' }}
      className={cn(
        'scroll-top fixed bottom-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-ink-50 text-ink-700 shadow-lift ring-1 ring-ink-200 transition-all duration-300',
        visible ? 'scroll-top--visible translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
      )}
    >
      <ArrowUp size={18} aria-hidden="true" />
    </button>
  );
}

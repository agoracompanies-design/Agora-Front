import { useRef, useState } from 'react';
import { ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Cuánto se amplía con la lupa puesta. */
const AUMENTO = 2.5;

/**
 * La foto del producto, con lupa.
 *
 * Sin lupa se ve entera —`contain`, no `cover`—: en un catálogo, recortar la
 * foto puede esconder justo lo que se quería mirar, la etiqueta o el tamaño del
 * envase. Un clic enciende la lupa y el detalle sigue al puntero; otro clic la
 * apaga.
 *
 * Mientras está encendida, una capa cubre el resto de la página y se come los
 * clics: quien está mirando de cerca no quiere descubrir que ha pulsado
 * «Guardar en favoritos» al mover el ratón.
 */
export function ZoomableImage({
  src,
  alt,
  onError,
}: {
  src: string;
  alt: string;
  /** Si la foto no llega, quien la pinta pone otra cosa en su lugar. */
  onError?: () => void;
}) {
  const [conLupa, setConLupa] = useState(false);
  const [punto, setPunto] = useState({ x: 50, y: 50 });
  const marco = useRef<HTMLDivElement>(null);

  function seguir(clienteX: number, clienteY: number) {
    const caja = marco.current?.getBoundingClientRect();
    if (!caja) return;
    // En porcentaje: es lo que entiende `background-position` y así el aumento
    // se puede cambiar sin tocar este cálculo.
    const x = Math.min(100, Math.max(0, ((clienteX - caja.left) / caja.width) * 100));
    const y = Math.min(100, Math.max(0, ((clienteY - caja.top) / caja.height) * 100));
    setPunto({ x, y });
  }

  return (
    <>
      {/* La capa va por debajo de la imagen y por encima de todo lo demás. */}
      {conLupa && (
        <div
          id="zoom__shield"
          aria-hidden="true"
          onClick={() => setConLupa(false)}
          className="zoom__shield fixed inset-0 z-30 bg-ink-950/40"
        />
      )}

      <div
        ref={marco}
        id="product-detail__frame"
        className={cn(
          // Alto atado al viewport en vez de cuadrado: en una pantalla de
          // portátil, un cuadrado del ancho de la columna se sale por abajo y
          // obliga a hacer scroll para ver la foto entera.
          'product-detail__frame relative h-[58vh] max-h-[540px] min-h-[240px] w-full overflow-hidden rounded-2xl bg-ink-100',
          conLupa && 'z-40 ring-2 ring-primary',
        )}
      >
        <button
          type="button"
          aria-label={conLupa ? 'Quitar la lupa' : 'Ampliar la imagen'}
          aria-pressed={conLupa}
          onClick={() => setConLupa((v) => !v)}
          onMouseMove={(e) => conLupa && seguir(e.clientX, e.clientY)}
          onTouchMove={(e) => {
            if (!conLupa) return;
            const dedo = e.touches[0];
            if (dedo) seguir(dedo.clientX, dedo.clientY);
          }}
          className={cn(
            'zoom__surface block h-full w-full',
            conLupa ? 'cursor-zoom-out touch-none' : 'cursor-zoom-in',
          )}
          style={
            conLupa
              ? {
                  backgroundImage: `url(${src})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: `${AUMENTO * 100}%`,
                  backgroundPosition: `${punto.x}% ${punto.y}%`,
                }
              : undefined
          }
        >
          {/* Con la lupa puesta el detalle lo pinta el fondo: la imagen se
              esconde en vez de desmontarse, para no volver a descargarla. */}
          <img
            src={src}
            alt={alt}
            onError={onError}
            id="product-detail__image"
            className={cn('product-detail__image h-full w-full object-contain', conLupa && 'invisible')}
          />
        </button>

        {!conLupa && (
          <span
            id="zoom__hint"
            aria-hidden="true"
            className="zoom__hint pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-ink-950/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm"
          >
            <ZoomIn size={12} /> Pulsa para ampliar
          </span>
        )}
      </div>
    </>
  );
}

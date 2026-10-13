import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  /** Identificador del bloque, para engancharlo desde fuera. */
  id?: string;
  value: number;
  count?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

const ESTRELLAS = [1, 2, 3, 4, 5];

/**
 * Qué estrella se pinta llena.
 *
 * Por parte entera, no redondeando: con 4,7 se llenan cuatro. Redondeando, un
 * 4,5 enseñaría cinco estrellas llenas, que es la nota perfecta y no es lo que
 * tiene.
 */
const llena = (estrella: number, valor: number) => estrella <= Math.floor(valor);

export function RatingStars({ id, value, count, size = 15, interactive = false, onChange }: RatingStarsProps) {
  return (
    <div id={id} className="rating inline-flex items-center gap-1">
      <div className="rating__stars flex items-center">
        {interactive
          ? ESTRELLAS.map((estrella) => (
              <button
                key={estrella}
                type="button"
                onClick={() => onChange?.(estrella)}
                // El área que se toca no es la estrella: con el tamaño de 22
                // que usa la ficha del producto se quedaba en 22 px, y en un
                // teléfono eso es fallar una de cada pocas veces. El relleno la
                // sube por encima de los 24 px que pide la WCAG 2.5.8 sin
                // agrandar el dibujo.
                className="rating__star flex items-center justify-center p-1.5"
                aria-label={`${estrella} ${estrella === 1 ? 'estrella' : 'estrellas'}`}
              >
                <Star
                  size={size}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className={cn(
                    llena(estrella, value) ? 'fill-star text-star-edge' : 'fill-transparent text-ink-300',
                    'transition-transform hover:scale-110',
                  )}
                />
              </button>
            ))
          : /*
             * Sin interacción no hay botones.
             *
             * Antes se pintaban igual, cinco `<button disabled>` por cada nota.
             * Un botón deshabilitado sigue siendo un botón para un lector de
             * pantalla: en una lista de productos eran cinco controles falsos
             * por fila, cada uno anunciándose «3 estrellas», que no dice la
             * nota sino su posición. Aquí la nota es un dato, no un mando, así
             * que va como tal, con una sola etiqueta que la lee entera.
             */
            ESTRELLAS.map((estrella) => (
              <Star
                key={estrella}
                size={size}
                strokeWidth={1.5}
                aria-hidden="true"
                className={cn(
                  llena(estrella, value) ? 'fill-star text-star-edge' : 'fill-transparent text-ink-300',
                )}
              />
            ))}
      </div>
      {!interactive && (
        <span className="sr-only">
          {value.toFixed(1).replace('.', ',')} de 5
          {count !== undefined && `, ${count} ${count === 1 ? 'calificación' : 'calificaciones'}`}
        </span>
      )}
      {count !== undefined && (
        // El `(12)` se esconde del lector de pantalla **solo** cuando la frase
        // de arriba ya lo dice; si no, quedaría mudo. Hoy no se da el caso
        // —calificar no lleva conteo—, pero el día que se dé no hay que
        // acordarse de esto.
        <span aria-hidden={!interactive} className="rating__count text-xs text-ink-500">
          ({count})
        </span>
      )}
    </div>
  );
}

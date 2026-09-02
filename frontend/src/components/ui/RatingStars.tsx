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

export function RatingStars({ id, value, count, size = 15, interactive = false, onChange }: RatingStarsProps) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div id={id} className="rating inline-flex items-center gap-1">
      <div className="rating__stars flex items-center">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            className={cn(!interactive && 'cursor-default')}
            aria-label={`${star} estrellas`}
          >
            <Star
              size={size}
              strokeWidth={1.5}
              className={cn(
                // Por parte entera, no redondeando: con 4,7 se llenan cuatro.
                // Redondeando, un 4,5 enseñaría cinco estrellas llenas, que es
                // la nota perfecta y no es lo que tiene.
                star <= Math.floor(value) ? 'fill-star text-star-edge' : 'fill-transparent text-ink-300',
                interactive && 'transition-transform hover:scale-110',
              )}
            />
          </button>
        ))}
      </div>
      {count !== undefined && <span className="rating__count text-xs text-ink-500">({count})</span>}
    </div>
  );
}

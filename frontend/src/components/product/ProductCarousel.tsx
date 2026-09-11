import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@/types';
import { ProductCard } from './ProductCard';

interface ProductCarouselProps {
  titulo: string;
  productos: Product[];
  /** Sufijo para los ids: en una misma página hay dos carruseles. */
  nombre: string;
}

/**
 * Una fila de productos que se recorre de lado.
 *
 * Se desplaza con el dedo o con la rueda, y en escritorio además con dos
 * flechas, que es como se recorre cuando no hay pantalla táctil. El
 * desplazamiento va por saltos de una pantalla para no dejar tarjetas partidas
 * a medias.
 */
export function ProductCarousel({ titulo, productos, nombre }: ProductCarouselProps) {
  const pista = useRef<HTMLUListElement>(null);

  if (productos.length === 0) return null;

  function mover(sentido: 1 | -1) {
    const caja = pista.current;
    if (!caja) return;
    caja.scrollBy({ left: sentido * caja.clientWidth * 0.9, behavior: 'smooth' });
  }

  return (
    <section id={`carousel--${nombre}`} className="carousel" aria-label={titulo}>
      <header id={`carousel__header--${nombre}`} className="carousel__header mb-3 flex items-center justify-between gap-3">
        <h2 id={`carousel__title--${nombre}`} className="carousel__title text-base font-semibold text-ink-900">
          {titulo}
        </h2>
        <div id={`carousel__controls--${nombre}`} className="carousel__controls hidden gap-1 sm:flex">
          <button
            type="button"
            onClick={() => mover(-1)}
            aria-label="Ver los anteriores"
            className="carousel__control flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 text-ink-600 transition-colors hover:border-ink-400 hover:text-ink-900"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => mover(1)}
            aria-label="Ver los siguientes"
            className="carousel__control flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 text-ink-600 transition-colors hover:border-ink-400 hover:text-ink-900"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      <ul
        ref={pista}
        id={`carousel__track--${nombre}`}
        className="carousel__track flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {productos.map((producto) => (
          <li
            key={producto.idProduct}
            className="carousel__item w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]"
          >
            <ProductCard product={producto} />
          </li>
        ))}
      </ul>
    </section>
  );
}

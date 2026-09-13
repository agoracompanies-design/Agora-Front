import { useEffect, useRef, useState } from 'react';
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
 * a medias. Las flechas van centradas bajo la fila, pegadas a lo que mueven.
 */
export function ProductCarousel({ titulo, productos, nombre }: ProductCarouselProps) {
  const pista = useRef<HTMLUListElement>(null);
  const [sobraAncho, setSobraAncho] = useState(false);

  // Si todo cabe no hay nada que recorrer, y dos flechas muertas debajo de una
  // sola tarjeta piden que las pulses para nada. Se mira la pista de verdad y
  // no el número de productos, porque lo que cabe depende del ancho: los
  // mismos tres productos desbordan en la columna de la foto y no en una
  // pantalla ancha. El observador avisa también al cambiar el tamaño.
  useEffect(() => {
    const caja = pista.current;
    if (!caja) return;
    const observador = new ResizeObserver(() => setSobraAncho(caja.scrollWidth > caja.clientWidth + 1));
    observador.observe(caja);
    return () => observador.disconnect();
  }, [productos.length]);

  function mover(sentido: 1 | -1) {
    const caja = pista.current;
    if (!caja) return;
    caja.scrollBy({ left: sentido * caja.clientWidth * 0.9, behavior: 'smooth' });
  }

  // Después de los hooks: su orden no puede cambiar entre renderizados.
  if (productos.length === 0) return null;

  return (
    <section id={`carousel--${nombre}`} className="carousel" aria-label={titulo}>
      <header id={`carousel__header--${nombre}`} className="carousel__header mb-3">
        <h2 id={`carousel__title--${nombre}`} className="carousel__title text-base font-semibold text-ink-900">
          {titulo}
        </h2>
      </header>

      <ul
        ref={pista}
        id={`carousel__track--${nombre}`}
        className="carousel__track flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {productos.map((producto) => (
          <li
            key={producto.idProduct}
            // El ancho va en porcentaje de la pista, no del viewport: desde
            // que el carrusel vive en la columna de la foto —unos 570 px— un
            // 23 % dejaba tarjetas de 131 px, ilegibles. Con 31 % se ven dos y
            // media, que es lo que invita a seguir empujando.
            className="carousel__item w-[46%] shrink-0 snap-start sm:w-[31%]"
          >
            <ProductCard product={producto} />
          </li>
        ))}
      </ul>

      {/* Las flechas van debajo y centradas: la fila de arriba es del título, y
          ahí a la derecha quedaban lejos de lo que mueven. Siguen sin salir en
          pantalla pequeña, donde se recorre con el dedo. */}
      {sobraAncho && (
      <div
        id={`carousel__controls--${nombre}`}
        className="carousel__controls mt-2 hidden items-center justify-center gap-2 sm:flex"
      >
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
      )}
    </section>
  );
}

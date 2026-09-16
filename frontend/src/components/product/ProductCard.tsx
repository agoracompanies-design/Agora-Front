import { Link } from 'react-router-dom';
import { Heart, ImageOff, Store } from 'lucide-react';
import type { Product } from '@/types';
import { productImageUrl } from '@/api/product';
import { formatAmount, cn } from '@/lib/utils';
import { useFavorites } from '@/context/FavoritesContext';

/** Por debajo de estas calificaciones, un producto se considera recién llegado. */
const VOTOS_PARA_ASENTARSE = 10;

/**
 * La altura de la foto en la rejilla de Explorar, en escritorio, ligada al alto
 * de la ventana: así las dos filas y la paginación caben en pantalla también en
 * portátiles de 1366 × 768, donde antes la paginación quedaba 51 px por debajo.
 *
 * `50dvh - 184px` sale de repartir la pantalla entre dos filas: cabecera (65),
 * separación de filas (16), paginación con su margen (48), un respiro arriba y
 * abajo (16) y, por fila, el cuerpo de la tarjeta con sus bordes (106).
 *
 * - Mínimo 110 px: en pantallas muy bajas deja de encoger y se hace scroll,
 *   antes que una foto convertida en tira.
 * - Máximo 3:2 del ancho de la tarjeta (`66.667cqw`, medido sobre la tarjeta,
 *   que es contenedor): en pantallas altas queda exactamente como antes.
 *
 * Solo desde `lg`, que es donde la página muestra dos filas de cuatro. En
 * tableta y móvil son tres y cuatro filas: no tiene sentido hacerlas caber.
 * Compartido con el esqueleto de carga para que no salte al llegar los datos.
 */
export const FOTO_COMPACTA_LG = 'lg:aspect-auto lg:h-[clamp(110px,calc(50dvh-184px),66.667cqw)]';

interface ProductCardProps {
  product: Product;
  /**
   * Qué precio enseñar cuando el producto tiene los dos. Es la moneda por la
   * que se está ordenando: si la tarjeta mostrara la otra, el precio no
   * explicaría el sitio que ocupa en la rejilla.
   */
  moneda?: 'USD' | 'CUP';
  /**
   * Cuántas veces lo han calificado. Con pocas, la nota no significa nada
   * todavía y la tarjeta lo dice: es un producto nuevo, no uno malo.
   */
  votos?: number;
  /**
   * Marca la tarjeta entera cuando el producto está agotado. Se usa en la lista
   * de favoritos: ahí el producto se guardó estando disponible, así que hay que
   * avisar de que ya no lo está sin obligar a leer el badge pequeño.
   */
  avisarAgotado?: boolean;
  /**
   * Versión más apretada, solo para la rejilla de Explorar.
   *
   * Ahí las tarjetas se ven de cuatro en cuatro y en cuadrícula larga, así que
   * cada una puede ocupar menos sin costar legibilidad: la foto pierde altura,
   * el relleno se ajusta y el precio baja un punto. En los carruseles, en
   * favoritos y en la ficha del negocio se quedan como están, que ahí son pocas
   * y se miran de una en una.
   */
  compacta?: boolean;
}

export function ProductCard({
  product,
  moneda: preferida = 'USD',
  votos,
  avisarAgotado = false,
  compacta = false,
}: ProductCardProps) {
  const imageUrl = productImageUrl(product.image);
  // Los dos precios son independientes: un negocio puede poner solo uno, o
  // ambos con descuento por pagar en divisa. Se enseña el de la moneda pedida
  // y, si el producto no lo tiene, el otro; la etiqueta dice cuál es.
  const hay = (m: 'USD' | 'CUP') => {
    const valor = m === 'USD' ? product.priceUsd : product.priceCup;
    return valor !== null && valor !== undefined;
  };
  const moneda = hay(preferida) ? preferida : preferida === 'USD' ? 'CUP' : 'USD';
  const precio = formatAmount(moneda === 'USD' ? product.priceUsd : product.priceCup);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(product.idProduct);
  const agotadoResaltado = avisarAgotado && !product.stock;
  // Las dos etiquetas comparten esquina, así que solo cabe una. Manda
  // «Agotado»: no hay nada que presentar de algo que no se puede comprar.
  const esNuevo = product.stock && votos !== undefined && votos < VOTOS_PARA_ASENTARSE;

  return (
    <Link
      id={`product--${product.idProduct}`}
      to={`/productos/${product.idProduct}`}
      className={cn(
        'product group flex h-full flex-col overflow-hidden rounded-xl border shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card',
        // Contenedor para que la foto compacta mida su máximo sobre la tarjeta.
        compacta && '@container',
        agotadoResaltado
          ? 'border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30'
          : 'border-ink-200/80 bg-ink-50',
      )}
    >
      <div
        className={cn(
          'product__image relative w-full flex-auto min-h-0 overflow-hidden',
          compacta ? `aspect-[3/2] ${FOTO_COMPACTA_LG}` : 'aspect-[4/3]',
          agotadoResaltado ? 'bg-red-100/60 dark:bg-red-950/40' : 'bg-ink-100',
        )}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            id={`product__image--${product.idProduct}`}
          className="product__image h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div id={`product__placeholder--${product.idProduct}`} className="product__placeholder flex h-full w-full items-center justify-center text-ink-300">
            <ImageOff size={20} aria-hidden="true" />
          </div>
        )}

        {!product.stock && (
          <span
            className={cn(
              'product__badge absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm',
              agotadoResaltado ? 'bg-red-200 text-red-800 dark:bg-red-900/60 dark:text-red-200' : 'bg-white/90 text-danger',
            )}
          >
            Agotado
          </span>
        )}

        {esNuevo && (
          <span
            id={`product__new--${product.idProduct}`}
            className="product__new absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-primary backdrop-blur-sm"
          >
            Nuevo
          </span>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(product.idProduct);
          }}
          aria-label={favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          aria-pressed={favorite}
          id={`product__fav--${product.idProduct}`} className="product__fav absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink-500 backdrop-blur-sm transition-colors hover:text-ink-900"
        >
          <Heart size={14} className={cn(favorite && 'fill-danger text-danger')} aria-hidden="true" />
        </button>
      </div>

      <div
        id={`product__body--${product.idProduct}`}
        className={cn('product__body flex flex-1 flex-col', compacta ? 'gap-1 p-2.5' : 'gap-1.5 p-3')}
      >
        <h3
          id={`product__name--${product.idProduct}`}
          className={cn(
            'product__name line-clamp-2 font-medium leading-snug text-ink-900',
            compacta ? 'text-[13px]' : 'text-sm',
          )}
        >
          {product.name}
        </h3>
        {product.description && (
          <p id={`product__description--${product.idProduct}`} className="product__description line-clamp-1 text-xs text-ink-500">{product.description}</p>
        )}
        <p
          id={`product__price--${product.idProduct}`}
          className={cn(
            'product__price mt-auto flex items-center gap-1.5 font-bold text-ink-900',
            compacta ? 'text-sm' : 'text-base',
          )}
        >
          {precio ?? 'Consultar precio'}
          {precio && (
            <span
              id={`product__currency--${product.idProduct}`}
              className="product__currency rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold leading-none tracking-wide text-ink-600"
            >
              {moneda}
            </span>
          )}
        </p>
        {product.userEnterprise && (
          <p id={`product__seller--${product.idProduct}`} className="product__seller flex items-center gap-1 text-xs text-ink-500">
            <Store size={11} className="shrink-0" aria-hidden="true" />
            <span id={`product__seller-name--${product.idProduct}`} className="product__seller-name truncate">{product.userEnterprise.companyName}</span>
          </p>
        )}
      </div>
    </Link>
  );
}

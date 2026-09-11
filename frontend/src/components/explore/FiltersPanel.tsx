import { ArrowDownWideNarrow, ArrowUpNarrowWide, Banknote, DollarSign, MapPin, SlidersHorizontal, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { CategoryCount } from '@/hooks/useCategories';
import { cn, soloPrecio } from '@/lib/utils';

export type SortOrder = 'asc' | 'desc';
/** Qué moneda manda al ordenar. Los dos precios son independientes y no hay
 *  tasa de cambio, así que no se pueden comparar entre sí: lo que se hace es
 *  poner delante los productos que tienen precio en la moneda elegida. */
export type MonedaPrincipal = 'USD' | 'CUP';

interface FiltersPanelProps {
  minPrice: string;
  maxPrice: string;
  onMinPrice: (v: string) => void;
  onMaxPrice: (v: string) => void;
  sortOrder: SortOrder;
  onSortOrder: (v: SortOrder) => void;
  moneda: MonedaPrincipal;
  onMoneda: (v: MonedaPrincipal) => void;
  /** En qué moneda se leen el mínimo y el máximo. */
  monedaPrecio: MonedaPrincipal;
  onMonedaPrecio: (v: MonedaPrincipal) => void;
  nearMe: boolean;
  onLocateMe: () => void;
  locating: boolean;
  radiusKm: number;
  onRadiusKm: (v: number) => void;
  categories: CategoryCount[];
  activeCategory: string | null;
  onSelectCategory: (c: string) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
  /** Dónde se pinta este panel: 'aside' o 'sheet'. Distingue los ids. */
  ambito: string;
  /**
   * Cómo se coloca. `horizontal` es la barra que va sobre los resultados;
   * `vertical` es la hoja de filtros del móvil, donde hay alto de sobra.
   */
  orientacion?: 'horizontal' | 'vertical';
}

/** Cada criterio es un chip que se enciende. Misma forma para ordenar, acotar y
 *  elegir categoría: en la práctica el usuario hace lo mismo con los tres. */
function Chip({
  id,
  activo,
  onClick,
  children,
  icon,
}: {
  id: string;
  activo: boolean;
  onClick: () => void;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        'filters__chip inline-flex cursor-pointer items-center gap-1.5 rounded-full px-[11px] py-[3px] text-[11px] font-medium transition-colors duration-200',
        activo ? 'bg-primary text-white' : 'bg-primary/15 text-ink-900 hover:bg-primary/25',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/** El nombre de la categoría viene del backend: se pasa a algo válido como id. */
function identificador(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function Grupo({
  nombre,
  titulo,
  extra,
  children,
}: {
  nombre: string;
  titulo: string;
  /** Lo que va pegado al rótulo, como el selector de moneda del precio. */
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={`filters__group--${nombre}`} className="filters__group">
      <h3
        id={`filters__legend--${nombre}`}
        className="filters__legend mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500"
      >
        {titulo}
        {extra}
      </h3>
      {children}
    </section>
  );
}

export function FiltersPanel({
  minPrice,
  maxPrice,
  onMinPrice,
  onMaxPrice,
  sortOrder,
  onSortOrder,
  moneda,
  onMoneda,
  monedaPrecio,
  onMonedaPrecio,
  nearMe,
  onLocateMe,
  locating,
  radiusKm,
  onRadiusKm,
  categories,
  activeCategory,
  onSelectCategory,
  hasActiveFilters,
  onClear,
  ambito,
  orientacion = 'vertical',
}: FiltersPanelProps) {
  const enFila = orientacion === 'horizontal';
  /** Sufijo que distingue la copia de la columna de la de la hoja móvil. */
  const uid = (nombre: string) => `${nombre}--${ambito}`;
  const campo =
    'h-[35px] w-full min-w-0 rounded-lg border border-ink-200 bg-ink-50 px-[9px] text-[13px] text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary';

  return (
    <div
      id={uid('filters')}
      className={cn('filters', enFila ? 'flex flex-wrap items-start gap-x-7 gap-y-4' : 'space-y-4')}
    >
      <header
        id={uid('filters__header')}
        className={cn(
          'filters__header flex items-center justify-between gap-2',
          // En fila, el título no puede robar ancho a los filtros: se queda a
          // un lado y «Limpiar» se va al extremo contrario.
          enFila ? 'order-first shrink-0 self-center' : '',
        )}
      >
        <h2 id={uid('filters__title')} className="filters__title inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
          <SlidersHorizontal size={15} aria-hidden="true" /> Filtros
        </h2>
        {hasActiveFilters && !enFila && (
          <button
            onClick={onClear}
            id={uid('filters__clear')} className="filters__clear inline-flex items-center gap-1 text-[11px] font-medium text-ink-500 hover:text-ink-900"
          >
            <X size={12} aria-hidden="true" /> Limpiar
          </button>
        )}
      </header>

      {hasActiveFilters && enFila && (
        <button
          onClick={onClear}
          id={uid('filters__clear')}
          className="filters__clear order-last ml-auto inline-flex shrink-0 items-center gap-1 self-center text-[11px] font-medium text-ink-500 hover:text-ink-900"
        >
          <X size={12} aria-hidden="true" /> Limpiar
        </button>
      )}

      <Grupo
        nombre={uid('price')}
        titulo="Precio en"
        extra={
          <span id={uid('filters__price-currency')} className="filters__price-currency inline-flex gap-1">
            {(['CUP', 'USD'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={monedaPrecio === m}
                onClick={() => onMonedaPrecio(m)}
                id={uid(`filters__price-currency-${m.toLowerCase()}`)}
                className={cn(
                  'filters__price-currency-option rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide transition-colors',
                  monedaPrecio === m ? 'bg-primary text-white' : 'text-ink-500 hover:text-ink-900',
                )}
              >
                {m}
              </button>
            ))}
          </span>
        }
      >
        <div id={uid('filters__price')} className="filters__price flex items-center gap-2">
          <input
            inputMode="numeric"
            aria-label="Precio mínimo en CUP"
            placeholder="Mín"
            value={minPrice}
            onChange={(e) => onMinPrice(soloPrecio(e.target.value))}
            id={uid('filters__price-min')}
            className={campo}
          />
          <span id={uid('filters__price-sep')} className="filters__price-sep text-ink-400">–</span>
          <input
            inputMode="numeric"
            aria-label="Precio máximo en CUP"
            placeholder="Máx"
            value={maxPrice}
            onChange={(e) => onMaxPrice(soloPrecio(e.target.value))}
            id={uid('filters__price-max')}
            className={campo}
          />
        </div>
      </Grupo>

      <Grupo nombre={uid('sort')} titulo="Ordenar por precio">
        <div id={uid('filters__sort')} className="filters__sort flex flex-wrap gap-2">
          <Chip id={uid('filters__sort-asc')} activo={sortOrder === 'asc'} onClick={() => onSortOrder('asc')} icon={<ArrowUpNarrowWide size={13} aria-hidden="true" />}>
            Más barato
          </Chip>
          <Chip id={uid('filters__sort-desc')} activo={sortOrder === 'desc'} onClick={() => onSortOrder('desc')} icon={<ArrowDownWideNarrow size={13} aria-hidden="true" />}>
            Más caro
          </Chip>
        </div>

        {/* Va con lo anterior, no aparte: elegir moneda solo tiene sentido
            acompañando al orden. Primero salen los productos con precio en
            esta moneda; detrás, los de la otra. */}
        <div id={uid('filters__currency')} className="filters__currency mt-2 flex flex-wrap gap-2">
          <Chip id={uid('filters__currency-usd')} activo={moneda === 'USD'} onClick={() => onMoneda('USD')} icon={<DollarSign size={13} aria-hidden="true" />}>
            USD primero
          </Chip>
          <Chip id={uid('filters__currency-cup')} activo={moneda === 'CUP'} onClick={() => onMoneda('CUP')} icon={<Banknote size={13} aria-hidden="true" />}>
            CUP primero
          </Chip>
        </div>
      </Grupo>

      <Grupo nombre={uid('only')} titulo="Ubicación">
        <div id={uid('filters__only')} className="filters__only flex flex-wrap gap-2">
          <Chip id={uid('filters__only-near')} activo={nearMe} onClick={onLocateMe} icon={<MapPin size={13} aria-hidden="true" />}>
            {locating ? 'Buscando…' : 'Cerca de mí'}
          </Chip>
        </div>

        {nearMe && (
          <label id={uid('filters__radius')} className="filters__radius mt-4 block">
            <span id={uid('filters__radius-label')} className="filters__radius-label mb-1.5 flex items-center justify-between text-xs text-ink-500">
              Distancia máxima
              <span id={uid('filters__radius-value')} className="filters__radius-value font-semibold text-ink-900">{radiusKm} km</span>
            </span>
            <input
              type="range"
              min={1}
              max={20}
              value={radiusKm}
              onChange={(e) => onRadiusKm(Number(e.target.value))}
              id={uid('filters__radius-input')}
              className="filters__radius-input w-full accent-primary"
            />
          </label>
        )}
      </Grupo>

      {categories.length > 0 && (
        <Grupo nombre={uid('category')} titulo="Categoría">
          <div id={uid('filters__categories')} className="filters__categories flex flex-wrap gap-x-2 gap-y-2.5">
            {categories.map(({ category: c, count }) => {
              const activa = activeCategory === c;
              // Sin nada elegido van todas a pleno color; al elegir una, esa se
              // queda con el énfasis y el resto se atenúa.
              const conEnfasis = activa || activeCategory === null;
              return (
                <button
                  key={c}
                  onClick={() => onSelectCategory(c)}
                  aria-pressed={activa}
                  id={uid(`category-chip--${identificador(c)}`)}
                  className={cn(
                    'category-chip inline-flex cursor-pointer items-center gap-1.5 rounded-full py-[3px] pl-[11px] pr-[5px] text-[11px] font-medium transition-colors duration-200',
                    conEnfasis ? 'bg-primary text-white' : 'bg-primary/15 text-ink-900 hover:bg-primary/25',
                  )}
                >
                  {c}
                  <span id={uid(`category-chip__count--${identificador(c)}`)} className="category-chip__count rounded-full bg-white px-1.5 py-0.5 text-[9px] font-semibold text-neutral-900">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </Grupo>
      )}
    </div>
  );
}

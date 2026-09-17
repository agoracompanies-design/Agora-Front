import { ArrowDownWideNarrow, ArrowUpNarrowWide, Banknote, DollarSign, MapPin, SlidersHorizontal, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { CategoryCount } from '@/hooks/useCategories';
import { cn, soloPrecio } from '@/lib/utils';
import { PROVINCIAS } from '@/lib/provincias';
import { municipiosDe } from '@/lib/municipios';
import { ZoneSelect } from '@/components/explore/ZoneSelect';

export type SortOrder = 'asc' | 'desc';
/**
 * La moneda que manda en toda la pantalla.
 *
 * Los dos precios son independientes y no hay tasa de cambio, así que 180 CUP y
 * 8 USD no se pueden comparar entre sí. Por eso la moneda no es un filtro más:
 * es el primero, y el resto se lee en función de ella. El rango de precio se
 * compara contra la moneda elegida y el orden pone delante los productos que la
 * tienen; los demás van detrás, ordenados entre ellos.
 */
export type MonedaPrincipal = 'USD' | 'CUP';

interface FiltersPanelProps {
  minPrice: string;
  maxPrice: string;
  onMinPrice: (v: string) => void;
  onMaxPrice: (v: string) => void;
  sortOrder: SortOrder;
  onSortOrder: (v: SortOrder) => void;
  /**
   * La moneda con la que se lee todo: el rango de precio se compara contra
   * ella y el orden pone delante los productos que la tienen.
   */
  moneda: MonedaPrincipal;
  onMoneda: (v: MonedaPrincipal) => void;
  nearMe: boolean;
  onLocateMe: () => void;
  locating: boolean;
  radiusKm: number;
  onRadiusKm: (v: number) => void;
  /** Provincia elegida; cadena vacía es «Todas las provincias». */
  provincia: string;
  onProvincia: (v: string) => void;
  /** Municipio elegido dentro de la provincia; vacío es «Todos los municipios». */
  municipio: string;
  onMunicipio: (v: string) => void;
  /**
   * Cuántos productos hay en cada sitio con el resto de filtros puestos. Se
   * enseñan junto a cada opción para que se vea qué da elegirla antes de hacerlo.
   */
  conteoZona: { total: number; provincias: Record<string, number>; municipios: Record<string, number> };
  categories: CategoryCount[];
  activeCategory: string | null;
  onSelectCategory: (c: string) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
  /** Dónde se pinta este panel: 'aside' o 'sheet'. Distingue los ids. */
  ambito: string;
  /**
   * Si el panel pone su propio título. En la hoja del móvil no: la hoja ya
   * se titula «Filtrar resultados» y repetir «Filtros» justo debajo es decir
   * dos veces lo mismo. Ahí la cabecera se queda solo con «Limpiar».
   */
  conTitulo?: boolean;
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
  children,
  className,
}: {
  nombre: string;
  titulo: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={`filters__group--${nombre}`} className={cn('filters__group', className)}>
      <h3
        id={`filters__legend--${nombre}`}
        className="filters__legend mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500"
      >
        {titulo}
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
  nearMe,
  onLocateMe,
  locating,
  radiusKm,
  onRadiusKm,
  provincia,
  onProvincia,
  municipio,
  onMunicipio,
  conteoZona,
  categories,
  activeCategory,
  onSelectCategory,
  hasActiveFilters,
  onClear,
  ambito,
  orientacion = 'vertical',
  conTitulo = true,
}: FiltersPanelProps) {
  const enFila = orientacion === 'horizontal';
  /** Sufijo que distingue la copia de la columna de la de la hoja móvil. */
  const uid = (nombre: string) => `${nombre}--${ambito}`;
  const campo =
    'h-[35px] w-full min-w-0 rounded-lg border border-ink-200 bg-ink-50 px-[9px] text-[13px] text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary';
  /**
   * El botón de un desplegable de zona. En la barra lleva la forma de los chips
   * —misma altura, mismo encendido—; en la hoja del móvil, campo entero: ahí se
   * toca con el dedo.
   */
  const selector = (activo: boolean) =>
    enFila
      ? cn(
          'cursor-pointer rounded-full py-[3px] pl-[11px] pr-2 text-[11px] font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/40',
          // Apagado —«Todas las provincias», «Todos los municipios»— va un punto
          // más claro que los chips de al lado, para que se distinga que es un
          // desplegable. «Más claro» es menos tinte en modo claro y más en oscuro.
          activo
            ? 'bg-primary text-white'
            : 'bg-primary/10 text-ink-900 hover:bg-primary/20 dark:bg-primary/25 dark:hover:bg-primary/35',
        )
      : cn(campo, 'cursor-pointer', activo ? 'border-primary bg-primary/10 font-medium' : 'dark:bg-ink-100');
  const conCuenta = (nombre: string, n: number | undefined) => `${nombre} (${n ?? 0})`;
  const opcionesProvincia = [
    { valor: '', texto: conCuenta('Todas las provincias', conteoZona.total) },
    ...PROVINCIAS.map((p) => ({ valor: p, texto: conCuenta(p, conteoZona.provincias[p]) })),
  ];
  const opcionesMunicipio = provincia
    ? [
        { valor: '', texto: conCuenta('Todos los municipios', conteoZona.provincias[provincia]) },
        ...municipiosDe(provincia).map((m) => ({ valor: m, texto: conCuenta(m, conteoZona.municipios[m]) })),
      ]
    : [];

  return (
    <div
      id={uid('filters')}
      className={cn('filters', enFila ? 'flex flex-wrap items-start gap-x-7 gap-y-4' : 'space-y-4')}
    >
      {/* El título encabeza el bloque, no se mete entre los criterios. En fila
          eso se consigue ocupando el ancho entero: la fila es suya y los
          filtros empiezan debajo. */}
      {(conTitulo || hasActiveFilters) && (
      <header
        id={uid('filters__header')}
        className={cn(
          'filters__header flex items-center gap-2',
          conTitulo ? 'justify-between' : 'justify-end',
          enFila ? 'order-first w-full border-b border-ink-200/70 pb-3' : '',
        )}
      >
        {conTitulo && (
          <h2 id={uid('filters__title')} className="filters__title inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
            <SlidersHorizontal size={15} aria-hidden="true" /> Filtros
          </h2>
        )}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            id={uid('filters__clear')}
            className="filters__clear inline-flex items-center gap-1 text-[11px] font-medium text-ink-500 hover:text-ink-900"
          >
            <X size={12} aria-hidden="true" /> Limpiar
          </button>
        )}
      </header>
      )}

      <Grupo nombre={uid('price')} titulo={`Precio en ${moneda}`}>
        <div id={uid('filters__price')} className="filters__price flex items-center gap-2">
          <input
            inputMode="numeric"
            aria-label={`Precio mínimo en ${moneda}`}
            placeholder="Mín"
            value={minPrice}
            onChange={(e) => onMinPrice(soloPrecio(e.target.value))}
            id={uid('filters__price-min')}
            className={cn(campo, enFila && 'w-[104px]')}
          />
          <span id={uid('filters__price-sep')} className="filters__price-sep text-ink-400">–</span>
          <input
            inputMode="numeric"
            aria-label={`Precio máximo en ${moneda}`}
            placeholder="Máx"
            value={maxPrice}
            onChange={(e) => onMaxPrice(soloPrecio(e.target.value))}
            id={uid('filters__price-max')}
            className={cn(campo, enFila && 'w-[104px]')}
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
      </Grupo>

      {/* La moneda sigue mandando sobre el precio y el orden —el rótulo del
          rango lo dice, «Precio en USD»—, pero va aquí y no delante: el orden
          de la fila es el que se pidió. */}
      <Grupo nombre={uid('currency')} titulo="Moneda">
        <div id={uid('filters__currency')} className="filters__currency flex flex-wrap gap-2">
          <Chip id={uid('filters__currency-usd')} activo={moneda === 'USD'} onClick={() => onMoneda('USD')} icon={<DollarSign size={13} aria-hidden="true" />}>
            USD primero
          </Chip>
          <Chip id={uid('filters__currency-cup')} activo={moneda === 'CUP'} onClick={() => onMoneda('CUP')} icon={<Banknote size={13} aria-hidden="true" />}>
            CUP primero
          </Chip>
        </div>
      </Grupo>

      {/* En la barra, la ubicación se queda con lo que sobra de la fila: así
          sigue a la derecha de la moneda y, si el municipio no cabe, baja
          dentro de su grupo en vez de empujar el grupo entero a otra fila. */}
      <Grupo nombre={uid('only')} titulo="Ubicación" className={enFila ? 'min-w-0 flex-1' : undefined}>
        <div id={uid('filters__only')} className={cn('filters__only flex gap-2', enFila ? 'flex-wrap items-center' : 'flex-col items-start')}>
          <Chip id={uid('filters__only-near')} activo={nearMe} onClick={onLocateMe} icon={<MapPin size={13} aria-hidden="true" />}>
            {locating ? 'Buscando…' : 'Cerca de mí'}
          </Chip>

          {/* La zona se elige con desplegables: son 16 provincias y hasta 19
              municipios, demasiados para chips. «Todas las provincias» es no
              filtrar, pero se dice en voz alta para que se vea que el filtro
              existe y en qué está. El municipio solo aparece con una provincia
              elegida: sin ella no hay lista que ofrecer. */}
          <ZoneSelect
            id={uid('filters__province')}
            label="Provincia"
            valor={provincia}
            opciones={opcionesProvincia}
            onCambio={onProvincia}
            className={enFila ? undefined : 'w-full'}
            claseBoton={cn('filters__province', selector(Boolean(provincia)))}
          />

          {provincia && (
            <ZoneSelect
              id={uid('filters__municipality')}
              label={`Municipio de ${provincia}`}
              valor={municipio}
              opciones={opcionesMunicipio}
              onCambio={onMunicipio}
              className={enFila ? undefined : 'w-full'}
              claseBoton={cn('filters__municipality', selector(Boolean(municipio)))}
            />
          )}
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
        <Grupo nombre={uid('category')} titulo="Categoría" className={enFila ? 'w-full' : undefined}>
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

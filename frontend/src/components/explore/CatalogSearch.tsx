import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Store, X } from 'lucide-react';
import type { Product } from '@/types';
import { nombreDeCategoria } from '@/lib/categorias';
import { formatPrice } from '@/lib/utils';

/** Cuántas sugerencias se enseñan como mucho. */
const MAX_SUGERENCIAS = 6;
/** Letras mínimas antes de sugerir nada: con una sola, todo coincide. */
const MINIMO_PARA_SUGERIR = 2;

interface CatalogSearchProps {
  /** Lo que hay cargado. Las sugerencias salen de aquí, sin pedir nada. */
  productos: Product[];
  valor: string;
  onBuscar: (valor: string) => void;
}

/**
 * El buscador del catálogo, en el cuerpo de la página.
 *
 * Antes vivía en la cabecera, plegado detrás de una lupa. Buscar es lo primero
 * que hace quien entra en Agora, así que ocupa el sitio que le toca: arriba de
 * los resultados, abierto y visible.
 *
 * Elegir una sugerencia **no abre el producto**: escribe ese texto en la
 * búsqueda y deja la lista filtrada, igual que pulsar una categoría o un rango
 * de precio. Así el recorrido es siempre el mismo —se acota y luego se elige—,
 * y no se salta del buscador a una ficha sin haber visto qué más había.
 */
export function CatalogSearch({ productos, valor, onBuscar }: CatalogSearchProps) {
  const [texto, setTexto] = useState(valor);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  // La búsqueda también cambia desde fuera (la URL, o el aspa de un filtro).
  useEffect(() => setTexto(valor), [valor]);

  const sugerencias = useMemo(() => {
    const q = texto.trim().toLowerCase();
    if (q.length < MINIMO_PARA_SUGERIR) return [];
    const coincide = (v?: string) => (v ?? '').toLowerCase().includes(q);
    return productos
      .filter((p) => coincide(p.name) || coincide(nombreDeCategoria(p)) || coincide(p.userEnterprise?.companyName))
      // Primero lo que empieza por lo tecleado: es lo que se suele buscar.
      .sort((a, b) => Number(b.name.toLowerCase().startsWith(q)) - Number(a.name.toLowerCase().startsWith(q)))
      .slice(0, MAX_SUGERENCIAS);
  }, [texto, productos]);

  useEffect(() => {
    if (!abierto) return;
    function fuera(e: MouseEvent) {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [abierto]);

  function aplicar(termino: string) {
    setTexto(termino);
    setAbierto(false);
    onBuscar(termino.trim());
  }

  return (
    <div id="catalog-search" className="catalog-search relative" ref={caja}>
      <form
        id="catalog-search__form"
        className="catalog-search__form relative"
        onSubmit={(e) => {
          e.preventDefault();
          aplicar(texto);
        }}
        role="search"
      >
        <label id="catalog-search__label" className="catalog-search__label sr-only" htmlFor="catalog-search__input">
          Buscar productos o negocios
        </label>
        <Search
          size={18}
          aria-hidden="true"
          className="catalog-search__icon pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
        />
        <input
          id="catalog-search__input"
          className="catalog-search__input h-12 w-full rounded-2xl border border-ink-200 bg-ink-50 pl-11 pr-11 text-base text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-primary focus:bg-transparent"
          type="search"
          autoComplete="off"
          placeholder="Busca productos o negocios…"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
        />
        {texto && (
          <button
            type="button"
            id="catalog-search__clear"
            className="catalog-search__clear absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900"
            aria-label="Quitar la búsqueda"
            onClick={() => aplicar('')}
          >
            <X size={15} aria-hidden="true" />
          </button>
        )}
      </form>

      {abierto && sugerencias.length > 0 && (
        <ul
          id="catalog-search__suggestions"
          className="catalog-search__suggestions absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-ink-200 bg-ink-50 py-1 shadow-lg"
        >
          {sugerencias.map((p) => (
            <li key={p.idProduct} className="catalog-search__option">
              <button
                type="button"
                // `mousedown` y no `click`: el cierre por pulsar fuera se
                // dispara antes y la sugerencia nunca llegaría a recibirlo.
                onMouseDown={(e) => {
                  e.preventDefault();
                  aplicar(p.name);
                }}
                className="catalog-search__suggestion flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-ink-100"
              >
                <span className="catalog-search__suggestion-main min-w-0">
                  <span className="catalog-search__suggestion-name block truncate text-sm text-ink-900">{p.name}</span>
                  {p.userEnterprise?.companyName && (
                    <span className="catalog-search__suggestion-seller mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                      <Store size={11} aria-hidden="true" />
                      <span className="truncate">{p.userEnterprise.companyName}</span>
                    </span>
                  )}
                </span>
                {/* El precio, para decidir sin abrir nada. */}
                <span className="catalog-search__suggestion-price shrink-0 text-sm font-medium text-ink-900">
                  {formatPrice(p.priceUsd, 'USD') ?? formatPrice(p.priceCup, 'CUP')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

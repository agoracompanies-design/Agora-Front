import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, PackageSearch, Store, ArrowRight } from 'lucide-react';
import { listProducts } from '@/api/product';
import type { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Membership } from '@/components/home/Membership';
import { CatalogSearch } from '@/components/explore/CatalogSearch';
import { FiltersPanel } from '@/components/explore/FiltersPanel';
import type { MonedaPrincipal, SortOrder } from '@/components/explore/FiltersPanel';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useProductRatings } from '@/hooks/useProductRatings';
import { nombreDeCategoria } from '@/lib/categorias';

// Dos filas por página: 4 columnas en escritorio. Con `auto-fill` el número
// de columnas variaba con el ancho y las filas nunca cuadraban.
const COLUMNAS = 4;
const PAGE_SIZE = COLUMNAS * 2;
/**
 * Cuántos productos se piden de una vez.
 *
 * El catálogo no se trae entero: con mil productos la primera pantalla tardaría
 * demasiado en aparecer, y aquí eso se paga caro. Se traen por bloques y, al
 * llegar al final del último, un botón pide el siguiente. Dentro de lo cargado
 * se filtra y se pagina en el navegador, que es instantáneo y no gasta red.
 */
const POR_BLOQUE = 200;
const SCROLL_KEY = 'agora_explorar_scroll';


export function ExplorePage() {
  const { notify } = useToast();
  const { isSeller } = useAuth();
  const { categories } = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [minPrice, setMinPrice] = useState(() => searchParams.get('min') ?? '');
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get('max') ?? '');
  const [category, setCategory] = useState<string | null>(() => searchParams.get('cat'));
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => (searchParams.get('sort') === 'desc' ? 'desc' : 'asc'));
  // En qué moneda se leen el mínimo y el máximo del rango.
  const [monedaPrecio, setMonedaPrecio] = useState<MonedaPrincipal>(() =>
    searchParams.get('monedaPrecio') === 'USD' ? 'USD' : 'CUP',
  );
  const [moneda, setMoneda] = useState<MonedaPrincipal>(() => (searchParams.get('moneda') === 'CUP' ? 'CUP' : 'USD'));
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);

  // Cuántos bloques de `POR_BLOQUE` se han traído ya, y si hay uno en camino.
  const [bloques, setBloques] = useState(1);
  const [cargandoMas, setCargandoMas] = useState(false);

  const [nearMe, setNearMe] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(15);
  const [locating, setLocating] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);


  // Keep the URL in sync so filters survive back/forward navigation and can be shared.
  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.q = search;
    if (minPrice) params.min = minPrice;
    if (maxPrice) params.max = maxPrice;
    if (category) params.cat = category;
    if (sortOrder === 'desc') params.sort = 'desc';
    if (moneda === 'CUP') params.moneda = 'CUP';
    if (monedaPrecio === 'USD') params.monedaPrecio = 'USD';
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, minPrice, maxPrice, category, sortOrder, moneda, monedaPrecio, page]);

  // Mirror the URL back into state: the component doesn't remount when a
  // navbar link (e.g. "Más populares") points at "/" with different query
  // params, so without this the filters would silently keep whatever was
  // set before navigating.
  useEffect(() => {
    setSearch(searchParams.get('q') ?? '');
    setMoneda(searchParams.get('moneda') === 'CUP' ? 'CUP' : 'USD');
    setMonedaPrecio(searchParams.get('monedaPrecio') === 'USD' ? 'USD' : 'CUP');
    setMinPrice(searchParams.get('min') ?? '');
    setMaxPrice(searchParams.get('max') ?? '');
    setCategory(searchParams.get('cat'));
    setSortOrder(searchParams.get('sort') === 'desc' ? 'desc' : 'asc');
    setPage(Number(searchParams.get('page')) || 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Primer bloque. Se vuelve a pedir cuando cambia algo que filtra el servidor
  // —la ubicación—, porque entonces lo traído antes ya no vale.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listProducts({
      page: 1,
      limit: POR_BLOQUE,
      latitude: nearMe?.lat,
      longitude: nearMe?.lng,
      radius: nearMe ? radiusKm : undefined,
    })
      .then((data) => {
        if (cancelled) return;
        setRawProducts(data.products);
        setTotal(data.total);
        setBloques(1);
      })
      .catch(() => {
        if (!cancelled) notify('No se pudieron cargar los productos', 'error');
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [minPrice, maxPrice, nearMe, radiusKm, notify]);

  /** Trae el siguiente bloque y lo añade al que ya está en pantalla. */
  async function cargarMas() {
    setCargandoMas(true);
    try {
      const data = await listProducts({
        page: bloques + 1,
        limit: POR_BLOQUE,
        latitude: nearMe?.lat,
        longitude: nearMe?.lng,
        radius: nearMe ? radiusKm : undefined,
      });
      // Por id, no por concatenación a secas: si entre una petición y otra se
      // publica algo, las páginas del servidor se corren y alguno repetiría.
      setRawProducts((previos) => {
        const vistos = new Set(previos.map((p) => p.idProduct));
        return [...previos, ...data.products.filter((p) => !vistos.has(p.idProduct))];
      });
      setTotal(data.total);
      setBloques((n) => n + 1);
    } catch {
      notify('No se pudieron cargar más productos', 'error');
    } finally {
      setCargandoMas(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [minPrice, maxPrice, nearMe, radiusKm, search, category]);


  // Se apunta dónde estaba el scroll mientras se navega por el catálogo. Los
  // filtros y la búsqueda ya viajan en la URL, así que al volver atrás se
  // recuperan solos; esto añade lo que falta: el sitio exacto de la página.
  useEffect(() => {
    const guardar = () => sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    window.addEventListener('scroll', guardar, { passive: true });

    // Mientras se está en el catálogo mandamos nosotros: si no, al volver atrás
    // el navegador restaura su propia posición —medida cuando la página aún era
    // corta— justo después de la nuestra y la pisa. Se devuelve el control al
    // salir, para que al abrir un producto siga apareciendo desde arriba.
    const anterior = history.scrollRestoration;
    history.scrollRestoration = 'manual';

    return () => {
      window.removeEventListener('scroll', guardar);
      history.scrollRestoration = anterior;
    };
  }, []);

  // Y se restaura cuando los productos ya están pintados: antes de eso la
  // página no mide lo suficiente y el navegador ignoraría el salto.
  const scrollRestaurado = useRef(false);
  useEffect(() => {
    if (isLoading || scrollRestaurado.current) return;
    scrollRestaurado.current = true;
    const y = Number(sessionStorage.getItem(SCROLL_KEY) ?? 0);
    if (y <= 0) return;
    // Dos fotogramas de margen: en el primero React ya ha pintado las tarjetas,
    // pero el documento todavía no ha crecido y el navegador recortaría el
    // salto a lo que midiera en ese instante.
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        // Tope: alto del carrusel menos el de la cabecera. Así al volver nunca
        // se esconde el carrusel del todo —queda asomando una franja de su
        // mismo alto bajo la cabecera— en lugar de aterrizar en un corte seco.
        const carrusel = document.querySelector<HTMLElement>('[aria-roledescription="carrusel"]');
        const cabecera = document.querySelector<HTMLElement>('header');
        const tope = Math.max(0, (carrusel?.offsetHeight ?? 0) - (cabecera?.offsetHeight ?? 0));
        window.scrollTo({ top: Math.min(y, tope), behavior: 'instant' as ScrollBehavior });
      }),
    );
    return () => cancelAnimationFrame(id);
  }, [isLoading]);

  const visibleProducts = useMemo(() => {
    let list = rawProducts;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.userEnterprise?.companyName.toLowerCase().includes(q) ||
          nombreDeCategoria(p).toLowerCase().includes(q),
      );
    }
    // El rango se aplica aquí y no en el servidor: el backend lo compara
    // siempre contra priceCup, así que en USD daría resultados de otra moneda.
    const enLaMoneda = (p: Product) => (monedaPrecio === 'USD' ? p.priceUsd : p.priceCup);
    if (minPrice || maxPrice) {
      // Sin precio en esa moneda no hay nada que comparar: queda fuera. Darle
      // un infinito lo colaba en cualquier mínimo, que es peor que excluirlo.
      list = list.filter((p) => {
        const valor = enLaMoneda(p);
        if (valor === null || valor === undefined) return false;
        if (minPrice && valor < Number(minPrice)) return false;
        if (maxPrice && valor > Number(maxPrice)) return false;
        return true;
      });
    }
    if (category) list = list.filter((p) => nombreDeCategoria(p) === category);
    // CUP y USD son independientes y no hay tasa de cambio, así que comparar
    // 180 CUP con 8 USD no significa nada. Se agrupa: delante los que tienen
    // precio en la moneda elegida, detrás el resto, y dentro de cada grupo sí
    // se ordena por precio, que ahí sí es la misma unidad.
    const enMoneda = (p: Product, m: MonedaPrincipal) => (m === 'USD' ? p.priceUsd : p.priceCup);
    const otra: MonedaPrincipal = moneda === 'USD' ? 'CUP' : 'USD';
    const tienePrincipal = (p: Product) => enMoneda(p, moneda) !== null && enMoneda(p, moneda) !== undefined;

    return [...list].sort((a, b) => {
      const aPrincipal = tienePrincipal(a);
      if (aPrincipal !== tienePrincipal(b)) return aPrincipal ? -1 : 1;
      const m = aPrincipal ? moneda : otra;
      const pa = enMoneda(a, m) ?? 0;
      const pb = enMoneda(b, m) ?? 0;
      return sortOrder === 'asc' ? pa - pb : pb - pa;
    });
  }, [rawProducts, search, category, sortOrder, moneda, minPrice, maxPrice, monedaPrecio]);

  function locateMe() {
    if (!navigator.geolocation) {
      notify('Tu navegador no soporta geolocalización', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNearMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        notify('No pudimos acceder a tu ubicación', 'error');
        setLocating(false);
      },
      { timeout: 8000 },
    );
  }

  function selectCategory(c: string) {
    setCategory((current) => (current === c ? null : c));
    setPage(1);
  }

  // Las páginas salen de los resultados filtrados, no del total del catálogo.
  /** Si el servidor guarda más de lo que hay en pantalla. */
  const quedanPorTraer = rawProducts.length < total;
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE));
  const paginaActual = Math.min(page, totalPages);
  const productosDeLaPagina = visibleProducts.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);
  // Solo las de esta página: las calificaciones se piden de una en una, y
  // hacerlo para el catálogo entero serían doscientas peticiones por carga.
  const calificaciones = useProductRatings(productosDeLaPagina);
  const hasActiveFilters = Boolean(minPrice || maxPrice || nearMe || category);

  function clearFilters() {
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setCategory(null);
    setNearMe(null);
  }

  const filtersProps = {
    minPrice,
    maxPrice,
    onMinPrice: setMinPrice,
    onMaxPrice: setMaxPrice,
    sortOrder,
    moneda,
    onMoneda: setMoneda,
    monedaPrecio,
    onMonedaPrecio: setMonedaPrecio,
    onSortOrder: setSortOrder,
    nearMe: Boolean(nearMe),
    onLocateMe: locateMe,
    locating,
    radiusKm,
    onRadiusKm: setRadiusKm,
    categories,
    activeCategory: category,
    onSelectCategory: selectCategory,
    hasActiveFilters,
    onClear: clearFilters,
  };

  return (
    <div>
      {/* El h1 de la página no tiene por qué verse: era un titular decorativo
          y lo que manda aquí es el buscador. */}
      <h1 id="explore__title" className="explore__title sr-only">Explorar productos de tu ciudad</h1>


      <div id="explore__catalog" className="explore__catalog mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6">
        {/* Lo primero de la página: buscar es a lo que se viene. */}
        <div id="explore__search" className="explore__search mb-4">
          <CatalogSearch productos={rawProducts} valor={search} onBuscar={setSearch} />
        </div>

        {/* En móvil no hay panel lateral: los filtros se abren desde aquí. */}
        <div id="explore__mobile-filters" className="explore__mobile-filters mb-4 flex justify-end lg:hidden">
          <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)} icon={<SlidersHorizontal size={15} />}>
            Filtros
          </Button>
        </div>

        <div id="explore__layout" className="explore__layout flex flex-col gap-8 lg:h-[calc(100vh-117px)] lg:flex-row lg:items-start lg:gap-[39px]">
          {/* El panel ocupa el alto de la ventana menos la cabecera, con 20px de aire
              arriba y abajo para no pegarse a nada. Queda fijo mientras se recorre
              el catálogo. */}
          <aside id="explore__sidebar" className="explore__sidebar hidden lg:sticky lg:top-[81px] lg:flex lg:flex-col lg:w-[264px] shrink-0 gap-4">
            <div id="explore__filters-card" className="explore__filters-card rounded-2xl border border-ink-200 bg-ink-50 p-4">
              <FiltersPanel {...filtersProps} ambito="aside" />
            </div>

            {!isSeller && (
              <Link
                to="/vender"
                id="explore__seller-cta" className="explore__seller-cta group flex items-center gap-3 rounded-2xl border border-ink-200 bg-ink-50 p-4 transition-colors hover:border-primary"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-600">
                  <Store size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900">¿Tienes un negocio?</p>
                  <p className="text-xs text-ink-500">Publica tu catálogo en Agora</p>
                </div>
                <ArrowRight size={15} className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </aside>

          <div id="explore__results" className="explore__results flex min-w-0 flex-1 flex-col lg:h-full">
            {isLoading ? (
              <div id="explore__grid-loading" className="explore__grid grid min-h-0 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:flex-1 lg:grid-rows-2">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : visibleProducts.length === 0 ? (
              <EmptyState
                icon={<PackageSearch size={22} />}
                title="No encontramos productos"
                description="Prueba ajustando los filtros o busca con otras palabras."
                action={hasActiveFilters ? <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button> : undefined}
              />
            ) : (
              <div id="explore__results-body" className="explore__results-body flex min-h-0 flex-1 flex-col">
                <div id="explore__grid" className="explore__grid grid min-h-0 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:flex-1 lg:grid-rows-2">
                  {productosDeLaPagina.map((product) => (
                    <ProductCard
                      key={product.idProduct}
                      product={product}
                      moneda={moneda}
                      votos={calificaciones[product.idProduct]?.votos}
                    />
                  ))}
                </div>
                <div id="explore__pagination" className="explore__pagination mt-4 shrink-0">
                  <Pagination page={paginaActual} totalPages={totalPages} onChange={setPage} />
                  {/* Al final de lo cargado, y solo si el servidor tiene más.
                      Se ofrece aquí y no al entrar para que la primera pantalla
                      llegue cuanto antes. */}
                  {quedanPorTraer && paginaActual === totalPages && (
                    <div id="explore__more" className="explore__more mt-4 flex flex-col items-center gap-1.5">
                      <Button variant="outline" onClick={cargarMas} loading={cargandoMas}>
                        Cargar más productos
                      </Button>
                      <p id="explore__more-hint" className="explore__more-hint text-xs text-ink-400">
                        {/* Con una búsqueda puesta hay que decirlo: se está
                            filtrando lo cargado, no el catálogo entero. Cuando
                            el servidor sepa buscar por texto, esto sobra. */}
                        {search
                          ? `Buscando entre ${rawProducts.length} de ${total} productos`
                          : `${rawProducts.length} de ${total} cargados`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <p id="explore__count" className="explore__count mx-auto max-w-6xl px-4 pb-8 text-center text-sm text-ink-500 sm:px-6">
        {total} producto{total === 1 ? '' : 's'} publicados por vendedores en Agora
      </p>

      <HowItWorks />
      {/* Se enseña también a quien ya paga: si sale una promoción de un plan
          superior, es justo a quien tiene uno activo a quien hay que avisar.
          El bloque ya se adapta solo —marca la membresía que ya tienes. */}
      <Membership />

      {filtersOpen && (
        <BottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtrar resultados" fullHeight={0.85} peekHeight={0.85}
          footer={
            <Button className="w-full" size="lg" onClick={() => setFiltersOpen(false)}>
              Aplicar filtros ({visibleProducts.length} resultados)
            </Button>
          }
        >
          <div id="explore__filters-sheet" className="explore__filters-sheet pb-4">
            <FiltersPanel {...filtersProps} ambito="sheet" />
          </div>
        </BottomSheet>
      )}

      <ScrollToTop />
    </div>
  );
}



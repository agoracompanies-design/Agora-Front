import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Mail,
  Phone,
  Store,
  SlidersHorizontal,
  X,
  Package,
  Tag,
} from 'lucide-react';
import type { Product, UserEnterprise } from '@/types';
import { EnterpriseLogo } from '@/components/business/EnterpriseLogo';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme } from '@/context/ThemeContext';
import { listProducts } from '@/api/product';
// Si luego tienes endpoint global:
// import { listAllEnterprises } from '@/api/userEnterprise';

type SortKey = 'name' | 'city' | 'products' | 'recent';

/** Negocio + agregados derivados de sus productos. */
type EnterpriseWithProducts = {
  enterprise: UserEnterprise;
  products: Product[];
  categories: string[];
  productCount: number;
};

export function BusinessListPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [enterprises, setEnterprises] = useState<EnterpriseWithProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  //  Filtros
  const [search, setSearch] = useState('');
  const [city, setCity] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [onlyWithMap, setOnlyWithMap] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [minProducts, setMinProducts] = useState<string>('');
  const [maxProducts, setMaxProducts] = useState<string>('');
  const [sort, setSort] = useState<SortKey>('name');
  const [showFilters, setShowFilters] = useState(false);

  //  Carga de datos
  useEffect(() => {
    setIsLoading(true);

    listProducts({ limit: 9999 })
      .then(({ products }) => {
        const porNegocio = new Map<string, Product[]>();
        for (const p of products) {
          if (!p.userEnterpriseId) continue;
          const lista = porNegocio.get(p.userEnterpriseId) ?? [];
          lista.push(p);
          porNegocio.set(p.userEnterpriseId, lista);
        }

        const result: EnterpriseWithProducts[] = [];
        const vistos = new Set<string>();

        for (const p of products) {
          const ent = p.userEnterprise;
          if (!ent || vistos.has(ent.idUserEnterprise)) continue;
          vistos.add(ent.idUserEnterprise);

          const propios = porNegocio.get(ent.idUserEnterprise) ?? [];
          const categorias = [
            ...new Set(
              propios
                .map((prod) => prod.category?.name)
                .filter((n): n is string => Boolean(n)),
            ),
          ].sort();

          result.push({
            enterprise: ent,
            products: propios,
            categories: categorias,
            productCount: propios.length,
          });
        }

        setEnterprises(result);
      })
      .catch((err) => console.error('Error cargando negocios:', err))
      .finally(() => setIsLoading(false));
  }, []);

  //  Listas únicas para los selects
  const cities = useMemo(
    () =>
      [
        ...new Set(
          enterprises.map((e) => e.enterprise.address?.city).filter(Boolean),
        ),
      ].sort() as string[],
    [enterprises],
  );

  const countries = useMemo(
    () =>
      [
        ...new Set(
          enterprises.map((e) => e.enterprise.address?.country).filter(Boolean),
        ),
      ].sort() as string[],
    [enterprises],
  );

  //  Todas las categorías presentes en el sistema
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    for (const e of enterprises) {
      for (const c of e.categories) set.add(c);
    }
    return [...set].sort();
  }, [enterprises]);

  //  Filtrado + orden
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const min = minProducts ? Number(minProducts) : null;
    const max = maxProducts ? Number(maxProducts) : null;

    const result = enterprises.filter(({ enterprise: e, categories, productCount }) => {
      if (term) {
        const haystack = [
          e.companyName,
          e.address?.city,
          e.address?.country,
          e.address?.street,
          e.contact?.email,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      if (city && e.address?.city !== city) return false;
      if (country && e.address?.country !== country) return false;
      if (onlyWithMap && !(e.latitude && e.longitude)) return false;

      if (category && !categories.includes(category)) return false;

      if (min !== null && productCount < min) return false;
      if (max !== null && productCount > max) return false;

      return true;
    });

    result.sort((a, b) => {
      if (sort === 'name')
        return a.enterprise.companyName.localeCompare(b.enterprise.companyName);
      if (sort === 'city')
        return (a.enterprise.address?.city ?? '').localeCompare(
          b.enterprise.address?.city ?? '',
        );
      if (sort === 'products') return b.productCount - a.productCount;
      return 0;
    });

    return result;
  }, [
    enterprises,
    search,
    city,
    country,
    onlyWithMap,
    category,
    minProducts,
    maxProducts,
    sort,
  ]);

  const hayFiltrosActivos = Boolean(
    search || city || country || onlyWithMap || category || minProducts || maxProducts,
  );

  const limpiarFiltros = () => {
    setSearch('');
    setCity('');
    setCountry('');
    setOnlyWithMap(false);
    setCategory('');
    setMinProducts('');
    setMaxProducts('');
  };

  //  Paleta
  const c = {
    cardBg: isDark ? '#0a0e14' : '#ffffff',
    cardBorder: isDark ? '#232935' : '#e9ecef',
    text: isDark ? '#cbd2dd' : '#475569',
    textStrong: isDark ? '#f4f6f8' : '#16181b',
    textMuted: isDark ? '#7c8598' : '#adb5bd',
    inputBg: isDark ? '#12161f' : '#f8f9fa',
    inputBorder: isDark ? '#232935' : '#dee2e6',
    hover: isDark ? '#12161f' : '#f1f3f5',
    chipBg: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe',
    chipText: isDark ? '#60a5fa' : '#1d4ed8',
  };

  if (isLoading) return <PageSpinner />;

  return (
   
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: c.textStrong,
            margin: 0,
          }}
        >
          Negocios
        </h1>
        <p style={{ fontSize: '.875rem', color: c.text, margin: 0 }}>
          {filtered.length} de {enterprises.length} negocios registrados
        </p>
      </div>

      {/* Barra de búsqueda + toggle filtros */}
      <div
        style={{
          display: 'flex',
          gap: '.5rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: c.textMuted,
              pointerEvents: 'none',
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, ciudad, correo..."
            style={{
              width: '100%',
              padding: '.6rem .75rem .6rem 2.25rem',
              borderRadius: '.5rem',
              border: `1px solid ${c.inputBorder}`,
              background: c.inputBg,
              color: c.textStrong,
              fontSize: '.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '.5rem',
            padding: '.6rem .9rem',
            borderRadius: '.5rem',
            border: `1px solid ${c.inputBorder}`,
            background: showFilters ? c.hover : c.inputBg,
            color: c.textStrong,
            fontSize: '.875rem',
            cursor: 'pointer',
          }}
        >
          <SlidersHorizontal size={16} />
          Filtros
          {hayFiltrosActivos && (
            <span
              style={{
                background: '#1d4ed8',
                color: '#fff',
                borderRadius: '999px',
                fontSize: '.7rem',
                padding: '0 .4rem',
                marginLeft: '.25rem',
              }}
            >
              ●
            </span>
          )}
        </button>

        {hayFiltrosActivos && (
          <button
            onClick={limpiarFiltros}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '.35rem',
              padding: '.6rem .9rem',
              borderRadius: '.5rem',
              border: `1px solid ${c.inputBorder}`,
              background: 'transparent',
              color: c.text,
              fontSize: '.875rem',
              cursor: 'pointer',
            }}
          >
            <X size={14} />
            Limpiar
          </button>
        )}
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '.75rem',
            padding: '1rem',
            borderRadius: '.75rem',
            border: `1px solid ${c.cardBorder}`,
            background: c.cardBg,
            marginBottom: '1rem',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', fontSize: '.8rem', color: c.text }}>
            Ciudad
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{
                padding: '.5rem',
                borderRadius: '.5rem',
                border: `1px solid ${c.inputBorder}`,
                background: c.inputBg,
                color: c.textStrong,
                fontSize: '.875rem',
              }}
            >
              <option value="">Todas</option>
              {cities.map((ci) => (
                <option key={ci} value={ci}>
                  {ci}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', fontSize: '.8rem', color: c.text }}>
            País
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={{
                padding: '.5rem',
                borderRadius: '.5rem',
                border: `1px solid ${c.inputBorder}`,
                background: c.inputBg,
                color: c.textStrong,
                fontSize: '.875rem',
              }}
            >
              <option value="">Todos</option>
              {countries.map((co) => (
                <option key={co} value={co}>
                  {co}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', fontSize: '.8rem', color: c.text }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              <Tag size={12} /> Categoría de productos
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                padding: '.5rem',
                borderRadius: '.5rem',
                border: `1px solid ${c.inputBorder}`,
                background: c.inputBg,
                color: c.textStrong,
                fontSize: '.875rem',
              }}
            >
              <option value="">Todas</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', fontSize: '.8rem', color: c.text }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              <Package size={12} /> Productos (mín.)
            </span>
            <input
              type="number"
              min={0}
              value={minProducts}
              onChange={(e) => setMinProducts(e.target.value)}
              placeholder="Ej: 5"
              style={{
                padding: '.5rem',
                borderRadius: '.5rem',
                border: `1px solid ${c.inputBorder}`,
                background: c.inputBg,
                color: c.textStrong,
                fontSize: '.875rem',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', fontSize: '.8rem', color: c.text }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              <Package size={12} /> Productos (máx.)
            </span>
            <input
              type="number"
              min={0}
              value={maxProducts}
              onChange={(e) => setMaxProducts(e.target.value)}
              placeholder="Ej: 50"
              style={{
                padding: '.5rem',
                borderRadius: '.5rem',
                border: `1px solid ${c.inputBorder}`,
                background: c.inputBg,
                color: c.textStrong,
                fontSize: '.875rem',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', fontSize: '.8rem', color: c.text }}>
            Ordenar por
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              style={{
                padding: '.5rem',
                borderRadius: '.5rem',
                border: `1px solid ${c.inputBorder}`,
                background: c.inputBg,
                color: c.textStrong,
                fontSize: '.875rem',
              }}
            >
              <option value="name">Nombre (A-Z)</option>
              <option value="city">Ciudad (A-Z)</option>
              <option value="products">Más productos primero</option>
              <option value="recent">Más recientes</option>
            </select>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '.5rem',
              fontSize: '.875rem',
              color: c.textStrong,
              alignSelf: 'end',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={onlyWithMap}
              onChange={(e) => setOnlyWithMap(e.target.checked)}
            />
            Solo con ubicación en mapa
          </label>
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Store size={20} />}
          title={
            hayFiltrosActivos
              ? 'Ningún negocio coincide con los filtros'
              : 'Aún no hay negocios registrados'
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}
        >
          {filtered.map(({ enterprise: e, productCount, categories }) => (
            <Link
              key={e.idUserEnterprise}
              to={`/negocios/${e.idUserEnterprise}`}
              style={{
                display: 'block',
                padding: '1rem',
                borderRadius: '.75rem',
                border: `1px solid ${c.cardBorder}`,
                background: c.cardBg,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color .15s, transform .15s',
              }}
              onMouseEnter={(ev) => {
                ev.currentTarget.style.borderColor = '#1d4ed8';
                ev.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(ev) => {
                ev.currentTarget.style.borderColor = c.cardBorder;
                ev.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                <EnterpriseLogo
                  nombre={e.companyName}
                  logo={e.image}
                  className="h-12 w-12"
                  textoClassName="text-base"
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: c.textStrong,
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {e.companyName}
                  </h3>

                  {e.address && (
                    <p
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '.35rem',
                        fontSize: '.8rem',
                        color: c.text,
                        margin: '.35rem 0 0',
                      }}
                    >
                      <MapPin size={12} />
                      {e.address.city}, {e.address.country}
                    </p>
                  )}

                  {e.contact?.phone && (
                    <p
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '.35rem',
                        fontSize: '.8rem',
                        color: c.text,
                        margin: '.2rem 0 0',
                      }}
                    >
                      <Phone size={12} />
                      {e.contact.phone}
                    </p>
                  )}

                  {e.contact?.email && (
                    <p
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '.35rem',
                        fontSize: '.8rem',
                        color: c.text,
                        margin: '.2rem 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Mail size={12} />
                      {e.contact.email}
                    </p>
                  )}

                  <p
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '.35rem',
                      fontSize: '.8rem',
                      color: c.text,
                      margin: '.2rem 0 0',
                    }}
                  >
                    <Package size={12} />
                    {productCount} producto{productCount === 1 ? '' : 's'}
                  </p>

                  {categories.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '.3rem',
                        marginTop: '.5rem',
                      }}
                    >
                      {categories.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          style={{
                            background: c.chipBg,
                            color: c.chipText,
                            borderRadius: '999px',
                            fontSize: '.7rem',
                            padding: '.15rem .5rem',
                            fontWeight: 500,
                          }}
                        >
                          {cat}
                        </span>
                      ))}
                      {categories.length > 3 && (
                        <span
                          style={{
                            background: c.chipBg,
                            color: c.chipText,
                            borderRadius: '999px',
                            fontSize: '.7rem',
                            padding: '.15rem .5rem',
                            fontWeight: 500,
                          }}
                        >
                          +{categories.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
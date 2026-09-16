import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Package,
  Tag,
  Building2,
  DollarSign,
  SlidersHorizontal,
  X,
  Trash2,
  Pencil,
  ImageOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Product, UserEnterprise } from '@/types';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RatingStars } from '@/components/ui/RatingStars';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useProductRatings } from '@/hooks/useProductRatings';
import { listProducts, deleteProduct, productImageUrl } from '@/api/product';
import { formatPrice } from '@/lib/utils';
import { nombreDeCategoria } from '@/lib/categorias';

type SortKey = 'name' | 'price-asc' | 'price-desc' | 'business' | 'category';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function ProductsListPage() {
  const { theme } = useTheme();
  const { notify } = useToast();
  const isDark = theme === 'dark';

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const calificaciones = useProductRatings(products);

  const [search, setSearch] = useState('');
  const [business, setBusiness] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [onlyWithImage, setOnlyWithImage] = useState(false);
  const [sort, setSort] = useState<SortKey>('name');
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [toDelete, setToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    listProducts({ limit: 9999 })
      .then(({ products }) => setProducts(products))
      .catch((err) => console.error('Error cargando productos:', err))
      .finally(() => setIsLoading(false));
  }, []);


  const businesses = useMemo(() => {
    const map = new Map<string, UserEnterprise>();
    for (const p of products) {
      if (p.userEnterprise && !map.has(p.userEnterprise.idUserEnterprise)) {
        map.set(p.userEnterprise.idUserEnterprise, p.userEnterprise);
      }
    }
    return [...map.values()].sort((a, b) =>
      a.companyName.localeCompare(b.companyName, 'es'),
    );
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      const cat = nombreDeCategoria(p);
      if (cat) set.add(cat);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [products]);

  
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;

    const result = products.filter((p) => {
      // Búsqueda
      if (term) {
        const haystack = [
          p.name,
          p.description,
          nombreDeCategoria(p),
          p.userEnterprise?.companyName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      // Negocio
      if (business && p.userEnterpriseId !== business) return false;

      // Categoría
      if (category && nombreDeCategoria(p) !== category) return false;

      // Rango de precio
      const price = p.priceUsd ?? p.priceCup ?? 0;
      if (min !== null && price < min) return false;
      if (max !== null && price > max) return false;

      // Con imagen
      if (onlyWithImage && !productImageUrl(p.image)) return false;

      return true;
    });

    result.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'es');
      if (sort === 'business')
        return (a.userEnterprise?.companyName ?? '').localeCompare(
          b.userEnterprise?.companyName ?? '',
          'es',
        );
      if (sort === 'category')
        return nombreDeCategoria(a).localeCompare(nombreDeCategoria(b), 'es');
      if (sort === 'price-asc') {
        const pa = a.priceUsd ?? a.priceCup ?? 0;
        const pb = b.priceUsd ?? b.priceCup ?? 0;
        return pa - pb;
      }
      if (sort === 'price-desc') {
        const pa = a.priceUsd ?? a.priceCup ?? 0;
        const pb = b.priceUsd ?? b.priceCup ?? 0;
        return pb - pa;
      }
      return 0;
    });

    return result;
  }, [products, search, business, category, priceMin, priceMax, onlyWithImage, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = filtered.slice(start, end);

  useEffect(() => {
    setPage(1);
  }, [search, business, category, priceMin, priceMax, onlyWithImage, sort, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const hayFiltrosActivos = Boolean(
    search || business || category || priceMin || priceMax || onlyWithImage,
  );

  const limpiarFiltros = () => {
    setSearch('');
    setBusiness('');
    setCategory('');
    setPriceMin('');
    setPriceMax('');
    setOnlyWithImage(false);
    setPage(1);
  };

  const pageNumbers = useMemo(() => {
    const total = totalPages;
    const current = safePage;
    const delta = 1;
    const range: (number | '...')[] = [];

    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    range.push(1);
    if (left > 2) range.push('...');
    for (let i = left; i <= right; i++) range.push(i);
    if (right < total - 1) range.push('...');
    if (total > 1) range.push(total);

    return range;
  }, [safePage, totalPages]);

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(toDelete);
      setProducts((prev) => prev.filter((p) => p.idProduct !== toDelete));
      notify('Producto eliminado');
      setToDelete(null);
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'No se pudo eliminar el producto',
        'error',
      );
    } finally {
      setDeleting(false);
    }
  }

  const c = {
    cardBg: isDark ? '#0a0e14' : '#ffffff',
    cardBorder: isDark ? '#232935' : '#e9ecef',
    rowHover: isDark ? '#12161f' : '#f8f9fa',
    text: isDark ? '#cbd2dd' : '#475569',
    textStrong: isDark ? '#f4f6f8' : '#16181b',
    textMuted: isDark ? '#7c8598' : '#adb5bd',
    inputBg: isDark ? '#12161f' : '#f8f9fa',
    inputBorder: isDark ? '#232935' : '#dee2e6',
    hover: isDark ? '#12161f' : '#f1f3f5',
    thumbBg: isDark ? '#12161f' : '#f1f3f5',
    pageActiveBg: isDark ? '#1d4ed8' : '#1d4ed8',
    pageActiveText: '#ffffff',
  };

  const inputStyle: React.CSSProperties = {
    padding: '.5rem',
    borderRadius: '.5rem',
    border: `1px solid ${c.inputBorder}`,
    background: c.inputBg,
    color: c.textStrong,
    fontSize: '.875rem',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '.25rem',
    fontSize: '.8rem',
    color: c.text,
  };

  const pageBtnStyle = (active: boolean, disabled = false): React.CSSProperties => ({
    minWidth: 36,
    height: 36,
    padding: '0 .5rem',
    borderRadius: '.5rem',
    border: `1px solid ${active ? c.pageActiveBg : c.inputBorder}`,
    background: active ? c.pageActiveBg : 'transparent',
    color: active ? c.pageActiveText : c.textStrong,
    fontSize: '.875rem',
    fontWeight: active ? 600 : 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color .15s, border-color .15s',
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '.5rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: c.textStrong,
              margin: 0,
            }}
          >
            Productos
          </h1>
          <p style={{ fontSize: '.875rem', color: c.text, margin: 0 }}>
            {filtered.length} de {products.length} productos publicados
          </p>
        </div>
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
            placeholder="Buscar por nombre, negocio, categoría..."
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
          <label style={labelStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              <Building2 size={12} /> Negocio
            </span>
            <select
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              style={inputStyle}
            >
              <option value="">Todos</option>
              {businesses.map((b) => (
                <option key={b.idUserEnterprise} value={b.idUserEnterprise}>
                  {b.companyName}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              <Tag size={12} /> Categoría
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={inputStyle}
            >
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          
          <label style={labelStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              <DollarSign size={12} /> Precio mín.
            </span>
            <input
              type="number"
              min={0}
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="Ej: 10"
              style={inputStyle}
            />
          </label>

          
          <label style={labelStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              <DollarSign size={12} /> Precio máx.
            </span>
            <input
              type="number"
              min={0}
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="Ej: 500"
              style={inputStyle}
            />
          </label>

          {/* Ordenar */}
          <label style={labelStyle}>
            Ordenar por
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              style={inputStyle}
            >
              <option value="name">Nombre (A-Z)</option>
              <option value="price-asc">Precio (menor primero)</option>
              <option value="price-desc">Precio (mayor primero)</option>
              <option value="business">Negocio (A-Z)</option>
              <option value="category">Categoría (A-Z)</option>
            </select>
          </label>

          {/* Solo con imagen */}
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
              checked={onlyWithImage}
              onChange={(e) => setOnlyWithImage(e.target.checked)}
            />
            Solo con imagen
          </label>
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={20} />}
          title={
            hayFiltrosActivos
              ? 'Ningún producto coincide con los filtros'
              : 'Aún no hay productos publicados'
          }
        />
      ) : (
        <>
          <div
            style={{
              borderRadius: '1rem',
              border: `1px solid ${c.cardBorder}`,
              background: c.cardBg,
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', fontSize: '.875rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    background: c.thumbBg,
                    textAlign: 'left',
                    fontSize: '.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    color: c.textMuted,
                  }}
                >
                  <th style={{ padding: '.75rem', width: 64 }}></th>
                  <th style={{ padding: '.75rem' }}>Producto</th>
                  <th style={{ padding: '.75rem' }}>Negocio</th>
                  <th style={{ padding: '.75rem' }}>Categoría</th>
                  <th style={{ padding: '.75rem' }}>Precio</th>
                  <th style={{ padding: '.75rem' }}>Valoración</th>
                  <th style={{ padding: '.75rem' }}>Stock</th>
                  <th style={{ padding: '.75rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => {
                  const imageUrl = productImageUrl(p.image);
                  const rating = calificaciones[p.idProduct]?.media ?? 0;
                  return (
                    <tr
                      key={p.idProduct}
                      style={{ borderTop: `1px solid ${c.cardBorder}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = c.rowHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Imagen */}
                      <td style={{ padding: '.75rem' }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: '.5rem',
                            background: c.thumbBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: c.textMuted,
                            overflow: 'hidden',
                          }}
                        >
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <ImageOff size={16} />
                          )}
                        </div>
                      </td>

                      {/* Nombre */}
                      <td style={{ padding: '.75rem' }}>
                        <p
                          style={{
                            fontWeight: 500,
                            color: c.textStrong,
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 280,
                          }}
                        >
                          {p.name}
                        </p>
                        {p.description && (
                          <p
                            style={{
                              fontSize: '.75rem',
                              color: c.textMuted,
                              margin: '.15rem 0 0',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 280,
                            }}
                          >
                            {p.description}
                          </p>
                        )}
                      </td>

                      {/* Negocio */}
                      <td style={{ padding: '.75rem', color: c.text }}>
                        {p.userEnterprise?.companyName ?? '—'}
                      </td>

                      {/* Categoría */}
                      <td style={{ padding: '.75rem', color: c.text }}>
                        {nombreDeCategoria(p) || '—'}
                      </td>

                      {/* Precio */}
                      <td style={{ padding: '.75rem', color: c.textStrong, fontWeight: 500 }}>
                        {formatPrice(p.priceUsd, 'USD') ?? formatPrice(p.priceCup, 'CUP') ?? '—'}
                      </td>

                      {/* Valoración */}
                      <td style={{ padding: '.75rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '.35rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span style={{ fontWeight: 500, color: c.textStrong }}>
                            {rating.toFixed(1)}
                          </span>
                          <RatingStars value={rating} size={13} />
                        </span>
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '.75rem' }}>
                        <Badge variant={p.stock ? 'success' : 'danger'}>
                          {p.stock ? 'Disponible' : 'Agotado'}
                        </Badge>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '.75rem', textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            gap: '.25rem',
                          }}
                        >
                          <Link to={`/panel/productos/${p.idProduct}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Pencil size={14} />}
                              aria-label="Editar"
                            />
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={14} />}
                            onClick={() => setToDelete(p.idProduct)}
                            aria-label="Eliminar"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/*  Paginación */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '1rem',
              flexWrap: 'wrap',
              gap: '.75rem',
            }}
          >
            {/* Info + selector por página */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '.75rem',
                fontSize: '.8rem',
                color: c.text,
                flexWrap: 'wrap',
              }}
            >
              <span>
                Mostrando <strong style={{ color: c.textStrong }}>{start + 1}</strong>–
                <strong style={{ color: c.textStrong }}>
                  {Math.min(end, filtered.length)}
                </strong>{' '}
                de <strong style={{ color: c.textStrong }}>{filtered.length}</strong>
              </span>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.35rem',
                }}
              >
                Por página
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{
                    padding: '.3rem .5rem',
                    borderRadius: '.375rem',
                    border: `1px solid ${c.inputBorder}`,
                    background: c.inputBg,
                    color: c.textStrong,
                    fontSize: '.8rem',
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Botones de página */}
            <div style={{ display: 'flex', gap: '.25rem', alignItems: 'center' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                style={pageBtnStyle(false, safePage <= 1)}
                aria-label="Anterior"
              >
                <ChevronLeft size={16} />
              </button>

              {pageNumbers.map((n, i) =>
                n === '...' ? (
                  <span
                    key={`dots-${i}`}
                    style={{
                      padding: '0 .35rem',
                      color: c.textMuted,
                      userSelect: 'none',
                    }}
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    disabled={n === safePage}
                    style={pageBtnStyle(n === safePage)}
                    aria-label={`Página ${n}`}
                    aria-current={n === safePage ? 'page' : undefined}
                  >
                    {n}
                  </button>
                ),
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                style={pageBtnStyle(false, safePage >= totalPages)}
                aria-label="Siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal de eliminar */}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar producto"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  CreditCard,
  User as UserIcon,
  Building2,
  DollarSign,
  SlidersHorizontal,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { Subscription } from '@/api/subscription';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { cancelSubscription, listAllSubscriptions } from '@/api/subscription';
import { formatPrice } from '@/lib/utils';

type SortKey = 'name' | 'cost-asc' | 'cost-desc' | 'recent' | 'expires';

type PlanFilter = 'all' | 'buyer' | 'seller';
type StatusFilter = 'all' | 'active' | 'expired';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function nombreUsuario(s: Subscription): string {
  const u = s.user as any;
  if (!u) return s.userId ? `Usuario ${s.userId.slice(0, 8)}` : '—';
  const nombre = (u.name ?? u.username ?? u.fullName ?? '').toString().trim();
  if (nombre) return nombre;
  const correo = (u.email ?? '').toString().trim();
  if (correo) return correo;
  return s.userId ? `Usuario ${s.userId.slice(0, 8)}` : '—';
}

export function SubscriptionsListPage() {
  const { theme } = useTheme();
  const { notify } = useToast();
  const isDark = theme === 'dark';

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState<PlanFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [costMin, setCostMin] = useState<string>('');
  const [costMax, setCostMax] = useState<string>('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [toDelete, setToDelete] = useState<Subscription | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    listAllSubscriptions()
      .then((data) => setSubscriptions(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Error cargando suscripciones:', err);
        setSubscriptions([]);
        notify('No se pudieron cargar las suscripciones', 'error');
      })
      .finally(() => setIsLoading(false));
  }, [notify]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const min = costMin ? Number(costMin) : null;
    const max = costMax ? Number(costMax) : null;
    const now = Date.now();

    const result = subscriptions.filter((s) => {
      if (term) {
        const u = s.user as any;
        const haystack = [
          s.name,
          s.description,
          u?.name,
          u?.username,
          u?.fullName,
          u?.email,
          s.userEnterprise?.companyName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      if (plan !== 'all' && s.planType !== plan) return false;

      if (status !== 'all') {
        const isActive = s.status && (!s.expiresAt || new Date(s.expiresAt).getTime() > now);
        if (status === 'active' && !isActive) return false;
        if (status === 'expired' && isActive) return false;
      }

      const cost = Number(s.cost);
      if (min !== null && cost < min) return false;
      if (max !== null && cost > max) return false;

      return true;
    });

    result.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'es');
      if (sort === 'cost-asc') return Number(a.cost) - Number(b.cost);
      if (sort === 'cost-desc') return Number(b.cost) - Number(a.cost);
      if (sort === 'recent')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === 'expires') {
        const ea = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
        const eb = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
        return ea - eb;
      }
      return 0;
    });

    return result;
  }, [subscriptions, search, plan, status, costMin, costMax, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = filtered.slice(start, end);

  useEffect(() => {
    setPage(1);
  }, [search, plan, status, costMin, costMax, sort, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const hayFiltrosActivos = Boolean(
    search || plan !== 'all' || status !== 'all' || costMin || costMax,
  );

  const limpiarFiltros = () => {
    setSearch('');
    setPlan('all');
    setStatus('all');
    setCostMin('');
    setCostMax('');
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
      await cancelSubscription(toDelete.idSubscription);
      setSubscriptions((prev) =>
        prev.filter((s) => s.idSubscription !== toDelete.idSubscription),
      );
      notify('Suscripción eliminada');
      setToDelete(null);
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'No se pudo eliminar la suscripción',
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
    pageActiveBg: '#1d4ed8',
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

  function formatDate(value: string | null | undefined) {
    if (!value) return '—';
    const d = new Date(value);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function daysLeft(expiresAt: string | null | undefined): number | null {
    if (!expiresAt) return null;
    return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div>
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
            Suscripciones
          </h1>
          <p style={{ fontSize: '.875rem', color: c.text, margin: 0 }}>
            {filtered.length} de {subscriptions.length} suscripciones
          </p>
        </div>
      </div>

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
            placeholder="Buscar por nombre, usuario, negocio..."
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
            Tipo de plan
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as PlanFilter)}
              style={inputStyle}
            >
              <option value="all">Todos</option>
              <option value="buyer">Comprador</option>
              <option value="seller">Vendedor</option>
            </select>
          </label>

          <label style={labelStyle}>
            Estado
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              style={inputStyle}
            >
              <option value="all">Todos</option>
              <option value="active">Activas</option>
              <option value="expired">Vencidas</option>
            </select>
          </label>

          <label style={labelStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              <DollarSign size={12} /> Costo mín.
            </span>
            <input
              type="number"
              min={0}
              value={costMin}
              onChange={(e) => setCostMin(e.target.value)}
              placeholder="Ej: 10"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              <DollarSign size={12} /> Costo máx.
            </span>
            <input
              type="number"
              min={0}
              value={costMax}
              onChange={(e) => setCostMax(e.target.value)}
              placeholder="Ej: 500"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Ordenar por
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              style={inputStyle}
            >
              <option value="recent">Más recientes</option>
              <option value="name">Nombre (A-Z)</option>
              <option value="cost-asc">Costo (menor primero)</option>
              <option value="cost-desc">Costo (mayor primero)</option>
              <option value="expires">Próximas a vencer</option>
            </select>
          </label>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={20} />}
          title={
            hayFiltrosActivos
              ? 'Ninguna suscripción coincide con los filtros'
              : 'Aún no hay suscripciones'
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
                  <th style={{ padding: '.75rem' }}>Plan</th>
                  <th style={{ padding: '.75rem' }}>Usuario</th>
                  <th style={{ padding: '.75rem' }}>Negocio</th>
                  <th style={{ padding: '.75rem' }}>Tipo</th>
                  <th style={{ padding: '.75rem' }}>Costo</th>
                  <th style={{ padding: '.75rem' }}>Duración</th>
                  <th style={{ padding: '.75rem' }}>Estado</th>
                  <th style={{ padding: '.75rem' }}>Vence</th>
                  <th style={{ padding: '.75rem' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((s) => {
                  const dias = daysLeft(s.expiresAt);
                  const activa = s.status && (dias === null || dias > 0);
                  return (
                    <tr
                      key={s.idSubscription}
                      style={{ borderTop: `1px solid ${c.cardBorder}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = c.rowHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '.75rem' }}>
                        <p
                          style={{
                            fontWeight: 500,
                            color: c.textStrong,
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 200,
                          }}
                        >
                          {s.name}
                        </p>
                        {s.description && (
                          <p
                            style={{
                              fontSize: '.75rem',
                              color: c.textMuted,
                              margin: '.15rem 0 0',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 200,
                            }}
                          >
                            {s.description}
                          </p>
                        )}
                      </td>

                      <td style={{ padding: '.75rem', color: c.text }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '.35rem',
                          }}
                        >
                          <UserIcon size={12} />
                          {nombreUsuario(s)}
                        </span>
                      </td>

                      <td style={{ padding: '.75rem', color: c.text }}>
                        {s.userEnterprise?.companyName ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '.35rem',
                            }}
                          >
                            <Building2 size={12} />
                            {s.userEnterprise.companyName}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td style={{ padding: '.75rem' }}>
                        <Badge variant={s.planType === 'seller' ? 'success' : 'neutral'}>
                          {s.planType === 'seller' ? 'Vendedor' : 'Comprador'}
                        </Badge>
                      </td>

                      <td style={{ padding: '.75rem', color: c.textStrong, fontWeight: 500 }}>
                        {formatPrice(Number(s.cost), 'USD') ?? `${s.cost}`}
                      </td>

                      <td style={{ padding: '.75rem', color: c.text }}>
                        {s.durationDays} días
                      </td>

                      <td style={{ padding: '.75rem' }}>
                        {activa ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '.35rem',
                              color: isDark ? '#4ade80' : '#15803d',
                              fontSize: '.8rem',
                              fontWeight: 500,
                            }}
                          >
                            <CheckCircle2 size={14} />
                            Activa
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '.35rem',
                              color: isDark ? '#f87171' : '#dc2626',
                              fontSize: '.8rem',
                              fontWeight: 500,
                            }}
                          >
                            <XCircle size={14} />
                            Vencida
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '.75rem', color: c.text }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '.35rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Calendar size={12} />
                          {formatDate(s.expiresAt)}
                          {dias !== null && dias > 0 && (
                            <span style={{ color: c.textMuted }}>
                              ({dias} d)
                            </span>
                          )}
                        </span>
                      </td>

                      <td style={{ padding: '.75rem' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={14} />}
                          onClick={() => setToDelete(s)}
                          aria-label="Eliminar"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar suscripción"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
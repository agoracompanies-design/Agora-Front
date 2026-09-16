import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Mail,
  User as UserIcon,
  SlidersHorizontal,
  X,
  Package,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Calendar,
  Info,
} from 'lucide-react';
/** Lo que el panel enseña de cada usuario. `AuthUser` es la sesión y no trae
 *  nombre ni correo, así que no sirve aquí. */
interface UsuarioPanel {
  id: string;
  name: string;
  email: string;
  role: string;
}
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { listProducts } from '@/api/product';
import { deleteAccount } from '@/api/user';

type SortKey = 'name' | 'email' | 'products' | 'recent';
type RoleFilter = 'all' | 'seller' | 'buyer';
type SubscriptionRange = 'all' | 'active' | 'expiring' | 'expired';

/** Usuario + agregados derivados de sus productos / suscripción. */
type UserWithData = {
  user: UsuarioPanel;
  productCount: number;
  isSeller: boolean;
  /** Días que le quedan de suscripción (null = sin suscripción o no hay datos). */
  subscriptionDays: number | null;
};

const SUBSCRIPTION_FILTER_AVAILABLE = false;

export function UsersListPage() {
  const { theme } = useTheme();
  const { notify } = useToast();
  const isDark = theme === 'dark';

  const [users, setUsers] = useState<UserWithData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  //  Filtros generales
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [sort, setSort] = useState<SortKey>('name');
  const [showFilters, setShowFilters] = useState(false);

  //  Filtros SOLO para vendedores
  const [minProducts, setMinProducts] = useState<string>('');
  const [maxProducts, setMaxProducts] = useState<string>('');
  const [subscriptionRange, setSubscriptionRange] =
    useState<SubscriptionRange>('all');

  //  Eliminar
  const [toDelete, setToDelete] = useState<UserWithData | null>(null);
  const [deleting, setDeleting] = useState(false);

  //  Carga de datos
  useEffect(() => {
    setIsLoading(true);

    listProducts({ limit: 9999 })
      .then(({ products }) => {
        const porUsuario = new Map<string, number>();
        const datos = new Map<string, UsuarioPanel>();

        for (const p of products) {
          const uid = (p as any).userId ?? p.userEnterprise?.userId;
          if (!uid) continue;

          porUsuario.set(uid, (porUsuario.get(uid) ?? 0) + 1);

          if (!datos.has(uid)) {
            const ent = p.userEnterprise;
            datos.set(uid, {
              id: uid,
              name: ent?.companyName ?? `Usuario ${uid.slice(0, 6)}`,
              email: ent?.contact?.email ?? '',
              role: 'seller',
            });
          }
        }

        const result: UserWithData[] = [];
        for (const [uid, user] of datos) {
          result.push({
            user,
            productCount: porUsuario.get(uid) ?? 0,
            isSeller: true,
            subscriptionDays: null,
          });
        }

        setUsers(result);
      })
      .catch((err) => console.error('Error cargando usuarios:', err))
      .finally(() => setIsLoading(false));
  }, []);

  //  Filtrado + orden
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const min = minProducts ? Number(minProducts) : null;
    const max = maxProducts ? Number(maxProducts) : null;

    const result = users.filter(({ user, productCount, isSeller, subscriptionDays }) => {
      // Búsqueda libre
      if (term) {
        const haystack = [user.name, user.email, user.id]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      // Rol
      if (role === 'seller' && !isSeller) return false;
      if (role === 'buyer' && isSeller) return false;

      //  Los filtros de vendedor SOLO se aplican si el usuario es vendedor
      if (isSeller) {
        if (min !== null && productCount < min) return false;
        if (max !== null && productCount > max) return false;

        //  Solo filtra por suscripción si el endpoint existe
        if (SUBSCRIPTION_FILTER_AVAILABLE && subscriptionRange !== 'all') {
          if (subscriptionDays === null) {
            if (subscriptionRange !== 'expired') return false;
          } else {
            if (subscriptionRange === 'active' && subscriptionDays <= 0) return false;
            if (subscriptionRange === 'expiring' && (subscriptionDays <= 0 || subscriptionDays > 7))
              return false;
            if (subscriptionRange === 'expired' && subscriptionDays > 0) return false;
          }
        }
      }

      return true;
    });

    result.sort((a, b) => {
      if (sort === 'name')
        return (a.user.name ?? '').localeCompare(b.user.name ?? '');
      if (sort === 'email')
        return (a.user.email ?? '').localeCompare(b.user.email ?? '');
      if (sort === 'products') return b.productCount - a.productCount;
      return 0;
    });

    return result;
  }, [
    users,
    search,
    role,
    minProducts,
    maxProducts,
    subscriptionRange,
    sort,
  ]);

  const hayFiltrosActivos = Boolean(
    search ||
      role !== 'all' ||
      minProducts ||
      maxProducts ||
      (SUBSCRIPTION_FILTER_AVAILABLE && subscriptionRange !== 'all'),
  );

  const limpiarFiltros = () => {
    setSearch('');
    setRole('all');
    setMinProducts('');
    setMaxProducts('');
    setSubscriptionRange('all');
  };

  //  Eliminar
  const confirmarEliminar = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteAccount(toDelete.user.id);
      setUsers((prev) => prev.filter((u) => u.user.id !== toDelete.user.id));
      notify('Usuario eliminado', 'success');
      setToDelete(null);
    } catch (err) {
      console.error(err);
      notify('No se pudo eliminar el usuario', 'error');
    } finally {
      setDeleting(false);
    }
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
    danger: isDark ? '#f87171' : '#dc2626',
    dangerBg: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)',
  };

  const selectStyle: React.CSSProperties = {
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
          Usuarios
        </h1>
        <p style={{ fontSize: '.875rem', color: c.text, margin: 0 }}>
          {filtered.length} de {users.length} usuarios registrados
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
            placeholder="Buscar por nombre, correo..."
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
            padding: '1rem',
            borderRadius: '.75rem',
            border: `1px solid ${c.cardBorder}`,
            background: c.cardBg,
            marginBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* 🔹 Filtros generales */}
          <div>
            <p
              style={{
                fontSize: '.75rem',
                fontWeight: 600,
                color: c.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '.05em',
                margin: '0 0 .5rem',
              }}
            >
              Generales
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '.75rem',
              }}
            >
              <label style={labelStyle}>
                Rol
                <select
                  value={role}
                  onChange={(e) => {
                    const nuevoRol = e.target.value as RoleFilter;
                    setRole(nuevoRol);
                    //  Si deja de ser vendedor, limpiamos sus filtros
                    if (nuevoRol !== 'seller') {
                      setMinProducts('');
                      setMaxProducts('');
                      setSubscriptionRange('all');
                    }
                  }}
                  style={selectStyle}
                >
                  <option value="all">Todos</option>
                  <option value="seller">Vendedores</option>
                  <option value="buyer">Compradores</option>
                </select>
              </label>

              <label style={labelStyle}>
                Ordenar por
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  style={selectStyle}
                >
                  <option value="name">Nombre (A-Z)</option>
                  <option value="email">Email (A-Z)</option>
                  <option value="products">Más productos primero</option>
                  <option value="recent">Más recientes</option>
                </select>
              </label>
            </div>
          </div>

          {/*  Filtros SOLO para vendedores — solo si el rol es "seller" */}
          {role === 'seller' && (
            <div>
              <p
                style={{
                  fontSize: '.75rem',
                  fontWeight: 600,
                  color: c.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                  margin: '0 0 .5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.35rem',
                }}
              >
                <ShieldCheck size={12} /> Filtros de vendedores
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '.75rem',
                }}
              >
                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                    <Package size={12} /> Productos (mín.)
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={minProducts}
                    onChange={(e) => setMinProducts(e.target.value)}
                    placeholder="Ej: 1"
                    style={{
                      ...selectStyle,
                      color: c.textStrong,
                    }}
                  />
                </label>

                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                    <Package size={12} /> Productos (máx.)
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={maxProducts}
                    onChange={(e) => setMaxProducts(e.target.value)}
                    placeholder="Ej: 100"
                    style={{
                      ...selectStyle,
                      color: c.textStrong,
                    }}
                  />
                </label>

                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                    <Calendar size={12} /> Suscripción
                  </span>
                  <select
                    value={subscriptionRange}
                    onChange={(e) =>
                      setSubscriptionRange(e.target.value as SubscriptionRange)
                    }
                    disabled={!SUBSCRIPTION_FILTER_AVAILABLE}
                    style={{
                      ...selectStyle,
                      opacity: SUBSCRIPTION_FILTER_AVAILABLE ? 1 : 0.55,
                      cursor: SUBSCRIPTION_FILTER_AVAILABLE ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <option value="all">Todas</option>
                    <option value="active">Activas</option>
                    <option value="expiring">Por vencer (≤7 días)</option>
                    <option value="expired">Vencidas / sin suscripción</option>
                  </select>
                </label>
              </div>

              {!SUBSCRIPTION_FILTER_AVAILABLE && (
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '.35rem',
                    fontSize: '.75rem',
                    color: c.textMuted,
                    margin: '.5rem 0 0',
                    fontStyle: 'italic',
                  }}
                >
                  <Info size={12} />
                  El filtro de suscripción estará disponible cuando el backend
                  exponga las suscripciones de todos los usuarios.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<UserIcon size={20} />}
          title={
            hayFiltrosActivos
              ? 'Ningún usuario coincide con los filtros'
              : 'Aún no hay usuarios registrados'
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
          {filtered.map(({ user, productCount, isSeller, subscriptionDays }) => (
            <div
              key={user.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '1rem',
                borderRadius: '.75rem',
                border: `1px solid ${c.cardBorder}`,
                background: c.cardBg,
                transition: 'border-color .15s',
              }}
            >
              <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe',
                    color: isDark ? '#60a5fa' : '#1d4ed8',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                  }}
                >
                  {(user.name ?? user.email ?? '?').charAt(0).toUpperCase()}
                </div>

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
                    {user.name ?? 'Sin nombre'}
                  </h3>

                  {user.email && (
                    <p
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '.35rem',
                        fontSize: '.8rem',
                        color: c.text,
                        margin: '.35rem 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Mail size={12} />
                      {user.email}
                    </p>
                  )}

                  {isSeller && (
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
                  )}

                  {isSeller && subscriptionDays !== null && (
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
                      <Calendar size={12} />
                      {subscriptionDays > 0
                        ? `${subscriptionDays} días restantes`
                        : 'Suscripción vencida'}
                    </p>
                  )}

                  <div style={{ marginTop: '.5rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '.3rem',
                        background: isSeller
                          ? isDark
                            ? 'rgba(34,197,94,0.15)'
                            : '#dcfce7'
                          : isDark
                            ? 'rgba(148,163,184,0.15)'
                            : '#f1f5f9',
                        color: isSeller
                          ? isDark
                            ? '#4ade80'
                            : '#15803d'
                          : c.text,
                        borderRadius: '999px',
                        fontSize: '.7rem',
                        padding: '.15rem .55rem',
                        fontWeight: 500,
                      }}
                    >
                      {isSeller ? <ShieldCheck size={11} /> : <ShieldOff size={11} />}
                      {isSeller ? 'Vendedor' : 'Comprador'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div
                style={{
                  display: 'flex',
                  gap: '.5rem',
                  marginTop: '1rem',
                  paddingTop: '.75rem',
                  borderTop: `1px solid ${c.cardBorder}`,
                }}
              >
                <button
                  onClick={() =>
                    setToDelete({ user, productCount, isSeller, subscriptionDays })
                  }
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '.4rem',
                    padding: '.5rem',
                    borderRadius: '.5rem',
                    border: `1px solid ${c.danger}`,
                    background: 'transparent',
                    color: c.danger,
                    fontSize: '.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = c.dangerBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación */}
      {toDelete && (
        <div
          onClick={() => !deleting && setToDelete(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: c.cardBg,
              border: `1px solid ${c.cardBorder}`,
              borderRadius: '.75rem',
              padding: '1.5rem',
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: c.textStrong,
                margin: 0,
                marginBottom: '.5rem',
              }}
            >
              Eliminar usuario
            </h3>
            <p style={{ fontSize: '.875rem', color: c.text, margin: 0, marginBottom: '1.25rem' }}>
              ¿Seguro que quieres eliminar a{' '}
              <strong style={{ color: c.textStrong }}>
                {toDelete.user.name ?? toDelete.user.email ?? toDelete.user.id}
              </strong>
              ? Esta acción no se puede deshacer.
            </p>

            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setToDelete(null)}
                disabled={deleting}
                style={{
                  padding: '.55rem 1rem',
                  borderRadius: '.5rem',
                  border: `1px solid ${c.inputBorder}`,
                  background: 'transparent',
                  color: c.textStrong,
                  fontSize: '.875rem',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={deleting}
                style={{
                  padding: '.55rem 1rem',
                  borderRadius: '.5rem',
                  border: 'none',
                  background: c.danger,
                  color: '#fff',
                  fontSize: '.875rem',
                  fontWeight: 500,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
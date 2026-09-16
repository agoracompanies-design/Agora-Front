import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

type Business = {
  idUserEnterprise: string;
  companyName: string;
  address?: { city?: string; country?: string } | null;
  contact?: { email?: string; phone?: string } | null;
  subscriptionPlan?: string;    // ej: 'Plan Vendedor', 'Prueba gratuita'
  subscriptionStatus?: boolean;
  subscriptionExpiresAt?: string | null;
  createdAt?: string;
};

export function BusinessesTable({ businesses }: { businesses: Business[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const c = {
    cardBg: isDark ? '#0a0e14' : '#ffffff',
    cardBorder: isDark ? '#232935' : '#e9ecef',
    headBg: isDark ? '#12161f' : '#f8f9fa',
    headText: isDark ? '#98a1b3' : '#6c757d',
    rowText: isDark ? '#cbd2dd' : '#495057',
    rowTextStrong: isDark ? '#f4f6f8' : '#16181b',
    rowDivider: isDark ? '#232935' : '#f1f3f5',
    rowHover: isDark ? '#12161f' : '#f8f9fa',
    title: isDark ? '#f4f6f8' : '#16181b',
    subtitle: isDark ? '#98a1b3' : '#6c757d',
    empty: isDark ? '#7c8598' : '#adb5bd',
    okBg: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7',
    okText: isDark ? '#4ade80' : '#15803d',
    offBg: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2',
    offText: isDark ? '#f87171' : '#b91c1c',
    iconBg: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe',
    iconFg: isDark ? '#60a5fa' : '#1d4ed8',
  };

  return (
    <div
      style={{
        background: c.cardBg,
        border: `1px solid ${c.cardBorder}`,
        borderRadius: '.75rem',
        overflow: 'hidden',
        transition: 'background-color .25s, border-color .25s',
        width: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '.75rem',
          padding: 'clamp(.75rem, 1.5vw, 1.25rem)',
          borderBottom: `1px solid ${c.cardBorder}`,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              fontSize: 'clamp(.9rem, .4vw + .75rem, 1.05rem)',
              fontWeight: 600,
              color: c.title,
              margin: 0,
            }}
          >
            Negocios afiliados
          </h3>
          <p
            style={{
              fontSize: 'clamp(.7rem, .3vw + .6rem, .85rem)',
              color: c.subtitle,
              margin: 0,
            }}
          >
            Últimos negocios registrados en la plataforma
          </p>
        </div>
        <Link
          to="/panel/negocios"
          style={{
            fontSize: 'clamp(.7rem, .3vw + .6rem, .85rem)',
            color: c.rowTextStrong,
            textDecoration: 'none',
            border: `1px solid ${c.cardBorder}`,
            padding: '.35rem .75rem',
            borderRadius: '.5rem',
            flexShrink: 0,
          }}
        >
          Ver todos
        </Link>
      </div>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 'clamp(.72rem, .35vw + .6rem, .85rem)',
          }}
        >
          <thead>
            <tr style={{ background: c.headBg }}>
              {['Negocio', 'Ciudad', 'Contacto', 'Plan', 'Estado', 'Vence'].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: 'clamp(.5rem, 1vw, .75rem) clamp(.75rem, 1.5vw, 1.25rem)',
                      fontSize: 'clamp(.65rem, .3vw + .55rem, .75rem)',
                      textTransform: 'uppercase',
                      color: c.headText,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {businesses.slice(0, 8).map((b) => (
              <tr
                key={b.idUserEnterprise}
                style={{
                  borderTop: `1px solid ${c.rowDivider}`,
                  transition: 'background-color .15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = c.rowHover)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                <td
                  style={{
                    padding: 'clamp(.5rem, 1vw, .75rem) clamp(.75rem, 1.5vw, 1.25rem)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <div
                      style={{
                        width: 'clamp(1.75rem, 2vw, 2rem)',
                        height: 'clamp(1.75rem, 2vw, 2rem)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '.5rem',
                        background: c.iconBg,
                        color: c.iconFg,
                        flexShrink: 0,
                      }}
                    >
                      <Building2 size={14} />
                    </div>
                    <span
                      style={{
                        fontWeight: 500,
                        color: c.rowTextStrong,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '14rem',
                      }}
                    >
                      {b.companyName}
                    </span>
                  </div>
                </td>
                <td
                  style={{
                    padding: 'clamp(.5rem, 1vw, .75rem) clamp(.75rem, 1.5vw, 1.25rem)',
                    color: c.rowText,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {b.address?.city ?? '—'}
                </td>
                <td
                  style={{
                    padding: 'clamp(.5rem, 1vw, .75rem) clamp(.75rem, 1.5vw, 1.25rem)',
                    color: c.rowText,
                    whiteSpace: 'nowrap',
                    maxWidth: '12rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {b.contact?.email ?? b.contact?.phone ?? '—'}
                </td>
                <td
                  style={{
                    padding: 'clamp(.5rem, 1vw, .75rem) clamp(.75rem, 1.5vw, 1.25rem)',
                    color: c.rowText,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {b.subscriptionPlan ?? '—'}
                </td>
                <td
                  style={{
                    padding: 'clamp(.5rem, 1vw, .75rem) clamp(.75rem, 1.5vw, 1.25rem)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '.125rem .5rem',
                      borderRadius: '9999px',
                      fontSize: 'clamp(.65rem, .3vw + .55rem, .75rem)',
                      background: b.subscriptionStatus ? c.okBg : c.offBg,
                      color: b.subscriptionStatus ? c.okText : c.offText,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {b.subscriptionStatus ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td
                  style={{
                    padding: 'clamp(.5rem, 1vw, .75rem) clamp(.75rem, 1.5vw, 1.25rem)',
                    color: c.rowText,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {b.subscriptionExpiresAt
                    ? new Date(b.subscriptionExpiresAt).toLocaleDateString()
                    : '—'}
                </td>
              </tr>
            ))}
            {businesses.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: '2rem 1.25rem',
                    textAlign: 'center',
                    color: c.empty,
                  }}
                >
                  No hay negocios registrados todavía
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
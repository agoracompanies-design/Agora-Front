import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

type Service = {
  idService: string;
  name: string;
  description?: string;
  priceCup?: number | null;
  priceUsd?: number | null;
};

export function RecentServicesTable({ services }: { services: Service[] }) {
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
    iconBg: isDark ? 'rgba(168,85,247,0.2)' : '#f3e8ff',
    iconColor: isDark ? '#c084fc' : '#7e22ce',
  };

  return (
    <div
      style={{
        background: c.cardBg,
        border: `1px solid ${c.cardBorder}`,
        borderRadius: '1rem',
        overflow: 'hidden',
        transition: 'background-color .2s, border-color .2s',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem',
          borderBottom: `1px solid ${c.cardBorder}`,
          transition: 'border-color .2s',
        }}
      >
        <div>
          <h3 style={{ fontWeight: 600, color: c.title, margin: 0 }}>
            Servicios recientes
          </h3>
          <p style={{ fontSize: '.875rem', color: c.subtitle, margin: 0 }}>
            Últimos servicios publicados
          </p>
        </div>
        <Link
          to="/panel/servicios"
          style={{
            fontSize: '.875rem',
            color: c.rowTextStrong,
            textDecoration: 'none',
            border: `1px solid ${c.cardBorder}`,
            padding: '.375rem .75rem',
            borderRadius: '.5rem',
            transition: 'background-color .15s',
          }}
        >
          Ver todos
        </Link>
      </div>

      {/* Tabla */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '.875rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: c.headBg, transition: 'background-color .2s' }}>
              {['Servicio', 'Descripción', 'Precio CUP', 'Precio USD'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: '.75rem 1.25rem',
                    fontSize: '.75rem',
                    textTransform: 'uppercase',
                    color: c.headText,
                    fontWeight: 500,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.slice(0, 5).map((s) => (
              <tr
                key={s.idService}
                style={{
                  borderTop: `1px solid ${c.rowDivider}`,
                  transition: 'background-color .15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = c.rowHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '.75rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <div
                      style={{
                        width: '2rem',
                        height: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '.5rem',
                        background: c.iconBg,
                        color: c.iconColor,
                        flexShrink: 0,
                      }}
                    >
                      <Wrench size={14} />
                    </div>
                    <span style={{ fontWeight: 500, color: c.rowTextStrong }}>
                      {s.name}
                    </span>
                  </div>
                </td>
                <td
                  style={{
                    padding: '.75rem 1.25rem',
                    color: c.rowText,
                    maxWidth: '20rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.description}
                </td>
                <td style={{ padding: '.75rem 1.25rem', color: c.rowText }}>
                  {s.priceCup ? `$${s.priceCup}` : '—'}
                </td>
                <td style={{ padding: '.75rem 1.25rem', color: c.rowText }}>
                  {s.priceUsd ? `$${s.priceUsd}` : '—'}
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '2rem 1.25rem',
                    textAlign: 'center',
                    color: c.empty,
                  }}
                >
                  No hay servicios todavía
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
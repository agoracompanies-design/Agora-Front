import { User, Shield } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

type UserType = {
  id: string;
  username: string;
  permissions?: string[];
  planType?: string;
  createdAt?: string;
};

export function UsersTable({ users }: { users: UserType[] }) {
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
    iconBg: isDark ? 'rgba(168,85,247,0.15)' : '#f3e8ff',
    iconFg: isDark ? '#c084fc' : '#7e22ce',
    tagBg: isDark ? '#12161f' : '#f1f3f5',
    tagText: isDark ? '#cbd2dd' : '#495057',
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
            Usuarios del sistema
          </h3>
          <p
            style={{
              fontSize: 'clamp(.7rem, .3vw + .6rem, .85rem)',
              color: c.subtitle,
              margin: 0,
            }}
          >
            Todos los usuarios registrados
          </p>
        </div>
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
              {['Usuario', 'Plan', 'Permisos', 'Registrado'].map((h) => (
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
              ))}
            </tr>
          </thead>
          <tbody>
            {users.slice(0, 8).map((u) => (
              <tr
                key={u.id}
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
                        borderRadius: '50%',
                        background: c.iconBg,
                        color: c.iconFg,
                        flexShrink: 0,
                      }}
                    >
                      <User size={14} />
                    </div>
                    <span style={{ fontWeight: 500, color: c.rowTextStrong }}>
                      {u.username}
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
                  {u.planType ?? '—'}
                </td>
                <td
                  style={{
                    padding: 'clamp(.5rem, 1vw, .75rem) clamp(.75rem, 1.5vw, 1.25rem)',
                    color: c.rowText,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '.25rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Shield size={14} />
                    <span>{u.permissions?.length ?? 0} permisos</span>
                  </div>
                </td>
                <td
                  style={{
                    padding: 'clamp(.5rem, 1vw, .75rem) clamp(.75rem, 1.5vw, 1.25rem)',
                    color: c.rowText,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString()
                    : '—'}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '2rem 1.25rem',
                    textAlign: 'center',
                    color: c.empty,
                  }}
                >
                  No hay usuarios registrados todavía
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
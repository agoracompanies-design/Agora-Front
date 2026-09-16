import type { ReactNode } from 'react';
import { Package, Wrench, Star, CreditCard } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

type Stat = {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  color: { bg: string; fg: string };
};

export function StatsCards({
  productCount,
  serviceCount,
  avgRating,
  activeSubscriptions,
}: {
  productCount: number;
  serviceCount: number;
  avgRating: number;
 
  activeSubscriptions: number;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const stats: Stat[] = [
    {
      icon: <Package size={20} />,
      label: 'Productos publicados',
      value: productCount,
      trend: 'En tu catálogo',
      color: {
        bg: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe',
        fg: isDark ? '#60a5fa' : '#1d4ed8',
      },
    },
    {
      icon: <Wrench size={20} />,
      label: 'Servicios ofrecidos',
      value: serviceCount,
      trend: 'En tu catálogo',
      color: {
        bg: isDark ? 'rgba(168,85,247,0.15)' : '#f3e8ff',
        fg: isDark ? '#c084fc' : '#7e22ce',
      },
    },
    {
      icon: <Star size={20} />,
      label: 'Valoración media',
      value: avgRating > 0 ? avgRating.toFixed(1) : '—',
      trend:
        avgRating > 0
          ? avgRating >= 4
            ? 'Excelente'
            : avgRating >= 3
              ? 'Buena'
              : 'Mejorable'
          : 'Sin valoraciones',
      color: {
        bg: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7',
        fg: isDark ? '#4ade80' : '#15803d',
      },
    },
    {
      icon: <CreditCard size={20} />,
      label: 'Suscripciones activas',
      value: activeSubscriptions,
      trend: 'En el sistema',
      color: {
        bg: isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7',
        fg: isDark ? '#fbbf24' : '#b45309',
      },
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
        gap: 'clamp(.75rem, 1.5vw, 1rem)',
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            background: isDark ? '#0a0e14' : '#ffffff',
            border: `1px solid ${isDark ? '#232935' : '#e9ecef'}`,
            borderRadius: '.75rem',
            padding: 'clamp(.875rem, 1.5vw, 1.25rem)',
            transition: 'background-color .25s, border-color .25s',
          }}
        >
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '.75rem',
              background: s.color.bg,
              color: s.color.fg,
              marginBottom: '.75rem',
            }}
          >
            {s.icon}
          </div>
          <p
            style={{
              fontSize: 'clamp(1.25rem, 1.5vw + .75rem, 1.75rem)',
              fontWeight: 600,
              color: isDark ? '#f4f6f8' : '#16181b',
              margin: 0,
            }}
          >
            {s.value}
          </p>
          <p
            style={{
              fontSize: 'clamp(.8rem, .3vw + .7rem, .9rem)',
              color: isDark ? '#98a1b3' : '#6c757d',
              margin: 0,
            }}
          >
            {s.label}
          </p>
          {s.trend && (
            <p
              style={{
                fontSize: 'clamp(.7rem, .25vw + .6rem, .75rem)',
                color: isDark ? '#7c8598' : '#adb5bd',
                marginTop: '.25rem',
                marginBottom: 0,
              }}
            >
              {s.trend}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
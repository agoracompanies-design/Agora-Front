import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Package,
  Wrench,
  Tag,
  Star,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const NAV_ITEMS = [
  { to: '/administration', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/administration/negocios', icon: Building2, label: 'Negocios' },
  { to: '/administration/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/administration/suscripciones', icon: CreditCard, label: 'Suscripciones' },
  { to: '/administration/productos', icon: Package, label: 'Productos' },
  { to: '/administration/servicios', icon: Wrench, label: 'Servicios' },
];

const WAVES_LIGHT = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='800' viewBox='0 0 400 800' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23dbeafe' stop-opacity='0.8'/%3E%3Cstop offset='100%25' stop-color='%23e0f2fe' stop-opacity='0.5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M0 380 Q 100 220, 200 380 T 400 380 V 800 H 0 Z' fill='url(%23g)'/%3E%3Cpath d='M0 520 Q 100 380, 200 520 T 400 520 V 800 H 0 Z' fill='%23bfdbfe' fill-opacity='0.4'/%3E%3Cpath d='M0 640 Q 100 520, 200 640 T 400 640 V 800 H 0 Z' fill='%2393c5fd' fill-opacity='0.3'/%3E%3Cpath d='M0 740 Q 100 660, 200 740 T 400 740 V 800 H 0 Z' fill='%2360a5fa' fill-opacity='0.25'/%3E%3C/svg%3E")`;

const WAVES_DARK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='800' viewBox='0 0 400 800' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%231e3a8a' stop-opacity='0.6'/%3E%3Cstop offset='100%25' stop-color='%230f172a' stop-opacity='0.4'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M0 380 Q 100 220, 200 380 T 400 380 V 800 H 0 Z' fill='url(%23g)'/%3E%3Cpath d='M0 520 Q 100 380, 200 520 T 400 520 V 800 H 0 Z' fill='%231d4ed8' fill-opacity='0.3'/%3E%3Cpath d='M0 640 Q 100 520, 200 640 T 400 640 V 800 H 0 Z' fill='%232563eb' fill-opacity='0.25'/%3E%3C/svg%3E")`;

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { pathname } = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const c = {
    bg: isDark ? '#0a0e14' : '#f5f9ff',
    bgImage: isDark ? WAVES_DARK : WAVES_LIGHT,
    border: isDark ? '#232935' : '#dbe7f5',
    text: isDark ? '#cbd2dd' : '#475569',
    textStrong: isDark ? '#f4f6f8' : '#0f172a',
    hover: isDark ? '#12161f' : 'rgba(59,130,246,0.08)',
    activeBg: isDark ? '#ffffff' : '#1d4ed8',
    activeText: isDark ? '#16181b' : '#ffffff',
  };

  const width = collapsed ? '4.5rem' : '16rem';

  return (
    <aside
      style={{
        position: 'fixed',
        top: 70,
        left: 0,
        height: 'calc(100vh - 70px)',
        width,
        display: 'flex',
        flexDirection: 'column',
        background: c.bg,
        backgroundImage: c.bgImage,
        // 👇 ondas ocupan todo el sidebar
        backgroundSize: '100% 100%',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        color: c.textStrong,
        borderRight: `1px solid ${c.border}`,
        transition: 'width .25s ease, background-color .25s, border-color .25s',
        zIndex: 40,
        overflow: 'hidden',
      }}
    >
      {/* Toggle (siempre visible) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-end',
          height: '3rem',
          padding: '0 .75rem',
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <button
          onClick={onToggle}
          title={collapsed ? 'Mostrar menú' : 'Ocultar menú'}
          style={{
            background: 'transparent',
            border: 'none',
            color: c.text,
            cursor: 'pointer',
            padding: '.25rem',
            borderRadius: '.375rem',
            display: 'flex',
            alignItems: 'center',
            transition: 'transform .25s ease',
            transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '.25rem',
        }}
      >
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active =
            pathname === to || (to !== '/panel' && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: '.75rem',
                padding: '.5rem .75rem',
                borderRadius: '.5rem',
                fontSize: '.875rem',
                textDecoration: 'none',
                color: active ? c.activeText : c.text,
                background: active ? c.activeBg : 'transparent',
                transition: 'background-color .15s, color .15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = c.hover;
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
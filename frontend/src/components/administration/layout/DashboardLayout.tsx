import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useTheme } from '@/context/ThemeContext';

export function DashboardLayout() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  const sidebarWidth = collapsed ? '4.5rem' : '16rem';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark ? '#0a0e14' : '#f8f9fa',
        transition: 'background-color .2s',
      }}
    >
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      <main
        style={{
          marginLeft: sidebarWidth,
          paddingTop: 70,
          paddingLeft: isMobile ? '1rem' : '1.5rem',
          paddingRight: isMobile ? '1rem' : '1.5rem',
          paddingBottom: '1.5rem',
          transition: 'margin-left .25s ease, padding .25s ease',
          minHeight: 'calc(100vh - 70px)',
          width: `calc(100% - ${sidebarWidth})`,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '1rem' : '1.5rem',
            width: '100%',
            maxWidth: '100%',
          }}
        >
          {/* 👇 Aquí va el contenido de la ruta hija */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
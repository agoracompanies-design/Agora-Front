import { useState, useEffect } from 'react';
import { useMyProducts, useMyServices } from '@/hooks/useMyCatalog';
import { useAuth } from '@/context/AuthContext';
import { StatsCards } from '../../components/administration/dashboard/StatsCards';
import { SalesChart } from '../../components/administration/dashboard/SalesChart';
import { CategoryChart } from '../../components/administration/dashboard/CategoryChart';
import { RecentProductsTable } from '../../components/administration/dashboard/RecentProductsTable';
import { RecentServicesTable } from '../../components/administration/dashboard/RecentServicesTable';
import { Sidebar } from '@/components/administration/layout/Sidebar';
import { useTheme } from '@/context/ThemeContext';

export function MainDashboard() {
  const { subscription } = useAuth();
  const { products } = useMyProducts();
  const { services } = useMyServices();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar móvil
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // En móvil, sidebar siempre colapsado por defecto
  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  // Valoración media de los productos
  const avgRating =
    products.length > 0
      ? products.reduce((acc, p) => acc + (p.avgRating ?? 0), 0) / products.length
      : 0;

  // Suscripciones activas.
  // ⚠️ HOY: solo podemos saber si LA TUYA está activa (0 o 1) porque la API
  // únicamente expone `getMyActiveSubscription()`. Cuando el backend tenga un
  // endpoint global (`GET /subscription/all` o `GET /admin/stats`), cambia
  // esto por el conteo real.
  const activeSubscriptions = subscription?.status ? 1 : 0;

  // Ancho del sidebar según estado
  const sidebarWidth = collapsed ? '4.5rem' : '16rem';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark ? '#0a0e14' : '#f8f9fa',
        transition: 'background-color .2s',
      }}
    >
      {/* Sidebar colapsable */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />

      {/* Contenido */}
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
          {/* Header */}
          <div>
            <h1
              style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: 600,
                color: isDark ? '#f4f6f8' : '#16181b',
                margin: 0,
              }}
            >
              Panel de control
            </h1>
            <p
              style={{
                fontSize: '.875rem',
                color: isDark ? '#98a1b3' : '#6c757d',
                margin: 0,
              }}
            >
              Bienvenido, aquí tienes un resumen de tu negocio
            </p>
          </div>

          {/* Stats */}
          <StatsCards
            productCount={products.length}
            serviceCount={services.length}
            avgRating={avgRating}
            activeSubscriptions={activeSubscriptions}
          />

          {/* Charts — responsive: 1 columna en móvil, 2 en desktop */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr'
                : 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1rem',
              width: '100%',
            }}
          >
            <SalesChart />
            <CategoryChart />
          </div>

          {/* Tables — siempre a todo el ancho, una debajo de otra */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              width: '100%',
            }}
          >
            <RecentProductsTable products={products} />
            <RecentServicesTable services={services} />
          </div>
        </div>
      </main>
    </div>
  );
}
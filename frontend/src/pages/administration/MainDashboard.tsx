import { useMyProducts, useMyServices } from '@/hooks/useMyCatalog';
import { useAuth } from '@/context/AuthContext';
import { StatsCards } from '../../components/administration/dashboard/StatsCards';
import { SalesChart } from '../../components/administration/dashboard/SalesChart';
import { CategoryChart } from '../../components/administration/dashboard/CategoryChart';
import { RecentProductsTable } from '../../components/administration/dashboard/RecentProductsTable';
import { RecentServicesTable } from '../../components/administration/dashboard/RecentServicesTable';
import { useTheme } from '@/context/ThemeContext';

export function MainDashboard() {
  const { subscription } = useAuth();
  const { products } = useMyProducts();
  const { services } = useMyServices();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const avgRating =
    products.length > 0
      ? products.reduce((acc, p) => acc + (p.avgRating ?? 0), 0) / products.length
      : 0;

  const activeSubscriptions = subscription?.status ? 1 : 0;

  return (
    <>
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: '1.5rem',
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

      {/* Charts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1rem',
          width: '100%',
        }}
      >
        <SalesChart />
        <CategoryChart />
      </div>

      {/* Tables */}
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
    </>
  );
}
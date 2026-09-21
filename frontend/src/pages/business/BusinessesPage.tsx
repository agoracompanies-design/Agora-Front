import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Store } from 'lucide-react';
import { useBusinesses } from '@/hooks/useBusinesses';
import { BusinessCard } from '@/components/business/BusinessCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFavorites } from '@/context/FavoritesContext';

export function BusinessesPage() {
  const { businesses, isLoading } = useBusinesses();
  const { isFavoriteBusiness } = useFavorites();

  // Los favoritos van primero, en su propio bloque: al marcar el corazón la
  // tarjeta cambia de bloque y se entiende por qué se ha movido, en vez de
  // saltar sin explicación. Dentro de cada bloque se respeta el orden de siempre.
  const [favoritos, resto] = useMemo(() => {
    const fav = businesses.filter((b) => isFavoriteBusiness(b.enterprise.idUserEnterprise));
    const otros = businesses.filter((b) => !isFavoriteBusiness(b.enterprise.idUserEnterprise));
    return [fav, otros];
  }, [businesses, isFavoriteBusiness]);

  return (
    <div id="businesses" className="businesses mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* React 19 lo sube al <head>: cada ruta con su título. */}
      <title>Negocios · Agora</title>
      <Link to="/" className="businesses__back mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} aria-hidden="true" /> Volver a explorar
      </Link>
      <h1 id="businesses__title" className="businesses__title text-2xl font-semibold text-ink-900">Negocios</h1>
      <p id="businesses__count" className="businesses__count mt-1.5 text-sm text-ink-500">
        {isLoading ? 'Cargando…' : `${businesses.length} negocio${businesses.length === 1 ? '' : 's'} publicando en Agora`}
      </p>

      {!isLoading && favoritos.length > 0 && (
        <section id="businesses__favorites" className="businesses__favorites mt-6" aria-labelledby="businesses__favorites-title">
          <h2 id="businesses__favorites-title" className="businesses__heading mb-3 flex items-center gap-2 text-sm font-semibold text-ink-900">
            <Heart size={14} className="fill-primary text-primary" aria-hidden="true" /> Tus favoritos
          </h2>
          <div className="businesses__grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoritos.map((business) => (
              <BusinessCard key={business.enterprise.idUserEnterprise} business={business} />
            ))}
          </div>
        </section>
      )}

      <section id="businesses__all" className="businesses__all mt-6" aria-labelledby={favoritos.length > 0 ? 'businesses__all-title' : undefined}>
        {!isLoading && favoritos.length > 0 && resto.length > 0 && (
          <h2 id="businesses__all-title" className="businesses__heading mb-3 text-sm font-semibold text-ink-900">
            Todos los negocios
          </h2>
        )}
        <div id="businesses__grid" className="businesses__grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[104px] rounded-2xl" />)
            : resto.map((business) => (
                <BusinessCard key={business.enterprise.idUserEnterprise} business={business} />
              ))}
        </div>
      </section>

      {!isLoading && businesses.length === 0 && (
        <EmptyState
          icon={<Store size={20} />}
          title="Todavía no hay negocios publicados"
          description="Cuando las mypimes y mercados de tu ciudad publiquen su catálogo, aparecerán aquí."
        />
      )}
    </div>
  );
}

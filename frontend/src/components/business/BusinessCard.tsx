import { Link } from 'react-router-dom';
import { Heart, MapPin, Package } from 'lucide-react';
import type { BusinessSummary } from '@/hooks/useBusinesses';
import { EnterpriseLogo } from './EnterpriseLogo';
import { useFavorites } from '@/context/FavoritesContext';
import { cn } from '@/lib/utils';

export function BusinessCard({ business }: { business: BusinessSummary }) {
  const { enterprise, productCount } = business;
  const { isFavoriteBusiness, toggleFavoriteBusiness } = useFavorites();
  const favorito = isFavoriteBusiness(enterprise.idUserEnterprise);

  return (
    <Link
      id={`business--${enterprise.idUserEnterprise}`}
      to={`/negocios/${enterprise.idUserEnterprise}`}
      className="business group flex flex-col gap-3 rounded-2xl border border-ink-200/80 bg-ink-50 p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lift"
    >
      <div id={`business__header--${enterprise.idUserEnterprise}`} className="business__header flex items-center gap-3">
        <EnterpriseLogo
          id={`business__logo--${enterprise.idUserEnterprise}`}
          nombre={enterprise.companyName}
          logo={enterprise.image}
          className="h-11 w-11 rounded-xl text-sm font-semibold"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleFavoriteBusiness(enterprise.idUserEnterprise);
          }}
          aria-label={favorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          aria-pressed={favorito}
          id={`business__fav--${enterprise.idUserEnterprise}`}
          className="business__fav order-last ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900"
        >
          <Heart size={15} className={cn(favorito && 'fill-danger text-danger')} aria-hidden="true" />
        </button>

        <div id={`business__identity--${enterprise.idUserEnterprise}`} className="business__identity min-w-0">
          <h2 id={`business__name--${enterprise.idUserEnterprise}`} className="business__name line-clamp-1 font-medium text-ink-900">{enterprise.companyName}</h2>
          {enterprise.address && (
            <p id={`business__place--${enterprise.idUserEnterprise}`} className="business__place flex items-center gap-1 text-xs text-ink-500">
              <MapPin size={11} className="shrink-0" aria-hidden="true" />
              <span className="line-clamp-1">
                {enterprise.address.city}, {enterprise.address.state}
              </span>
            </p>
          )}
        </div>
      </div>
      <p id={`business__count--${enterprise.idUserEnterprise}`} className="business__count flex items-center gap-1.5 text-xs font-medium text-ink-500">
        <Package size={12} aria-hidden="true" />
        {productCount} producto{productCount === 1 ? '' : 's'} publicado{productCount === 1 ? '' : 's'}
      </p>
    </Link>
  );
}

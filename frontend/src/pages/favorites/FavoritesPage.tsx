import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/context/FavoritesContext';
import { getProduct } from '@/api/product';
import { BusinessCard } from '@/components/business/BusinessCard';
import { useBusinesses } from '@/hooks/useBusinesses';
import { ApiError } from '@/api/client';
import type { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export function FavoritesPage() {
  const { favorites, forgetFavorites, favoriteBusinesses } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (favorites.length === 0) {
      setProducts([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    Promise.allSettled(favorites.map((id) => getProduct(id)))
      .then((results) => {
        if (cancelled) return;
        const found: Product[] = [];
        const desaparecidos: string[] = [];
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') found.push(r.value);
          // Solo un 404 significa que el producto ya no está. Un 401 o un fallo
          // de red no deben borrar nada: el favorito sigue siendo válido.
          else if (r.reason instanceof ApiError && r.reason.status === 404) desaparecidos.push(favorites[i]);
        });
        setProducts(found);
        forgetFavorites(desaparecidos);
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [favorites, forgetFavorites]);

  // Los negocios guardados salen del catálogo, no de `GET /user-enterprise/:id`:
  // ese endpoint responde 403 con cualquier negocio que no sea el tuyo, que es
  // justo el caso de un favorito. Cada producto viaja con su `userEnterprise`,
  // así que la lista se arma con lo que ya se descargó.
  const { businesses } = useBusinesses();
  const negocios = businesses.filter((b) => favoriteBusinesses.includes(b.enterprise.idUserEnterprise));

  const vacio = !isLoading && products.length === 0 && negocios.length === 0;

  return (
    <div id="favorites" className="favorites mx-auto max-w-6xl px-4 sm:px-6 py-10">
      {/* React 19 lo sube al <head>: cada ruta con su título. */}
      <title>Tus favoritos · Ágora</title>
      <h1 id="favorites__title" className="favorites__title text-2xl font-semibold text-ink-900">Tus favoritos</h1>
      <p id="favorites__subtitle" className="favorites__subtitle mt-1 text-sm text-ink-500">Lo que guardaste para revisar más tarde.</p>

      {negocios.length > 0 && (
        <section id="favorites__businesses" className="favorites__businesses mt-8">
          <h2 id="favorites__businesses-title" className="favorites__businesses-title mb-3 text-sm font-semibold text-ink-900">
            Negocios
          </h2>
          <div className="favorites__businesses-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {negocios.map((negocio) => (
              <BusinessCard key={negocio.enterprise.idUserEnterprise} business={negocio} />
            ))}
          </div>
        </section>
      )}

      <div id="favorites__body" className="favorites__body mt-8">
        {isLoading ? (
          <div id="favorites__grid-loading" className="favorites__grid-loading grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : vacio ? (
          <EmptyState
            icon={<Heart size={20} />}
            title="Aún no tienes favoritos"
            description="Toca el corazón en cualquier producto o negocio para guardarlo aquí."
            action={
              <Link to="/">
                <Button variant="outline">Explorar productos</Button>
              </Link>
            }
          />
        ) : products.length === 0 ? null : (
          <div id="favorites__grid" className="favorites__grid grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
            {products.map((product) => (
              <ProductCard key={product.idProduct} product={product} avisarAgotado />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

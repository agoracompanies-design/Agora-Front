import { useEffect, useState } from 'react';
import { listProducts } from '@/api/product';
import type { UserEnterprise } from '@/types';

export interface BusinessSummary {
  enterprise: UserEnterprise;
  productCount: number;
}

/**
 * Cuántas cuentas se preguntan a la vez.
 *
 * Son peticiones diminutas —un producto y el total—, pero lanzar veinte de
 * golpe con la conexión de allá es pedir que fallen. De seis en seis.
 */
const A_LA_VEZ = 6;

/**
 * Deriva la lista de negocios de una muestra amplia del catálogo, igual que
 * useCategories deriva las categorías: el backend no tiene un endpoint que
 * liste empresas, pero cada producto ya viaja con su `userEnterprise`.
 *
 * **El número de productos se pregunta aparte, uno por negocio.** Antes se
 * contaba cuántos salían en esa muestra, y eso no es lo que tiene el negocio
 * sino lo que cupo en el primer lote: con 207 productos y un lote de 100, una
 * tienda con quince podía aparecer con tres.
 *
 * Es una petición por negocio, que es caro y se nota: está pedido al backend
 * un conteo que cruce las dos tablas y venga en una sola respuesta. En cuanto
 * exista, esto se sustituye por esa llamada —y de paso saldrán también los
 * negocios que no tienen ningún producto en la muestra, que hoy ni aparecen—.
 */
export function useBusinesses() {
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await listProducts({ limit: 100 });
        if (cancelled) return;

        const byId = new Map<string, BusinessSummary>();
        for (const product of data.products) {
          const enterprise = product.userEnterprise;
          if (!enterprise) continue;
          const existing = byId.get(enterprise.idUserEnterprise);
          if (existing) existing.productCount += 1;
          else byId.set(enterprise.idUserEnterprise, { enterprise, productCount: 1 });
        }

        const lista = Array.from(byId.values());
        // Se pinta ya con lo derivado y luego se corrige: así la pantalla no
        // se queda esperando a veintitantas peticiones para enseñar algo.
        setBusinesses([...lista].sort((a, b) => b.productCount - a.productCount));
        setIsLoading(false);

        for (let i = 0; i < lista.length; i += A_LA_VEZ) {
          if (cancelled) return;
          await Promise.all(
            lista.slice(i, i + A_LA_VEZ).map(async (negocio) => {
              try {
                // `limit: 1` porque lo único que interesa es el `total`: el
                // producto que venga se descarta.
                const suyos = await listProducts({
                  userEnterpriseId: negocio.enterprise.idUserEnterprise,
                  limit: 1,
                });
                negocio.productCount = suyos.total;
              } catch {
                // Si no se puede preguntar, se queda el número derivado: es
                // bajo, pero es lo único que hay.
              }
            }),
          );
        }

        if (cancelled) return;
        setBusinesses([...lista].sort((a, b) => b.productCount - a.productCount));
      } catch {
        if (!cancelled) {
          setBusinesses([]);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { businesses, isLoading };
}

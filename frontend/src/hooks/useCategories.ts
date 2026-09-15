import { useEffect, useState } from 'react';
import { listProducts } from '@/api/product';
import { listCategories } from '@/api/category';
import type { Category } from '@/types';
import { nombreDeCategoria } from '@/lib/categorias';

export interface CategoryCount {
  category: string;
  count: number;
}

/**
 * Las categorías que de verdad tienen algo dentro, con su cuenta.
 *
 * Sale del catálogo y no de `GET /categories` a propósito: en el panel de
 * filtros solo estorban las categorías vacías —no llevan a ningún resultado— y
 * el número al lado es justo lo que ayuda a elegir. Se pide una vez al montar,
 * sin filtros ni paginación, para no contar de menos.
 */
export function useCategories() {
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listProducts({ limit: 100 })
      .then((data) => {
        if (cancelled) return;
        const counts = new Map<string, number>();
        for (const product of data.products) {
          const nombre = nombreDeCategoria(product);
          counts.set(nombre, (counts.get(nombre) ?? 0) + 1);
        }
        const list = Array.from(counts.entries())
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count);
        setCategories(list);
      })
      .catch(() => setCategories([]))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, isLoading };
}

/**
 * Saca la lista de categorías del catálogo, como último recurso.
 *
 * Solo aparecen las que tienen algún producto: una categoría aprobada y todavía
 * vacía no sale por aquí. Es peor que la lista de verdad, pero infinitamente
 * mejor que un desplegable en blanco.
 */
function desdeElCatalogo(productos: { category?: unknown }[]): Category[] {
  const nombres = new Set<string>();
  for (const p of productos) nombres.add(nombreDeCategoria(p as never));
  return Array.from(nombres)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'es'))
    .map((name) => ({ id: `derivada:${name}`, name, approved: true }) as Category);
}

/**
 * La lista real de categorías aprobadas, del backend.
 *
 * Debería salir de `GET /categories`: al publicar hay que poder elegir una
 * aprobada aunque todavía no tenga productos, y sobre todo hay que evitar que
 * alguien «sugiera» una que ya existe.
 *
 * **Hoy ese endpoint responde 403 en el dominio normal.** El controlador entero
 * de categorías quedó detrás de `AdminSubdomainGuard`, así que solo contesta
 * por `administration.<dominio>`, y con él se fue también la lista que necesita
 * cualquier vendedor para publicar: el selector salía vacío. Está pedido en
 * `bugs-para-arreglar.md`; mientras tanto, si la llamada falla se deducen las
 * categorías del catálogo, que sí se puede leer.
 */
export function useApprovedCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((todas) => {
        if (cancelled) return;
        const aprobadas = todas.filter((c) => c.approved);
        if (aprobadas.length > 0) {
          setCategories(aprobadas.sort((a, b) => a.name.localeCompare(b.name, 'es')));
          return;
        }
        // Responde, pero sin nada aprobado: se completa con el catálogo antes
        // que dejar el selector en blanco.
        return listProducts({ limit: 100 }).then((data) => {
          if (!cancelled) setCategories(desdeElCatalogo(data.products));
        });
      })
      .catch(() =>
        listProducts({ limit: 100 })
          .then((data) => {
            if (!cancelled) setCategories(desdeElCatalogo(data.products));
          })
          // Ni una cosa ni la otra: se sigue pudiendo escribir la categoría a
          // mano, que el backend la resuelve igual con el nombre que se le mande.
          .catch(() => !cancelled && setCategories([])),
      )
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, isLoading };
}

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
 * La lista real de categorías aprobadas, del backend.
 *
 * Esta sí sale de `GET /categories`: al publicar hay que poder elegir una
 * aprobada aunque todavía no tenga productos, y sobre todo hay que evitar que
 * alguien «sugiera» una que ya existe.
 */
export function useApprovedCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((todas) => {
        if (cancelled) return;
        setCategories(todas.filter((c) => c.approved).sort((a, b) => a.name.localeCompare(b.name, 'es')));
      })
      // Sin permiso o sin red se sigue pudiendo escribir la categoría a mano:
      // el backend la resuelve igual con el nombre que se le mande.
      .catch(() => setCategories([]))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, isLoading };
}

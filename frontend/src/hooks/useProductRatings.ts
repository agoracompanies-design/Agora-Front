import { useEffect, useState } from 'react';
import { averageRating, listRatingsByProduct } from '@/api/rating';
import type { Product } from '@/types';

export interface Calificacion {
  /** Media de las notas recibidas; 0 cuando todavía no hay ninguna. */
  readonly media: number;
  readonly votos: number;
}

/**
 * Las calificaciones de un puñado de productos, por id.
 *
 * Se piden de una en una porque el catálogo no las trae y no hay endpoint que
 * las devuelva juntas: son tantas peticiones como productos. Aquí es asumible
 * —un negocio maneja decenas, no miles— pero es lo primero que hay que cambiar
 * si el catálogo llega a crecer, o mejor, pedir que `Product` traiga su media.
 */
export function useProductRatings(products: Product[]): Record<string, Calificacion> {
  const [calificaciones, setCalificaciones] = useState<Record<string, Calificacion>>({});
  // Los ids, y no el array, gobiernan el efecto: `products` es una referencia
  // nueva en cada render y volvería a pedirlo todo sin parar.
  const ids = products.map((p) => p.idProduct).join(',');

  useEffect(() => {
    if (!ids) {
      setCalificaciones({});
      return;
    }
    let cancelado = false;

    Promise.allSettled(
      ids.split(',').map((id) =>
        listRatingsByProduct(id).then((notas) => ({
          id,
          calificacion: { media: averageRating(notas), votos: notas.length },
        })),
      ),
    ).then((resultados) => {
      if (cancelado) return;
      const mapa: Record<string, Calificacion> = {};
      for (const r of resultados) {
        if (r.status === 'fulfilled') mapa[r.value.id] = r.value.calificacion;
      }
      setCalificaciones(mapa);
    });

    return () => {
      cancelado = true;
    };
  }, [ids]);

  return calificaciones;
}

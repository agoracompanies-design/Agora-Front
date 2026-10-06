import { useEffect, useState } from 'react';
import { getProductRatingSummary } from '@/api/rating';
import type { Product } from '@/types';

export interface Calificacion {
  /** Media de las notas recibidas; 0 cuando todavía no hay ninguna. */
  readonly media: number;
  readonly votos: number;
}

/**
 * Las calificaciones de un puñado de productos, por id.
 *
 * Se piden de una en una porque el catálogo no las trae: son tantas peticiones
 * como productos. Pero desde el commit `55c1994` del backend cada una devuelve
 * **solo el resumen** —media y votos— en vez de todas las calificaciones con su
 * usuario: antes eran cientos de filas para enseñar un número.
 *
 * Lo siguiente sería que `GET /products` trajera `average` y `count` en cada
 * fila, y entonces estas peticiones desaparecen. Pedido en SOL-13.
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
        getProductRatingSummary(id).then((r) => ({
          id,
          calificacion: { media: r.average ?? 0, votos: r.count },
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

import type { Product } from '@/types';

/**
 * Dónde espera un producto cuya categoría todavía no está aprobada. El backend
 * la crea sola —ya aprobada— la primera vez que hace falta, con este nombre
 * exacto.
 */
export const CATEGORIA_TEMPORAL = 'Otros';

/**
 * El nombre de la categoría de un producto, para mostrarlo.
 *
 * Desde que las categorías son una tabla propia, `product.category` llega como
 * objeto y puede venir vacío: los productos que existían antes de esa migración
 * se quedaron sin ninguna. Todo lo que pinta una categoría pasa por aquí, para
 * no repetir la misma comprobación en once sitios.
 */
export function nombreDeCategoria(product: Pick<Product, 'category'>): string {
  return product.category?.name ?? CATEGORIA_TEMPORAL;
}

/**
 * Lo que el negocio pidió y aún no está aprobado, si es que pidió algo.
 *
 * Mientras se revisa, el producto está publicado en «Otros». Enseñar solo
 * «Otros» haría pensar que la solicitud se perdió.
 */
export function categoriaPendiente(product: Pick<Product, 'suggestedCategoryName'>): string | null {
  return product.suggestedCategoryName?.trim() || null;
}

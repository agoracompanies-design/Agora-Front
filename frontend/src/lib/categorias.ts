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

/** Lo más largo que se admite para una categoría nueva. */
export const LARGO_MAXIMO_CATEGORIA = 50;

/**
 * Lo que puede llevar el nombre de una categoría: letras —con acentos y `ñ`—,
 * números, espacios y guiones. Nada más.
 *
 * La lista es **blanca a propósito**. Una lista negra de «cosas peligrosas» se
 * queda corta siempre: bastaría un `<`, unas comillas o un `javascript:` escrito
 * de otra forma. Aquí no entra nada que no sea un nombre de categoría de
 * verdad, y con eso sobra para «Arroz con pollo» o «Café en grano».
 */
const CARACTER_VALIDO = /^[\p{L}\p{N} -]$/u;

export type CategoriaRechazada = 'vacia' | 'larga' | 'caracteres';

export interface CategoriaRevisada {
  /** El nombre listo para mandar, ya capitalizado. */
  readonly nombre: string;
  readonly motivo?: CategoriaRechazada;
}

/** Qué decirle a quien escribió algo que no vale. */
export const MOTIVO_CATEGORIA: Record<CategoriaRechazada, string> = {
  vacia: 'Escribe el nombre de la categoría.',
  larga: `No puede pasar de ${LARGO_MAXIMO_CATEGORIA} caracteres.`,
  caracteres: 'Solo letras, números, espacios y guiones.',
};

/**
 * Revisa y prepara el nombre de una categoría antes de pedirla.
 *
 * Hace tres cosas, en este orden:
 *
 * 1. **Limpia**: quita los espacios de los extremos y junta los repetidos, para
 *    que «arroz   con  pollo» y «arroz con pollo» sean la misma petición y no
 *    acaben siendo dos categorías.
 * 2. **Comprueba**: que no esté vacía, que no pase de 50 caracteres y que no
 *    lleve nada raro.
 * 3. **Capitaliza**: solo la primera letra de la primera palabra, que es como se
 *    pidió. No se toca el resto: «Café en grano», no «Café En Grano».
 *
 * Esto es para que quien escribe vea el error mientras lo escribe. **La
 * comprobación que manda es la del servidor**, y está pedida en
 * `solicitudes para el backend/solicitudes.md`, SOL-15: un filtro que solo vive
 * en el navegador se lo salta cualquiera llamando a la API.
 */
export function revisarCategoria(bruto: string): CategoriaRevisada {
  const limpio = bruto.trim().replace(/\s+/g, ' ');

  if (!limpio) return { nombre: '', motivo: 'vacia' };
  // Se mide con el array y no con `.length`: una letra acentuada o un emoji
  // ocupan dos unidades, y cortar por ahí partiría el carácter en dos.
  const letras = [...limpio];
  if (letras.length > LARGO_MAXIMO_CATEGORIA) return { nombre: limpio, motivo: 'larga' };
  if (!letras.every((c) => CARACTER_VALIDO.test(c))) return { nombre: limpio, motivo: 'caracteres' };

  return { nombre: limpio.charAt(0).toUpperCase() + limpio.slice(1) };
}

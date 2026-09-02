/**
 * Unidades de venta que se ofrecen al publicar un producto.
 *
 * Están agrupadas porque quien publica piensa primero en cómo vende —a peso, a
 * volumen o por piezas— y después en cuál exactamente.
 *
 * La lista mezcla el sistema métrico con lo que de verdad se usa en el comercio
 * minorista cubano: la libra sigue siendo la medida de a pie —la libra española
 * de 460 g, no media libra métrica—, y el pomo, la lata o el jarro son
 * instrumentos de medida corrientes en la venta particular. Dejarlas fuera
 * obligaría a escribirlas a mano una por una.
 *
 * No es una lista cerrada: el campo admite cualquier unidad. Esto solo evita
 * que cada negocio escriba «kg», «Kg» y «kilogramo» para lo mismo.
 */

export interface GrupoDeUnidades {
  readonly titulo: string;
  readonly unidades: readonly string[];
}

export const UNIDADES: readonly GrupoDeUnidades[] = [
  {
    titulo: 'Por peso',
    unidades: ['libra', 'kilogramo', 'gramo', 'onza', 'arroba', 'quintal'],
  },
  {
    titulo: 'Por volumen',
    unidades: ['litro', 'mililitro', 'botella', 'pomo', 'galón', 'jarro', 'lata'],
  },
  {
    titulo: 'Por pieza',
    unidades: ['unidad', 'par', 'docena', 'cartón', 'bandeja', 'racimo'],
  },
  {
    titulo: 'Por envase',
    unidades: ['paquete', 'caja', 'bolsa', 'saco', 'frasco', 'tubo', 'rollo', 'blíster', 'juego'],
  },
];

/** Todas en una sola lista, para buscar sin pensar en el grupo. */
export const TODAS_LAS_UNIDADES: readonly string[] = UNIDADES.flatMap((g) => g.unidades);

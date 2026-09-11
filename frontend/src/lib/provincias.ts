/**
 * Las provincias de Cuba, de occidente a oriente.
 *
 * Van en ese orden y no alfabético porque es como se nombran aquí y como se
 * enseñan en cualquier mapa: quien busca la suya la encuentra por dónde está,
 * no por qué letra empieza.
 *
 * La Isla de la Juventud no es una provincia sino un municipio especial, pero a
 * efectos de una dirección funciona igual y quien vive allí necesita poder
 * elegirla, así que cierra la lista.
 */
export const PROVINCIAS = [
  'Pinar del Río',
  'Artemisa',
  'La Habana',
  'Mayabeque',
  'Matanzas',
  'Cienfuegos',
  'Villa Clara',
  'Sancti Spíritus',
  'Ciego de Ávila',
  'Camagüey',
  'Las Tunas',
  'Holguín',
  'Granma',
  'Santiago de Cuba',
  'Guantánamo',
  'Isla de la Juventud',
] as const;

export type Provincia = (typeof PROVINCIAS)[number];

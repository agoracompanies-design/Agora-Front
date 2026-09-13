/**
 * Buscar tolerando faltas de ortografía.
 *
 * En Cuba nadie escribe las tildes al buscar, y «platano», «arros» o «geladera»
 * son lo normal, no la excepción. Comparar con `includes()` a secas convierte
 * cualquiera de esas en «sin resultados», que el que busca lee como «no hay»,
 * no como «lo escribiste distinto». Aquí se compara sin tildes y admitiendo
 * alguna letra cambiada.
 *
 * La tolerancia **no sustituye a la coincidencia exacta**, la respalda: quien
 * llama primero busca lo exacto y solo si no sale nada vuelve a preguntar con
 * `aproximado: true`. Así nadie ve resultados raros mezclados con los buenos.
 */

/** Minúsculas y sin tildes ni diéresis. La ñ se conserva: no es un acento. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u0302\u0304-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Cuántas letras pueden fallar, según lo larga que sea la palabra buscada.
 *
 * Con palabras cortas hay que ser estricto: a dos letras de «pan» están «pon»,
 * «par», «paz» y media lista de la compra, y sugerirlas todas es ruido.
 */
function tolerancia(largo: number): number {
  if (largo <= 3) return 0;
  if (largo <= 6) return 1;
  return 2;
}

/**
 * Distancia de edición (Levenshtein) entre dos palabras, con tope.
 *
 * En cuanto se sabe que va a pasar del tope se corta y se devuelve `tope + 1`:
 * esto se llama miles de veces por tecleo y la mayoría de las comparaciones son
 * entre palabras que no se parecen en nada.
 */
function distancia(a: string, b: string, tope: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > tope) return tope + 1;

  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
  let actual = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    actual[0] = i;
    let mejorDeLaFila = actual[0];
    for (let j = 1; j <= b.length; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      actual[j] = Math.min(actual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + coste);
      if (actual[j] < mejorDeLaFila) mejorDeLaFila = actual[j];
    }
    // Toda la fila pasa del tope: el resultado final ya no puede bajar de ahí.
    if (mejorDeLaFila > tope) return tope + 1;
    [anterior, actual] = [actual, anterior];
  }
  return anterior[b.length];
}

/** Parte un texto en palabras, ya normalizadas. */
function palabras(texto: string): string[] {
  return normalizar(texto)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** ¿Este campo responde a este término? */
function campoCoincide(campo: string, termino: string, aproximado: boolean): boolean {
  if (normalizar(campo).includes(termino)) return true;
  if (!aproximado) return false;

  const margen = tolerancia(termino.length);
  if (margen === 0) return false;
  return palabras(campo).some((palabra) => {
    if (distancia(palabra, termino, margen) <= margen) return true;
    // Y contra el principio de la palabra, del largo de lo tecleado: así un
    // plural o un sufijo no se come el margen entero. Quien escribe
    // «destornilladro» busca «destornilladores», y sin esto la «es» del final
    // cuenta como dos fallos más que no cometió nadie.
    if (palabra.length <= termino.length) return false;
    return distancia(palabra.slice(0, termino.length), termino, margen) <= margen;
  });
}

/**
 * Devuelve la función que decide si algo entra en la búsqueda.
 *
 * Se construye una vez por consulta y se aplica a cada producto, para no
 * repetir por cada uno el trabajo de normalizar y partir lo tecleado.
 *
 * Con varias palabras tienen que estar **todas**, aunque cada una pueda salir
 * de un campo distinto: «arroz bodega» encuentra el arroz de la bodega.
 */
export function creaFiltro(consulta: string, { aproximado = false } = {}) {
  const terminos = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (terminos.length === 0) return () => true;

  return (...campos: (string | null | undefined)[]) => {
    const presentes = campos.filter((c): c is string => Boolean(c));
    return terminos.every((t) => presentes.some((c) => campoCoincide(c, t, aproximado)));
  };
}

/**
 * Filtra las direcciones antes de pintarlas en un `href`.
 *
 * Un `<a href="javascript:…">` ejecuta código al pulsarlo. React escapa el
 * texto, pero **no mira los esquemas de los enlaces**: si una dirección acaba
 * saliendo de un dato —la bandeja de avisos, que hoy vive en el navegador y
 * mañana vendrá del servidor— basta con que alguien consiga escribir ahí para
 * tener un clic que ejecuta lo que quiera.
 *
 * Hoy esos enlaces los construye la propia aplicación, así que no hay agujero:
 * esto es para que siga sin haberlo cuando la bandeja deje de ser local. Una
 * lista de esquemas permitidos es más segura que una de prohibidos, porque lo
 * que no se previó se queda fuera en vez de colarse.
 */
const ESQUEMAS_PERMITIDOS = ['http:', 'https:', 'tel:', 'mailto:'];

/** La dirección si se puede abrir sin riesgo; si no, nada. */
export function enlaceSeguro(url: string | null | undefined): string | null {
  if (!url) return null;
  const limpio = url.trim();
  // Relativa: se queda dentro de la aplicación, no hay esquema que valga.
  if (limpio.startsWith('/') && !limpio.startsWith('//')) return limpio;
  try {
    // La base solo sirve para poder analizarla; una absoluta la ignora.
    const analizada = new URL(limpio, window.location.origin);
    return ESQUEMAS_PERMITIDOS.includes(analizada.protocol) ? limpio : null;
  } catch {
    return null;
  }
}

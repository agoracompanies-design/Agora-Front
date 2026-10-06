/**
 * Filtra las direcciones antes de pintarlas en un `href`.
 *
 * Un `<a href="javascript:…">` ejecuta código al pulsarlo. React escapa el
 * texto, pero **no mira los esquemas de los enlaces**: si una dirección acaba
 * saliendo de un dato —el contacto de un negocio, la bandeja de avisos, las
 * promociones— basta con que alguien consiga escribir ahí para tener un clic
 * que ejecuta lo que quiera.
 *
 * Una lista de esquemas permitidos es más segura que una de prohibidos, porque
 * lo que no se previó se queda fuera en vez de colarse.
 */
const ESQUEMAS_PERMITIDOS = ['http:', 'https:', 'tel:', 'mailto:'];

/**
 * Lo que el analizador de direcciones del navegador ignora por su cuenta: el
 * tabulador y los saltos de línea en cualquier posición, y los caracteres de
 * control y el espacio en los extremos.
 *
 * Hay que quitarlos **antes** de decidir nada, porque si no se mira una cadena
 * y el navegador abre otra. Medido: un tabulador delante de `/\evil.com` hace
 * que para JavaScript ya no empiece por `/`, pero el navegador lo sigue
 * abriendo como `https://evil.com`.
 */
function normalizar(url: string): string {
  // Los caracteres de control son justo lo que hay que quitar, así que aquí la
  // regla sobra: avisa de lo que se busca a propósito.
  // eslint-disable-next-line no-control-regex
  return url.replace(/[\t\n\r]/g, '').replace(/^[\u0000- ]+|[\u0000- ]+$/g, '');
}

/**
 * La dirección si se puede abrir sin riesgo; si no, nada.
 *
 * Devuelve **lo que el navegador va a usar de verdad**, no el texto de entrada.
 * Validar una cadena y pintar otra era el fallo de la versión anterior:
 * `/\evil.com` empieza por `/` y no por `//`, así que pasaba por relativa y se
 * devolvía tal cual, pero el navegador lo resuelve a `https://evil.com`
 * —medido—. Un enlace que parece interno y sale a otro sitio es un redirect
 * abierto.
 *
 * Lo que se declara relativo tiene que **seguir siendo nuestro** una vez
 * resuelto, y sale relativo: así vale igual para un `href` y para el `to` de un
 * `<Link>`, que con una dirección absoluta no sabría qué hacer. Lo absoluto
 * puede apuntar fuera: para eso está.
 */
export function enlaceSeguro(url: string | null | undefined): string | null {
  if (!url) return null;
  const limpio = normalizar(url);
  if (!limpio) return null;
  try {
    const origen = window.location.origin;
    // La base solo sirve para poder analizarla; una absoluta la ignora.
    const analizada = new URL(limpio, origen);
    if (!ESQUEMAS_PERMITIDOS.includes(analizada.protocol)) return null;
    if (limpio.startsWith('/')) {
      // Se pedía una ruta de dentro: si al resolverla ya no lo es, se descarta.
      if (analizada.origin !== origen) return null;
      return analizada.pathname + analizada.search + analizada.hash;
    }
    return analizada.href;
  } catch {
    return null;
  }
}

/**
 * Una dirección de correo, y nada más que eso.
 *
 * En un `mailto:` el esquema va delante y fijo, así que nadie puede cambiarlo;
 * lo que sí se puede colar son **cabeceras**: `uno@ahi.cu?bcc=otro@x.com` deja
 * el correo preparado con copia oculta a quien quiso el que escribió el dato, y
 * `&body=…` le escribe hasta el texto. El correo lo teclea cada negocio en su
 * ficha y lo ve cualquiera que entre, así que aquí no se puede dar por bueno.
 *
 * `correoValido` no sirve para esto: admite `?` en el dominio, con lo que
 * `a@sitio.cu?subject=…` le parece bien. Sigue valiendo para los formularios,
 * que es a lo que iba.
 *
 * Se admite un `@`, un punto detrás, y ni espacios ni `?`, `&` o `#`. Si no
 * encaja no hay enlace, y el correo se sigue viendo escrito —que es para lo que
 * estaba—.
 */
const CORREO = /^[^\s@<>?&#/\\]+@[^\s@<>?&#/\\]+\.[^\s@<>?&#/\\]{2,}$/;

export function enlaceDeCorreo(correo: string | null | undefined): string | null {
  const limpio = normalizar(correo ?? '');
  return CORREO.test(limpio) ? `mailto:${limpio}` : null;
}

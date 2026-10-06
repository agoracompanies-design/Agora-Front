/**
 * Lo que cada campo deja escribir.
 *
 * Se filtra mientras se teclea, no al enviar: una letra en un teléfono no es
 * una duda que resolver al final del formulario, es una tecla que sobra. Lo
 * que sí depende del conjunto —que el correo tenga forma de correo— se
 * comprueba al enviar, porque a media escritura todo correo es inválido.
 *
 * Los topes de longitud son los de las columnas del backend: recortar aquí
 * evita que el servidor rechace el formulario entero por un carácter de más.
 */

/** Largos máximos, tomados de las columnas del backend. */
export const LARGO = {
  usuario: 100,
  empresa: 200,
  producto: 100,
  unidad: 50,
  categoria: 100,
  /** `address` y `contact` son json: sin tope de columna, pero no cabe todo. */
  direccion: 120,
  ciudad: 80,
  pais: 60,
  telefono: 20,
  correo: 120,
  web: 200,
  descripcion: 500,
  /** Los seis de la ficha ampliada. Son los topes de columna del backend. */
  referencia: 200,
  enlaceMapa: 500,
  diasAbiertos: 100,
  codigoAfiliado: 50,
} as const;

/**
 * Teléfono: dígitos y lo que se usa para agruparlos, más el prefijo
 * internacional. Nada de letras. El `+` solo cuenta al principio, que es donde
 * significa algo.
 */
export function soloTelefono(valor: string): string {
  const empiezaConMas = valor.trimStart().startsWith('+');
  const limpio = valor.replace(/[^\d\s()-]/g, '');
  return ((empiezaConMas ? '+' : '') + limpio).slice(0, LARGO.telefono);
}

/** Códigos postales: solo cifras. */
export function soloDigitos(valor: string, largo = 10): string {
  return valor.replace(/\D/g, '').slice(0, largo);
}

/**
 * Usuario: sin espacios ni acentos, en minúsculas. Un nombre de cuenta con
 * mayúsculas o espacios se escribe distinto cada vez que se intenta entrar.
 */
export function soloUsuario(valor: string): string {
  return valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, LARGO.usuario);
}

/**
 * Texto normal, de una línea: se limpia y se limita el largo.
 *
 * **Esto no para una inyección SQL, y no pretende hacerlo.** Contra eso solo
 * sirve que el servidor use consultas parametrizadas, que es lo que hace
 * TypeORM: el valor viaja aparte de la consulta y nunca se concatena en ella.
 * Filtrar comillas aquí daría una falsa sensación de seguridad y rompería
 * nombres legítimos — «Café D'Prisa», «O'Reilly» —.
 *
 * Lo que sí evita, que son riesgos reales de un campo de texto libre:
 *
 * 1. **Caracteres de control invisibles.** `‮` da la vuelta al texto al
 *    pintarlo: un negocio podría llamarse de una forma y leerse de otra. Y los
 *    de ancho cero sirven para colar dos nombres que parecen el mismo.
 * 2. **Marcado.** React escapa lo que pinta, así que `<b>` sale como texto; pero
 *    este dato lo leen también el panel y, el día de mañana, un informe o un
 *    correo, donde puede no haber escape. Quitarlo en origen cuesta nada.
 * 3. **Espacios repetidos**, que hacen que «Bodega  El Vedado» y «Bodega El
 *    Vedado» parezcan dos negocios distintos.
 */
export function texto(valor: string, largo: number): string {
  return (
    valor
      // El salto va **antes** que los controles: si se borrara como uno más,
      // «línea1» y «línea2» quedarían pegadas en una sola palabra.
      .replace(/[\r\n]+/g, ' ')
      .replace(/[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩]/g, '')
      .replace(/[<>]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, largo)
  );
}

/** ¿Tiene forma de correo? Se usa al enviar, no al teclear. */
export function pareceCorreo(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
}

/** Un teléfono utilizable: al menos seis cifras, sean cuales sean. */
export function pareceTelefono(valor: string): boolean {
  return (valor.match(/\d/g) ?? []).length >= 6;
}

/**
 * La web tal como se guarda. Quien escribe «mitienda.cu» quiere decir
 * «https://mitienda.cu», y sin el esquema el enlace se abre relativo al sitio
 * y lleva a ninguna parte.
 */
export function normalizarWeb(valor: string): string {
  const limpio = valor.trim();
  if (!limpio) return '';
  return /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`;
}

/** ¿Tiene forma de dirección web, una vez normalizada? */
export function pareceWeb(valor: string): boolean {
  if (!valor.trim()) return true; // opcional
  try {
    const url = new URL(normalizarWeb(valor));
    return url.hostname.includes('.');
  } catch {
    return false;
  }
}


/**
 * Un enlace de mapa aceptable: solo `https:`.
 *
 * Lo pega la gente desde WhatsApp, así que entra texto que no controlamos. Sin
 * este filtro cabría un `javascript:` en un atributo `href` de la ficha pública
 * de un negocio, que es de todo lo que hay el peor sitio donde dejarlo.
 *
 * Vacío vale: el campo es opcional.
 */
export function pareceEnlaceDeMapa(valor: string): boolean {
  const limpio = valor.trim();
  if (!limpio) return true;
  try {
    return new URL(limpio).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * El horario: **o las dos horas o ninguna**.
 *
 * Media franja —«abre a las 9» y nada más— no le sirve a quien quiere ir. Que
 * el cierre sea menor que la apertura **sí vale**: un negocio que cierra a la
 * una de la madrugada pone 18:00 → 01:00.
 */
export function horarioCompleto(apertura: string, cierre: string): boolean {
  return Boolean(apertura) === Boolean(cierre);
}

/**
 * Lo mismo que `texto()`, para un campo de varias líneas.
 *
 * Mantiene los saltos pero no deja que se acumulen: tres líneas en blanco
 * seguidas solo sirven para empujar el resto de la ficha fuera de la pantalla.
 */
export function textoMultilinea(valor: string, largo: number): string {
  return valor
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/[<>]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, largo);
}

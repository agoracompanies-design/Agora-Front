/**
 * Datos de contacto de Ágora.
 *
 * OJO: el número es un marcador de posición hasta que Nelson dé el definitivo.
 * Formato para wa.me: código de país + número, sin signos ni espacios.
 */
export const WHATSAPP_VENTAS = '5350000000';

/**
 * Moderación: aquí llegan las solicitudes para crear o mover una categoría y
 * quien quiere reclamar una cuenta bloqueada.
 *
 * Este **sí es un número real**, el de Joel, puesto el 2026-10-22. Lo que NO
 * entra por aquí desde el 2026-10-23 es recuperar una contraseña: eso dejaba a
 * una persona poniendo la clave de otra. El de ventas de arriba sigue siendo un
 * marcador.
 */
export const WHATSAPP_MODERACION = '5350926557';

// ---------------------------------------------------------------------------
// El teléfono de un negocio
// ---------------------------------------------------------------------------
//
// Cada negocio escribe el suyo a mano, así que en la base conviven
// «+53 7 832 4417» y «58468600». Antes de convertirlo en un enlace hay que
// dejarlo en una sola forma.

/** Código de Cuba. Los números de allá son ocho dígitos sin él. */
const CUBA = '53';

/**
 * La primera cosa que parece un teléfono dentro de lo que se escribió.
 *
 * El campo es libre y la gente mete de todo: dos números separados por una
 * barra, un «ext. 2» detrás, un «o llama al…». Quedarse con **todos** los
 * dígitos del texto los pega en un número que no existe, o —peor— en uno que sí
 * existe y es de otra persona.
 */
function primerNumero(texto: string): string {
  const encontrado = /\+?\d[\d\s().\-+]{5,}/.exec(texto);
  return (encontrado?.[0] ?? '').replace(/\D/g, '');
}

/**
 * El número en forma internacional, solo dígitos: `5378324417`.
 *
 * Si vienen ocho dígitos pelados se asume Cuba, que es de donde son todos los
 * negocios. Devuelve `null` cuando lo que hay no puede ser un número, para
 * poder **no pintar el botón**: abrir un chat con un desconocido es peor que no
 * ofrecerlo.
 *
 * Lo que se encontró al revisarlo el 2026-10-26, con lo que la gente escribe de
 * verdad: `0 5092 6557` salía como `050926557`, dos números en el mismo campo
 * se pegaban en uno solo, y `+53 50926557 ext 2` daba `53509265572` —once
 * dígitos, que pasaban por válidos y abrían el chat de otra persona—.
 */
export function telefonoInternacional(telefono: string | null | undefined): string | null {
  let digitos = primerNumero(telefono ?? '');
  if (!digitos) return null;

  // Los ceros de marcar —el `0` provincial y el `00` internacional— no viajan
  // en un número internacional.
  digitos = digitos.replace(/^0+/, '');
  if (digitos.length === 8) return `${CUBA}${digitos}`;

  // Fuera de eso solo vale lo que de verdad puede marcarse: los números de la
  // E.164 van de diez a quince cifras contando el prefijo de país.
  return digitos.length >= 10 && digitos.length <= 15 ? digitos : null;
}

/** El número como se lee: `+53 7 832 4417`. */
export function telefonoLegible(telefono: string | null | undefined): string {
  const internacional = telefonoInternacional(telefono);
  if (!internacional) return '';
  if (internacional.startsWith(CUBA) && internacional.length === 10) {
    const n = internacional.slice(2);
    return `+53 ${n.slice(0, 1)} ${n.slice(1, 4)} ${n.slice(4)}`;
  }
  return `+${internacional}`;
}

/**
 * El enlace que abre el marcador del teléfono.
 *
 * No llama solo, y no hay forma de que lo haga: ningún navegador deja que una
 * página marque un número sin que la persona lo confirme. Lo que sí hace es
 * dejarlo escrito en el marcador, que es un toque en vez de copiar a mano ocho
 * dígitos. En un ordenador lo recoge la aplicación que tenga registrada el
 * sistema, y si no hay ninguna no pasa nada: por eso el número va también
 * escrito en el botón, para poder leerlo.
 */
export function enlaceLlamada(telefono: string | null | undefined): string | null {
  const internacional = telefonoInternacional(telefono);
  return internacional ? `tel:+${internacional}` : null;
}

/**
 * El enlace que abre WhatsApp con el mensaje ya escrito.
 *
 * `wa.me` es el enlace oficial y sirve para los dos casos: si la aplicación
 * está instalada —móvil u ordenador— la abre, y si no, abre WhatsApp Web. Por
 * eso se usa este y no `whatsapp://`, que solo funciona con la aplicación.
 */
export function enlaceWhatsapp(telefono: string | null | undefined, mensaje: string): string | null {
  const internacional = telefonoInternacional(telefono);
  return internacional ? `https://wa.me/${internacional}?text=${encodeURIComponent(mensaje)}` : null;
}

/** Un precio como se escribe en un mensaje: `60,00 CUP`. */
function precioEscrito(importe: number, moneda: string): string {
  return `${importe.toLocaleString('es', { minimumFractionDigits: 2 })} ${moneda}`;
}

/**
 * El saludo con el que se abre WhatsApp, con el producto **y su precio**.
 *
 * El precio va porque es la mitad de la conversación: quien escribe quiere ese
 * producto a ese precio, y el negocio necesita saber de cuál de sus precios
 * habla sin tener que preguntarlo. Si el producto tiene los dos, se mandan los
 * dos —el negocio cobra en uno o en otro y quien pregunta no tiene por qué
 * saber cuál—.
 *
 * Un producto sin ningún precio es raro pero posible; entonces se pregunta por
 * él sin más, que es mejor que escribir «cuesta 0».
 */
export function mensajeDeInteres(
  producto: string,
  negocio?: string,
  precios?: { cup?: number | null; usd?: number | null },
): string {
  const donde = negocio ? ` de ${negocio}` : '';
  const lista = [
    precios?.cup != null ? precioEscrito(precios.cup, 'CUP') : null,
    precios?.usd != null ? precioEscrito(precios.usd, 'USD') : null,
  ].filter(Boolean);
  const cuanto = lista.length > 0 ? ` a ${lista.join(' o ')}` : '';
  return `Hola, buenas. Vi «${producto}»${donde} en Ágora${cuanto} y me interesa. ¿Está disponible?`;
}

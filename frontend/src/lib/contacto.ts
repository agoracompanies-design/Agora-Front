/**
 * Datos de contacto de Agora.
 *
 * OJO: el número es un marcador de posición hasta que Nelson dé el definitivo.
 * Formato para wa.me: código de país + número, sin signos ni espacios.
 */
export const WHATSAPP_VENTAS = '5350000000';

/**
 * Moderación: a este número llegan las solicitudes para crear una categoría.
 * Puede ser el mismo que el de ventas o uno aparte; también es un marcador.
 */
export const WHATSAPP_MODERACION = '5350000000';

/**
 * Recuperar el acceso: un chat de WhatsApp con un moderador.
 *
 * No hay correo de recuperación ni enlace con token, y es a propósito: aquí
 * mucha gente entra con un número de teléfono y sin correo que mirar, y un
 * correo que no llega deja a la persona fuera sin saber por qué. Lo decide una
 * persona, que es quien puede comprobar quién es.
 *
 * El nombre de usuario viaja en el mensaje si lo escribió: le ahorra la primera
 * pregunta a quien atiende. Si no, se manda el mensaje a secas.
 */
export function enlaceParaRecuperarAcceso(usuario?: string): string {
  const nombre = usuario?.trim();
  const mensaje = nombre
    ? `Hola, no puedo entrar en Agora y necesito recuperar mi contraseña. Mi usuario es «${nombre}».`
    : 'Hola, no puedo entrar en Agora y necesito recuperar mi contraseña.';
  return `https://wa.me/${WHATSAPP_MODERACION}?text=${encodeURIComponent(mensaje)}`;
}


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
 * El número en forma internacional, solo dígitos: `5378324417`.
 *
 * Si vienen ocho dígitos pelados se asume Cuba, que es de donde son todos los
 * negocios. Con cualquier otro largo se deja lo que haya: ya trae su prefijo.
 * Devuelve `null` si no hay ni un dígito, para poder no pintar el botón.
 */
export function telefonoInternacional(telefono: string | null | undefined): string | null {
  const digitos = (telefono ?? '').replace(/\D/g, '');
  if (!digitos) return null;
  if (digitos.length === 8) return `${CUBA}${digitos}`;
  return digitos;
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

/** El saludo con el que se abre WhatsApp, ya con el producto por delante. */
export function mensajeDeInteres(producto: string, negocio?: string): string {
  const donde = negocio ? ` de ${negocio}` : '';
  return `Hola, buenas. Vi «${producto}»${donde} en Agora y me interesa. ¿Está disponible?`;
}

import { anadirAviso } from './notificaciones';
import { WHATSAPP_MODERACION } from './contacto';
import { CATEGORIA_TEMPORAL } from './categorias';

/**
 * Lo que queda por hacer aquí cuando alguien pide una categoría nueva.
 *
 * La solicitud en sí ya no se inventa en el navegador: desde el 2026-09-03 el
 * backend la registra solo —al recibir un nombre que no existe crea la
 * categoría con `approved: false` y publica el producto en «Otros»—, y el
 * moderador la ve en su lista de pendientes.
 *
 * Siguen siendo cosa nuestra dos cosas: dejar constancia en la bandeja de quien
 * publicó, para que no crea que su petición se perdió, y ofrecerle avisar al
 * moderador, porque el backend todavía no notifica a nadie (está en su backlog).
 */

/**
 * RETIRADO el 2026-10-06, junto con `enlaceModeracion` y `SendRequestDialog`.
 *
 * Avisaba al moderador por WhatsApp de que había una categoría esperando. Se
 * quita por dos motivos:
 *
 * 1. **Ya no hace falta**: el panel administrativo tiene la lista de pendientes
 *    en su pestaña de Negocios, con corregir, aprobar y descartar.
 * 2. **Sacaba datos del sistema**: el mensaje llevaba el id del usuario y el del
 *    producto hacia un tercero, para decir algo que el panel ya sabe. Lo que
 *    sale por ahí puede interceptarse, y no había razón para que saliera.
 *
 * Se deja marcado y no borrado hasta la revisión previa a producción.
 */
export function mensajeParaModerador(s: {
  categoria: string;
  productoNombre: string;
  productoId: string;
  usuario: string;
  userId: string;
}): string {
  // El id del producto va dentro porque es lo que el moderador necesita para
  // moverlo de «Otros» a la categoría aprobada: sin él tendría que buscarlo por
  // el nombre entre los que esperan, y dos negocios pueden vender lo mismo con
  // el mismo nombre.
  return `Categoría nueva esperando revisión en Agora

Producto: ${s.productoNombre}
Id del producto: ${s.productoId}
Publica: ${s.usuario} (id ${s.userId})
Categoría que pide: ${s.categoria}

Ya está registrada como pendiente; el producto salió publicado en ${CATEGORIA_TEMPORAL}.`;
}

/** El enlace de WhatsApp con ese aviso ya escrito. */
export function enlaceModeracion(s: Parameters<typeof mensajeParaModerador>[0]): string {
  return `https://wa.me/${WHATSAPP_MODERACION}?text=${encodeURIComponent(mensajeParaModerador(s))}`;
}

/**
 * Deja el rastro en la bandeja de quien publicó. Sin esto, el producto aparece
 * en «Otros» sin que nadie le explique por qué.
 */
export function anotarCategoriaPedida(entrada: {
  userId: string;
  categoria: string;
  productoNombre: string;
}): void {
  anadirAviso(entrada.userId, {
    tipo: 'categoria',
    titulo: `Pediste la categoría «${entrada.categoria}»`,
    cuerpo:
      `Está esperando revisión. Mientras tanto, «${entrada.productoNombre}» se publicó en ` +
      `${CATEGORIA_TEMPORAL}; cuando se apruebe habrá que moverlo a su categoría.`,
  });
}

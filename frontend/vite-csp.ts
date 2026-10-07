import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

/**
 * La política de seguridad de contenido, puesta en el HTML del build.
 *
 * Qué hace: decirle al navegador de dónde puede cargar cada cosa. Si mañana
 * alguien consigue colar un `<script>` —por un dato sin filtrar, por una
 * dependencia tocada—, el navegador se niega a ejecutarlo porque no sale de un
 * origen permitido. Es la red que queda debajo de todo lo demás.
 *
 * **Va en un `<meta>` y no en una cabecera** porque esta aplicación es estática:
 * la sirve quien la sirva, y el repositorio no manda en eso. El `<meta>`
 * funciona igual para casi todo, con excepciones que **solo** valen en cabecera
 * y que hay que configurar en el servidor:
 *
 *   Content-Security-Policy: frame-ancestors 'none'
 *   Strict-Transport-Security: max-age=31536000; includeSubDomains
 *   X-Content-Type-Options: nosniff
 *   Referrer-Policy: strict-origin-when-cross-origin
 *
 * **Solo en el build.** En desarrollo, Vite inyecta sus propios scripts y abre
 * un WebSocket para recargar en caliente; con esta política puesta, nada de eso
 * funcionaría y se trabajaría a ciegas.
 */

/** De dónde carga cada cosa. Cada línea tiene su porqué. */
function politica(origenesDeApi: string[]): string {
  const api = origenesDeApi.join(' ');
  return [
    // Lo que no se diga expresamente, solo de casa.
    "default-src 'self'",

    // Los scripts, de casa y nada más. El del tema va por su hash, que se
    // calcula del propio HTML: así no se queda viejo si alguien lo toca.
    "script-src 'self' SCRIPT_HASH",

    // `unsafe-inline` aquí no se puede evitar, y conviene saber por qué: React
    // pinta estilos en línea (`style={{…}}`) y Leaflet coloca las piezas del
    // mapa con `style=`. Un estilo en línea no ejecuta código; lo que se
    // arriesga es que alguien cambie el aspecto de algo, no que corra nada.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Las dos familias de la marca. Google las sirve desde `gstatic`.
    "font-src 'self' https://fonts.gstatic.com data:",

    // `blob:` es para la vista previa de la foto que se sube, antes de que
    // exista en el servidor. Las piezas del mapa son de OpenStreetMap, y las
    // fotos de los productos las sirve la API.
    `img-src 'self' data: blob: https://*.tile.openstreetmap.org ${api}`,

    // A quién se le habla: a la API y a nadie más.
    `connect-src 'self' ${api}`,

    // Esta aplicación no mete ninguna página dentro de otra.
    "frame-src 'none'",
    "object-src 'none'",

    // Que nadie pueda cambiar la base de las rutas relativas ni mandar un
    // formulario a otro sitio.
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

/**
 * El `sha256-…` de un trozo de JavaScript, como lo pide la política.
 *
 * **Los saltos de línea van normalizados a `\n`.** No es un detalle: en Windows
 * el `index.html` se guarda con CRLF, pero el navegador los convierte a LF al
 * leer la página, y hace el hash sobre eso. Calculándolo con los CRLF sale otro
 * número, el navegador no lo reconoce y bloquea el script —medido: el tema
 * oscuro llegaba tarde y la pantalla daba un destello claro al cargar—.
 */
function hashDe(codigo: string): string {
  const normalizado = codigo.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return `'sha256-${createHash('sha256').update(normalizado, 'utf8').digest('base64')}'`;
}

export function csp(): Plugin {
  return {
    name: 'agora-csp',
    // Solo al construir: en desarrollo rompería la recarga en caliente.
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // El origen de la API sale de la misma variable que usa el cliente, así
        // que no hay dos sitios que puedan decir cosas distintas.
        const url = process.env.VITE_API_URL ?? '';
        const origenes = new Set<string>();
        try {
          if (url) origenes.add(new URL(url).origin);
        } catch {
          // Una variable mal escrita no puede tumbar el build: se queda sin
          // añadir y la política lo dirá en el navegador, que es donde se ve.
        }

        // Los scripts en línea que ya trae el HTML, por su hash. Hoy es uno
        // —el que pinta el tema oscuro antes del primer dibujo—, pero se
        // recogen todos para que esto no haya que tocarlo.
        const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
          .map((m) => hashDe(m[1]))
          .join(' ');

        const contenido = politica([...origenes]).replace('SCRIPT_HASH', hashes);

        return {
          html,
          tags: [
            {
              tag: 'meta',
              attrs: { 'http-equiv': 'Content-Security-Policy', content: contenido },
              injectTo: 'head-prepend',
            },
          ],
        };
      },
    },
  };
}

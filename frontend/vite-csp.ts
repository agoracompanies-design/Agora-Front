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
  // `null` es lo que devuelve `new URL(...).origin` para una dirección opaca,
  // y escrito en la política no significa nada: se descarta antes de llegar.
  const api = origenesDeApi.filter((o) => o && o !== 'null').join(' ');
  /** Lo que se añade a una directiva: nada si no hay origen que añadir. */
  const conApi = api ? ` ${api}` : '';
  return [
    // Lo que no se diga expresamente, solo de casa.
    "default-src 'self'",

    // Los scripts, de casa y nada más. El del tema va por su hash, que se
    // calcula del propio HTML: así no se queda viejo si alguien lo toca.
    "script-src 'self' SCRIPT_HASH",

    // El service worker de la navegación sin conexión. Se dice aparte aunque
    // `script-src` ya lo permitiría: cuando no está, cada navegador decide por
    // su cuenta de dónde hereda, y eso no es algo que convenga averiguar en
    // producción.
    "worker-src 'self'",

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
    `img-src 'self' data: blob: https://*.tile.openstreetmap.org${conApi}`,

    // A quién se le habla: a la API y a nadie más.
    `connect-src 'self'${conApi}`,

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
  /** La URL de la API, resuelta por Vite. Se guarda en `configResolved`. */
  let urlDeLaApi = '';

  return {
    name: 'agora-csp',
    // Solo al construir: en desarrollo rompería la recarga en caliente.
    apply: 'build',

    configResolved(config) {
      // `config.env` trae lo de los ficheros `.env*` además de lo del proceso;
      // `process.env` solo, que es lo que había antes, se perdía un
      // `.env.production` y dejaba la política sin el origen de la API.
      urlDeLaApi = (config.env.VITE_API_URL as string | undefined) ?? '';

      /*
       * Sin esta variable el sitio se publica muerto, y en silencio.
       *
       * Pasan dos cosas a la vez, y ninguna se ve hasta que alguien abre la
       * web: el cliente se queda con la dirección de reserva, que apunta al
       * equipo de quien visita, y esta política sale con `connect-src 'self'`
       * sin la API, así que el navegador bloquearía las llamadas aunque la
       * dirección fuera buena. Las fotos, igual.
       *
       * Comprobado construyendo sin ella: termina con éxito y produce eso. Así
       * que aquí se para. Vale más un build que falla que una web en blanco.
       */
      if (!urlDeLaApi) {
        throw new Error(
          'Falta VITE_API_URL. Sin ella la web se construye apuntando a localhost y con una ' +
            'política que bloquea la API: quedaría publicada y muerta. Ponla en el entorno del ' +
            'servidor o en un fichero `.env.production`, por ejemplo ' +
            'VITE_API_URL=https://api.tudominio.cu/api',
        );
      }

      /*
       * Una ruta relativa —`/api`— es válida y además es la forma más común de
       * publicar esto: la API detrás del mismo dominio, servida por un proxy
       * inverso. Ahí no hay origen que añadir a la política, porque `'self'` ya
       * lo cubre. Exigir esquema rompía ese despliegue.
       */
      if (!urlDeLaApi.startsWith('/')) {
        try {
          new URL(urlDeLaApi);
        } catch {
          throw new Error(
            `VITE_API_URL no es una dirección válida: «${urlDeLaApi}». O una ruta del mismo ` +
              'dominio, como /api, o una dirección con su esquema, como ' +
              'https://api.tudominio.cu/api',
          );
        }
      }
    },

    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // El origen de la API sale de la misma variable que usa el cliente, así
        // que no hay dos sitios que puedan decir cosas distintas. Que exista y
        // sea válida ya se comprobó al resolver la configuración.
        // Con una ruta relativa no hay origen que añadir: la API vive en el
        // mismo sitio que la web y `'self'` ya la cubre.
        const origenes = new Set<string>(
          urlDeLaApi.startsWith('/') ? [] : [new URL(urlDeLaApi).origin],
        );

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

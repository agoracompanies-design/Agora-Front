/* eslint-env serviceworker */
/*
 * Navegación sin conexión, con la caché a raya.
 *
 * Aquí la conexión se va a menudo y cuando vuelve es cara. Lo que se ha
 * descargado una vez no se vuelve a pedir si sigue sirviendo.
 *
 * **Tres reglas, y las tres importan:**
 *
 * 1. **Todo caduca en un día.** Una respuesta guardada lleva la hora en que se
 *    guardó; pasadas 24 h se tira. Sin esto el navegador acaba lleno de cosas
 *    de hace semanas que además mienten.
 * 2. **Hay un tope de entradas.** Aunque no haya caducado, una caché que crece
 *    sin fin termina siendo un problema del usuario, no nuestro.
 * 3. **Lo que cambia no se cachea.** Nada de POST, nada de sesión, nada de
 *    dinero. Una respuesta vieja ahí no ahorra datos: engaña.
 */

const VERSION = 'v2';
const ESTATICOS = `agora-estaticos-${VERSION}`;
const DATOS = `agora-datos-${VERSION}`;
const IMAGENES = `agora-imagenes-${VERSION}`;

/** Un día, como se pidió. Pasado esto, lo guardado se tira. */
const VIDA_MAXIMA = 24 * 60 * 60 * 1000;

/**
 * Las fotos aguantan una semana.
 *
 * Una foto de producto no cambia casi nunca, y es lo más caro que se descarga.
 * Tirarla cada día por si acaso es pagar el catálogo entero otra vez; y si el
 * negocio la cambia, cambia también el nombre del fichero.
 */
const VIDA_IMAGENES = 7 * 24 * 60 * 60 * 1000;

/** Cuántas respuestas de la API se guardan como mucho. */
const TOPE_DATOS = 60;

/** Cuántos ficheros del sitio se guardan como mucho. */
const TOPE_ESTATICOS = 120;

/** Cuántas fotos. Van en su propia caché: ver el manejador de `fetch`. */
const TOPE_IMAGENES = 80;

/**
 * Qué es una foto.
 *
 * Las tres rutas que las sirven —productos, servicios y negocios— cuelgan de
 * `/api/`, así que sin esto caen en el mismo saco que el JSON del catálogo.
 */
const ES_IMAGEN = /\/image\//;

/**
 * El origen de la API, que casi nunca es el nuestro.
 *
 * Llega en la dirección con la que se registra este fichero —`/sw.js?api=…`—
 * porque aquí dentro no hay forma de leer la configuración del build. Sin
 * esto, la regla de «nada de otros dominios» dejaba fuera **todo** el
 * catálogo y todas las fotos, que es lo que se quería guardar.
 */
const ORIGEN_API = (() => {
  try {
    const puesto = new URL(self.location.href).searchParams.get('api');
    return puesto ? new URL(puesto).origin : null;
  } catch {
    return null;
  }
})();

/** Cabecera propia con la hora de guardado: la Cache API no la trae. */
const CUANDO = 'x-agora-guardado';

/**
 * Lo que NO se guarda nunca.
 *
 * El acceso y la sesión porque una respuesta vieja deja entrar a quien ya no
 * debería; el dinero y las suscripciones porque un saldo de ayer es peor que
 * no ver ninguno.
 */
const NUNCA = [
  '/auth/',
  '/payments',
  '/subscription',
  '/administration/',
  '/notification',
];

self.addEventListener('install', (evento) => {
  // Entra en servicio sin esperar a que se cierren las pestañas abiertas.
  self.skipWaiting();
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(ESTATICOS);
      // El documento, desde el primer momento. Es lo que hace que la
      // aplicación abra sin conexión, y pesa lo que una foto pequeña.
      try {
        const respuesta = await fetch('/');
        if (respuesta.ok) await guardar(ESTATICOS, '/', respuesta, TOPE_ESTATICOS);
      } catch {
        // Sin red al instalar: ya se guardará en la primera navegación.
      }
      return cache;
    })(),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      // Las cachés de versiones anteriores se van enteras: si cambia el
      // formato, lo guardado antes no vale y ocupa.
      const nombres = await caches.keys();
      await Promise.all(
        nombres
          .filter(
            (n) => n.startsWith('agora-') && n !== ESTATICOS && n !== DATOS && n !== IMAGENES,
          )
          .map((n) => caches.delete(n)),
      );
      await limpiarCaducado();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;

  // Solo GET: lo que cambia algo no se cachea ni se sirve de caché.
  if (peticion.method !== 'GET') return;

  const url = new URL(peticion.url);

  // Nada de otros dominios, salvo el de la API, que es el que trae el catálogo
  // y las fotos. De lo demás no sabemos ni qué es ni cuándo caduca.
  const nuestro = url.origin === self.location.origin;
  const deLaApi = ORIGEN_API !== null && url.origin === ORIGEN_API;
  if (!nuestro && !deLaApi) return;

  if (NUNCA.some((trozo) => url.pathname.includes(trozo))) return;

  // Una navegación: primero la red, y si no hay, lo último que se vio.
  if (peticion.mode === 'navigate') {
    evento.respondWith(navegacion(peticion));
    return;
  }

  /*
   * Las fotos, aparte de todo lo demás, y de la caché y no de la red.
   *
   * Cuelgan de `/api/`, así que hasta ahora caían con el JSON del catálogo:
   * se volvían a pedir enteras **aunque ya estuvieran guardadas** —red
   * primero—, y de paso echaban de la caché a las respuestas del catálogo,
   * que compartían el tope de 60. Con la conexión de allá eso es pagar dos
   * veces por la misma foto y quedarse igualmente sin catálogo al perder la
   * señal.
   *
   * En su propia caché no le quitan sitio ni al código de la aplicación ni a
   * los datos, que es lo que hace falta para que la aplicación abra sin
   * conexión. Las fotos vienen después, como pediste.
   */
  if (ES_IMAGEN.test(url.pathname)) {
    evento.respondWith(foto(peticion));
    return;
  }

  // Todo lo que venga del servidor de la API son datos, lleve `/api/` en la
  // ruta o no: eso depende de dónde esté montada y no de lo que la cosa sea.
  if (deLaApi || url.pathname.startsWith('/api/')) {
    evento.respondWith(redPrimero(peticion, DATOS, TOPE_DATOS));
    return;
  }

  // Lo demás son ficheros del sitio, que llevan su huella en el nombre: si
  // está guardado, sirve, y no hace falta preguntar.
  evento.respondWith(cachePrimero(peticion, ESTATICOS, TOPE_ESTATICOS));
});

/**
 * La red manda; la caché es la red de seguridad.
 *
 * Para datos y navegaciones: lo que se enseña tiene que ser lo de ahora
 * siempre que se pueda, y lo guardado solo cuando no hay forma de preguntar.
 */
async function redPrimero(peticion, nombre, tope) {
  try {
    const respuesta = await fetch(peticion);
    if (respuesta.ok) await guardar(nombre, peticion, respuesta.clone(), tope);
    return respuesta;
  } catch {
    const guardada = await buscarVigente(nombre, peticion);
    if (guardada) return guardada;
    throw new Error('sin conexión y sin copia');
  }
}

/**
 * Lo guardado manda, y la red solo si no hay nada.
 *
 * Para los ficheros del sitio: llevan huella en el nombre, así que uno
 * guardado es exactamente el mismo fichero y preguntar por él es gastar datos.
 */
async function cachePrimero(peticion, nombre, tope) {
  const guardada = await buscarVigente(nombre, peticion);
  if (guardada) return guardada;
  const respuesta = await fetch(peticion);
  if (respuesta.ok) await guardar(nombre, peticion, respuesta.clone(), tope);
  return respuesta;
}

/**
 * Una foto: de la caché si está, y si no se pide **y se guarda**.
 *
 * El rodeo del `fetch` propio tiene motivo. Una `<img>` a otro dominio se pide
 * en modo `no-cors` y lo que vuelve es una respuesta **opaca**: no se puede
 * leer, `ok` es `false` y su cuerpo sale vacío al reempaquetarla, así que
 * guardarla con la hora pegada —como se hace con todo lo demás— deja una foto
 * rota en la caché. Comprobado: con el camino normal, cero fotos guardadas.
 *
 * Pidiéndola aquí en modo `cors` —que el servidor permite— la respuesta es
 * normal y corriente: se sella, se guarda y se devuelve. Si algún día dejara
 * de permitirlo, se cae al camino de siempre y la foto se enseña igual, solo
 * que sin guardarse.
 */
async function foto(peticion) {
  const guardada = await buscarVigente(IMAGENES, peticion, VIDA_IMAGENES);
  if (guardada) return guardada;

  try {
    const respuesta = await fetch(peticion.url, { mode: 'cors', credentials: 'omit' });
    if (respuesta.ok) {
      await guardar(IMAGENES, peticion, respuesta.clone(), TOPE_IMAGENES);
      return respuesta;
    }
  } catch {
    // Sin CORS o sin red: se intenta por las bravas, abajo.
  }
  return fetch(peticion);
}

/**
 * Abrir una pantalla.
 *
 * Esto es una sola aplicación: el servidor devuelve el mismo documento para
 * `/`, para `/explorar` y para `/producto/42`, y es el router quien decide qué
 * pintar. Por eso, sin conexión, **vale la copia de cualquiera de ellas**: con
 * el documento en la mano la aplicación arranca y el router hace el resto.
 *
 * Sin este respaldo, entrar sin señal a una pantalla que no se había visitado
 * daba error, aunque el documento estuviera guardado desde la primera visita.
 * Los trozos de código que cada pantalla carga aparte —el `lazy` del router—
 * ya están en la caché de estáticos si se pasó por ellos con conexión.
 */
async function navegacion(peticion) {
  try {
    const respuesta = await fetch(peticion);
    if (respuesta.ok) await guardar(ESTATICOS, peticion, respuesta.clone(), TOPE_ESTATICOS);
    return respuesta;
  } catch {
    const suya = await buscarVigente(ESTATICOS, peticion);
    if (suya) return suya;

    // El documento raíz, que se guarda al instalar: con él basta para que la
    // aplicación abra en cualquier pantalla.
    const raiz = await buscarVigente(ESTATICOS, '/');
    if (raiz) return raiz;

    // Y si no estuviera, cualquier pantalla que sí se haya visitado: el
    // documento es el mismo para todas.
    const cache = await caches.open(ESTATICOS);
    for (const clave of await cache.keys()) {
      if (clave.mode !== 'navigate') continue;
      const copia = await buscarVigente(ESTATICOS, clave);
      if (copia) return copia;
    }
    throw new Error('sin conexión y sin copia');
  }
}

/** Lo guardado, si no ha caducado. Si caducó, se borra y no se devuelve nada. */
async function buscarVigente(nombre, peticion, vida = VIDA_MAXIMA) {
  const cache = await caches.open(nombre);
  const guardada = await cache.match(peticion);
  if (!guardada) return null;

  const cuando = Number(guardada.headers.get(CUANDO) ?? 0);
  if (cuando && Date.now() - cuando < vida) return guardada;

  await cache.delete(peticion);
  return null;
}

/**
 * Guarda la respuesta con la hora pegada.
 *
 * Hay que rehacerla entera porque las cabeceras de una `Response` son de solo
 * lectura: no se le puede añadir una a la que ya llegó.
 */
async function guardar(nombre, peticion, respuesta, tope) {
  const cabeceras = new Headers(respuesta.headers);
  cabeceras.set(CUANDO, String(Date.now()));

  const conSello = new Response(await respuesta.blob(), {
    status: respuesta.status,
    statusText: respuesta.statusText,
    headers: cabeceras,
  });

  const cache = await caches.open(nombre);
  await cache.put(peticion, conSello);
  await recortar(cache, tope);
}

/**
 * Deja la caché en el tope, tirando lo más viejo.
 *
 * `keys()` las devuelve en el orden en que entraron, así que las primeras son
 * las que llevan más tiempo sin renovarse.
 */
async function recortar(cache, tope) {
  const claves = await cache.keys();
  if (claves.length <= tope) return;
  await Promise.all(claves.slice(0, claves.length - tope).map((c) => cache.delete(c)));
}

/** Pasa por todo y tira lo que ya no vale. Se hace al activar. */
async function limpiarCaducado() {
  // Cada una con su vida: a las fotos se les da una semana, y pasarles el
  // rasero de un día las borraría todas en el primer arranque del día.
  for (const [nombre, vida] of [
    [ESTATICOS, VIDA_MAXIMA],
    [DATOS, VIDA_MAXIMA],
    [IMAGENES, VIDA_IMAGENES],
  ]) {
    const cache = await caches.open(nombre);
    for (const clave of await cache.keys()) {
      const guardada = await cache.match(clave);
      const cuando = Number(guardada?.headers.get(CUANDO) ?? 0);
      if (!cuando || Date.now() - cuando >= vida) await cache.delete(clave);
    }
  }
}

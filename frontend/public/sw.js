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

const VERSION = 'v1';
const ESTATICOS = `agora-estaticos-${VERSION}`;
const DATOS = `agora-datos-${VERSION}`;

/** Un día, como se pidió. Pasado esto, lo guardado se tira. */
const VIDA_MAXIMA = 24 * 60 * 60 * 1000;

/** Cuántas respuestas de la API se guardan como mucho. */
const TOPE_DATOS = 60;

/** Cuántos ficheros del sitio se guardan como mucho. */
const TOPE_ESTATICOS = 120;

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
  evento.waitUntil(caches.open(ESTATICOS));
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      // Las cachés de versiones anteriores se van enteras: si cambia el
      // formato, lo guardado antes no vale y ocupa.
      const nombres = await caches.keys();
      await Promise.all(
        nombres
          .filter((n) => n.startsWith('agora-') && n !== ESTATICOS && n !== DATOS)
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

  // Nada de otros dominios: no es nuestro y no sabemos cuándo caduca.
  if (url.origin !== self.location.origin) return;

  if (NUNCA.some((trozo) => url.pathname.includes(trozo))) return;

  // Una navegación: primero la red, y si no hay, lo último que se vio.
  if (peticion.mode === 'navigate') {
    evento.respondWith(redPrimero(peticion, ESTATICOS, TOPE_ESTATICOS));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
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

/** Lo guardado, si no ha caducado. Si caducó, se borra y no se devuelve nada. */
async function buscarVigente(nombre, peticion) {
  const cache = await caches.open(nombre);
  const guardada = await cache.match(peticion);
  if (!guardada) return null;

  const cuando = Number(guardada.headers.get(CUANDO) ?? 0);
  if (cuando && Date.now() - cuando < VIDA_MAXIMA) return guardada;

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
  for (const nombre of [ESTATICOS, DATOS]) {
    const cache = await caches.open(nombre);
    for (const clave of await cache.keys()) {
      const guardada = await cache.match(clave);
      const cuando = Number(guardada?.headers.get(CUANDO) ?? 0);
      if (!cuando || Date.now() - cuando >= VIDA_MAXIMA) await cache.delete(clave);
    }
  }
}

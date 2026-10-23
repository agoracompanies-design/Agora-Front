/**
 * La última ubicación conocida, para no volver a encender el GPS.
 *
 * La portada de bienvenida ya pide el permiso al entrar; sin esto, tiraba las
 * coordenadas y el filtro «Cerca de mí» tenía que pedirlas otra vez. En un
 * teléfono modesto y con GPS frío, eso son varios segundos mirando «Buscando…»
 * para algo que la aplicación ya sabía.
 *
 * Se guarda en `sessionStorage` y no en `localStorage` a propósito: una
 * ubicación precisa es un dato delicado, y así se va sola al cerrar la pestaña
 * en vez de quedarse en el equipo. Además caduca a los diez minutos, que es
 * cuanto tiene sentido decir que alguien sigue donde estaba, y se borra al
 * cerrar sesión.
 */

const CLAVE = 'agora_ubicacion';
/** Cuánto vale una posición antes de volver a preguntar por ella. */
const VALIDEZ_MS = 10 * 60 * 1000;

export interface Coordenadas {
  lat: number;
  lng: number;
}

interface Guardada extends Coordenadas {
  /** Cuándo se tomó, para saber si todavía vale. */
  en: number;
}

export function guardarUbicacion({ lat, lng }: Coordenadas): void {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify({ lat, lng, en: Date.now() } satisfies Guardada));
  } catch {
    // Sin almacenamiento —modo privado, cuota— se sigue igual: solo se pierde
    // el atajo, no la función.
  }
}

/** La última posición si aún vale; si no, nada. */
export function ubicacionReciente(): Coordenadas | null {
  try {
    const bruto = sessionStorage.getItem(CLAVE);
    if (!bruto) return null;
    const datos: unknown = JSON.parse(bruto);
    if (typeof datos !== 'object' || datos === null) return null;
    const { lat, lng, en } = datos as Partial<Guardada>;
    // Se comprueba que sean números de verdad y no cualquier cosa que alguien
    // haya dejado en el almacenamiento: esto acaba viajando a la API.
    if (typeof lat !== 'number' || typeof lng !== 'number' || typeof en !== 'number') return null;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    if (Date.now() - en > VALIDEZ_MS) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

export function olvidarUbicacion(): void {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    // Igual que arriba: si no hay almacenamiento, no hay nada que borrar.
  }
}

/** Qué decirle a quien no consiguió compartir su ubicación. */
export function porQueFallo(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Tienes la ubicación bloqueada para Ágora. Actívala desde el candado de la barra de direcciones.';
  }
  if (error.code === error.TIMEOUT) {
    return 'Tu ubicación está tardando demasiado. Vuelve a intentarlo o filtra por provincia.';
  }
  return 'No conseguimos tu ubicación. Revisa que el GPS esté encendido.';
}

/**
 * Pide la ubicación al navegador y la guarda para la próxima.
 *
 * `maximumAge` deja al navegador devolver una posición de hasta cinco minutos
 * sin encender el GPS; es la segunda red, por si el atajo de arriba no está.
 */
export function pedirUbicacion(): Promise<Coordenadas> {
  return new Promise((resolver, rechazar) => {
    if (!navigator.geolocation) {
      rechazar(new Error('sin-soporte'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        guardarUbicacion(coords);
        resolver(coords);
      },
      rechazar,
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

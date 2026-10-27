/**
 * El código de quien trajo a este cliente.
 *
 * Llega en la URL (`/registrarse?ref=…`) desde el enlace que reparte cada
 * miembro del equipo, y tiene que sobrevivir hasta que la cuenta se cree de
 * verdad: entre que se abre el enlace y se termina el formulario, la persona
 * puede ir a ver los planes, volver, o recargar.
 *
 * **En `sessionStorage` y no en `localStorage`.** Esto vale para el registro que
 * se está haciendo ahora, no para siempre: si alguien abre la web un mes
 * después, no tiene por qué seguir contando como captado por aquel enlace.
 * Cerrar la pestaña lo borra, que es justo lo que se quiere.
 *
 * Cada acceso va en `try`: en una ventana privada o con el almacenamiento
 * bloqueado, tocarlo lanza. Un referido que no se guarda es una pena; una
 * pantalla de registro que no abre es un problema.
 */
const CLAVE = 'agora_ref';

/** Lo más largo que se acepta. Un código es corto; lo demás, basura. */
const LARGO_MAXIMO = 64;

export function guardarReferidoDeLaUrl(busqueda: string): void {
  try {
    const code = new URLSearchParams(busqueda).get('ref')?.trim();
    if (!code || code.length > LARGO_MAXIMO) return;
    sessionStorage.setItem(CLAVE, code);
  } catch {
    // Sin almacenamiento, el registro sigue: solo se pierde a quién atribuirlo.
  }
}

export function referidoGuardado(): string | undefined {
  try {
    return sessionStorage.getItem(CLAVE) ?? undefined;
  } catch {
    return undefined;
  }
}

/** Se olvida en cuanto la cuenta existe: ya cumplió. */
export function olvidarReferido(): void {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    // Nada que hacer; caduca al cerrar la pestaña.
  }
}

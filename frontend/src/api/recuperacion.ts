import { ApiError, apiClient } from './client';

/**
 * Recuperar la contraseña: código de seis dígitos por correo o por SMS.
 *
 * Contrato comprobado contra la API en local el 2026-10-23, sobre el commit
 * `642851a`: las rutas y los campos van en español —`via`, `contacto`,
 * `codigo`—, que es como quedó implementado. No sigue el criterio del resto de
 * la API, pero coincidir con el servidor importa más que la coherencia del
 * nombre.
 *
 * No hay ninguna otra vía, y no es un descuido: devolverle el acceso a alguien
 * hablando con un moderador significa que **una persona pone o ve la contraseña
 * de otra**, y nadie de aquí dentro tiene por qué conocer la clave de nadie.
 */

/** Por dónde se le manda el código a quien no puede entrar. */
export type Via = 'email' | 'phone';

/**
 * Las vías que se le ofrecen a la gente. **Hoy solo el correo.**
 *
 * El servidor acepta las dos y el envío está detrás de una interfaz con sus dos
 * implementaciones, pero el SMS necesita una pasarela con un teléfono y una SIM
 * cubana que todavía no está puesta. Mientras no lo esté, ofrecerlo sería
 * prometer un mensaje que no sale.
 *
 * El día que el teléfono esté: se añade `'phone'` aquí. La pantalla vuelve a
 * pintar sola el selector —se esconde cuando hay una sola vía— y no hay nada
 * más que tocar.
 */
export const VIAS_DISPONIBLES: readonly Via[] = ['email'];

/** Cuánto vive el código, para poder decirlo en pantalla sin inventarlo. */
export const MINUTOS_DEL_CODIGO = 10;

/** Cuántas veces se puede fallar antes de tener que pedir otro. */
export const INTENTOS_DEL_CODIGO = 5;

/**
 * Cuántos códigos se pueden pedir y en cuánto rato.
 *
 * El servidor admite **3 por cada 15 minutos** y por encima de eso responde 200
 * sin mandar nada, así que la pantalla tiene que llevar la cuenta: si no, pedir
 * el cuarto parecería funcionar y no llegaría nada.
 */
export const CODIGOS_POR_VENTANA = 3;
export const MINUTOS_DE_LA_VENTANA = 15;

/**
 * La espera entre un código y el siguiente, que es cosa de la pantalla.
 *
 * El servidor no exige ninguna —solo el tope de arriba—, pero sin esto un doble
 * toque gasta dos de los tres intentos de la ventana sin que nadie se entere.
 */
export const SEGUNDOS_ENTRE_CODIGOS = 60;

/**
 * Si el servidor que hay delante todavía no sabe recuperar contraseñas.
 *
 * Se reconoce por el 404: allí las rutas no existen. Es el único caso en el que
 * la pantalla puede decir algo útil, porque ningún otro error distingue «no
 * implementado» de «no te lo voy a contar».
 */
export function esServidorSinRecuperacion(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/**
 * Pide el código.
 *
 * **Responde 200 aunque la cuenta no exista**, y es a propósito: si contestara
 * distinto, esta ruta sería una forma cómoda de averiguar qué usuarios hay
 * registrados. Por eso la pantalla pasa al paso siguiente siempre, y quien se
 * equivocó de datos simplemente no recibe nada.
 */
export function pedirCodigo(input: { username: string; via: Via; contacto: string }) {
  return apiClient
    .post<{ mensaje: string }>('/auth/recuperar/solicitar', input)
    .then((r) => r.data);
}

/**
 * Comprueba el código y devuelve el permiso para cambiar la contraseña.
 *
 * El `ticket` es de un solo uso y dura cinco minutos: sirve para que el paso de
 * la contraseña nueva no tenga que volver a mandar el código, que si no habría
 * que guardarlo en algún sitio del navegador.
 *
 * Cuando falla no dice por qué —código errado, caducado, gastado o sin
 * intentos—, y tampoco cuántos quedan: esa cuenta la lleva esta pantalla.
 */
export function verificarCodigo(input: { username: string; codigo: string }) {
  return apiClient
    .post<{ ticket: string }>('/auth/recuperar/verificar', input)
    .then((r) => r.data);
}

/** Pone la contraseña nueva. El permiso muere aquí y caen las sesiones abiertas. */
export function cambiarPassword(input: { ticket: string; password: string }) {
  return apiClient.post<void>('/auth/recuperar/cambiar', input).then((r) => r.data);
}

/**
 * Para quien no recuerda su nombre de usuario.
 *
 * Se le manda a la misma vía de contacto con la que se registró. Igual que
 * arriba: responde 200 exista o no, y no dice nada por pantalla sobre si
 * encontró la cuenta.
 */
export function recordarUsuario(input: { via: Via; contacto: string }) {
  return apiClient
    .post<{ mensaje: string }>('/auth/recuperar/usuario', input)
    .then((r) => r.data);
}

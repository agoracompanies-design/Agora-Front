import { apiClient } from './client';

/**
 * Si el servidor sabe ya recuperar una contraseña.
 *
 * **Todavía no.** No hay rutas, ni tabla de códigos, ni envío de correo o SMS.
 * Está pedido como punto 5, con este mismo contrato.
 *
 * Mientras valga `false` **no hay forma de recuperar una contraseña**, y se
 * asume a propósito: la vía de antes era escribirle a un moderador por WhatsApp,
 * y eso significaba que alguien de aquí dentro ponía o veía la clave de otra
 * persona. Se quitó por eso, no por descuido. La pantalla avisa de que todavía
 * no está conectada en vez de aparentar que mandó algo.
 *
 * Cambiar esto a `true` es lo único que hace falta el día que el servidor
 * responda.
 */
export const RECUPERACION_LISTA = false;

/** Por dónde se le manda el código a quien no puede entrar. */
export type Via = 'email' | 'phone';

/**
 * Pide el código.
 *
 * **Responde 200 aunque la cuenta no exista**, y es a propósito: si contestara
 * distinto, esta ruta sería una forma cómoda de averiguar qué usuarios hay
 * registrados. Por eso la pantalla pasa al paso siguiente siempre, y quien se
 * equivocó de datos simplemente no recibe nada.
 */
export function pedirCodigo(input: { username: string; via: Via; contacto: string }) {
  return apiClient.post<void>('/auth/recuperar/solicitar', input).then((r) => r.data);
}

/**
 * Comprueba el código y devuelve el permiso para cambiar la contraseña.
 *
 * El `ticket` es de un solo uso y corto: sirve para que el paso de la
 * contraseña nueva no tenga que volver a mandar el código, que si no habría que
 * guardarlo en algún sitio del navegador.
 */
export function verificarCodigo(input: { username: string; codigo: string }) {
  return apiClient
    .post<{ ticket: string }>('/auth/recuperar/verificar', input)
    .then((r) => r.data);
}

/** Pone la contraseña nueva. El `ticket` muere aquí. */
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
  return apiClient.post<void>('/auth/recuperar/usuario', input).then((r) => r.data);
}

/** Cuánto vive el código, para poder decirlo en pantalla sin inventarlo. */
export const MINUTOS_DEL_CODIGO = 10;

/** Cuántas veces se puede fallar antes de tener que pedir otro. */
export const INTENTOS_DEL_CODIGO = 5;

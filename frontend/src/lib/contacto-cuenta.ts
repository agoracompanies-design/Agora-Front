/**
 * El contacto con el que se abre una cuenta: un correo o un teléfono.
 *
 * Sirve para lo mismo en los dos casos —que detrás de la cuenta haya alguien
 * localizable—, así que se pide en un solo campo y aquí se decide qué es. Pedir
 * dos campos y dejar rellenar cualquiera confunde más de lo que ayuda.
 */

/** Un correo con forma de correo. No comprueba que exista: eso es del servidor. */
const CORREO = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export type TipoDeContacto = 'correo' | 'telefono' | null;

/** Qué escribió: un correo, un teléfono, o nada aprovechable todavía. */
export function tipoDeContacto(valor: string): TipoDeContacto {
  const limpio = valor.trim();
  if (!limpio) return null;
  if (limpio.includes('@')) return CORREO.test(limpio) ? 'correo' : null;
  // Un teléfono cubano son ocho dígitos; con prefijo, diez. Se admiten los dos
  // y también los de fuera, que pueden ser más largos.
  const digitos = limpio.replace(/\D/g, '');
  if (digitos.length < 8 || digitos.length > 15) return null;
  return 'telefono';
}

/** Si vale para dar de alta una cuenta. */
export function contactoValido(valor: string): boolean {
  return tipoDeContacto(valor) !== null;
}

/** Qué decirle a quien todavía no escribió algo válido. */
export function avisoDeContacto(valor: string): string | null {
  const limpio = valor.trim();
  if (!limpio) return 'Escribe un correo o un teléfono.';
  if (contactoValido(limpio)) return null;
  if (limpio.includes('@')) return 'Ese correo no parece completo.';
  return 'Un teléfono lleva al menos ocho dígitos.';
}

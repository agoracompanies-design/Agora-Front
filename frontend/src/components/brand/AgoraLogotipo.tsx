// Generado por `Utiles/logo-v10-boceto/entrega/integrar.py`. No editar a mano:
// se regenera con `python generar.py && python integrar.py`.
import { cn } from '@/lib/utils';

interface MarcaProps {
  className?: string;
  /**
   * El nombre que oirá quien use un lector de pantalla.
   *
   * Por defecto no dice nada —`aria-hidden`—, porque casi siempre el dibujo va
   * junto a un texto que ya pone «Ágora» y repetirlo sobra. Se le pasa un
   * título solo cuando va solo.
   */
  title?: string;
}

/**
 * La palabra sola, cuando el símbolo ya está a la vista.
 *
 * Pinta con `currentColor`, así que el color lo da el texto que lo rodea y
 * sigue al modo claro u oscuro sin una variante aparte. El tamaño lo fija quien
 * lo coloca; por debajo de 120 px de ancho el dibujo se empasta.
 */
export function AgoraLogotipo({ className, title }: MarcaProps) {
  return (
    <svg
      viewBox="0 0 406.7 100.0"
      fill="currentColor"
      fillRule="evenodd"
      className={cn('marca', className)}
      {...(title ? { role: 'img' as const } : { 'aria-hidden': true })}
    >
      {title ? <title>{title}</title> : null}
      <path d="M0 100C12.1 66.3 25.7 33.1 39.4 0C42.3 0 43.4 3 43.9 4.3L78.7 100C67.7 100 67.7 100 58.2 73.8C49.9 59.8 23.2 64.3 13.7 84.2C7.1 100 7.1 100 7.1 100ZM53.1 59.8L39.4 22.2L21.8 64.6C30.1 56.7 42.7 56.6 53.1 59.8Z" />
      <path d="M112.7 100C77.3 100 73.3 80 73.3 52.8C73.3 0 101.5 0 112.7 0C142.7 0 150.9 4.9 150.9 25.3C145.5 4.9 130.3 4.9 112.7 4.9C82.6 4.9 84 34.4 84 54.3C84 74.1 87.5 95 112.7 95C146.8 95 140.5 72.2 141.1 52.9C135.4 52.3 123.9 51.1 113.4 62.7C113.8 51.6 123.9 45.4 139.3 45.4C147 45.4 152.1 45.5 152.1 48.8L152.1 48.8C152.1 88 148.1 100 112.7 100Z" />
      <path d="M196.4 100C177.1 100 157 97.5 157 57.3C157 -2.5 190.2 0 196.4 0C202.6 0 235.8 -2.5 235.8 57.3C235.8 97.5 215.8 100 196.4 100ZM224.8 59.8C226.9 39.3 217 5 196.4 5C175.8 5 166 39.3 168 59.8C169.5 74.8 174.7 95.1 196.4 95.1C218.2 95.1 223.3 74.8 224.8 59.8Z" />
      <path d="M322.9 100C319.6 100.1 316.6 99.8 314.4 97.5C311.1 94.2 309.9 86.2 307.9 79.9C305 70.3 296.5 59.8 280 59.8L256.8 59.8L256.8 100L245.8 100L245.8 50.7L245.8 8.2C245.4 3 240 0 241.3 0L294.7 0C318.6 0 322.9 23.8 322.9 30.8C322.9 40.2 320.4 59.8 303.8 59.8C309.5 63.3 312.4 67 314.3 71.3C318.2 80.5 320.7 93.4 322.9 100ZM256.8 48.8L294.7 48.8C302.7 48.8 311.8 48.8 311.8 30.8C311.8 11 297.8 11 294.7 11L256.8 11Z" />
      <path d="M327.9 100C340 66.3 353.6 33.1 367.3 0C370.3 0 371.3 3 371.8 4.3L406.7 100C395.6 100 395.6 100 386.1 73.8C377.9 59.8 351.1 64.3 341.6 84.2C335.1 100 335.1 100 335.1 100ZM381 59.8L367.3 22.2L349.7 64.6C358.1 56.7 370.6 56.6 381 59.8Z" />
    </svg>
  );
}

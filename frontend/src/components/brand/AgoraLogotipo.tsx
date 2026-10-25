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
 * lo coloca; por debajo de 135 px de ancho el dibujo se empasta.
 */
export function AgoraLogotipo({ className, title }: MarcaProps) {
  return (
    <svg
      viewBox="0 0 406.5 100.0"
      fill="currentColor"
      fillRule="evenodd"
      className={cn('marca', className)}
      {...(title ? { role: 'img' as const } : { 'aria-hidden': true })}
    >
      {title ? <title>{title}</title> : null}
      <path d="M0 100C12.2 66.2 25.7 33.1 39.4 0C42.4 0 43.5 3 43.9 4.3L78.8 100C67.7 100 67.7 100 58.2 73.8C50 59.8 23.3 64.3 13.7 84.2C7.2 100 7.2 100 7.2 100ZM53.1 59.8L39.4 22.2L21.8 64.6C30.2 56.7 42.8 56.6 53.1 59.8Z" />
      <path d="M112.7 100C77.4 100 73.4 80 73.4 52.8C73.4 0 101.5 0 112.7 0C142.8 0 151 4.9 151 25.3C145.5 4.9 130.3 4.9 112.7 4.9C82.7 4.9 84.1 34.4 84.1 54.3C84.1 74.1 87.6 95 112.7 95C146.9 95 140.6 72.2 141.1 52.9C135.4 52.3 123.9 51.1 113.4 62.7C113.8 51.6 123.9 45.4 139.4 45.4C147.1 45.4 152.1 45.5 152.1 48.8L152.1 48.8C152.1 87.9 148.1 100 112.7 100Z" />
      <path d="M196.5 100C177.1 100 157.1 97.5 157.1 57.3C157.1 -2.5 190.2 0 196.5 0C202.7 0 235.8 -2.5 235.8 57.3C235.8 97.5 215.8 100 196.5 100ZM224.8 59.8C226.9 39.3 217 5 196.5 5C175.9 5 166 39.3 168.1 59.8C169.6 74.8 174.7 95.1 196.5 95.1C218.2 95.1 223.3 74.8 224.8 59.8Z" />
      <path d="M246 87.7L246 12.3L266.4 12.3L266.4 87.7ZM257.7 84.8L257.7 15.1L254.8 15.1L254.8 84.8C256.6 84.8 256.8 84.8 257.7 84.8ZM248.9 84.8L251.9 84.8L251.9 15.1L248.9 15.1C249 39.5 248.9 62.8 248.9 84.8ZM263.5 84.8C263.5 39.8 263.5 17.4 263.5 15.1C262.5 15.1 261.3 15.1 260.6 15.1C260.6 16.4 260.6 60.9 260.6 84.8C261.6 84.8 262.6 84.8 263.5 84.8Z" />
      <path d="M243.1 93.8L243.1 89.5L269.3 89.5L269.3 93.8Z" />
      <path d="M241.7 100L241.7 95.6L270.8 95.6C270.8 97.5 270.8 98.9 270.8 100C260.6 100 250.9 100 241.7 100Z" />
      <path d="M243.1 10.5L243.1 6.2L269.3 6.2L269.3 4.4L241.7 4.4L241.7 0L272.2 0C275.2 0 279 0 293.1 0C314.5 0 323.1 17.3 323.1 29.7C323.1 34.4 322.5 56 304 59.8C317.5 70.2 318.7 84.5 323.1 100C317.8 100 313.6 100 310.8 89.5C308.1 79.9 306.1 61.2 280.2 59.8L267.9 59.8L267.9 48.8L292.6 48.9C304.8 48.9 312 48.1 312 29.7C312 19.5 307.3 10.5 293 10.5L270.8 10.5" />
      <path d="M406.5 100C394.4 66.2 380.8 33.1 367.1 0C364.2 0 363.1 3 362.6 4.3L327.9 100C338.8 100 338.8 100 348.3 73.8C356.6 59.8 383.3 64.3 392.8 84.2C399.4 100 399.4 100 399.4 100ZM353.5 59.8L367.1 22.2L384.7 64.6C376.4 56.7 363.8 56.6 353.5 59.8Z" />
    </svg>
  );
}

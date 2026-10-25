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
      viewBox="0 0 406.6 100.0"
      fill="currentColor"
      fillRule="evenodd"
      className={cn('marca', className)}
      {...(title ? { role: 'img' as const } : { 'aria-hidden': true })}
    >
      {title ? <title>{title}</title> : null}
      <path d="M0 100C12.1 66.2 25.7 33.1 39.4 0C42.3 0 43.4 3 43.9 4.3L78.7 100C67.7 100 67.7 100 58.2 73.8C49.9 59.8 23.2 64.3 13.7 84.2C7.1 100 7.1 100 7.1 100ZM53.1 59.8L39.4 22.2L21.8 64.6C30.1 56.7 42.7 56.6 53.1 59.8Z" />
      <path d="M112.7 100C77.3 100 73.3 80 73.3 52.8C73.3 0 101.5 0 112.7 0C142.7 0 150.9 4.9 150.9 25.3C145.5 4.9 130.3 4.9 112.7 4.9C82.6 4.9 84 34.4 84 54.3C84 74.1 87.5 95 112.7 95C146.8 95 140.5 72.2 141.1 52.9C135.4 52.3 123.8 51.1 113.4 62.7C113.8 51.6 123.8 45.4 139.3 45.4C147 45.4 152 45.5 152 48.8L152 48.8C152 87.9 148 100 112.7 100Z" />
      <path d="M196.4 100C177.1 100 157 97.5 157 57.3C157 -2.5 190.2 0 196.4 0C202.6 0 235.8 -2.5 235.8 57.3C235.8 97.5 215.8 100 196.4 100ZM224.8 59.8C226.8 39.3 217 5 196.4 5C175.8 5 166 39.3 168 59.8C169.5 74.8 174.7 95.1 196.4 95.1C218.2 95.1 223.3 74.8 224.8 59.8Z" />
      <path d="M246 87.7L246 12.3L266.4 12.3L266.4 87.7ZM257.6 84.8L257.6 15.1L254.7 15.1L254.7 84.8C256.5 84.8 256.7 84.8 257.6 84.8ZM248.9 84.8L251.8 84.8L251.8 15.1L248.9 15.1C248.9 39.5 248.9 62.8 248.9 84.8ZM263.5 84.8C263.5 39.8 263.5 17.4 263.5 15.1C262.5 15.1 261.3 15.1 260.5 15.1C260.5 16.4 260.5 60.9 260.5 84.8C261.6 84.8 262.5 84.8 263.5 84.8Z" />
      <path d="M243.1 93.8L243.1 89.5L269.3 89.5L269.3 93.8Z" />
      <path d="M241.6 100L241.6 95.6L270.7 95.6C270.7 97.5 270.7 98.9 270.7 100C260.5 100 250.9 100 241.6 100Z" />
      <path d="M243.1 10.5L243.1 6.2L269.3 6.2L269.3 4.4L241.6 4.4L241.6 0L272.2 0C275.1 0 279 0 293.1 0C314.5 0 323 17.3 323 29.7C323 34.4 322.4 56 303.9 59.8C317.4 70.2 318.7 84.5 323.1 100C317.8 100 313.6 100 310.7 89.5C308.1 79.9 306 61.2 280.2 59.8L267.8 59.8L267.8 48.8L292.6 48.9C304.8 48.9 312 48.1 312 29.7C312 19.5 307.2 10.5 292.9 10.5L270.7 10.5" />
      <path d="M327.8 100C340 66.2 353.5 33.1 367.2 0C370.2 0 371.3 3 371.7 4.3L406.6 100C395.5 100 395.5 100 386 73.8C377.8 59.8 351.1 64.3 341.5 84.2C335 100 335 100 335 100ZM380.9 59.8L367.2 22.2L349.6 64.6C358 56.7 370.6 56.6 380.9 59.8Z" />
    </svg>
  );
}

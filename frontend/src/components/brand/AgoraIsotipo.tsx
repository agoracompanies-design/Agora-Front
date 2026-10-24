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
 * El símbolo solo: avatares, marcas de agua, huecos cuadrados.
 *
 * Pinta con `currentColor`, así que el color lo da el texto que lo rodea y
 * sigue al modo claro u oscuro sin una variante aparte. El tamaño lo fija quien
 * lo coloca; por debajo de 48 px de ancho el dibujo se empasta.
 */
export function AgoraIsotipo({ className, title }: MarcaProps) {
  return (
    <svg
      viewBox="0 0 227.2 200.0"
      fill="currentColor"
      fillRule="evenodd"
      className={cn('marca', className)}
      {...(title ? { role: 'img' as const } : { 'aria-hidden': true })}
    >
      {title ? <title>{title}</title> : null}
      <path d="M142.8 8.7C142.8 4.7 142.8 4.7 142.8 0C136.9 0 90.3 0 84.5 0C84.5 4.7 84.5 4.7 84.5 8.7C93.2 8.7 136.9 8.7 142.8 8.7Z" />
      <path d="M87.4 21.1C87.4 20.2 87.4 17.4 87.4 12.3C93.2 12.3 135 12.3 139.8 12.3C139.8 17.2 139.8 19.1 139.8 21.1C133.9 21.1 90.3 21.1 87.4 21.1Z" />
      <path d="M93.2 175.3L93.2 24.7L134 24.7L134 175.3ZM116.5 169.5L116.5 30.1L110.7 30.1L110.7 169.5C114.3 169.5 114.7 169.5 116.5 169.5ZM99.1 169.5L104.9 169.5L104.9 30.1L99.1 30.1C99.1 79 99.1 125.6 99.1 169.5ZM128.2 169.5C128.2 79.5 128.2 34.8 128.2 30.1C126.2 30.1 123.8 30.1 122.4 30.1C122.4 32.9 122.4 121.7 122.4 169.5C124.4 169.5 126.3 169.5 128.2 169.5Z" />
      <path d="M0 200L0 191.3C4.6 191.3 6.6 187.7 6.6 187.7L90.3 30.1L90.3 92.8C81.3 109.7 64.4 142 61.3 147.7L90.3 147.7L90.3 156.4L56.7 156.4C52 165.2 43.4 181.3 40.1 187.7C40.1 191.3 42 191.3 46.6 191.3L46.6 200Z" />
      <path d="M87.4 187.7L87.4 178.9L139.8 178.9L139.8 187.7Z" />
      <path d="M84.5 200L84.5 191.3L142.8 191.3C142.8 194.9 142.8 197.8 142.8 200C122.4 200 103 200 84.5 200Z" />
      <path d="M180.6 200L180.6 191.3C187.2 191.3 187.2 187.7 187.2 187.7C183.2 181.6 166.9 156.4 166.9 156.4L136.9 156.4L136.9 147.7L161.2 147.7C157.5 142 142.8 119.2 136.9 110.3L136.9 58.7C162.8 98.6 206.4 165.6 220.7 187.7C220.7 187.7 223 191.3 227.2 191.3L227.2 200Z" />
    </svg>
  );
}

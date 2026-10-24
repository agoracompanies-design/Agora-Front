import { Link } from 'react-router-dom';
import { AgoraHorizontal } from '@/components/brand';
import { cn } from '@/lib/utils';

/**
 * La marca, enlazando a la portada.
 *
 * Es el dibujo oficial —`Utiles/logo-v10-boceto/entrega`—, no una «A» en un
 * cuadro como hasta ahora. Va la combinación horizontal, que es la que pide el
 * sitio donde se usa: barras y cabeceras, donde sobra ancho y falta alto.
 *
 * **El alto no es decorativo.** El logotipo se lee desde 120 px de ancho, y en
 * esta combinación la palabra ocupa dos tercios del dibujo: por debajo de unos
 * 44 px de alto las estrías de la columna empiezan a empastarse. De ahí el
 * `h-11`, que es más de lo que ocupaba el marcador anterior.
 *
 * El color lo pone este componente y lo hereda el dibujo por `currentColor`:
 * azul de marca sobre fondo claro, blanco sobre fondo oscuro. No hay dos
 * ficheros, hay una clase.
 */
export function Logo({
  id = 'logo',
  className,
  dark = false,
}: {
  id?: string;
  className?: string;
  dark?: boolean;
}) {
  return (
    <Link
      to="/"
      id={id}
      aria-label="Ágora, ir a la portada"
      className={cn(
        'logo inline-flex select-none items-center',
        // Azul de marca sobre claro; blanco sobre oscuro. El azul cumple el 3:1
        // de WCAG sobre el fondo oscuro, pero justo —3,2:1— y se apaga, así que
        // en oscuro se usa la tinta blanca que la propia marca prevé.
        dark ? 'text-white' : 'text-primary dark:text-white',
        className,
      )}
    >
      {/* Sin `title`: el nombre accesible ya lo da el `aria-label` del enlace,
          y dos nombres para la misma cosa se leen dos veces. */}
      <AgoraHorizontal className="logo__mark h-11 w-auto" />
    </Link>
  );
}

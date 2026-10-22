import { useEffect, useState } from 'react';

/**
 * La dirección con la que enseñar la foto recién elegida, sin dejar basura.
 *
 * `URL.createObjectURL` reserva memoria que el navegador **no suelta solo**:
 * hay que devolverla con `revokeObjectURL`. Llamándolo en mitad del render,
 * como se hacía antes, se creaba una dirección nueva en cada pulsación de
 * tecla del formulario —ninguna liberada—, y además cambiaba el `key` de la
 * miniatura, que se desmontaba y volvía a montar sin motivo.
 *
 * Aquí se crea una sola vez por archivo y se libera al cambiarlo o al salir.
 * El aviso del lint sobre `setState` dentro de un efecto no aplica: esto es
 * justo lo que un efecto debe hacer, sincronizar con algo de fuera de React.
 *
 * @param archivo el que acaba de elegir quien publica, o `null`
 * @param respaldo la foto que ya tenía guardada, para cuando no hay archivo
 */
export function useVistaPrevia(archivo: File | null, respaldo: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!archivo) {
      setUrl(null);
      return;
    }
    const creada = URL.createObjectURL(archivo);
    setUrl(creada);
    return () => URL.revokeObjectURL(creada);
  }, [archivo]);

  return url ?? respaldo;
}

import { useEffect, useRef } from 'react';

/**
 * Deja pegar una imagen con Ctrl+V en cualquier formulario que pida una.
 *
 * Es el camino corto para lo que más se hace: recortar la pantalla, o copiar
 * una foto desde otra aplicación, y soltarla aquí sin pasar por guardar el
 * archivo, abrir el explorador y buscarlo.
 *
 * Escucha en el documento entero y no en un campo concreto porque el pegado no
 * tiene dónde caer: en un formulario con una sola imagen, quien pulsa Ctrl+V
 * quiere pegarla ahí, tenga el foco donde lo tenga.
 */
export function usePegarImagen(alPegar: (archivo: File) => void, activo = true) {
  // Por referencia: si se guardara como dependencia, cada render volvería a
  // suscribir y desuscribir el escuchador sin necesidad.
  const manejar = useRef(alPegar);
  manejar.current = alPegar;

  useEffect(() => {
    if (!activo) return;

    function pegar(e: ClipboardEvent) {
      const elemento = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'));
      if (!elemento) return;
      const archivo = elemento.getAsFile();
      if (!archivo) return;
      // Solo se intercepta cuando de verdad venía una imagen: pegar texto en un
      // campo de texto tiene que seguir funcionando.
      e.preventDefault();
      manejar.current(archivo);
    }

    document.addEventListener('paste', pegar);
    return () => document.removeEventListener('paste', pegar);
  }, [activo]);
}

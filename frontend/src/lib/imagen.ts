/**
 * Convierte a WebP lo que sube el negocio, antes de mandarlo.
 *
 * Una foto de móvil son tres o cuatro megas y cuatro mil píxeles de ancho para
 * enseñarse en una tarjeta de 190. En una conexión como la de aquí eso se paga
 * dos veces: al subirla y cada vez que alguien abre el catálogo. WebP pesa
 * bastante menos que JPEG a igualdad de calidad, y el recorte de tamaño —que es
 * donde está la mayor parte del ahorro— no se nota en pantalla.
 *
 * Se hace en el navegador, sin librerías: `canvas` sabe exportar a WebP desde
 * hace años. Si algo falla, se envía el archivo original: subir una foto pesada
 * es mejor que no poder publicar.
 */

/** Lado máximo. Muy por encima de lo que la ficha llega a mostrar. */
const LADO_MAXIMO = 1600;
/** Calidad de la codificación. Por debajo de 0,8 empiezan a verse los bordes. */
const CALIDAD = 0.85;

export interface ResultadoConversion {
  archivo: File;
  /** Bytes originales y finales, para poder decir cuánto se ahorró. */
  antes: number;
  despues: number;
  convertida: boolean;
}

export async function aWebp(original: File): Promise<ResultadoConversion> {
  const sinTocar: ResultadoConversion = {
    archivo: original,
    antes: original.size,
    despues: original.size,
    convertida: false,
  };

  // Un GIF animado pasaría a ser un WebP de un solo fotograma: se deja estar.
  if (original.type === 'image/gif') return sinTocar;

  try {
    // `from-image` aplica la orientación EXIF; sin esto, las fotos hechas en
    // vertical con el móvil se publicarían tumbadas.
    const bitmap = await createImageBitmap(original, { imageOrientation: 'from-image' });
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);

    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const contexto = lienzo.getContext('2d');
    if (!contexto) return sinTocar;
    contexto.drawImage(bitmap, 0, 0, ancho, alto);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolver) =>
      lienzo.toBlob(resolver, 'image/webp', CALIDAD),
    );
    // Un navegador sin WebP devuelve un PNG sin avisar, y ese pesa más que el
    // original: se comprueba el tipo antes de dar el cambio por bueno.
    if (!blob || blob.type !== 'image/webp') return sinTocar;
    if (blob.size >= original.size && original.type === 'image/webp') return sinTocar;

    const nombre = original.name.replace(/\.[^.]+$/, '') || 'imagen';
    return {
      archivo: new File([blob], `${nombre}.webp`, { type: 'image/webp' }),
      antes: original.size,
      despues: blob.size,
      convertida: true,
    };
  } catch {
    return sinTocar;
  }
}

/** «2,4 MB», «180 kB»: para decirle a quien publica qué acaba de subir. */
export function pesoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

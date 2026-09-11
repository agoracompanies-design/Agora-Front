import { ImagePlus } from 'lucide-react';
import { EnterpriseLogo } from './EnterpriseLogo';
import { LOGO_DE_EMPRESA_LISTO } from '@/api/userEnterprise';
import { usePegarImagen } from '@/hooks/usePegarImagen';
import { aWebp, pesoLegible } from '@/lib/imagen';
import { useState } from 'react';

interface LogoFieldProps {
  /** Para el cuadrado con la inicial mientras no hay logo. */
  nombre: string;
  /** El logo guardado, si el negocio ya tiene uno. */
  actual?: string | null;
  /** El elegido ahora, todavía sin guardar. */
  archivo: File | null;
  onArchivo: (archivo: File | null) => void;
}

/**
 * El logo del negocio: enseña el que hay y deja cambiarlo.
 *
 * Mismo trato que la foto de un producto —se pasa a WebP antes de subir y se
 * puede pegar con Ctrl+V—, porque es la misma operación y no tiene por qué
 * comportarse distinto según la pantalla.
 */
export function LogoField({ nombre, actual, archivo, onArchivo }: LogoFieldProps) {
  const [convirtiendo, setConvirtiendo] = useState(false);
  const [conversion, setConversion] = useState<{ antes: number; despues: number } | null>(null);

  async function elegir(entrada: File | null) {
    if (!entrada) {
      onArchivo(null);
      setConversion(null);
      return;
    }
    setConvirtiendo(true);
    try {
      const { archivo: listo, antes, despues, convertida } = await aWebp(entrada);
      onArchivo(listo);
      setConversion(convertida ? { antes, despues } : null);
    } finally {
      setConvirtiendo(false);
    }
  }

  usePegarImagen(elegir);

  // Lo que se ve: lo recién elegido manda sobre lo guardado.
  const vistaPrevia = archivo ? URL.createObjectURL(archivo) : null;

  return (
    <div id="logo-field" className="logo-field">
      <span id="logo-field__label" className="logo-field__label mb-1.5 block text-sm font-medium text-ink-800">
        Logo del negocio
      </span>

      <div id="logo-field__row" className="logo-field__row flex items-center gap-4">
        {vistaPrevia ? (
          <span
            id="logo-field__preview"
            className="logo-field__preview flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ink-100"
          >
            <img src={vistaPrevia} alt="" className="h-full w-full object-cover" />
          </span>
        ) : (
          <EnterpriseLogo id="logo-field__current" nombre={nombre || '?'} logo={actual} className="h-16 w-16" textoClassName="text-xl" />
        )}

        <div id="logo-field__actions" className="logo-field__actions min-w-0">
          <label
            id="logo-field__button"
            className="logo-field__button inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:border-ink-400"
          >
            <ImagePlus size={15} aria-hidden="true" />
            {archivo || actual ? 'Cambiar logo' : 'Subir logo'}
            <input
              type="file"
              accept="image/*"
              id="logo-field__input"
              className="logo-field__input hidden"
              onChange={(e) => elegir(e.target.files?.[0] ?? null)}
            />
          </label>
          <p id="logo-field__paste" className="logo-field__paste mt-1.5 text-xs text-ink-400">
            o pégalo con Ctrl+V
          </p>
        </div>
      </div>

      {convirtiendo && (
        <p id="logo-field__working" className="logo-field__working mt-2 text-xs text-ink-500">Preparando la imagen…</p>
      )}
      {conversion && !convirtiendo && (
        <p id="logo-field__saved" className="logo-field__saved mt-2 text-xs text-ink-500">
          Convertido a WebP: {pesoLegible(conversion.antes)} → {pesoLegible(conversion.despues)}
        </p>
      )}
      {/* Mientras el servidor no lo guarde, se dice aquí: vale más un aviso que
          un logo que desaparece al recargar. */}
      {!LOGO_DE_EMPRESA_LISTO && (
        <p id="logo-field__pending" className="logo-field__pending mt-2 text-xs text-ink-500">
          Guardar el logo estará disponible en cuanto el servidor lo admita. Hasta entonces tu negocio se
          identifica con la inicial de su nombre.
        </p>
      )}
    </div>
  );
}

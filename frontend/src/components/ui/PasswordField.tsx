import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Field';

/**
 * Campo de contraseña con el ojo de siempre para verla mientras se escribe.
 *
 * Escribir a ciegas es la causa más común de «contraseña incorrecta» en un
 * móvil, y en el registro obliga a repetirla dos veces sin poder comprobar
 * ninguna. El estado no se comparte entre campos: cada uno se destapa por su
 * cuenta, que es lo que se espera al pulsar su ojo y no el del vecino.
 */
export function PasswordField({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <Input
        label={label}
        hint={hint}
        type={visible ? 'text' : 'password'}
        // Sitio para el botón, para que no se monte sobre lo escrito.
        className="pr-11"
        // Como adorno del propio campo: así queda centrado contra el control y
        // no contra el bloque entero. Antes iba con un `top` de 38 px, que solo
        // acertaba cuando el campo no llevaba pista ni mensaje de error.
        adorno={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            className="password-field__toggle flex h-6 w-6 items-center justify-center rounded text-ink-400 transition-colors hover:text-ink-900"
          >
            {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        }
        {...props}
      />
    </div>
  );
}

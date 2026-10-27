import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface WrapperProps {
  /** Identifica el control; de él cuelgan los del rótulo, la ayuda y el error. */
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/**
 * Los ids se generan, no se escriben.
 *
 * Estaban fijos —`field`, `field__label`…— así que cualquier formulario con dos
 * campos repetía el mismo id cuatro veces. Un id repetido no es solo HTML
 * inválido: rompe a quien lo busca, y `aria-describedby` apunta al primero que
 * encuentre, que puede ser la ayuda de otro campo.
 */
function FieldWrapper({ id, label, hint, error, children }: WrapperProps) {
  return (
    <label id={`${id}__field`} htmlFor={id} className="field block">
      {label && (
        <span id={`${id}__label`} className="field__label mb-1.5 block text-sm font-medium text-ink-800">
          {label}
        </span>
      )}
      {children}
      {error ? (
        <span id={`${id}__error`} className="field__error mt-1.5 block text-xs text-red-600">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}__hint`} className="field__hint mt-1.5 block text-xs text-ink-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

/** A qué texto se refiere el control, para que un lector de pantalla lo lea. */
function describe(id: string, hint?: string, error?: string) {
  if (error) return `${id}__error`;
  if (hint) return `${id}__hint`;
  return undefined;
}

const baseInputClasses =
  'w-full rounded-xl border bg-ink-50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors outline-none focus:border-ink-500 focus:ring-4 focus:ring-ink-900/5 disabled:bg-ink-100 disabled:text-ink-400';

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, Omit<WrapperProps, 'children' | 'id'> {
  /**
   * Algo que va **encima del control**, pegado a su derecha: el ojo de una
   * contraseña, una unidad, un botón de limpiar.
   *
   * Existe porque colocarlo desde fuera obligaba a adivinar a qué altura cae el
   * control —el rótulo de arriba y la pista de abajo cambian de tamaño—, y se
   * hacía con un `top` en píxeles que solo acertaba en un caso. Aquí se centra
   * contra el propio control, así que da igual lo que lleve alrededor.
   */
  adorno?: ReactNode;
}

export function Input({ label, hint, error, className, id, adorno, ...props }: InputProps) {
  const generado = useId();
  const idCampo = id ?? generado;

  // `required` viaja con el resto de props hasta el control nativo: antes se
  // quedaba aquí solo para pintar un asterisco y el navegador nunca llegaba a
  // validar el campo.
  const control = (
    <input
      id={idCampo}
      aria-describedby={describe(idCampo, hint, error)}
      aria-invalid={error ? true : undefined}
      className={cn('field__control', baseInputClasses, error ? 'border-red-300' : 'border-ink-200', className)}
      {...props}
    />
  );

  return (
    <FieldWrapper id={idCampo} label={label} hint={hint} error={error}>
      {adorno ? (
        // `block` y no `flex`: el input ya ocupa todo el ancho, y lo único que
        // hace falta es algo contra lo que posicionar el adorno.
        <span className="field__with-adornment relative block">
          {control}
          <span className="field__adornment absolute right-3 top-1/2 flex -translate-y-1/2 items-center">
            {adorno}
          </span>
        </span>
      ) : (
        control
      )}
    </FieldWrapper>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, Omit<WrapperProps, 'children' | 'id'> {}

export function TextArea({ label, hint, error, className, id, ...props }: TextAreaProps) {
  const generado = useId();
  const idCampo = id ?? generado;
  return (
    <FieldWrapper id={idCampo} label={label} hint={hint} error={error}>
      <textarea
        id={idCampo}
        aria-describedby={describe(idCampo, hint, error)}
        aria-invalid={error ? true : undefined}
        className={cn('field__control', baseInputClasses, 'resize-none', error ? 'border-red-300' : 'border-ink-200', className)}
        {...props}
      />
    </FieldWrapper>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, Omit<WrapperProps, 'children' | 'id'> {}

export function Select({ label, hint, error, className, children, id, ...props }: SelectProps) {
  const generado = useId();
  const idCampo = id ?? generado;
  return (
    <FieldWrapper id={idCampo} label={label} hint={hint} error={error}>
      <select
        id={idCampo}
        aria-describedby={describe(idCampo, hint, error)}
        aria-invalid={error ? true : undefined}
        className={cn('field__control', baseInputClasses, 'appearance-none bg-no-repeat', error ? 'border-red-300' : 'border-ink-200', className)}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}

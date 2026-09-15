import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { creaFiltro } from '@/lib/busqueda';
import { cn } from '@/lib/utils';

interface SelectorBuscableProps {
  id: string;
  label: string;
  opciones: readonly string[];
  valor: string;
  onCambio: (valor: string) => void;
  placeholder?: string;
  /** Sin elegir lo de antes —la provincia— no hay nada que ofrecer. */
  disabled?: boolean;
  /** Qué decir cuando está apagado, para que no parezca roto. */
  textoDeshabilitado?: string;
  required?: boolean;
}

/**
 * Elegir de una lista cerrada, escribiendo para encontrar.
 *
 * Un `<select>` con 168 municipios obliga a recorrer la lista con la rueda; un
 * campo de texto libre deja entrar «la habana», «Habana», «abana» y cualquier
 * cosa, y entonces la dirección no vale para agrupar ni para buscar. Esto es el
 * punto medio: se escribe para acotar, pero **lo único que se guarda es una
 * opción de la lista**. Si al salir el campo tiene algo que no está en ella,
 * vuelve a lo último válido.
 *
 * El filtro es el mismo de la búsqueda del catálogo, así que no hace falta
 * poner las tildes: «guines» encuentra «Güines» y «camaguey» encuentra
 * «Camagüey», que es justo donde falla escribir a mano.
 */
export function SelectorBuscable({
  id,
  label,
  opciones,
  valor,
  onCambio,
  placeholder,
  disabled = false,
  textoDeshabilitado,
  required = false,
}: SelectorBuscableProps) {
  const [texto, setTexto] = useState(valor);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  // El valor también cambia desde fuera: al elegir otra provincia, el municipio
  // se vacía y la caja tiene que enterarse.
  useEffect(() => setTexto(valor), [valor]);

  const coincidencias = useMemo(() => {
    const escrito = texto.trim();
    // Con el valor ya elegido dentro de la caja, se enseña la lista entera: si
    // no, al volver a abrirlo solo saldría el que ya está puesto.
    if (!escrito || escrito === valor) return opciones;
    const exacto = creaFiltro(escrito);
    const encontradas = opciones.filter((o) => exacto(o));
    if (encontradas.length > 0) return encontradas;
    // Ni una coincidencia literal: se prueba tolerando faltas antes de decir
    // que no hay nada.
    const aproximado = creaFiltro(escrito, { aproximado: true });
    return opciones.filter((o) => aproximado(o));
  }, [texto, valor, opciones]);

  function elegir(opcion: string) {
    onCambio(opcion);
    setTexto(opcion);
    setAbierto(false);
  }

  function alSalir() {
    // Lo escrito no es una opción: se descarta. Aquí no se inventan municipios.
    setTimeout(() => {
      setAbierto(false);
      setTexto(valor);
    }, 150);
  }

  return (
    <div id={id} className="searchable relative" ref={caja}>
      <label id={`${id}__label`} className="searchable__label mb-1.5 block text-sm font-medium text-ink-800" htmlFor={`${id}__input`}>
        {label}
      </label>

      <div id={`${id}__field`} className="searchable__field relative">
        <Search size={15} aria-hidden="true" className="searchable__icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          id={`${id}__input`}
          type="text"
          role="combobox"
          aria-expanded={abierto}
          aria-controls={`${id}__list`}
          autoComplete="off"
          required={required}
          disabled={disabled}
          value={texto}
          placeholder={disabled ? textoDeshabilitado : placeholder}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={alSalir}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setAbierto(false);
              setTexto(valor);
            }
            // Enter con una sola coincidencia la elige: es lo que espera quien
            // escribió el nombre entero.
            if (e.key === 'Enter' && abierto && coincidencias.length >= 1) {
              e.preventDefault();
              elegir(coincidencias[0]);
            }
          }}
          className={cn(
            'searchable__control h-10 w-full rounded-xl border border-ink-200 bg-ink-50 pl-9 pr-9 text-sm text-ink-900 outline-none',
            'placeholder:text-ink-400 focus:border-primary',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        />
        <ChevronDown size={15} aria-hidden="true" className="searchable__caret pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
      </div>

      {abierto && !disabled && (
        <ul
          id={`${id}__list`}
          role="listbox"
          aria-label={label}
          className="searchable__list absolute left-0 right-0 top-full z-30 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-ink-200 bg-ink-50 py-1 shadow-lift"
        >
          {coincidencias.map((opcion) => (
            <li key={opcion} className="searchable__item">
              <button
                type="button"
                role="option"
                aria-selected={opcion === valor}
                // `mousedown` y no `click`: el blur del campo se dispara antes.
                onMouseDown={(e) => {
                  e.preventDefault();
                  elegir(opcion);
                }}
                className="searchable__option flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-ink-900 hover:bg-ink-100"
              >
                <span className="searchable__option-name truncate">{opcion}</span>
                {opcion === valor && <Check size={13} className="shrink-0 text-primary" aria-hidden="true" />}
              </button>
            </li>
          ))}

          {coincidencias.length === 0 && (
            <li id={`${id}__empty`} className="searchable__empty px-3 py-2 text-sm text-ink-500">
              Nada coincide con «{texto.trim()}».
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

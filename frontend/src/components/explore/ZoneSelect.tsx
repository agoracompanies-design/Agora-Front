import { useEffect, useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ZoneOption {
  /** Cadena vacía es la opción «Todas…», que no filtra. */
  valor: string;
  texto: string;
}

interface ZoneSelectProps {
  id: string;
  /** Nombre accesible: el desplegable no lleva rótulo visible propio. */
  label: string;
  valor: string;
  opciones: readonly ZoneOption[];
  onCambio: (valor: string) => void;
  /** Clases del botón: en la barra tiene forma de chip, en la hoja de campo. */
  claseBoton: string;
  /** Clases del contenedor, p. ej. `w-full` en la hoja del móvil. */
  className?: string;
}

/**
 * Desplegable de provincia o municipio para los filtros.
 *
 * No es un `<select>` nativo porque su lista la dibuja el navegador: ocupa lo
 * que él decide —unas 16 filas, casi media pantalla— y en modo oscuro salía con
 * texto claro sobre fondo claro. Esta lista mide la mitad (`max-h-48`, unas 8
 * filas con scroll) y usa los colores de la app.
 *
 * Sigue el patrón de «combobox de solo selección» de WAI-ARIA: el botón lleva
 * `role="combobox"` y la opción activa se anuncia con `aria-activedescendant`,
 * así el foco no sale del botón. Teclado: flechas, Inicio, Fin, Enter o
 * espacio para elegir, Escape para cerrar.
 */
export function ZoneSelect({ id, label, valor, opciones, onCambio, claseBoton, className }: ZoneSelectProps) {
  const [abierto, setAbierto] = useState(false);
  const indiceElegido = Math.max(0, opciones.findIndex((o) => o.valor === valor));
  const [activo, setActivo] = useState(indiceElegido);
  const base = useId();
  const idOpcion = (i: number) => `${base}-opcion-${i}`;
  const elegida = opciones[indiceElegido];

  // La opción activa se mantiene a la vista al moverse con el teclado. Se mueve
  // solo el scroll de la lista: `scrollIntoView` arrastraría también la página.
  useEffect(() => {
    if (!abierto) return;
    const opcion = document.getElementById(idOpcion(activo));
    const lista = opcion?.parentElement;
    if (!opcion || !lista) return;
    if (opcion.offsetTop < lista.scrollTop) lista.scrollTop = opcion.offsetTop;
    else if (opcion.offsetTop + opcion.offsetHeight > lista.scrollTop + lista.clientHeight)
      lista.scrollTop = opcion.offsetTop + opcion.offsetHeight - lista.clientHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, activo]);

  /** Al abrir, la activa es la que ya está elegida. */
  function abrir() {
    setActivo(indiceElegido);
    setAbierto(true);
  }

  function elegir(i: number) {
    const opcion = opciones[i];
    if (opcion && opcion.valor !== valor) onCambio(opcion.valor);
    setAbierto(false);
  }

  function alPulsarTecla(e: KeyboardEvent<HTMLButtonElement>) {
    const ultimo = opciones.length - 1;
    const mover = (i: number) => {
      e.preventDefault();
      if (!abierto) abrir();
      else setActivo(Math.min(ultimo, Math.max(0, i)));
    };
    switch (e.key) {
      case 'ArrowDown':
        return mover(activo + 1);
      case 'ArrowUp':
        return mover(activo - 1);
      case 'Home':
        return mover(0);
      case 'End':
        return mover(ultimo);
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (abierto) elegir(activo);
        else abrir();
        return;
      case 'Escape':
        if (abierto) {
          e.preventDefault();
          setAbierto(false);
        }
        return;
      case 'Tab':
        setAbierto(false);
    }
  }

  return (
    <div id={id} className={cn('zone-select relative max-w-full', className)}>
      <button
        type="button"
        role="combobox"
        id={`${id}__trigger`}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={`${id}__list`}
        aria-activedescendant={abierto ? idOpcion(activo) : undefined}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={alPulsarTecla}
        // La lista usa `mousedown` con `preventDefault`, así que este blur solo
        // llega cuando de verdad se sale del control.
        onBlur={() => setAbierto(false)}
        className={cn('zone-select__trigger flex max-w-full items-center justify-between gap-1.5 text-left', claseBoton)}
      >
        <span className="zone-select__value truncate">{elegida?.texto}</span>
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={cn('zone-select__caret shrink-0 transition-transform', abierto && 'rotate-180')}
        />
      </button>

      {abierto && (
        <ul
          id={`${id}__list`}
          role="listbox"
          aria-label={label}
          className="zone-select__list absolute left-0 top-full z-30 mt-1.5 max-h-48 w-max min-w-full max-w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-ink-200 bg-ink-50 py-1 shadow-lift"
        >
          {opciones.map((opcion, i) => {
            const seleccionada = opcion.valor === valor;
            return (
              <li
                key={opcion.valor || 'todas'}
                id={idOpcion(i)}
                role="option"
                aria-selected={seleccionada}
                onMouseDown={(e) => {
                  e.preventDefault();
                  elegir(i);
                }}
                onMouseEnter={() => setActivo(i)}
                className={cn(
                  'zone-select__option flex cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-[12px] text-ink-900',
                  i === activo && 'bg-ink-100',
                  seleccionada && 'font-semibold',
                )}
              >
                <span className="zone-select__label truncate">{opcion.texto}</span>
                {seleccionada && <Check size={12} aria-hidden="true" className="zone-select__check shrink-0 text-primary" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

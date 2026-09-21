import { useEffect, useState } from 'react';

/** Lo que dura el cartelito a la vista, en milisegundos. */
const DURACION = 3000;

interface Pista {
  texto: string;
  x: number;
  y: number;
  debajo: boolean;
}

/**
 * El nombre de cada botón de icono, en un cartelito, al pasar el ratón.
 *
 * Un solo componente para toda la app en vez de envolver cada botón: escucha el
 * paso del ratón y, si llega a un botón o enlace **sin texto visible**, enseña
 * su `aria-label` —el mismo nombre que ya lee un lector de pantalla, así que no
 * hay dos textos que mantener—. Desaparece a los tres segundos, al salir, al
 * pulsar o al desplazar la página.
 *
 * Los botones que ya tienen texto no lo necesitan: su nombre ya se ve. Para
 * forzarlo en alguno, basta con `data-hint="…"`.
 *
 * Solo con ratón: en pantallas táctiles no hay «pasar por encima», y un
 * cartelito que aparece al tocar taparía justo lo que se acaba de pulsar.
 */
export function HoverHint() {
  const [pista, setPista] = useState<Pista | null>(null);

  useEffect(() => {
    let temporizador: number | undefined;
    let actual: Element | null = null;

    const cerrar = () => {
      window.clearTimeout(temporizador);
      actual = null;
      setPista(null);
    };

    function alEntrar(evento: PointerEvent) {
      if (evento.pointerType !== 'mouse') return;
      const el = (evento.target as Element | null)?.closest('button, a, [role="button"]');
      if (!el || el === actual) return;
      const forzado = el.getAttribute('data-hint');
      const nombre = forzado ?? el.getAttribute('aria-label');
      const sinTexto = !(el.textContent ?? '').trim();
      if (!nombre || (!forzado && !sinTexto)) return;

      actual = el;
      window.clearTimeout(temporizador);
      const caja = el.getBoundingClientRect();
      // Arriba del botón, salvo que no quepa: entonces debajo.
      const debajo = caja.top < 40;
      setPista({
        texto: nombre,
        x: Math.min(window.innerWidth - 8, Math.max(8, caja.left + caja.width / 2)),
        y: debajo ? caja.bottom + 6 : caja.top - 6,
        debajo,
      });
      temporizador = window.setTimeout(cerrar, DURACION);
    }

    function alSalir(evento: PointerEvent) {
      if (!actual) return;
      const hacia = evento.relatedTarget as Node | null;
      if (hacia && actual.contains(hacia)) return;
      cerrar();
    }

    document.addEventListener('pointerover', alEntrar);
    document.addEventListener('pointerout', alSalir);
    document.addEventListener('pointerdown', cerrar);
    window.addEventListener('scroll', cerrar, true);
    return () => {
      window.clearTimeout(temporizador);
      document.removeEventListener('pointerover', alEntrar);
      document.removeEventListener('pointerout', alSalir);
      document.removeEventListener('pointerdown', cerrar);
      window.removeEventListener('scroll', cerrar, true);
    };
  }, []);

  if (!pista) return null;
  return (
    <span
      aria-hidden="true"
      className="hover-hint pointer-events-none fixed z-[100] max-w-[16rem] truncate rounded-md bg-ink-900 px-2 py-1 text-[11px] font-medium text-ink-50 shadow-card"
      style={{
        left: pista.x,
        top: pista.y,
        transform: `translate(-50%, ${pista.debajo ? '0' : '-100%'})`,
      }}
    >
      {pista.texto}
    </span>
  );
}

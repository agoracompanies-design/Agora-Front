import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Store, Users } from 'lucide-react';
import { estadisticasPublicas, type EstadisticasPublicas } from '@/api/estadisticas';

/**
 * Cuántos negocios y cuántos clientes hay en Ágora.
 *
 * **No se pinta nada mientras no haya números de la base.** Ni un hueco, ni un
 * cero, ni un esqueleto: la ruta `GET /public/stats` está pedida y todavía no
 * existe, así que hoy este bloque es invisible y el día que el backend responda
 * aparece solo, sin volver a publicar la web.
 *
 * Inventar una cifra aquí sería lo peor que podría hacerse: un «1 200 negocios»
 * que nadie puede comprobar le quita credibilidad a todo lo demás de la página.
 *
 * **Va en una sola tira baja y no en dos tarjetas.** Con tarjetas del tamaño de
 * las de «Cómo funciona» —medido— dos números sueltos pesaban más en pantalla
 * que las secciones con contenido, y lo que es un apunte parecía el tema
 * principal.
 */
export function Contadores() {
  const [datos, setDatos] = useState<EstadisticasPublicas | null>(null);

  useEffect(() => {
    let cancelado = false;
    void estadisticasPublicas().then((d) => {
      if (!cancelado) setDatos(d);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  if (!datos) return null;

  return (
    <section id="counts" className="counts mx-auto max-w-6xl px-4 sm:px-6 pt-16">
      <dl
        id="counts__list"
        className="counts__list grid grid-cols-2 divide-x divide-ink-200/80 overflow-hidden rounded-2xl border border-ink-200/80 bg-ink-50"
      >
        <Contador icono={<Store size={16} />} cuantos={datos.negocios} que="negocios" />
        <Contador icono={<Users size={16} />} cuantos={datos.clientes} que="clientes" />
      </dl>
    </section>
  );
}

/**
 * Un número con su rótulo.
 *
 * Va en `dt`/`dd` dentro de una lista de definiciones porque es exactamente lo
 * que es —un término y su valor—, y así un lector de pantalla lee «negocios,
 * 134» en vez de dos textos sueltos que no se sabe cómo se relacionan.
 *
 * El `dt` va **antes** del `dd` en el marcado porque una lista de definiciones
 * lo exige en ese orden; que el número se vea primero se resuelve con `order`,
 * no cambiando el marcado.
 *
 * El `dd` lleva `ms-0` porque el navegador le pone una sangría por defecto que
 * aquí descoloca el número respecto al icono.
 */
function Contador({
  icono,
  cuantos,
  que,
}: {
  icono: ReactNode;
  cuantos: number;
  que: string;
}) {
  return (
    <div className="counts__item flex items-center justify-center gap-2.5 px-3 py-4 sm:gap-3 sm:py-5">
      <span className="counts__icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-200 text-ink-700">
        {icono}
      </span>
      <div className="flex min-w-0 items-baseline gap-1.5">
        <dt className="order-2 truncate text-sm text-ink-500">{que}</dt>
        <dd className="order-1 ms-0 text-lg font-semibold text-ink-900 sm:text-xl">
          {cuantos.toLocaleString('es')}
        </dd>
      </div>
    </div>
  );
}

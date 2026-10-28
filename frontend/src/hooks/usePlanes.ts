import { useEffect, useState } from 'react';
import {
  ahorroFrenteAlMensual,
  listarPlanes,
  nombreDeCiclo,
  type Plan,
  type Publico,
} from '@/api/plans';
import { BUYER_PLAN, SELLER_PLAN, type PlanConfig } from '@/lib/plans';

/**
 * Los planes que se enseñan, de la base.
 *
 * **Con respaldo a propósito.** Si la API no responde —el servidor caído, o uno
 * antiguo sin la tabla— se enseñan los que están escritos en `lib/plans.ts` en
 * vez de una pantalla vacía: un precio de hace un mes informa más que un hueco,
 * y quien entra a ver cuánto cuesta Agora merece una respuesta.
 *
 * `deLaBase` dice cuál de las dos cosas se está viendo, para que quien lo use
 * pueda avisar si hace falta.
 */
export function usePlanes() {
  // Nace con los del código, no con una lista vacía. Quien lo usa pinta tablas
  // de precios y da por hecho que hay tramos: con `[]` el primer render se
  // quedaba sin ninguno y la pantalla moría leyendo el `cost` de un `undefined`
  // —comprobado, dejaba la página en blanco—. Así el peor caso es un precio de
  // hace un rato, no una pantalla rota.
  const [planes, setPlanes] = useState<Plan[]>(deRespaldo);
  const [deLaBase, setDeLaBase] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    listarPlanes()
      .then((lista) => {
        if (cancelado) return;
        // Una lista vacía no es una respuesta útil: se trata como un fallo.
        if (lista.length === 0) throw new Error('sin planes');
        setPlanes(lista);
        setDeLaBase(true);
      })
      .catch(() => {
        if (cancelado) return;
        setPlanes(deRespaldo());
        setDeLaBase(false);
      })
      .finally(() => !cancelado && setCargando(false));
    return () => {
      cancelado = true;
    };
  }, []);

  return { planes, deLaBase, cargando };
}

/** Los del código, con la misma forma que los de la base. */
function deRespaldo(): Plan[] {
  const deUno = (config: PlanConfig, audience: Publico): Plan[] =>
    config.tiers.map((tramo, i) => ({
      idPlan: `${audience}-${tramo.cycle}`,
      audience,
      cycle: tramo.cycle,
      name: config.name,
      cost: tramo.cost,
      currency: tramo.currency,
      durationDays: tramo.durationDays,
      features: config.features,
      active: true,
      orden: i,
    }));

  return [...deUno(BUYER_PLAN, 'buyer'), ...deUno(SELLER_PLAN, 'seller')];
}

/**
 * Si un plan es de los VIP.
 *
 * Se mira el asterisco del nombre —`PNM*`— porque **no hay campo que lo diga**.
 * Es frágil y está pedido al backend; mientras no exista, esto es lo que hay.
 */
export function esVip(plan: Plan): boolean {
  return plan.name.trim().endsWith('*');
}

/**
 * Los de un público, ordenados como se pintan.
 *
 * Los VIP van aparte —`vip: true`— porque comparten `orden` con los normales y
 * mezclados se colaban: el plan de proveedor salía a 3 300 en vez de a 2 200.
 *
 * El desempate por nombre es por si dos filas comparten `orden`: sin él, cuál
 * sale primero depende de cómo venga la lista, que no es una respuesta.
 */
export function planesDe(planes: Plan[], audience: Publico, vip = false): Plan[] {
  return planes
    .filter((p) => p.audience === audience && esVip(p) === vip)
    .sort((a, b) => a.orden - b.orden || a.name.localeCompare(b.name));
}

/** Una familia de planes: lo que en pantalla es una tarjeta. */
export interface Familia {
  clave: string;
  titulo: string;
  descripcion: string;
  /** La que se destaca: es la conversión que importa. */
  destacada: boolean;
  vip: boolean;
  audience: Publico;
  config: PlanConfig;
}

/**
 * Las familias que hay que pintar, **salidas de lo que devuelve el backend**.
 *
 * Una por cada grupo con planes: comprador, proveedor y proveedor VIP. Si una
 * no tiene ninguno, no se pinta —una tarjeta sin precio no dice nada—, así que
 * el día que se retire un grupo entero desaparece solo.
 *
 * Los títulos y las descripciones se quedan aquí y no salen de la base a
 * propósito: en la base los nombres son las siglas de contabilidad —`PUM`,
 * `PNM*`— y eso no se le enseña a quien está decidiendo si paga.
 */
export function familiasDePlanes(planes: Plan[]): Familia[] {
  const posibles: Omit<Familia, 'config'>[] = [
    {
      clave: 'buyer',
      titulo: 'Comprador',
      descripcion: 'Explora y compara todo el catálogo local.',
      destacada: false,
      vip: false,
      audience: 'buyer',
    },
    {
      clave: 'seller',
      titulo: 'Proveedor',
      descripcion: 'Publica tu catálogo y que te encuentren.',
      destacada: true,
      vip: false,
      audience: 'seller',
    },
    {
      clave: 'seller-vip',
      titulo: 'Proveedor VIP',
      descripcion: 'Lo mismo, y además apareces destacado en las búsquedas.',
      destacada: false,
      vip: true,
      audience: 'seller',
    },
  ];

  return posibles
    .map((f) => ({ ...f, config: comoConfig(planes, f.audience, f.vip) }))
    .filter((f) => f.config.tiers.length > 0);
}

/**
 * Los de un público con la forma que ya esperan las pantallas.
 *
 * Existe para no reescribir `Membership` ni `SellerPitch` al cambiar de dónde
 * salen los precios: siguen recibiendo un `PlanConfig` y les da igual si viene
 * del código o de la base. El día que se quiten los del código, esto se va con
 * ellos.
 *
 * El nombre y las ventajas se toman del primer tramo: en la base cada ciclo es
 * una fila, y los tres de un mismo público comparten las dos cosas.
 */
export function comoConfig(planes: Plan[], audience: Publico, vip = false): PlanConfig {
  const suyos = planesDe(planes, audience, vip);
  const base = suyos[0];
  return {
    name: base?.name ?? (audience === 'buyer' ? BUYER_PLAN.name : SELLER_PLAN.name),
    features: base?.features ?? [],
    tiers: suyos.map((p) => {
      const ahorro = ahorroFrenteAlMensual(p, planes);
      return {
        cycle: p.cycle as PlanConfig['tiers'][number]['cycle'],
        label: nombreDeCiclo(p.cycle),
        cost: p.cost,
        // La que diga el servidor; si una fila viniera sin ella, CUP, que es en
        // lo que está todo hoy. Un precio sin moneda no se puede pintar.
        currency: p.currency || 'CUP',
        durationDays: p.durationDays,
        savingsLabel: ahorro ? `Ahorra ${ahorro}%` : null,
      };
    }),
  };
}

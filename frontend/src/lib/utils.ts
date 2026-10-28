import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * El número solo, sin moneda. Para cuando la moneda se dice aparte —en la
 * tarjeta va como etiqueta— y repetirla en el texto sobraría.
 */
export function formatAmount(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPrice(value: number | null | undefined, currency: 'CUP' | 'USD'): string | null {
  if (value === null || value === undefined) return null;
  const formatted = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  // La moneda se escribe, no se simboliza: «$» se confunde con el peso y aquí
  // conviven las dos. Además deja las dos monedas con la misma forma.
  return `${formatted} ${currency}`;
}

/**
 * El precio de un plan: `22.440 CUP`.
 *
 * La moneda llega como texto porque la decide la base, no el código: hoy todos
 * los planes están en CUP y mañana puede haber otro.
 *
 * Sin los dos decimales de `formatPrice` cuando el importe es entero —y los
 * planes lo son—: en un número de cinco cifras el «,00» solo estorba. El
 * equivalente mensual sí los lleva, porque ahí la división deja céntimos.
 */
export function formatPlanPrice(value: number | string, currency: string): string {
  // El coste sale de una columna `numeric`, y eso el conector lo entrega como
  // texto: sin esto, un «2200.00» se pintaría tal cual, sin separador de miles.
  const importe = Number(value);
  const formatted = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: Number.isInteger(importe) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(importe);
  return `${formatted} ${currency}`;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/**
 * Deja pasar solo lo que puede ser un precio mientras se escribe.
 *
 * Filtra al teclear en vez de avisar al enviar, porque una letra en un precio
 * no es una duda que resolver: es una tecla que sobra. Acepta la coma como
 * separador —en el teclado numérico está más a mano que el punto— y la
 * convierte, admite un solo separador y corta en dos decimales, que es lo que
 * el backend guarda.
 */
export function soloPrecio(valor: string): string {
  const limpio = valor.replace(/,/g, '.').replace(/[^\d.]/g, '');
  const [entera, ...resto] = limpio.split('.');
  if (resto.length === 0) return entera;
  return `${entera}.${resto.join('').slice(0, 2)}`;
}

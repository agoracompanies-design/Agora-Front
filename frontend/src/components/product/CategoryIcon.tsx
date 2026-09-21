import { createElement, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Apple,
  Baby,
  Bike,
  BookOpen,
  Car,
  Cookie,
  CupSoda,
  Dog,
  Dumbbell,
  Gem,
  Hammer,
  Lamp,
  Laptop,
  Package,
  Pill,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
  SprayCan,
  Sprout,
  ToyBrick,
  Wrench,
} from 'lucide-react';

/**
 * Un icono para cada categoría, cuando el producto no tiene foto o la foto no
 * carga.
 *
 * Las categorías las escribe cada negocio —luego se moderan—, así que no se
 * compara el nombre exacto: se busca una palabra clave dentro del nombre, sin
 * acentos y en minúsculas. «Alimentos», «Alimentación» y «Comida» caen en el
 * mismo icono. Lo que no encaja con nada lleva una caja genérica.
 *
 * Los iconos son de Lucide (licencia ISC, libre), que ya es dependencia de la
 * app: solo se incluyen estos, no la librería entera.
 */
const ICONOS: [string[], LucideIcon][] = [
  [['bebida', 'refresco', 'jugo', 'cafe', 'licor'], CupSoda],
  [['dulce', 'golosina', 'confitur', 'panader', 'reposter'], Cookie],
  [['aliment', 'comida', 'viand', 'fruta', 'carne', 'mercado', 'bodega'], Apple],
  [['limpieza', 'aseo', 'detergente'], SprayCan],
  [['farmacia', 'medic', 'salud'], Pill],
  [['ferreter', 'construc'], Hammer],
  [['herramient', 'taller', 'repuesto', 'mecanic'], Wrench],
  [['cuidado', 'belleza', 'cosmetic', 'higiene', 'perfum'], Sparkles],
  [['ropa', 'calzado', 'moda', 'vestir'], Shirt],
  [['movil', 'celular', 'telefon'], Smartphone],
  [['electron', 'computa', 'informat'], Laptop],
  [['hogar', 'mueble'], Sofa],
  [['ilumina', 'lampara', 'electric'], Lamp],
  [['bebe', 'infantil'], Baby],
  [['juguete', 'juego'], ToyBrick],
  [['mascota', 'animal'], Dog],
  [['deporte', 'gimnas'], Dumbbell],
  [['bicicleta', 'moto'], Bike],
  [['auto', 'vehicul', 'carro'], Car],
  [['libro', 'papeler', 'escolar'], BookOpen],
  [['jardin', 'planta', 'semilla', 'agro'], Sprout],
  [['joya', 'bisuter', 'accesorio'], Gem],
];

const sinAcentos = (texto: string) =>
  texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function iconoDeCategoria(nombre: string | null | undefined): LucideIcon {
  const clave = sinAcentos(nombre ?? '');
  if (!clave) return Package;
  for (const [palabras, icono] of ICONOS) {
    if (palabras.some((p) => clave.includes(p))) return icono;
  }
  return Package;
}

/**
 * Lo que ocupa el hueco de la foto: el icono de la categoría y, debajo, su
 * nombre en pequeño, para que la tarjeta siga diciendo qué se vende.
 */
export function CategoryIcon({
  categoria,
  size = 28,
  conNombre = true,
  className,
}: {
  categoria: string | null | undefined;
  size?: number;
  conNombre?: boolean;
  className?: string;
}) {
  return (
    <span
      className={
        'category-icon flex h-full w-full flex-col items-center justify-center gap-1.5 text-primary/70 ' +
        (className ?? '')
      }
    >
      {/* El icono sale de una tabla fija; `createElement` deja claro que no se
          crea ningún componente nuevo en cada render. */}
      {createElement(iconoDeCategoria(categoria), { size, strokeWidth: 1.5, 'aria-hidden': true })}
      {conNombre && categoria && (
        <span className="category-icon__name max-w-[90%] truncate text-[11px] font-medium text-ink-500">
          {categoria}
        </span>
      )}
    </span>
  );
}

/**
 * Una miniatura de producto que no se rompe: si no hay foto, o si la foto no
 * carga, enseña el icono de la categoría. Para listas, donde cada fila necesita
 * recordar por su cuenta si su foto falló.
 */
export function ProductThumb({
  src,
  categoria,
  size = 18,
}: {
  src: string | null;
  categoria: string | null | undefined;
  size?: number;
}) {
  const [rota, setRota] = useState(false);
  if (!src || rota) return <CategoryIcon categoria={categoria} size={size} conNombre={false} />;
  return <img src={src} alt="" onError={() => setRota(true)} className="h-full w-full object-cover" />;
}

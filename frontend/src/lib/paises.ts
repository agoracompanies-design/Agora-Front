/**
 * Códigos de país para los campos de teléfono.
 *
 * La bandera es un emoji, no una imagen: no cuesta ni una petición de red, que
 * aquí importa, y se ve en cualquier sistema reciente. Cuba va primero y es lo
 * que sale por defecto; detrás, el resto ordenado por nombre.
 *
 * La lista no es el mundo entero a propósito: están Cuba, los países donde vive
 * la emigración cubana y los de la región, que es de donde llaman. Añadir uno es
 * una línea.
 */
export interface Pais {
  /** Código ISO de dos letras, que es la clave. */
  iso: string;
  nombre: string;
  /** Prefijo telefónico, sin el signo +. */
  codigo: string;
  bandera: string;
}

export const PAIS_POR_DEFECTO = 'CU';

export const PAISES: readonly Pais[] = [
  { iso: 'CU', nombre: 'Cuba', codigo: '53', bandera: '🇨🇺' },
  { iso: 'AR', nombre: 'Argentina', codigo: '54', bandera: '🇦🇷' },
  { iso: 'BO', nombre: 'Bolivia', codigo: '591', bandera: '🇧🇴' },
  { iso: 'BR', nombre: 'Brasil', codigo: '55', bandera: '🇧🇷' },
  { iso: 'CA', nombre: 'Canadá', codigo: '1', bandera: '🇨🇦' },
  { iso: 'CL', nombre: 'Chile', codigo: '56', bandera: '🇨🇱' },
  { iso: 'CO', nombre: 'Colombia', codigo: '57', bandera: '🇨🇴' },
  { iso: 'CR', nombre: 'Costa Rica', codigo: '506', bandera: '🇨🇷' },
  { iso: 'EC', nombre: 'Ecuador', codigo: '593', bandera: '🇪🇨' },
  { iso: 'SV', nombre: 'El Salvador', codigo: '503', bandera: '🇸🇻' },
  { iso: 'ES', nombre: 'España', codigo: '34', bandera: '🇪🇸' },
  { iso: 'US', nombre: 'Estados Unidos', codigo: '1', bandera: '🇺🇸' },
  { iso: 'GT', nombre: 'Guatemala', codigo: '502', bandera: '🇬🇹' },
  { iso: 'HN', nombre: 'Honduras', codigo: '504', bandera: '🇭🇳' },
  { iso: 'IT', nombre: 'Italia', codigo: '39', bandera: '🇮🇹' },
  { iso: 'JM', nombre: 'Jamaica', codigo: '1876', bandera: '🇯🇲' },
  { iso: 'MX', nombre: 'México', codigo: '52', bandera: '🇲🇽' },
  { iso: 'NI', nombre: 'Nicaragua', codigo: '505', bandera: '🇳🇮' },
  { iso: 'PA', nombre: 'Panamá', codigo: '507', bandera: '🇵🇦' },
  { iso: 'PY', nombre: 'Paraguay', codigo: '595', bandera: '🇵🇾' },
  { iso: 'PE', nombre: 'Perú', codigo: '51', bandera: '🇵🇪' },
  { iso: 'PT', nombre: 'Portugal', codigo: '351', bandera: '🇵🇹' },
  { iso: 'PR', nombre: 'Puerto Rico', codigo: '1787', bandera: '🇵🇷' },
  { iso: 'DO', nombre: 'República Dominicana', codigo: '1809', bandera: '🇩🇴' },
  { iso: 'RU', nombre: 'Rusia', codigo: '7', bandera: '🇷🇺' },
  { iso: 'UY', nombre: 'Uruguay', codigo: '598', bandera: '🇺🇾' },
  { iso: 'VE', nombre: 'Venezuela', codigo: '58', bandera: '🇻🇪' },
];

export function paisDe(iso: string): Pais {
  return PAISES.find((p) => p.iso === iso) ?? PAISES[0];
}

/**
 * El país al que pertenece un número ya escrito en formato internacional.
 *
 * Se prueba primero con los prefijos largos: si no, un número de Puerto Rico
 * (+1787) se tomaría por Estados Unidos (+1) y el selector enseñaría la bandera
 * equivocada.
 */
export function paisDelNumero(telefono: string | null | undefined): Pais | null {
  if (!telefono) return null;
  const digitos = telefono.replace(/[^\d+]/g, '');
  if (!digitos.startsWith('+')) return null;
  const sinMas = digitos.slice(1);
  const candidatos = [...PAISES].sort((a, b) => b.codigo.length - a.codigo.length);
  return candidatos.find((p) => sinMas.startsWith(p.codigo)) ?? null;
}

/** El número nacional, sin el prefijo del país. */
export function numeroNacional(telefono: string | null | undefined): string {
  const pais = paisDelNumero(telefono);
  if (!pais || !telefono) return (telefono ?? '').replace(/[^\d]/g, '');
  return telefono.replace(/[^\d]/g, '').slice(pais.codigo.length);
}

/** Lo que se manda al servidor: +código y el número, sin espacios ni signos. */
export function telefonoCompleto(iso: string, nacional: string): string {
  return '+' + paisDe(iso).codigo + nacional.replace(/\D/g, '');
}

/**
 * Cuántas cifras tiene que tener el número nacional para darlo por bueno.
 *
 * El backend pide entre 8 y 15 cifras contando el prefijo, así que aquí se
 * exigen al menos seis del número en sí, que es lo más corto que se usa.
 */
export function numeroValido(iso: string, nacional: string): boolean {
  const cifras = nacional.replace(/\D/g, '');
  const total = paisDe(iso).codigo.length + cifras.length;
  return cifras.length >= 6 && total >= 8 && total <= 15;
}

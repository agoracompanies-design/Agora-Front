/**
 * Fechas como se dicen en voz alta.
 *
 * Vivía dentro de la bandeja de avisos; se sacó aquí al necesitarla también la
 * pantalla de moderación. Dos copias de esto acaban siendo dos formas distintas
 * de decir lo mismo en la misma aplicación.
 */

/** «hace 3 h», «ayer»: la fecha exacta de un aviso rara vez importa. */
export function haceCuanto(iso: string): string {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return 'ahora';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'ayer' : `hace ${dias} días`;
}

/**
 * Lo mismo, pero diciendo que es una petición: «pedida hace 3 días».
 *
 * A partir de una semana se añade el día, porque «hace 23 días» no sitúa a
 * nadie y lo que se quiere saber es si lleva mucho esperando.
 */
export function pedidaHace(iso: string): string {
  const dias = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias < 7) return `pedida ${haceCuanto(iso)}`;
  const fecha = new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  return `pedida hace ${dias} días · ${fecha}`;
}

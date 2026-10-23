import { MapPin, MessageCircle } from 'lucide-react';
import type { UserEnterprise } from '@/types';
import { WHATSAPP_MODERACION } from '@/lib/contacto';

/**
 * Pedir que muevan el negocio en el mapa.
 *
 * La dirección escrita se edita aquí mismo, pero el punto del mapa —la latitud
 * y la longitud— no está en este formulario: es lo que sitúa el negocio en las
 * búsquedas por cercanía, así que lo coloca un moderador. Sin esta opción, un
 * negocio que se muda cambia su dirección y sigue apareciendo en la esquina de
 * antes, sin manera de decirlo.
 */
export function MoveRequest({ enterprise }: { enterprise: UserEnterprise }) {
  const direccion = enterprise.address
    ? [enterprise.address.street, enterprise.address.city, enterprise.address.state, enterprise.address.country]
        .filter(Boolean)
        .join(', ')
    : 'sin dirección registrada';

  /**
   * El mensaje sale de Agora: va por WhatsApp, o sea por los servidores de otra
   * empresa, y se queda en el historial de los dos teléfonos. Por eso aquí **no
   * viaja el `idUserEnterprise`**, que es el identificador interno de la base de
   * datos: para encontrar el negocio en el panel no hace ninguna falta, y fuera
   * de aquí no pinta nada.
   *
   * Va el **código del negocio**, que es el número que el propio negocio ve en
   * su ficha y existe justo para esto; si todavía no tiene, basta el nombre y la
   * dirección registrada, que es con lo que se busca.
   */
  const mensaje = [
    'Cambio de ubicación en Ágora',
    '',
    `Negocio: ${enterprise.companyName}`,
    ...(enterprise.code ? [`Código: ${enterprise.code}`] : []),
    `Dirección registrada: ${direccion}`,
    '',
    'Nos mudamos. La nueva dirección es:',
  ].join('\n');

  const enlace = `https://wa.me/${WHATSAPP_MODERACION}?text=${encodeURIComponent(mensaje)}`;

  return (
    <section id="move-request" className="move-request mt-6 rounded-2xl border border-ink-200 bg-ink-50 p-6">
      <h2 id="move-request__title" className="move-request__title flex items-center gap-2 font-semibold text-ink-900">
        <MapPin size={16} aria-hidden="true" /> ¿Cambiaste de local?
      </h2>
      <p id="move-request__text" className="move-request__text mt-1.5 text-sm leading-relaxed text-ink-500">
        La dirección de arriba la cambias tú, pero el punto en el mapa lo coloca un moderador: es lo
        que hace que te encuentren buscando cerca. Escríbenos con la dirección nueva y lo movemos.
      </p>
      <a
        href={enlace}
        target="_blank"
        rel="noreferrer"
        id="move-request__whatsapp"
        className="move-request__whatsapp mt-5 inline-flex items-center gap-2 rounded-xl border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:border-ink-400 hover:bg-ink-100"
      >
        <MessageCircle size={15} aria-hidden="true" />
        Pedir el cambio por WhatsApp
      </a>
      <p id="move-request__note" className="move-request__note mt-3 text-xs text-ink-500">
        El mensaje va con el nombre de tu negocio y la dirección que tienes registrada; solo tienes
        que añadir la nueva.
      </p>
    </section>
  );
}

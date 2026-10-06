import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Megaphone } from 'lucide-react';
import { listarPromociones, type PromocionApi } from '@/api/notification';
import { WHATSAPP_VENTAS, enlaceWhatsapp } from '@/lib/contacto';
import { enlaceSeguro } from '@/lib/enlaces';
import { cn } from '@/lib/utils';

/**
 * Las promociones, debajo de la bandeja y **separadas de ella**.
 *
 * No son avisos: la bandeja es de cuenta y de conducta —cosas que hay que leer
 * sí o sí— y esto se puede silenciar desde el menú de usuario. Mezclarlas haría
 * que quien apaga las promociones creyera que apaga los avisos, o al revés.
 *
 * El carrusel queda descartado por ahora (decidido el 2026-10-06); de momento
 * viven aquí.
 *
 * Si están silenciadas **el servidor devuelve lista vacía**, así que esta
 * pantalla no tiene que comprobar nada: no se puede saltar el ajuste por
 * descuido desde aquí.
 */
export function PromotionsList() {
  const [promociones, setPromociones] = useState<PromocionApi[]>([]);

  useEffect(() => {
    let cancelado = false;
    void listarPromociones()
      .then((lista) => !cancelado && setPromociones(lista ?? []))
      // Sin promociones la pantalla sigue entera: son un extra, no el contenido.
      .catch(() => undefined);
    return () => {
      cancelado = true;
    };
  }, []);

  if (promociones.length === 0) return null;

  return (
    <section id="promos" className="promos mt-10">
      <h2 id="promos__title" className="promos__title flex items-center gap-2 text-sm font-semibold text-ink-900">
        <Megaphone size={15} aria-hidden="true" className="text-primary" />
        Promociones
      </h2>
      <p id="promos__subtitle" className="promos__subtitle mt-1 text-xs text-ink-500">
        Puedes dejar de verlas desde el menú de tu cuenta.
      </p>

      <ul id="promos__list" className="promos__list mt-4 space-y-3">
        {promociones.map((p) => (
          <PromotionCard key={p.id} promocion={p} />
        ))}
      </ul>
    </section>
  );
}

function PromotionCard({ promocion }: { promocion: PromocionApi }) {
  // El servidor manda el **mensaje**, no la dirección: hay que armar el `wa.me`.
  const porWhatsapp = promocion.whatsappMessage
    ? enlaceWhatsapp(WHATSAPP_VENTAS, promocion.whatsappMessage)
    : null;
  /**
   * El destino dentro de la aplicación, solo si **parece** uno.
   *
   * `enlaceSeguro` deja pasar cualquier texto porque lo resuelve como ruta
   * relativa, y eso aquí no vale: las promociones sembradas por el backend
   * traen el **mensaje de WhatsApp metido en la columna `href`** (comprobado el
   * 2026-10-06), con lo que el enlace acababa llevando a
   * `/avisos/Hola, quiero pasarme al plan anual…`. Un destino de verdad empieza
   * por `/`. Pedido como SOL-11.
   *
   * Lo que sí garantiza `enlaceSeguro` es que de aquí sale una ruta **de dentro
   * y relativa**, que es lo único que `<Link to>` sabe usar: una dirección que
   * solo parecía interna —`/\otro-sitio.com`— se queda fuera.
   */
  const crudo = promocion.href?.trim();
  const dentro = crudo?.startsWith('/') ? enlaceSeguro(crudo) : null;

  return (
    <li
      className={cn(
        'promos__item rounded-2xl border p-4',
        // La destacada se distingue, pero sin gritar: es una sola.
        promocion.featured ? 'border-primary/40 bg-primary/5' : 'border-ink-200 bg-ink-50',
      )}
    >
      <p className="promos__item-title font-medium text-ink-900">{promocion.title}</p>
      <p className="promos__item-body mt-1 text-sm text-ink-600">{promocion.body}</p>

      {/*
        Una promoción que no lleva a ninguna parte es un cartel: dice «paga el
        año» y deja a quien quiere hacerlo buscándose la vida. El destino de
        dentro manda sobre el de WhatsApp cuando existen los dos.
      */}
      {dentro ? (
        <Link
          to={dentro}
          className="promos__item-link mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          {promocion.action ?? 'Ver más'}
        </Link>
      ) : (
        porWhatsapp && (
          <a
            href={porWhatsapp}
            target="_blank"
            rel="noreferrer"
            className="promos__item-link mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ExternalLink size={13} aria-hidden="true" />
            {promocion.action ?? 'Escribir por WhatsApp'}
          </a>
        )
      )}
    </li>
  );
}

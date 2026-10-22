import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, CreditCard, Heart, MapPin, MessageCircle, Navigation, Phone, Store, ExternalLink } from 'lucide-react';
import { getProduct, listProducts, productImageUrl } from '@/api/product';
import { averageRating, createRating, getProductRatingSummary, listRatingsByProduct } from '@/api/rating';
import type { ResumenDeCalificacion } from '@/api/rating';
import type { Product } from '@/types';
import { Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProductCarousel } from '@/components/product/ProductCarousel';
import { RatingStars } from '@/components/ui/RatingStars';
import { ZoomableImage } from '@/components/product/ZoomableImage';
import { CategoryIcon } from '@/components/product/CategoryIcon';
import { PageSpinner } from '@/components/ui/Spinner';
import { MapEmbed } from '@/components/ui/MapEmbed';
import { AccordionItem } from '@/components/ui/Accordion';
import { cn, formatPrice } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useFavorites } from '@/context/FavoritesContext';
import { hasPermission, Permissions } from '@/lib/permissions';
import { addRecentlyViewed } from '@/lib/recentlyViewed';
import { enlaceLlamada, enlaceWhatsapp, mensajeDeInteres, telefonoLegible } from '@/lib/contacto';
import { nombreDeCategoria } from '@/lib/categorias';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { notify } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [product, setProduct] = useState<Product | null>(null);
  // La foto puede tener dirección y no llegar (403, archivo borrado).
  const [fotoRota, setFotoRota] = useState(false);
  /**
   * La nota del producto: media, cuántos votaron y la de uno.
   *
   * Se pide al resumen y no a la lista entera. La lista, además de traerse
   * cientos de filas para enseñar un número, **ya no dice de quién es cada
   * una** —`userId` se quitó de ahí por privacidad—, así que con ella era
   * imposible saber si uno ya calificó: el aviso «ya calificaste» no salía
   * nunca y el formulario se ofrecía otra vez para acabar en un 409.
   */
  const [resumen, setResumen] = useState<ResumenDeCalificacion | null>(null);
  const [ratingsAvailable, setRatingsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [relacionados, setRelacionados] = useState<Product[]>([]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getProduct(id)
      .then((data) => {
        setProduct(data);
        // Otro producto, otra foto: lo de que la anterior no cargara no vale aquí.
        setFotoRota(false);
        addRecentlyViewed(id);
      })
      .catch(() => notify('No se pudo cargar el producto', 'error'))
      .finally(() => setIsLoading(false));

    getProductRatingSummary(id)
      .then(setResumen)
      .catch(() => {
        // Contra un servidor que todavía no tenga el resumen, se cae a la
        // lista: se pierde saber si uno ya calificó, pero la media se sigue
        // viendo. Vale más eso que una ficha sin nota.
        listRatingsByProduct(id)
          .then((lista) =>
            setResumen({ average: averageRating(lista), count: lista.length, mine: null }),
          )
          .catch(() => setRatingsAvailable(false));
      });

    // Una sola petición para las dos filas de abajo: el mismo negocio y la
    // misma categoría salen de ella, en vez de pedir el catálogo dos veces.
    listProducts({ page: 1, limit: 200 })
      .then((data) => setRelacionados(data.products))
      .catch(() => setRelacionados([]));
  }, [id, notify]);

  /**
   * Calificar el producto.
   *
   * Solo se llega aquí sin haber calificado antes: un segundo `POST` lo rechaza
   * el servidor con un 409, y cambiar la nota puesta todavía no se puede —hace
   * falta el identificador de la propia calificación, que el resumen no
   * devuelve; está pedido—.
   */
  async function handleRate(quantity: number) {
    if (!id || !user) return;
    setSubmittingRating(true);
    try {
      await createRating({ quantity, productId: id });
      // La media se vuelve a pedir en vez de calcularla aquí: el servidor es
      // quien sabe cuántos votos hay, y así no se queda un número inventado si
      // alguien calificó mientras tanto.
      //
      // Si esa segunda petición no llega —aquí se cae la conexión a cada
      // rato—, el voto ya está puesto: se apunta en pantalla con lo que se
      // sabe. Dejarlo en nada volvería a ofrecer calificar, y el intento
      // acabaría en un «ya calificaste este producto».
      const fresco = await getProductRatingSummary(id).catch(() => null);
      setResumen(
        fresco ??
          ((previo) => ({
            average: previo?.average ?? quantity,
            count: (previo?.count ?? 0) + 1,
            mine: quantity,
          }))(resumen),
      );
      notify('¡Gracias por tu calificación!');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No se pudo enviar la calificación', 'error');
    } finally {
      setSubmittingRating(false);
    }
  }

  if (isLoading) return <PageSpinner />;
  if (!product) {
    return (
      <div id="product-detail__missing" className="product-detail__missing mx-auto max-w-3xl px-4 py-16 text-center">
        <p id="product-detail__missing-text" className="product-detail__missing-text text-ink-500">No encontramos este producto.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>
          Volver a explorar
        </Button>
      </div>
    );
  }

  const imageUrl = productImageUrl(product.image);
  const enterprise = product.userEnterprise;

  // Las dos filas de abajo: lo demás que vende este negocio, y alternativas de
  // la misma categoría. Nunca el producto que ya se está mirando.
  const otros = relacionados.filter((p) => p.idProduct !== product.idProduct);
  const delNegocio = otros.filter((p) => p.userEnterprise?.idUserEnterprise === enterprise?.idUserEnterprise).slice(0, 12);
  const deLaCategoria = otros
    .filter((p) => nombreDeCategoria(p) === nombreDeCategoria(product))
    .filter((p) => p.userEnterprise?.idUserEnterprise !== enterprise?.idUserEnterprise)
    .slice(0, 12);
  const avg = resumen?.average ?? 0;
  const votos = resumen?.count ?? 0;
  /** La nota que puso quien mira, o `null` si todavía no calificó. */
  const miNota = resumen?.mine ?? null;
  /**
   * Calificar, y también cambiar la nota puesta.
   *
   * Ya no hace falta no haber calificado: desde el commit `392c430` el servidor
   * **reescribe** la nota de uno si vuelve a mandarla —un segundo `POST` no
   * crea otra fila, la actualiza—, y hay un índice único que lo sostiene. Así
   * que el mismo gesto sirve para las dos cosas.
   */
  const canRate = isAuthenticated && hasPermission(user?.permissions, Permissions.RATING_CREATE);
  const mapUrl =
    enterprise?.latitude && enterprise?.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${enterprise.latitude},${enterprise.longitude}`
      : null;

  // El número escrito a mano por el negocio, ya en forma de enlace. Se calcula
  // una vez y de ahí salen los dos botones y el texto que enseñan.
  const llamada = enlaceLlamada(enterprise?.contact?.phone);
  const telefono =
    llamada && product
      ? {
          llamada,
          legible: telefonoLegible(enterprise?.contact?.phone),
          whatsapp: enlaceWhatsapp(
            enterprise?.contact?.phone,
            mensajeDeInteres(product.name, enterprise?.companyName),
          ),
        }
      : null;

  return (
    <div id="product-detail" className="product-detail mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* React 19 lo sube al <head>. Lleva el producto y el negocio porque es
          el título que se ve al compartir el enlace y en la pestaña. */}
      <title>{`${product.name}${enterprise ? ` · ${enterprise.companyName}` : ''} · Agora`}</title>
      {product.description && <meta name="description" content={product.description.slice(0, 160)} />}
      <Link to="/" id="product-detail__back" className="product-detail__back mb-6 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Volver a explorar
      </Link>

      {/* Dos filas en escritorio: arriba la foto y su panel de datos al lado;
          debajo de la foto, los carruseles. El panel ocupa las dos filas, que
          es lo que llena el hueco blanco que quedaba bajo la imagen cuando el
          panel era más alto que ella. En móvil no hay filas: la foto, los datos
          y los carruseles van uno detrás de otro, como siempre. */}
      <div
        id="product-detail__layout"
        className="product-detail__layout grid grid-cols-1 gap-10 lg:grid-cols-5 lg:grid-rows-[auto_1fr]"
      >
        <div id="product-detail__media" className="product-detail__media lg:col-span-3 lg:col-start-1 lg:row-start-1">
          {imageUrl && !fotoRota ? (
            <ZoomableImage src={imageUrl} alt={product.name} onError={() => setFotoRota(true)} />
          ) : (
            <div id="product-detail__frame" className="product-detail__frame aspect-square w-full overflow-hidden rounded-2xl bg-primary/5">
              <div id="product-detail__placeholder" className="product-detail__placeholder flex h-full w-full items-center justify-center">
                <CategoryIcon categoria={nombreDeCategoria(product)} size={64} />
              </div>
            </div>
          )}
        </div>

        <div id="product-detail__info" className="product-detail__info flex flex-col gap-5 lg:col-span-2 lg:col-start-4 lg:row-start-1 lg:row-span-2">
          <div>
            <div id="product-detail__topbar" className="product-detail__topbar mb-2 flex items-center justify-between gap-2">
              <div id="product-detail__tags" className="product-detail__tags flex items-center gap-2">
                <Badge>{nombreDeCategoria(product)}</Badge>
                {!product.stock && <Badge variant="danger">Agotado</Badge>}
              </div>
              <button
                onClick={() => toggleFavorite(product.idProduct)}
                aria-pressed={isFavorite(product.idProduct)}
                id="product-detail__fav" className="product-detail__fav flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-500 transition-colors hover:text-ink-900"
                aria-label={isFavorite(product.idProduct) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              >
                <Heart size={16} className={cn(isFavorite(product.idProduct) && 'fill-danger text-danger')} />
              </button>
            </div>
            <h1 id="product-detail__name" className="product-detail__name text-2xl font-semibold text-ink-900">{product.name}</h1>
            {ratingsAvailable && votos > 0 && (
              <div id="product-detail__rating" className="product-detail__rating mt-2">
                <RatingStars value={avg} count={votos} />
              </div>
            )}
          </div>

          <div id="product-detail__prices" className="product-detail__prices flex items-baseline gap-3">
            {product.priceUsd !== null && <span id="product-detail__price-usd" className="product-detail__price-usd text-3xl font-extrabold text-ink-900">{formatPrice(product.priceUsd, 'USD')}</span>}
            {product.priceCup !== null && <span id="product-detail__price-cup" className="product-detail__price-cup text-ink-500">{formatPrice(product.priceCup, 'CUP')}</span>}
          </div>

          <p id="product-detail__description" className="product-detail__description leading-relaxed text-ink-600">{product.description}</p>
          <p id="product-detail__unit" className="product-detail__unit text-sm text-ink-500">Unidad de venta: <span className="text-ink-800 font-medium">{product.unit}</span></p>

          {enterprise && (
            <div id="product-detail__seller" className="product-detail__seller rounded-2xl border border-ink-200 bg-ink-50/60 p-4 space-y-2.5">
              <Link to={`/negocios/${enterprise.idUserEnterprise}`} id="product-detail__seller-link" className="product-detail__seller-link flex items-center gap-2 font-medium text-ink-900 hover:underline">
                <Store size={16} /> {enterprise.companyName}
              </Link>
              {enterprise.address && (
                <p id="product-detail__seller-address" className="product-detail__seller-address flex items-start gap-2 text-sm text-ink-600">
                  <MapPin size={14} className="mt-0.5 shrink-0" />
                  {enterprise.address.street}, {enterprise.address.city}, {enterprise.address.state}
                </p>
              )}
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noreferrer" id="product-detail__map-link" className="product-detail__map-link inline-flex items-center gap-1.5 text-sm text-ink-700 hover:text-ink-900">
                  Abrir en Google Maps <ExternalLink size={12} />
                </a>
              )}
              {enterprise.latitude && enterprise.longitude && (
                <div id="product-detail__map-frame" className="product-detail__map-frame overflow-hidden rounded-xl border border-ink-200">
                  <MapEmbed
                    latitude={enterprise.latitude}
                    longitude={enterprise.longitude}
                    label={enterprise.companyName}
                    id="product-detail__map" className="product-detail__map h-40 w-full border-0"
                  />
                </div>
              )}
            </div>
          )}

          {enterprise && (mapUrl || enterprise.contact?.phone) && (
            // Una acción por fila. Antes la llamada era un cuadrado con un
            // auricular al lado del mapa, y el número no se veía por ninguna
            // parte: había que pulsar a ciegas. Ahora cada forma de contacto
            // ocupa su fila y enseña el número, que en un ordenador —donde el
            // enlace `tel:` puede no abrir nada— es lo único que sirve.
            <div id="product-detail__actions" className="product-detail__actions flex flex-col gap-2.5">
              {/* El negocio es descubrir y CONTACTAR: el índigo se lo queda la
                  llamada, no el enlace a Google Maps, que además se lleva al
                  usuario fuera de Agora. */}
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noreferrer" id="product-detail__route" className="product-detail__route block">
                  <Button variant="outline" className="w-full" size="lg" icon={<Navigation size={16} />}>
                    ¿Cómo llegar?
                  </Button>
                </a>
              )}
              {telefono && (
                <a href={telefono.llamada} id="product-detail__call" className="product-detail__call block">
                  <Button className="w-full" size="lg" icon={<Phone size={16} />}>
                    Llamar <span className="product-detail__call-number font-normal opacity-80">· {telefono.legible}</span>
                  </Button>
                </a>
              )}
              {telefono?.whatsapp && (
                <a
                  href={telefono.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  id="product-detail__whatsapp"
                  className="product-detail__whatsapp block"
                >
                  <Button variant="outline" className="w-full" size="lg" icon={<MessageCircle size={16} />}>
                    WhatsApp <span className="product-detail__whatsapp-number font-normal text-ink-500">· {telefono.legible}</span>
                  </Button>
                </a>
              )}
            </div>
          )}

          {enterprise && (
            <div>
              <AccordionItem icon={<Clock size={15} className="text-ink-500" />} title="Horario de apertura" defaultOpen>
                {enterprise.officeHours
                  ? new Date(enterprise.officeHours).toLocaleString('es-ES', { weekday: 'long', hour: '2-digit', minute: '2-digit' })
                  : 'Este negocio aún no publicó su horario. Contáctalo directamente para confirmarlo.'}
              </AccordionItem>
              <AccordionItem icon={<CreditCard size={15} className="text-ink-500" />} title="Formas de pago">
                Consulta con el negocio las formas de pago que acepta al momento de tu visita.
              </AccordionItem>
            </div>
          )}

          {ratingsAvailable && canRate && (
            <div id="product-detail__rate" className="product-detail__rate rounded-2xl border border-ink-200 p-4">
              <p id="product-detail__rate-title" className="product-detail__rate-title mb-2 text-sm font-medium text-ink-800">
                {miNota === null ? '¿Ya probaste este producto? Califícalo' : 'Tu calificación'}
              </p>
              {/* Las estrellas salen con la nota puesta: tocar otra la cambia,
                  y el servidor reescribe la misma fila. */}
              <RatingStars value={miNota ?? 0} interactive onChange={handleRate} size={22} />
              {miNota !== null && !submittingRating && (
                <p id="product-detail__rate-hint" className="product-detail__rate-hint mt-2 text-xs text-ink-500">
                  Puedes cambiarla cuando quieras: se guarda sobre la anterior.
                </p>
              )}
              {submittingRating && <p id="product-detail__rate-sending" className="product-detail__rate-sending mt-2 text-xs text-ink-400">Enviando…</p>}
            </div>
          )}
          {/* Sin permiso para calificar no hay estrellas que tocar, pero si ya
              calificó antes conviene que vea con cuánto. */}
          {miNota !== null && !canRate && (
            <p id="product-detail__rated" className="product-detail__rated text-sm text-ink-500">
              Ya calificaste este producto con{' '}
              <span className="font-medium text-ink-800">
                {miNota} {miNota === 1 ? 'estrella' : 'estrellas'}
              </span>
            </p>
          )}
        </div>
        {(delNegocio.length > 0 || deLaCategoria.length > 0) && (
          <div
            id="product-detail__more"
            className="product-detail__more space-y-10 lg:col-span-3 lg:col-start-1 lg:row-start-2"
          >
            <ProductCarousel
              nombre="seller"
              titulo={`Más de ${enterprise?.companyName ?? 'este negocio'}`}
              productos={delNegocio}
            />
            <ProductCarousel
              nombre="category"
              titulo={`Más en ${nombreDeCategoria(product)}`}
              productos={deLaCategoria}
            />
          </div>
        )}
      </div>
    </div>
  );
}

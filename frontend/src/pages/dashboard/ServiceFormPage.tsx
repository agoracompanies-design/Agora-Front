import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import {
  IMAGEN_DE_SERVICIO_LISTA,
  createService,
  getService,
  serviceImageUrl,
  updateService,
} from '@/api/service';
import { Input, TextArea } from '@/components/ui/Field';
import { PriceField } from '@/components/ui/PriceField';
import { LARGO, texto } from '@/lib/validacion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { aWebp, pesoLegible } from '@/lib/imagen';
import { usePegarImagen } from '@/hooks/usePegarImagen';
import { ServiceThumb } from '@/components/product/CategoryIcon';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function ServiceFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { enterprise } = useAuth();
  const { notify } = useToast();

  const [name, setName] = useState('');
  const [priceCup, setPriceCup] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [conversion, setConversion] = useState<{ antes: number; despues: number } | null>(null);
  const [convirtiendo, setConvirtiendo] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);

  // La foto se pasa a WebP aquí, antes de salir: se sube menos y, sobre todo,
  // se descarga menos cada vez que alguien abre el catálogo. Igual que en
  // producto.
  async function elegirImagen(archivo: File | null) {
    if (!archivo) {
      setImage(null);
      setConversion(null);
      return;
    }
    setConvirtiendo(true);
    try {
      const { archivo: listo, antes, despues, convertida } = await aWebp(archivo);
      setImage(listo);
      setConversion(convertida ? { antes, despues } : null);
    } finally {
      setConvirtiendo(false);
    }
  }
  // Ctrl+V con una imagen en el portapapeles vale igual que elegir el archivo.
  // Mientras el servidor no guarde la foto no se escucha: convertirla a WebP
  // para luego no mandarla es trabajo tirado, y encima en un móvil lento.
  usePegarImagen(elegirImagen, IMAGEN_DE_SERVICIO_LISTA);

  useEffect(() => {
    if (!id) return;
    getService(id)
      .then((service) => {
        setName(service.name);
        setPriceCup(service.priceCup?.toString() ?? '');
        setPriceUsd(service.priceUsd?.toString() ?? '');
        setDescription(service.description);
        setExistingImage(service.image ?? null);
      })
      .catch(() => notify('No se pudo cargar el servicio', 'error'))
      .finally(() => setLoading(false));
  }, [id, notify]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing && id) {
        await updateService(id, {
          name,
          priceCup: priceCup ? Number(priceCup) : null,
          priceUsd: priceUsd ? Number(priceUsd) : null,
          description,
          // Sin foto nueva no se manda el campo: así la que hubiera se queda.
          image: IMAGEN_DE_SERVICIO_LISTA ? image : null,
        });
        notify('Servicio actualizado');
      } else {
        if (!enterprise) {
          notify('Necesitas una empresa registrada para publicar servicios', 'error');
          return;
        }
        await createService({
          name,
          priceCup: priceCup ? Number(priceCup) : null,
          priceUsd: priceUsd ? Number(priceUsd) : null,
          description,
          userEnterpriseId: enterprise.idUserEnterprise,
          image: IMAGEN_DE_SERVICIO_LISTA ? image : null,
        });
        notify('Servicio publicado');
      }
      navigate('/panel/servicios');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo guardar el servicio', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageSpinner />;

  const imageUrl = image ? URL.createObjectURL(image) : serviceImageUrl(existingImage);

  return (
    <div id="service-form" className="service-form max-w-2xl">
      <Link to="/panel/servicios" id="service-form__back" className="service-form__back mb-5 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Volver a servicios
      </Link>
      <Card className="p-6">
        <h2 id="service-form__title" className="service-form__title mb-5 font-semibold text-ink-900">{isEditing ? 'Editar servicio' : 'Publicar servicio'}</h2>
        <form onSubmit={handleSubmit} id="service-form__form" className="service-form__form space-y-4">
          {/* La foto es opcional, y de momento no se enseña: el servidor aún no
              la guarda. Ver `IMAGEN_DE_SERVICIO_LISTA`. */}
          {IMAGEN_DE_SERVICIO_LISTA && (
            <label id="service-form__image-field" className="service-form__image-field block">
              <span id="service-form__image-label" className="service-form__image-label mb-1.5 block text-sm font-medium text-ink-800">
                Imagen <span className="font-normal text-ink-500">(opcional)</span>
              </span>
              <div id="service-form__image-row" className="service-form__image-row flex flex-wrap items-center gap-4">
                <div id="service-form__image-preview" className="service-form__image-preview flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-100 text-ink-300">
                  {/* `key` reinicia la miniatura con cada foto: si la vieja no
                      cargó, la nueva que se elija tiene que verse. */}
                  <ServiceThumb key={imageUrl ?? 'sin-foto'} src={imageUrl} size={24} />
                </div>
                <label id="service-form__image-button" className="service-form__image-button inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:border-ink-400">
                  <ImagePlus size={15} />
                  {image || existingImage ? 'Cambiar imagen' : 'Subir imagen'}
                  <input type="file" accept="image/*" id="service-form__image-input" className="service-form__image-input hidden" onChange={(e) => elegirImagen(e.target.files?.[0] ?? null)} />
                </label>
                <p id="service-form__image-paste" className="service-form__image-paste text-xs text-ink-400">
                  o pégala con Ctrl+V
                </p>
              </div>

              {convirtiendo && (
                <p id="service-form__image-working" className="service-form__image-working mt-2 text-xs text-ink-500">
                  Preparando la imagen…
                </p>
              )}
              {conversion && !convirtiendo && (
                <p id="service-form__image-saved" className="service-form__image-saved mt-2 text-xs text-ink-500">
                  Convertida a WebP: {pesoLegible(conversion.antes)} → {pesoLegible(conversion.despues)}
                </p>
              )}
            </label>
          )}
          <Input label="Nombre" required maxLength={LARGO.producto} value={name} onChange={(e) => setName(texto(e.target.value, LARGO.producto))} placeholder="Mensajería express" />
          <div id="service-form__price-row" className="service-form__price-row grid grid-cols-2 gap-3">
            <PriceField label="Precio (CUP)" value={priceCup} onChange={setPriceCup} placeholder="0.00" />
            <PriceField label="Precio (USD)" value={priceUsd} onChange={setPriceUsd} placeholder="0.00" />
          </div>
          <TextArea label="Descripción" required rows={4} maxLength={LARGO.descripcion} value={description} onChange={(e) => setDescription(e.target.value.slice(0, LARGO.descripcion))} />
          <Button type="submit" className="w-full" size="lg" loading={submitting}>
            {isEditing ? 'Guardar cambios' : 'Publicar servicio'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { EDICION_DE_IMAGEN_LISTA, createProduct, getProduct, productImageUrl, updateProduct } from '@/api/product';
import { Input, TextArea } from '@/components/ui/Field';
import { PriceField } from '@/components/ui/PriceField';
import { LARGO, texto } from '@/lib/validacion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { aWebp, pesoLegible } from '@/lib/imagen';
import { usePegarImagen } from '@/hooks/usePegarImagen';
import { CategoryPicker } from '@/components/dashboard/CategoryPicker';
import { UnitPicker } from '@/components/dashboard/UnitPicker';
import { NewCategoryDialog } from '@/components/dashboard/NewCategoryDialog';
import { anotarCategoriaPedida } from '@/lib/solicitudes-categoria';
import { useNotifications } from '@/context/NotificationsContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Link } from 'react-router-dom';
import { categoriaPendiente, nombreDeCategoria } from '@/lib/categorias';
import { ProductThumb } from '@/components/product/CategoryIcon';

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { enterprise, user } = useAuth();
  const { recargar: recargarAvisos } = useNotifications();
  const { notify } = useToast();

  const [name, setName] = useState('');
  const [priceCup, setPriceCup] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  // Categoría que el negocio quiere estrenar: el producto se publica en la
  // temporal y la petición queda esperando aprobación.
  const [categoriaAPedir, setCategoriaAPedir] = useState('');
  const [categoriaPedida, setCategoriaPedida] = useState('');
  /** La que pidió y sigue sin aprobarse, para poder decírselo al editar. */
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [stock, setStock] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [conversion, setConversion] = useState<{ antes: number; despues: number } | null>(null);
  const [convirtiendo, setConvirtiendo] = useState(false);

  // La foto se pasa a WebP aquí, antes de salir: se sube menos y, sobre todo,
  // se descarga menos cada vez que alguien abre el catálogo.
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
  usePegarImagen(elegirImagen);

  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProduct(id)
      .then((product) => {
        setName(product.name);
        setPriceCup(product.priceCup?.toString() ?? '');
        setPriceUsd(product.priceUsd?.toString() ?? '');
        setDescription(product.description);
        setUnit(product.unit);
        // Se precarga la categoría real, no la que se pidió: si el moderador ya
        // la aprobó con el nombre corregido, volver a mandar el original crearía
        // otra pendiente igual de mal escrita cada vez que se guarda.
        setCategory(nombreDeCategoria(product));
        setPendiente(categoriaPendiente(product));
        setStock(product.stock);
        setExistingImage(product.image);
      })
      .catch(() => notify('No se pudo cargar el producto', 'error'))
      .finally(() => setLoading(false));
  }, [id, notify]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!priceCup && !priceUsd) {
      notify('Ingresa al menos un precio (CUP o USD)', 'error');
      return;
    }
    setSubmitting(true);
    // Cuál es el producto del que se habla: el que se está editando, o el que
    // acaba de nacer. Hace falta para la solicitud de categoría.
    let idGuardado = id ?? '';
    try {
      if (isEditing && id) {
        await updateProduct(id, {
          name,
          priceCup: priceCup ? Number(priceCup) : null,
          priceUsd: priceUsd ? Number(priceUsd) : null,
          description,
          unit,
          category,
          stock,
          image,
        });
        notify('Producto actualizado');
      } else {
        if (!enterprise) {
          notify('Necesitas una empresa registrada para publicar productos', 'error');
          return;
        }
        const creado = await createProduct({
          name,
          priceCup: priceCup ? Number(priceCup) : null,
          priceUsd: priceUsd ? Number(priceUsd) : null,
          description,
          unit,
          category,
          stock,
          userEnterpriseId: enterprise.idUserEnterprise,
          image,
        });
        idGuardado = creado.idProduct;
        notify('Producto publicado');
      }
      // La sugerencia ya la registró el backend al recibir un nombre que no
      // existe: aquí solo queda dejar constancia en la bandeja del negocio y
      // ofrecerle avisar al moderador, porque el backend todavía no notifica
      // a nadie de que hay algo pendiente.
      if (categoriaPedida && user) {
        anotarCategoriaPedida({
          userId: user.id,
          categoria: categoriaPedida,
          productoNombre: name,
        });
        recargarAvisos();
        setPorEnviar({ categoria: categoriaPedida, productoNombre: name, productoId: idGuardado, usuario: user.username, userId: user.id });
        return;
      }
      navigate('/panel/productos');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo guardar el producto', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageSpinner />;

  const imageUrl = image ? URL.createObjectURL(image) : productImageUrl(existingImage);

  return (
    <div id="product-form" className="product-form max-w-2xl">
      <Link to="/panel/productos" id="product-form__back" className="product-form__back mb-5 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Volver a productos
      </Link>
      <Card className="p-6">
        <h2 id="product-form__title" className="product-form__title mb-5 font-semibold text-ink-900">{isEditing ? 'Editar producto' : 'Publicar producto'}</h2>
        <form onSubmit={handleSubmit} id="product-form__form" className="product-form__form space-y-4">
          {/* Al editar, el campo solo tiene sentido si el servidor admite la foto
              nueva; desde el 2026-09-12 la admite (`EDICION_DE_IMAGEN_LISTA`). */}
          {(!isEditing || EDICION_DE_IMAGEN_LISTA) && (
            <label id="product-form__image-field" className="product-form__image-field block">
              <span id="product-form__image-label" className="product-form__image-label mb-1.5 block text-sm font-medium text-ink-800">Imagen</span>
              <div id="product-form__image-row" className="product-form__image-row flex items-center gap-4">
                <div id="product-form__image-preview" className="product-form__image-preview flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-100 text-ink-300">
                  {/* `key` reinicia la miniatura con cada foto: si la vieja no cargó,
                      la nueva que se elija tiene que verse. */}
                  <ProductThumb key={imageUrl ?? 'sin-foto'} src={imageUrl} categoria={category} size={24} />
                </div>
                <label id="product-form__image-button" className="product-form__image-button inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:border-ink-400">
                  <ImagePlus size={15} />
                  {image ? 'Cambiar imagen' : existingImage ? 'Cambiar imagen' : 'Subir imagen'}
                  <input type="file" accept="image/*" id="product-form__image-input" className="product-form__image-input hidden" onChange={(e) => elegirImagen(e.target.files?.[0] ?? null)} />
                </label>
                <p id="product-form__image-paste" className="product-form__image-paste text-xs text-ink-400">
                  o pégala con Ctrl+V
                </p>
              </div>

              {convirtiendo && (
                <p id="product-form__image-working" className="product-form__image-working mt-2 text-xs text-ink-500">
                  Preparando la imagen…
                </p>
              )}
              {conversion && !convirtiendo && (
                <p id="product-form__image-saved" className="product-form__image-saved mt-2 text-xs text-ink-500">
                  Convertida a WebP: {pesoLegible(conversion.antes)} → {pesoLegible(conversion.despues)}
                </p>
              )}
            </label>
          )}

          <Input label="Nombre" required maxLength={LARGO.producto} value={name} onChange={(e) => setName(texto(e.target.value, LARGO.producto))} placeholder="Café molido" />

          <div id="product-form__price-row" className="product-form__price-row grid grid-cols-2 gap-3">
            <PriceField label="Precio (CUP)" value={priceCup} onChange={setPriceCup} placeholder="0.00" />
            <PriceField label="Precio (USD)" value={priceUsd} onChange={setPriceUsd} placeholder="0.00" />
          </div>

          <div id="product-form__meta-row" className="product-form__meta-row grid grid-cols-2 gap-3">
            <UnitPicker value={unit} onChange={setUnit} />
            <CategoryPicker
              value={category}
              onChange={(v) => {
                setCategory(v);
                if (categoriaPedida && v !== categoriaPedida) setCategoriaPedida('');
              }}
              onCrearNueva={setCategoriaAPedir}
            />
            {pendiente && (
              <p id="product-form__pending" className="product-form__pending mt-1.5 text-xs text-ink-500">
                Pediste «{pendiente}» y sigue esperando revisión. Si ya está aprobada, búscala aquí
                arriba y elígela.
              </p>
            )}
          </div>

          <TextArea label="Descripción" required rows={4} maxLength={LARGO.descripcion} value={description} onChange={(e) => setDescription(e.target.value.slice(0, LARGO.descripcion))} />

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={stock} onChange={(e) => setStock(e.target.checked)} className="h-4 w-4 accent-primary" />
            <span className="text-sm text-ink-700">Disponible en stock</span>
          </label>

          <Button type="submit" className="w-full" size="lg" loading={submitting}>
            {isEditing ? 'Guardar cambios' : 'Publicar producto'}
          </Button>
        </form>
      </Card>

      <NewCategoryDialog
        categoria={categoriaAPedir}
        open={Boolean(categoriaAPedir)}
        onCancelar={() => setCategoriaAPedir('')}
        onConfirmar={() => {
          // Se deja escrito el nombre que pidió: el backend lo resuelve —crea
          // la categoría pendiente y publica en «Otros»—. Ponerle «Otros» aquí
          // borraría la sugerencia antes de enviarla.
          setCategory(categoriaAPedir);
          setCategoriaPedida(categoriaAPedir);
          setCategoriaAPedir('');
        }}
      />
    </div>
  );
}

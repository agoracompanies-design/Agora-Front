import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Package, ArrowDownAZ, ArrowUpZA, ArrowDown, ArrowUp } from 'lucide-react';
import { useMyProducts } from '@/hooks/useMyCatalog';
import { useProductRatings } from '@/hooks/useProductRatings';
import type { Product } from '@/types';
import { RatingStars } from '@/components/ui/RatingStars';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { InfoTip } from '@/components/ui/InfoTip';
import { deleteProduct, productImageUrl } from '@/api/product';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/lib/utils';
import { nombreDeCategoria } from '@/lib/categorias';
import { ProductThumb } from '@/components/product/CategoryIcon';

/** Criterios de orden del catálogo propio. */
type Criterio = 'alfabetico' | 'calificacion' | 'precio';
type Direccion = 'asc' | 'desc';

/**
 * Con qué sentido empieza cada criterio al elegirlo. Alfabético arranca por la
 * A; los otros dos por lo más alto, que es lo que se quiere ver primero del
 * catálogo propio: lo mejor valorado y lo más caro.
 */
const SENTIDO_INICIAL: Record<Criterio, Direccion> = {
  alfabetico: 'asc',
  calificacion: 'desc',
  precio: 'desc',
};

export function DashboardProducts() {
  const { products, isLoading, reload } = useMyProducts();
  const calificaciones = useProductRatings(products);
  const [criterio, setCriterio] = useState<Criterio>('alfabetico');
  const [direccion, setDireccion] = useState<Direccion>('asc');
  // Qué moneda manda al ordenar por precio. Igual que en explorar: CUP y USD no
  // se pueden comparar entre sí, así que se agrupa en vez de mezclar.
  const [moneda, setMoneda] = useState<'USD' | 'CUP'>('USD');

  // Pulsar el criterio que ya está activo le da la vuelta; cambiar de criterio
  // arranca con su sentido natural en vez de heredar el del anterior.
  function elegirCriterio(nuevo: Criterio) {
    if (nuevo === criterio) {
      // En precio, repulsar cambia de moneda; en los demás, da la vuelta al orden.
      if (nuevo === 'precio') setMoneda((m) => (m === 'USD' ? 'CUP' : 'USD'));
      else setDireccion((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setCriterio(nuevo);
    setDireccion(SENTIDO_INICIAL[nuevo]);
  }

  const criterios = useMemo(() => {
    const flecha = (c: Criterio) =>
      criterio === c && direccion === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />;
    return [
      {
        value: 'alfabetico' as const,
        label: criterio === 'alfabetico' && direccion === 'desc' ? 'Z–A' : 'A–Z',
        icon: criterio === 'alfabetico' && direccion === 'desc' ? <ArrowUpZA size={14} /> : <ArrowDownAZ size={14} />,
      },
      { value: 'calificacion' as const, label: 'Calificación', icon: flecha('calificacion') },
      {
        value: 'precio' as const,
        label: criterio === 'precio' ? `Precio — ${moneda} primero` : 'Precio',
        icon: flecha('precio'),
      },
    ];
  }, [criterio, direccion, moneda]);
  const { notify } = useToast();
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(toDelete);
      notify('Producto eliminado');
      setToDelete(null);
      reload();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo eliminar el producto', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const ordenados = useMemo(() => {
    const nota = (id: string) => calificaciones[id]?.media ?? 0;
    const signo = direccion === 'asc' ? 1 : -1;
    const enMoneda = (p: Product) => (moneda === 'USD' ? p.priceUsd : p.priceCup);
    const enLaOtra = (p: Product) => (moneda === 'USD' ? p.priceCup : p.priceUsd);

    return [...products].sort((a, b) => {
      if (criterio === 'alfabetico') return signo * a.name.localeCompare(b.name, 'es');
      if (criterio === 'calificacion') return signo * (nota(a.idProduct) - nota(b.idProduct));

      // Delante los que tienen precio en la moneda elegida; detrás el resto.
      // Cada producto cuenta en un solo grupo, así que ninguno sale dos veces.
      const aTiene = enMoneda(a) !== null && enMoneda(a) !== undefined;
      const bTiene = enMoneda(b) !== null && enMoneda(b) !== undefined;
      if (aTiene !== bTiene) return aTiene ? -1 : 1;
      const valor = aTiene ? enMoneda : enLaOtra;
      return signo * ((valor(a) ?? 0) - (valor(b) ?? 0));
    });
  }, [products, criterio, direccion, moneda, calificaciones]);

  if (isLoading) return <PageSpinner />;

  return (
    <div id="dash-products" className="dash-products space-y-5">
      <div id="dash-products__header" className="dash-products__header flex items-center justify-between">
        <h2 id="dash-products__title" className="dash-products__title font-semibold text-ink-900">Productos ({products.length})</h2>
        <Link to="/panel/productos/nuevo">
          <Button size="sm" icon={<Plus size={15} />}>Publicar producto</Button>
        </Link>
      </div>

      {products.length > 1 && (
        <div id="dash-products__sort" className="dash-products__sort flex flex-wrap items-center gap-2">
          <span id="dash-products__sort-label" className="dash-products__sort-label text-xs font-semibold uppercase tracking-wide text-ink-500">
            Ordenar por
          </span>
          <SegmentedToggle id="dash-products__sort-options" options={criterios} value={criterio} onChange={elegirCriterio} />
          <InfoTip className="dash-products__sort-help ml-auto">
            Pulsa otra vez el criterio activo para darle la vuelta. En precio, cambia entre USD y CUP
            primero.
          </InfoTip>
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={<Package size={20} />}
          title="Aún no tienes productos"
          description="Publica tu primer producto para que los compradores lo encuentren."
          action={
            <Link to="/panel/productos/nuevo">
              <Button size="sm" icon={<Plus size={15} />}>Publicar producto</Button>
            </Link>
          }
        />
      ) : (
        <div id="dash-products__table-frame" className="dash-products__table-frame overflow-hidden rounded-2xl border border-ink-200">
          <table id="dash-products__table" className="dash-products__table w-full text-sm">
            <tbody>
              {ordenados.map((product) => {
                const imageUrl = productImageUrl(product.image);
                return (
                  <tr key={product.idProduct} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/60">
                    <td className="w-16 p-3">
                      <div className="h-12 w-12 overflow-hidden rounded-lg bg-ink-100 flex items-center justify-center text-ink-300">
                        <ProductThumb src={imageUrl} categoria={nombreDeCategoria(product)} />
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-ink-900">{product.name}</p>
                      <p className="text-xs text-ink-500">{nombreDeCategoria(product)}</p>
                      {/* Hasta que no hay sitio de sobra, el precio, la nota y
                          el stock no tienen columna propia: bajan aquí, debajo
                          del nombre. Medido a 375: con sus tres columnas,
                          «Eliminar» caía entera fuera de la pantalla (387–425)
                          y el marco la recortaba sin dejar forma de llegar a
                          ella. */}
                      <span className="dash-products__meta mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 lg:hidden">
                        <span className="dash-products__meta-price text-sm font-medium text-ink-700">
                          {moneda === 'CUP'
                            ? formatPrice(product.priceCup, 'CUP') ?? formatPrice(product.priceUsd, 'USD')
                            : formatPrice(product.priceUsd, 'USD') ?? formatPrice(product.priceCup, 'CUP')}
                        </span>
                        <span className="dash-products__meta-rating inline-flex items-center gap-1 whitespace-nowrap">
                          <span className="text-xs font-medium text-ink-900">
                            {(calificaciones[product.idProduct]?.media ?? 0).toFixed(1)}
                          </span>
                          <RatingStars value={calificaciones[product.idProduct]?.media ?? 0} size={11} />
                        </span>
                        <Badge variant={product.stock ? 'success' : 'danger'}>{product.stock ? 'Disponible' : 'Agotado'}</Badge>
                      </span>
                    </td>
                    <td className="hidden p-3 text-ink-700 lg:table-cell">
                      {moneda === 'CUP'
                        ? formatPrice(product.priceCup, 'CUP') ?? formatPrice(product.priceUsd, 'USD')
                        : formatPrice(product.priceUsd, 'USD') ?? formatPrice(product.priceCup, 'CUP')}
                    </td>
                    {/* Las seis columnas solo caben a partir de `lg`. El corte
                        no es el del teléfono sino el del menú lateral: desde
                        `md` la navegación se pone al lado y se lleva 208 px, así
                        que a 768 quedan menos de 500 para la tabla y «Eliminar»
                        volvía a salirse —medido—. Por debajo de `lg`, el precio,
                        la nota y el stock van debajo del nombre. */}
                    <td className="hidden p-3 lg:table-cell">
                      {/* La nota delante y las estrellas detrás: el número es
                          lo que se compara de un vistazo entre filas. */}
                      <span className="dash-products__rating inline-flex items-center gap-1.5 whitespace-nowrap">
                        <span className="dash-products__rating-value text-sm font-medium text-ink-900">
                          {(calificaciones[product.idProduct]?.media ?? 0).toFixed(1)}
                        </span>
                        <RatingStars value={calificaciones[product.idProduct]?.media ?? 0} size={13} />
                      </span>
                    </td>
                    <td className="hidden p-3 lg:table-cell">
                      <Badge variant={product.stock ? 'success' : 'danger'}>{product.stock ? 'Disponible' : 'Agotado'}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex gap-1">
                        <Link to={`/panel/productos/${product.idProduct}`}>
                          <Button variant="ghost" size="sm" icon={<Pencil size={14} />} aria-label="Editar" />
                        </Link>
                        <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setToDelete(product.idProduct)} aria-label="Eliminar" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar producto"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

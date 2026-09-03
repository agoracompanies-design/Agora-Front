import { useCallback, useEffect, useState } from 'react';
import { Check, Package, ShieldCheck, Tags, X } from 'lucide-react';
import { approveCategory, deleteCategory, listPendingCategories, updateCategory } from '@/api/category';
import { listProducts } from '@/api/product';
import type { Category, Product } from '@/types';
import { CATEGORIA_TEMPORAL, categoriaPendiente } from '@/lib/categorias';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { InfoTip } from '@/components/ui/InfoTip';
import { useToast } from '@/context/ToastContext';
import { ApiError } from '@/api/client';

/**
 * Las categorías que esperan revisión, tal como las guarda el backend.
 *
 * Antes esta pantalla adivinaba las solicitudes mirando qué productos estaban
 * parados en «Otros»; desde que las categorías son una tabla propia, se leen de
 * `/categories/pending`, que es la lista de verdad.
 *
 * El nombre es editable a propósito: lo escribe quien publica, y «Mascota»,
 * «mascotas» o «Msacotas» son la misma estantería. Se corrige aquí, antes de
 * que la categoría exista de verdad.
 */
export function ModerationPage() {
  const { notify } = useToast();
  const [pendientes, setPendientes] = useState<Category[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState('');
  const [cargando, setCargando] = useState(true);
  const [sinPermiso, setSinPermiso] = useState(false);

  const cargar = useCallback(() => {
    setCargando(true);
    Promise.allSettled([listPendingCategories(), listProducts({ limit: 200 })])
      .then(([categorias, catalogo]) => {
        if (categorias.status === 'fulfilled') {
          setPendientes(categorias.value);
          setNombres(Object.fromEntries(categorias.value.map((c) => [c.id, c.name])));
          setSinPermiso(false);
        } else {
          // `category:approve` no se concede por defecto: sin él esta pantalla
          // no tiene nada que enseñar, y conviene decir por qué.
          setSinPermiso(categorias.reason instanceof ApiError && categorias.reason.status === 403);
          setPendientes([]);
        }
        setProductos(catalogo.status === 'fulfilled' ? catalogo.value.products : []);
      })
      .finally(() => setCargando(false));
  }, []);

  useEffect(cargar, [cargar]);

  /** Los productos que salieron a «Otros» esperando justo esta categoría. */
  const esperando = (nombre: string) =>
    productos.filter((p) => categoriaPendiente(p)?.toLowerCase() === nombre.toLowerCase());

  async function aprobar(categoria: Category) {
    const nombre = (nombres[categoria.id] ?? '').trim();
    if (nombre.length < 2) {
      notify('Escribe el nombre con el que se creará', 'error');
      return;
    }
    setGuardando(categoria.id);
    try {
      // Primero la corrección de ortografía, si la hubo: hay que dejarla con su
      // nombre definitivo antes de que empiece a clasificar.
      if (nombre !== categoria.name) await updateCategory(categoria.id, { name: nombre });
      await approveCategory(categoria.id);
      notify(`«${nombre}» ya es una categoría del catálogo`);
      cargar();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo aprobar la categoría', 'error');
    } finally {
      setGuardando('');
    }
  }

  async function descartar(categoria: Category) {
    setGuardando(categoria.id);
    try {
      await deleteCategory(categoria.id);
      notify(`«${categoria.name}» descartada`);
      cargar();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo descartar', 'error');
    } finally {
      setGuardando('');
    }
  }

  if (cargando) return <PageSpinner />;

  return (
    <div id="moderation" className="moderation mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <title>Moderación · Agora</title>

      <header id="moderation__header" className="moderation__header mb-6">
        <span
          id="moderation__eyebrow"
          className="moderation__eyebrow inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500"
        >
          <ShieldCheck size={14} aria-hidden="true" /> Moderación
        </span>
        <h1 id="moderation__title" className="moderation__title mt-2 text-2xl font-semibold text-ink-900">
          Categorías por revisar
        </h1>
        <p id="moderation__subtitle" className="moderation__subtitle mt-1.5 text-sm text-ink-500">
          Las que pidieron los negocios al publicar. Corrige el nombre antes de aprobarla si hace
          falta: así no acaban «Mascotas» y «mascota» siendo dos estanterías.
        </p>
      </header>

      {sinPermiso ? (
        <EmptyState
          icon={<ShieldCheck size={20} />}
          title="Tu cuenta no puede revisar categorías"
          description="Hace falta el permiso «category:approve», que hoy no se concede automáticamente a nadie: tiene que asignarlo el equipo de backend."
        />
      ) : pendientes.length === 0 ? (
        <EmptyState
          icon={<Tags size={20} />}
          title="No hay nada esperando"
          description="Cuando un negocio publique con una categoría que no existe, aparecerá aquí para revisarla."
        />
      ) : (
        <ul id="moderation__list" className="moderation__list space-y-3">
          {pendientes.map((categoria) => {
            const enEspera = esperando(categoria.name);
            return (
              <li
                key={categoria.id}
                id={`moderation__item--${categoria.id}`}
                className="moderation__item rounded-2xl border border-ink-200 bg-ink-50 p-5"
              >
                <div className="moderation__item-head flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="moderation__item-name font-medium text-ink-900">«{categoria.name}»</h2>
                  <p className="moderation__item-count flex items-center gap-1.5 text-xs text-ink-500">
                    <Package size={12} aria-hidden="true" />
                    {enEspera.length === 0
                      ? 'sin productos esperando'
                      : `${enEspera.length} producto${enEspera.length === 1 ? '' : 's'} en ${CATEGORIA_TEMPORAL}`}
                  </p>
                </div>

                {enEspera.length > 0 && (
                  <p className="moderation__item-products mt-1 line-clamp-2 text-sm text-ink-500">
                    {enEspera.map((p) => p.name).join(', ')}
                  </p>
                )}

                <label
                  htmlFor={`moderation__name--${categoria.id}`}
                  className="moderation__item-label mt-4 mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500"
                >
                  Nombre con el que se creará
                  <InfoTip>
                    Aprobarla la deja disponible en el catálogo, pero no mueve sola a los productos
                    que la esperan: eso lo tiene que hacer cada negocio editando su producto.
                  </InfoTip>
                </label>
                <div className="moderation__item-actions flex flex-wrap gap-2">
                  <input
                    id={`moderation__name--${categoria.id}`}
                    value={nombres[categoria.id] ?? ''}
                    onChange={(e) => setNombres((n) => ({ ...n, [categoria.id]: e.target.value }))}
                    maxLength={100}
                    className="moderation__item-input h-10 min-w-0 flex-1 rounded-xl border border-ink-200 bg-ink-50 px-3 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-primary"
                  />
                  <Button
                    icon={<Check size={15} />}
                    loading={guardando === categoria.id}
                    onClick={() => aprobar(categoria)}
                  >
                    Aprobar
                  </Button>
                  <Button variant="outline" icon={<X size={15} />} onClick={() => descartar(categoria)}>
                    Descartar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

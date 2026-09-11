import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/context/NotificationsContext';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

/**
 * Los avisos, en su propia pantalla.
 *
 * Antes vivían en el menú de la cuenta, plegados detrás del nombre de usuario:
 * un sitio al que se entra para cambiar la contraseña o cerrar sesión, no para
 * leer. Ahora tienen su botón en la cabecera, al lado de los favoritos, y una
 * página donde caben enteros, con su fecha y sin recortar el texto.
 */
export function NotificationsPage() {
  const { avisos, sinLeer, marcarTodoLeido } = useNotifications();

  return (
    <div id="notifications" className="notifications mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header id="notifications__header" className="notifications__header flex items-start justify-between gap-4">
        <div>
          <h1 id="notifications__title" className="notifications__title text-2xl font-semibold text-ink-900">
            Tus avisos
          </h1>
          <p id="notifications__subtitle" className="notifications__subtitle mt-1 text-sm text-ink-500">
            {sinLeer > 0
              ? `Tienes ${sinLeer} sin leer.`
              : 'Aquí aparece lo que pasa con tus productos y tus solicitudes.'}
          </p>
        </div>
        {sinLeer > 0 && (
          <Button variant="outline" size="sm" onClick={marcarTodoLeido} icon={<CheckCheck size={15} />}>
            Marcar todo como leído
          </Button>
        )}
      </header>

      <div id="notifications__body" className="notifications__body mt-8">
        {avisos.length === 0 ? (
          <EmptyState
            icon={<Bell size={20} />}
            title="No tienes avisos"
            description="Cuando pidas una categoría nueva o haya novedades en tu negocio, te lo contamos aquí."
            action={
              <Link to="/">
                <Button variant="outline">Explorar productos</Button>
              </Link>
            }
          />
        ) : (
          <div id="notifications__list" className="notifications__list rounded-2xl border border-ink-200 bg-ink-50">
            <NotificationsPanel enPagina />
          </div>
        )}
      </div>
    </div>
  );
}

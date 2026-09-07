import { useState } from 'react';
import type { FormEvent, SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMotion } from '@/context/MotionContext';
import { useToast } from '@/context/ToastContext';
import { updatePassword, deleteAccount } from '@/api/user';
import { cancelSubscription, estaVigente, getMySubscriptionHistory } from '@/api/subscription';
import type { Subscription } from '@/api/subscription';
import { PasswordField } from '@/components/ui/PasswordField';
import { Button } from '@/components/ui/Button';
import { Card, Badge } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { initials } from '@/lib/utils';

export function AccountPage() {
  const { user, isSeller, subscription, logout, refreshSellerStatus } = useAuth();
  const { reducirMovimiento, loPideElSistema, eleccionManual, setReducirMovimiento, seguirAlSistema } = useMotion();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [historial, setHistorial] = useState<Subscription[] | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  if (!user) return null;

  /** Trae el historial la primera vez que se despliega, y no más. */
  async function cargarHistorial(e: SyntheticEvent<HTMLDetailsElement>) {
    if (!e.currentTarget.open || historial !== null || cargandoHistorial) return;
    setCargandoHistorial(true);
    try {
      setHistorial(await getMySubscriptionHistory());
    } catch {
      setHistorial([]);
      notify('No se pudo cargar el historial', 'error');
    } finally {
      setCargandoHistorial(false);
    }
  }

  async function handleCancel() {
    if (!subscription) return;
    setCancelando(true);
    try {
      await cancelSubscription(subscription.idSubscription);
      await refreshSellerStatus();
      notify('Membresía cancelada');
      setConfirmCancel(false);
      // Sin membresía no hay app: se lleva a las opciones de compra en vez de
      // dejarle en una cuenta desde la que ya no puede ir a ningún sitio.
      navigate('/planes', { replace: true });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo cancelar la membresía', 'error');
    } finally {
      setCancelando(false);
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updatePassword(currentPassword, newPassword);
      notify('Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteAccount(user.id);
      notify('Cuenta eliminada');
      logout();
      navigate('/');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo eliminar la cuenta', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div id="account" className="account mx-auto max-w-2xl px-4 sm:px-6 py-10 space-y-6">
      <div id="account__identity" className="account__identity flex items-center gap-4">
        <span id="account__initials" className="account__initials flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
          {initials(user.username)}
        </span>
        <div>
          <h1 id="account__username" className="account__username text-xl font-semibold text-ink-900">{user.username}</h1>
          <Badge variant={isSeller ? 'dark' : 'neutral'} className="mt-1">
            {isSeller ? 'Cuenta de vendedor' : 'Cuenta de comprador'}
          </Badge>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold text-ink-900">Membresía</h2>
        {subscription ? (
          <div id="membership" className="membership space-y-4">
            <div id="membership__current" className="membership__current flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
                <CalendarClock size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-900">{subscription.name}</p>
                {subscription.expiresAt && (
                  <p className="text-xs text-ink-500">
                    Vence el {new Date(subscription.expiresAt).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
            </div>

            {/* El historial se pide al abrirlo, no al entrar en la cuenta: es
                una consulta que la mayoría no va a mirar. */}
            <details id="membership__history" className="membership__history" onToggle={cargarHistorial}>
              <summary id="membership__history-summary" className="membership__history-summary cursor-pointer text-sm text-ink-600 hover:text-ink-900">
                Ver historial de membresías
              </summary>
              <div id="membership__history-body" className="membership__history-body mt-3">
                {cargandoHistorial && <p className="text-xs text-ink-400">Cargando…</p>}
                {!cargandoHistorial && historial?.length === 0 && (
                  <p className="text-xs text-ink-400">Esta es tu primera membresía.</p>
                )}
                {!cargandoHistorial && historial && historial.length > 0 && (
                  <ul id="membership__history-list" className="membership__history-list space-y-2">
                    {historial.map((s) => (
                      <li
                        key={s.idSubscription}
                        className="membership__history-item flex items-center justify-between gap-3 rounded-lg border border-ink-200 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm text-ink-900">{s.name}</p>
                          <p className="text-xs text-ink-500">
                            {new Date(s.createdAt).toLocaleDateString('es-ES')}
                            {s.expiresAt && ` — ${new Date(s.expiresAt).toLocaleDateString('es-ES')}`}
                          </p>
                        </div>
                        <Badge>{estaVigente(s) ? 'Vigente' : 'Terminada'}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>

            <div id="membership__actions" className="membership__actions flex items-center gap-3 border-t border-ink-200 pt-3">
              <Button variant="outline" size="sm" onClick={() => setConfirmCancel(true)}>
                Cancelar membresía
              </Button>
              <p id="membership__actions-hint" className="membership__actions-hint text-xs text-ink-400">
                Sin membresía al día no se puede usar Agora.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-500">No tienes una membresía activa.</p>
            <Link to={isSeller ? '/vender' : '/planes'}>
              <Button size="sm">Elegir plan</Button>
            </Link>
          </div>
        )}
      </Card>

      <Card className="motion-pref p-6">
        <h2 className="mb-1.5 font-semibold text-ink-900">Accesibilidad</h2>
        <p className="mb-4 text-sm text-ink-500">
          Agora usa movimiento en algunos sitios: el fondo del carrusel, el marcador de los mapas y las
          transiciones entre pantallas. Puedes apagarlo todo.
        </p>

        <label id="motion-pref__switch" className="motion-pref__switch flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-medium text-ink-900">Reducir animaciones</span>
            <span className="block text-xs text-ink-500">
              {loPideElSistema
                ? 'Tu sistema ya pide menos movimiento, así que viene activado.'
                : 'Deja la interfaz quieta, sin desplazamientos ni parpadeos.'}
            </span>
          </span>
          <input
            type="checkbox"
            checked={reducirMovimiento}
            onChange={(e) => setReducirMovimiento(e.target.checked)}
            id="motion-pref__input" className="motion-pref__input h-5 w-5 shrink-0 accent-primary"
          />
        </label>

        {eleccionManual !== null && (
          <button
            onClick={seguirAlSistema}
            id="motion-pref__reset" className="motion-pref__reset mt-3 text-xs font-medium text-ink-500 underline hover:text-ink-900"
          >
            Volver a seguir la configuración del sistema
          </button>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold text-ink-900">Cambiar contraseña</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <PasswordField
            label="Contraseña actual"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <PasswordField
            label="Nueva contraseña"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button type="submit" loading={submitting}>Actualizar contraseña</Button>
        </form>
      </Card>

      <Card className="p-6 border-red-100">
        <h2 className="mb-1.5 font-semibold text-ink-900">Eliminar cuenta</h2>
        <p className="mb-4 text-sm text-ink-500">Esta acción es permanente y no se puede deshacer.</p>
        <Button variant="danger" icon={<Trash2 size={15} />} onClick={() => setConfirmDelete(true)}>
          Eliminar mi cuenta
        </Button>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar cuenta"
        description="Se eliminará tu cuenta de forma permanente. ¿Deseas continuar?"
        confirmLabel="Eliminar cuenta"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={confirmCancel}
        title="Cancelar membresía"
        description="Perderás el acceso a Agora en cuanto se cancele, y tu negocio dejará de aparecer si tienes uno. Tu cuenta y tu catálogo se quedan como están: vuelven en cuanto actives otra membresía."
        confirmLabel="Cancelar membresía"
        loading={cancelando}
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}

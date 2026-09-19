import type { ReactNode } from 'react';
import { Ban, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { WHATSAPP_MODERACION, enlaceWhatsapp, telefonoLegible } from '@/lib/contacto';
import type { InfoBaneo } from '@/lib/baneo';

/**
 * Lo que ve una cuenta baneada: esta pantalla y nada más.
 *
 * El flujo acordado es que el servidor captura la infracción, se avisa al
 * usuario en sus notificaciones y, si no corrige, se le banea. Al entrar ya no
 * llega a la aplicación: aquí se le dice, y se le da el WhatsApp del grupo que
 * lo atendió para negociar.
 *
 * **El baneo de verdad tiene que hacerlo la API.** Esconder la interfaz no
 * impide usar el servidor; esto solo es la cara visible.
 */
export function BannedGate({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  if (!user?.banned) return <>{children}</>;

  return (
    <BannedScreen
      usuario={user.username}
      info={{
        motivo: user.bannedReason ?? null,
        desde: user.bannedAt ?? null,
        grupo: null,
        telefono: user.supportPhone ?? null,
      }}
      onSalir={logout}
    />
  );
}

/**
 * La pantalla en sí, que también se enseña **sin sesión**: desde `51aa8fe` el
 * servidor rechaza el acceso de una cuenta bloqueada con un 403, así que no
 * llega a haber usuario. Los datos —motivo, fecha y el WhatsApp del grupo que
 * lo atendió— vienen en ese mismo error.
 */
export function BannedScreen({
  usuario,
  info,
  onSalir,
}: {
  usuario?: string;
  info: InfoBaneo;
  onSalir?: () => void;
}) {
  const telefono = info.telefono ?? WHATSAPP_MODERACION;
  const mensaje =
    'Hola, mi cuenta de Agora' +
    (usuario ? ' (' + usuario + ')' : '') +
    ' está bloqueada y quiero saber cómo resolverlo.';
  const wa = enlaceWhatsapp(telefono, mensaje);

  return (
    <main id="banned" className="banned flex min-h-screen flex-col items-center justify-center bg-ink-100 px-4 text-center">
      <title>Cuenta bloqueada · Agora</title>

      <span id="banned__icon" className="banned__icon flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400">
        <Ban size={30} aria-hidden="true" />
      </span>
      <h1 id="banned__title" className="banned__title mt-6 text-3xl font-semibold text-ink-900">
        Tu cuenta está bloqueada
      </h1>
      <p id="banned__text" className="banned__text mt-3 max-w-lg text-base leading-relaxed text-ink-700">
        {info.motivo ?? 'Se bloqueó por incumplir las normas de Agora después de haberte avisado.'}
      </p>
      {info.desde && (
        <p id="banned__date" className="banned__date mt-1 text-sm text-ink-500">
          Desde el {new Date(info.desde).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      )}
      <p id="banned__help" className="banned__help mt-4 max-w-lg text-sm text-ink-600">
        {info.grupo
          ? 'Escribe por WhatsApp a ' + info.grupo + ' para resolverlo.'
          : 'Escribe por WhatsApp al equipo que lleva tu cuenta para resolverlo.'}
      </p>

      <div id="banned__actions" className="banned__actions mt-7 flex flex-wrap items-center justify-center gap-3">
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            id="banned__whatsapp"
            className="banned__whatsapp inline-flex h-12 items-center gap-2 rounded-3xl bg-primary px-8 text-base font-medium text-white shadow-soft hover:bg-primary-dark"
          >
            <MessageCircle size={18} aria-hidden="true" />
            Escribir por WhatsApp {telefonoLegible(telefono)}
          </a>
        )}
        {onSalir && (
          <Button variant="ghost" onClick={onSalir}>Cerrar sesión</Button>
        )}
      </div>
    </main>
  );
}

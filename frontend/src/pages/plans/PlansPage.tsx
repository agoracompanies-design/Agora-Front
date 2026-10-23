import { Navigate, useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { PlanPicker } from '@/components/plans/PlanPicker';
import { Button } from '@/components/ui/Button';
import { BUYER_PLAN, SELLER_PLAN, enlaceParaSolicitar } from '@/lib/plans';

export function PlansPage() {
  const { user, isAuthenticated, isLoading, isSeller, tieneAcceso, logout } = useAuth();
  const navigate = useNavigate();

  // Antes había un efecto que, al detectar CUALQUIER suscripción activa —
  // incluida la prueba—, echaba de aquí para atrás de inmediato. Eso dejaba
  // muerto el enlace «Elegir membresía» del carrusel de promociones para
  // cualquiera que ya tuviera algo: entraba y salía en el mismo instante, sin
  // que el clic pareciera hacer nada. Aquí ya no se activa nada: el plan se pide
  // por WhatsApp y llega cuando el panel lo activa.

  if (isLoading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/registrarse" replace />;
  // Solo se manda al panel a quien puede entrar en él. Sin este `tieneAcceso`,
  // un negocio con la suscripción vencida quedaba dando vueltas: aquí se le
  // enviaba al panel por tener empresa, y el panel le devolvía aquí por no
  // tener plan, así que la pantalla se quedaba en blanco y no podía renovar.
  if (isSeller && tieneAcceso) return <Navigate to="/panel" replace />;

  // Quien ya vende necesita el plan que le devuelve su panel; el resto, el de
  // comprador. Ofrecer siempre el de comprador dejaba a un negocio pagando algo
  // que no le abría lo suyo.
  const plan = isSeller ? SELLER_PLAN : BUYER_PLAN;

  return (
    <div id="plans-page" className="plans-page mx-auto max-w-2xl px-4 sm:px-6 py-12">
      {/* React 19 lo sube al <head>: cada ruta con su título. */}
      <title>Planes · Ágora</title>
      <div id="plans-page__intro" className="plans-page__intro mb-10 text-center">
        <div id="plans-page__icon" className="plans-page__icon mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
          <ShoppingBag size={19} />
        </div>
        <h1 id="plans-page__title" className="plans-page__title text-2xl font-semibold text-ink-900">
          {tieneAcceso
            ? `Elige tu ${isSeller ? 'plan de proveedor' : 'membresía de comprador'}`
            : 'Tu suscripción ya no está activa'}
        </h1>
        <p id="plans-page__subtitle" className="plans-page__subtitle mt-2 text-sm text-ink-500">
          {tieneAcceso
            ? 'Un paso más y podrás buscar en todo el catálogo de tu ciudad.'
            : isSeller
              ? 'Actívala y tu negocio vuelve a estar en línea, con su catálogo tal como lo dejaste.'
               : 'Ágora se usa con una membresía al día. Actívala y vuelves justo donde estabas.'}
        </p>
      </div>

      <Card className="p-6">
        {/* El plan no se activa desde aquí: se paga por WhatsApp y, confirmado el
            pago, se activa desde el panel administrativo. */}
        <PlanPicker plan={plan} enlace={(tier) => enlaceParaSolicitar(plan, tier, user?.username)} />
        <p id="plans-page__note" className="plans-page__note mt-3 text-center text-xs text-ink-500">Te escribimos para confirmar el pago y activamos tu membresía.</p>
      </Card>

      <div id="plans-page__skip" className="plans-page__skip mt-6 flex items-center justify-center">
        {tieneAcceso ? (
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            Decidir más tarde
          </Button>
        ) : (
          // Sin membresía no hay a dónde volver: la única salida es cerrar sesión.
          <Button variant="ghost" size="sm" onClick={logout}>
            Cerrar sesión
          </Button>
        )}
      </div>
    </div>
  );
}

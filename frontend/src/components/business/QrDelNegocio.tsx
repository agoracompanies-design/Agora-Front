import { Suspense, lazy, useState } from 'react';
import { Check, Copy, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/context/ToastContext';

/** Los 52 kB de la librería solo los descarga quien tiene un negocio. */
const QrDeEnlace = lazy(() => import('@/components/ui/QrDeEnlace'));

/**
 * El enlace y el QR del negocio, para que su dueño los reparta.
 *
 * **Para qué sirve.** Quien escanea cae directo en la ficha del negocio dentro
 * de Agora, con su catálogo: sirve para pegarlo en el mostrador, imprimirlo en
 * una tarjeta o mandarlo por mensaje. Es la forma de que un cliente que ya está
 * delante encuentre el negocio sin buscarlo.
 *
 * El enlace se arma aquí con el identificador que ya tiene la pantalla: no hace
 * falta pedirle nada al servidor.
 */
export function QrDelNegocio({
  idUserEnterprise,
  companyName,
}: {
  idUserEnterprise: string;
  companyName?: string;
}) {
  const { notify } = useToast();
  const [copiado, setCopiado] = useState(false);
  const enlace = `${window.location.origin}/negocios/${idUserEnterprise}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      notify('Enlace copiado');
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso del portapapeles el enlace sigue a la vista para copiarlo
      // a mano, y se dice en vez de dejar un botón que no hace nada.
      notify('No se pudo copiar solo. Selecciona el enlace y cópialo.', 'error');
    }
  }

  return (
    <Card id="business-qr" className="business-qr mt-6 p-5">
      <h2 className="business-qr__title flex items-center gap-2 font-semibold text-ink-900">
        <QrCode size={16} aria-hidden="true" className="text-primary" />
        Tu código para compartir
      </h2>
      <p className="business-qr__subtitle mt-1 text-sm text-ink-500">
        Quien lo escanee llega directo a {companyName ? `«${companyName}»` : 'tu negocio'} en
        Ágora, con todo tu catálogo. Pégalo en el mostrador o imprímelo.
      </p>

      <div className="business-qr__body mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        <Suspense
          fallback={<div className="h-[200px] w-[200px] shrink-0 animate-pulse rounded-xl bg-ink-200" />}
        >
          <QrDeEnlace enlace={enlace} />
        </Suspense>

        <div className="business-qr__link min-w-0 flex-1">
          <p className="mb-1.5 text-xs font-medium text-ink-700">También puedes mandar el enlace</p>
          {/* Seleccionable y partible: la dirección no tiene espacios y sin
              `break-all` se salía de la tarjeta en un móvil. */}
          <p className="business-qr__url select-all break-all rounded-xl border border-ink-200 bg-ink-100 px-3 py-2 font-mono text-[13px] text-ink-800">
            {enlace}
          </p>
          <Button
            className="mt-3"
            variant="outline"
            onClick={() => void copiar()}
            icon={copiado ? <Check size={15} /> : <Copy size={15} />}
          >
            {copiado ? 'Copiado' : 'Copiar enlace'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

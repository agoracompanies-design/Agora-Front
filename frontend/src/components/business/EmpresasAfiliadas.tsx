import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Building2, Check, Copy, Plus, QrCode, X } from 'lucide-react';
import {
  enlaceDeAfiliacion,
  pedirCodigo,
  soltarAfiliada,
  verAfiliadas,
  type ResumenAfiliadas,
} from '@/api/afiliadas';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/context/ToastContext';

/** Los 52 kB del generador de QR solo los descarga quien reparte plazas. */
const QrDeEnlace = lazy(() => import('@/components/ui/QrDeEnlace'));

/**
 * Las otras empresas del mismo dueño.
 *
 * **Qué es esto.** Quien paga un plan VIP puede sumar hasta cinco negocios
 * suyos sin pagar por cada uno y llevarlos por separado. No es regalar plazas
 * a terceros: es el mismo dueño, o la misma junta, pagando una vez.
 *
 * Cada plaza se da con un **código de un solo uso**. Se puede mandar por
 * mensaje —es corto y se puede dictar— o enseñar como QR, que abre el registro
 * de empresa con el código ya puesto.
 *
 * **No se enseña a quien no tiene VIP.** Una sección vacía explicando algo que
 * no se puede usar solo estorba en una pantalla que ya es larga.
 */
export function EmpresasAfiliadas() {
  const { notify } = useToast();
  const [resumen, setResumen] = useState<ResumenAfiliadas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pidiendo, setPidiendo] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  /** A quién se está a punto de soltar: se confirma en dos pasos. */
  const [soltando, setSoltando] = useState<string | null>(null);
  /** De qué código se enseña el QR. Uno cada vez: ocupan sitio. */
  const [qrDe, setQrDe] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setResumen(await verAfiliadas());
    } catch {
      // Sin empresa o sin servidor: la sección simplemente no sale.
      setResumen(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function generar() {
    setPidiendo(true);
    try {
      const nuevo = await pedirCodigo();
      notify(`Código listo: ${nuevo.code}`);
      setQrDe(nuevo.code);
      await cargar();
    } catch {
      notify('No se pudo crear el código. ¿Te quedan plazas?', 'error');
    } finally {
      setPidiendo(false);
    }
  }

  async function copiar(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiado(code);
      notify('Código copiado');
      window.setTimeout(() => setCopiado(null), 2000);
    } catch {
      // El código está a la vista y es corto: se puede teclear.
      notify('No se pudo copiar solo. El código está a la vista.', 'error');
    }
  }

  async function soltar(id: string, nombre: string) {
    try {
      await soltarAfiliada(id);
      notify(`${nombre} deja de estar afiliada y pierde el acceso de tu plan`);
      setSoltando(null);
      await cargar();
    } catch {
      notify('No se pudo soltar esa empresa.', 'error');
    }
  }

  if (cargando || !resumen?.esVip) return null;

  const { plazas, ocupadas, disponibles, afiliadas, codigosLibres } = resumen;

  return (
    <Card className="affiliates p-6">
      <header className="affiliates__head flex flex-wrap items-center justify-between gap-3">
        <h2 className="affiliates__title flex items-center gap-2 font-semibold text-ink-900">
          <Building2 size={17} aria-hidden="true" className="text-primary" />
          Tus otras empresas
        </h2>
        {/* El «3 de 5» de siempre: se entiende sin leer nada más. */}
        <p className="affiliates__count text-sm font-medium text-ink-700">
          Empresas afiliadas: {ocupadas} de {plazas}
        </p>
      </header>

      <p className="affiliates__intro mt-1 text-sm text-ink-500">
        Tu plan te deja sumar {plazas} negocios más sin pagar por cada uno. Cada
        plaza se da con un código de un solo uso.
      </p>

      {afiliadas.length > 0 && (
        <ul className="affiliates__list mt-4 space-y-2">
          {afiliadas.map((a) => (
            <li
              key={a.idUserEnterprise}
              className="affiliates__item flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5"
            >
              <span className="affiliates__name text-sm font-medium text-ink-900">
                {a.companyName}
              </span>

              {soltando === a.idUserEnterprise ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-ink-700">
                    ¿Soltarla? Pierde el acceso de tu plan.
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setSoltando(null)}>
                    No
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => void soltar(a.idUserEnterprise, a.companyName)}
                  >
                    Sí, soltar
                  </Button>
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSoltando(a.idUserEnterprise)}
                  icon={<X size={14} />}
                  aria-label={`Soltar a ${a.companyName}`}
                >
                  Soltar
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Códigos repartidos que nadie ha gastado. Ocupan plaza igual. */}
      {codigosLibres.length > 0 && (
        <div className="affiliates__codes mt-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
            Códigos sin usar
          </p>
          {codigosLibres.map((c) => (
            <div
              key={c.id}
              className="affiliates__code flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-ink-300 px-3 py-2.5"
            >
              {/* `select-all` por si el portapapeles falla. */}
              <code className="affiliates__code-value select-all font-mono text-sm font-semibold tracking-widest text-ink-900">
                {c.code}
              </code>
              <span className="grow" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void copiar(c.code)}
                icon={copiado === c.code ? <Check size={14} /> : <Copy size={14} />}
              >
                {copiado === c.code ? 'Copiado' : 'Copiar'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setQrDe(qrDe === c.code ? null : c.code)}
                icon={<QrCode size={14} />}
                aria-expanded={qrDe === c.code}
              >
                QR
              </Button>

              {qrDe === c.code && (
                <div className="affiliates__qr mt-2 flex w-full flex-col items-center gap-2">
                  <Suspense
                    fallback={
                      <div className="h-[180px] w-[180px] animate-pulse rounded-xl bg-ink-200" />
                    }
                  >
                    <QrDeEnlace enlace={enlaceDeAfiliacion(c.code)} />
                  </Suspense>
                  <p className="text-center text-xs text-ink-500">
                    Al escanearlo se abre el registro con el código ya puesto.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="affiliates__actions mt-4 flex flex-wrap items-center gap-2">
        <Button
          onClick={() => void generar()}
          disabled={disponibles <= 0}
          loading={pidiendo}
          icon={<Plus size={15} />}
        >
          Crear un código
        </Button>
        <span className="text-xs text-ink-500">
          {disponibles > 0
            ? `Te quedan ${disponibles} ${disponibles === 1 ? 'plaza' : 'plazas'}.`
            : 'No te quedan plazas. Suelta una empresa para liberar sitio.'}
        </span>
      </div>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { createEnterprise } from '@/api/userEnterprise';
import { LogoField } from '@/components/business/LogoField';
import { Input, Select } from '@/components/ui/Field';
import { PROVINCIAS } from '@/lib/provincias';
import { municipiosDe } from '@/lib/municipios';
import { SelectorBuscable } from '@/components/ui/SelectorBuscable';
import { LARGO, normalizarWeb, pareceCorreo, pareceWeb, soloDigitos, texto } from '@/lib/validacion';
import { PhoneField, telefonoListo } from '@/components/ui/PhoneField';
import { PAIS_POR_DEFECTO, telefonoCompleto } from '@/lib/paises';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { PlanPicker } from '@/components/plans/PlanPicker';
import { cn } from '@/lib/utils';
import { SELLER_PLAN, daAccesoDeNegocio, enlaceParaSolicitar } from '@/lib/plans';

export function BecomeSellerPage() {
  const { user, isAuthenticated, isLoading, enterprise, subscription, refreshSellerStatus } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('Cuba');
  const [email, setEmail] = useState('');
  const [pais, setPais] = useState(PAIS_POR_DEFECTO);
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [logo, setLogo] = useState<File | null>(null);

  useEffect(() => {
    if (enterprise) setStep(2);
  }, [enterprise]);

  // Con la empresa creada y un plan que dé negocio ya no hay nada que hacer
  // aquí: se entra al panel. Con la prueba activa vale igual, así que el paso
  // del plan se salta.
  const planDaNegocio = daAccesoDeNegocio(subscription);
  useEffect(() => {
    if (enterprise && planDaNegocio) {
      navigate('/panel', { replace: true });
    }
  }, [enterprise, planDaNegocio, navigate]);

  if (isLoading) return <PageSpinner />;

  if (!isAuthenticated) {
    return (
      <div id="sell__gate" className="sell__gate mx-auto max-w-md px-4 py-20 text-center">
        <Store size={28} className="mx-auto mb-4 text-ink-400" />
        <h1 id="sell__gate-title" className="sell__gate-title text-xl font-semibold text-ink-900">Crea una cuenta para vender</h1>
        <p id="sell__gate-text" className="sell__gate-text mt-2 text-sm text-ink-500">Regístrate como vendedor para publicar tu catálogo en Agora.</p>
        <Button className="mt-6" onClick={() => navigate('/registrarse')}>
          Crear cuenta de vendedor
        </Button>
      </div>
    );
  }

  async function handleCreateEnterprise(e: FormEvent) {
    e.preventDefault();
    // Lo que no se puede juzgar tecleando —si el correo está entero, si el
    // teléfono tiene cifras suficientes— se mira aquí, antes de salir.
    if (!pareceCorreo(email)) {
      notify('Revisa el correo de contacto: falta el @ o el dominio', 'error');
      return;
    }
    if (!telefonoListo(pais, phone)) {
      notify('El teléfono necesita al menos seis cifras', 'error');
      return;
    }
    if (!pareceWeb(website)) {
      notify('El sitio web no parece una dirección válida', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await createEnterprise({
        companyName,
        address: { street, city, state, zipCode, country },
        contact: { email: email.trim(), phone: telefonoCompleto(pais, phone), website: normalizarWeb(website) || undefined },
        logo,
      });
      await refreshSellerStatus();
      notify('Empresa registrada correctamente');
      setStep(2);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo registrar la empresa', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div id="sell" className="sell mx-auto max-w-2xl px-4 sm:px-6 py-12">
      {/* React 19 lo sube al <head>: cada ruta con su título. */}
      <title>Vender en Agora</title>
      <div id="sell__intro" className="sell__intro mb-10 text-center">
        <h1 id="sell__title" className="sell__title text-2xl font-semibold text-ink-900">Empieza a vender en Agora</h1>
        <p id="sell__subtitle" className="sell__subtitle mt-2 text-sm text-ink-500">Dos pasos y tu catálogo estará listo para tus clientes.</p>
      </div>

      <div id="sell__steps" className="sell__steps mb-10 flex items-center justify-center gap-4">
        <StepIndicator number={1} label="Tu empresa" active={step === 1} done={Boolean(enterprise)} />
        <div id="sell__steps-line" className="sell__steps-line h-px w-10 bg-ink-200" />
        <StepIndicator number={2} label="Plan vendedor" active={step === 2} done={Boolean(subscription)} />
      </div>

      {step === 1 && (
        <Card className="p-6">
          <form onSubmit={handleCreateEnterprise} id="sell__form" className="sell__form space-y-4">
            <LogoField nombre={companyName} archivo={logo} onArchivo={setLogo} />
            <Input label="Nombre de la empresa / mercado" required maxLength={LARGO.empresa} value={companyName} onChange={(e) => setCompanyName(texto(e.target.value, LARGO.empresa))} placeholder="Mercado La Esquina" />
            <div id="sell__address-row" className="sell__address-row grid grid-cols-2 gap-3">
              {/* La provincia primero: de ella depende qué municipios hay. Al
                  cambiarla se limpia el municipio, que si no quedaría uno de
                  otra provincia. */}
              <Select
                label="Provincia"
                required
                autoComplete="address-level1"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setCity('');
                }}
              >
                <option value="">Elige una provincia</option>
                {PROVINCIAS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
              <SelectorBuscable
                id="sell__city"
                label="Municipio"
                required
                opciones={municipiosDe(state)}
                valor={city}
                onCambio={setCity}
                disabled={!state}
                placeholder="Escribe para buscar"
                textoDeshabilitado="Elige primero la provincia"
              />
              <Input label="Calle" required autoComplete="address-line1" maxLength={LARGO.direccion} value={street} onChange={(e) => setStreet(texto(e.target.value, LARGO.direccion))} />
              <Input label="Código postal" required inputMode="numeric" autoComplete="postal-code" value={zipCode} onChange={(e) => setZipCode(soloDigitos(e.target.value))} />
            </div>
            <Input label="País" required autoComplete="country-name" maxLength={LARGO.pais} value={country} onChange={(e) => setCountry(texto(e.target.value, LARGO.pais))} />
            <div id="sell__contact-row" className="sell__contact-row grid grid-cols-2 gap-3">
              <Input label="Email de contacto" type="email" required autoComplete="email" maxLength={LARGO.correo} value={email} onChange={(e) => setEmail(e.target.value.trimStart())} />
              <PhoneField pais={pais} onPais={setPais} numero={phone} onNumero={setPhone} required />
            </div>
            <Input label="Sitio web (opcional)" type="url" inputMode="url" placeholder="mitienda.cu" maxLength={LARGO.web} value={website} onChange={(e) => setWebsite(e.target.value.trim())} />
            <Button type="submit" className="w-full" size="lg" loading={submitting}>
              Continuar
            </Button>
          </form>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6">
          <h2 id="sell__plan-title" className="sell__plan-title mb-1 font-medium text-ink-900">Elige tu plan de vendedor</h2>
          <p id="sell__plan-subtitle" className="sell__plan-subtitle mb-5 text-sm text-ink-500">Puedes cambiar de ciclo más adelante desde tu cuenta.</p>
          {/* El plan se paga por WhatsApp y lo activa el panel administrativo. */}
          <PlanPicker plan={SELLER_PLAN} enlace={(tier) => enlaceParaSolicitar(SELLER_PLAN, tier, user?.username)} />
          <p id="sell__plan-note" className="sell__plan-note mt-3 text-center text-xs text-ink-500">Te escribimos para confirmar el pago y activamos tu cuenta de negocio.</p>
        </Card>
      )}
    </div>
  );
}

function StepIndicator({ number, label, active, done }: { number: number; label: string; active: boolean; done: boolean }) {
  return (
    <div id={`sell__step--${number}`} className="sell__step flex items-center gap-2">
      <span
        id={`sell__step-number--${number}`}
        className={cn(
          'sell__step-number flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
          done ? 'bg-ink-900 text-ink-50' : active ? 'border-2 border-ink-900 text-ink-900' : 'border border-ink-300 text-ink-400',
        )}
      >
        {done ? <Check size={13} /> : number}
      </span>
      <span id={`sell__step-label--${number}`} className={cn('sell__step-label', 'text-sm font-medium', active || done ? 'text-ink-900' : 'text-ink-400')}>{label}</span>
    </div>
  );
}

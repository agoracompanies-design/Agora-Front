import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { cambiosDeEmpresa, updateEnterprise } from '@/api/userEnterprise';
import { LogoField } from '@/components/business/LogoField';
import { Input, Select } from '@/components/ui/Field';
import { PROVINCIAS } from '@/lib/provincias';
import { municipiosDe } from '@/lib/municipios';
import { SelectorBuscable } from '@/components/ui/SelectorBuscable';
import { LARGO, normalizarWeb, pareceCorreo, pareceWeb, soloDigitos, texto } from '@/lib/validacion';
import { PhoneField, telefonoListo } from '@/components/ui/PhoneField';
import { PAIS_POR_DEFECTO, numeroNacional, paisDelNumero, telefonoCompleto } from '@/lib/paises';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MoveRequest } from '@/components/dashboard/MoveRequest';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function DashboardEnterprise() {
  const { enterprise, refreshSellerStatus } = useAuth();
  const { notify } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [pais, setPais] = useState(PAIS_POR_DEFECTO);
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [logo, setLogo] = useState<File | null>(null);

  useEffect(() => {
    if (!enterprise) return;
    setCompanyName(enterprise.companyName);
    setStreet(enterprise.address?.street ?? '');
    setCity(enterprise.address?.city ?? '');
    setState(enterprise.address?.state ?? '');
    setZipCode(enterprise.address?.zipCode ?? '');
    setCountry(enterprise.address?.country ?? '');
    setEmail(enterprise.contact?.email ?? '');
    // El teléfono se guarda entero (+53…); aquí se reparte entre el selector de
    // país y el número, que es como se edita.
    const guardado = enterprise.contact?.phone ?? '';
    setPais(paisDelNumero(guardado)?.iso ?? PAIS_POR_DEFECTO);
    setPhone(numeroNacional(guardado));
    setWebsite(enterprise.contact?.website ?? '');
  }, [enterprise]);

  if (!enterprise) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!enterprise) return;
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
      // Solo lo editado: lo que nadie tocó no viaja, y así no se pisa.
      const cambios = cambiosDeEmpresa(enterprise, {
        companyName,
        address: { street, city, state, zipCode, country },
        contact: { email: email.trim(), phone: telefonoCompleto(pais, phone), website: normalizarWeb(website) || undefined },
        ...(logo ? { logo } : {}),
      });

      if (Object.keys(cambios).length === 0) {
        notify('No hay nada que guardar');
        return;
      }

      await updateEnterprise(enterprise.idUserEnterprise, cambios);
      await refreshSellerStatus();
      notify('Empresa actualizada');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo actualizar la empresa', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
    <Card className="p-6">
      <h2 id="dash-enterprise__title" className="dash-enterprise__title mb-5 font-semibold text-ink-900">Información de la empresa</h2>
      <form onSubmit={handleSubmit} id="dash-enterprise__form" className="dash-enterprise__form space-y-4">
        <LogoField nombre={companyName} actual={enterprise?.image} archivo={logo} onArchivo={setLogo} />
        <Input label="Nombre de la empresa / mercado" required maxLength={LARGO.empresa} value={companyName} onChange={(e) => setCompanyName(texto(e.target.value, LARGO.empresa))} />
        <div id="dash-enterprise__address-row" className="dash-enterprise__address-row grid grid-cols-2 gap-3">
          {/* La provincia primero: de ella depende qué municipios hay. */}
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
            id="dash-enterprise__city"
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
        <div id="dash-enterprise__contact-row" className="dash-enterprise__contact-row grid grid-cols-2 gap-3">
          <Input label="Email de contacto" type="email" required autoComplete="email" maxLength={LARGO.correo} value={email} onChange={(e) => setEmail(e.target.value.trimStart())} />
          <PhoneField pais={pais} onPais={setPais} numero={phone} onNumero={setPhone} required />
        </div>
        <Input label="Sitio web (opcional)" type="url" inputMode="url" placeholder="mitienda.cu" maxLength={LARGO.web} value={website} onChange={(e) => setWebsite(e.target.value.trim())} />
        <Button type="submit" loading={submitting}>Guardar cambios</Button>
      </form>
    </Card>

    {/* Fuera del formulario a propósito: no se guarda con lo demás, se pide. */}
    {enterprise && <MoveRequest enterprise={enterprise} />}
    </div>
  );
}

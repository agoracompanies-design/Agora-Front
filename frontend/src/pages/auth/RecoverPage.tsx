import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, HelpCircle, Mail, Smartphone } from 'lucide-react';
import { AuthLayout, AuthLink } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Field';
import { PasswordField } from '@/components/ui/PasswordField';
import { PhoneField, telefonoListo } from '@/components/ui/PhoneField';
import { PAIS_POR_DEFECTO, telefonoCompleto } from '@/lib/paises';
import { Button } from '@/components/ui/Button';
import {
  INTENTOS_DEL_CODIGO,
  MINUTOS_DEL_CODIGO,
  RECUPERACION_LISTA,
  cambiarPassword,
  pedirCodigo,
  recordarUsuario,
  verificarCodigo,
} from '@/api/recuperacion';
import type { Via } from '@/api/recuperacion';
import { pareceCorreo, soloUsuario } from '@/lib/validacion';
import { cn } from '@/lib/utils';

type Paso = 'datos' | 'codigo' | 'password' | 'listo';

/**
 * Recuperar el acceso sin depender de que alguien conteste.
 *
 * Tres pasos, los de siempre: se dice quién eres y por dónde avisarte, llega un
 * código de seis dígitos, y con él se pone la contraseña nueva.
 *
 * Dos decisiones que no se ven pero mandan:
 *
 * - **Se pasa al paso del código exista la cuenta o no.** Si esta pantalla
 *   dijera «ese usuario no existe», sería una forma cómoda de averiguar qué
 *   cuentas hay registradas. Quien se equivocó de datos no recibe nada y se
 *   entera ahí, que es lo mismo que le pasaría con un correo que no llega.
 * - **El contacto se escribe igual que en el registro**, con el mismo selector
 *   de país: así el número que se teclea aquí tiene la forma del que está
 *   guardado, y no falla por un espacio o un prefijo.
 */
export function RecoverPage() {
  const navigate = useNavigate();

  const [paso, setPaso] = useState<Paso>('datos');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [username, setUsername] = useState('');
  const [via, setVia] = useState<Via>('phone');
  const [correo, setCorreo] = useState('');
  const [pais, setPais] = useState(PAIS_POR_DEFECTO);
  const [telefono, setTelefono] = useState('');

  const [codigo, setCodigo] = useState('');
  const [fallos, setFallos] = useState(0);
  const [ticket, setTicket] = useState('');
  const [password, setPassword] = useState('');

  const contacto = via === 'email' ? correo.trim() : telefonoCompleto(pais, telefono);
  const contactoListo = via === 'email' ? pareceCorreo(correo) : telefonoListo(pais, telefono);

  /** Sin servidor detrás no se finge que algo se mandó. */
  function sinServidor(): boolean {
    if (RECUPERACION_LISTA) return false;
    setError(
      'Esta pantalla todavía no está conectada: el servidor aún no sabe mandar el código. Mientras tanto, escribe por WhatsApp desde el acceso.',
    );
    return true;
  }

  async function enviarDatos(e: FormEvent) {
    e.preventDefault();
    setError('');
    setAviso('');
    if (!username.trim()) {
      setError('Escribe tu nombre de usuario.');
      return;
    }
    if (!contactoListo) {
      setError(
        via === 'email'
          ? 'Revisa el correo: falta el @ o el dominio.'
          : 'El teléfono necesita al menos seis cifras.',
      );
      return;
    }
    if (sinServidor()) return;

    setEnviando(true);
    try {
      await pedirCodigo({ username: username.trim(), via, contacto });
    } catch {
      // Da igual lo que respondiera: no se cuenta nada que permita saber si la
      // cuenta existe. Se sigue al paso del código de todas formas.
    } finally {
      setEnviando(false);
      setFallos(0);
      setCodigo('');
      setPaso('codigo');
    }
  }

  async function enviarCodigo(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (codigo.length !== 6) {
      setError('El código tiene seis dígitos.');
      return;
    }
    if (sinServidor()) return;

    setEnviando(true);
    try {
      const { ticket: t } = await verificarCodigo({ username: username.trim(), codigo });
      setTicket(t);
      setPaso('password');
    } catch {
      const quedan = INTENTOS_DEL_CODIGO - (fallos + 1);
      setFallos((f) => f + 1);
      setError(
        quedan > 0
          ? `Ese código no es. Te ${quedan === 1 ? 'queda 1 intento' : `quedan ${quedan} intentos`}.`
          : 'Se acabaron los intentos. Pide un código nuevo.',
      );
      if (quedan <= 0) setPaso('datos');
    } finally {
      setEnviando(false);
    }
  }

  async function enviarPassword(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('La contraseña necesita al menos ocho caracteres.');
      return;
    }
    if (sinServidor()) return;

    setEnviando(true);
    try {
      await cambiarPassword({ ticket, password });
      setPaso('listo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setEnviando(false);
    }
  }

  async function pedirMiUsuario() {
    setError('');
    setAviso('');
    if (!contactoListo) {
      setError('Escribe primero el correo o el teléfono con el que te registraste.');
      return;
    }
    if (sinServidor()) return;
    try {
      await recordarUsuario({ via, contacto });
    } catch {
      // Igual que arriba: no se dice si existe.
    }
    setAviso('Si esa cuenta existe, te mandamos el nombre de usuario por esa vía.');
  }

  const titulos: Record<Paso, { title: string; subtitle: string }> = {
    datos: { title: 'Recuperar el acceso', subtitle: 'Dinos quién eres y por dónde avisarte' },
    codigo: {
      title: 'Revisa tu ' + (via === 'email' ? 'correo' : 'teléfono'),
      subtitle: `Escribe el código de seis dígitos. Vale ${MINUTOS_DEL_CODIGO} minutos.`,
    },
    password: { title: 'Tu contraseña nueva', subtitle: 'Elige una que no uses en otro sitio' },
    listo: { title: 'Listo', subtitle: 'Ya puedes entrar con tu contraseña nueva' },
  };

  const opcionVia = (valor: Via, icono: ReactNode, texto: string) => (
    <button
      type="button"
      onClick={() => {
        setVia(valor);
        setError('');
      }}
      className={cn(
        'recover__via-option flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
        via === valor
          ? 'border-primary bg-primary-light/40 text-primary'
          : 'border-ink-200 text-ink-600 hover:border-ink-400',
      )}
      aria-pressed={via === valor}
    >
      {icono}
      {texto}
    </button>
  );

  return (
    <AuthLayout
      title={titulos[paso].title}
      subtitle={titulos[paso].subtitle}
      footer={
        <AuthLink to="/iniciar-sesion">
          <span className="inline-flex items-center gap-1.5">
            <ArrowLeft size={14} aria-hidden="true" /> Volver al acceso
          </span>
        </AuthLink>
      }
    >
      <title>Recuperar el acceso · Agora</title>

      {!RECUPERACION_LISTA && (
        <p
          id="recover__pending"
          role="status"
          className="recover__pending mb-4 rounded-xl border border-amber-600/40 bg-amber-600/10 px-3 py-2.5 text-sm text-ink-900"
        >
          <strong>Todavía no está conectada.</strong> El servidor aún no manda el código —está
          pedido—. Esta pantalla ya está hecha para cuando lo haga.
        </p>
      )}

      {error && (
        <p id="recover__error" role="alert" className="recover__error mb-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {aviso && (
        <p id="recover__notice" role="status" className="recover__notice mb-3 text-sm text-ink-600">
          {aviso}
        </p>
      )}

      {paso === 'datos' && (
        <form onSubmit={enviarDatos} id="recover" className="recover space-y-4">
          <Input
            label="Usuario"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(soloUsuario(e.target.value))}
            placeholder="tu_usuario"
          />

          {/* Quien no se acuerda del usuario sale de aquí sin tener que
              adivinarlo: se le manda a la misma vía que escriba abajo. */}
          <button
            type="button"
            onClick={pedirMiUsuario}
            id="recover__forgot-user"
            className="recover__forgot-user -mt-1 inline-flex items-center gap-1.5 rounded-lg py-1 text-sm text-primary hover:underline"
          >
            <HelpCircle size={14} aria-hidden="true" />
            No recuerdo mi nombre de usuario
          </button>

          <fieldset className="recover__via">
            <legend className="recover__via-label mb-1.5 text-sm font-medium text-ink-800">
              ¿Por dónde te avisamos?
            </legend>
            <div className="recover__via-options flex gap-2">
              {opcionVia('phone', <Smartphone size={15} aria-hidden="true" />, 'Teléfono')}
              {opcionVia('email', <Mail size={15} aria-hidden="true" />, 'Correo')}
            </div>
          </fieldset>

          {via === 'email' ? (
            <Input
              label="Correo con el que te registraste"
              type="email"
              required
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value.trimStart())}
            />
          ) : (
            <PhoneField pais={pais} onPais={setPais} numero={telefono} onNumero={setTelefono} required />
          )}

          <Button type="submit" className="w-full" size="lg" loading={enviando}>
            Mandarme el código
          </Button>
        </form>
      )}

      {paso === 'codigo' && (
        <form onSubmit={enviarCodigo} id="recover-code" className="recover-code space-y-4">
          <p className="recover-code__sent text-sm text-ink-500">
            Si esa cuenta existe, el código va camino de{' '}
            <span className="font-medium text-ink-800">{contacto}</span>.
          </p>

          <Input
            label="Código"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
          />

          <Button type="submit" className="w-full" size="lg" loading={enviando}>
            Continuar
          </Button>

          <button
            type="button"
            onClick={() => {
              setPaso('datos');
              setError('');
            }}
            className="recover-code__back mx-auto block rounded-lg py-1 text-sm text-ink-500 hover:text-ink-900"
          >
            Me equivoqué de datos
          </button>
        </form>
      )}

      {paso === 'password' && (
        <form onSubmit={enviarPassword} id="recover-password" className="recover-password space-y-4">
          <PasswordField
            label="Contraseña nueva"
            required
            minLength={8}
            maxLength={72}
            hint="Entre 8 y 72 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" size="lg" loading={enviando}>
            Guardar y entrar
          </Button>
        </form>
      )}

      {paso === 'listo' && (
        <div id="recover-done" className="recover-done space-y-4">
          <p className="recover-done__text flex items-start gap-2 text-sm text-ink-700">
            <Check size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            Tu contraseña quedó cambiada. Si no fuiste tú quien la pidió, escríbenos.
          </p>
          <Button className="w-full" size="lg" onClick={() => navigate('/iniciar-sesion')}>
            Iniciar sesión
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}

import { useEffect, useRef, useState } from 'react';
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
  CODIGOS_POR_VENTANA,
  INTENTOS_DEL_CODIGO,
  MINUTOS_DEL_CODIGO,
  MINUTOS_DE_LA_VENTANA,
  SEGUNDOS_ENTRE_CODIGOS,
  VIAS_DISPONIBLES,
  cambiarPassword,
  esServidorSinRecuperacion,
  pedirCodigo,
  recordarUsuario,
  verificarCodigo,
} from '@/api/recuperacion';
import type { Via } from '@/api/recuperacion';
import { pareceCorreo, soloUsuario } from '@/lib/validacion';
import { cn } from '@/lib/utils';

type Paso = 'datos' | 'codigo' | 'password' | 'listo';

/** Lo que se le dice a quien usa un servidor que todavía no tiene estas rutas. */
const SIN_RECUPERACION =
  'Este servidor todavía no sabe mandar el código. Está pedido; inténtalo en unos días.';

/**
 * Recuperar el acceso sin depender de que alguien conteste.
 *
 * Tres pasos, los de siempre: se dice quién eres y por dónde avisarte, llega un
 * código de seis dígitos, y con él se pone la contraseña nueva.
 *
 * Tres decisiones que no se ven pero mandan:
 *
 * - **Se pasa al paso del código exista la cuenta o no.** Si esta pantalla
 *   dijera «ese usuario no existe», sería una forma cómoda de averiguar qué
 *   cuentas hay registradas. Quien se equivocó de datos no recibe nada y se
 *   entera ahí, que es lo mismo que le pasaría con un correo que no llega.
 * - **Los intentos se cuentan aquí, no en el servidor.** La respuesta de fallo
 *   es siempre la misma frase a propósito: decir cuántos quedan la convertiría
 *   en un medidor para quien prueba códigos desde fuera. Lo que se pinta es una
 *   ayuda para quien se equivocó tecleando, no un dato del servidor.
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
  const [via, setVia] = useState<Via>(VIAS_DISPONIBLES[0]);
  const [correo, setCorreo] = useState('');
  const [pais, setPais] = useState(PAIS_POR_DEFECTO);
  const [telefono, setTelefono] = useState('');

  const [codigo, setCodigo] = useState('');
  const [fallos, setFallos] = useState(0);
  const [ticket, setTicket] = useState('');
  const [password, setPassword] = useState('');

  // El servidor admite 3 códigos por cada 15 minutos y, pasado ese tope,
  // responde 200 sin mandar nada. Así que la cuenta se lleva aquí: sin esto,
  // pedir el cuarto parecería funcionar y no llegaría ningún mensaje.
  const [pedidos, setPedidos] = useState(0);
  const [esperaParaReenviar, setEsperaParaReenviar] = useState(0);
  const reloj = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (esperaParaReenviar <= 0) return;
    reloj.current = window.setTimeout(
      () => setEsperaParaReenviar((s) => s - 1),
      1000,
    );
    return () => window.clearTimeout(reloj.current);
  }, [esperaParaReenviar]);

  const hayQueElegirVia = VIAS_DISPONIBLES.length > 1;
  const sinMasCodigos = pedidos >= CODIGOS_POR_VENTANA;

  // La ventana del servidor caduca, así que el contador también. Se cuenta
  // desde el último código y no desde el primero, que es de donde cuenta el
  // servidor: así se espera de más y nunca se promete un código que no saldría.
  useEffect(() => {
    if (!sinMasCodigos) return;
    const id = window.setTimeout(
      () => setPedidos(0),
      MINUTOS_DE_LA_VENTANA * 60_000,
    );
    return () => window.clearTimeout(id);
  }, [sinMasCodigos]);
  const contacto = via === 'email' ? correo.trim() : telefonoCompleto(pais, telefono);
  const contactoListo = via === 'email' ? pareceCorreo(correo) : telefonoListo(pais, telefono);

  /**
   * Pide el código y dice si se puede seguir.
   *
   * Un 404 es lo único que se cuenta: significa que estas rutas no existen en el
   * servidor que hay delante. Cualquier otro error se calla y se sigue al paso
   * siguiente, porque distinguirlos diría si la cuenta existe.
   */
  async function mandarCodigo(): Promise<boolean> {
    try {
      await pedirCodigo({ username: username.trim(), via, contacto });
      return true;
    } catch (err) {
      if (esServidorSinRecuperacion(err)) {
        setError(SIN_RECUPERACION);
        return false;
      }
      return true;
    }
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

    setEnviando(true);
    const sigue = await mandarCodigo();
    setEnviando(false);
    if (!sigue) return;

    setFallos(0);
    setCodigo('');
    // Se suma, no se pone a 1: volver atrás con «me equivoqué de datos» y
    // enviar otra vez es un código más para el servidor, aunque aquí parezca
    // que se empieza de nuevo.
    setPedidos((n) => n + 1);
    setEsperaParaReenviar(SEGUNDOS_ENTRE_CODIGOS);
    setPaso('codigo');
  }

  async function reenviarCodigo() {
    setError('');
    setAviso('');
    setEnviando(true);
    const sigue = await mandarCodigo();
    setEnviando(false);
    if (!sigue) return;

    setFallos(0);
    setCodigo('');
    setPedidos((n) => n + 1);
    setEsperaParaReenviar(SEGUNDOS_ENTRE_CODIGOS);
    setAviso('Te mandamos otro código.');
  }

  async function enviarCodigo(e: FormEvent) {
    e.preventDefault();
    setError('');
    setAviso('');
    if (codigo.length !== 6) {
      setError('El código tiene seis dígitos.');
      return;
    }

    setEnviando(true);
    try {
      const { ticket: t } = await verificarCodigo({
        username: username.trim(),
        codigo,
      });
      setTicket(t);
      setPaso('password');
    } catch (err) {
      if (esServidorSinRecuperacion(err)) {
        setError(SIN_RECUPERACION);
        return;
      }
      const quedan = INTENTOS_DEL_CODIGO - (fallos + 1);
      setFallos((f) => f + 1);
      setError(
        quedan > 0
          ? `Ese código no es. Te ${quedan === 1 ? 'queda 1 intento' : `quedan ${quedan} intentos`}.`
          : 'Se acabaron los intentos. Pide un código nuevo.',
      );
      if (quedan <= 0) {
        setCodigo('');
        setPaso('datos');
      }
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

    setEnviando(true);
    try {
      await cambiarPassword({ ticket, password });
      setPaso('listo');
    } catch (err) {
      setError(
        esServidorSinRecuperacion(err)
          ? SIN_RECUPERACION
          : 'Se acabó el tiempo para cambiarla. Pide un código nuevo.',
      );
      // El permiso dura cinco minutos: si caducó no hay nada que reintentar
      // desde aquí, así que se vuelve al principio en vez de dejar en pantalla
      // un formulario que ya no puede funcionar.
      setPassword('');
      setPaso('datos');
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
    try {
      await recordarUsuario({ via, contacto });
    } catch (err) {
      if (esServidorSinRecuperacion(err)) {
        setError(SIN_RECUPERACION);
        return;
      }
      // Igual que arriba: no se dice si existe.
    }
    setAviso('Si esa cuenta existe, te mandamos el nombre de usuario por esa vía.');
  }

  const titulos: Record<Paso, { title: string; subtitle: string }> = {
    datos: {
      title: 'Recuperar el acceso',
      subtitle: hayQueElegirVia
        ? 'Dinos quién eres y por dónde avisarte'
        : 'Dinos quién eres y a qué correo avisarte',
    },
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
      conIntro={false}
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

          {/* El selector solo aparece si de verdad hay algo que elegir: con una
              sola vía sería una pregunta con una respuesta. */}
          {hayQueElegirVia && (
            <fieldset className="recover__via">
              <legend className="recover__via-label mb-1.5 text-sm font-medium text-ink-800">
                ¿Por dónde te avisamos?
              </legend>
              <div className="recover__via-options flex gap-2">
                {VIAS_DISPONIBLES.includes('phone') &&
                  opcionVia('phone', <Smartphone size={15} aria-hidden="true" />, 'Teléfono')}
                {VIAS_DISPONIBLES.includes('email') &&
                  opcionVia('email', <Mail size={15} aria-hidden="true" />, 'Correo')}
              </div>
            </fieldset>
          )}

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
            onClick={reenviarCodigo}
            disabled={esperaParaReenviar > 0 || enviando || sinMasCodigos}
            id="recover-code__resend"
            className="recover-code__resend mx-auto block rounded-lg py-1 text-center text-sm text-primary hover:underline disabled:text-ink-400 disabled:no-underline"
          >
            {sinMasCodigos
              ? `Ya pediste ${CODIGOS_POR_VENTANA} códigos. Espera ${MINUTOS_DE_LA_VENTANA} minutos para pedir otro.`
              : esperaParaReenviar > 0
                ? `Puedes pedir otro código en ${esperaParaReenviar} s`
                : 'No me llegó, mándame otro'}
          </button>

          <button
            type="button"
            onClick={() => {
              setPaso('datos');
              setError('');
              setAviso('');
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
            Tu contraseña quedó cambiada y se cerraron las sesiones que hubiera abiertas. Si no
            fuiste tú quien la pidió, escríbenos.
          </p>
          <Button className="w-full" size="lg" onClick={() => navigate('/iniciar-sesion')}>
            Iniciar sesión
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}

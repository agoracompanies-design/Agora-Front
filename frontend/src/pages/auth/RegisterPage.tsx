import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout, AuthLink } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Field';
import { PasswordField } from '@/components/ui/PasswordField';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { CONTACTO_EN_REGISTRO_LISTO } from '@/api/auth';
import { PhoneField, telefonoListo } from '@/components/ui/PhoneField';
import { PAIS_POR_DEFECTO, telefonoCompleto } from '@/lib/paises';
import { pareceCorreo, soloUsuario } from '@/lib/validacion';
import { guardarReferidoDeLaUrl, olvidarReferido, referidoGuardado } from '@/lib/referido';

/**
 * Crear cuenta: usuario y contraseña, nada más.
 *
 * Antes preguntaba aquí si venías a comprar o a vender, y era una pregunta
 * falsa: el servidor crea la misma cuenta en los dos casos y lo único que
 * cambiaba era a qué pantalla se iba después. Quien elegía «vender» tampoco
 * podía publicar: para eso hay que dar de alta la empresa, con su formulario
 * entero, que es el flujo que ya existe dentro de la app.
 *
 * Así que la pregunta se quita. Se entra, y quien quiera vender crea su
 * empresa desde dentro cuando le toque.
 */
/**
 * El código con el que se abre la pantalla.
 *
 * Se mira **la URL primero** y la sesión después: el efecto que guarda el
 * `?ref=` corre tras el primer render, así que preguntarle solo a
 * `sessionStorage` dejaría el campo vacío justo cuando alguien acaba de
 * escanear el QR, que es el caso que importa.
 */
function referidoInicial(): string {
  try {
    const deLaUrl = new URLSearchParams(window.location.search).get('ref')?.trim();
    if (deLaUrl) return deLaUrl;
  } catch {
    // Una dirección rara no debe impedir abrir el registro.
  }
  return referidoGuardado() ?? '';
}

export function RegisterPage() {
  // El código de quien trajo a esta persona llega en la URL y se guarda al
  // entrar: entre esto y terminar el formulario puede ir a ver los planes y
  // volver, y para entonces la dirección ya no lo lleva.
  useEffect(() => {
    guardarReferidoDeLaUrl(window.location.search);
  }, []);

  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  // Con qué localizar a quien abre la cuenta. Por defecto el teléfono, que es
  // lo que casi todo el mundo tiene aquí y por donde se habla luego; quien
  // prefiera el correo lo marca y cambia el campo. Solo se pide cuando el
  // servidor sabe guardarlo; pedirlo para tirarlo daría la impresión de que la
  // cuenta quedó verificada sin estarlo.
  const [usarCorreo, setUsarCorreo] = useState(false);
  const [pais, setPais] = useState(PAIS_POR_DEFECTO);
  const [numero, setNumero] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /*
   * El código de quien trae al cliente.
   *
   * Nace relleno y con la casilla marcada si se llegó por un QR —que abre
   * `/registrarse?ref=…`—, y vacío y plegado si no. Así el caso normal no ve
   * un campo que no le toca, y quien viene con código lo encuentra puesto sin
   * tener que teclear nada.
   */
  const [referido, setReferido] = useState(referidoInicial);
  const [conReferido, setConReferido] = useState(() => Boolean(referidoInicial()));

  /** Lo que se manda: el correo tal cual, o el teléfono en formato internacional. */
  const contacto = usarCorreo ? correo.trim() : telefonoCompleto(pais, numero);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (CONTACTO_EN_REGISTRO_LISTO) {
      if (usarCorreo && !pareceCorreo(correo)) {
        setError('Revisa el correo: le falta el @ o el dominio');
        return;
      }
      if (!usarCorreo && !telefonoListo(pais, numero)) {
        setError('Revisa el teléfono: faltan cifras');
        return;
      }
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      // Lo que haya en el campo, que es lo que la persona ve. Si llegó por un
      // QR viene ya puesto; si lo tecleó ella, igual de válido.
      await register(
        username,
        password,
        contacto,
        conReferido ? referido.trim() || undefined : undefined,
      );
      // La prueba gratuita la crea el servidor al registrar la cuenta (desde el
      // commit `641de2e`); al entrar, el contexto ya la carga con el resto.
      // Ya cumplió: no tiene por qué seguir ahí para el siguiente registro.
      olvidarReferido();
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Con un usuario y una contraseña ya estás dentro"
      footer={
        <>
          ¿Ya tienes una cuenta? <AuthLink to="/iniciar-sesion">Inicia sesión</AuthLink>
        </>
      }
    >
      {/* React 19 sube estas etiquetas al <head>: cada ruta con su título. */}
      <title>Crear cuenta · Ágora</title>
      <meta name="description" content="Crea tu cuenta en Ágora para buscar productos de las mypimes y mercados de tu ciudad, o para publicar tu catálogo." />

      <form onSubmit={handleSubmit} id="register" className="register space-y-4">
        <Input
          label="Usuario"
          required
          minLength={3}
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(soloUsuario(e.target.value))}
          placeholder="tu_usuario"
        />
        {CONTACTO_EN_REGISTRO_LISTO && (
          <div id="register__contact" className="register__contact">
            {usarCorreo ? (
              <Input
                label="Correo"
                required
                type="email"
                autoComplete="email"
                hint="Lo usaremos para verificar su cuenta y recuperarla si olvida la contraseña."
                value={correo}
                onChange={(e) => setCorreo(e.target.value.trim())}
                placeholder="tu@correo.cu"
              />
            ) : (
              <PhoneField
                id="register__phone"
                pais={pais}
                onPais={setPais}
                numero={numero}
                onNumero={setNumero}
                required
                hint="Lo usaremos para verificar su cuenta y recuperarla si olvida la contraseña."
              />
            )}

            <label id="register__use-email" className="register__use-email mt-2 flex w-max cursor-pointer items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={usarCorreo}
                onChange={(e) => setUsarCorreo(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
              Registrarme con correo electrónico
            </label>
          </div>
        )}
        {/* Los dos topes son los del servidor. El de abajo no es evidente:
            bcrypt ignora lo que pase de 72 bytes, así que sin él dos
            contraseñas distintas podrían valer lo mismo. */}
        <PasswordField
          label="Contraseña"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          hint="Entre 8 y 72 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <PasswordField
          label="Confirmar contraseña"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
        />
        {/* El código de quien trae al cliente, plegado salvo que haga falta.
            Casi nadie lo tiene, y un campo más en un registro es una pregunta
            más que responder; quien llega por el QR lo encuentra ya puesto. */}
        <div id="register__referral" className="register__referral">
          <label className="register__referral-check flex cursor-pointer items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={conReferido}
              onChange={(e) => setConReferido(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Me trajo alguien de Ágora
          </label>

          {/* El margen va en el envoltorio y no en el `className` del campo:
              ahí se lo lleva el `input` y el rótulo se queda pegado a la
              casilla. */}
          {conReferido && (
            <div className="mt-3">
              <Input
                label="Código de quien te trajo"
                hint="Te lo da esa persona, o viene puesto si entraste por su código QR."
                value={referido}
                onChange={(e) => setReferido(e.target.value.trim())}
                placeholder="Pega aquí el código"
                autoComplete="off"
                spellCheck={false}
                className="register__referral-input"
              />
            </div>
          )}
        </div>

        {/* role="alert" para que un lector de pantalla lo anuncie al aparecer. */}
        {error && (
          <p id="register__error" className="register__error text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Crear cuenta
        </Button>
        <p id="register__seller-note" className="register__seller-note text-center text-xs text-ink-500">
          ¿Vas a vender? Crea tu cuenta y registra tu negocio
        </p>
      </form>
    </AuthLayout>
  );
}

import { useState } from 'react';
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
export function RegisterPage() {
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
      await register(username, password, contacto);
      // La prueba gratuita la crea el servidor al registrar la cuenta (desde el
      // commit `641de2e`); al entrar, el contexto ya la carga con el resto.
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
      <title>Crear cuenta · Agora</title>
      <meta name="description" content="Crea tu cuenta en Agora para buscar productos de las mypimes y mercados de tu ciudad, o para publicar tu catálogo." />

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
                hint="Lo usaremos para verificar su cuenta y recuperarla si olvidas la contraseña."
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
                hint="Lo usaremos para verificar su cuenta y recuperarla si olvidas la contraseña."
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

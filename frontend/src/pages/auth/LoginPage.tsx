import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout, AuthLink } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Field';
import { PasswordField } from '@/components/ui/PasswordField';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { soloUsuario } from '@/lib/validacion';
import { ApiError } from '@/api/client';
import { baneoDeError } from '@/lib/baneo';
import type { InfoBaneo } from '@/lib/baneo';
import { BannedScreen } from '@/components/layout/BannedGate';
import { enlaceParaRecuperarAcceso } from '@/lib/contacto';
import { MessageCircle } from 'lucide-react';

/**
 * El servidor responde distinto según el caso: «Usuario no encontrado» (404)
 * cuando el nombre no existe y «Credenciales inválidas» (400) cuando falla la
 * contraseña. Repetirlo aquí serviría para ir probando nombres hasta dar con
 * los que están registrados, así que los dos se cuentan igual.
 */
function mensajeDeAcceso(err: unknown): string {
  if (err instanceof ApiError && [400, 401, 404].includes(err.status)) {
    return 'Usuario o contraseña incorrectos';
  }
  return err instanceof Error ? err.message : 'No se pudo iniciar sesión';
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [baneo, setBaneo] = useState<InfoBaneo | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      // Una cuenta bloqueada no entra: el servidor lo dice en el propio acceso,
      // con el motivo y el WhatsApp del grupo que la atendió. Eso no es un
      // «usuario o contraseña incorrectos», así que no se cuenta como tal.
      const bloqueada = baneoDeError(err);
      if (bloqueada) setBaneo(bloqueada);
      else setError(mensajeDeAcceso(err));
    } finally {
      setLoading(false);
    }
  }

  if (baneo) return <BannedScreen usuario={username} info={baneo} />;

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Inicia sesión para continuar en Agora"
      // Abajo del todo, recuperar la contraseña: es la salida de emergencia,
      // no el camino que se espera que siga nadie. El de registrarse va pegado
      // al botón, que es la acción alternativa de verdad.
      footer={
        <a
          href={enlaceParaRecuperarAcceso(username)}
          target="_blank"
          rel="noreferrer"
          id="login__recover"
          className="login__recover mx-auto mt-4 flex w-fit items-center gap-1.5 rounded-lg py-1.5 text-base text-ink-500 transition-colors hover:text-ink-900"
        >
          <MessageCircle size={14} aria-hidden="true" />
          ¿Olvidaste tu contraseña?
        </a>
      }
    >
      {/* React 19 sube estas etiquetas al <head>: cada ruta con su título. */}
      <title>Iniciar sesión · Agora</title>
      <meta name="description" content="Entra en Agora para buscar y comparar lo que venden las mypimes y mercados de tu ciudad." />

      <form onSubmit={handleSubmit} id="login" className="login space-y-4">
        <Input
          label="Usuario"
          required
          autoFocus
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(soloUsuario(e.target.value))}
          placeholder="tu_usuario"
        />
        <PasswordField
          label="Contraseña"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        {/* role="alert" para que un lector de pantalla lo anuncie al aparecer. */}
        {error && (
          <p id="login__error" className="login__error text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Iniciar sesión
        </Button>

        <p id="login__register" className="login__register text-base text-ink-500">
          ¿No tienes cuenta? <AuthLink to="/registrarse">Regístrate</AuthLink>
        </p>
      </form>
    </AuthLayout>
  );
}

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout, AuthLink } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Field';
import { PasswordField } from '@/components/ui/PasswordField';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { soloUsuario } from '@/lib/validacion';
import { createSubscription } from '@/api/subscription';
import { TRIAL_PLAN, tipoDePlan } from '@/lib/plans';

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
  const { register, login, refreshSellerStatus } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await register(username, password);
      const nuevoUsuario = await login(username, password);
      // La prueba se concede al crear la cuenta: sin ella la app queda cerrada
      // detrás de las opciones de compra y nadie llega a ver nada. Vale para
      // todo durante una semana, panel de negocio incluido.
      try {
        const prueba = TRIAL_PLAN.tiers[0];
        await createSubscription({
          userId: nuevoUsuario.id,
          name: TRIAL_PLAN.name,
          cost: prueba.cost,
          description: `Prueba de ${prueba.durationDays} días`,
          quantityAccounts: 1,
          durationDays: prueba.durationDays,
          planType: tipoDePlan(TRIAL_PLAN),
        });
        await refreshSellerStatus();
      } catch {
        // Si el alta de la prueba falla, la cuenta ya existe: se sigue a las
        // opciones de compra en vez de dejar el registro a medias.
        navigate('/planes', { replace: true });
        return;
      }
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
          ¿Ya tienes cuenta? <AuthLink to="/iniciar-sesion">Inicia sesión</AuthLink>
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
        <PasswordField
          label="Contraseña"
          required
          minLength={6}
          autoComplete="new-password"
          hint="Mínimo 6 caracteres"
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
          ¿Vas a vender? Crea tu cuenta y da de alta tu negocio desde dentro.
        </p>
      </form>
    </AuthLayout>
  );
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as authApi from '@/api/auth';
import { getMyEnterprise } from '@/api/userEnterprise';
import { estaVigente, getMyActiveSubscription, vigentePorFecha } from '@/api/subscription';
import {
  clearRefreshToken,
  clearToken,
  getToken,
  registrarCierreDeSesion,
  setRefreshToken,
  setToken,
} from '@/api/client';
import type { AuthUser, UserEnterprise } from '@/types';
import type { Subscription } from '@/api/subscription';
import { daAccesoDeNegocio } from '@/lib/plans';
import { ApiError } from '@/api/client';
import { isSeller as computeIsSeller, isModerator as computeIsModerator } from '@/lib/permissions';
import { olvidarUbicacion } from '@/lib/ubicacion';

// Agora no es una landing: sin sesión no se ve ninguna pantalla, solo el acceso.
// Aquí vivía un usuario de vista previa que en `npm run dev` entraba solo y
// dejaba navegarlo todo sin cuenta; se quitó porque contradice esa regla y
// porque tapaba los 401 reales de la API detrás de una sesión que no existía.

interface AuthContextValue {
  user: AuthUser | null;
  enterprise: UserEnterprise | null;
  subscription: Subscription | null;
  /** Hay una suscripción vigente: se puede usar la app. */
  tieneAcceso: boolean;
  /** El plan vigente da negocio y hay empresa creada. */
  puedeAdministrarNegocio: boolean;
  isLoading: boolean;
  isSeller: boolean;
  /** Puede revisar las categorías que piden los negocios. */
  isModerator: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  register: (
    username: string,
    password: string,
    contacto?: string,
    /** Quién lo trajo, si vino por el enlace de alguien del equipo. */
    referralCode?: string,
  ) => Promise<void>;
  /** Cierra la sesión aquí y revoca el refresco en el servidor. */
  logout: () => Promise<void>;
  refreshSellerStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Dónde se deja lo último que dijo el servidor, para los cortes de red. */
const SUSCRIPCION_GUARDADA = 'agora_sub';
const EMPRESA_GUARDADA = 'agora_enterprise';

/**
 * Si la petición se cayó por falta de red y no porque el servidor contestara.
 *
 * El cliente pone `status: 0` cuando no hubo respuesta —ver `client.ts`—, y
 * esa es toda la diferencia entre «no te toca» y «no se ha podido preguntar».
 */
function sinConexion(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

function guardar(clave: string, valor: unknown) {
  try {
    if (valor) localStorage.setItem(clave, JSON.stringify(valor));
    else localStorage.removeItem(clave);
  } catch {
    // Sin sitio o en una ventana privada: se sigue sin copia.
  }
}

function leer<T>(clave: string): T | null {
  try {
    const guardado = localStorage.getItem(clave);
    return guardado ? (JSON.parse(guardado) as T) : null;
  } catch {
    return null;
  }
}

const guardarSuscripcion = (s: Subscription | null) => guardar(SUSCRIPCION_GUARDADA, s);
const guardarEmpresa = (e: UserEnterprise | null) => guardar(EMPRESA_GUARDADA, e);

/** La copia de la suscripción, solo si no ha llegado su fecha. */
function suscripcionGuardada(): Subscription | null {
  const copia = leer<Subscription>(SUSCRIPCION_GUARDADA);
  return vigentePorFecha(copia) ? copia : null;
}

const empresaGuardada = () => leer<UserEnterprise>(EMPRESA_GUARDADA);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [enterprise, setEnterprise] = useState<UserEnterprise | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // La empresa y la suscripción llegan en una segunda vuelta, después de
  // restaurar la sesión. Hasta que estén, los guardias no pueden decidir: sin
  // esto, al recargar cualquier página se expulsaba a quien sí tenía plan.
  const [datosListos, setDatosListos] = useState(false);

  const loadSellerStatus = useCallback(async () => {
    const [enterpriseResult, subscriptionResult] = await Promise.allSettled([
      getMyEnterprise(),
      getMyActiveSubscription(),
    ]);

    if (enterpriseResult.status === 'fulfilled') {
      setEnterprise(enterpriseResult.value);
      guardarEmpresa(enterpriseResult.value);
    } else if (sinConexion(enterpriseResult.reason)) {
      setEnterprise(empresaGuardada());
    } else {
      setEnterprise(null);
      guardarEmpresa(null);
    }

    if (subscriptionResult.status === 'fulfilled') {
      // Una suscripción caducada llega igual, con `status: false`: aquí solo se
      // guarda la que el backend da por vigente.
      const suscripcion = estaVigente(subscriptionResult.value) ? subscriptionResult.value : null;
      setSubscription(suscripcion);
      guardarSuscripcion(suscripcion);
    } else if (sinConexion(subscriptionResult.reason)) {
      /*
       * No se pudo preguntar, que no es lo mismo que no tener plan.
       *
       * Antes las dos cosas acababan en `null`, y el guardia de suscripción
       * leía eso como «se acabó»: al primer corte de red —aquí, a diario— la
       * aplicación echaba a la pantalla de planes a quien tenía su plan al
       * día, y encima con el cartel de «tu suscripción ya no está activa».
       *
       * Mientras no haya forma de preguntar vale lo último que dijo el
       * servidor, y solo hasta la fecha en que ese plan caduca: pasada esa, la
       * copia tampoco sirve.
       */
      setSubscription(suscripcionGuardada());
    } else {
      setSubscription(null);
      guardarSuscripcion(null);
    }

    setDatosListos(true);
  }, []);

  useEffect(() => {
    const token = getToken();
    const storedUser = localStorage.getItem('agora_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoading(false);
        return;
      } catch {
        clearToken();
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      loadSellerStatus();
    } else {
      setEnterprise(null);
      setSubscription(null);
      setDatosListos(false);
    }
  }, [user, loadSellerStatus]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await authApi.login(username, password);
    setToken(response.accessToken);
    // Con esto se renueva el acceso sin volver a pedir la contraseña mientras
    // dure; el interceptor lo usa solo cuando el de acceso caduca.
    if (response.refreshToken) setRefreshToken(response.refreshToken);
    localStorage.setItem('agora_user', JSON.stringify(response.user));
    setUser(response.user);
    // Devuelto para quien lo necesite nada más entrar: el estado de React aún
    // no se ha propagado.
    return response.user;
  }, []);

  const register = useCallback(
    async (username: string, password: string, contacto?: string, referralCode?: string) => {
      await authApi.register(username, password, contacto, referralCode);
    },
    [],
  );

  /** Deja esta sesión como si nunca hubiera existido, aquí y en el servidor. */
  const limpiarSesion = useCallback(() => {
    clearToken();
    clearRefreshToken();
    localStorage.removeItem('agora_user');
    // Las copias del plan y del negocio se van con la sesión: son de quien
    // acaba de salir. Si se quedaran, el siguiente en entrar sin red heredaría
    // su plan hasta que el servidor pudiera desmentirlo.
    guardarSuscripcion(null);
    guardarEmpresa(null);
    // La ubicación es de quien la compartió, no del equipo: se va con la sesión.
    olvidarUbicacion();
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    // Se avisa al servidor para que revoque el token de refresco: sin esto,
    // quien tuviera una copia podría seguir renovando durante una semana.
    // Si la llamada falla —sin red, token ya caducado— se cierra igual: no
    // tiene sentido dejar a alguien dentro porque el servidor no conteste.
    try {
      await authApi.logout();
    } catch {
      // Sin ruido: cerrar sesión no puede fallar de cara a quien lo pide.
    }
    limpiarSesion();
  }, [limpiarSesion]);

  // Cuando ni el refresco vale —caducó o lo revocaron desde otro sitio— el
  // cliente avisa por aquí y la sesión se cierra sola.
  useEffect(() => {
    registrarCierreDeSesion(limpiarSesion);
  }, [limpiarSesion]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      enterprise,
      subscription,
      isLoading: isLoading || (Boolean(user) && !datosListos),
      isSeller: computeIsSeller(user?.permissions) || Boolean(enterprise),
      isModerator: computeIsModerator(user?.permissions),
      // Con suscripción vigente se entra en Agora; el panel de negocio pide
      // además que ese plan sea de los que dan negocio.
      tieneAcceso: Boolean(subscription),
      puedeAdministrarNegocio: daAccesoDeNegocio(subscription) && Boolean(enterprise),
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshSellerStatus: loadSellerStatus,
    }),
    [user, enterprise, subscription, isLoading, datosListos, login, register, logout, loadSellerStatus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

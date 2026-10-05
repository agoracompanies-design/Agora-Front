import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  contarSinLeer,
  desdeApi,
  esAvisoLocal,
  leerBandeja,
  marcarLeido as marcarLeidoEnAlmacen,
  marcarTodoLeido as marcarTodoLeidoEnAlmacen,
  ordenarPorFecha,
} from '@/lib/notificaciones';
import type { Aviso } from '@/lib/notificaciones';
import { listarAvisos, marcarAvisoLeido } from '@/api/notification';

interface NotificationsValue {
  avisos: Aviso[];
  sinLeer: number;
  /** Había avisos sin leer al abrir la sesión: es lo que anuncia el cartel. */
  avisaAlEntrar: boolean;
  yaAvisado: () => void;
  marcarLeido: (id: string) => void;
  marcarTodoLeido: () => void;
  recargar: () => void;
}

const NotificationsContext = createContext<NotificationsValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [avisaAlEntrar, setAvisaAlEntrar] = useState(false);

  /**
   * La bandeja: lo del servidor más lo que la aplicación guarda por su cuenta.
   *
   * Son dos orígenes porque el backend todavía no sabe del aviso de categoría
   * (SOL-14). Si el servidor no responde, se enseña lo local en vez de dejar la
   * bandeja vacía: un aviso de menos se nota, una bandeja en blanco parece que
   * no hay nada.
   */
  const traerBandeja = useCallback(async (userId: string): Promise<Aviso[]> => {
    const locales = leerBandeja(userId);
    try {
      const bandeja = await listarAvisos();
      return ordenarPorFecha([...(bandeja.items ?? []).map(desdeApi), ...locales]);
    } catch {
      return ordenarPorFecha(locales);
    }
  }, []);

  const recargar = useCallback(() => {
    if (!user) {
      setAvisos([]);
      return;
    }
    void traerBandeja(user.id).then(setAvisos);
  }, [user, traerBandeja]);

  // Al entrar se mira una sola vez si hay algo sin leer: el cartel anuncia lo
  // que había al llegar, no cada aviso que aparezca después.
  useEffect(() => {
    if (!user) {
      setAvisos([]);
      setAvisaAlEntrar(false);
      return;
    }
    let cancelado = false;
    void traerBandeja(user.id).then((bandeja) => {
      if (cancelado) return;
      setAvisos(bandeja);
      setAvisaAlEntrar(contarSinLeer(bandeja) > 0);
    });
    return () => {
      cancelado = true;
    };
  }, [user, traerBandeja]);

  /**
   * Marcar leído va a donde viva el aviso: los del servidor por su endpoint,
   * el de categoría al navegador.
   *
   * La pantalla se actualiza en el acto y la petición va detrás. Si falla, se
   * vuelve a lo que diga el servidor: con la conexión de aquí, esperar a la
   * respuesta para tachar un aviso se siente roto.
   */
  const marcarLeido = useCallback(
    (id: string) => {
      if (!user) return;
      if (esAvisoLocal(id)) {
        setAvisos(marcarLeidoEnAlmacen(user.id, id));
        return;
      }
      setAvisos((previos) => previos.map((a) => (a.id === id ? { ...a, leido: true } : a)));
      void marcarAvisoLeido(id).catch(() => recargar());
    },
    [user, recargar],
  );

  /** Uno por uno: el servidor no tiene «marcar todo», y son pocos. */
  const marcarTodoLeido = useCallback(() => {
    if (!user) return;
    const delServidor = avisos.filter((a) => !a.leido && !esAvisoLocal(a.id));
    marcarTodoLeidoEnAlmacen(user.id);
    setAvisos((previos) => previos.map((a) => (a.leido ? a : { ...a, leido: true })));
    void Promise.all(delServidor.map((a) => marcarAvisoLeido(a.id).catch(() => null))).then(
      (resultados) => {
        if (resultados.some((r) => r === null)) recargar();
      },
    );
  }, [user, avisos, recargar]);

  const valor = useMemo<NotificationsValue>(
    () => ({
      avisos,
      sinLeer: contarSinLeer(avisos),
      avisaAlEntrar,
      yaAvisado: () => setAvisaAlEntrar(false),
      marcarLeido,
      marcarTodoLeido,
      recargar,
    }),
    [avisos, avisaAlEntrar, marcarLeido, marcarTodoLeido, recargar],
  );

  return <NotificationsContext.Provider value={valor}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de NotificationsProvider');
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * Los favoritos son de cada cuenta, no del navegador.
 *
 * Se guardaban todos bajo una sola clave, así que en un equipo compartido —o
 * simplemente al cambiar de cuenta— lo guardado por uno aparecía en la sesión
 * del siguiente. Ahora la clave lleva el id del usuario.
 */
const STORAGE_KEY = 'agora_favorites';

function claveDe(userId: string | undefined) {
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readFavorites(userId: string | undefined): string[] {
  try {
    const raw = localStorage.getItem(claveDe(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Se descartan los ids que ni siquiera tienen forma de identificador: son
    // restos de los datos de muestra ("p1", "p2"…) que quedaron guardados
    // antes de conectar la API. Contaban en el corazón de la cabecera y luego
    // no aparecía nada en la pantalla de favoritos. Además la API responde 500
    // a esos ids en vez de 404, así que no basta con mirar la respuesta.
    return parsed.filter((id): id is string => typeof id === 'string' && UUID.test(id));
  } catch {
    return [];
  }
}

interface FavoritesContextValue {
  favorites: string[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  /** Quita favoritos cuyo producto ya no existe en el servidor. */
  forgetFavorites: (productIds: string[]) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites(user?.id));

  // Al entrar o salir de una cuenta se cargan los suyos. Sin esto, la lista en
  // memoria seguiría siendo la del usuario anterior hasta recargar la página.
  useEffect(() => {
    setFavorites(readFavorites(user?.id));
  }, [user?.id]);

  useEffect(() => {
    // Sin sesión no hay dónde guardarlos: se evita escribir en la clave suelta,
    // que es justo la que se compartía entre cuentas.
    if (!user?.id) return;
    try {
      localStorage.setItem(claveDe(user.id), JSON.stringify(favorites));
    } catch {
      // localStorage unavailable (private mode, quota) — favorites just won't persist
    }
  }, [favorites, user?.id]);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  }, []);

  // Aquí solo se guardan ids, así que la lista puede quedar apuntando a
  // productos borrados: entonces el contador de la cabecera marcaba 1 y la
  // pantalla de favoritos salía vacía, porque cada una contaba una cosa
  // distinta. Quien resuelve los ids avisa de los que ya no existen.
  const forgetFavorites = useCallback((productIds: string[]) => {
    if (productIds.length === 0) return;
    setFavorites((prev) => prev.filter((id) => !productIds.includes(id)));
  }, []);

  const isFavorite = useCallback((productId: string) => favorites.includes(productId), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, forgetFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites debe usarse dentro de <FavoritesProvider>');
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  addFavoriteEnterprise,
  addFavoriteProduct,
  listFavoriteEnterprises,
  listFavoriteProducts,
  removeFavoriteEnterprise,
  removeFavoriteProduct,
} from '@/api/favorite';

/**
 * Los favoritos viven en el servidor desde el 2026-09-15.
 *
 * Antes solo estaban en el navegador, así que se perdían al cambiar de equipo
 * o al limpiarlo. Ahora la lista buena es la de la API y lo de `localStorage`
 * se queda como copia: es lo que se pinta mientras llega la respuesta —en una
 * conexión mala eso son segundos de corazones apagados— y lo único que hay si
 * la petición no llega.
 *
 * La clave local lleva el id del usuario: sin eso, en un equipo compartido lo
 * guardado por uno aparecía en la sesión del siguiente.
 */
const STORAGE_KEY = 'agora_favorites';
/** Los negocios se guardan aparte: son otra lista y otra pantalla. */
const STORAGE_KEY_NEGOCIOS = 'agora_favorite_businesses';

function claveDe(userId: string | undefined, base = STORAGE_KEY) {
  return userId ? `${base}:${userId}` : base;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readFavorites(userId: string | undefined, base = STORAGE_KEY): string[] {
  try {
    const raw = localStorage.getItem(claveDe(userId, base));
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
  /** Los negocios guardados, que son una lista aparte de los productos. */
  favoriteBusinesses: string[];
  isFavoriteBusiness: (enterpriseId: string) => boolean;
  toggleFavoriteBusiness: (enterpriseId: string) => void;
  forgetFavoriteBusinesses: (enterpriseIds: string[]) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites(user?.id));
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<string[]>(() =>
    readFavorites(user?.id, STORAGE_KEY_NEGOCIOS),
  );

  // Al entrar o salir de una cuenta se cargan los suyos. Sin esto, la lista en
  // memoria seguiría siendo la del usuario anterior hasta recargar la página.
  // Primero la copia local, que es instantánea; el servidor manda en cuanto
  // conteste.
  useEffect(() => {
    const localesProductos = readFavorites(user?.id);
    const localesNegocios = readFavorites(user?.id, STORAGE_KEY_NEGOCIOS);
    setFavorites(localesProductos);
    setFavoriteBusinesses(localesNegocios);
    if (!user?.id) return;

    let cancelado = false;
    Promise.allSettled([listFavoriteProducts(), listFavoriteEnterprises()]).then(
      ([productos, negocios]) => {
        if (cancelado) return;

        if (productos.status === 'fulfilled') {
          const delServidor = productos.value.map((p) => p.idProduct);
          setFavorites(delServidor);
          // Lo que estaba guardado aquí de antes y el servidor no tiene se sube
          // una vez, para que nadie pierda su lista al estrenar esto.
          for (const id of localesProductos) {
            if (!delServidor.includes(id)) addFavoriteProduct(id).catch(() => {});
          }
          if (localesProductos.some((id) => !delServidor.includes(id))) {
            setFavorites([...new Set([...delServidor, ...localesProductos])]);
          }
        }

        if (negocios.status === 'fulfilled') {
          const delServidor = negocios.value.map((n) => n.idUserEnterprise);
          setFavoriteBusinesses(delServidor);
          for (const id of localesNegocios) {
            if (!delServidor.includes(id)) addFavoriteEnterprise(id).catch(() => {});
          }
          if (localesNegocios.some((id) => !delServidor.includes(id))) {
            setFavoriteBusinesses([...new Set([...delServidor, ...localesNegocios])]);
          }
        }
      },
    );
    return () => {
      cancelado = true;
    };
  }, [user?.id]);

  useEffect(() => {
    // Sin sesión no hay dónde guardarlos: se evita escribir en la clave suelta,
    // que es justo la que se compartía entre cuentas.
    if (!user?.id) return;
    try {
      localStorage.setItem(claveDe(user.id), JSON.stringify(favorites));
      localStorage.setItem(claveDe(user.id, STORAGE_KEY_NEGOCIOS), JSON.stringify(favoriteBusinesses));
    } catch {
      // localStorage unavailable (private mode, quota) — favorites just won't persist
    }
  }, [favorites, favoriteBusinesses, user?.id]);

  // El corazón se enciende en el acto y la petición va detrás: con la conexión
  // de allá, esperar la respuesta para pintar sería medio segundo de nada. Si
  // el servidor la rechaza se deshace, que es mejor que dejar encendido algo
  // que no se guardó.
  //
  // La petición va FUERA del actualizador de estado. Dentro parece cómodo
  // —ahí se sabe si estaba o no— pero React invoca ese actualizador dos veces
  // en desarrollo, a propósito, para delatar justo esto: se mandaban dos altas
  // por cada clic y quedaban dos filas del mismo favorito.
  const toggleFavorite = useCallback(
    (productId: string) => {
      const estaba = favorites.includes(productId);
      setFavorites((prev) =>
        estaba ? prev.filter((id) => id !== productId) : [...new Set([...prev, productId])],
      );
      if (!user?.id) return;
      const peticion = estaba ? removeFavoriteProduct(productId) : addFavoriteProduct(productId);
      peticion.catch(() => {
        setFavorites((actuales) =>
          estaba ? [...new Set([...actuales, productId])] : actuales.filter((id) => id !== productId),
        );
      });
    },
    [favorites, user?.id],
  );

  // Aquí solo se guardan ids, así que la lista puede quedar apuntando a
  // productos borrados: entonces el contador de la cabecera marcaba 1 y la
  // pantalla de favoritos salía vacía, porque cada una contaba una cosa
  // distinta. Quien resuelve los ids avisa de los que ya no existen.
  const forgetFavorites = useCallback(
    (productIds: string[]) => {
      if (productIds.length === 0) return;
      setFavorites((prev) => prev.filter((id) => !productIds.includes(id)));
      // También en el servidor: si no, vuelven en la siguiente carga.
      if (user?.id) for (const id of productIds) removeFavoriteProduct(id).catch(() => {});
    },
    [user?.id],
  );

  const isFavorite = useCallback((productId: string) => favorites.includes(productId), [favorites]);

  const toggleFavoriteBusiness = useCallback(
    (enterpriseId: string) => {
      const estaba = favoriteBusinesses.includes(enterpriseId);
      setFavoriteBusinesses((prev) =>
        estaba ? prev.filter((id) => id !== enterpriseId) : [...new Set([...prev, enterpriseId])],
      );
      if (!user?.id) return;
      const peticion = estaba
        ? removeFavoriteEnterprise(enterpriseId)
        : addFavoriteEnterprise(enterpriseId);
      peticion.catch(() => {
        setFavoriteBusinesses((actuales) =>
          estaba
            ? [...new Set([...actuales, enterpriseId])]
            : actuales.filter((id) => id !== enterpriseId),
        );
      });
    },
    [favoriteBusinesses, user?.id],
  );

  const forgetFavoriteBusinesses = useCallback(
    (enterpriseIds: string[]) => {
      if (enterpriseIds.length === 0) return;
      setFavoriteBusinesses((prev) => prev.filter((id) => !enterpriseIds.includes(id)));
      if (user?.id) for (const id of enterpriseIds) removeFavoriteEnterprise(id).catch(() => {});
    },
    [user?.id],
  );

  const isFavoriteBusiness = useCallback(
    (enterpriseId: string) => favoriteBusinesses.includes(enterpriseId),
    [favoriteBusinesses],
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        forgetFavorites,
        favoriteBusinesses,
        isFavoriteBusiness,
        toggleFavoriteBusiness,
        forgetFavoriteBusinesses,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites debe usarse dentro de <FavoritesProvider>');
  return ctx;
}

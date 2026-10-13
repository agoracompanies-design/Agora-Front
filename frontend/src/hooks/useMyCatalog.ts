import { useCallback, useEffect, useRef, useState } from 'react';
import { listProducts } from '@/api/product';
import { listServicesByEnterprise } from '@/api/service';
import type { Product, Service } from '@/types';
import { useAuth } from '@/context/AuthContext';

/** Cuántos productos se piden por vuelta al recorrer el catálogo. */
const POR_VUELTA = 100;

/**
 * Tope de vueltas, para no quedarse recorriendo el catálogo entero si algo va
 * mal. Con 100 por vuelta son 2.000 productos; pasado eso, el panel enseña lo
 * que encontró en vez de seguir pidiendo.
 */
const VUELTAS_MAXIMAS = 20;

/**
 * Los productos del negocio propio.
 *
 * El servidor **no sabe filtrar productos por empresa**: `GET /products` solo
 * acepta página, precio, calificación, ubicación y texto. Así que lo de uno hay
 * que buscarlo recorriendo el catálogo. Está pedido al backend —el filtro por
 * empresa, o una ruta propia como la que ya tienen los servicios—; en cuanto
 * exista, esto vuelve a ser una sola llamada.
 *
 * Antes se pedía **una** página de 100 y se filtraba ahí, y eso dejaba el panel
 * a cero en cuanto el catálogo pasaba de 100 productos: los del vendedor caían
 * en la segunda página y nadie los miraba. Comprobado contra la API con 204
 * productos en la base: el panel decía «Productos (0)» teniendo dos publicados.
 */
export function useMyProducts() {
  const { enterprise } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  /**
   * Qué recarga manda. Recorrer el catálogo son varias peticiones seguidas, y
   * en ese rato puede empezar otra —al cambiar de empresa, o al borrar un
   * producto—; sin esto, la que acabe más tarde pisa a la buena aunque sea más
   * vieja.
   */
  const vuelta = useRef(0);

  const reload = useCallback(async () => {
    const mia = (vuelta.current += 1);
    if (!enterprise) {
      setProducts([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const mios: Product[] = [];
      for (let pagina = 1; pagina <= VUELTAS_MAXIMAS; pagina += 1) {
        const data = await listProducts({ limit: POR_VUELTA, page: pagina });
        if (vuelta.current !== mia) return; // llegó tarde: manda otra recarga
        const lote = data.products ?? [];
        mios.push(...lote.filter((p) => p.userEnterpriseId === enterprise.idUserEnterprise));
        // Una página corta es la última: no hay más que pedir.
        if (lote.length < POR_VUELTA) break;
      }
      setProducts(mios);
    } finally {
      if (vuelta.current === mia) setIsLoading(false);
    }
  }, [enterprise]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { products, isLoading, reload };
}

export function useMyServices() {
  const { enterprise } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!enterprise) {
      setServices([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await listServicesByEnterprise(enterprise.idUserEnterprise);
      setServices(data);
    } finally {
      setIsLoading(false);
    }
  }, [enterprise]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { services, isLoading, reload };
}

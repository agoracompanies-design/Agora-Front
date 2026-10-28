import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { API_BASE_URL } from './api/client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/*
 * Navegación sin conexión.
 *
 * **Solo en la aplicación publicada.** En desarrollo, un service worker sirve
 * ficheros viejos y uno acaba depurando algo que ya cambió; además pelea con el
 * recargado en caliente de Vite.
 *
 * Se registra **después de cargar la página** para no quitarle ancho de banda a
 * lo que la persona está esperando ver. Y si falla no se dice nada: la
 * aplicación funciona igual, solo que pidiéndolo todo cada vez.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    /*
     * El origen de la API va en la dirección del service worker.
     *
     * La web y la API están en dominios distintos, y un service worker ignora
     * por defecto lo que no es suyo: sin decírselo no guardaba ni el catálogo
     * ni una sola foto —comprobado, las dos cachés en cero—, que es justo lo
     * que hace falta para abrir sin conexión.
     *
     * Se le dice cuál es, y no «cualquiera»: así sigue sin tocar nada de
     * terceros.
     */
    let direccion = '/sw.js'
    try {
      const api = new URL(API_BASE_URL, window.location.href).origin
      if (api !== window.location.origin) {
        direccion = `/sw.js?api=${encodeURIComponent(api)}`
      }
    } catch {
      // Una dirección rara deja el service worker como estaba, sin la API.
    }

    void navigator.serviceWorker.register(direccion).catch(() => {
      // Sin caché, pero con app.
    })
  })
}

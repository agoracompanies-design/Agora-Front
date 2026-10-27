import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

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
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Sin caché, pero con app.
    })
  })
}

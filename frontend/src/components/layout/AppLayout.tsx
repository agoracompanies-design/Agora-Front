import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { NewNotificationsToast } from '@/components/notifications/NewNotificationsToast';
import { Footer } from './Footer';
import { ScrollToTop } from '@/components/ui/ScrollToTop';

export function AppLayout() {
  return (
    <div id="app" className="app flex min-h-screen flex-col">
      <Navbar />
      {/* Sobre el carrusel, no dentro: el aviso pertenece a la sesión. */}
      <NewNotificationsToast />
      <main id="app__main" className="app__main flex-1">
        <Outlet />
      </main>
      <Footer />
      {/* Fuera del <main>: acompaña a toda la página, no a su contenido, y así
          vale para todas las pantallas y no solo para la de explorar. */}
      <ScrollToTop />
    </div>
  );
}

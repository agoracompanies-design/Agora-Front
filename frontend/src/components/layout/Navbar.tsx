import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Heart, LayoutGrid, LogOut, Megaphone, Store, User as UserIcon, ChevronDown, Menu, X , ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useNotifications } from '@/context/NotificationsContext';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import { guardarAjustesDeAvisos, leerAjustesDeAvisos } from '@/api/notification';
import { cn, initials } from '@/lib/utils';

export function Navbar() {
  const { user, isAuthenticated, isSeller, isModerator, tieneAcceso, logout } = useAuth();
  const { sinLeer } = useNotifications();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { notify } = useToast();

  /**
   * Si el usuario quiere promociones. `null` mientras no se sabe.
   *
   * Se pide **al abrir el menú**, no al cargar la aplicación: es un dato que
   * solo hace falta si alguien va a tocarlo, y aquí cada petición que se evita
   * se nota.
   */
  const [promociones, setPromociones] = useState<boolean | null>(null);
  const [guardandoPromos, setGuardandoPromos] = useState(false);

  useEffect(() => {
    if (!menuOpen || !user || promociones !== null) return;
    let cancelado = false;
    void leerAjustesDeAvisos()
      .then((a) => !cancelado && setPromociones(a.promotions))
      // Si no se puede leer, no se enseña un interruptor que miente sobre su
      // estado: la fila se queda fuera hasta que el servidor conteste.
      .catch(() => undefined);
    return () => {
      cancelado = true;
    };
  }, [menuOpen, user, promociones]);

  /** Cambia en el acto y manda la petición detrás; si falla, se deshace. */
  async function cambiarPromociones(quiere: boolean) {
    const antes = promociones;
    setPromociones(quiere);
    setGuardandoPromos(true);
    try {
      const ajustes = await guardarAjustesDeAvisos(quiere);
      setPromociones(ajustes.promotions);
    } catch {
      setPromociones(antes);
      notify('No se pudo guardar. Inténtalo otra vez.', 'error');
    } finally {
      setGuardandoPromos(false);
    }
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-sm font-medium transition-colors px-3 py-2 rounded-lg',
      // El enlace activo es un estado, no una acción: se marca con peso y fondo
      // neutro para no competir con el único botón primario de la pantalla.
      isActive ? 'text-ink-900 font-semibold bg-ink-100' : 'text-ink-500 hover:text-ink-900',
    );

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate('/iniciar-sesion', { replace: true });
  }

  return (
    <header id="navbar" className="navbar sticky top-0 z-40 border-b border-ink-200/70 bg-ink-50/80 backdrop-blur-md">
      <div id="navbar__bar" className="navbar__bar mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div id="navbar__left" className="navbar__left flex shrink-0 items-center gap-8">
          <Logo />
          {/* Sin membresía al día esas secciones rebotan a las opciones de compra. */}
          {tieneAcceso && (
          <nav id="navbar__nav" className="navbar__nav hidden md:flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Explorar
            </NavLink>
            <NavLink to="/negocios" className={navLinkClass}>
              Negocios
            </NavLink>
            {isSeller && (
              <NavLink to="/panel" className={navLinkClass}>
                Mi negocio
              </NavLink>
            )}
          </nav>
          )}
        </div>

        <div id="navbar__right" className="navbar__right hidden min-w-0 flex-1 md:flex items-center justify-end gap-3">
          <ThemeToggle />
          <Link
            to="/avisos"
            aria-label="Avisos"
            id="navbar__notifications" className="navbar__notifications relative flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
          >
            <Bell size={18} />
            {sinLeer > 0 && (
              <span id="navbar__notifications-count" className="navbar__notifications-count absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                {sinLeer}
              </span>
            )}
          </Link>
          <Link
            to="/favoritos"
            aria-label="Favoritos"
            id="navbar__favorites" className="navbar__favorites relative flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
          >
            <Heart size={18} />
            {favorites.length > 0 && (
              <span id="navbar__favorites-count" className="navbar__favorites-count absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink-900 px-1 text-[10px] font-semibold text-ink-50">
                {favorites.length}
              </span>
            )}
          </Link>
          {/* Sin sesión no se llega hasta aquí: la cabecera solo existe dentro
              de la zona autenticada, así que no hay botones de acceso. */}
          {user && (
            <div id="navbar__user" className="navbar__user relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                id="navbar__user-button" className="navbar__user-button relative flex items-center gap-2 rounded-full border border-ink-200 py-1 pl-1 pr-3 hover:border-ink-300 transition-colors"
              >
                <span id="navbar__user-initials" className="navbar__user-initials flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                  {initials(user.username)}
                </span>
                <span id="navbar__user-name" className="navbar__user-name text-sm font-medium text-ink-800 max-w-[8rem] truncate">{user.username}</span>
                <ChevronDown size={14} className="text-ink-400" />
              </button>
              {menuOpen && (
                <div id="navbar__menu" className="navbar__menu absolute right-0 mt-2 w-80 animate-fade-up rounded-xl border border-ink-200 bg-ink-50 p-1.5 shadow-lift">
                  <div id="navbar__menu-header" className="navbar__menu-header px-3 py-2 border-b border-ink-100 mb-1">
                    <p id="navbar__menu-username" className="navbar__menu-username text-sm font-medium text-ink-900 truncate">{user.username}</p>
                    <p id="navbar__menu-role" className="navbar__menu-role text-xs text-ink-500">{isSeller ? 'Cuenta de vendedor' : 'Cuenta de comprador'}</p>
                  </div>

                  {isModerator && (
                    <Link
                      to="/moderacion"
                      onClick={() => setMenuOpen(false)}
                      id="navbar__menu-moderation"
                      className="navbar__menu-moderation flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                    >
                      <ShieldCheck size={15} /> Moderación
                    </Link>
                  )}
                  <Link
                    to="/"
                    onClick={() => setMenuOpen(false)}
                    id="navbar__menu-account" className="navbar__menu-account flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                  >
                    <LayoutGrid size={15} /> Explorar
                  </Link>
                  <Link
                    to="/favoritos"
                    onClick={() => setMenuOpen(false)}
                    id="navbar__menu-favorites" className="navbar__menu-favorites flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                  >
                    <Heart size={15} /> Favoritos
                  </Link>
                  <Link
                    to="/avisos"
                    onClick={() => setMenuOpen(false)}
                    id="navbar__menu-notifications" className="navbar__menu-notifications flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                  >
                    <Bell size={15} /> Avisos{sinLeer > 0 && ` (${sinLeer})`}
                  </Link>
                  {isSeller ? (
                    <Link
                      to="/panel"
                      onClick={() => setMenuOpen(false)}
                      id="navbar__menu-dashboard" className="navbar__menu-dashboard flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                    >
                      <Store size={15} /> Mi negocio
                    </Link>
                  ) : (
                    <Link
                      to="/vender"
                      onClick={() => setMenuOpen(false)}
                      id="navbar__menu-publish" className="navbar__menu-publish flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                    >
                      <Store size={15} /> Vender en Agora
                    </Link>
                  )}
                  <Link
                    to="/cuenta"
                    onClick={() => setMenuOpen(false)}
                    id="navbar__menu-plans" className="navbar__menu-plans flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                  >
                    <UserIcon size={15} /> Mi cuenta
                  </Link>

                  {/*
                    Lo único que se puede silenciar son las promociones: los
                    avisos de cuenta y de conducta no son opcionales, porque sin
                    ellos alguien puede quedarse sin servicio sin enterarse.

                    `checkbox` nativo y no un botón disfrazado: el navegador ya
                    sabe anunciarlo y manejarlo con el teclado.
                  */}
                  {promociones !== null && (
                    <label
                      htmlFor="navbar__menu-promos-input"
                      id="navbar__menu-promos"
                      className="navbar__menu-promos mt-1 flex cursor-pointer items-center gap-2 border-t border-ink-100 px-3 py-2.5 text-sm text-ink-700"
                    >
                      <Megaphone size={15} aria-hidden="true" />
                      <span className="flex-1">
                        Promociones
                        <span className="block text-xs text-ink-500">
                          Ofertas y novedades. Los avisos de tu cuenta llegan igual.
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        id="navbar__menu-promos-input"
                        checked={promociones}
                        disabled={guardandoPromos}
                        onChange={(e) => void cambiarPromociones(e.target.checked)}
                        className="navbar__menu-promos-input h-5 w-5 shrink-0 accent-primary disabled:opacity-50"
                      />
                    </label>
                  )}

                  <button
                    onClick={handleLogout}
                    id="navbar__menu-logout" className="navbar__menu-logout flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-500/10"
                  >
                    <LogOut size={15} /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div id="navbar__mobile-actions" className="navbar__mobile-actions flex items-center gap-1 md:hidden">
          {/* Los avisos también aquí. Estaban solo en la barra de escritorio, y
              en el teléfono no había forma de llegar a ellos: ni en la barra ni
              dentro del menú. El contador es justo lo que hay que ver sin
              abrir nada. */}
          {isAuthenticated && (
            <Link
              to="/avisos"
              aria-label={sinLeer > 0 ? `Avisos (${sinLeer} sin leer)` : 'Avisos'}
              id="navbar__mobile-notifications"
              className="navbar__mobile-notifications relative flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
            >
              <Bell size={18} />
              {sinLeer > 0 && (
                <span
                  id="navbar__mobile-notifications-count"
                  className="navbar__mobile-notifications-count absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white"
                >
                  {sinLeer}
                </span>
              )}
            </Link>
          )}
          <ThemeToggle id="theme-toggle--mobile" />
          <button id="navbar__mobile-toggle" className="navbar__mobile-toggle p-2 text-ink-700" onClick={() => setMobileOpen((v) => !v)} aria-label="Menú">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="navbar__mobile-menu" className="navbar__mobile-menu md:hidden border-t border-ink-200 bg-ink-50 px-4 py-3 animate-fade-in">
          <div id="navbar__mobile-list" className="navbar__mobile-list flex flex-col gap-1">
            <Link to="/" onClick={() => setMobileOpen(false)} id="navbar__mobile-explore" className="navbar__mobile-explore rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
              Explorar
            </Link>
            <Link to="/negocios" onClick={() => setMobileOpen(false)} id="navbar__mobile-businesses" className="navbar__mobile-businesses rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
              Negocios
            </Link>
            <Link
              to="/favoritos"
              onClick={() => setMobileOpen(false)}
              id="navbar__mobile-favorites" className="navbar__mobile-favorites flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
            >
              Favoritos
              {favorites.length > 0 && <span id="navbar__mobile-favorites-count" className="navbar__mobile-favorites-count text-xs text-ink-400">{favorites.length}</span>}
            </Link>
            {isAuthenticated && (
              <>
                {isSeller ? (
                  <Link to="/panel" onClick={() => setMobileOpen(false)} id="navbar__mobile-dashboard" className="navbar__mobile-dashboard rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
                    Mi negocio
                  </Link>
                ) : (
                  <Link to="/vender" onClick={() => setMobileOpen(false)} id="navbar__mobile-sell" className="navbar__mobile-sell rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
                    Vender en Agora
                  </Link>
                )}
                <Link to="/cuenta" onClick={() => setMobileOpen(false)} id="navbar__mobile-account" className="navbar__mobile-account rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
                  Mi cuenta
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  id="navbar__mobile-logout" className="navbar__mobile-logout rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-500/10"
                >
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

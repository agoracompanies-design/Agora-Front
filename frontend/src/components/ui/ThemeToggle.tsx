import { useRef } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useMotion } from '@/context/MotionContext';
import { cn } from '@/lib/utils';

/**
 * El cambio entre claro y oscuro, con el arco que lo trae.
 *
 * El tema nuevo entra como un círculo que **nace del propio botón** —arriba a
 * la derecha— y crece hasta tapar la pantalla. No es adorno: el ojo sigue la
 * onda desde donde la pulsó y entiende que lo que cambió es toda la página,
 * no un trozo.
 *
 * Se apoya en `startViewTransition`, que congela la vista vieja y la nueva en
 * dos capas; aquí solo se recorta la de arriba con un `clip-path` que crece.
 * Donde no existe esa API el tema cambia igual, de golpe, sin romper nada.
 *
 * Y si la persona pidió **reducir animaciones** en su cuenta, no se anima:
 * cambia y ya.
 */
export function ThemeToggle({ id = 'theme-toggle', className }: { id?: string; className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const { reducirMovimiento } = useMotion();
  const boton = useRef<HTMLButtonElement>(null);

  function cambiar() {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };
    if (reducirMovimiento || typeof doc.startViewTransition !== 'function') {
      toggleTheme();
      return;
    }

    // El centro del arco es el botón; el radio, la distancia hasta la esquina
    // más lejana, para que el círculo acabe cubriendo la pantalla entera.
    const c = boton.current?.getBoundingClientRect();
    const x = c ? c.left + c.width / 2 : window.innerWidth;
    const y = c ? c.top + c.height / 2 : 0;
    const radio = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transicion = doc.startViewTransition(() => {
      toggleTheme();
    });

    void transicion.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`],
        },
        {
          duration: 520,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    });
  }

  return (
    <button
      ref={boton}
      id={id}
      onClick={cambiar}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900',
        className,
      )}
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

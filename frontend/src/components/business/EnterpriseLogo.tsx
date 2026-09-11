import { enterpriseLogoUrl } from '@/api/userEnterprise';
import { initials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface EnterpriseLogoProps {
  nombre: string;
  /** El archivo que devolvió el servidor, si el negocio subió logo. */
  logo?: string | null;
  /** Lado del cuadrado, en clases de tamaño. */
  className?: string;
  /** Tamaño del texto de la inicial cuando no hay logo. */
  textoClassName?: string;
  id?: string;
}

/**
 * La cara de un negocio: su logo, y mientras no lo tenga, un cuadrado con su
 * inicial.
 *
 * El hueco lo ocupa siempre lo mismo, tenga logo o no: así la lista de negocios
 * no baila según quién haya subido imagen, y el que no la sube no aparece con
 * un agujero sino con algo que ya lo identifica.
 */
export function EnterpriseLogo({ nombre, logo, className, textoClassName, id }: EnterpriseLogoProps) {
  const url = enterpriseLogoUrl(logo);

  return (
    <span
      id={id}
      className={cn(
        'enterprise-logo flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary font-bold text-white',
        className,
      )}
    >
      {url ? (
        <img
          src={url}
          alt={`Logo de ${nombre}`}
          className="enterprise-logo__image h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className={cn('enterprise-logo__initials', textoClassName)} aria-hidden="true">
          {initials(nombre)}
        </span>
      )}
    </span>
  );
}

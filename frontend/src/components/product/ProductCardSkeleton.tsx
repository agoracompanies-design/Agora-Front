import { Skeleton } from '@/components/ui/Skeleton';
import { FOTO_COMPACTA_LG } from '@/components/product/ProductCard';
import { cn } from '@/lib/utils';

/** `compacta` imita la tarjeta compacta de Explorar, para que no salte al cargar. */
export function ProductCardSkeleton({ compacta = false }: { compacta?: boolean }) {
  return (
    <div
      id="product"
      className={cn(
        'product product--loading flex h-full flex-col overflow-hidden rounded-xl border border-ink-200/80 bg-ink-50',
        compacta && '@container',
      )}
    >
      <Skeleton
        className={cn('w-full flex-auto min-h-0 rounded-none', compacta ? `aspect-[3/2] ${FOTO_COMPACTA_LG}` : 'aspect-[4/3]')}
      />
      <div className={cn('flex flex-col', compacta ? 'gap-1 p-2.5' : 'gap-1.5 p-3')}>
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mt-1 h-5 w-16" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

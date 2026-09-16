import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/types/product';

export function RecentProductsTable({ products }: { products: Product[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-200 p-5">
        <div>
          <h3 className="font-semibold text-ink-900">Productos recientes</h3>
          <p className="text-sm text-ink-500">Últimos productos publicados</p>
        </div>
        <Link to="/panel/productos">
          <Button variant="outline" size="sm">Ver todos</Button>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs uppercase text-ink-500">
            <tr>
              <th className="px-5 py-3">Producto</th>
              <th className="px-5 py-3">Categoría</th>
              <th className="px-5 py-3">Precio CUP</th>
              <th className="px-5 py-3">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {products.slice(0, 5).map((p) => (
              <tr key={p.idProduct} className="hover:bg-ink-50">
                <td className="px-5 py-3 font-medium text-ink-900">{p.name}</td>
                <td className="px-5 py-3 text-ink-600">
                  {p.category?.name ?? '—'}
                </td>
                <td className="px-5 py-3 text-ink-600">
                  {p.priceCup ? `$${p.priceCup}` : '—'}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      p.stock
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {p.stock ? 'Disponible' : 'Agotado'}
                  </span>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-ink-400">
                  No hay productos todavía
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
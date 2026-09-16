import { Card } from '@/components/ui/Card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const DATA = [
  { month: 'Ene', productos: 12, servicios: 4 },
  { month: 'Feb', productos: 19, servicios: 6 },
  { month: 'Mar', productos: 15, servicios: 8 },
  { month: 'Abr', productos: 27, servicios: 10 },
  { month: 'May', productos: 32, servicios: 12 },
  { month: 'Jun', productos: 41, servicios: 15 },
  { month: 'Jul', productos: 38, servicios: 18 },
];

export function SalesChart() {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-ink-900">Actividad del catálogo</h3>
          <p className="text-sm text-ink-500">Productos y servicios publicados por mes</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={DATA}>
          <defs>
            <linearGradient id="colorProducts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorServices" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="productos"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorProducts)"
          />
          <Area
            type="monotone"
            dataKey="servicios"
            stroke="#a855f7"
            fillOpacity={1}
            fill="url(#colorServices)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
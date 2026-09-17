import { Card } from '@/components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const DATA = [
  { name: 'Alimentos', value: 35 },
  { name: 'Bebidas', value: 22 },
  { name: 'Farmacia', value: 15 },
  { name: 'Limpieza', value: 12 },
  { name: 'Ferretería', value: 9 },
  { name: 'Otros', value: 7 },
];

const COLORS = ['#3b82f6', '#a855f7', '#f59e0b', '#10b981', '#ef4444', '#6b7280'];

export function CategoryChart() {
  return (
    <Card className="p-6">
      <h3 className="mb-1 font-semibold text-ink-900">Productos por categoría</h3>
      <p className="mb-4 text-sm text-ink-500">Distribución actual del catálogo</p>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={DATA}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
          >
            {DATA.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
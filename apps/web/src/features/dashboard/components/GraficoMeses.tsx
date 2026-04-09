import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/format';
import type { GraficoMes } from '../api';

interface GraficoMesesProps {
  data: GraficoMes[];
  loading?: boolean;
}

function formatMes(mes: string) {
  try {
    return format(parseISO(`${mes}-01`), 'MMM', { locale: ptBR });
  } catch {
    return mes;
  }
}

export function GraficoMeses({ data, loading }: GraficoMesesProps) {
  if (loading) {
    return <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />;
  }

  const chartData = data.map((d) => ({
    ...d,
    mesLabel: formatMes(d.mes),
  }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
        Pagamentos vs Recebimentos — últimos 6 meses
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="mesLabel"
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelStyle={{ color: '#334155' }}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
          />
          <Bar dataKey="pagar" name="A Pagar" fill="#dc2626" radius={[4, 4, 0, 0]} />
          <Bar dataKey="receber" name="A Receber" fill="#16a34a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

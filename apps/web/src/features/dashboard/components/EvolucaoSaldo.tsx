import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/format';
import type { EvolucaoMes } from '../api';

interface EvolucaoSaldoProps {
  data: EvolucaoMes[];
  saldoAtual?: number;  // valor canônico do dashboard (substitui último ponto da série se presente)
  loading?: boolean;
}

// Paleta de cores que alterna (como no Delphi)
const COLORS = [
  '#93c5fd', '#6ee7b7', '#5eead4', '#818cf8', '#fca5a5',
  '#fcd34d', '#a5b4fc', '#86efac', '#67e8f9', '#fdba74',
  '#c4b5fd', '#f9a8d4', '#bbf7d0',
];

function formatMes(mes: string) {
  try {
    return format(parseISO(`${mes}-01`), 'MMM/yy', { locale: ptBR });
  } catch {
    return mes;
  }
}

export function EvolucaoSaldo({ data, saldoAtual, loading }: EvolucaoSaldoProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4 animate-pulse" />
        <div className="h-72 bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  // Últimos 13 meses
  const chartData = data.slice(-13).map((d, i) => ({
    ...d,
    mesLabel: formatMes(d.mes),
    colorIndex: i % COLORS.length,
  }));

  const ultimoSaldo = saldoAtual ?? chartData[chartData.length - 1]?.saldoTotal ?? 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Saldo Detalhado — Evolução Mensal
        </h3>
        <span className="text-base font-bold text-blue-700 dark:text-blue-400">
          {formatCurrency(ultimoSaldo)}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="mesLabel"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
            }
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), 'Saldo Total']}
            labelStyle={{ color: '#334155', fontWeight: 600 }}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
            }}
          />
          <ReferenceLine y={0} stroke="#cbd5e1" />
          <Bar dataKey="saldoTotal" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.mes} fill={COLORS[entry.colorIndex]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

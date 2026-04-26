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
  saldoAtual?: number;
  loading?: boolean;
}

const BAR_COLORS = [
  'oklch(72% 0.08 230)',
  'oklch(74% 0.09 200)',
  'oklch(72% 0.10 170)',
  'oklch(74% 0.11 140)',
  'oklch(76% 0.10 100)',
  'oklch(76% 0.12 75)',
  'oklch(72% 0.13 55)',
  'oklch(70% 0.13 35)',
  'oklch(68% 0.14 20)',
  'oklch(70% 0.11 340)',
  'oklch(70% 0.10 305)',
  'oklch(72% 0.09 275)',
];
const BAR_ACCENT = 'oklch(68% 0.15 65)';

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
      <div className="bg-surface-raised rounded-xl border border-canvas-border p-5">
        <div className="h-4 w-48 bg-canvas-border rounded mb-4 animate-pulse" />
        <div className="h-64 bg-canvas-border/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  const chartData = data.slice(-13).map((d) => ({
    ...d,
    mesLabel: formatMes(d.mes),
  }));

  const ultimoSaldo = saldoAtual ?? chartData[chartData.length - 1]?.saldoTotal ?? 0;
  const lastIndex = chartData.length - 1;

  return (
    <div className="bg-surface-raised rounded-xl border border-canvas-border p-5">
      <div className="flex items-baseline justify-between mb-5">
        <h3 className="text-[13px] font-semibold text-ink-muted uppercase tracking-[0.07em]">
          Evolução Mensal
        </h3>
        <span className="text-[15px] font-bold text-accent tabular-nums">
          {formatCurrency(ultimoSaldo)}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barCategoryGap="22%">
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(90% 0.012 75)" vertical={false} />
          <XAxis
            dataKey="mesLabel"
            tick={{ fontSize: 11, fill: 'oklch(65% 0.015 255)', fontFamily: 'var(--font-sans)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'oklch(65% 0.015 255)', fontFamily: 'var(--font-sans)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
            }
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), 'Saldo Total']}
            labelStyle={{ color: 'oklch(14% 0.02 255)', fontWeight: 600, fontFamily: 'var(--font-sans)', fontSize: 12 }}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid oklch(90% 0.012 75)',
              fontSize: '13px',
              background: 'oklch(99.5% 0.005 75)',
              color: 'oklch(14% 0.02 255)',
            }}
          />
          <ReferenceLine y={0} stroke="oklch(85% 0.015 75)" />
          <Bar dataKey="saldoTotal" radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell
                key={i}
                fill={i === lastIndex ? BAR_ACCENT : BAR_COLORS[i % BAR_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

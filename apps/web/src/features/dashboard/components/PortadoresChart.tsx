import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/format';
import type { PortadorResumo } from '../api';

interface PortadoresChartProps {
  portadores: PortadorResumo[];
  loading?: boolean;
  onHoverChange?: (id: number | null) => void;
}

const COLOR_MAP: Record<string, string> = {
  C: '#60a5fa', // Corrente — azul
  P: '#34d399', // Poupança — verde
  I: '#a78bfa', // Investimento — roxo
  D: '#fbbf24', // Dinheiro — âmbar
};

function getColor(tipo: string) {
  return COLOR_MAP[tipo] ?? '#94a3b8';
}

// Escurece levemente a cor ao fazer hover
function getDarkerColor(tipo: string) {
  const map: Record<string, string> = {
    C: '#2563eb',
    P: '#059669',
    I: '#7c3aed',
    D: '#d97706',
  };
  return map[tipo] ?? '#475569';
}

export function PortadoresChart({ portadores, loading, onHoverChange }: PortadoresChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4 animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  const chartData = portadores
    .filter((p) => p.saldo > 0)
    .sort((a, b) => b.saldo - a.saldo)
    .slice(0, 15)
    .map((p) => ({
      id: p.id,
      name: p.nome.length > 20 ? p.nome.substring(0, 18) + '…' : p.nome,
      fullName: p.nome,
      saldo: p.saldo,
      tipo: p.tipo,
      membro: p.membroNome,
    }));

  if (chartData.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Saldo Atual por Portador
        </h3>
        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
          {Object.entries({ C: 'Corrente', P: 'Poupança', I: 'Investimento', D: 'Dinheiro' }).map(
            ([k, v]) =>
              portadores.some((p) => p.tipo === k && p.saldo > 0) ? (
                <span key={k} className="flex items-center gap-1">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-sm"
                    style={{ background: COLOR_MAP[k] }}
                  />
                  {v}
                </span>
              ) : null,
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 38)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 8, right: 64 }}
          onMouseMove={(state) => {
            const index = typeof state?.activeTooltipIndex === 'number'
              ? state.activeTooltipIndex
              : null;
            if (index !== null && index !== activeIndex) {
              setActiveIndex(index);
              onHoverChange?.(chartData[index]?.id ?? null);
            }
          }}
          onMouseLeave={() => { setActiveIndex(null); onHoverChange?.(null); }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
            }
          />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={({ x, y, payload, index }) => (
              <text
                x={x}
                y={y}
                dy={4}
                textAnchor="end"
                fontSize={11}
                fontWeight={activeIndex === index ? 600 : 400}
                fill={activeIndex === index ? '#1e293b' : '#64748b'}
              >
                {payload.value}
              </text>
            )}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: '#f1f5f9', radius: 4 }}
            formatter={(value) => [formatCurrency(Number(value)), 'Saldo']}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload;
              return p ? `${p.fullName} · ${p.membro}` : '';
            }}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
            }}
          />
          <Bar dataKey="saldo" radius={[0, 4, 4, 0]} background={{ fill: 'transparent' }}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={activeIndex === i ? getDarkerColor(entry.tipo) : getColor(entry.tipo)}
                opacity={activeIndex === null || activeIndex === i ? 1 : 0.35}
                stroke={activeIndex === i ? getDarkerColor(entry.tipo) : 'none'}
                strokeWidth={activeIndex === i ? 1.5 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

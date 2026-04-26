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
  C: 'oklch(67% 0.17 230)',
  P: 'oklch(68% 0.15 160)',
  I: 'oklch(65% 0.18 295)',
  D: 'oklch(72% 0.16 75)',
};

const COLOR_ACTIVE: Record<string, string> = {
  C: 'oklch(50% 0.20 230)',
  P: 'oklch(50% 0.18 160)',
  I: 'oklch(48% 0.22 295)',
  D: 'oklch(57% 0.18 75)',
};

function getColor(tipo: string) {
  return COLOR_MAP[tipo] ?? 'oklch(74% 0.04 255)';
}

function getActiveColor(tipo: string) {
  return COLOR_ACTIVE[tipo] ?? 'oklch(52% 0.015 255)';
}

export function PortadoresChart({ portadores, loading, onHoverChange }: PortadoresChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="bg-surface-raised rounded-xl border border-canvas-border p-5">
        <div className="h-4 w-48 bg-canvas-border rounded mb-4 animate-pulse" />
        <div className="h-64 bg-canvas-border/50 rounded-lg animate-pulse" />
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
    <div className="bg-surface-raised rounded-xl border border-canvas-border p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-ink-muted uppercase tracking-[0.07em]">
          Saldo por Portador
        </h3>
        <div className="flex items-center gap-3">
          {Object.entries({ C: 'Corrente', P: 'Poupança', I: 'Investimento', D: 'Dinheiro' }).map(
            ([k, v]) =>
              portadores.some((p) => p.tipo === k && p.saldo > 0) ? (
                <span key={k} className="flex items-center gap-1 text-[11px] text-ink-muted">
                  <span className="inline-block w-2 h-2 rounded-sm" style={{ background: COLOR_MAP[k] }} />
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
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="oklch(90% 0.012 75)" />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: 'oklch(65% 0.015 255)', fontFamily: 'var(--font-sans)' }}
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
                fill={activeIndex === index ? 'oklch(14% 0.02 255)' : 'oklch(52% 0.015 255)'}
              >
                {payload.value}
              </text>
            )}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'oklch(95% 0.008 75)', radius: 4 }}
            formatter={(value) => [formatCurrency(Number(value)), 'Saldo']}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload;
              return p ? `${p.fullName} · ${p.membro}` : '';
            }}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid oklch(90% 0.012 75)',
              fontSize: '13px',
              background: 'oklch(99.5% 0.005 75)',
              color: 'oklch(14% 0.02 255)',
            }}
          />
          <Bar dataKey="saldo" radius={[0, 4, 4, 0]} background={{ fill: 'transparent' }}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={activeIndex === i ? getActiveColor(entry.tipo) : getColor(entry.tipo)}
                opacity={activeIndex === null || activeIndex === i ? 1 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

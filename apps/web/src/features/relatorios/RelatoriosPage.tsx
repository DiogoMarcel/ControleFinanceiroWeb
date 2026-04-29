import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import { api } from '@/services/api';
import { formatCurrency } from '@/lib/format';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Tipos ──────────────────────────────────────────────────────────────────

interface SaldoPortador {
  id: number;
  nome: string;
  membro: string;
  valor: number;
  reservado: boolean;
  contacapital: boolean;
}

interface GastoTag {
  id: number;
  descricao: string;
  total: number;
}

interface ComparativoMes {
  mes: string;
  pagamentos: number;
  recebimentos: number;
}

// ── Paleta ─────────────────────────────────────────────────────────────────

const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
  '#a78bfa', '#fb923c',
];

// ── Helpers ────────────────────────────────────────────────────────────────

function mesLabel(mes: string) {
  try {
    return format(parseISO(`${mes}-01`), 'MMM/yy', { locale: ptBR });
  } catch {
    return mes;
  }
}

function getMesAtual() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ── Card container ─────────────────────────────────────────────────────────

function ChartCard({ title, controls, children, loading }: {
  title: string;
  controls?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="bg-surface-raised rounded-xl border border-canvas-border p-5">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {controls}
      </div>
      {loading ? (
        <div className="h-64 bg-surface rounded-lg animate-pulse" />
      ) : (
        children
      )}
    </div>
  );
}

// ── Gráfico 1: Saldo por Portador ──────────────────────────────────────────

function SaldoPorPortador() {
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const { data = [], isLoading } = useQuery<SaldoPortador[]>({
    queryKey: ['relatorios', 'saldo-por-portador'],
    queryFn: async () => (await api.get('/relatorios/saldo-por-portador')).data,
  });

  const operacionais = data.filter((p) => !p.reservado && p.contacapital !== true);
  const reservados   = data.filter((p) => p.reservado && p.contacapital !== true);
  const mostrar = mostrarTodos ? data : operacionais;

  const chartData = mostrar.map((p, i) => ({
    nome: p.nome.length > 18 ? `${p.nome.slice(0, 16)}…` : p.nome,
    valor: p.valor,
    fill: PALETTE[i % PALETTE.length],
  }));

  return (
    <ChartCard
      title="Saldo Atual por Portador"
      loading={isLoading}
      controls={
        <label className="flex items-center gap-1.5 text-xs text-ink-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mostrarTodos}
            onChange={e => setMostrarTodos(e.target.checked)}
            className="rounded"
          />
          Incluir reservados
        </label>
      }
    >
      {chartData.length === 0 ? (
        <p className="h-64 flex items-center justify-center text-ink-subtle text-sm">Sem dados.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barCategoryGap="25%" margin={{ bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(90% 0.012 75)" vertical={false} />
              <XAxis
                dataKey="nome"
                tick={{ fontSize: 11, fill: 'oklch(72% 0.01 255)' }}
                axisLine={false}
                tickLine={false}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'oklch(72% 0.01 255)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), 'Saldo']}
                contentStyle={{ borderRadius: 8, border: '1px solid oklch(90% 0.012 75)', fontSize: 13 }}
              />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-ink-subtle mt-1">
            Total operacional:{' '}
            <span className="font-medium text-ink-muted">
              {formatCurrency(operacionais.reduce((s, p) => s + p.valor, 0))}
            </span>
            {reservados.length > 0 && !mostrarTodos && (
              <span className="ml-2 text-ink-subtle">
                (+{reservados.length} reservado{reservados.length > 1 ? 's' : ''} oculto{reservados.length > 1 ? 's' : ''})
              </span>
            )}
          </p>
        </>
      )}
    </ChartCard>
  );
}

// ── Gráfico 2: Gastos por Tag ──────────────────────────────────────────────

function GastosPorTag() {
  const [mes, setMes] = useState(getMesAtual());

  const { data = [], isLoading } = useQuery<GastoTag[]>({
    queryKey: ['relatorios', 'gastos-por-tag', mes],
    queryFn: async () => (await api.get('/relatorios/gastos-por-tag', { params: { mes } })).data,
  });

  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <ChartCard
      title="Gastos por Categoria"
      loading={isLoading}
      controls={
        <input
          type="month"
          value={mes}
          onChange={e => setMes(e.target.value)}
          className="border border-canvas-border rounded-lg px-2 py-1 text-xs bg-surface-raised text-ink focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/60"
        />
      }
    >
      {data.length === 0 ? (
        <p className="h-64 flex items-center justify-center text-ink-subtle text-sm">Sem gastos categorizados no período.</p>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-4">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="descricao"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={45}
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [formatCurrency(Number(value)), name]}
                contentStyle={{ borderRadius: 8, border: '1px solid oklch(90% 0.012 75)', fontSize: 13 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 min-w-[160px] w-full md:w-auto">
            {data.map((d, i) => (
              <div key={d.id} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                />
                <span className="text-ink-muted flex-1 truncate">{d.descricao}</span>
                <span className="font-medium text-ink whitespace-nowrap">
                  {((d.total / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
            <p className="mt-2 pt-2 border-t border-canvas-border text-xs text-ink-muted">
              Total: <span className="font-semibold text-ink">{formatCurrency(total)}</span>
            </p>
          </div>
        </div>
      )}
    </ChartCard>
  );
}

// ── Gráfico 3: Comparativo Meses ───────────────────────────────────────────

function ComparativoMeses() {
  const [meses, setMeses] = useState(6);

  const { data = [], isLoading } = useQuery<ComparativoMes[]>({
    queryKey: ['relatorios', 'comparativo-meses', meses],
    queryFn: async () => (await api.get('/relatorios/comparativo-meses', { params: { meses } })).data,
  });

  const chartData = data.map(d => ({
    ...d,
    mesLabel: mesLabel(d.mes),
    liquido: d.recebimentos - d.pagamentos,
  }));

  return (
    <ChartCard
      title="Pagamentos vs Recebimentos"
      loading={isLoading}
      controls={
        <select
          value={meses}
          onChange={e => setMeses(Number(e.target.value))}
          className="border border-canvas-border rounded-lg px-2 py-1 text-xs bg-surface-raised text-ink focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/60"
        >
          <option value={3}>3 meses</option>
          <option value={6}>6 meses</option>
          <option value={12}>12 meses</option>
          <option value={24}>24 meses</option>
        </select>
      }
    >
      {chartData.length === 0 ? (
        <p className="h-64 flex items-center justify-center text-ink-subtle text-sm">Sem dados no período.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barCategoryGap="20%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(90% 0.012 75)" vertical={false} />
              <XAxis
                dataKey="mesLabel"
                tick={{ fontSize: 11, fill: 'oklch(72% 0.01 255)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'oklch(72% 0.01 255)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  name === 'pagamentos' ? 'Pagamentos' : 'Recebimentos',
                ]}
                contentStyle={{ borderRadius: 8, border: '1px solid oklch(90% 0.012 75)', fontSize: 13 }}
              />
              <Legend
                formatter={v => v === 'pagamentos' ? 'Pagamentos' : 'Recebimentos'}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="recebimentos" fill="oklch(50% 0.13 152)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="pagamentos" fill="oklch(53% 0.17 25 / 0.7)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </ChartCard>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────

export function RelatoriosPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart2 className="w-6 h-6 text-accent" />
        <h1 className="text-xl font-semibold text-ink">Relatórios</h1>
      </div>

      <SaldoPorPortador />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GastosPorTag />
        <ComparativoMeses />
      </div>
    </div>
  );
}

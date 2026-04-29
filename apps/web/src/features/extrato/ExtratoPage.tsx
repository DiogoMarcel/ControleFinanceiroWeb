import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, TrendingUp, TrendingDown, Minus,
  BarChart2, List,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import { api } from '@/services/api';

// ── Tipos ──────────────────────────────────────────────────────────────────

interface ExtratoItem {
  idsaldoextrato: number;
  datalancamento: string;
  tiposaldo: string;
  tipoDescricao: string;
  valor: number;
  saldo: number;
  descricao: string;
  id_conta: number | null;
  contaDescricao: string | null;
}

interface EvolucaoPortador {
  idportador: number;
  nomeportador: string;
  nomemembro: string;
  saldoInicio: number;
  saldoFim: number;
  variacao: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function getInicioMes() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function getFimMes() {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
}

// ── Sub-componentes ────────────────────────────────────────────────────────

const TipoIcon = ({ tipo }: { tipo: string }) => {
  if (tipo === 'R') return <TrendingUp className="w-4 h-4 text-ledger-success" />;
  if (tipo === 'P') return <TrendingDown className="w-4 h-4 text-ledger-danger" />;
  return <Minus className="w-4 h-4 text-ink-subtle" />;
};

function LancamentosTab({ data, isLoading, isError }: {
  data?: ExtratoItem[];
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <div className="bg-surface-raised rounded-xl border border-canvas-border overflow-hidden">
      {isLoading ? (
        <div className="divide-y divide-canvas-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4 animate-pulse">
              <div className="w-8 h-8 bg-canvas-border rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-canvas-border rounded w-1/3" />
                <div className="h-3 bg-canvas-border rounded w-1/2" />
              </div>
              <div className="h-4 bg-canvas-border rounded w-24" />
              <div className="h-4 bg-canvas-border rounded w-28" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-ledger-danger text-sm">Erro ao carregar o extrato. Tente novamente.</div>
      ) : !data || data.length === 0 ? (
        <div className="p-8 text-center text-ink-muted text-sm">Nenhum lançamento encontrado no período.</div>
      ) : (
        <>
          <div className="hidden md:grid grid-cols-[140px_1fr_120px_140px] gap-4 px-4 py-2 bg-surface border-b border-canvas-border text-xs font-semibold text-ink-muted uppercase tracking-wide">
            <span>Data</span>
            <span>Descrição</span>
            <span className="text-right">Valor</span>
            <span className="text-right">Saldo</span>
          </div>
          <div className="divide-y divide-canvas-border">
            {data.map((item) => (
              <div
                key={item.idsaldoextrato}
                className="grid grid-cols-[auto_1fr] md:grid-cols-[140px_1fr_120px_140px] gap-x-4 gap-y-0.5 px-4 py-3 items-center hover:bg-surface transition-colors"
              >
                <div className="flex items-center gap-2">
                  <TipoIcon tipo={item.tiposaldo} />
                  <span className="text-sm text-ink-muted whitespace-nowrap">
                    {formatDate(item.datalancamento)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{item.descricao}</p>
                  {item.contaDescricao && (
                    <p className="text-xs text-ink-subtle truncate">{item.contaDescricao}</p>
                  )}
                </div>
                <div className="md:text-right col-start-2 md:col-start-auto">
                  {item.tiposaldo === 'P' ? (
                    <span className="text-sm font-medium text-ledger-danger">-{formatBRL(item.valor)}</span>
                  ) : (
                    <span className="text-sm font-medium text-ledger-success">+{formatBRL(item.valor)}</span>
                  )}
                </div>
                <div className="md:text-right col-start-2 md:col-start-auto">
                  <span className="text-sm text-ink font-semibold">{formatBRL(item.saldo)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-canvas-border bg-surface">
            <p className="text-xs text-ink-subtle">
              {data.length} {data.length === 1 ? 'lançamento' : 'lançamentos'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function EvolucaoPortadoresTab({ data, isLoading, isError }: {
  data?: EvolucaoPortador[];
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-surface-raised rounded-xl border border-canvas-border p-4 h-64 animate-pulse" />
        <div className="bg-surface-raised rounded-xl border border-canvas-border p-4 h-48 animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-surface-raised rounded-xl border border-canvas-border p-8 text-center text-ledger-danger text-sm">
        Erro ao carregar evolução. Tente novamente.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-surface-raised rounded-xl border border-canvas-border p-8 text-center text-ink-muted text-sm">
        Nenhum portador encontrado.
      </div>
    );
  }

  // Apenas portadores com variação no período, ordenados por variação decrescente
  const chartData = [...data]
    .filter((d) => d.variacao !== 0)
    .sort((a, b) => b.variacao - a.variacao)
    .map((d) => ({
      name: d.nomeportador.length > 18 ? d.nomeportador.substring(0, 16) + '…' : d.nomeportador,
      fullName: d.nomeportador,
      variacao: d.variacao,
    }));

  const totalInicio = data.reduce((s, d) => s + d.saldoInicio, 0);
  const totalFim = data.reduce((s, d) => s + d.saldoFim, 0);
  const totalVariacao = totalFim - totalInicio;

  return (
    <div className="space-y-4">
      {/* Totalizadores do período */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Saldo Inicial', value: totalInicio, color: 'text-ink' },
          {
            label: 'Variação',
            value: totalVariacao,
            color: totalVariacao >= 0 ? 'text-ledger-success' : 'text-ledger-danger',
          },
          { label: 'Saldo Final', value: totalFim, color: 'text-accent' },
        ].map((item) => (
          <div key={item.label} className="bg-surface-raised rounded-xl border border-canvas-border p-3 text-center">
            <p className="text-xs text-ink-muted mb-1">{item.label}</p>
            <p className={`text-sm font-bold ${item.color}`}>
              {totalVariacao >= 0 || item.label !== 'Variação' ? '' : ''}{formatBRL(item.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfico de variação por portador */}
      <div className="bg-surface-raised rounded-xl border border-canvas-border p-4">
        <h3 className="text-sm font-semibold text-ink mb-4">
          Variação por Portador no Período
        </h3>
        <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 48 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="oklch(90% 0.012 75)" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: 'oklch(72% 0.01 255)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (Math.abs(v) >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`)}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 11, fill: 'oklch(52% 0.015 255)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [formatBRL(Number(value)), 'Variação']}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
              contentStyle={{ borderRadius: '8px', border: '1px solid oklch(90% 0.012 75)', fontSize: '13px' }}
            />
            <ReferenceLine x={0} stroke="oklch(72% 0.01 255)" />
            <Bar dataKey="variacao" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.variacao >= 0 ? 'oklch(50% 0.13 152)' : 'oklch(53% 0.17 25)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela detalhada */}
      <div className="bg-surface-raised rounded-xl border border-canvas-border overflow-hidden">
        <div className="grid grid-cols-[1fr_110px_110px_110px] gap-2 px-4 py-2 bg-surface border-b border-canvas-border text-xs font-semibold text-ink-muted uppercase tracking-wide">
          <span>Portador</span>
          <span className="text-right">Saldo Inicial</span>
          <span className="text-right">Variação</span>
          <span className="text-right">Saldo Final</span>
        </div>
        <div className="divide-y divide-canvas-border">
          {[...data]
            .sort((a, b) => {
              // Zeros por último; demais ordenados por variação desc
              if (a.variacao === 0 && b.variacao === 0) return 0;
              if (a.variacao === 0) return 1;
              if (b.variacao === 0) return -1;
              return b.variacao - a.variacao;
            })
            .map((item) => (
            <div
              key={item.idportador}
              className="grid grid-cols-[1fr_110px_110px_110px] gap-2 px-4 py-3 items-center hover:bg-surface transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-ink">{item.nomeportador}</p>
                <p className="text-xs text-ink-subtle">{item.nomemembro}</p>
              </div>
              <div className="text-right text-sm text-ink-muted">
                {formatBRL(item.saldoInicio)}
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-semibold ${
                    item.variacao > 0
                      ? 'text-ledger-success'
                      : item.variacao < 0
                      ? 'text-ledger-danger'
                      : 'text-ink-subtle'
                  }`}
                >
                  {item.variacao > 0 ? '+' : ''}{formatBRL(item.variacao)}
                </span>
              </div>
              <div className="text-right text-sm font-semibold text-ink">
                {formatBRL(item.saldoFim)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ── Componente principal ───────────────────────────────────────────────────

export function ExtratoPage() {
  const [inicio, setInicio] = useState(getInicioMes());
  const [fim, setFim] = useState(getFimMes());
  const [tipo, setTipo] = useState('');
  const [aba, setAba] = useState<'lancamentos' | 'portadores'>('lancamentos');

  const lancamentosQuery = useQuery<ExtratoItem[]>({
    queryKey: ['extrato', inicio, fim, tipo],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (inicio) params.inicio = inicio;
      if (fim) params.fim = fim;
      if (tipo) params.tipo = tipo;
      const { data } = await api.get('/extrato', { params });
      return data;
    },
  });

  const evolucaoQuery = useQuery<EvolucaoPortador[]>({
    queryKey: ['extrato-evolucao-portadores', inicio, fim],
    queryFn: async () => {
      const { data } = await api.get('/extrato/evolucao-portadores', {
        params: { inicio, fim },
      });
      return data;
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-accent" />
        <h1 className="text-xl font-semibold text-ink">Extrato</h1>
      </div>

      {/* Filtros */}
      <div className="bg-surface-raised rounded-xl border border-canvas-border p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-ink-muted">De</label>
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="border border-canvas-border rounded-lg px-3 py-2 text-sm bg-surface-raised text-ink focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/60"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-ink-muted">Até</label>
            <input
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              className="border border-canvas-border rounded-lg px-3 py-2 text-sm bg-surface-raised text-ink focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/60"
            />
          </div>
          {aba === 'lancamentos' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink-muted">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="border border-canvas-border rounded-lg px-3 py-2 text-sm bg-surface-raised text-ink focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/60"
              >
                <option value="">Todos</option>
                <option value="P">Pagamento</option>
                <option value="R">Recebimento</option>
                <option value="=">Inicial</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-lg p-1 w-fit border border-canvas-border">
        <button
          onClick={() => setAba('lancamentos')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            aba === 'lancamentos'
              ? 'bg-surface-raised text-ink shadow-sm'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          <List className="w-4 h-4" />
          Lançamentos
        </button>
        <button
          onClick={() => setAba('portadores')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            aba === 'portadores'
              ? 'bg-surface-raised text-ink shadow-sm'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Por Portador
        </button>
      </div>

      {/* Conteúdo da aba */}
      {aba === 'lancamentos' ? (
        <LancamentosTab
          data={lancamentosQuery.data}
          isLoading={lancamentosQuery.isLoading}
          isError={lancamentosQuery.isError}
        />
      ) : (
        <EvolucaoPortadoresTab
          data={evolucaoQuery.data}
          isLoading={evolucaoQuery.isLoading}
          isError={evolucaoQuery.isError}
        />
      )}
    </div>
  );
}

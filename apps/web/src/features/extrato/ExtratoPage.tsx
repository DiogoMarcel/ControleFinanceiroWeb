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
  if (tipo === 'R') return <TrendingUp className="w-4 h-4 text-emerald-600" />;
  if (tipo === 'P') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
};

function LancamentosTab({ data, isLoading, isError }: {
  data?: ExtratoItem[];
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {isLoading ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4 animate-pulse">
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-red-500 text-sm">Erro ao carregar o extrato. Tente novamente.</div>
      ) : !data || data.length === 0 ? (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">Nenhum lançamento encontrado no período.</div>
      ) : (
        <>
          <div className="hidden md:grid grid-cols-[140px_1fr_120px_140px] gap-4 px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <span>Data</span>
            <span>Descrição</span>
            <span className="text-right">Valor</span>
            <span className="text-right">Saldo</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {data.map((item) => (
              <div
                key={item.idsaldoextrato}
                className="grid grid-cols-[auto_1fr] md:grid-cols-[140px_1fr_120px_140px] gap-x-4 gap-y-0.5 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <TipoIcon tipo={item.tiposaldo} />
                  <span className="text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {formatDate(item.datalancamento)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.descricao}</p>
                  {item.contaDescricao && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{item.contaDescricao}</p>
                  )}
                </div>
                <div className="md:text-right col-start-2 md:col-start-auto">
                  {item.tiposaldo === 'P' ? (
                    <span className="text-sm font-medium text-red-500 dark:text-red-400">-{formatBRL(item.valor)}</span>
                  ) : (
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">+{formatBRL(item.valor)}</span>
                  )}
                </div>
                <div className="md:text-right col-start-2 md:col-start-auto">
                  <span className="text-sm text-slate-700 dark:text-slate-300 font-semibold">{formatBRL(item.saldo)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
            <p className="text-xs text-slate-400 dark:text-slate-500">
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
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 h-64 animate-pulse" />
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 h-48 animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-red-500 text-sm">
        Erro ao carregar evolução. Tente novamente.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
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
          { label: 'Saldo Inicial', value: totalInicio, color: 'text-slate-700 dark:text-slate-200' },
          {
            label: 'Variação',
            value: totalVariacao,
            color: totalVariacao >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
          },
          { label: 'Saldo Final', value: totalFim, color: 'text-blue-700 dark:text-blue-400' },
        ].map((item) => (
          <div key={item.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{item.label}</p>
            <p className={`text-sm font-bold ${item.color}`}>
              {totalVariacao >= 0 || item.label !== 'Variação' ? '' : ''}{formatBRL(item.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfico de variação por portador */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Variação por Portador no Período
        </h3>
        <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 48 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (Math.abs(v) >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`)}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [formatBRL(Number(value)), 'Variação']}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
            />
            <ReferenceLine x={0} stroke="#cbd5e1" />
            <Bar dataKey="variacao" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.variacao >= 0 ? '#34d399' : '#f87171'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela detalhada */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-[1fr_110px_110px_110px] gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          <span>Portador</span>
          <span className="text-right">Saldo Inicial</span>
          <span className="text-right">Variação</span>
          <span className="text-right">Saldo Final</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
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
              className="grid grid-cols-[1fr_110px_110px_110px] gap-2 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{item.nomeportador}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{item.nomemembro}</p>
              </div>
              <div className="text-right text-sm text-slate-600 dark:text-slate-300">
                {formatBRL(item.saldoInicio)}
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-semibold ${
                    item.variacao > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : item.variacao < 0
                      ? 'text-red-500 dark:text-red-400'
                      : 'text-slate-400'
                  }`}
                >
                  {item.variacao > 0 ? '+' : ''}{formatBRL(item.variacao)}
                </span>
              </div>
              <div className="text-right text-sm font-semibold text-slate-800 dark:text-white">
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
        <FileText className="w-6 h-6 text-blue-600" />
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Extrato</h1>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">De</label>
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Até</label>
            <input
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {aba === 'lancamentos' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setAba('lancamentos')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            aba === 'lancamentos'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <List className="w-4 h-4" />
          Lançamentos
        </button>
        <button
          onClick={() => setAba('portadores')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            aba === 'portadores'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
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

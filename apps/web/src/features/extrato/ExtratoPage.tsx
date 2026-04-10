import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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

// ── Helpers ────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
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

// ── Componente ─────────────────────────────────────────────────────────────

export function ExtratoPage() {
  const [inicio, setInicio] = useState(getInicioMes());
  const [fim, setFim] = useState(getFimMes());
  const [tipo, setTipo] = useState('');

  const { data, isLoading, isError } = useQuery<ExtratoItem[]>({
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

  const TipoIcon = ({ tipo: t }: { tipo: string }) => {
    if (t === 'R') return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    if (t === 'P') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

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
        </div>
      </div>

      {/* Tabela */}
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
          <div className="p-8 text-center text-red-500 text-sm">
            Erro ao carregar o extrato. Tente novamente.
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            Nenhum lançamento encontrado no período.
          </div>
        ) : (
          <>
            {/* Cabeçalho */}
            <div className="hidden md:grid grid-cols-[140px_1fr_120px_140px] gap-4 px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              <span>Data</span>
              <span>Descrição</span>
              <span className="text-right">Valor</span>
              <span className="text-right">Saldo</span>
            </div>

            {/* Linhas */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {data.map((item) => (
                <div
                  key={item.idsaldoextrato}
                  className="grid grid-cols-[auto_1fr] md:grid-cols-[140px_1fr_120px_140px] gap-x-4 gap-y-0.5 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  {/* Data + ícone */}
                  <div className="flex items-center gap-2">
                    <TipoIcon tipo={item.tiposaldo} />
                    <span className="text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(item.datalancamento)}
                    </span>
                  </div>

                  {/* Descrição */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {item.descricao}
                    </p>
                    {item.contaDescricao && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        {item.contaDescricao}
                      </p>
                    )}
                  </div>

                  {/* Valor */}
                  <div className="md:text-right col-start-2 md:col-start-auto">
                    {item.tiposaldo === 'P' ? (
                      <span className="text-sm font-medium text-red-500 dark:text-red-400">
                        -{formatBRL(item.valor)}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        +{formatBRL(item.valor)}
                      </span>
                    )}
                  </div>

                  {/* Saldo */}
                  <div className="md:text-right col-start-2 md:col-start-auto">
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                      {formatBRL(item.saldo)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé com contagem */}
            <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {data.length} {data.length === 1 ? 'lançamento' : 'lançamentos'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

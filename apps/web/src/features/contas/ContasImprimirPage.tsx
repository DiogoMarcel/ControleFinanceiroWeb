import { useQuery } from '@tanstack/react-query';
import { Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { formatCurrency } from '@/lib/format';

interface ContaRelatorio {
  idconta: number;
  descricao: string;
  valor: number;
  diavencimento: number | null;
  debitacartao: boolean | null;
  debitoauto: boolean | null;
  membrofamilia: { nome: string } | null;
  credor: { nome: string } | null;
}

export function ContasImprimirPage() {
  const navigate = useNavigate();

  const { data: contas = [], isLoading } = useQuery<ContaRelatorio[]>({
    queryKey: ['contas-relatorio'],
    queryFn: async () => (await api.get('/contas/relatorio')).data,
  });

  const total = contas.reduce((s, c) => s + c.valor, 0);
  const agora = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const grupos = contas.reduce<Record<string, ContaRelatorio[]>>((acc, c) => {
    const key = c.diavencimento != null ? String(c.diavencimento).padStart(2, '0') : '—';
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  const gruposOrdenados = Object.entries(grupos).sort(([a], [b]) => {
    if (a === '—') return 1;
    if (b === '—') return -1;
    return Number(a) - Number(b);
  });

  return (
    <>
      {/* Barra de controle — oculta na impressão */}
      <div className="print:hidden flex items-center justify-between mb-4 gap-3">
        <button
          onClick={() => navigate('/contas')}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Salvar PDF
        </button>
      </div>

      {/* Conteúdo A4 */}
      <div className="bg-white text-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 print:border-0 print:rounded-none max-w-2xl mx-auto">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : (
          <div className="p-6 print:p-4">

            {/* Cabeçalho compacto */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-slate-800">
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">Contas a Pagar</h1>
                <p className="text-xs text-slate-500 capitalize">{agora}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Total geral</p>
                <p className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(total)}</p>
              </div>
            </div>

            {/* Tabela única com separadores de dia */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-200">
                  <th className="py-0.5 text-left text-[10px] uppercase tracking-wide font-medium">Descrição</th>
                  <th className="py-0.5 text-left text-[10px] uppercase tracking-wide font-medium">Credor</th>
                  <th className="py-0.5 text-left text-[10px] uppercase tracking-wide font-medium">Membro</th>
                  <th className="py-0.5 text-right text-[10px] uppercase tracking-wide w-24 font-medium">Valor</th>
                  <th className="py-0.5 text-center text-[10px] w-6 font-medium">✓</th>
                </tr>
              </thead>
              <tbody>
                {gruposOrdenados.map(([dia, items]) => {
                  const subtotal = items.reduce((s, c) => s + c.valor, 0);
                  const label = dia === '—' ? 'Sem data' : `Dia ${dia}`;
                  return (
                    <>
                      {/* Separador de dia */}
                      <tr key={`sep-${dia}`} className="bg-slate-100 print:bg-slate-100">
                        <td colSpan={4} className="px-1.5 py-0.5 text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                          {label}
                        </td>
                        <td className="px-1.5 py-0.5 text-[10px] font-bold text-slate-700 tabular-nums text-right">
                          {formatCurrency(subtotal)}
                        </td>
                      </tr>
                      {/* Itens do dia */}
                      {items.map((c, i) => (
                        <tr
                          key={c.idconta}
                          className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50 print:bg-slate-50'}
                        >
                          <td className="py-0.5 text-[11px] text-slate-800 leading-tight">
                            {c.descricao}
                            {(c.debitacartao || c.debitoauto) && (
                              <span className="ml-1 text-[10px] text-slate-400">
                                {c.debitacartao ? '(cartão)' : '(auto)'}
                              </span>
                            )}
                          </td>
                          <td className="py-0.5 text-[11px] text-slate-500 leading-tight">
                            {c.credor?.nome ?? ''}
                          </td>
                          <td className="py-0.5 text-[11px] text-slate-400 leading-tight">
                            {c.membrofamilia?.nome ?? ''}
                          </td>
                          <td className="py-0.5 text-[11px] text-right font-semibold tabular-nums text-slate-800">
                            {formatCurrency(c.valor)}
                          </td>
                          <td className="py-0.5 text-center">
                            <span className="inline-block w-3 h-3 border border-slate-400 rounded-sm" />
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })}
              </tbody>
            </table>

            {/* Rodapé */}
            <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between">
              <p className="text-[10px] text-slate-400">
                {contas.length} conta{contas.length !== 1 ? 's' : ''} · {new Date().toLocaleDateString('pt-BR')}
              </p>
              <p className="text-xs font-bold text-slate-900 tabular-nums">{formatCurrency(total)}</p>
            </div>

          </div>
        )}
      </div>
    </>
  );
}

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

  // Agrupa por membro para subtotais
  const grupos = contas.reduce<Record<string, ContaRelatorio[]>>((acc, c) => {
    const key = c.membrofamilia?.nome ?? 'Compartilhado';
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <>
      {/* Barra de controle — só aparece na tela, não na impressão */}
      <div className="print:hidden flex items-center justify-between mb-6 gap-3">
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
      <div className="bg-white text-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 print:border-0 print:rounded-none print:shadow-none max-w-3xl mx-auto">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : (
          <div className="p-8 print:p-6">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Contas a Pagar</h1>
                <p className="text-sm text-slate-500 mt-0.5 capitalize">{agora}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Total geral</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(total)}</p>
              </div>
            </div>

            {/* Tabela por grupo */}
            {Object.entries(grupos).map(([membro, items]) => {
              const subtotal = items.reduce((s, c) => s + c.valor, 0);
              return (
                <div key={membro} className="mb-6 last:mb-0">
                  {/* Header do grupo */}
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{membro}</h2>
                    <span className="text-sm font-semibold text-slate-700">{formatCurrency(subtotal)}</span>
                  </div>

                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-400 uppercase tracking-wide">
                        <th className="py-1.5 text-left w-8">Dia</th>
                        <th className="py-1.5 text-left">Descrição</th>
                        <th className="py-1.5 text-left hidden sm:table-cell print:table-cell">Credor</th>
                        <th className="py-1.5 text-right w-28">Valor</th>
                        <th className="py-1.5 text-center w-8">✓</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((c) => (
                        <tr key={c.idconta} className="border-b border-slate-100 hover:bg-slate-50 print:hover:bg-transparent">
                          <td className="py-2 text-slate-400 tabular-nums text-xs">
                            {c.diavencimento != null ? (
                              <span className="font-medium text-slate-600">{String(c.diavencimento).padStart(2, '0')}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-2 text-slate-800">
                            <span className="font-medium">{c.descricao}</span>
                            {(c.debitacartao || c.debitoauto) && (
                              <span className="ml-1.5 text-xs text-slate-400">
                                {c.debitacartao ? '(cartão)' : '(auto)'}
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-slate-500 hidden sm:table-cell print:table-cell text-xs">
                            {c.credor?.nome ?? '—'}
                          </td>
                          <td className="py-2 text-right font-semibold tabular-nums text-slate-800">
                            {formatCurrency(c.valor)}
                          </td>
                          <td className="py-2 text-center">
                            {/* Checkbox para marcar à mão na versão impressa */}
                            <span className="inline-block w-4 h-4 border border-slate-400 rounded-sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* Rodapé */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {contas.length} conta{contas.length !== 1 ? 's' : ''} · gerado em {new Date().toLocaleDateString('pt-BR')}
              </p>
              <div className="text-right">
                <p className="text-xs text-slate-400">Total a pagar</p>
                <p className="text-base font-bold text-slate-900">{formatCurrency(total)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

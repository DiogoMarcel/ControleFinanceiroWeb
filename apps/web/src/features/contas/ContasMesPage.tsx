import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RotateCcw, CreditCard, Repeat, FileText, Calendar, Building2, Pencil, Trash2, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { ContaForm } from './components/ContaForm';

// ── Tipos ──────────────────────────────────────────────────────────────────

interface ContaItem {
  idconta: number;
  descricao: string;
  valor: number;
  tipoconta: 'P' | 'R';
  marcado: boolean;
  debitacartao: boolean | null;
  debitoauto: boolean | null;
  pagamentomanual: boolean | null;
  pertenceafolha: boolean | null;
  contaanual: boolean | null;
  id_membrofamilia: number | null;
  id_credor: number | null;
  qtdparcela: number | null;
  diavencimento: number | null;
  membrofamilia: { idmembrofamilia: number; nome: string } | null;
  credor: { idcredor: number; nome: string } | null;
  contatag?: { tags: { idtags: number } | null }[];
}

type Aba = 'P' | 'R';

// ── Componentes internos ───────────────────────────────────────────────────

function ContaIcones({ conta }: { conta: ContaItem }) {
  return (
    <span className="flex items-center gap-1 flex-shrink-0">
      {conta.debitacartao    && <CreditCard  className="w-3.5 h-3.5 text-blue-400"   aria-label="Débita cartão" />}
      {conta.debitoauto      && <Repeat      className="w-3.5 h-3.5 text-violet-400" aria-label="Débito automático" />}
      {conta.pagamentomanual && <FileText    className="w-3.5 h-3.5 text-ink-subtle" aria-label="Pagamento manual" />}
      {conta.contaanual      && <Calendar    className="w-3.5 h-3.5 text-ledger-warning" aria-label="Conta anual" />}
      {conta.pertenceafolha  && <Building2   className="w-3.5 h-3.5 text-indigo-400" aria-label="Pertence à folha" />}
    </span>
  );
}

function ResumoBar({ total, marcado, aba }: { total: number; marcado: number; aba: Aba }) {
  const restante = total - marcado;
  const label = aba === 'P'
    ? [['Total a Pagar', 'Total'], ['Marcado como Pago', 'Pago'], ['Restante', 'Restante']]
    : [['Total a Receber', 'Total'], ['Marcado como Recebido', 'Recebido'], ['Pendente', 'Pendente']];
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { l: label[0], v: total,    cls: 'text-ink' },
        { l: label[1], v: marcado,  cls: 'text-ledger-success' },
        { l: label[2], v: restante, cls: restante > 0 ? 'text-ledger-danger' : 'text-ink' },
      ].map(({ l, v, cls }) => (
        <div key={l[0]} className="bg-surface-raised rounded-xl border border-canvas-border px-2 py-2 sm:px-4 sm:py-3">
          <p className="text-xs text-ink-subtle leading-tight">
            <span className="sm:hidden">{l[1]}</span>
            <span className="hidden sm:inline">{l[0]}</span>
          </p>
          <p className={`text-xs sm:text-sm font-bold tabular-nums mt-0.5 ${cls}`}>{formatCurrency(v)}</p>
        </div>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface-raised rounded-xl shadow-sm w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-canvas-border">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button onClick={onClose}
            className="text-ink-subtle hover:text-ink text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────

export function ContasMesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [aba, setAba] = useState<Aba>('P');
  const [modalNova, setModalNova]             = useState(false);
  const [editandoConta, setEditandoConta]     = useState<ContaItem | null>(null);
  const [deletandoConta, setDeletandoConta]   = useState<ContaItem | null>(null);
  const [erroDelete, setErroDelete]           = useState('');

  const { data: contas = [], isLoading, refetch } = useQuery<ContaItem[]>({
    queryKey: ['contas'],
    queryFn: async () => (await api.get('/contas')).data,
  });

  // Mutação de toggle — atualiza cache otimisticamente
  const toggleMutation = useMutation({
    mutationFn: ({ id, marcado }: { id: number; marcado: boolean }) =>
      api.patch(`/contas/${id}/marcar`, { marcado }),
    onMutate: async ({ id, marcado }) => {
      await qc.cancelQueries({ queryKey: ['contas'] });
      const prev = qc.getQueryData<ContaItem[]>(['contas']);
      qc.setQueryData<ContaItem[]>(['contas'], (old) =>
        old?.map((c) => c.idconta === id ? { ...c, marcado } : c) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['contas'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['contas'] }),
  });

  // Mutação de reiniciar — zera todas marcadas da aba atual
  const reiniciarMutation = useMutation({
    mutationFn: (tipoconta: Aba) => api.post('/contas/reiniciar', { tipoconta }),
    onMutate: async (tipoconta) => {
      await qc.cancelQueries({ queryKey: ['contas'] });
      const prev = qc.getQueryData<ContaItem[]>(['contas']);
      qc.setQueryData<ContaItem[]>(['contas'], (old) =>
        old?.map((c) => c.tipoconta === tipoconta ? { ...c, marcado: false } : c) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['contas'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['contas'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/contas/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contas'] });
      setDeletandoConta(null);
      setErroDelete('');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao excluir';
      setErroDelete(msg);
    },
  });

  // Filtra por aba
  const porTipo = useMemo(() => contas.filter((c) => c.tipoconta === aba), [contas, aba]);

  // Agrupa por membro
  const grupos = useMemo(() => {
    const map = new Map<string, ContaItem[]>();
    for (const c of porTipo) {
      const key = c.membrofamilia?.nome?.trim() ?? 'Compartilhado';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [porTipo]);

  const total       = porTipo.reduce((s, c) => s + c.valor, 0);
  const totalMarcado = porTipo.filter((c) => c.marcado).reduce((s, c) => s + c.valor, 0);
  const qtdMarcadas = porTipo.filter((c) => c.marcado).length;

  const toggleMarca = useCallback((conta: ContaItem, e: React.ChangeEvent<HTMLInputElement>) => {
    toggleMutation.mutate({ id: conta.idconta, marcado: e.target.checked });
  }, [toggleMutation]);

  function abrirEditar(conta: ContaItem, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setEditandoConta(conta);
  }

  function abrirDeletar(conta: ContaItem, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeletandoConta(conta);
    setErroDelete('');
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">Contas</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Contas a pagar e a receber
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/contas/imprimir')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-canvas-border text-ink-muted hover:bg-surface transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
          {qtdMarcadas > 0 && (
            <button
              onClick={() => reiniciarMutation.mutate(aba)}
              disabled={reiniciarMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-canvas-border text-ink-muted hover:bg-surface transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar ({qtdMarcadas})
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setModalNova(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-accent hover:opacity-90 text-white font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Conta
            </button>
          )}
        </div>
      </div>

      {/* Resumo em tempo real */}
      <ResumoBar total={total} marcado={totalMarcado} aba={aba} />

      {/* Abas */}
      <div className="flex rounded-lg border border-canvas-border overflow-hidden self-start">
        {(['P', 'R'] as Aba[]).map((t) => (
          <button
            key={t}
            onClick={() => setAba(t)}
            className={`px-5 py-2 text-sm font-medium transition-colors ${
              aba === t
                ? t === 'P' ? 'bg-ledger-danger text-white' : 'bg-ledger-success text-white'
                : 'bg-surface-raised text-ink-muted hover:bg-surface'
            }`}
          >
            {t === 'P' ? 'A Pagar' : 'A Receber'}
          </button>
        ))}
      </div>

      {/* Lista agrupada por membro */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-surface-raised rounded-xl border border-canvas-border p-4">
              <div className="h-4 w-36 bg-canvas-border rounded mb-3 animate-pulse" />
              <div className="space-y-2">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-9 bg-surface rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : porTipo.length === 0 ? (
        <div className="bg-surface-raised rounded-xl border border-canvas-border p-8 text-center text-sm text-ink-muted">
          Nenhuma conta cadastrada. Use "Nova Conta" para adicionar.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {Array.from(grupos.entries()).map(([membro, items]) => {
            const totalGrupo   = items.reduce((s, c) => s + c.valor, 0);
            const marcadoGrupo = items.filter((c) => c.marcado).reduce((s, c) => s + c.valor, 0);

            return (
              <div key={membro} className="bg-surface-raised rounded-xl border border-canvas-border p-4">
                {/* Header do grupo */}
                <div className="flex items-baseline justify-between pb-2 mb-2 border-b border-canvas-border">
                  <div>
                    <p className="text-xs text-ink-muted">Membro Família</p>
                    <p className="text-sm font-bold text-ink">{membro}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink-muted">Valor Total</p>
                    <p className={cn(
                      'text-sm font-bold tabular-nums',
                      marcadoGrupo > 0 ? 'text-ledger-success' : 'text-ink'
                    )}>
                      {formatCurrency(marcadoGrupo > 0 ? totalGrupo - marcadoGrupo : totalGrupo)}
                    </p>
                  </div>
                </div>

                {/* Linhas */}
                <div className="divide-y divide-canvas-border">
                  {items.map((c) => (
                    <label
                      key={c.idconta}
                      className={cn(
                        'flex items-center gap-2.5 py-2 cursor-pointer group transition-colors rounded-sm',
                        c.marcado && 'opacity-50',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={c.marcado}
                        onChange={(e) => toggleMarca(c, e)}
                        className="w-4 h-4 rounded border-canvas-border text-ledger-success focus:ring-ledger-success flex-shrink-0"
                      />
                      {c.diavencimento != null && (
                        <span className="text-xs font-mono text-ink-subtle flex-shrink-0 w-6 text-right">
                          {c.diavencimento}
                        </span>
                      )}
                      <span className={cn(
                        'flex-1 text-sm text-ink truncate',
                        c.marcado && 'line-through',
                      )}>
                        {c.descricao}
                      </span>
                      <ContaIcones conta={c} />
                      <span className={cn(
                        'text-sm font-semibold tabular-nums flex-shrink-0',
                        c.marcado ? 'text-ledger-success' : 'text-ink',
                      )}>
                        {formatCurrency(c.valor)}
                      </span>
                      {isAdmin && (
                        <span className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={(e) => abrirEditar(c, e)}
                            className="p-1 rounded text-ink-subtle hover:text-accent hover:bg-accent/10"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => abrirDeletar(c, e)}
                            className="p-1 rounded text-ink-subtle hover:text-ledger-danger hover:bg-ledger-danger/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal nova conta */}
      {modalNova && (
        <Modal title="Nova Conta" onClose={() => setModalNova(false)}>
          <ContaForm
            defaultTipo={aba}
            onSuccess={() => { setModalNova(false); refetch(); }}
            onCancel={() => setModalNova(false)}
          />
        </Modal>
      )}

      {/* Modal editar conta */}
      {editandoConta && (
        <Modal title="Editar Conta" onClose={() => setEditandoConta(null)}>
          <ContaForm
            conta={{
              ...editandoConta,
              contaanual:      editandoConta.contaanual      ?? undefined,
              pertenceafolha:  editandoConta.pertenceafolha  ?? undefined,
              debitacartao:    editandoConta.debitacartao    ?? undefined,
              debitoauto:      editandoConta.debitoauto      ?? undefined,
              pagamentomanual: editandoConta.pagamentomanual ?? undefined,
            }}
            onSuccess={() => { setEditandoConta(null); refetch(); }}
            onCancel={() => setEditandoConta(null)}
          />
        </Modal>
      )}

      {/* Modal confirmar exclusão */}
      {deletandoConta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-raised rounded-xl shadow-sm w-full max-w-sm p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Excluir conta</h2>
              <p className="text-sm text-ink-muted mt-1">
                Tem certeza que deseja excluir <strong className="text-ink">{deletandoConta.descricao}</strong>?
              </p>
            </div>
            {erroDelete && (
              <p className="text-xs text-ledger-danger bg-ledger-danger/10 rounded-lg px-3 py-2">{erroDelete}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setDeletandoConta(null); setErroDelete(''); }}
                className="px-4 py-2 text-sm rounded-lg border border-canvas-border text-ink-muted hover:bg-surface transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletandoConta.idconta)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg bg-ledger-danger hover:opacity-90 text-white font-medium transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

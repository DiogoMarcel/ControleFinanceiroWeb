import { useState } from 'react';
import { Plus, Pencil, Trash2, Landmark, Wallet, TrendingUp, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  usePortadores,
  useCreatePortador,
  useUpdatePortador,
  useDeletePortador,
} from './api';
import type { Portador, PortadorInput } from './api';
import { PortadorForm } from './components/PortadorForm';

const tipoLabel: Record<string, string> = {
  C: 'Corrente', D: 'Dinheiro', I: 'Investimento', P: 'Poupança',
};

const tipoIcon: Record<string, React.ReactNode> = {
  C: <Landmark className="w-4 h-4" />,
  D: <Wallet className="w-4 h-4" />,
  I: <TrendingUp className="w-4 h-4" />,
  P: <PiggyBank className="w-4 h-4" />,
};

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface-raised rounded-xl shadow-sm w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-canvas-border">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="text-ink-subtle hover:text-ink transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

interface GrupoMembro {
  id: number;
  nome: string;
  portadores: Portador[];
  saldoGeral: number;
}

export function PortadoresPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data: portadores = [], isLoading } = usePortadores();
  const createMutation = useCreatePortador();
  const updateMutation = useUpdatePortador();
  const deleteMutation = useDeletePortador();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPortador, setEditingPortador] = useState<Portador | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<Portador | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Agrupar por membro
  const grupos = portadores.reduce<GrupoMembro[]>((acc, p) => {
    let g = acc.find((x) => x.id === p.id_membrofamilia);
    if (!g) {
      g = { id: p.id_membrofamilia, nome: p.membrofamilia.nome, portadores: [], saldoGeral: 0 };
      acc.push(g);
    }
    g.portadores.push(p);
    if (!p.saldoportador?.reservado && !p.saldoportador?.contacapital) {
      g.saldoGeral += p.saldoportador?.valor ?? 0;
    }
    return acc;
  }, []);

  function openCreate() {
    setEditingPortador(undefined);
    setModalOpen(true);
    setErrorMsg(null);
  }

  function openEdit(p: Portador) {
    setEditingPortador(p);
    setModalOpen(true);
    setErrorMsg(null);
  }

  async function handleSubmit(data: PortadorInput) {
    try {
      if (editingPortador) {
        await updateMutation.mutateAsync({ id: editingPortador.idportador, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setModalOpen(false);
    } catch {
      setErrorMsg('Erro ao salvar portador. Tente novamente.');
    }
  }

  async function handleDelete(p: Portador) {
    try {
      await deleteMutation.mutateAsync(p.idportador);
      setDeleteConfirm(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Erro ao excluir';
      setErrorMsg(msg);
      setDeleteConfirm(null);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Portadores</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Contas, carteiras e investimentos
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:opacity-90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Portador
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="bg-ledger-danger/10 border border-ledger-danger/30 rounded-xl p-4 text-sm text-ledger-danger">
          {errorMsg}
        </div>
      )}

      {/* Grupos por membro */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="bg-surface-raised rounded-xl border border-canvas-border p-4">
              <div className="h-5 w-40 bg-canvas-border rounded mb-4 animate-pulse" />
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-12 bg-surface rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {grupos.map((grupo) => (
            <div
              key={grupo.id}
              className="bg-surface-raised rounded-xl border border-canvas-border p-4"
            >
              {/* Header do grupo */}
              <div className="flex items-baseline justify-between pb-3 border-b border-canvas-border mb-1">
                <h3 className="text-sm font-semibold text-ink">
                  {grupo.nome.trim()}
                </h3>
                <span className="text-sm font-bold tabular-nums text-ink">
                  {formatCurrency(grupo.saldoGeral)}
                </span>
              </div>

              {/* Lista de portadores */}
              <div className="divide-y divide-canvas-border">
                {grupo.portadores.map((p) => {
                  const saldo = p.saldoportador?.valor ?? 0;
                  const reservado = p.saldoportador?.reservado ?? false;
                  const capital = p.saldoportador?.contacapital ?? false;

                  return (
                    <div key={p.idportador} className="flex items-center gap-3 py-2.5">
                      {/* Ícone tipo */}
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                          reservado
                            ? 'bg-ledger-warning/10 text-ledger-warning'
                            : capital
                              ? 'bg-purple-100 text-purple-600'
                              : 'bg-primary-100 text-primary-600',
                        )}
                      >
                        {tipoIcon[p.tipoconta] ?? <Landmark className="w-4 h-4" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">
                          {p.nomeportador}
                        </p>
                        <p className="text-xs text-ink-subtle leading-tight">
                          {tipoLabel[p.tipoconta] ?? p.tipoconta}
                          {p.agencia && ` · Ag ${p.agencia}`}
                          {p.numeroconta && ` / ${p.numeroconta}${p.digitoconta ? `-${p.digitoconta}` : ''}`}
                          {reservado && ' · Reservado'}
                          {capital && ' · Capital'}
                        </p>
                      </div>

                      {/* Saldo */}
                      <span
                        className={cn(
                          'text-sm font-semibold tabular-nums flex-shrink-0',
                          reservado
                            ? 'text-ledger-warning'
                            : capital
                              ? 'text-purple-600'
                              : 'text-ink',
                        )}
                      >
                        {formatCurrency(saldo)}
                      </span>

                      {/* Ações (admin) */}
                      {isAdmin && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg text-ink-subtle hover:text-accent hover:bg-accent/10 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(p)}
                            className="p-1.5 rounded-lg text-ink-subtle hover:text-ledger-danger hover:bg-ledger-danger/10 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      {modalOpen && (
        <Modal
          title={editingPortador ? 'Editar Portador' : 'Novo Portador'}
          onClose={() => setModalOpen(false)}
        >
          {errorMsg && (
            <p className="text-sm text-ledger-danger mb-3">{errorMsg}</p>
          )}
          <PortadorForm
            portador={editingPortador}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
            loading={isSaving}
          />
        </Modal>
      )}

      {/* Modal confirmar exclusão */}
      {deleteConfirm && (
        <Modal title="Confirmar Exclusão" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-ink mb-4">
            Deseja excluir o portador <strong>{deleteConfirm.nomeportador}</strong>?
            {(deleteConfirm.saldoportador?.valor ?? 0) !== 0 && (
              <span className="block mt-2 text-ledger-danger">
                Este portador possui saldo e não pode ser excluído.
              </span>
            )}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm rounded-lg border border-canvas-border text-ink-muted hover:bg-surface transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              disabled={(deleteConfirm.saldoportador?.valor ?? 0) !== 0 || deleteMutation.isPending}
              className="px-4 py-2 text-sm rounded-lg bg-ledger-danger hover:opacity-90 text-white font-medium transition-colors disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

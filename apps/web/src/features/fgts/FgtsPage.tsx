import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { formatCurrency } from '@/lib/format';

// ── Tipos ──────────────────────────────────────────────────────────────────

interface Membro { idmembrofamilia: number; nome: string; }

interface RegistroFgts {
  idsaldofgts: number;
  nropis: string;
  saldo: number | null;
  id_membrofamilia: number | null;
  membrofamilia: { nome: string } | null;
}

// ── Modal ──────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Formulário ─────────────────────────────────────────────────────────────

interface FgtsFormProps {
  initial?: Partial<RegistroFgts>;
  membros: Membro[];
  onSubmit: (v: { nropis: string; saldo: string; id_membrofamilia: string; senha: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}

function FgtsForm({ initial, membros, onSubmit, onCancel, loading }: FgtsFormProps) {
  const [nropis, setNropis] = useState(initial?.nropis?.trim() ?? '');
  const [saldo, setSaldo] = useState(String(initial?.saldo ?? ''));
  const [idMembro, setIdMembro] = useState(String(initial?.id_membrofamilia ?? ''));
  const [senha, setSenha] = useState('');

  const inputCls = 'w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit({ nropis, saldo, id_membrofamilia: idMembro, senha }); }}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nº OPI *</label>
        <input required value={nropis} onChange={e => setNropis(e.target.value)} maxLength={15} className={inputCls} placeholder="Ex: 00112233" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Membro</label>
        <select value={idMembro} onChange={e => setIdMembro(e.target.value)} className={inputCls}>
          <option value="">Selecione…</option>
          {membros.map(m => <option key={m.idmembrofamilia} value={m.idmembrofamilia}>{m.nome}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Saldo atual (R$)</label>
        <input type="number" step="0.01" min="0" value={saldo} onChange={e => setSaldo(e.target.value)} className={inputCls} placeholder="0,00" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          Senha / PIN
          {initial && <span className="ml-1.5 text-slate-400 font-normal">(deixe em branco para não alterar)</span>}
        </label>
        <input
          type="password"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          maxLength={40}
          className={inputCls}
          placeholder={initial ? '••••••' : 'Opcional'}
          autoComplete="new-password"
        />
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Armazenada de forma segura. Nunca exposta pela API.</p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────

export function FgtsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const qc = useQueryClient();

  const { data: registros = [], isLoading } = useQuery<RegistroFgts[]>({
    queryKey: ['fgts'],
    queryFn: async () => (await api.get('/fgts')).data,
  });

  const { data: membros = [] } = useQuery<Membro[]>({
    queryKey: ['membros'],
    queryFn: async () => (await api.get('/membros')).data,
  });

  const [modal, setModal] = useState<'novo' | 'editar' | null>(null);
  const [editando, setEditando] = useState<RegistroFgts | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const createMut = useMutation({
    mutationFn: (body: object) => api.post('/fgts', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fgts'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setModal(null); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: { id: number } & object) => api.put(`/fgts/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fgts'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setModal(null); setEditando(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/fgts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fgts'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setConfirmDelete(null); },
  });

  function handleSubmit(vals: { nropis: string; saldo: string; id_membrofamilia: string; senha: string }) {
    const body = {
      nropis: vals.nropis,
      saldo: vals.saldo ? Number(vals.saldo) : undefined,
      id_membrofamilia: vals.id_membrofamilia ? Number(vals.id_membrofamilia) : undefined,
      ...(vals.senha ? { senha: vals.senha } : {}),
    };
    if (modal === 'editar' && editando) {
      updateMut.mutate({ id: editando.idsaldofgts, ...body });
    } else {
      createMut.mutate(body);
    }
  }

  const totalFgts = registros.reduce((s, r) => s + (r.saldo ?? 0), 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">FGTS</h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditando(null); setModal('novo'); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Registro
          </button>
        )}
      </div>

      {/* Total */}
      {!isLoading && registros.length > 0 && (
        <div className="mb-5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-500 dark:text-blue-400 font-medium">Total FGTS</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{formatCurrency(totalFgts)}</p>
          </div>
          <Briefcase className="w-8 h-8 text-blue-300 dark:text-blue-700" />
        </div>
      )}

      {/* Lista */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : registros.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-400 dark:text-slate-500 text-sm">
            Nenhum registro de FGTS cadastrado.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {registros.map(r => (
              <li key={r.idsaldofgts} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                {/* Ícone */}
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(r.saldo ?? 0)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-mono">
                      {r.nropis.trim()}
                    </span>
                  </div>
                  {r.membrofamilia && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{r.membrofamilia.nome}</p>
                  )}
                </div>

                {/* Ações */}
                {isAdmin && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {confirmDelete === r.idsaldofgts ? (
                      <>
                        <button onClick={() => deleteMut.mutate(r.idsaldofgts)} disabled={deleteMut.isPending} className="p-1.5 text-red-500 hover:text-red-700 transition-colors" aria-label="Confirmar exclusão">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Cancelar">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditando(r); setModal('editar'); }}
                          className="p-1.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(r.idsaldofgts)}
                          className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          aria-label="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modais */}
      {modal === 'novo' && (
        <Modal title="Novo Registro FGTS" onClose={() => setModal(null)}>
          <FgtsForm
            membros={membros}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
            loading={createMut.isPending}
          />
        </Modal>
      )}
      {modal === 'editar' && editando && (
        <Modal title="Editar Registro FGTS" onClose={() => { setModal(null); setEditando(null); }}>
          <FgtsForm
            initial={editando}
            membros={membros}
            onSubmit={handleSubmit}
            onCancel={() => { setModal(null); setEditando(null); }}
            loading={updateMut.isPending}
          />
        </Modal>
      )}
    </div>
  );
}

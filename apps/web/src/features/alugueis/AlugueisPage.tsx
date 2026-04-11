import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Plus, Pencil, Trash2, X, Check, CheckCircle2, Clock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Tipos ──────────────────────────────────────────────────────────────────

interface AluguelConta {
  idaluguelconta: number;
  id_aluguel: number | null;
  tipoconta: string;
  valor: number;
  descricao: string;
  compartilhado: string;
}

interface Aluguel {
  idaluguel: number;
  dataaluguel: string | null;
  datapagamento: string | null;
  valoraluguel: number | null;
  aluguelconta: AluguelConta[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function anoAtual() { return String(new Date().getFullYear()); }

function mesLabel(date: string) {
  try {
    return format(new Date(date), "MMMM 'de' yyyy", { locale: ptBR });
  } catch { return date; }
}

function isPago(a: Aluguel) { return a.datapagamento !== null; }

// ── Modal ──────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Formulário de Aluguel ─────────────────────────────────────────────────

interface AluguelFormProps {
  initial?: Partial<Aluguel>;
  onSubmit: (v: { dataaluguel: string; valoraluguel: string; datapagamento: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}

function AluguelForm({ initial, onSubmit, onCancel, loading }: AluguelFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [dataaluguel, setData] = useState(
    initial?.dataaluguel ? initial.dataaluguel.slice(0, 10) : today,
  );
  const [valoraluguel, setValor] = useState(String(initial?.valoraluguel ?? ''));
  const [datapagamento, setPagamento] = useState(
    initial?.datapagamento ? initial.datapagamento.slice(0, 10) : '',
  );

  const inputCls = 'w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit({ dataaluguel, valoraluguel, datapagamento }); }}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Data do Aluguel *</label>
        <input required type="date" value={dataaluguel} onChange={e => setData(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Valor (R$)</label>
        <input type="number" step="0.01" min="0" value={valoraluguel} onChange={e => setValor(e.target.value)} className={inputCls} placeholder="0,00" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Data de Pagamento <span className="text-slate-400 font-normal">(deixe vazio se pendente)</span></label>
        <input type="date" value={datapagamento} onChange={e => setPagamento(e.target.value)} className={inputCls} />
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

// ── Formulário de Item (aluguelconta) ────────────────────────────────────

interface ContaFormProps {
  initial?: Partial<AluguelConta>;
  onSubmit: (v: { tipoconta: string; valor: string; descricao: string; compartilhado: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}

function ContaForm({ initial, onSubmit, onCancel, loading }: ContaFormProps) {
  const [tipoconta, setTipo] = useState(initial?.tipoconta ?? 'R');
  const [valor, setValor] = useState(String(initial?.valor ?? ''));
  const [descricao, setDescricao] = useState(initial?.descricao ?? '');
  const [compartilhado, setComp] = useState(initial?.compartilhado ?? 'N');

  const inputCls = 'w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit({ tipoconta, valor, descricao, compartilhado }); }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tipo *</label>
          <select value={tipoconta} onChange={e => setTipo(e.target.value)} className={inputCls}>
            <option value="R">Receita</option>
            <option value="P">Despesa</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Compartilhado</label>
          <select value={compartilhado} onChange={e => setComp(e.target.value)} className={inputCls}>
            <option value="N">Não</option>
            <option value="S">Sim</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Descrição *</label>
        <input required value={descricao} onChange={e => setDescricao(e.target.value)} maxLength={50} className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Valor (R$) *</label>
        <input required type="number" step="0.01" min="0" value={valor} onChange={e => setValor(e.target.value)} className={inputCls} placeholder="0,00" />
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

// ── Painel de Detalhes ────────────────────────────────────────────────────

function DetalhesPanel({ aluguel, isAdmin, ano }: { aluguel: Aluguel; isAdmin: boolean; ano: string }) {
  const qc = useQueryClient();
  const [modalConta, setModalConta] = useState<'nova' | 'editar' | null>(null);
  const [editandoConta, setEditandoConta] = useState<AluguelConta | null>(null);
  const [confirmDeleteConta, setConfirmDeleteConta] = useState<number | null>(null);

  const pago = isPago(aluguel);

  const marcarPagoMut = useMutation({
    mutationFn: () => api.put(`/alugueis/${aluguel.idaluguel}`, {
      datapagamento: pago ? null : new Date().toISOString().slice(0, 10),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alugueis', ano] }),
  });

  const createContaMut = useMutation({
    mutationFn: (body: object) => api.post(`/alugueis/${aluguel.idaluguel}/contas`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alugueis', ano] }); setModalConta(null); },
  });

  const updateContaMut = useMutation({
    mutationFn: ({ id, ...body }: { id: number } & object) =>
      api.put(`/alugueis/${aluguel.idaluguel}/contas/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alugueis', ano] }); setModalConta(null); setEditandoConta(null); },
  });

  const deleteContaMut = useMutation({
    mutationFn: (id: number) => api.delete(`/alugueis/${aluguel.idaluguel}/contas/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alugueis', ano] }); setConfirmDeleteConta(null); },
  });

  function handleContaSubmit(vals: { tipoconta: string; valor: string; descricao: string; compartilhado: string }) {
    const body = { tipoconta: vals.tipoconta, valor: Number(vals.valor), descricao: vals.descricao, compartilhado: vals.compartilhado };
    if (modalConta === 'editar' && editandoConta) {
      updateContaMut.mutate({ id: editandoConta.idaluguelconta, ...body });
    } else {
      createContaMut.mutate(body);
    }
  }

  const receitas = aluguel.aluguelconta.filter(c => c.tipoconta === 'R');
  const despesas = aluguel.aluguelconta.filter(c => c.tipoconta === 'P');
  const totalReceitas = receitas.reduce((s, c) => s + c.valor, 0);
  const totalDespesas = despesas.reduce((s, c) => s + c.valor, 0);
  const liquido = totalReceitas - totalDespesas;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
            {aluguel.dataaluguel ? mesLabel(aluguel.dataaluguel) : '—'}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {aluguel.valoraluguel != null && `Valor base: ${formatCurrency(aluguel.valoraluguel)}`}
            {aluguel.datapagamento && ` · pago em ${formatDate(aluguel.datapagamento)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => marcarPagoMut.mutate()}
              disabled={marcarPagoMut.isPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                pago
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {pago ? <><X className="w-3.5 h-3.5" /> Desmarcar pago</> : <><CheckCircle2 className="w-3.5 h-3.5" /> Marcar como pago</>}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setModalConta('nova')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Item
            </button>
          )}
        </div>
      </div>

      {/* Resumo liquido */}
      {aluguel.aluguelconta.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Receitas</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{formatCurrency(totalReceitas)}</p>
          </div>
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
            <p className="text-xs text-red-500 dark:text-red-400">Despesas</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{formatCurrency(totalDespesas)}</p>
          </div>
          <div className={`rounded-xl border px-4 py-3 ${liquido >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
            <p className="text-xs text-blue-500 dark:text-blue-400">Líquido</p>
            <p className={`text-sm font-semibold mt-0.5 ${liquido >= 0 ? 'text-slate-900 dark:text-white' : 'text-amber-600 dark:text-amber-400'}`}>{formatCurrency(liquido)}</p>
          </div>
        </div>
      )}

      {/* Lista de itens */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {aluguel.aluguelconta.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
            Nenhum item lançado.{isAdmin && ' Clique em "+ Item" para adicionar.'}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {aluguel.aluguelconta.map(c => (
              <li key={c.idaluguelconta} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${c.tipoconta === 'R' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                  {c.tipoconta === 'R' ? 'R' : 'D'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 dark:text-white truncate">{c.descricao}</p>
                  {c.compartilhado === 'S' && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">compartilhado</p>
                  )}
                </div>
                <span className={`text-sm font-semibold whitespace-nowrap ${c.tipoconta === 'R' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {formatCurrency(c.valor)}
                </span>
                {isAdmin && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {confirmDeleteConta === c.idaluguelconta ? (
                      <>
                        <button onClick={() => deleteContaMut.mutate(c.idaluguelconta)} disabled={deleteContaMut.isPending} className="p-1 text-red-500 hover:text-red-700 transition-colors" aria-label="Confirmar">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setConfirmDeleteConta(null)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Cancelar">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditandoConta(c); setModalConta('editar'); }} className="p-1 text-slate-300 hover:text-blue-500 dark:text-slate-600 dark:hover:text-blue-400 transition-colors" aria-label="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setConfirmDeleteConta(c.idaluguelconta)} className="p-1 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors" aria-label="Excluir">
                          <Trash2 className="w-3.5 h-3.5" />
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
      {modalConta === 'nova' && (
        <Modal title="Novo Item" onClose={() => setModalConta(null)}>
          <ContaForm onSubmit={handleContaSubmit} onCancel={() => setModalConta(null)} loading={createContaMut.isPending} />
        </Modal>
      )}
      {modalConta === 'editar' && editandoConta && (
        <Modal title="Editar Item" onClose={() => { setModalConta(null); setEditandoConta(null); }}>
          <ContaForm initial={editandoConta} onSubmit={handleContaSubmit} onCancel={() => { setModalConta(null); setEditandoConta(null); }} loading={updateContaMut.isPending} />
        </Modal>
      )}
    </div>
  );
}

// ── Página Principal ───────────────────────────────────────────────────────

export function AlugueisPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const qc = useQueryClient();

  const [ano, setAno] = useState(anoAtual());
  const [selecionado, setSelecionado] = useState<Aluguel | null>(null);
  const [modal, setModal] = useState<'novo' | 'editar' | null>(null);
  const [editando, setEditando] = useState<Aluguel | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const { data: alugueis = [], isLoading } = useQuery<Aluguel[]>({
    queryKey: ['alugueis', ano],
    queryFn: async () => (await api.get('/alugueis', { params: { ano } })).data,
  });

  const createMut = useMutation({
    mutationFn: (body: object) => api.post('/alugueis', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alugueis', ano] }); setModal(null); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: { id: number } & object) => api.put(`/alugueis/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alugueis', ano] }); setModal(null); setEditando(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/alugueis/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['alugueis', ano] });
      if (selecionado?.idaluguel === id) setSelecionado(null);
      setConfirmDelete(null);
    },
  });

  function handleSubmit(vals: { dataaluguel: string; valoraluguel: string; datapagamento: string }) {
    const body = {
      dataaluguel: vals.dataaluguel,
      valoraluguel: vals.valoraluguel ? Number(vals.valoraluguel) : undefined,
      datapagamento: vals.datapagamento || undefined,
    };
    if (modal === 'editar' && editando) {
      updateMut.mutate({ id: editando.idaluguel, ...body });
    } else {
      createMut.mutate(body);
    }
  }

  const pagos = alugueis.filter(isPago);
  const pendentes = alugueis.filter(a => !isPago(a));
  const totalPago = pagos.reduce((s, a) => s + (a.valoraluguel ?? 0), 0);
  const totalPendente = pendentes.reduce((s, a) => s + (a.valoraluguel ?? 0), 0);

  const anos = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));
  const inputCls = 'border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Aluguéis</h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={ano} onChange={e => { setAno(e.target.value); setSelecionado(null); }} className={inputCls}>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {isAdmin && (
            <button
              onClick={() => { setEditando(null); setModal('novo'); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Novo Lançamento
            </button>
          )}
        </div>
      </div>

      {/* Stats do ano */}
      {!isLoading && alugueis.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Recebido</p>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(totalPago)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{pagos.length} lançamento{pagos.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-xs text-amber-600 dark:text-amber-400">Pendente</p>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(totalPendente)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{pendentes.length} lançamento{pendentes.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 px-4 py-3 col-span-2 sm:col-span-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total {ano}</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(totalPago + totalPendente)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{alugueis.length} lançamento{alugueis.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Lista */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden self-start">
          {isLoading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-4 animate-pulse space-y-1.5">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : alugueis.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              Nenhum lançamento em {ano}.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {alugueis.map(a => (
                <li
                  key={a.idaluguel}
                  onClick={() => setSelecionado(a)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    selecionado?.idaluguel === a.idaluguel
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {isPago(a)
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      : <Clock className="w-4 h-4 text-amber-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate capitalize">
                      {a.dataaluguel ? format(new Date(a.dataaluguel), 'MMM/yyyy', { locale: ptBR }) : '—'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {a.valoraluguel != null ? formatCurrency(a.valoraluguel) : 'sem valor'}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {confirmDelete === a.idaluguel ? (
                        <>
                          <button onClick={() => deleteMut.mutate(a.idaluguel)} className="p-1 text-red-500 hover:text-red-700" aria-label="Confirmar">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Cancelar">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditando(a); setModal('editar'); }} className="p-1 text-slate-400 hover:text-blue-500 transition-colors" aria-label="Editar">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setConfirmDelete(a.idaluguel)} className="p-1 text-slate-400 hover:text-red-500 transition-colors" aria-label="Excluir">
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Painel de detalhes */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          {selecionado ? (
            <DetalhesPanel
              aluguel={selecionado}
              isAdmin={isAdmin}
              ano={ano}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500 text-sm gap-2">
              <Building2 className="w-8 h-8 opacity-30" />
              <p>Selecione um lançamento para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      {/* Modais Aluguel */}
      {modal === 'novo' && (
        <Modal title="Novo Lançamento" onClose={() => setModal(null)}>
          <AluguelForm onSubmit={handleSubmit} onCancel={() => setModal(null)} loading={createMut.isPending} />
        </Modal>
      )}
      {modal === 'editar' && editando && (
        <Modal title="Editar Lançamento" onClose={() => { setModal(null); setEditando(null); }}>
          <AluguelForm initial={editando} onSubmit={handleSubmit} onCancel={() => { setModal(null); setEditando(null); }} loading={updateMut.isPending} />
        </Modal>
      )}
    </div>
  );
}

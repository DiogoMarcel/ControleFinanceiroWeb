import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, X, Check,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/format';

// ── Tipos ──────────────────────────────────────────────────────────────────

interface Membro { idmembrofamilia: number; nome: string; }

interface Cartao {
  idcartao: number;
  nome: string;
  diavencimento: number | null;
  bandeira: string | null;
  id_membrofamilia: number | null;
  membrofamilia: { nome: string } | null;
}

interface Despesa {
  iddespesacartao: number;
  descricao: string;
  valor: number | null;
  datadespesa: string | null;
}

interface DespesasResponse { despesas: Despesa[]; total: number; }

// ── Helpers ────────────────────────────────────────────────────────────────

function mesStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function mesLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

// ── Hooks ──────────────────────────────────────────────────────────────────

function useCartoes() {
  return useQuery<Cartao[]>({
    queryKey: ['cartoes'],
    queryFn: async () => (await api.get('/cartoes')).data,
  });
}

function useMembros() {
  return useQuery<Membro[]>({
    queryKey: ['membros'],
    queryFn: async () => (await api.get('/membros')).data,
  });
}

function useDespesas(idcartao: number | null, mes: string) {
  return useQuery<DespesasResponse>({
    queryKey: ['despesas', idcartao, mes],
    queryFn: async () => (await api.get(`/cartoes/${idcartao}/despesas`, { params: { mes } })).data,
    enabled: idcartao !== null,
  });
}

// ── Formulário de Cartão ───────────────────────────────────────────────────

interface CartaoFormProps {
  initial?: Partial<Cartao>;
  membros: Membro[];
  onSubmit: (values: { nome: string; diavencimento?: number; bandeira?: string; id_membrofamilia?: number }) => void;
  onCancel: () => void;
  loading?: boolean;
}

function CartaoForm({ initial, membros, onSubmit, onCancel, loading }: CartaoFormProps) {
  const [nome, setNome] = useState(initial?.nome ?? '');
  const [diavencimento, setDiavencimento] = useState(String(initial?.diavencimento ?? ''));
  const [bandeira, setBandeira] = useState(initial?.bandeira ?? '');
  const [id_membrofamilia, setIdMembro] = useState(String(initial?.id_membrofamilia ?? ''));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      nome,
      diavencimento: diavencimento ? Number(diavencimento) : undefined,
      bandeira: bandeira || undefined,
      id_membrofamilia: id_membrofamilia ? Number(id_membrofamilia) : undefined,
    });
  }

  const inputCls = 'w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nome *</label>
        <input required value={nome} onChange={e => setNome(e.target.value)} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Dia Vencimento</label>
          <input type="number" min={1} max={31} value={diavencimento} onChange={e => setDiavencimento(e.target.value)} className={inputCls} placeholder="Ex: 15" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bandeira</label>
          <select value={bandeira} onChange={e => setBandeira(e.target.value)} className={inputCls}>
            <option value="">—</option>
            <option>Visa</option>
            <option>Mastercard</option>
            <option>Elo</option>
            <option>Hipercard</option>
            <option>American Express</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Membro</label>
        <select value={id_membrofamilia} onChange={e => setIdMembro(e.target.value)} className={inputCls}>
          <option value="">Compartilhado</option>
          {membros.map(m => <option key={m.idmembrofamilia} value={m.idmembrofamilia}>{m.nome}</option>)}
        </select>
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

// ── Formulário de Despesa ──────────────────────────────────────────────────

function DespesaForm({ idcartao, mes, onDone }: { idcartao: number; mes: string; onDone: () => void }) {
  const qc = useQueryClient();
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(() => {
    const [ano, m] = mes.split('-');
    return `${ano}-${m}-${String(new Date().getDate()).padStart(2, '0')}`;
  });
  const [erro, setErro] = useState('');

  const mutation = useMutation({
    mutationFn: (body: { descricao: string; valor: number; data: string }) =>
      api.post(`/cartoes/${idcartao}/despesas`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['despesas', idcartao] });
      onDone();
    },
    onError: () => setErro('Erro ao lançar despesa.'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!descricao || !valor) return;
    mutation.mutate({ descricao, valor: Number(valor.replace(',', '.')), data });
  }

  const inputCls = 'w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Descrição *</label>
        <input required value={descricao} onChange={e => setDescricao(e.target.value)} maxLength={30} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Valor (R$) *</label>
          <input required value={valor} onChange={e => setValor(e.target.value)} inputMode="decimal" className={inputCls} placeholder="0,00" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Data</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)} className={inputCls} />
        </div>
      </div>
      {erro && <p className="text-xs text-red-500">{erro}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onDone} className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {mutation.isPending ? 'Salvando…' : 'Lançar'}
        </button>
      </div>
    </form>
  );
}

// ── Painel de Despesas ─────────────────────────────────────────────────────

function DespesasPanel({ cartao }: { cartao: Cartao }) {
  const qc = useQueryClient();
  const [mesAtual, setMesAtual] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const ms = mesStr(mesAtual);
  const { data, isLoading } = useDespesas(cartao.idcartao, ms);

  const deleteMut = useMutation({
    mutationFn: (idDespesa: number) =>
      api.delete(`/cartoes/${cartao.idcartao}/despesas/${idDespesa}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['despesas', cartao.idcartao] });
      setConfirmDelete(null);
    },
  });

  function navMes(delta: number) {
    setMesAtual(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho do painel */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navMes(-1)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize w-36 text-center">
            {mesLabel(mesAtual)}
          </span>
          <button onClick={() => navMes(1)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Lançar
        </button>
      </div>

      {/* Total */}
      {data && (
        <div className="mb-3 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total do mês</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatCurrency(data.total)}
          </span>
        </div>
      )}

      {/* Lista */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 rounded-lg border border-slate-200 dark:border-slate-700">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-3 animate-pulse">
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
              </div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
            </div>
          ))
        ) : !data?.despesas.length ? (
          <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
            Nenhuma despesa neste mês.
          </div>
        ) : (
          data.despesas.map(d => (
            <div key={d.iddespesacartao} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{d.descricao}</p>
                {d.datadespesa && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(d.datadespesa)}</p>
                )}
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {formatCurrency(d.valor ?? 0)}
              </span>
              {confirmDelete === d.iddespesacartao ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => deleteMut.mutate(d.iddespesacartao)}
                    disabled={deleteMut.isPending}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    aria-label="Confirmar exclusão"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    aria-label="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(d.iddespesacartao)}
                  className="p-1 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors"
                  aria-label="Excluir despesa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal lançar despesa */}
      {showForm && (
        <Modal title="Lançar Despesa" onClose={() => setShowForm(false)}>
          <DespesaForm idcartao={cartao.idcartao} mes={ms} onDone={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}

// ── Página Principal ───────────────────────────────────────────────────────

export function CartoesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const qc = useQueryClient();

  const { data: cartoes = [], isLoading } = useCartoes();
  const { data: membros = [] } = useMembros();

  const [selecionado, setSelecionado] = useState<Cartao | null>(null);
  const [modal, setModal] = useState<'novo' | 'editar' | null>(null);
  const [editando, setEditando] = useState<Cartao | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [erro, setErro] = useState('');

  const createMut = useMutation({
    mutationFn: (body: object) => api.post('/cartoes', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cartoes'] }); setModal(null); },
    onError: () => setErro('Erro ao criar cartão.'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: { id: number } & object) => api.put(`/cartoes/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cartoes'] }); setModal(null); setEditando(null); },
    onError: () => setErro('Erro ao atualizar cartão.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/cartoes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cartoes'] });
      if (selecionado?.idcartao === confirmDelete) setSelecionado(null);
      setConfirmDelete(null);
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Cartões</h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setErro(''); setModal('novo'); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Cartão
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Lista de cartões */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-4 animate-pulse space-y-1.5">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : cartoes.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              Nenhum cartão cadastrado.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {cartoes.map(c => (
                <li
                  key={c.idcartao}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    selecionado?.idcartao === c.idcartao
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                  onClick={() => setSelecionado(c)}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.nome}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {[c.bandeira, c.diavencimento ? `vence dia ${c.diavencimento}` : null, c.membrofamilia?.nome].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {confirmDelete === c.idcartao ? (
                        <>
                          <button onClick={() => deleteMut.mutate(c.idcartao)} className="p-1 text-red-500 hover:text-red-700" aria-label="Confirmar">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Cancelar">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditando(c); setErro(''); setModal('editar'); }}
                            className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                            aria-label="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(c.idcartao)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            aria-label="Excluir"
                          >
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

        {/* Painel de despesas */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          {selecionado ? (
            <DespesasPanel cartao={selecionado} />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500 text-sm gap-2">
              <CreditCard className="w-8 h-8 opacity-30" />
              <p>Selecione um cartão para ver as despesas</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Cartão */}
      {modal === 'novo' && (
        <Modal title="Novo Cartão" onClose={() => setModal(null)}>
          {erro && <p className="mb-3 text-xs text-red-500">{erro}</p>}
          <CartaoForm
            membros={membros}
            onSubmit={values => createMut.mutate(values)}
            onCancel={() => setModal(null)}
            loading={createMut.isPending}
          />
        </Modal>
      )}

      {/* Modal Editar Cartão */}
      {modal === 'editar' && editando && (
        <Modal title="Editar Cartão" onClose={() => { setModal(null); setEditando(null); }}>
          {erro && <p className="mb-3 text-xs text-red-500">{erro}</p>}
          <CartaoForm
            initial={editando}
            membros={membros}
            onSubmit={values => updateMut.mutate({ id: editando.idcartao, ...values })}
            onCancel={() => { setModal(null); setEditando(null); }}
            loading={updateMut.isPending}
          />
        </Modal>
      )}
    </div>
  );
}

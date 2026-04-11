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
  tipoconta: string;       // 'R'=receita/cobrança | 'P'=pagamento/desconto
  valor: number;           // pode ser negativo no banco (legado Delphi)
  descricao: string;
  compartilhado: string;   // 'V'=ambos(÷2) | 'S'=só comp | 'F'=só meu lado
}

interface AluguelComp {
  idaluguelcomp: number;
  id_aluguel: number | null;
  datapagamento: string | null;
}

interface Aluguel {
  idaluguel: number;
  dataaluguel: string | null;
  datapagamento: string | null;
  valoraluguel: number | null;
  aluguelconta: AluguelConta[];
  aluguelcomp: AluguelComp[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function anoAtual() { return String(new Date().getFullYear()); }

// dataaluguel pode chegar como "2026-03-01T00:00:00.000Z" ou "2026-03-01"
function toDateStr(date: string) { return date.length > 10 ? date.slice(0, 10) : date; }

function mesAnoLabel(date: string) {
  try {
    return format(new Date(toDateStr(date) + 'T12:00:00'), "MMMM '/' yyyy", { locale: ptBR });
  } catch { return date; }
}

function mesAnoShort(date: string) {
  try {
    return format(new Date(toDateStr(date) + 'T12:00:00'), 'MMM/yyyy', { locale: ptBR });
  } catch { return date; }
}

function isPago(a: Aluguel) { return a.datapagamento !== null; }
function isPagoComp(a: Aluguel) { return (a.aluguelcomp[0]?.datapagamento ?? null) !== null; }

/**
 * Valor efetivo de um item, respeitando tipoconta como sinal:
 * 'R' → positivo (cobrança/receita)
 * 'P' → negativo (pagamento/desconto)
 * Normaliza também valores negativos no banco (legado Delphi).
 */
function effectiveValor(c: AluguelConta): number {
  return c.tipoconta === 'R' ? Math.abs(c.valor) : -Math.abs(c.valor);
}

/**
 * LEFT total = valoraluguel
 *   + soma dos itens 'F' (só meu lado) pelo effectiveValor
 *   + soma dos itens 'V' (ambos) pelo effectiveValor/2
 */
function calcMeuLado(a: Aluguel): number {
  const base = a.valoraluguel ?? 0;
  const f = a.aluguelconta.filter(c => c.compartilhado === 'F')
    .reduce((s, c) => s + effectiveValor(c), 0);
  const v = a.aluguelconta.filter(c => c.compartilhado === 'V')
    .reduce((s, c) => s + effectiveValor(c) / 2, 0);
  return base + f + v;
}

/**
 * RIGHT total = valoraluguel/2 (o que pago ao comp)
 *   − soma dos itens 'S' (só comp) pelo effectiveValor
 *   − soma dos itens 'V' (ambos) pelo effectiveValor/2
 * Positivo = ainda pago ao comp; Negativo = comp me paga.
 */
function calcCompLado(a: Aluguel): number {
  const compBase = (a.valoraluguel ?? 0) / 2;
  const s = a.aluguelconta.filter(c => c.compartilhado === 'S')
    .reduce((s, c) => s + effectiveValor(c), 0);
  const v = a.aluguelconta.filter(c => c.compartilhado === 'V')
    .reduce((s, c) => s + effectiveValor(c) / 2, 0);
  return compBase - s - v;
}

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
  valorSugerido?: number | null;
  onSubmit: (v: { dataaluguel: string; valoraluguel: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}

function AluguelForm({ initial, valorSugerido, onSubmit, onCancel, loading }: AluguelFormProps) {
  const mesInicial = initial?.dataaluguel
    ? toDateStr(initial.dataaluguel).slice(0, 7)
    : (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      })();

  const [mes, setMes] = useState(mesInicial);
  const [valoraluguel, setValor] = useState(
    initial?.valoraluguel != null
      ? String(initial.valoraluguel)
      : valorSugerido != null ? String(valorSugerido) : '',
  );

  const inputCls = 'w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSubmit({ dataaluguel: `${mes}-01`, valoraluguel });
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Mês / Ano *</label>
        <input required type="month" value={mes} onChange={e => setMes(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          Valor total do aluguel (R$)
          {!initial && valorSugerido != null && (
            <span className="ml-1.5 text-slate-400 font-normal">— sugerido do mês anterior</span>
          )}
        </label>
        <input
          type="number" step="0.01" min="0"
          value={valoraluguel} onChange={e => setValor(e.target.value)}
          className={inputCls} placeholder="0,00"
        />
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

// ── Formulário de Item ─────────────────────────────────────────────────────

interface ContaFormProps {
  initial?: Partial<AluguelConta>;
  onSubmit: (v: { tipoconta: string; valor: string; descricao: string; compartilhado: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}

function ContaForm({ initial, onSubmit, onCancel, loading }: ContaFormProps) {
  const [tipoconta, setTipo] = useState(initial?.tipoconta ?? 'R');
  // valor exibido sempre positivo; tipoconta determina o sinal
  const [valor, setValor] = useState(initial?.valor != null ? String(Math.abs(initial.valor)) : '');
  const [descricao, setDescricao] = useState(initial?.descricao ?? '');
  // default 'V' para novos itens compartilhados
  const [compartilhado, setComp] = useState(initial?.compartilhado ?? 'V');

  const inputCls = 'w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  const hints: Record<string, string> = {
    V: 'Aparece em AMBOS os lados, cada um paga metade (ex: água, internet).',
    S: 'Aparece só no lado COMPARTILHADO — o comp me deve o valor integral.',
    F: 'Aparece só no MEU LADO (ex: luz individual, pagamento do inquilino).',
  };

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit({ tipoconta, valor, descricao, compartilhado }); }}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Descrição *</label>
        <input required value={descricao} onChange={e => setDescricao(e.target.value)} maxLength={50} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tipo *</label>
          <select value={tipoconta} onChange={e => setTipo(e.target.value)} className={inputCls}>
            <option value="R">Cobrança (+)</option>
            <option value="P">Desconto / Pagto (−)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Valor (R$) *</label>
          <input required type="number" step="0.01" min="0" value={valor} onChange={e => setValor(e.target.value)} className={inputCls} placeholder="0,00" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Visibilidade</label>
        <select value={compartilhado} onChange={e => setComp(e.target.value)} className={inputCls}>
          <option value="V">Ambos — cada lado paga metade</option>
          <option value="S">Só compartilhado — comp me deve o total</option>
          <option value="F">Só meu lado — não afeta o comp</option>
        </select>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{hints[compartilhado]}</p>
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

// ── Linha de item ──────────────────────────────────────────────────────────

function ItemRow({
  conta, half, isAdmin, onEdit, onDelete, deleting,
}: {
  conta: AluguelConta;
  half?: boolean;         // V items mostram valor/2
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [confirm, setConfirm] = useState(false);

  const badgeMap: Record<string, { label: string; cls: string }> = {
    V: { label: 'Ambos', cls: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
    S: { label: 'Comp', cls: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' },
    F: { label: 'Meu', cls: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400' },
  };
  const badge = badgeMap[conta.compartilhado] ?? badgeMap['F'];

  const absVal = Math.abs(conta.valor);
  const displayVal = half ? absVal / 2 : absVal;
  const isPositive = conta.tipoconta === 'R';

  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-lg transition-colors">
      <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
      <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{conta.descricao}</span>
      <span className={`text-sm font-semibold whitespace-nowrap ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
        {isPositive ? '+' : '−'}{formatCurrency(displayVal)}
      </span>
      {isAdmin && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {confirm ? (
            <>
              <button onClick={() => { onDelete(); setConfirm(false); }} disabled={deleting} className="p-1 text-red-500 hover:text-red-700 transition-colors" aria-label="Confirmar">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setConfirm(false)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Cancelar">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button onClick={onEdit} className="p-1 text-slate-300 hover:text-blue-500 dark:text-slate-600 dark:hover:text-blue-400 transition-colors" aria-label="Editar">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setConfirm(true)} className="p-1 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors" aria-label="Excluir">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Painel de Detalhes — dois lados ───────────────────────────────────────

function DetalhesPanel({ aluguel, isAdmin, ano }: { aluguel: Aluguel; isAdmin: boolean; ano: string }) {
  const qc = useQueryClient();
  const [modalConta, setModalConta] = useState<'nova' | 'editar' | null>(null);
  const [editandoConta, setEditandoConta] = useState<AluguelConta | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const marcarPagoMut = useMutation({
    mutationFn: () => api.put(`/alugueis/${aluguel.idaluguel}`, {
      datapagamento: isPago(aluguel) ? null : today,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alugueis', ano] }),
  });

  const marcarCompMut = useMutation({
    mutationFn: () => api.patch(`/alugueis/${aluguel.idaluguel}/comp`, {
      datapagamento: isPagoComp(aluguel) ? null : today,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alugueis', ano] }),
  });

  function handleContaSubmit(vals: { tipoconta: string; valor: string; descricao: string; compartilhado: string }) {
    const body = {
      tipoconta: vals.tipoconta,
      valor: Number(vals.valor),
      descricao: vals.descricao,
      compartilhado: vals.compartilhado,
    };
    if (modalConta === 'editar' && editandoConta) {
      updateContaMut.mutate({ id: editandoConta.idaluguelconta, ...body });
    } else {
      createContaMut.mutate(body);
    }
  }

  const valor = aluguel.valoraluguel ?? 0;

  // Separar itens por compartilhado
  const itensF = aluguel.aluguelconta.filter(c => c.compartilhado === 'F');
  const itensV = aluguel.aluguelconta.filter(c => c.compartilhado === 'V');
  const itensS = aluguel.aluguelconta.filter(c => c.compartilhado === 'S');

  const totalMeu = calcMeuLado(aluguel);
  const netComp = calcCompLado(aluguel);

  const compDataPag = aluguel.aluguelcomp[0]?.datapagamento ?? null;

  const btnCls = (ativo: boolean) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
      ativo
        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
    }`;

  return (
    <div className="flex flex-col gap-4">
      {/* Título + botão de item */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
          {aluguel.dataaluguel ? mesAnoLabel(aluguel.dataaluguel) : '—'}
        </h3>
        {isAdmin && (
          <button
            onClick={() => { setEditandoConta(null); setModalConta('nova'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Item
          </button>
        )}
      </div>

      {/* Dois lados */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* ── Meu Lado — F + V(÷2) ──────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Meu Lado</p>
              {isAdmin && (
                <button onClick={() => marcarPagoMut.mutate()} disabled={marcarPagoMut.isPending} className={btnCls(isPago(aluguel))}>
                  {isPago(aluguel)
                    ? <><CheckCircle2 className="w-3.5 h-3.5" /> Pago {formatDate(aluguel.datapagamento!)}</>
                    : <><Clock className="w-3.5 h-3.5" /> Marcar pago</>
                  }
                </button>
              )}
              {!isAdmin && isPago(aluguel) && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">Pago {formatDate(aluguel.datapagamento!)}</span>
              )}
            </div>
          </div>

          <div className="px-4 py-3 space-y-1">
            {/* Aluguel base */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-700 mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Aluguel</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(valor)}</span>
            </div>

            {/* Itens F (só meu) e V (ambos, mostrar ÷2) */}
            {itensF.length === 0 && itensV.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-2 text-center">Sem cobranças.</p>
            ) : (
              <>
                {itensF.map(c => (
                  <ItemRow key={c.idaluguelconta} conta={c} half={false} isAdmin={isAdmin}
                    onEdit={() => { setEditandoConta(c); setModalConta('editar'); }}
                    onDelete={() => deleteContaMut.mutate(c.idaluguelconta)}
                    deleting={deleteContaMut.isPending}
                  />
                ))}
                {itensV.map(c => (
                  <ItemRow key={c.idaluguelconta} conta={c} half={true} isAdmin={isAdmin}
                    onEdit={() => { setEditandoConta(c); setModalConta('editar'); }}
                    onDelete={() => deleteContaMut.mutate(c.idaluguelconta)}
                    deleting={deleteContaMut.isPending}
                  />
                ))}
              </>
            )}
          </div>

          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Total</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(totalMeu)}</span>
          </div>
        </div>

        {/* ── Compartilhado — S + V(÷2) ────────────────────────── */}
        <div className="rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden">
          <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">Compartilhado</p>
              {isAdmin && (
                <button onClick={() => marcarCompMut.mutate()} disabled={marcarCompMut.isPending} className={btnCls(isPagoComp(aluguel))}>
                  {isPagoComp(aluguel)
                    ? <><CheckCircle2 className="w-3.5 h-3.5" /> Pago {formatDate(compDataPag!)}</>
                    : <><Clock className="w-3.5 h-3.5" /> Marcar pago</>
                  }
                </button>
              )}
              {!isAdmin && isPagoComp(aluguel) && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">Pago {formatDate(compDataPag!)}</span>
              )}
            </div>
          </div>

          <div className="px-4 py-3 space-y-1">
            {/* Minha parte do aluguel paga ao comp */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-700 mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Aluguel (pago ao comp)</span>
              <span className="text-sm font-semibold text-red-500 dark:text-red-400">−{formatCurrency(valor / 2)}</span>
            </div>

            {/* Itens S (só comp) e V (ambos, ÷2) — o comp me deve esses valores */}
            {itensS.length === 0 && itensV.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-2 text-center">Sem cobranças ao compartilhado.</p>
            ) : (
              <>
                {itensV.map(c => (
                  <ItemRow key={c.idaluguelconta} conta={c} half={true} isAdmin={isAdmin}
                    onEdit={() => { setEditandoConta(c); setModalConta('editar'); }}
                    onDelete={() => deleteContaMut.mutate(c.idaluguelconta)}
                    deleting={deleteContaMut.isPending}
                  />
                ))}
                {itensS.map(c => (
                  <ItemRow key={c.idaluguelconta} conta={c} half={false} isAdmin={isAdmin}
                    onEdit={() => { setEditandoConta(c); setModalConta('editar'); }}
                    onDelete={() => deleteContaMut.mutate(c.idaluguelconta)}
                    deleting={deleteContaMut.isPending}
                  />
                ))}
              </>
            )}
          </div>

          <div className="px-4 py-3 border-t border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10 flex justify-between items-center">
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
              {netComp >= 0 ? 'Pago ao comp' : 'Comp me paga'}
            </span>
            <span className={`text-sm font-bold ${netComp >= 0 ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {formatCurrency(Math.abs(netComp))}
            </span>
          </div>
        </div>
      </div>

      {/* Modais */}
      {(modalConta === 'nova' || (modalConta === 'editar' && editandoConta)) && (
        <Modal
          title={modalConta === 'nova' ? 'Novo Item' : 'Editar Item'}
          onClose={() => { setModalConta(null); setEditandoConta(null); }}
        >
          <ContaForm
            initial={editandoConta ?? undefined}
            onSubmit={handleContaSubmit}
            onCancel={() => { setModalConta(null); setEditandoConta(null); }}
            loading={createContaMut.isPending || updateContaMut.isPending}
          />
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
  const [selecionadoId, setSelecionadoId] = useState<number | null>(null);
  const [modal, setModal] = useState<'novo' | 'editar' | null>(null);
  const [editando, setEditando] = useState<Aluguel | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const { data: alugueis = [], isLoading } = useQuery<Aluguel[]>({
    queryKey: ['alugueis', ano],
    queryFn: async () => (await api.get('/alugueis', { params: { ano } })).data,
  });

  const { data: ultimo } = useQuery<{ valoraluguel: number | null } | null>({
    queryKey: ['alugueis', 'ultimo'],
    queryFn: async () => (await api.get('/alugueis/ultimo')).data,
    staleTime: 60_000,
  });

  const selecionado = alugueis.find(a => a.idaluguel === selecionadoId) ?? null;
  const valorSugerido = alugueis[0]?.valoraluguel ?? ultimo?.valoraluguel ?? null;

  const createMut = useMutation({
    mutationFn: (body: object) => api.post('/alugueis', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alugueis'] }); setModal(null); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: { id: number } & object) => api.put(`/alugueis/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alugueis', ano] }); setModal(null); setEditando(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/alugueis/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['alugueis', ano] });
      if (selecionadoId === id) setSelecionadoId(null);
      setConfirmDelete(null);
    },
  });

  function handleSubmit(vals: { dataaluguel: string; valoraluguel: string }) {
    const body = {
      dataaluguel: vals.dataaluguel,
      valoraluguel: vals.valoraluguel ? Number(vals.valoraluguel) : undefined,
    };
    if (modal === 'editar' && editando) {
      updateMut.mutate({ id: editando.idaluguel, ...body });
    } else {
      createMut.mutate(body);
    }
  }

  const pagos = alugueis.filter(isPago);
  const pendentes = alugueis.filter(a => !isPago(a));
  const totalRecebido = pagos.reduce((s, a) => s + calcMeuLado(a), 0);
  const totalPendente = pendentes.reduce((s, a) => s + calcMeuLado(a), 0);

  const anos = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));
  const selectCls = 'border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Aluguéis</h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={ano} onChange={e => { setAno(e.target.value); setSelecionadoId(null); }} className={selectCls}>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {isAdmin && (
            <button
              onClick={() => { setEditando(null); setModal('novo'); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Novo
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {!isLoading && alugueis.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Recebido</p>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(totalRecebido)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{pagos.length} mês{pagos.length !== 1 ? 'es' : ''}</p>
          </div>
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-xs text-amber-600 dark:text-amber-400">Pendente</p>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(totalPendente)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{pendentes.length} mês{pendentes.length !== 1 ? 'es' : ''}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 px-4 py-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total {ano}</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(totalRecebido + totalPendente)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{alugueis.length} lançamento{alugueis.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Lista */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden self-start">
          {isLoading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-4 animate-pulse space-y-1.5">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded w-1/2" />
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
                  onClick={() => setSelecionadoId(a.idaluguel)}
                  className={`flex items-start gap-2.5 px-3 py-3 cursor-pointer transition-colors ${
                    selecionado?.idaluguel === a.idaluguel
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  {/* Status icons: meu lado + comp */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0 mt-0.5">
                    {isPago(a)
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      : <Clock className="w-3.5 h-3.5 text-amber-400" />
                    }
                    {isPagoComp(a)
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                      : <Clock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white capitalize truncate">
                      {a.dataaluguel ? mesAnoShort(a.dataaluguel) : '—'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {a.valoraluguel != null ? formatCurrency(a.valoraluguel) : 'sem valor'}
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
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

      {/* Modais */}
      {modal === 'novo' && (
        <Modal title="Novo Lançamento" onClose={() => setModal(null)}>
          <AluguelForm
            valorSugerido={valorSugerido}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
            loading={createMut.isPending}
          />
        </Modal>
      )}
      {modal === 'editar' && editando && (
        <Modal title="Editar Lançamento" onClose={() => { setModal(null); setEditando(null); }}>
          <AluguelForm
            initial={editando}
            onSubmit={handleSubmit}
            onCancel={() => { setModal(null); setEditando(null); }}
            loading={updateMut.isPending}
          />
        </Modal>
      )}
    </div>
  );
}

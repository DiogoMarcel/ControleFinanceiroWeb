import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Car, Plus, Pencil, Trash2, X, Check, Fuel, Gauge, DollarSign,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Tipos ──────────────────────────────────────────────────────────────────

interface Veiculo {
  idveiculo: number;
  modelo: string;
  marca: string;
  cor: string;
  datacompra: string;
  valorcompra: number;
  datavenda: string | null;
  valorvenda: number | null;
}

interface Abastecimento {
  idabastecimento: number;
  dataabastecimento: string;
  totalabastecimento: number;
  kmcarro: number;
  quantidadelitros: number;
  observacao: string | null;
  id_veiculo: number | null;
}

interface AbastecimentosResponse {
  abastecimentos: Abastecimento[];
  totalLitros: number;
  custoTotal: number;
  consumoMedio: number | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function anoAtual() {
  return String(new Date().getFullYear());
}

interface MesStats {
  key: string;          // YYYY-MM
  label: string;        // "Março / 2025"
  custo: number;
  litros: number;
  consumoMedio: number | null;
  abastecimentos: Abastecimento[];
}

function groupByMonth(abastecimentos: Abastecimento[]): MesStats[] {
  if (abastecimentos.length === 0) return [];

  // Calcula consumo km/L por fill-up (pares consecutivos de km)
  const sorted = [...abastecimentos].sort((a, b) => a.kmcarro - b.kmcarro);
  const consumoPorId = new Map<number, number>();
  for (let i = 1; i < sorted.length; i++) {
    const deltaKm = sorted[i].kmcarro - sorted[i - 1].kmcarro;
    if (deltaKm > 0 && sorted[i].quantidadelitros > 0) {
      consumoPorId.set(sorted[i].idabastecimento, deltaKm / sorted[i].quantidadelitros);
    }
  }

  // Agrupa por mês (ordem decrescente = lista desc por data)
  const mapaOrdem: string[] = [];
  const mapa = new Map<string, MesStats>();

  // abastecimentos já vêm desc da API
  for (const a of abastecimentos) {
    const key = a.dataabastecimento.slice(0, 7); // YYYY-MM
    if (!mapa.has(key)) {
      const [ano, mes] = key.split('-');
      const label = format(new Date(Number(ano), Number(mes) - 1, 1), "MMMM '/' yyyy", { locale: ptBR });
      mapa.set(key, { key, label, custo: 0, litros: 0, consumoMedio: null, abastecimentos: [] });
      mapaOrdem.push(key);
    }
    const entry = mapa.get(key)!;
    entry.custo += a.totalabastecimento;
    entry.litros += a.quantidadelitros;
    entry.abastecimentos.push(a);
  }

  // Calcula consumo médio por mês
  for (const stats of mapa.values()) {
    let total = 0;
    let count = 0;
    for (const a of stats.abastecimentos) {
      const c = consumoPorId.get(a.idabastecimento);
      if (c != null) { total += c; count++; }
    }
    stats.consumoMedio = count > 0 ? total / count : null;
  }

  return mapaOrdem.map(k => mapa.get(k)!);
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

// ── Formulário de Veículo ─────────────────────────────────────────────────

interface VeiculoFormValues {
  modelo: string; marca: string; cor: string;
  datacompra: string; valorcompra: string;
  datavenda: string; valorvenda: string;
}

interface VeiculoFormProps {
  initial?: Partial<Veiculo>;
  onSubmit: (v: VeiculoFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
}

function VeiculoForm({ initial, onSubmit, onCancel, loading }: VeiculoFormProps) {
  const [modelo, setModelo] = useState(initial?.modelo?.trim() ?? '');
  const [marca, setMarca] = useState(initial?.marca?.trim() ?? '');
  const [cor, setCor] = useState(initial?.cor?.trim() ?? '');
  const [datacompra, setDatacompra] = useState(
    initial?.datacompra ? initial.datacompra.slice(0, 10) : '',
  );
  const [valorcompra, setValorcompra] = useState(String(initial?.valorcompra ?? ''));
  const [datavenda, setDatavenda] = useState(
    initial?.datavenda ? initial.datavenda.slice(0, 10) : '',
  );
  const [valorvenda, setValorvenda] = useState(String(initial?.valorvenda ?? ''));

  const inputCls = 'w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit({ modelo, marca, cor, datacompra, valorcompra, datavenda, valorvenda }); }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Modelo *</label>
          <input required value={modelo} onChange={e => setModelo(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Marca *</label>
          <input required value={marca} onChange={e => setMarca(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Cor *</label>
        <input required value={cor} onChange={e => setCor(e.target.value)} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Data Compra *</label>
          <input required type="date" value={datacompra} onChange={e => setDatacompra(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Valor Compra *</label>
          <input required type="number" step="0.01" min="0" value={valorcompra} onChange={e => setValorcompra(e.target.value)} className={inputCls} placeholder="0,00" />
        </div>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Venda (opcional)</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Data Venda</label>
          <input type="date" value={datavenda} onChange={e => setDatavenda(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Valor Venda</label>
          <input type="number" step="0.01" min="0" value={valorvenda} onChange={e => setValorvenda(e.target.value)} className={inputCls} placeholder="0,00" />
        </div>
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

// ── Formulário de Abastecimento ───────────────────────────────────────────

interface AbastFormValues {
  dataabastecimento: string;
  totalabastecimento: string;
  kmcarro: string;
  quantidadelitros: string;
  observacao: string;
}

interface AbastFormProps {
  initial?: Partial<Abastecimento>;
  onSubmit: (v: AbastFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
}

function AbastForm({ initial, onSubmit, onCancel, loading }: AbastFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState(initial?.dataabastecimento ? initial.dataabastecimento.slice(0, 10) : today);
  const [total, setTotal] = useState(String(initial?.totalabastecimento ?? ''));
  const [km, setKm] = useState(String(initial?.kmcarro ?? ''));
  const [litros, setLitros] = useState(String(initial?.quantidadelitros ?? ''));
  const [obs, setObs] = useState(initial?.observacao?.trim() ?? '');

  const inputCls = 'w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit({ dataabastecimento: data, totalabastecimento: total, kmcarro: km, quantidadelitros: litros, observacao: obs }); }}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Data *</label>
        <input required type="date" value={data} onChange={e => setData(e.target.value)} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Total (R$) *</label>
          <input required type="number" step="0.01" min="0" value={total} onChange={e => setTotal(e.target.value)} className={inputCls} placeholder="0,00" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Litros *</label>
          <input required type="number" step="0.001" min="0" value={litros} onChange={e => setLitros(e.target.value)} className={inputCls} placeholder="0,000" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">KM do carro *</label>
        <input required type="number" min="0" value={km} onChange={e => setKm(e.target.value)} className={inputCls} placeholder="Ex: 52000" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Observação</label>
        <input value={obs} onChange={e => setObs(e.target.value)} maxLength={80} className={inputCls} />
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

// ── Painel de Abastecimentos ──────────────────────────────────────────────

function AbastecimentosPanel({ veiculo, isAdmin }: { veiculo: Veiculo; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [ano, setAno] = useState(anoAtual());
  const [modalAbast, setModalAbast] = useState<'novo' | 'editar' | null>(null);
  const [editando, setEditando] = useState<Abastecimento | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const inicio = `${ano}-01-01`;
  const fim = `${ano}-12-31`;

  const { data, isLoading } = useQuery<AbastecimentosResponse>({
    queryKey: ['abastecimentos', veiculo.idveiculo, ano],
    queryFn: async () =>
      (await api.get(`/veiculos/${veiculo.idveiculo}/abastecimentos`, { params: { inicio, fim } })).data,
  });

  // Totais gerais — todos os anos
  const { data: geral } = useQuery<AbastecimentosResponse>({
    queryKey: ['abastecimentos', veiculo.idveiculo, 'all'],
    queryFn: async () =>
      (await api.get(`/veiculos/${veiculo.idveiculo}/abastecimentos`)).data,
  });

  const createMut = useMutation({
    mutationFn: (body: object) => api.post(`/veiculos/${veiculo.idveiculo}/abastecimentos`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['abastecimentos', veiculo.idveiculo] });
      setModalAbast(null);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: { id: number } & object) =>
      api.put(`/veiculos/${veiculo.idveiculo}/abastecimentos/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['abastecimentos', veiculo.idveiculo] });
      setModalAbast(null);
      setEditando(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/veiculos/${veiculo.idveiculo}/abastecimentos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['abastecimentos', veiculo.idveiculo] });
      setConfirmDelete(null);
    },
  });

  function handleSubmit(vals: AbastFormValues) {
    const body = {
      dataabastecimento: vals.dataabastecimento,
      totalabastecimento: Number(vals.totalabastecimento),
      kmcarro: Number(vals.kmcarro),
      quantidadelitros: Number(vals.quantidadelitros),
      observacao: vals.observacao || undefined,
    };
    if (modalAbast === 'editar' && editando) {
      updateMut.mutate({ id: editando.idabastecimento, ...body });
    } else {
      createMut.mutate(body);
    }
  }

  // Agrupa por mês (para lista e gráfico)
  const meses = groupByMonth(data?.abastecimentos ?? []);

  // Gráfico: custo agregado por mês em ordem cronológica
  const chartData = [...meses]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(m => ({
      mes: format(new Date(Number(m.key.slice(0, 4)), Number(m.key.slice(5, 7)) - 1, 1), 'MMM', { locale: ptBR }),
      custo: m.custo,
    }));

  const anos = Array.from(
    { length: 5 },
    (_, i) => String(new Date().getFullYear() - i),
  );

  const inputCls = 'border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="flex flex-col gap-5">
      {/* Header do painel */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {veiculo.modelo.trim()} — {veiculo.marca.trim()}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {veiculo.cor.trim()} · comprado em {formatDate(veiculo.datacompra)}
            {veiculo.datavenda && ` · vendido em ${formatDate(veiculo.datavenda)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={ano} onChange={e => setAno(e.target.value)} className={inputCls}>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {isAdmin && (
            <button
              onClick={() => setModalAbast('novo')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Abastecer
            </button>
          )}
        </div>
      </div>

      {/* Painel geral — todos os anos */}
      {geral && geral.abastecimentos.length > 0 && (() => {
        const primeiro = [...geral.abastecimentos].sort((a, b) =>
          a.dataabastecimento.localeCompare(b.dataabastecimento)
        )[0];
        const kmTotal = Math.max(...geral.abastecimentos.map(a => a.kmcarro)) -
          Math.min(...geral.abastecimentos.map(a => a.kmcarro));
        return (
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">
              Totais Gerais · desde {formatDate(primeiro.dataabastecimento)}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-blue-500 dark:text-blue-400">Total investido</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(geral.custoTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-500 dark:text-blue-400">Total litros</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{geral.totalLitros.toFixed(2)} L</p>
              </div>
              <div>
                <p className="text-xs text-blue-500 dark:text-blue-400">Consumo médio</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {geral.consumoMedio != null ? `${geral.consumoMedio.toFixed(2)} km/L` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-500 dark:text-blue-400">KM rodados</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{kmTotal.toLocaleString('pt-BR')} km</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Stats do ano selecionado */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<DollarSign className="w-4 h-4 text-blue-500" />} label={`Custo ${ano}`} value={formatCurrency(data?.custoTotal ?? 0)} />
          <StatCard icon={<Fuel className="w-4 h-4 text-green-500" />} label="Litros" value={`${(data?.totalLitros ?? 0).toFixed(2)} L`} />
          <StatCard
            icon={<Gauge className="w-4 h-4 text-amber-500" />}
            label="Consumo Médio"
            value={data?.consumoMedio != null ? `${data.consumoMedio.toFixed(2)} km/L` : '—'}
          />
        </div>
      )}

      {/* Gráfico — custo mensal */}
      {!isLoading && chartData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">Custo por Mês</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ left: -10, right: 4 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), 'Custo']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="custo" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Lista agrupada por mês */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-3 animate-pulse border-b border-slate-100 dark:border-slate-700">
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : !data?.abastecimentos.length ? (
          <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
            Nenhum abastecimento em {ano}.
          </div>
        ) : (
          <ul>
            {meses.map(mes => (
              <li key={mes.key}>
                {/* Registros do mês */}
                {mes.abastecimentos.map(a => (
                  <div key={a.idabastecimento} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors border-b border-slate-100 dark:border-slate-700">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(a.totalabastecimento)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {a.quantidadelitros.toFixed(3)} L · {a.kmcarro.toLocaleString('pt-BR')} km
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(a.dataabastecimento)}</span>
                        {a.observacao && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{a.observacao.trim()}</span>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {confirmDelete === a.idabastecimento ? (
                          <>
                            <button onClick={() => deleteMut.mutate(a.idabastecimento)} disabled={deleteMut.isPending} className="p-1 text-red-500 hover:text-red-700 transition-colors" aria-label="Confirmar exclusão">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setConfirmDelete(null)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Cancelar">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditando(a); setModalAbast('editar'); }}
                              className="p-1 text-slate-300 hover:text-blue-500 dark:text-slate-600 dark:hover:text-blue-400 transition-colors"
                              aria-label="Editar abastecimento"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(a.idabastecimento)}
                              className="p-1 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors"
                              aria-label="Excluir abastecimento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {/* Subtotal do mês */}
                <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700 flex-wrap">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 capitalize">{mes.label}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{formatCurrency(mes.custo)}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{mes.litros.toFixed(3)} L</span>
                  {mes.consumoMedio != null && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">{mes.consumoMedio.toFixed(2)} km/L</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modais */}
      {modalAbast === 'novo' && (
        <Modal title="Novo Abastecimento" onClose={() => setModalAbast(null)}>
          <AbastForm
            onSubmit={handleSubmit}
            onCancel={() => setModalAbast(null)}
            loading={createMut.isPending}
          />
        </Modal>
      )}
      {modalAbast === 'editar' && editando && (
        <Modal title="Editar Abastecimento" onClose={() => { setModalAbast(null); setEditando(null); }}>
          <AbastForm
            initial={editando}
            onSubmit={handleSubmit}
            onCancel={() => { setModalAbast(null); setEditando(null); }}
            loading={updateMut.isPending}
          />
        </Modal>
      )}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

// ── Página Principal ───────────────────────────────────────────────────────

export function VeiculosPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const qc = useQueryClient();

  const { data: veiculos = [], isLoading } = useQuery<Veiculo[]>({
    queryKey: ['veiculos'],
    queryFn: async () => (await api.get('/veiculos')).data,
  });

  const [selecionado, setSelecionado] = useState<Veiculo | null>(null);
  const [modal, setModal] = useState<'novo' | 'editar' | null>(null);
  const [editando, setEditando] = useState<Veiculo | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const createMut = useMutation({
    mutationFn: (body: object) => api.post('/veiculos', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['veiculos'] }); setModal(null); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: { id: number } & object) => api.put(`/veiculos/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['veiculos'] });
      setModal(null);
      setEditando(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/veiculos/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['veiculos'] });
      if (selecionado?.idveiculo === id) setSelecionado(null);
      setConfirmDelete(null);
    },
  });

  function handleVeiculoSubmit(vals: VeiculoFormValues) {
    const body = {
      modelo: vals.modelo,
      marca: vals.marca,
      cor: vals.cor,
      datacompra: vals.datacompra,
      valorcompra: Number(vals.valorcompra),
      datavenda: vals.datavenda || undefined,
      valorvenda: vals.valorvenda ? Number(vals.valorvenda) : undefined,
    };
    if (modal === 'editar' && editando) {
      updateMut.mutate({ id: editando.idveiculo, ...body });
    } else {
      createMut.mutate(body);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Car className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Veículos</h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditando(null); setModal('novo'); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Veículo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Lista de veículos */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden self-start">
          {isLoading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-4 py-4 animate-pulse space-y-1.5">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : veiculos.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              Nenhum veículo cadastrado.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {veiculos.map(v => (
                <li
                  key={v.idveiculo}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    selecionado?.idveiculo === v.idveiculo
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                  onClick={() => setSelecionado(v)}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                    <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {v.modelo.trim()}
                      {v.datavenda && (
                        <span className="ml-1.5 text-xs font-normal text-slate-400 dark:text-slate-500">vendido</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      {v.marca.trim()} · {v.cor.trim()}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {confirmDelete === v.idveiculo ? (
                        <>
                          <button onClick={() => deleteMut.mutate(v.idveiculo)} className="p-1 text-red-500 hover:text-red-700" aria-label="Confirmar">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Cancelar">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditando(v); setModal('editar'); }}
                            className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                            aria-label="Editar veículo"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(v.idveiculo)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            aria-label="Excluir veículo"
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

        {/* Painel de abastecimentos */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          {selecionado ? (
            <AbastecimentosPanel veiculo={selecionado} isAdmin={isAdmin} />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500 text-sm gap-2">
              <Car className="w-8 h-8 opacity-30" />
              <p>Selecione um veículo para ver os abastecimentos</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Veículo */}
      {modal === 'novo' && (
        <Modal title="Novo Veículo" onClose={() => setModal(null)}>
          <VeiculoForm
            onSubmit={handleVeiculoSubmit}
            onCancel={() => setModal(null)}
            loading={createMut.isPending}
          />
        </Modal>
      )}
      {modal === 'editar' && editando && (
        <Modal title="Editar Veículo" onClose={() => { setModal(null); setEditando(null); }}>
          <VeiculoForm
            initial={editando}
            onSubmit={handleVeiculoSubmit}
            onCancel={() => { setModal(null); setEditando(null); }}
            loading={updateMut.isPending}
          />
        </Modal>
      )}
    </div>
  );
}

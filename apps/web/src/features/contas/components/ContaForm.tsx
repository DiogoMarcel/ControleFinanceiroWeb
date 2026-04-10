import { useEffect } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { MembroFamilia } from '@/features/portadores/api';

interface Credor { idcredor: number; nome: string; }
interface Tag { idtags: number; descricao: string | null; }

const schema = z.object({
  descricao: z.string().min(1, 'Descrição obrigatória').max(50),
  valor: z.coerce.number().min(0, 'Valor deve ser positivo'),
  tipoconta: z.enum(['P', 'R']),
  id_membrofamilia: z.coerce.number().nullable().optional(),
  id_credor: z.coerce.number().nullable().optional(),
  contaanual: z.boolean().default(false),
  pertenceafolha: z.boolean().default(false),
  debitacartao: z.boolean().default(false),
  debitoauto: z.boolean().default(false),
  pagamentomanual: z.boolean().default(false),
  qtdparcela: z.coerce.number().nullable().optional(),
  tags: z.array(z.number()).default([]),
});

type FormData = z.infer<typeof schema>;

export interface ContaFormData {
  descricao: string;
  valor: number;
  tipoconta: 'P' | 'R';
  id_membrofamilia?: number | null;
  id_credor?: number | null;
  contaanual?: boolean;
  pertenceafolha?: boolean;
  debitacartao?: boolean;
  debitoauto?: boolean;
  pagamentomanual?: boolean;
  qtdparcela?: number | null;
  tags?: number[];
}

interface ContaExistente extends ContaFormData {
  idconta: number;
  contatag?: { tags: { idtags: number } | null }[];
}

interface ContaFormProps {
  conta?: ContaExistente;
  defaultTipo?: 'P' | 'R';
  onSuccess: () => void;
  onCancel: () => void;
}

const inputClass = "w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
const checkClass = "flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none";

export function ContaForm({ conta, defaultTipo = 'P', onSuccess, onCancel }: ContaFormProps) {
  const qc = useQueryClient();

  const { data: membros = [], isSuccess: membrosOk } = useQuery<MembroFamilia[]>({
    queryKey: ['membros'],
    queryFn: async () => (await api.get('/membros')).data,
  });

  const { data: credores = [], isSuccess: credoresOk } = useQuery<Credor[]>({
    queryKey: ['credores'],
    queryFn: async () => (await api.get('/credores')).data,
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => (await api.get('/tags')).data,
  });

  const createMutation = useMutation({
    mutationFn: (data: ContaFormData) => api.post('/contas', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contapagamentos'] }); onSuccess(); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ContaFormData) => api.put(`/contas/${conta!.idconta}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contapagamentos'] }); onSuccess(); },
  });

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      descricao: '',
      valor: 0,
      tipoconta: defaultTipo,
      contaanual: false,
      pertenceafolha: false,
      debitacartao: false,
      debitoauto: false,
      pagamentomanual: false,
      tags: [],
    },
  });

  // Só faz reset quando os dados de suporte (membros, credores) já carregaram
  useEffect(() => {
    if (conta && membrosOk && credoresOk) {
      reset({
        descricao: conta.descricao,
        valor: conta.valor,
        tipoconta: conta.tipoconta,
        id_membrofamilia: conta.id_membrofamilia ?? undefined,
        id_credor: conta.id_credor ?? undefined,
        contaanual: conta.contaanual ?? false,
        pertenceafolha: conta.pertenceafolha ?? false,
        debitacartao: conta.debitacartao ?? false,
        debitoauto: conta.debitoauto ?? false,
        pagamentomanual: conta.pagamentomanual ?? false,
        qtdparcela: conta.qtdparcela ?? undefined,
        tags: conta.contatag?.map((ct) => ct.tags?.idtags).filter(Boolean) as number[] ?? [],
      });
    }
  }, [conta, membrosOk, credoresOk, reset]);

  function onSubmit(data: FormData) {
    const payload: ContaFormData = {
      ...data,
      id_membrofamilia: data.id_membrofamilia || null,
      id_credor: data.id_credor || null,
      qtdparcela: data.qtdparcela || null,
    };
    if (conta) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const tipoconta = watch('tipoconta');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Tipo */}
      <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden self-start">
        {(['P', 'R'] as const).map((t) => (
          <label key={t} className="cursor-pointer">
            <input type="radio" {...register('tipoconta')} value={t} className="sr-only" />
            <span className={`block px-5 py-2 text-sm font-medium transition-colors ${
              tipoconta === t
                ? t === 'P' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}>
              {t === 'P' ? 'A Pagar' : 'A Receber'}
            </span>
          </label>
        ))}
      </div>

      {/* Descrição + Valor */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className={labelClass}>Descrição</label>
          <input {...register('descricao')} className={inputClass} placeholder="Ex: Conta de luz" />
          {errors.descricao && <p className="text-xs text-red-500 mt-1">{errors.descricao.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Valor (R$)</label>
          <input {...register('valor')} type="number" step="0.01" className={inputClass} />
          {errors.valor && <p className="text-xs text-red-500 mt-1">{errors.valor.message}</p>}
        </div>
      </div>

      {/* Membro + Credor */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Membro</label>
          <select {...register('id_membrofamilia')} className={inputClass}>
            <option value="">Compartilhado</option>
            {membros.map((m) => (
              <option key={m.idmembrofamilia} value={m.idmembrofamilia}>{m.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Credor</label>
          <select {...register('id_credor')} className={inputClass}>
            <option value="">Nenhum</option>
            {credores.map((c) => (
              <option key={c.idcredor} value={c.idcredor}>{c.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Flags */}
      <div>
        <p className={labelClass}>Características</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            ['debitacartao', 'Débita no cartão'],
            ['debitoauto', 'Débito automático'],
            ['pagamentomanual', 'Pagamento manual'],
            ['pertenceafolha', 'Pertence à folha'],
            ['contaanual', 'Conta anual'],
          ] as const).map(([field, label]) => (
            <label key={field} className={checkClass}>
              <input type="checkbox" {...register(field)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <p className={labelClass}>Tags</p>
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const selected = field.value.includes(tag.idtags);
                  return (
                    <button
                      key={tag.idtags}
                      type="button"
                      onClick={() => {
                        const next = selected
                          ? field.value.filter((id) => id !== tag.idtags)
                          : [...field.value, tag.idtags];
                        field.onChange(next);
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {tag.descricao}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isLoading}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50">
          {isLoading ? 'Salvando...' : conta ? 'Salvar Alterações' : 'Criar Conta'}
        </button>
      </div>
    </form>
  );
}

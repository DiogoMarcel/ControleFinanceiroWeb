import { useEffect } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Portador, PortadorInput } from '../api';
import { useMembros } from '../api';
import { TipoContaSelect } from './TipoContaSelect';
import type { TipoConta } from './TipoContaSelect';

const schema = z.object({
  nomeportador: z.string().min(1, 'Nome obrigatório').max(45),
  tipoconta: z.enum(['C', 'D', 'I', 'P']),
  id_membrofamilia: z.coerce.number().min(1, 'Selecione um membro'),
  agencia: z.string().max(10).optional().or(z.literal('')),
  numeroconta: z.string().max(15).optional().or(z.literal('')),
  digitoconta: z.string().max(1).optional().or(z.literal('')),
  valor: z.coerce.number().min(0).default(0),
  reservado: z.boolean().default(false),
  contacapital: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

interface PortadorFormProps {
  portador?: Portador;
  onSubmit: (data: PortadorInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function PortadorForm({ portador, onSubmit, onCancel, loading }: PortadorFormProps) {
  const { data: membros = [], isSuccess: membrosLoaded } = useMembros();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      nomeportador: '',
      tipoconta: 'C',
      id_membrofamilia: 0,
      valor: 0,
      reservado: false,
      contacapital: false,
    },
  });

  // Aguarda membros carregarem antes de fazer reset — garante que o <select> encontre a opção
  useEffect(() => {
    if (portador && membrosLoaded) {
      reset({
        nomeportador: portador.nomeportador,
        tipoconta: portador.tipoconta as 'C' | 'D' | 'I' | 'P',
        id_membrofamilia: portador.id_membrofamilia,
        agencia: portador.agencia ?? '',
        numeroconta: portador.numeroconta ?? '',
        digitoconta: portador.digitoconta ?? '',
        valor: portador.saldoportador?.valor ?? 0,
        reservado: portador.saldoportador?.reservado ?? false,
        contacapital: portador.saldoportador?.contacapital ?? false,
      });
    }
  }, [portador, membrosLoaded, reset]);

  const tipoconta = watch('tipoconta');
  const showBankFields = tipoconta === 'C' || tipoconta === 'I' || tipoconta === 'P';

  function handleFormSubmit(data: FormData) {
    onSubmit({
      ...data,
      agencia: data.agencia || undefined,
      numeroconta: data.numeroconta || undefined,
      digitoconta: data.digitoconta || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
      {/* Nome */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Nome do Portador
        </label>
        <input
          {...register('nomeportador')}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Nubank, Sicredi, Dinheiro"
        />
        {errors.nomeportador && (
          <p className="text-xs text-red-500 mt-1">{errors.nomeportador.message}</p>
        )}
      </div>

      {/* Tipo + Membro */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Tipo de Conta
          </label>
          <Controller
            name="tipoconta"
            control={control}
            render={({ field }) => (
              <TipoContaSelect
                value={field.value as TipoConta}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Membro da Família
          </label>
          <select
            {...register('id_membrofamilia')}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>Selecione...</option>
            {membros.map((m) => (
              <option key={m.idmembrofamilia} value={m.idmembrofamilia}>{m.nome}</option>
            ))}
          </select>
          {errors.id_membrofamilia && (
            <p className="text-xs text-red-500 mt-1">{errors.id_membrofamilia.message}</p>
          )}
        </div>
      </div>

      {/* Dados bancários */}
      {showBankFields && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Agência
            </label>
            <input
              {...register('agencia')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Conta
            </label>
            <input
              {...register('numeroconta')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="00000-0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Dígito
            </label>
            <input
              {...register('digitoconta')}
              maxLength={1}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Saldo */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Saldo Atual (R$)
        </label>
        <input
          {...register('valor')}
          type="number"
          step="0.01"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Flags */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            {...register('reservado')}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Reservado (Investimento)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            {...register('contacapital')}
            className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
          />
          Conta Capital
        </label>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando...' : portador ? 'Salvar Alterações' : 'Criar Portador'}
        </button>
      </div>
    </form>
  );
}

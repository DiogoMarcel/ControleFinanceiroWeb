import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export type StatusPagamento = 'pago' | 'vencido' | 'vencendo' | 'pendente';

export interface ContaResumo {
  idconta: number;
  descricao: string;
  valor: number;
  tipoconta: string;
  debitacartao: boolean | null;
  debitoauto: boolean | null;
  pagamentomanual: boolean | null;
  pertenceafolha: boolean | null;
  contaanual: boolean | null;
  membrofamilia: { idmembrofamilia: number; nome: string } | null;
  credor: { idcredor: number; nome: string } | null;
}

export interface Pagamento {
  idcontapagamentos: number;
  dataconta: string | null;
  databaixa: string | null;
  baixaefetuada: boolean | null;
  status: StatusPagamento;
  id_conta: number;
  conta: ContaResumo;
}

export function usePagamentos(mes: string, filters?: {
  tipoconta?: string;
  id_membrofamilia?: number;
  status?: StatusPagamento;
}) {
  const params = new URLSearchParams({ mes });
  if (filters?.tipoconta) params.set('tipoconta', filters.tipoconta);
  if (filters?.id_membrofamilia) params.set('id_membrofamilia', String(filters.id_membrofamilia));
  if (filters?.status) params.set('status', filters.status);

  return useQuery<Pagamento[]>({
    queryKey: ['contapagamentos', mes, filters],
    queryFn: async () => {
      const { data } = await api.get(`/contapagamentos?${params}`);
      return data;
    },
  });
}

export function useBaixarPagamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dataBaixa }: { id: number; dataBaixa?: string }) =>
      api.patch(`/contapagamentos/${id}/baixa`, { dataBaixa }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contapagamentos'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDesfazerBaixa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/contapagamentos/${id}/desfazer-baixa`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contapagamentos'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useGerarMes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mes: string) => api.post('/contapagamentos/gerar-mes', { mes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contapagamentos'] }),
  });
}

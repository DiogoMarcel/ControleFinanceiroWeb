import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface SaldoPortador {
  idsaldoportador: number;
  valor: number | null;
  reservado: boolean | null;
  contacapital: boolean | null;
}

export interface MembroFamilia {
  idmembrofamilia: number;
  nome: string;
}

export interface Portador {
  idportador: number;
  nomeportador: string;
  tipoconta: string;
  agencia: string | null;
  numeroconta: string | null;
  digitoconta: string | null;
  imgportador: number | null;
  id_membrofamilia: number;
  membrofamilia: MembroFamilia;
  saldoportador: SaldoPortador | null;
}

export interface PortadorInput {
  nomeportador: string;
  tipoconta: string;
  id_membrofamilia: number;
  agencia?: string;
  numeroconta?: string;
  digitoconta?: string;
  valor?: number;
  reservado?: boolean;
  contacapital?: boolean;
}

export function usePortadores() {
  return useQuery<Portador[]>({
    queryKey: ['portadores'],
    queryFn: async () => {
      const { data } = await api.get('/portadores');
      return data;
    },
  });
}

export function useMembros() {
  return useQuery<MembroFamilia[]>({
    queryKey: ['membros'],
    queryFn: async () => {
      const { data } = await api.get('/membros');
      return data;
    },
  });
}

export function useCreatePortador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PortadorInput) => api.post('/portadores', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portadores'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdatePortador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: PortadorInput & { id: number }) =>
      api.put(`/portadores/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portadores'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeletePortador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/portadores/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portadores'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

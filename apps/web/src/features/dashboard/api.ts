import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface PortadorResumo {
  id: number;
  nome: string;
  tipo: string;
  saldo: number;
  reservado: boolean;
  membroNome: string;
}

export interface EvolucaoMes {
  mes: string;
  saldoTotal: number;
}

export interface DashboardData {
  saldoTotal: number;
  saldoBancario: number;
  valorReservado: number;
  totalContasPagar: number;
  totalContasReceber: number;
  saldoFgts: number;
  saldoGeralComFgts: number;
  portadores: PortadorResumo[];
  evolucaoSaldo: EvolucaoMes[];
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard');
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

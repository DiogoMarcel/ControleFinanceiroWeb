import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface PortadorResumo {
  id: number;
  nome: string;
  tipo: string;
  saldo: number;
  reservado: boolean;
  contaCapital: boolean;
  membroId: number;
  membroNome: string;
}

export interface EvolucaoMes {
  mes: string;
  saldoTotal: number;
}

export interface ContaVencendo {
  id: number;
  descricao: string;
  valor: number;
  diavencimento: number;
  diasAteVencimento: number;
  credorNome: string | null;
  membroNome: string | null;
}

export interface DashboardData {
  saldoTotal: number;
  saldoBancario: number;
  valorReservado: number;
  totalContasPagar: number;
  totalContasReceber: number;
  saldoLiquido: number;
  saldoFgts: number;
  saldoGeralComFgts: number;
  portadores: PortadorResumo[];
  evolucaoSaldo: EvolucaoMes[];
  contasVencendo: ContaVencendo[];
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

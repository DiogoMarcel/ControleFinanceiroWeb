import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface PortadorResumo {
  id: number;
  nome: string;
  tipo: string;
  saldo: number;
  membroNome: string;
}

export interface ContaAlerta {
  id: number;
  descricao: string;
  valor: number;
  dataconta: string | null;
}

export interface GraficoMes {
  mes: string;
  pagar: number;
  receber: number;
}

export interface DashboardData {
  saldoTotal: number;
  totalPagar: number;
  totalReceber: number;
  saldoLiquido: number;
  portadores: PortadorResumo[];
  vencendo7dias: ContaAlerta[];
  emAtraso: ContaAlerta[];
  graficoMeses: GraficoMes[];
}

export function useDashboard(mes: string) {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', mes],
    queryFn: async () => {
      const { data } = await api.get('/dashboard', { params: { mes } });
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

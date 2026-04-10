import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from './api';
import { ResumoFinanceiro } from './components/ResumoFinanceiro';
import { PortadoresList } from './components/PortadoresList';
import { EvolucaoSaldo } from './components/EvolucaoSaldo';

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboard();

  const primeiroNome =
    user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'usuário';

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Olá, {primeiroNome}!
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Visão geral das suas finanças
        </p>
      </div>

      {isError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
          Erro ao carregar dados. Verifique se a API está rodando.
        </div>
      )}

      {/* Resumo financeiro (largura total) */}
      <ResumoFinanceiro data={data} loading={isLoading} />

      {/* Gráfico de evolução */}
      <EvolucaoSaldo data={data?.evolucaoSaldo ?? []} loading={isLoading} />

      {/* Portadores agrupados por membro — abaixo do gráfico */}
      <PortadoresList portadores={data?.portadores ?? []} loading={isLoading} />
    </div>
  );
}

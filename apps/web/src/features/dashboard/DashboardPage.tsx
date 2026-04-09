import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from './api';
import { ResumoFinanceiro } from './components/ResumoFinanceiro';
import { PortadoresList } from './components/PortadoresList';
import { EvolucaoSaldo } from './components/EvolucaoSaldo';

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboard();

  const primeiroNome = user?.displayName?.split(' ')[0] ?? 'Olá';

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

      {/* Layout principal: resumo + portadores lado a lado em desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <ResumoFinanceiro data={data} loading={isLoading} />
        </div>
        <div className="lg:col-span-2">
          <PortadoresList portadores={data?.portadores ?? []} loading={isLoading} />
        </div>
      </div>

      {/* Gráfico de evolução */}
      <EvolucaoSaldo data={data?.evolucaoSaldo ?? []} loading={isLoading} />
    </div>
  );
}

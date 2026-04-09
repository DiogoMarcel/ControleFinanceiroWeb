import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from './api';
import { KpiCard } from './components/KpiCard';
import { GraficoMeses } from './components/GraficoMeses';
import { PortadoresGrid } from './components/PortadoresGrid';
import { ContasAlerta } from './components/ContasAlerta';

export function DashboardPage() {
  const { user } = useAuth();
  const [mesRef, setMesRef] = useState(() => new Date().toISOString().slice(0, 7));

  const { data, isLoading, isError } = useDashboard(mesRef);

  const mesDate = parseISO(`${mesRef}-01`);
  const mesLabel = format(mesDate, 'MMMM yyyy', { locale: ptBR });
  const primeiroNome = user?.displayName?.split(' ')[0] ?? 'Olá';

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
            Olá, {primeiroNome}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{mesLabel}</p>
        </div>

        {/* Navegador de mês */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
          <button
            onClick={() => setMesRef(format(subMonths(mesDate, 1), 'yyyy-MM'))}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize w-32 text-center">
            {mesLabel}
          </span>
          <button
            onClick={() => setMesRef(format(addMonths(mesDate, 1), 'yyyy-MM'))}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
          Erro ao carregar dados do dashboard. Verifique se a API está rodando.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard title="Saldo Total" value={data?.saldoTotal ?? 0} loading={isLoading} />
        <KpiCard title="A Pagar" value={data?.totalPagar ?? 0} variant="danger" loading={isLoading} />
        <KpiCard title="A Receber" value={data?.totalReceber ?? 0} variant="success" loading={isLoading} />
        <KpiCard
          title="Saldo Líquido"
          value={data?.saldoLiquido ?? 0}
          variant={(data?.saldoLiquido ?? 0) >= 0 ? 'success' : 'danger'}
          loading={isLoading}
        />
      </div>

      {/* Portadores */}
      <PortadoresGrid portadores={data?.portadores ?? []} loading={isLoading} />

      {/* Gráfico */}
      <GraficoMeses data={data?.graficoMeses ?? []} loading={isLoading} />

      {/* Alertas */}
      <ContasAlerta
        vencendo={data?.vencendo7dias ?? []}
        emAtraso={data?.emAtraso ?? []}
        loading={isLoading}
      />
    </div>
  );
}

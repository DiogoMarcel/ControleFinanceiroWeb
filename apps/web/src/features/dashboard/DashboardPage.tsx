import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from './api';
import { ResumoFinanceiro } from './components/ResumoFinanceiro';
import { PortadoresList } from './components/PortadoresList';
import { EvolucaoSaldo } from './components/EvolucaoSaldo';
import { PortadoresChart } from './components/PortadoresChart';
import { AlertasVencimento } from './components/AlertasVencimento';

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboard();
  const [hoveredPortadorId, setHoveredPortadorId] = useState<number | null>(null);

  const primeiroNome =
    user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'usuário';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">
          Olá, {primeiroNome}.
        </h1>
        <p className="text-[13px] text-ink-muted mt-0.5">
          Visão geral das suas finanças
        </p>
      </div>

      {isError && (
        <div className="border border-ledger-danger/30 bg-ledger-danger/8 rounded-xl p-4 text-[13px] text-ledger-danger">
          Erro ao carregar dados. Verifique se a API está rodando.
        </div>
      )}

      <ResumoFinanceiro data={data} loading={isLoading} />

      <EvolucaoSaldo data={data?.evolucaoSaldo ?? []} saldoAtual={data?.saldoTotal} loading={isLoading} />

      <PortadoresChart
        portadores={data?.portadores ?? []}
        loading={isLoading}
        onHoverChange={setHoveredPortadorId}
      />

      <PortadoresList
        portadores={data?.portadores ?? []}
        loading={isLoading}
        highlightedId={hoveredPortadorId}
      />

      <AlertasVencimento contas={data?.contasVencendo ?? []} loading={isLoading} />
    </div>
  );
}

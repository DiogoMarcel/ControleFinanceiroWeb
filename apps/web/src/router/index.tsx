import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { PortadoresPage } from '@/features/portadores/PortadoresPage';
import { ContasMesPage } from '@/features/contas/ContasMesPage';
import { ConfiguracoesPage } from '@/features/configuracoes/ConfiguracoesPage';
import { ExtratoPage } from '@/features/extrato/ExtratoPage';
import { CartoesPage } from '@/features/cartoes/CartoesPage';
import { RelatoriosPage } from '@/features/relatorios/RelatoriosPage';
import { VeiculosPage } from '@/features/veiculos/VeiculosPage';
import { FgtsPage } from '@/features/fgts/FgtsPage';

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{title}</p>
      <p className="text-slate-500 dark:text-slate-400 mt-2">Em construção…</p>
    </div>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/contas" element={<ContasMesPage />} />
        <Route path="/portadores" element={<PortadoresPage />} />
        <Route path="/extrato" element={<ExtratoPage />} />
        <Route path="/cartoes" element={<CartoesPage />} />
        <Route path="/relatorios" element={<RelatoriosPage />} />
        <Route path="/veiculos" element={<VeiculosPage />} />
        <Route path="/alugueis" element={<Placeholder title="Aluguéis" />} />
        <Route path="/fgts" element={<FgtsPage />} />
        <Route path="/configuracoes" element={<ConfiguracoesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

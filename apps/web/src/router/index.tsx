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
import { AlugueisPage } from '@/features/alugueis/AlugueisPage';


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
        <Route path="/alugueis" element={<AlugueisPage />} />
        <Route path="/fgts" element={<FgtsPage />} />
        <Route path="/configuracoes" element={<ConfiguracoesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

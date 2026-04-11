import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageSkeleton } from '@/components/ui';

// Lazy loading — cada página é um chunk separado, carregado só quando acessado
const DashboardPage    = lazy(() => import('@/features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const PortadoresPage   = lazy(() => import('@/features/portadores/PortadoresPage').then(m => ({ default: m.PortadoresPage })));
const ContasMesPage      = lazy(() => import('@/features/contas/ContasMesPage').then(m => ({ default: m.ContasMesPage })));
const ContasImprimirPage = lazy(() => import('@/features/contas/ContasImprimirPage').then(m => ({ default: m.ContasImprimirPage })));
const ConfiguracoesPage = lazy(() => import('@/features/configuracoes/ConfiguracoesPage').then(m => ({ default: m.ConfiguracoesPage })));
const ExtratoPage      = lazy(() => import('@/features/extrato/ExtratoPage').then(m => ({ default: m.ExtratoPage })));
const CartoesPage      = lazy(() => import('@/features/cartoes/CartoesPage').then(m => ({ default: m.CartoesPage })));
const RelatoriosPage   = lazy(() => import('@/features/relatorios/RelatoriosPage').then(m => ({ default: m.RelatoriosPage })));
const VeiculosPage     = lazy(() => import('@/features/veiculos/VeiculosPage').then(m => ({ default: m.VeiculosPage })));
const FgtsPage         = lazy(() => import('@/features/fgts/FgtsPage').then(m => ({ default: m.FgtsPage })));
const AlugueisPage     = lazy(() => import('@/features/alugueis/AlugueisPage').then(m => ({ default: m.AlugueisPage })));

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="/contas"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <ContasMesPage />
              </Suspense>
            }
          />
          <Route
            path="/contas/imprimir"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <ContasImprimirPage />
              </Suspense>
            }
          />
          <Route
            path="/portadores"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <PortadoresPage />
              </Suspense>
            }
          />
          <Route
            path="/extrato"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <ExtratoPage />
              </Suspense>
            }
          />
          <Route
            path="/cartoes"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <CartoesPage />
              </Suspense>
            }
          />
          <Route
            path="/relatorios"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <RelatoriosPage />
              </Suspense>
            }
          />
          <Route
            path="/veiculos"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <VeiculosPage />
              </Suspense>
            }
          />
          <Route
            path="/alugueis"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <AlugueisPage />
              </Suspense>
            }
          />
          <Route
            path="/fgts"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <FgtsPage />
              </Suspense>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <ConfiguracoesPage />
              </Suspense>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

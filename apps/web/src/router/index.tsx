import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

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
        <Route path="/dashboard" element={<Placeholder title="Dashboard" />} />
        <Route path="/contas" element={<Placeholder title="Contas do Mês" />} />
        <Route path="/portadores" element={<Placeholder title="Portadores" />} />
        <Route path="/cartoes" element={<Placeholder title="Cartões" />} />
        <Route path="/relatorios" element={<Placeholder title="Relatórios" />} />
        <Route path="/veiculos" element={<Placeholder title="Veículos" />} />
        <Route path="/alugueis" element={<Placeholder title="Aluguéis" />} />
        <Route path="/fgts" element={<Placeholder title="FGTS" />} />
        <Route path="/configuracoes" element={<Placeholder title="Configurações" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

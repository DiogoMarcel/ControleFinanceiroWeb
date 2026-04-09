import { Routes, Route, Navigate } from 'react-router-dom';

// Placeholder — será substituído pelas rotas reais nas tasks seguintes
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-primary-800 mb-2">
                Controle Financeiro
              </h1>
              <p className="text-gray-500">Em construção…</p>
            </div>
          </div>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { formatCurrency } from '@/lib/format';
import type { DashboardData } from '../api';

interface ResumoFinanceiroProps {
  data?: DashboardData;
  loading?: boolean;
}

interface ResumoRowProps {
  label: string;
  value?: number;
  loading?: boolean;
  highlight?: 'success' | 'danger' | 'strong';
  separator?: boolean;
}

function ResumoRow({ label, value, loading, highlight, separator }: ResumoRowProps) {
  const valueClass =
    highlight === 'success'
      ? 'text-green-600 dark:text-green-400 font-semibold'
      : highlight === 'danger'
        ? 'text-red-600 dark:text-red-400 font-semibold'
        : highlight === 'strong'
          ? 'text-slate-900 dark:text-white font-bold'
          : 'text-slate-700 dark:text-slate-300';

  return (
    <div
      className={`flex items-center justify-between py-2 ${
        separator ? 'border-t border-slate-200 dark:border-slate-700 mt-1 pt-3' : ''
      }`}
    >
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      {loading ? (
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      ) : (
        <span className={`text-sm ${valueClass}`}>{formatCurrency(value ?? 0)}</span>
      )}
    </div>
  );
}

export function ResumoFinanceiro({ data, loading }: ResumoFinanceiroProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Resumo</h3>
      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
        <ResumoRow label="Saldo Total" value={data?.saldoTotal} loading={loading} highlight="strong" />
        <ResumoRow label="Saldo Bancário" value={data?.saldoBancario} loading={loading} />
        <ResumoRow label="Valor Reservado" value={data?.valorReservado} loading={loading} />
        <ResumoRow
          label="Total A Receber"
          value={data?.totalContasReceber}
          loading={loading}
          highlight="success"
        />
        <ResumoRow
          label="Total A Pagar"
          value={data?.totalContasPagar}
          loading={loading}
          highlight="danger"
        />
        <ResumoRow label="Saldo FGTS" value={data?.saldoFgts} loading={loading} separator />
        <ResumoRow
          label="Saldo Geral com FGTS"
          value={data?.saldoGeralComFgts}
          loading={loading}
          highlight="strong"
        />
      </div>
    </div>
  );
}

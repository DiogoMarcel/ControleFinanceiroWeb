import { formatCurrency } from '@/lib/format';
import type { DashboardData } from '../api';

interface ResumoFinanceiroProps {
  data?: DashboardData;
  loading?: boolean;
}

interface ResumoCardProps {
  label: string;
  value?: number;
  loading?: boolean;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'strong' | 'muted';
}

function ResumoCard({ label, value, loading, variant = 'default' }: ResumoCardProps) {
  const valueClass =
    variant === 'success'
      ? 'text-emerald-600 dark:text-emerald-400'
      : variant === 'danger'
        ? 'text-red-500 dark:text-red-400'
        : variant === 'warning'
          ? 'text-amber-600 dark:text-amber-400'
          : variant === 'strong'
            ? 'text-slate-900 dark:text-white'
            : variant === 'muted'
              ? 'text-slate-500 dark:text-slate-400'
              : 'text-slate-700 dark:text-slate-200';

  const fontClass = variant === 'strong' ? 'font-bold text-base' : 'font-semibold text-sm';

  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
      <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{label}</span>
      {loading ? (
        <div className="h-5 w-24 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" />
      ) : (
        <span className={`tabular-nums ${fontClass} ${valueClass}`}>
          {formatCurrency(value ?? 0)}
        </span>
      )}
    </div>
  );
}

export function ResumoFinanceiro({ data, loading }: ResumoFinanceiroProps) {
  const liquidoVariant =
    data?.saldoLiquido !== undefined
      ? data.saldoLiquido >= 0
        ? 'success'
        : 'danger'
      : 'default';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Resumo</h3>

      {/* Grade de cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <ResumoCard label="Saldo Total" value={data?.saldoTotal} loading={loading} variant="strong" />
        <ResumoCard label="Saldo Bancário" value={data?.saldoBancario} loading={loading} />
        <ResumoCard label="Valor Reservado" value={data?.valorReservado} loading={loading} variant="warning" />
        <ResumoCard label="A Receber" value={data?.totalContasReceber} loading={loading} variant="success" />
        <ResumoCard label="A Pagar" value={data?.totalContasPagar} loading={loading} variant="danger" />
        <ResumoCard label="Saldo Líquido" value={data?.saldoLiquido} loading={loading} variant={liquidoVariant} />
        <ResumoCard label="Saldo FGTS" value={data?.saldoFgts} loading={loading} variant="muted" />
        <ResumoCard label="Saldo Geral c/ FGTS" value={data?.saldoGeralComFgts} loading={loading} variant="strong" />
      </div>
    </div>
  );
}

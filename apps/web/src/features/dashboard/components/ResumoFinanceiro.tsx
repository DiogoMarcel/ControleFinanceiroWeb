import { formatCurrency } from '@/lib/format';
import type { DashboardData } from '../api';

interface ResumoFinanceiroProps {
  data?: DashboardData;
  loading?: boolean;
}

interface StatProps {
  label: string;
  value?: number;
  loading?: boolean;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'muted';
  hero?: boolean;
}

function Stat({ label, value, loading, variant = 'default', hero }: StatProps) {
  const colorClass =
    variant === 'success'
      ? 'text-ledger-success'
      : variant === 'danger'
        ? 'text-ledger-danger'
        : variant === 'warning'
          ? 'text-ledger-warning'
          : variant === 'muted'
            ? 'text-ink-muted'
            : 'text-ink';

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-subtle whitespace-nowrap">
        {label}
      </span>
      {loading ? (
        <div className={`bg-canvas-border rounded animate-pulse ${hero ? 'h-6 w-32' : 'h-5 w-24'}`} />
      ) : (
        <span
          className={`tabular-nums ${hero ? 'text-[17px] font-bold' : 'text-[15px] font-semibold'} ${colorClass}`}
        >
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
    <div className="bg-surface-raised rounded-xl border border-canvas-border p-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-x-6 gap-y-5">
        <Stat label="Saldo Total" value={data?.saldoTotal} loading={loading} hero />
        <Stat label="Saldo Bancário" value={data?.saldoBancario} loading={loading} />
        <Stat label="Reservado" value={data?.valorReservado} loading={loading} variant="warning" />
        <Stat label="A Receber" value={data?.totalContasReceber} loading={loading} variant="success" />
        <Stat label="A Pagar" value={data?.totalContasPagar} loading={loading} variant="danger" />
        <Stat label="Saldo Líquido" value={data?.saldoLiquido} loading={loading} variant={liquidoVariant} />
        <Stat label="FGTS" value={data?.saldoFgts} loading={loading} variant="muted" />
        <Stat label="Geral c/ FGTS" value={data?.saldoGeralComFgts} loading={loading} />
      </div>
    </div>
  );
}

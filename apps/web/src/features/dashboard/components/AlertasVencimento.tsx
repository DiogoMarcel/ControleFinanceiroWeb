import { AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { ContaVencendo } from '../api';

interface AlertasVencimentoProps {
  contas: ContaVencendo[];
  loading?: boolean;
}

function urgencyConfig(dias: number) {
  if (dias < 0) return {
    label: `${Math.abs(dias)}d atrás`,
    rowClass: 'border-l-ledger-danger bg-ledger-danger/4',
    labelClass: 'text-ledger-danger',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  };
  if (dias === 0) return {
    label: 'Hoje',
    rowClass: 'border-l-ledger-warning bg-ledger-warning/4',
    labelClass: 'text-ledger-warning',
    icon: <Clock className="w-3.5 h-3.5" />,
  };
  if (dias <= 3) return {
    label: `${dias}d`,
    rowClass: 'border-l-ledger-warning/60 bg-ledger-warning/4',
    labelClass: 'text-ledger-warning',
    icon: <Clock className="w-3.5 h-3.5" />,
  };
  return {
    label: `${dias}d`,
    rowClass: 'border-l-canvas-border',
    labelClass: 'text-ink-muted',
    icon: <Clock className="w-3.5 h-3.5" />,
  };
}

export function AlertasVencimento({ contas, loading }: AlertasVencimentoProps) {
  if (loading) {
    return (
      <div className="bg-surface-raised rounded-xl border border-canvas-border p-5">
        <div className="h-4 w-48 bg-canvas-border rounded mb-4 animate-pulse" />
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 bg-canvas-border/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (contas.length === 0) return null;

  const vencidas = contas.filter((c) => c.diasAteVencimento < 0);
  const proximas = contas.filter((c) => c.diasAteVencimento >= 0);

  return (
    <div className="bg-surface-raised rounded-xl border border-canvas-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-ink-muted uppercase tracking-[0.07em]">
          Vencimentos
        </h3>
        <div className="flex items-center gap-2">
          {vencidas.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-ledger-danger bg-ledger-danger/10 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              {vencidas.length} vencida{vencidas.length > 1 ? 's' : ''}
            </span>
          )}
          {proximas.length > 0 && (
            <span className="text-[11px] font-medium text-ink-subtle">
              {proximas.length} próxima{proximas.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {contas.map((c) => {
          const { label, rowClass, labelClass, icon } = urgencyConfig(c.diasAteVencimento);
          return (
            <div
              key={c.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md border-l-2 transition-colors',
                rowClass,
              )}
            >
              <div className={cn('flex items-center gap-1 shrink-0 min-w-[52px]', labelClass)}>
                {icon}
                <span className="text-[12px] font-semibold tabular-nums">{label}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-ink truncate">{c.descricao}</p>
                {(c.credorNome ?? c.membroNome) && (
                  <p className="text-[11px] text-ink-subtle truncate">
                    {[c.credorNome, c.membroNome].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>

              <span className="text-[13px] font-semibold tabular-nums text-ink shrink-0">
                {formatCurrency(c.valor)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { AlertTriangle, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import type { ContaAlerta } from '../api';

interface ContasAlertaProps {
  vencendo: ContaAlerta[];
  emAtraso: ContaAlerta[];
  loading?: boolean;
}

function ContaRow({ conta }: { conta: ContaAlerta }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{conta.descricao}</p>
        {conta.dataconta && (
          <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(conta.dataconta)}</p>
        )}
      </div>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-4 flex-shrink-0">
        {formatCurrency(conta.valor)}
      </span>
    </div>
  );
}

function AlertCard({
  title,
  icon: Icon,
  iconColor,
  items,
  emptyText,
  loading,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  items: ContaAlerta[];
  emptyText: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
        {items.length > 0 && (
          <span className="ml-auto text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 py-2">{emptyText}</p>
      ) : (
        items.slice(0, 8).map((c) => <ContaRow key={c.id} conta={c} />)
      )}
    </div>
  );
}

export function ContasAlerta({ vencendo, emAtraso, loading }: ContasAlertaProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <AlertCard
        title="Pendentes este mês"
        icon={Clock}
        iconColor="text-amber-500"
        items={vencendo}
        emptyText="Nenhuma conta pendente este mês."
        loading={loading}
      />
      <AlertCard
        title="Em atraso"
        icon={AlertTriangle}
        iconColor="text-red-500"
        items={emAtraso}
        emptyText="Nenhuma conta em atraso."
        loading={loading}
      />
    </div>
  );
}

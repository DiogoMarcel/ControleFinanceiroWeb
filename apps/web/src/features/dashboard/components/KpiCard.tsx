import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

interface KpiCardProps {
  title: string;
  value: number;
  variant?: 'default' | 'danger' | 'success' | 'neutral';
  loading?: boolean;
}

export function KpiCard({ title, value, variant = 'default', loading }: KpiCardProps) {
  const valueColor = {
    default: 'text-slate-900 dark:text-white',
    danger: 'text-red-600 dark:text-red-400',
    success: 'text-green-600 dark:text-green-400',
    neutral: 'text-slate-700 dark:text-slate-200',
  }[variant];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-1">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {title}
      </p>
      {loading ? (
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      ) : (
        <p className={cn('text-2xl font-bold', valueColor)}>{formatCurrency(value)}</p>
      )}
    </div>
  );
}

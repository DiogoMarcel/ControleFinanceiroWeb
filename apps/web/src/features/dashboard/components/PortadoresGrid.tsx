import { Wallet, Banknote, TrendingUp, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PortadorResumo } from '../api';

const tipoConfig: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  C: { label: 'Conta Corrente', Icon: Wallet, color: 'text-blue-600 dark:text-blue-400' },
  D: { label: 'Dinheiro', Icon: Banknote, color: 'text-green-600 dark:text-green-400' },
  I: { label: 'Investimento', Icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400' },
  P: { label: 'Poupança', Icon: PiggyBank, color: 'text-amber-600 dark:text-amber-400' },
};

interface PortadoresGridProps {
  portadores: PortadorResumo[];
  loading?: boolean;
}

export function PortadoresGrid({ portadores, loading }: PortadoresGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Portadores</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {portadores.map((p) => {
          const config = tipoConfig[p.tipo] ?? tipoConfig['C'];
          const { Icon } = config;
          return (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('w-4 h-4', config.color)} />
                <span className="text-xs text-slate-500 dark:text-slate-400">{config.label}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{p.nome}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{p.membroNome}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(p.saldo)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PortadorResumo } from '../api';

const tipoLabel: Record<string, string> = {
  C: 'Corrente', D: 'Dinheiro', I: 'Investimento', P: 'Poupança',
};

interface PortadoresListProps {
  portadores: PortadorResumo[];
  loading?: boolean;
}

export function PortadoresList({ portadores, loading }: PortadoresListProps) {
  const total = portadores.reduce((s, p) => s + p.saldo, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Portadores</h3>
        {!loading && (
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {formatCurrency(total)}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {portadores
            .filter((p) => p.saldo > 0)
            .map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {p.nome}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {tipoLabel[p.tipo] ?? p.tipo} · {p.membroNome}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      p.reservado
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-900 dark:text-white',
                    )}
                  >
                    {formatCurrency(p.saldo)}
                  </span>
                  {p.saldo > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

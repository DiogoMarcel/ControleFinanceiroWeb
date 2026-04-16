import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PortadorResumo } from '../api';

const tipoLabel: Record<string, string> = {
  C: 'Corrente', D: 'Dinheiro', I: 'Investimento', P: 'Poupança',
};

interface PortadoresListProps {
  portadores: PortadorResumo[];
  loading?: boolean;
  highlightedId?: number | null;
}

interface GrupoMembro {
  membroId: number;
  membroNome: string;
  portadores: PortadorResumo[];
  saldoGeral: number;
}

function PortadorCard({ p, highlighted }: { p: PortadorResumo; highlighted: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-1.5 gap-2 border-b last:border-b-0 rounded transition-colors duration-150',
        'border-slate-100 dark:border-slate-700/40',
        highlighted && 'bg-blue-50 dark:bg-blue-900/20 -mx-2 px-2',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn(
          'text-xs truncate leading-tight transition-colors duration-150',
          highlighted
            ? 'font-semibold text-blue-700 dark:text-blue-300'
            : 'font-medium text-slate-700 dark:text-slate-200',
        )}>
          {p.nome}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
          {tipoLabel[p.tipo] ?? p.tipo}
          {p.contaCapital && ' · Capital'}
        </p>
      </div>
      <span
        className={cn(
          'text-xs font-semibold tabular-nums shrink-0 transition-colors duration-150',
          highlighted
            ? 'text-blue-700 dark:text-blue-300'
            : p.reservado
              ? 'text-amber-600 dark:text-amber-400'
              : p.contaCapital
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-slate-800 dark:text-slate-200',
        )}
      >
        {formatCurrency(p.saldo)}
      </span>
    </div>
  );
}

function GrupoCard({ grupo, highlightedId }: { grupo: GrupoMembro; highlightedId: number | null }) {
  const visíveis = grupo.portadores.filter((p) => p.saldo > 0 || p.contaCapital);
  const hasHighlight = visíveis.some((p) => p.id === highlightedId);

  return (
    <div className={cn(
      'bg-white dark:bg-slate-800 rounded-xl border p-4 flex flex-col gap-2 transition-shadow duration-150',
      hasHighlight
        ? 'border-blue-300 dark:border-blue-600 shadow-md'
        : 'border-slate-200 dark:border-slate-700',
    )}>
      <div className="flex items-baseline justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {grupo.membroNome.trim()}
        </h4>
        <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
          {formatCurrency(grupo.saldoGeral)}
        </span>
      </div>
      <div>
        {visíveis.map((p) => (
          <PortadorCard key={p.id} p={p} highlighted={p.id === highlightedId} />
        ))}
        {visíveis.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-1">Sem saldo</p>
        )}
      </div>
    </div>
  );
}

export function PortadoresList({ portadores, loading, highlightedId = null }: PortadoresListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-3 animate-pulse" />
            <div className="space-y-2">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-8 bg-slate-100 dark:bg-slate-700/50 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const grupos = portadores.reduce<GrupoMembro[]>((acc, p) => {
    let grupo = acc.find((g) => g.membroId === p.membroId);
    if (!grupo) {
      grupo = { membroId: p.membroId, membroNome: p.membroNome, portadores: [], saldoGeral: 0 };
      acc.push(grupo);
    }
    grupo.portadores.push(p);
    if (!p.reservado && !p.contaCapital) {
      grupo.saldoGeral += p.saldo;
    }
    return acc;
  }, []);

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
        Saldo por Portador
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grupos.map((g) => (
          <GrupoCard key={g.membroId} grupo={g} highlightedId={highlightedId} />
        ))}
      </div>
    </div>
  );
}

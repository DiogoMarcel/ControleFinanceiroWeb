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

function PortadorRow({ p, highlighted }: { p: PortadorResumo; highlighted: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-1.5 gap-2 border-b last:border-b-0 transition-colors duration-150',
        'border-canvas-border',
        highlighted && 'bg-accent/5 -mx-2 px-2 rounded',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn(
          'text-[13px] truncate leading-tight transition-colors duration-150',
          highlighted ? 'font-semibold text-accent' : 'font-medium text-ink',
        )}>
          {p.nome}
        </p>
        <p className="text-[11px] text-ink-subtle leading-tight">
          {tipoLabel[p.tipo] ?? p.tipo}
          {p.contaCapital && ' · Capital'}
        </p>
      </div>
      <span
        className={cn(
          'text-[13px] font-semibold tabular-nums shrink-0 transition-colors duration-150',
          highlighted
            ? 'text-accent'
            : p.reservado
              ? 'text-ledger-warning'
              : p.contaCapital
                ? 'text-ink-muted'
                : 'text-ink',
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
      'bg-surface-raised rounded-xl border p-4 flex flex-col gap-2 transition-shadow duration-150',
      hasHighlight ? 'border-accent/40 shadow-sm' : 'border-canvas-border',
    )}>
      <div className="flex items-baseline justify-between pb-2 border-b border-canvas-border">
        <h4 className="text-[13px] font-semibold text-ink">{grupo.membroNome.trim()}</h4>
        <span className="text-[15px] font-semibold tabular-nums text-ink">
          {formatCurrency(grupo.saldoGeral)}
        </span>
      </div>
      <div>
        {visíveis.map((p) => (
          <PortadorRow key={p.id} p={p} highlighted={p.id === highlightedId} />
        ))}
        {visíveis.length === 0 && (
          <p className="text-[13px] text-ink-subtle py-1">Sem saldo</p>
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
          <div key={i} className="bg-surface-raised rounded-xl border border-canvas-border p-4">
            <div className="h-4 w-32 bg-canvas-border rounded mb-3 animate-pulse" />
            <div className="space-y-2">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-8 bg-canvas-border/50 rounded animate-pulse" />
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
      <h3 className="text-[13px] font-semibold text-ink-muted uppercase tracking-[0.07em] mb-3">
        Portadores por Membro
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grupos.map((g) => (
          <GrupoCard key={g.membroId} grupo={g} highlightedId={highlightedId} />
        ))}
      </div>
    </div>
  );
}

import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

/** Bloco de skeleton genérico com animate-pulse */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded bg-slate-200 dark:bg-slate-700',
        className,
      )}
    />
  );
}

/** Linha de texto skeleton */
export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={clsx('h-4 w-full', className)} />;
}

/** Skeleton de tabela: N linhas com colunas de larguras variadas */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={clsx('h-9 flex-1', c === 0 && 'max-w-[120px]')} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Skeleton de card (ex: portadores, KPIs) */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={clsx('rounded-lg p-4 space-y-3 bg-slate-50 dark:bg-slate-700/40', className)}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-5 w-28" />
    </div>
  );
}

/** Skeleton de página inteira — exibido pelo Suspense no lazy loading */
export function PageSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <Skeleton className="h-7 w-48" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonTable rows={6} cols={4} />
    </div>
  );
}

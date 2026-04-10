import { Check, RotateCcw, CreditCard, Repeat, FileText, Calendar, Building2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Pagamento, StatusPagamento } from '../api';

const statusConfig: Record<StatusPagamento, { label: string; classes: string }> = {
  pago:     { label: 'Pago',     classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  vencido:  { label: 'Vencido',  classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  vencendo: { label: 'Vencendo', classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  pendente: { label: 'Pendente', classes: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
};

interface ContaRowProps {
  pagamento: Pagamento;
  isAdmin: boolean;
  onBaixa: (id: number) => void;
  onDesfazer: (id: number) => void;
  loadingId: number | null;
}

function ContaIcones({ conta }: { conta: Pagamento['conta'] }) {
  return (
    <div className="flex gap-1">
      {conta.debitacartao && <CreditCard className="w-3.5 h-3.5 text-blue-400" aria-label="Débita cartão" />}
      {conta.debitoauto && <Repeat className="w-3.5 h-3.5 text-violet-400" aria-label="Débito automático" />}
      {conta.pagamentomanual && <FileText className="w-3.5 h-3.5 text-slate-400" aria-label="Pagamento manual" />}
      {conta.contaanual && <Calendar className="w-3.5 h-3.5 text-amber-400" aria-label="Conta anual" />}
      {conta.pertenceafolha && <Building2 className="w-3.5 h-3.5 text-indigo-400" aria-label="Pertence à folha" />}
    </div>
  );
}

export function ContaRow({ pagamento, isAdmin, onBaixa, onDesfazer, loadingId }: ContaRowProps) {
  const { conta, status } = pagamento;
  const cfg = statusConfig[status];
  const isLoading = loadingId === pagamento.idcontapagamentos;

  return (
    <div
      className={cn(
        'flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors',
        status === 'vencido' && 'bg-red-50/50 dark:bg-red-900/10',
        status === 'vencendo' && 'bg-amber-50/50 dark:bg-amber-900/10',
      )}
    >
      {/* Status badge */}
      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0', cfg.classes)}>
        {cfg.label}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
            {conta.descricao}
          </p>
          <ContaIcones conta={conta} />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">
          {conta.credor?.nome && `${conta.credor.nome} · `}
          {pagamento.dataconta
            ? format(parseISO(pagamento.dataconta), "dd/MM", { locale: ptBR })
            : '—'}
          {pagamento.databaixa && ` · pago ${format(parseISO(pagamento.databaixa), "dd/MM", { locale: ptBR })}`}
        </p>
      </div>

      {/* Valor */}
      <span className={cn(
        'text-sm font-semibold tabular-nums flex-shrink-0',
        status === 'pago' ? 'text-emerald-600 dark:text-emerald-400' :
        status === 'vencido' ? 'text-red-600 dark:text-red-400' :
        'text-slate-800 dark:text-slate-200',
      )}>
        {formatCurrency(conta.valor)}
      </span>

      {/* Ação rápida (admin) */}
      {isAdmin && (
        status === 'pago' ? (
          <button
            onClick={() => onDesfazer(pagamento.idcontapagamentos)}
            disabled={isLoading}
            title="Desfazer baixa"
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex-shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={() => onBaixa(pagamento.idcontapagamentos)}
            disabled={isLoading}
            title="Marcar como pago"
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex-shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )
      )}
    </div>
  );
}

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NavegadorMesProps {
  mes: string; // "YYYY-MM"
  onChange: (mes: string) => void;
}

export function NavegadorMes({ mes, onChange }: NavegadorMesProps) {
  const date = parseISO(`${mes}-01`);

  function prev() {
    onChange(format(addMonths(date, -1), 'yyyy-MM'));
  }

  function next() {
    onChange(format(addMonths(date, 1), 'yyyy-MM'));
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={prev}
        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="text-base font-semibold text-slate-800 dark:text-white min-w-36 text-center capitalize">
        {format(date, 'MMMM yyyy', { locale: ptBR })}
      </span>
      <button
        onClick={next}
        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

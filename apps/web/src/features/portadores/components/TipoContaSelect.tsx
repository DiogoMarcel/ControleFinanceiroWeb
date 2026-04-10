import { useState, useRef, useEffect } from 'react';
import { Landmark, Wallet, TrendingUp, PiggyBank, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const tipoOptions = [
  { value: 'C', label: 'Conta Corrente',    icon: <Landmark   className="w-4 h-4 text-blue-500" /> },
  { value: 'D', label: 'Dinheiro/Carteira', icon: <Wallet     className="w-4 h-4 text-emerald-500" /> },
  { value: 'I', label: 'Investimento',      icon: <TrendingUp className="w-4 h-4 text-purple-500" /> },
  { value: 'P', label: 'Poupança',          icon: <PiggyBank  className="w-4 h-4 text-amber-500" /> },
] as const;

export type TipoConta = (typeof tipoOptions)[number]['value'];

interface TipoContaSelectProps {
  value: TipoConta;
  onChange: (value: TipoConta) => void;
  disabled?: boolean;
}

export function TipoContaSelect({ value, onChange, disabled }: TipoContaSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = tipoOptions.find((o) => o.value === value) ?? tipoOptions[0];

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm',
          'bg-white dark:bg-slate-700 text-slate-900 dark:text-white',
          'border-slate-300 dark:border-slate-600',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        <span className="flex items-center gap-2">
          {selected.icon}
          {selected.label}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
          {tipoOptions.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                  'hover:bg-slate-50 dark:hover:bg-slate-700',
                  o.value === value
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-slate-700 dark:text-slate-200',
                )}
              >
                {o.icon}
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

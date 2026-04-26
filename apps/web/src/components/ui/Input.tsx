import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, rightElement, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-[13px] font-medium text-ink-muted">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full h-9 px-3 text-[13px] rounded-lg border bg-surface-raised',
              'border-canvas-border text-ink placeholder:text-ink-subtle',
              'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/60',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-ledger-danger/60 focus:ring-ledger-danger/25 focus:border-ledger-danger/70',
              rightElement && 'pr-10',
              className,
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-ledger-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

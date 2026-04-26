import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-accent text-white hover:opacity-90 active:opacity-80',
      secondary:
        'bg-surface-raised text-ink border border-canvas-border hover:bg-surface active:bg-surface',
      ghost: 'text-ink-muted hover:bg-surface hover:text-ink active:bg-canvas-border',
      danger: 'bg-ledger-danger text-white hover:opacity-90 active:opacity-80',
    };

    const sizes = {
      sm: 'h-8 px-3 text-[13px] gap-1.5',
      md: 'h-9 px-4 text-[13px] gap-2',
      lg: 'h-11 px-6 text-sm gap-2',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

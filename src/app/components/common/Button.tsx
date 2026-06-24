import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../ui/utils';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-primary-foreground hover:opacity-90 active:opacity-80',
  secondary:
    'border border-border-strong bg-surface-2 text-text-secondary hover:border-brand-border hover:bg-surface-hover hover:text-text',
  tertiary:
    'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text',
  ghost:
    'bg-brand-muted text-brand hover:bg-brand-surface active:bg-brand-surface',
  destructive:
    'bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/25',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-[var(--tap-sm)] px-2.5 py-1 text-xs gap-1.5',
  md: 'min-h-[var(--tap-md)] px-3 py-2 text-sm gap-2',
  lg: 'min-h-[var(--tap-lg)] px-4 py-2.5 text-base gap-2',
  icon: 'min-h-[var(--tap-md)] min-w-[var(--tap-md)] p-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-sm font-medium outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

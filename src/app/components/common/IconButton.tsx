import { forwardRef, type ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../ui/utils';

type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon;
  label: string;
  size?: IconButtonSize;
  active?: boolean;
}

const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'min-h-[var(--tap-sm)] min-w-[var(--tap-sm)]',
  md: 'min-h-[var(--tap-md)] min-w-[var(--tap-md)]',
  lg: 'min-h-[var(--tap-lg)] min-w-[var(--tap-lg)]',
};

const iconSizes: Record<IconButtonSize, string> = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon: Icon, label, size = 'md', active, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center justify-center rounded-sm outline-none transition-colors',
        'bg-transparent text-text-muted hover:bg-surface-hover hover:text-text',
        'focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        sizeStyles[size],
        active && 'bg-surface-hover text-text',
        className,
      )}
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </button>
  ),
);
IconButton.displayName = 'IconButton';

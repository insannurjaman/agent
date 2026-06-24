import type { ReactNode } from 'react';
import { cn } from '../ui/utils';

export function FilterChip({
  selected,
  onToggle,
  label,
  count,
  color,
  children,
  className,
  compact,
}: {
  selected: boolean;
  onToggle: () => void;
  label?: string;
  count?: number;
  color?: string;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border font-mono font-medium transition-colors',
        'focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        compact ? 'min-h-8 px-1.5 py-0.5 text-[10px]' : 'min-h-11 px-2.5 py-1 text-[11px]',
        selected
          ? 'border-brand-border bg-brand-muted text-brand'
          : 'border-border-strong bg-surface-2 text-text-muted hover:border-brand-border hover:text-text',
        className,
      )}
    >
      {color && (
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ background: selected ? color : 'var(--border-strong)' }}
        />
      )}
      {children ?? label}
      {count !== undefined && (
        <span className={cn('ml-0.5 tabular-nums', selected ? 'text-brand/70' : 'text-text-muted/70')}>
          {count}
        </span>
      )}
    </button>
  );
}

import { cn } from '../ui/utils';

export function FilterChip({
  selected,
  onToggle,
  label,
  count,
  className,
}: {
  selected: boolean;
  onToggle: () => void;
  label: string;
  count?: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 rounded-sm border px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider transition-colors',
        'focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        selected
          ? 'border-brand-border bg-brand-muted text-brand'
          : 'border-border-strong bg-surface-2 text-text-muted hover:border-brand-border hover:text-text',
        className,
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn('ml-0.5 tabular-nums', selected ? 'text-brand/70' : 'text-text-muted/70')}>
          {count}
        </span>
      )}
    </button>
  );
}

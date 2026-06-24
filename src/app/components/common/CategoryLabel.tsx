import { cn } from '../ui/utils';

export function CategoryLabel({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border border-border-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted',
        className,
      )}
    >
      {category}
    </span>
  );
}

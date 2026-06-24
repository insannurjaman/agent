import { cn } from '../ui/utils';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

const PRIORITY_STYLE: Record<PriorityLevel, { text: string; border: string; bg: string; dot: string }> = {
  critical: { text: 'text-error', border: 'border-error/30', bg: 'bg-error/10', dot: 'bg-error' },
  high: { text: 'text-brand', border: 'border-brand-border', bg: 'bg-brand-muted', dot: 'bg-brand' },
  medium: { text: 'text-amber', border: 'border-amber/30', bg: 'bg-amber/10', dot: 'bg-amber' },
  low: { text: 'text-text-muted', border: 'border-border-strong', bg: 'bg-surface-2', dot: 'bg-text-muted' },
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: PriorityLevel;
  className?: string;
}) {
  const s = PRIORITY_STYLE[priority];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em]',
        s.text,
        s.border,
        s.bg,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {priority}
    </span>
  );
}

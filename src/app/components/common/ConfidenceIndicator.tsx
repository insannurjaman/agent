import { cn } from '../ui/utils';

export type ConfidenceLevel = 'high' | 'medium-high' | 'medium' | 'low';

const CONFIDENCE_STYLE: Record<ConfidenceLevel, { color: string; label: string; bars: number }> = {
  high: { color: 'bg-confidence-high', label: 'High confidence', bars: 4 },
  'medium-high': { color: 'bg-confidence-medium-high', label: 'Medium-high confidence', bars: 3 },
  medium: { color: 'bg-confidence-medium', label: 'Medium confidence', bars: 2 },
  low: { color: 'bg-confidence-low', label: 'Low confidence', bars: 1 },
};

export function ConfidenceIndicator({
  level,
  showBars = false,
  showLabel = false,
  className,
}: {
  level: ConfidenceLevel;
  showBars?: boolean;
  showLabel?: boolean;
  className?: string;
}) {
  const s = CONFIDENCE_STYLE[level];

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} aria-label={s.label}>
      <span className={cn('size-1.5 rounded-full', s.color)} />
      {showLabel && (
        <span className="text-xs text-text-secondary">{s.label}</span>
      )}
      {showBars && (
        <span className="inline-flex gap-0.5" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <span
              key={i}
              className={cn(
                'size-1.5 rounded-sm',
                i < s.bars ? s.color : 'bg-border-strong',
              )}
            />
          ))}
        </span>
      )}
    </span>
  );
}

import { cn } from '../ui/utils';

export type ConfidenceLevel = 'high' | 'medium-high' | 'medium' | 'low';

const CONFIDENCE_STYLE: Record<ConfidenceLevel, { color: string; emptyColor: string; label: string; bars: number }> = {
  high: { color: 'bg-confidence-high', emptyColor: 'bg-border-subtle', label: 'HIGH', bars: 4 },
  'medium-high': { color: 'bg-confidence-medium-high', emptyColor: 'bg-border-subtle', label: 'MED-HIGH', bars: 3 },
  medium: { color: 'bg-confidence-medium', emptyColor: 'bg-border-subtle', label: 'MEDIUM', bars: 2 },
  low: { color: 'bg-confidence-low', emptyColor: 'bg-border-subtle', label: 'LOW', bars: 1 },
};

export function ConfidenceIndicator({
  level,
  className,
}: {
  level: ConfidenceLevel;
  className?: string;
}) {
  const s = CONFIDENCE_STYLE[level];

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Confidence: ${level}`}
    >
      <span className="inline-flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-3 w-2 rounded-[1px]',
              i < s.bars ? s.color : s.emptyColor,
            )}
          />
        ))}
      </span>
      <span className="font-mono text-[11px] font-medium text-text-secondary">
        {s.label}
      </span>
    </span>
  );
}

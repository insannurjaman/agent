import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip';
import { cn } from '../ui/utils';

export type ConfidenceLevel = 'high' | 'medium-high' | 'medium' | 'low';

const CONFIDENCE_STYLE: Record<ConfidenceLevel, { color: string; emptyColor: string; label: string; bars: number; percent: string }> = {
  high: { color: 'bg-confidence-high', emptyColor: 'bg-border-subtle', label: 'High', bars: 4, percent: '92%' },
  'medium-high': { color: 'bg-confidence-medium-high', emptyColor: 'bg-border-subtle', label: 'Med-high', bars: 3, percent: '78%' },
  medium: { color: 'bg-confidence-medium', emptyColor: 'bg-border-subtle', label: 'Medium', bars: 2, percent: '62%' },
  low: { color: 'bg-confidence-low', emptyColor: 'bg-border-subtle', label: 'Low', bars: 1, percent: '40%' },
};

const CONFIDENCE_EXPLANATIONS: Record<ConfidenceLevel, string> = {
  high: 'Strong evidence from multiple validated experiments. High reliability for decision-making.',
  'medium-high': 'Good evidence with minor limitations. Reliable for most operational decisions.',
  medium: 'Moderate evidence with some gaps. Use with caution; consider additional validation.',
  low: 'Limited or preliminary evidence. Not recommended for critical decisions without further investigation.',
};

export function ConfidenceIndicator({
  level,
  showPercent = true,
  showTooltip = true,
  className,
}: {
  level: ConfidenceLevel;
  showPercent?: boolean;
  showTooltip?: boolean;
  className?: string;
}) {
  const s = CONFIDENCE_STYLE[level];

  const indicator = (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Confidence: ${level}${showPercent ? ` ${s.percent}` : ''}`}
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
        {showPercent && <span className="ml-1 text-text-muted">({s.percent})</span>}
      </span>
    </span>
  );

  if (!showTooltip) return indicator;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-xs">
          <div className="text-[12px] font-medium text-text">{s.label} confidence ({s.percent})</div>
          <div className="mt-1 text-[12px] text-text-secondary">{CONFIDENCE_EXPLANATIONS[level]}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
import type { ReactNode } from 'react';
import { cn } from '../ui/utils';

interface Segment {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

export function SegmentedControl({
  segments,
  value,
  onChange,
  className,
  compact,
}: {
  segments: Segment[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="View options"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-sm border border-border-strong bg-surface-2 p-0.5',
        compact ? 'min-h-9' : 'min-h-11 w-full',
        className,
      )}
    >
      {segments.map((seg) => {
        const active = seg.id === value;
        return (
          <button
            key={seg.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(seg.id)}
            className={cn(
              'flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm transition-colors',
              'focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              compact ? 'min-h-8 px-2 text-[12px]' : 'min-h-10 flex-1 px-3 text-[13px] font-medium',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {seg.icon}
            {seg.label}
            {seg.count !== undefined && (
              <span
                className={cn(
                  'ml-0.5 font-mono text-[11px] tabular-nums',
                  active ? 'text-foreground/70' : 'text-muted-foreground/70',
                )}
              >
                {seg.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

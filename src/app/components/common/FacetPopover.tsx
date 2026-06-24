import { useState } from 'react';
import { X } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { cn } from '../ui/utils';

interface FacetPopoverProps {
  facets: string[];
  maxVisible?: number;
}

export function FacetPopover({ facets, maxVisible = 2 }: FacetPopoverProps) {
  const [open, setOpen] = useState(false);
  const shown = facets.slice(0, maxVisible);
  const extra = facets.length - shown.length;

  if (facets.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex flex-wrap items-center gap-1">
          {shown.map((f) => (
            <span
              key={f}
              className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-secondary"
            >
              {f}
            </span>
          ))}
          {extra > 0 && (
            <button
              type="button"
              className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-muted hover:text-text hover:border-border-strong transition-colors"
              aria-label={`Show ${extra} more facets`}
            >
              +{extra} more
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={4} className="w-64 p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Facets ({facets.length})</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex size-6 items-center justify-center rounded-sm text-text-muted hover:text-text"
            aria-label="Close"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1 max-h-48 overflow-auto">
          {facets.map((f) => (
            <span
              key={f}
              className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-text-secondary"
            >
              {f}
            </span>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
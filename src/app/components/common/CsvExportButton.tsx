import { Download } from 'lucide-react';
import { cn } from '../ui/utils';

// Disabled-by-default CSV export control. The full specification is being
// finalized; once it lands this component will become a thin wrapper around
// the export service. Today it surfaces a clear, accessible "unavailable"
// state so users are not misled.
export function CsvExportButton({
  label = 'Export CSV',
  pendingLabel = 'CSV export specification is being finalized.',
  className,
}: {
  label?: string;
  pendingLabel?: string;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex', className)}>
      <button
        type="button"
        disabled
        aria-disabled="true"
        title={pendingLabel}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2.5 font-mono text-[11px] text-text-muted opacity-60 cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring',
        )}
      >
        <Download className="size-3" />
        {label}
      </button>
      <span className="sr-only">{pendingLabel}</span>
    </span>
  );
}

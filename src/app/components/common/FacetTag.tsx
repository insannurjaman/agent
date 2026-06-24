import { X } from 'lucide-react';
import { cn } from '../ui/utils';

export function FacetTag({
  field,
  value,
  removable = false,
  onRemove,
  className,
}: {
  field: string;
  value: string;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-border-strong bg-surface-2 px-2 py-0.5 font-mono text-xs text-text-secondary',
        className,
      )}
    >
      <span className="text-text-muted">{field}:</span>
      <span>{value}</span>
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${field}:${value}`}
          className="ml-0.5 rounded-sm p-0.5 text-text-muted hover:bg-surface-hover hover:text-text"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

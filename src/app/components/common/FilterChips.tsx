import { X } from 'lucide-react';
import { cn } from '../ui/utils';

export function FilterChips({
  chips,
  onRemove,
  onClearAll,
}: {
  chips: { group: string; key: string; label: string; value: string }[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}) {
  if (chips.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-6 py-2 border-b border-border-subtle bg-surface/50"
      role="region"
      aria-label="Active filters"
    >
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1 font-mono text-[11px] text-text-secondary"
        >
          <span className="text-text-muted">{chip.label}:</span>
          <span className="font-medium">{chip.value}</span>
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            className="ml-1 flex size-5 items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-[11px] text-text-muted hover:text-text transition-colors"
        >
          <X className="size-3" />
          Clear all
        </button>
      )}
    </div>
  );
}

import { cn } from '../ui/utils';

// Compact mono segmented tabs (e.g. Chat / Context / Artifact on mobile).
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex rounded-sm border border-border-subtle bg-surface-2 p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 rounded-sm px-2.5 py-1.5 text-center font-mono text-[12px] transition-colors',
            value === o.value ? 'bg-elevated text-text' : 'text-text-muted hover:text-text-secondary',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

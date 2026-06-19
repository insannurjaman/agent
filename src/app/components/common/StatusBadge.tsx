import { cn } from '../ui/utils';

// Single source of truth for every badge color rule in the brief.
// Renders a small uppercase, low-radius, dot-prefixed industrial chip.

export type StatusTone =
  | 'brand'
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'lineage'
  | 'neutral'
  | 'green'
  | 'teal'
  | 'amber'
  | 'red'
  | 'blue'
  | 'purple'
  | 'muted';

const TONE: Record<StatusTone, { text: string; border: string; bg: string; dot: string }> = {
  brand: { text: 'text-brand', border: 'border-brand-border', bg: 'bg-brand-muted', dot: 'bg-brand' },
  success: { text: 'text-success', border: 'border-success/30', bg: 'bg-success/10', dot: 'bg-success' },
  info: { text: 'text-info', border: 'border-info/30', bg: 'bg-info/10', dot: 'bg-info' },
  warning: { text: 'text-warning', border: 'border-warning/30', bg: 'bg-warning/10', dot: 'bg-warning' },
  error: { text: 'text-error', border: 'border-error/30', bg: 'bg-error/10', dot: 'bg-error' },
  lineage: { text: 'text-lineage', border: 'border-lineage/30', bg: 'bg-lineage/10', dot: 'bg-lineage' },
  neutral: { text: 'text-text-muted', border: 'border-border-strong', bg: 'bg-surface-2', dot: 'bg-text-muted' },
  green: { text: 'text-green', border: 'border-green/30', bg: 'bg-green/10', dot: 'bg-green' },
  teal: { text: 'text-teal', border: 'border-teal/30', bg: 'bg-teal/10', dot: 'bg-teal' },
  amber: { text: 'text-amber', border: 'border-amber/30', bg: 'bg-amber/10', dot: 'bg-amber' },
  red: { text: 'text-red', border: 'border-red/30', bg: 'bg-red/10', dot: 'bg-red' },
  blue: { text: 'text-blue', border: 'border-blue/30', bg: 'bg-blue/10', dot: 'bg-blue' },
  purple: { text: 'text-purple', border: 'border-purple/30', bg: 'bg-purple/10', dot: 'bg-purple' },
  muted: { text: 'text-text-muted', border: 'border-border-strong', bg: 'bg-surface-2', dot: 'bg-text-muted' },
};

const VALUE_TONE: Record<string, StatusTone> = {
  // finding category
  factor: 'blue',
  schema: 'info',
  'data-quality': 'warning',
  process: 'blue',
  hypothesis: 'lineage',
  'anomaly-pattern': 'error',
  method: 'info',
  // confidence
  high: 'success',
  'medium-high': 'success',
  medium: 'warning',
  low: 'neutral',
  superseded: 'neutral',
  // question status
  open: 'blue',
  resolved: 'success',
  'in-progress': 'info',
  'partial-progress': 'warning',
  // report status
  report: 'success',
  'exploration-only': 'warning',
  missing: 'neutral',
  outdated: 'error',
  // edge types
  origin: 'brand',
  cite: 'blue',
  'report-use': 'info',
  supersedes: 'lineage',
  'conflict-suspected': 'error',
  'resolve-partial': 'warning',
  relates: 'neutral',
  addresses: 'blue',
  strengthens: 'success',
  resolves: 'success',
  'relates-finding': 'neutral',
};

const LABELS: Record<string, string> = {
  report: 'REPORT available',
  'exploration-only': 'Exploration Only',
  missing: 'Missing REPORT',
  outdated: 'Outdated data',
  'medium-high': 'medium-high',
};

export function StatusBadge({
  value,
  tone,
  showDot = true,
  className,
}: {
  value: string;
  tone?: StatusTone;
  showDot?: boolean;
  className?: string;
}) {
  const t = TONE[tone ?? VALUE_TONE[value] ?? 'muted'];
  const label = LABELS[value] ?? value;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em]',
        t.text,
        t.border,
        t.bg,
        className,
      )}
    >
      {showDot && <span className={cn('size-1.5 rounded-full', t.dot)} />}
      {label}
    </span>
  );
}

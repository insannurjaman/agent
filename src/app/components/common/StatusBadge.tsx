import { cn } from '../ui/utils';

// Single source of truth for every badge color rule in the brief.
// Renders a small uppercase, low-radius, dot-prefixed industrial chip.

type Tone = 'green' | 'teal' | 'amber' | 'red' | 'blue' | 'purple' | 'muted';

const TONE: Record<Tone, { text: string; border: string; bg: string; dot: string }> = {
  green: { text: 'text-green', border: 'border-green/30', bg: 'bg-green/10', dot: 'bg-green' },
  teal: { text: 'text-teal', border: 'border-teal/30', bg: 'bg-teal/10', dot: 'bg-teal' },
  amber: { text: 'text-amber', border: 'border-amber/30', bg: 'bg-amber/10', dot: 'bg-amber' },
  red: { text: 'text-red', border: 'border-red/30', bg: 'bg-red/10', dot: 'bg-red' },
  blue: { text: 'text-blue', border: 'border-blue/30', bg: 'bg-blue/10', dot: 'bg-blue' },
  purple: { text: 'text-purple', border: 'border-purple/30', bg: 'bg-purple/10', dot: 'bg-purple' },
  muted: { text: 'text-text-muted', border: 'border-border-strong', bg: 'bg-surface-2', dot: 'bg-text-muted' },
};

const VALUE_TONE: Record<string, Tone> = {
  // finding category
  factor: 'blue',
  schema: 'teal',
  'data-quality': 'amber',
  process: 'blue',
  hypothesis: 'purple',
  'anomaly-pattern': 'red',
  method: 'teal',
  // confidence
  high: 'green',
  'medium-high': 'green',
  medium: 'amber',
  low: 'muted',
  superseded: 'muted',
  // question status
  open: 'blue',
  resolved: 'green',
  'in-progress': 'teal',
  'partial-progress': 'amber',
  // report status
  report: 'green',
  'exploration-only': 'amber',
  missing: 'muted',
  outdated: 'red',
  // edge types
  origin: 'green',
  cite: 'blue',
  'report-use': 'teal',
  supersedes: 'purple',
  'conflict-suspected': 'red',
  'resolve-partial': 'amber',
  relates: 'muted',
  addresses: 'blue',
  strengthens: 'green',
  resolves: 'green',
  'relates-finding': 'muted',
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
  tone?: Tone;
  showDot?: boolean;
  className?: string;
}) {
  const t = TONE[tone ?? VALUE_TONE[value] ?? 'muted'];
  const label = LABELS[value] ?? value;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide whitespace-nowrap',
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

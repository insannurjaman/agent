import { AlertTriangle, Flag, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '../ui/utils';
import type { Finding, OpenQuestion } from '../../data';
import { countThisWeek } from '../findings/dateUtils';

export function SummaryMetrics({
  findings,
  questions,
  activeMetricId,
  onMetricClick,
}: {
  findings: Finding[];
  questions: OpenQuestion[];
  activeMetricId?: string | null;
  onMetricClick?: (id: string) => void;
}) {
  const actionRequired = findings.filter((f) => f.actionable).length;
  const highConfidence = findings.filter((f) => ['high', 'medium-high'].includes(f.confidence)).length;
  const highPriority = questions.filter((q) => q.priority === 'high').length;
  const newThisWeek = countThisWeek(findings, questions);
  const recentlyResolved = questions.filter((q) => q.status === 'resolved').length;

  interface Metric {
    id: string;
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }
  const metrics: (Metric & { onClick?: () => void })[] = [
    { id: 'action-required', label: 'Action Required', value: actionRequired, icon: <AlertTriangle className="size-4" />, color: 'text-brand', onClick: () => onMetricClick?.('action-required') },
    { id: 'high-confidence', label: 'High Confidence', value: highConfidence, icon: <Zap className="size-4" />, color: 'text-amber', onClick: () => onMetricClick?.('high-confidence') },
    { id: 'high-priority', label: 'High Priority', value: highPriority, icon: <Flag className="size-4" />, color: 'text-error', onClick: () => onMetricClick?.('high-priority') },
    { id: 'new-this-week', label: 'New This Week', value: newThisWeek, icon: <Clock className="size-4" />, color: 'text-info', onClick: () => onMetricClick?.('new-this-week') },
    { id: 'recently-resolved', label: 'Recently Resolved', value: recentlyResolved, icon: <CheckCircle2 className="size-4" />, color: 'text-success', onClick: () => onMetricClick?.('recently-resolved') },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto px-6 py-3 border-b border-border-subtle bg-surface/50" role="region" aria-label="Summary metrics">
      {metrics.map((m) => {
        const isActive = activeMetricId === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={m.onClick}
            aria-pressed={isActive}
            className={cn(
              'flex min-w-[140px] shrink-0 items-center gap-2 rounded-sm border px-3 py-2 transition-colors cursor-pointer',
              isActive
                ? 'border-brand bg-brand-muted/20 ring-1 ring-brand-ring'
                : 'border-border-subtle bg-surface hover:border-border-strong hover:bg-surface-hover',
              'focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
            aria-label={`${m.label}: ${m.value}`}
          >
            <span className={cn('shrink-0', m.color)}>{m.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted">{m.label}</div>
              <div className="text-[18px] font-medium tabular-nums text-text">{m.value}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

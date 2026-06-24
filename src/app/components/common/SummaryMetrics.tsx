import { useSearchParams } from 'react-router';
import { AlertTriangle, Flag, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { cn } from '../ui/utils';
import type { Finding, OpenQuestion } from '../../data';

interface Metric {
  id: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

export function SummaryMetrics({
  findings,
  questions,
}: {
  findings: Finding[];
  questions: OpenQuestion[];
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const actionRequired = findings.filter((f) => f.actionable).length;
  const highConfidence = findings.filter((f) => ['high', 'medium-high'].includes(f.confidence)).length;
  const highPriority = questions.filter((q) => q.priority === 'high').length;
  const newThisWeek = [
    ...findings.filter((f) => new Date(f.date) >= weekAgo),
    ...questions.filter((q) => new Date(q.raisedDate) >= weekAgo),
  ].length;
  const recentlyResolved = questions.filter((q) => q.status === 'resolved').length;

  const metrics: Metric[] = [
    {
      id: 'action-required',
      label: 'Action Required',
      value: actionRequired,
      icon: <AlertTriangle className="size-4" />,
      color: 'text-brand',
      onClick: () => {
        const params = new URLSearchParams(searchParams);
        params.set('actionable', 'true');
        params.set('tab', 'findings');
        navigate(`/findings?${params.toString()}`);
      },
    },
    {
      id: 'high-confidence',
      label: 'High Confidence',
      value: highConfidence,
      icon: <Zap className="size-4" />,
      color: 'text-amber',
      onClick: () => {
        const params = new URLSearchParams(searchParams);
        params.set('conf', 'high');
        params.set('tab', 'findings');
        navigate(`/findings?${params.toString()}`);
      },
    },
    {
      id: 'high-priority',
      label: 'High Priority',
      value: highPriority,
      icon: <Flag className="size-4" />,
      color: 'text-error',
      onClick: () => {
        const params = new URLSearchParams(searchParams);
        params.set('tab', 'questions');
        params.set('priority', 'high');
        navigate(`/findings?${params.toString()}`);
      },
    },
    {
      id: 'new-this-week',
      label: 'New This Week',
      value: newThisWeek,
      icon: <Clock className="size-4" />,
      color: 'text-info',
      onClick: () => {
        const params = new URLSearchParams(searchParams);
        params.set('sort', 'date');
        navigate(`/findings?${params.toString()}`);
      },
    },
    {
      id: 'recently-resolved',
      label: 'Recently Resolved',
      value: recentlyResolved,
      icon: <CheckCircle2 className="size-4" />,
      color: 'text-success',
      onClick: () => {
        const params = new URLSearchParams(searchParams);
        params.set('status', 'resolved');
        params.set('tab', 'questions');
        navigate(`/findings?${params.toString()}`);
      },
    },
  ];

  return (
    <div
      className="flex gap-2 overflow-x-auto px-6 py-3 border-b border-border-subtle bg-surface/50"
      role="region"
      aria-label="Summary metrics"
    >
      {metrics.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={m.onClick}
          className={cn(
            'flex min-w-[140px] shrink-0 items-center gap-2 rounded-sm border border-border-subtle bg-surface px-3 py-2 transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            m.onClick && 'cursor-pointer',
          )}
          aria-label={`${m.label}: ${m.value}`}
        >
          <span className={cn('shrink-0', m.color)}>{m.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted">{m.label}</div>
            <div className="text-[18px] font-medium tabular-nums text-text">{m.value}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
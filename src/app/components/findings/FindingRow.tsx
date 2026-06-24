import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '../ui/utils';
import type { Finding } from '../../data';
import { getLatestVersion } from '../../data';
import { StatusBadge } from '../common/StatusBadge';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { ActionStateBadge, mapActionableToState } from '../common/ActionStateBadge';
import { RowMenu } from './RowMenu';

interface FindingRowProps {
  f: Finding;
  expanded: boolean;
  selected: boolean;
  density: 'comfortable' | 'compact';
  onToggle: () => void;
  onSelect: () => void;
  onGoLatest: (id: string) => void;
}

export function FindingRow({
  f,
  expanded,
  selected,
  density,
  onToggle,
  onSelect,
  onGoLatest,
}: FindingRowProps) {
  const navigate = useNavigate();
  const isSuperseded = f.confidence === 'superseded' || !!f.supersededBy;
  const actionState = mapActionableToState(f.actionable, f.confidence);
  const rowHeight = density === 'comfortable' ? 'h-[48px]' : 'h-[42px]';

  return (
    <>
      <tr
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
        tabIndex={0}
        role="button"
        aria-pressed={selected}
        className={cn(
          'cursor-pointer border-b border-border-subtle transition-colors',
          rowHeight,
          'hover:bg-surface-2',
          selected && 'bg-brand-muted/30',
          isSuperseded && 'opacity-55',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        <td className="px-1 text-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
            className="flex size-8 items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
          >
            <ChevronRight className={cn('size-4 transition-transform', expanded && 'rotate-90')} />
          </button>
        </td>
        <td className="px-3 py-2">
          <span className="font-mono text-[13px] text-text whitespace-nowrap">{f.id}</span>
        </td>
        <td className="px-3 py-2 text-text min-w-[320px]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="line-clamp-2 min-w-0">{f.title}</span>
            {isSuperseded && <StatusBadge value="superseded" showDot={false} />}
          </div>
        </td>
        <td className="px-3 py-2">
          <StatusBadge value={f.category} showDot={false} />
        </td>
        <td className="px-3 py-2">
          {f.confidence === 'superseded' ? (
            <StatusBadge value="superseded" />
          ) : (
            <ConfidenceIndicator level={f.confidence as 'high' | 'medium-high' | 'medium' | 'low'} showPercent showTooltip />
          )}
        </td>
        <td className="px-3 py-2">
          <ActionStateBadge state={actionState} showDot={false} />
        </td>
        <td className="px-3 py-2">
          <span className="font-mono text-[12px] text-text-muted whitespace-nowrap">{f.date}</span>
        </td>
        <td className="px-1">
          <RowMenu id={f.id} />
        </td>
      </tr>
      {expanded && (
        <tr className={cn('border-b border-border-subtle bg-surface', isSuperseded && 'opacity-70')}>
          <td />
          <td colSpan={8} className="px-3 pb-3 pt-1">
            <p className="max-w-3xl text-[13px] leading-relaxed text-text-secondary">{f.summary}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Evidence:</span>
              <span className="font-mono text-[12px] text-info">{f.evidence.replace('experiments/', '')}</span>
            </div>
            {f.supersedes && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Supersedes:</span>
                <span className="font-mono text-[12px] text-text-muted">{f.supersedes}</span>
              </div>
            )}
            {f.supersededBy && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Superseded By:</span>
                <span className="font-mono text-[12px] text-brand">{f.supersededBy}</span>
              </div>
            )}
            {f.relatedQuestions && f.relatedQuestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Related Questions:</span>
                {f.relatedQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/findings?tab=questions&focus=${q}`);
                    }}
                    className="text-left font-mono text-[12px] text-brand hover:underline"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {isSuperseded && f.supersededBy && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onGoLatest(getLatestVersion(f.id));
                }}
                className="mt-2 inline-flex items-center gap-1 font-mono text-[12px] text-brand hover:underline"
              >
                Go to Latest Version {getLatestVersion(f.id)} <ChevronRight className="size-3" />
              </button>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
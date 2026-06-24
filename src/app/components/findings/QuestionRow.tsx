import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '../ui/utils';
import type { OpenQuestion } from '../../data';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge'
import { RowMenu } from './RowMenu';

interface QuestionRowProps {
  q: OpenQuestion;
  expanded: boolean;
  selected: boolean;
  density: 'comfortable' | 'compact';
  onToggle: () => void;
  onSelect: () => void;
}

export function QuestionRow({
  q,
  expanded,
  selected,
  density,
  onToggle,
  onSelect,
}: QuestionRowProps) {
  const navigate = useNavigate();
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
          <span className="font-mono text-[13px] text-amber whitespace-nowrap">{q.id}</span>
        </td>
        <td className="px-3 py-2 text-text min-w-[320px]">
          <span className="line-clamp-2">{q.title}</span>
        </td>
        <td className="px-3 py-2">
          <StatusBadge value={q.status} />
        </td>
        <td className="px-3 py-2">
          <PriorityBadge priority={q.priority as 'critical' | 'high' | 'medium' | 'low'} />
        </td>
        <td className="px-3 py-2">
          <span className="font-mono text-[12px] text-text-secondary">{q.area}</span>
        </td>
        <td className="px-3 py-2">
          <span className="font-mono text-[12px] text-text-muted whitespace-nowrap">{q.raisedDate}</span>
        </td>
        <td className="px-1">
          <RowMenu id={q.id} isQuestion />
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border-subtle bg-surface">
          <td />
          <td colSpan={8} className="px-3 pb-3 pt-1">
            <p className="max-w-3xl text-[13px] leading-relaxed text-text-secondary">
              {q.detail.split('| Date:')[0].trim()}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Raised By:</span>
              <span className="font-mono text-[12px] text-text-muted">{q.raisedBy}</span>
            </div>
            {q.related.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Related:</span>
                {q.related.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(r.startsWith('experiments/') ? `/experiments/${r}` : `/findings?focus=${r}`);
                    }}
                    className="text-left font-mono text-[12px] text-brand hover:underline"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
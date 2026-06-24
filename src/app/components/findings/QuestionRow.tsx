import { useNavigate } from 'react-router';
import { cn } from '../ui/utils';
import type { OpenQuestion } from '../../data';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge'
import { RowMenu } from './RowMenu';

interface QuestionRowProps {
  q: OpenQuestion;
  selected: boolean;
  density: 'comfortable' | 'compact';
  onSelect: () => void;
}

export function QuestionRow({ q, selected, density, onSelect }: QuestionRowProps) {
  const navigate = useNavigate();
  const rowHeight = density === 'comfortable' ? 'h-[48px]' : 'h-[42px]';

  return (
    <tr
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      role="row"
      aria-selected={selected}
      className={cn(
        'cursor-pointer border-b border-border-subtle transition-colors',
        rowHeight,
        'hover:bg-surface-2',
        selected && 'bg-brand-muted/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
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
  );
}

import { cn } from '../ui/utils';
import type { Finding } from '../../data';
import { StatusBadge } from '../common/StatusBadge';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { ActionStateBadge, mapActionableToState } from '../common/ActionStateBadge';
import { RowMenu } from './RowMenu';

interface FindingRowProps {
  f: Finding;
  selected: boolean;
  density: 'comfortable' | 'compact';
  onSelect: () => void;
}

export function FindingRow({ f, selected, density, onSelect }: FindingRowProps) {
  const isSuperseded = f.confidence === 'superseded' || !!f.supersededBy;
  const actionState = mapActionableToState(f.actionable, f.confidence);
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
        selected && 'border-l-2 border-brand bg-surface-hover',
        isSuperseded && 'opacity-55',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      <td className="px-3 py-2">
        <span className="font-mono text-[13px] text-text whitespace-nowrap">{f.id}</span>
      </td>
      <td className={cn('px-3 py-2 text-text min-w-[200px] xl:min-w-[320px]', selected && 'font-medium')}>
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
  );
}

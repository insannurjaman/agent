import { cn } from '../ui/utils';

export type ActionState =
  | 'action-required'
  | 'review-recommended'
  | 'no-action'
  | 'blocked';

const STATE_STYLE: Record<ActionState, { text: string; border: string; bg: string; dot: string; label: string }> = {
  'action-required': {
    text: 'text-action-required-text',
    border: 'border-action-required-border',
    bg: 'bg-action-required-bg',
    dot: 'bg-action-required-dot',
    label: 'Action Required',
  },
  'review-recommended': {
    text: 'text-review-recommended-text',
    border: 'border-review-recommended-border',
    bg: 'bg-review-recommended-bg',
    dot: 'bg-review-recommended-dot',
    label: 'Review Recommended',
  },
  'no-action': {
    text: 'text-no-action-text',
    border: 'border-no-action-border',
    bg: 'bg-no-action-bg',
    dot: 'bg-no-action-dot',
    label: 'No Action',
  },
  blocked: {
    text: 'text-blocked-text',
    border: 'border-blocked-border',
    bg: 'bg-blocked-bg',
    dot: 'bg-blocked-dot',
    label: 'Blocked',
  },
};

export function ActionStateBadge({
  state,
  showDot = true,
  className,
}: {
  state: ActionState;
  showDot?: boolean;
  className?: string;
}) {
  const s = STATE_STYLE[state];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em]',
        s.text,
        s.border,
        s.bg,
        className,
      )}
    >
      {showDot && <span className={cn('size-1.5 rounded-full', s.dot)} />}
      {s.label}
    </span>
  );
}

export function mapActionableToState(actionable: boolean, confidence?: string): ActionState {
  if (!actionable) return 'no-action';
  if (confidence === 'low') return 'review-recommended';
  return 'action-required';
}
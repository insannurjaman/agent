import { ChevronLeft, X } from 'lucide-react';
import type { GraphNode } from '../../data';
import { KIND_COLOR } from './graphConstants';

export function FocusContextBar({
  focusId,
  focusNode,
  hopDepth,
  nodeCount,
  edgeCount,
  canGoBack,
  onBack,
  onClear,
}: {
  focusId: string;
  focusNode: GraphNode;
  hopDepth: number;
  nodeCount: number;
  edgeCount: number;
  canGoBack: boolean;
  onBack: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border-subtle bg-surface/80 px-4 py-1.5 min-h-9">
      {canGoBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-sm px-1.5 py-1 font-mono text-[11px] text-text-muted hover:text-text transition-colors shrink-0"
          aria-label="Back to previous focus"
        >
          <ChevronLeft className="size-3.5" /> Back
        </button>
      )}
      <span className="size-2 shrink-0 rounded-full" style={{ background: KIND_COLOR[focusNode.kind] }} />
      <span className="font-mono text-[12px] font-medium text-text shrink-0">
        {focusId.replace('experiments/', '')}
      </span>
      <span className="truncate text-[13px] text-text-secondary min-w-0">{focusNode.label}</span>
      <span className="shrink-0 font-mono text-[10px] text-text-muted tabular-nums">
        {hopDepth}-hop · {nodeCount} nodes · {edgeCount} edges
      </span>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto shrink-0 flex items-center gap-1 rounded-sm px-1.5 py-1 font-mono text-[11px] text-text-muted hover:text-text transition-colors"
        aria-label="Clear focus"
      >
        <X className="size-3.5" /> Clear
      </button>
    </div>
  );
}

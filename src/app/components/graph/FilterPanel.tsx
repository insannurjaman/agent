import { useState } from 'react';
import { ChevronDown, X, RotateCcw } from 'lucide-react';
import type { EdgeType, NodeKind } from '../../data';
import { EDGE_GROUPS, EDGE_GROUP_ORDER, getGroupEdgeTypes, getGroupSelection, type EdgeGroup } from './edgeGroups';
import { KIND_COLOR } from './graphConstants';
import { cn } from '../ui/utils';

const ALL_EDGE_TYPES = EDGE_GROUP_ORDER.reduce<EdgeType[]>((acc, g) => [...acc, ...getGroupEdgeTypes(g)], []);

interface FilterPanelProps {
  activeKinds: Set<NodeKind>;
  activeEdgeTypes: Set<EdgeType>;
  kindCounts: Record<string, number>;
  onToggleKind: (kind: NodeKind) => void;
  onToggleEdgeType: (type: EdgeType) => void;
  onToggleGroup: (group: EdgeGroup) => void;
  onSelectAllKinds: () => void;
  onClearAllKinds: () => void;
  onResetToDefault: () => void;
  isDefault: boolean;
  onClose: () => void;
  nodeKinds: NodeKind[];
}

export function FilterPanel({
  activeKinds,
  activeEdgeTypes,
  kindCounts,
  onToggleKind,
  onToggleEdgeType,
  onToggleGroup,
  onSelectAllKinds,
  onClearAllKinds,
  onResetToDefault,
  isDefault,
  onClose,
  nodeKinds,
}: FilterPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const allKindsActive = nodeKinds.every((k) => activeKinds.has(k));

  const toggleExpandGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  return (
    <div className="flex flex-col" role="region" aria-label="Filters">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <span className="font-mono text-[11px] font-semibold text-text">Filters</span>
        <div className="flex items-center gap-2">
          {!isDefault && (
            <button type="button" onClick={onResetToDefault}
              className="flex items-center gap-1 font-mono text-[10px] text-text-muted hover:text-text transition-colors">
              <RotateCcw className="size-3" /> Reset
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close filter panel"
            className="flex size-7 items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors">
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Node types */}
      <div className="px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Node types</span>
          <div className="flex gap-2">
            <button type="button" onClick={onSelectAllKinds} className="font-mono text-[9px] text-text-muted hover:text-text transition-colors">Select all</button>
            <button type="button" onClick={onClearAllKinds} className="font-mono text-[9px] text-text-muted hover:text-text transition-colors">Clear all</button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {nodeKinds.map((kind) => {
            const checked = activeKinds.has(kind);
            return (
              <label key={kind} className="flex items-center gap-2 cursor-pointer min-h-8 rounded-sm px-2 hover:bg-surface-2 transition-colors">
                <input type="checkbox" checked={checked} onChange={() => onToggleKind(kind)} className="size-3.5 accent-brand rounded-sm" />
                <span className="size-2 rounded-full" style={{ background: KIND_COLOR[kind] }} />
                <span className="font-mono text-[12px] text-text flex-1 capitalize">{kind}</span>
                <span className="font-mono text-[10px] text-text-muted tabular-nums">{kindCounts[kind] ?? 0}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Relationship groups */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Relationship groups</span>
          <span className="font-mono text-[9px] text-text-muted tabular-nums">{activeEdgeTypes.size}/{ALL_EDGE_TYPES.length} active</span>
        </div>
        <div className="flex flex-col gap-1">
          {EDGE_GROUP_ORDER.map((group) => {
            const groupTypes = getGroupEdgeTypes(group);
            const sel = getGroupSelection(group, activeEdgeTypes);
            const checked = sel === 'all';
            const mixed = sel === 'partial';
            const groupCount = groupTypes.filter((t) => activeEdgeTypes.has(t)).length;
            const totalCount = groupTypes.length;
            const expanded = expandedGroups.has(group);

            return (
              <div key={group} className="rounded-sm border border-border-subtle overflow-hidden">
                <div className="flex items-center gap-2 px-2 py-1.5 min-h-8">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input type="checkbox" checked={checked}
                      ref={(el) => { if (el) el.indeterminate = mixed; }}
                      onChange={() => onToggleGroup(group)} className="size-3.5 accent-brand rounded-sm" />
                    <span className="font-mono text-[12px] text-text">{EDGE_GROUPS[group].label}</span>
                  </label>
                  <span className="font-mono text-[9px] text-text-muted tabular-nums">{groupCount}/{totalCount}</span>
                  <button type="button" onClick={() => toggleExpandGroup(group)}
                    className="flex size-6 items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
                    aria-label={expanded ? `Collapse ${EDGE_GROUPS[group].label}` : `Expand ${EDGE_GROUPS[group].label}`}
                    aria-expanded={expanded}>
                    <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
                  </button>
                </div>
                {expanded && (
                  <div className="border-t border-border-subtle bg-surface-2/50 px-3 py-1.5">
                    <div className="flex flex-col gap-1">
                      {groupTypes.map((type) => {
                        const typeChecked = activeEdgeTypes.has(type);
                        return (
                          <label key={type} className="flex items-center gap-2 cursor-pointer min-h-7 rounded-sm px-2 hover:bg-surface-2 transition-colors">
                            <input type="checkbox" checked={typeChecked} onChange={() => onToggleEdgeType(type)} className="size-3 accent-brand rounded-sm" />
                            <span className="font-mono text-[11px] text-text-secondary">{type}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

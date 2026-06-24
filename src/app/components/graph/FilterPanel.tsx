import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { EdgeType, NodeKind } from '../../data';
import { EDGE_GROUPS, EDGE_GROUP_ORDER, getGroupEdgeTypes, getGroupSelection, type EdgeGroup } from './edgeGroups';
import { KIND_COLOR } from './graphConstants';
import { cn } from '../ui/utils';

interface FilterPanelProps {
  activeKinds: Set<NodeKind>;
  activeEdgeTypes: Set<EdgeType>;
  kindCounts: Record<string, number>;
  onToggleKind: (kind: NodeKind) => void;
  onToggleEdgeType: (type: EdgeType) => void;
  onToggleGroup: (group: EdgeGroup) => void;
  onSelectAllKinds: () => void;
  onClearAllKinds: () => void;
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
      {/* Node types */}
      <div className="px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Node types</span>
          <div className="flex gap-2">
            <button type="button" onClick={onSelectAllKinds} className="font-mono text-[10px] text-text-muted hover:text-text transition-colors">Select all</button>
            <button type="button" onClick={onClearAllKinds} className="font-mono text-[10px] text-text-muted hover:text-text transition-colors">Clear all</button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          {nodeKinds.map((kind) => {
            const checked = activeKinds.has(kind);
            return (
              <label key={kind} className="flex items-center gap-2 cursor-pointer min-h-9 rounded-sm px-2 hover:bg-surface-2 transition-colors">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleKind(kind)}
                  className="size-3.5 accent-brand rounded-sm"
                />
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
          <span className="font-mono text-[10px] text-text-muted tabular-nums">{activeEdgeTypes.size}/{EDGE_GROUP_ORDER.reduce((s, g) => s + getGroupEdgeTypes(g).length, 0)} active</span>
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
                {/* Group header */}
                <div className="flex items-center gap-2 px-2 py-1.5 min-h-9 transition-colors">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      ref={(el) => { if (el) el.indeterminate = mixed; }}
                      onChange={() => onToggleGroup(group)}
                      className="size-3.5 accent-brand rounded-sm"
                    />
                    <span className="font-mono text-[12px] text-text">{EDGE_GROUPS[group].label}</span>
                  </label>
                  <span className="font-mono text-[10px] text-text-muted tabular-nums">{groupCount}/{totalCount}</span>
                  <button
                    type="button"
                    onClick={() => toggleExpandGroup(group)}
                    className="flex size-6 items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
                    aria-label={expanded ? `Collapse ${EDGE_GROUPS[group].label}` : `Expand ${EDGE_GROUPS[group].label}`}
                    aria-expanded={expanded}
                  >
                    <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
                  </button>
                </div>
                {/* Individual edge types (expandable) */}
                {expanded && (
                  <div className="border-t border-border-subtle bg-surface-2/50 px-3 py-1.5">
                    <div className="flex flex-col gap-1">
                      {groupTypes.map((type) => {
                        const typeChecked = activeEdgeTypes.has(type);
                        return (
                          <label key={type} className="flex items-center gap-2 cursor-pointer min-h-7 rounded-sm px-2 hover:bg-surface-2 transition-colors">
                            <input
                              type="checkbox"
                              checked={typeChecked}
                              onChange={() => onToggleEdgeType(type)}
                              className="size-3 accent-brand rounded-sm"
                            />
                            <span className="font-mono text-[11px] text-text-secondary capitalize">{type}</span>
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

      {/* Footer */}
      <div className="border-t border-border-subtle px-4 py-2 flex items-center justify-between">
        <span className="font-mono text-[10px] text-text-muted">
          {activeKinds.size}/{nodeKinds.length} node · {EDGE_GROUP_ORDER.filter((g) => {
            const types = getGroupEdgeTypes(g);
            return types.some((t) => activeEdgeTypes.has(t));
          }).length}/{EDGE_GROUP_ORDER.length} groups active
        </span>
        <button type="button" onClick={onClose} className="flex items-center gap-1 font-mono text-[11px] text-text-muted hover:text-text transition-colors">
          <X className="size-3" /> Close
        </button>
      </div>
    </div>
  );
}

import { X, Crosshair, List, GitBranch } from 'lucide-react';
import { IconButton } from '../common/IconButton';
import { NavActionButton } from '../common/AskClaudeActions';
import { MonoId } from '../common/primitives';
import { KIND_COLOR } from './graphConstants';
import { cn } from '../ui/utils';

export interface GraphCluster {
  id: string;
  label: string;
  kind: 'hop-cluster' | 'global-cluster';
  nodeIds: string[];
  nodeCount: number;
  nodeTypeCounts: {
    finding: number;
    question: number;
    experiment: number;
  };
  internalEdgeCount: number;
  externalEdgeCount: number;
  relationshipGroupCounts: Record<string, number>;
  sourceFocusNodeId?: string;
  hopLevel?: number;
  children?: { id: string; kind: string; label: string; edgeCount: number }[];
}

export function ClusterInspector({
  cluster,
  onClose,
  onExplore,
  onViewAsList,
}: {
  cluster: GraphCluster;
  onClose: () => void;
  onExplore: () => void;
  onViewAsList: () => void;
}) {
  const Sec = ({ children }: { children: React.ReactNode }) => (
    <h4 className="mt-5 mb-2 font-mono text-[11px] uppercase tracking-wider text-text-muted first:mt-0">{children}</h4>
  );

  const typeColor = cluster.nodeTypeCounts.finding > cluster.nodeTypeCounts.question && cluster.nodeTypeCounts.finding > cluster.nodeTypeCounts.experiment
    ? KIND_COLOR.finding
    : cluster.nodeTypeCounts.question > cluster.nodeTypeCounts.experiment
    ? KIND_COLOR.question
    : KIND_COLOR.experiment;

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Cluster</span>
          <span className="font-mono text-[12px] text-text-secondary">{cluster.id}</span>
        </div>
        <IconButton icon={X} label="Close" onClick={onClose} />
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        {/* Identity */}
        <h3 className="text-[15px] leading-snug text-text">{cluster.label}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-text-secondary">
            {cluster.nodeCount} nodes
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-text-secondary">
            {cluster.internalEdgeCount} internal
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-text-secondary">
            {cluster.externalEdgeCount} external
          </span>
        </div>

        {/* Composition */}
        <Sec>Composition</Sec>
        <div className="rounded-sm border border-border-subtle bg-surface-2 px-3">
          {(['finding', 'question', 'experiment'] as const).map((kind) => {
            const count = cluster.nodeTypeCounts[kind];
            if (count === 0) return null;
            return (
              <div key={kind} className="flex items-center justify-between py-1.5 border-b border-border-subtle last:border-0">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: KIND_COLOR[kind] }} />
                  <span className="font-mono text-[12px] text-text capitalize">{kind}</span>
                </div>
                <span className="font-mono text-[12px] text-text-muted tabular-nums">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Relationships */}
        <Sec>Relationships</Sec>
        <div className="rounded-sm border border-border-subtle bg-surface-2 px-3">
          {Object.entries(cluster.relationshipGroupCounts).map(([group, count]) => (
            <div key={group} className="flex items-center justify-between py-1.5 border-b border-border-subtle last:border-0">
              <span className="font-mono text-[12px] text-text capitalize">{group}</span>
              <span className="font-mono text-[12px] text-text-muted tabular-nums">{count}</span>
            </div>
          ))}
        </div>

        {/* Preview */}
        {cluster.children && cluster.children.length > 0 && (
          <>
            <Sec>Preview ({cluster.children.length} nodes)</Sec>
            <div className="space-y-1.5">
              {cluster.children.slice(0, 8).map((child) => (
                <div key={child.id} className="flex items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2.5 py-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: KIND_COLOR[child.kind as keyof typeof KIND_COLOR] || 'var(--text-muted)' }} />
                  <MonoId className="text-[11px]">{child.id.replace('experiments/', '')}</MonoId>
                  <span className="truncate text-[11px] text-text-secondary flex-1">{child.label}</span>
                  <span className="font-mono text-[9px] text-text-muted tabular-nums">{child.edgeCount} edges</span>
                </div>
              ))}
              {cluster.children.length > 8 && (
                <p className="text-[11px] text-text-muted">+{cluster.children.length - 8} more nodes</p>
              )}
            </div>
          </>
        )}

        {/* Actions */}
        <Sec>Actions</Sec>
        <div className="flex flex-col gap-2">
          <NavActionButton onClick={onExplore}>
            <Crosshair className="size-3.5" /> Explore cluster
          </NavActionButton>
          <NavActionButton onClick={onViewAsList}>
            <List className="size-3.5" /> View cluster as list
          </NavActionButton>
          {cluster.nodeCount <= 12 && (
            <p className="text-[11px] text-text-muted">Small cluster — nodes will render as readable cards.</p>
          )}
          {cluster.nodeCount > 12 && cluster.nodeCount <= 40 && (
            <p className="text-[11px] text-text-muted">Medium cluster — important nodes as cards, others compact.</p>
          )}
          {cluster.nodeCount > 40 && (
            <p className="text-[11px] text-text-muted">Large cluster — will default to List view for readability.</p>
          )}
        </div>
      </div>
    </aside>
  );
}

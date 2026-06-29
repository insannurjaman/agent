import type { EdgeType, NodeKind } from '../../data';

export const EDGE_COLOR: Record<EdgeType, string> = {
  origin: 'var(--brand-primary)',
  cite: 'var(--blue)',
  'report-use': 'var(--teal)',
  relates: 'var(--text-muted)',
  'resolve-partial': 'var(--amber)',
  'conflict-suspected': 'var(--error)',
  supersedes: 'var(--lineage)',
  'relates-finding': 'var(--text-muted)',
  addresses: 'var(--blue)',
  strengthens: 'var(--green)',
  resolves: 'var(--green)',
};

export const KIND_COLOR: Record<NodeKind, string> = {
  finding: 'var(--brand-primary)',
  question: 'var(--amber)',
  experiment: 'var(--teal)',
};

export const NODE_W = 158;
export const NODE_H = 48;

export const ZOOM = {
  min: { global: 0.12, neighborhood1: 0.4, neighborhood2: 0.2, neighborhood3: 0.15, cluster: 0.25 },
  max: { global: 0.8, neighborhood1: 1.4, neighborhood2: 1.2, neighborhood3: 1.0, cluster: 1.2 },
  minReadableNode: 0.4,
  maxSelectedEdgeWidth: 2.4,
  maxBoundaryEdgeWidth: 3.0,
  maxSelectedEdgeLabels: 5,
  maxBoundaryEdges: 8,
  /** Opacity applied to nodes that are not adjacent to the selected node. */
  dimOpacity: 0.22,
  /** Opacity applied to the neighborhood's non-focused nodes. */
  mutedOpacity: 0.55,
};

export function getZoomBounds(scope: string, depth?: number) {
  if (scope === 'global') return { min: ZOOM.min.global, max: ZOOM.max.global };
  if (scope === 'cluster') return { min: ZOOM.min.cluster, max: ZOOM.max.cluster };
  if (depth === 1) return { min: ZOOM.min.neighborhood1, max: ZOOM.max.neighborhood1 };
  if (depth === 2) return { min: ZOOM.min.neighborhood2, max: ZOOM.max.neighborhood2 };
  return { min: ZOOM.min.neighborhood3, max: ZOOM.max.neighborhood3 };
}

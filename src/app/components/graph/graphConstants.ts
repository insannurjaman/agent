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

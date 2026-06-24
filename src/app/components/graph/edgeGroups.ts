import type { EdgeType } from '../../data';

export type EdgeGroup = 'evidence' | 'resolution' | 'knowledge' | 'conflict';

export const EDGE_GROUPS: Record<EdgeGroup, { label: string; types: EdgeType[] }> = {
  evidence: {
    label: 'Evidence',
    types: ['origin', 'cite', 'report-use'],
  },
  resolution: {
    label: 'Resolution',
    types: ['resolves', 'resolve-partial', 'addresses'],
  },
  knowledge: {
    label: 'Knowledge',
    types: ['relates', 'relates-finding', 'strengthens'],
  },
  conflict: {
    label: 'Conflict & Versioning',
    types: ['conflict-suspected', 'supersedes'],
  },
};

export const EDGE_GROUP_ORDER: EdgeGroup[] = ['evidence', 'resolution', 'knowledge', 'conflict'];

export function getEdgeGroup(type: EdgeType): EdgeGroup {
  for (const [group, config] of Object.entries(EDGE_GROUPS)) {
    if (config.types.includes(type)) return group as EdgeGroup;
  }
  return 'knowledge';
}

export function getGroupEdgeTypes(group: EdgeGroup): EdgeType[] {
  return EDGE_GROUPS[group].types;
}

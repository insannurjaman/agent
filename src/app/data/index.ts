import { findings } from './findings';
import { openQuestions } from './openQuestions';
import { experiments } from './experiments';
import { edges } from './edges';

import { buildInOutViewModel } from './inOut';
import type { InOutInput, InOutExperiment, InOutOutput, InOutRelationship, InOutViewModel } from './inOut';

export * from './types';
export { findings } from './findings';
export { openQuestions } from './openQuestions';
export { experiments } from './experiments';
export { facetDimensions } from './tagTaxonomy';
export { repoStatus } from './repoStatus';
export { edges, graphNodes, edgeTypes, neighborhood } from './edges';
export type { Edge, EdgeType, GraphNode, NodeKind } from './edges';
export { buildInOutViewModel };
export type { InOutInput, InOutExperiment, InOutOutput, InOutRelationship, InOutViewModel };

export function getFindingById(id: string) {
  return findings.find((f) => f.id === id);
}

export function getQuestionById(id: string) {
  return openQuestions.find((q) => q.id === id);
}

export function getExperimentBySlug(slug: string) {
  // Accept both full path and bare slug.
  return experiments.find((e) => e.slug === slug || e.slug.endsWith(slug));
}

// Follow supersededBy links to the latest valid finding in a chain.
export function getLatestVersion(id: string): string {
  let current = getFindingById(id);
  const seen = new Set<string>();
  while (current?.supersededBy && !seen.has(current.id)) {
    seen.add(current.id);
    const next = getFindingById(current.supersededBy);
    if (!next) break;
    current = next;
  }
  return current?.id ?? id;
}

export function findById(id: string) {
  return getFindingById(id) ?? getQuestionById(id) ?? getExperimentBySlug(id);
}

// Ordered supersedes chain (oldest → newest) containing the given finding.
export function getSupersedesChain(id: string): string[] {
  const start = getFindingById(id);
  if (!start) return [id];
  // Walk back to the oldest ancestor.
  let oldest = start;
  const seenBack = new Set<string>();
  while (oldest.supersedes && !seenBack.has(oldest.id)) {
    seenBack.add(oldest.id);
    const prev = getFindingById(oldest.supersedes);
    if (!prev) break;
    oldest = prev;
  }
  // Walk forward collecting the chain.
  const chain: string[] = [oldest.id];
  let cur = oldest;
  const seenFwd = new Set<string>();
  while (cur.supersededBy && !seenFwd.has(cur.id)) {
    seenFwd.add(cur.id);
    const next = getFindingById(cur.supersededBy);
    if (!next) break;
    chain.push(next.id);
    cur = next;
  }
  return chain;
}

// All findings that participate in a supersedes relationship (chain entry points).
export function getLineageRoots(): string[] {
  return findings.filter((f) => f.supersededBy).map((f) => f.id);
}

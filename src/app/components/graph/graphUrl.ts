import type { EdgeType, NodeKind } from '../../data';
import { edgeTypes } from '../../data';

export interface GraphURLState {
  view: 'graph' | 'list';
  scope: 'global' | 'neighborhood' | 'cluster';
  depth: number;
  focus?: string;
  cluster?: string;
  selected?: string;
  nodeKinds: NodeKind[];
  edgeTypeGroups: string[];
  individualEdgeTypes: EdgeType[];
}

const DEFAULT_NODE_KINDS: NodeKind[] = ['finding', 'question', 'experiment'];
const ALL_EDGE_GROUPS = ['evidence', 'resolution', 'knowledge', 'conflict'];

export function parseGraphQuery(searchParams: URLSearchParams): Partial<GraphURLState> {
  const state: Partial<GraphURLState> = {};

  const view = searchParams.get('view');
  if (view === 'graph' || view === 'list') state.view = view;

  const scope = searchParams.get('scope');
  if (scope === 'global' || scope === 'neighborhood' || scope === 'cluster') state.scope = scope;

  const depth = searchParams.get('depth');
  if (depth === '1' || depth === '2' || depth === '3') state.depth = Number(depth);

  const focus = searchParams.get('focus');
  if (focus) state.focus = focus;

  const cluster = searchParams.get('cluster');
  if (cluster) state.cluster = cluster;

  const selected = searchParams.get('selected');
  if (selected) state.selected = selected;

  const nodes = searchParams.get('nodes');
  if (nodes) {
    const kinds = nodes.split(',').filter((k): k is NodeKind => k === 'finding' || k === 'question' || k === 'experiment');
    if (kinds.length > 0) state.nodeKinds = kinds;
  }

  const edges = searchParams.get('edges');
  if (edges) {
    const groups = edges.split(',').filter((g) => ALL_EDGE_GROUPS.includes(g));
    if (groups.length > 0) state.edgeTypeGroups = groups;
  }

  const edgeTypesParam = searchParams.get('edgeTypes');
  if (edgeTypesParam) {
    const et = edgeTypesParam.split(',').filter((t): t is EdgeType => (edgeTypes as readonly string[]).includes(t));
    if (et.length > 0) state.individualEdgeTypes = et;
  }

  return state;
}

export function serializeGraphQuery(state: GraphURLState): string {
  const params = new URLSearchParams();

  if (state.view !== 'graph') params.set('view', state.view);
  if (state.scope !== 'neighborhood') params.set('scope', state.scope);
  if (state.depth !== 2) params.set('depth', String(state.depth));
  if (state.focus) params.set('focus', state.focus);
  if (state.cluster) params.set('cluster', state.cluster);
  if (state.selected) params.set('selected', state.selected);

  const nodeKinds = state.nodeKinds.filter((k) => k !== undefined);
  if (nodeKinds.length < 3 || !DEFAULT_NODE_KINDS.every((d) => nodeKinds.includes(d))) {
    params.set('nodes', nodeKinds.join(','));
  }

  const edgeGroups = state.edgeTypeGroups;
  if (edgeGroups.length < 4 || !ALL_EDGE_GROUPS.every((g) => edgeGroups.includes(g))) {
    if (edgeGroups.length > 0) params.set('edges', edgeGroups.join(','));
  }

  if (state.individualEdgeTypes.length > 0 && state.individualEdgeTypes.length < (edgeTypes as readonly string[]).length) {
    params.set('edgeTypes', state.individualEdgeTypes.join(','));
  }

  return params.toString();
}

export function isDefaultNodeKinds(kinds: NodeKind[]): boolean {
  return kinds.length === 3 && DEFAULT_NODE_KINDS.every((d) => kinds.includes(d));
}

export function isDefaultEdgeGroups(groups: string[]): boolean {
  return groups.length === 4 && ALL_EDGE_GROUPS.every((g) => groups.includes(g));
}

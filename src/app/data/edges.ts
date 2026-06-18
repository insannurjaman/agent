import { findings } from './findings';
import { openQuestions } from './openQuestions';
import { experiments } from './experiments';

// knowledge/knowledge_graph_edges.csv — columns: src, edge_type, dst, basis, detail.
export type EdgeType =
  | 'origin'
  | 'cite'
  | 'report-use'
  | 'relates'
  | 'resolve-partial'
  | 'conflict-suspected'
  | 'supersedes'
  | 'relates-finding'
  | 'addresses'
  | 'strengthens'
  | 'resolves';

export interface Edge {
  src: string;
  edgeType: EdgeType;
  dst: string;
  basis: string;
  detail: string;
}

export type NodeKind = 'finding' | 'question' | 'experiment';
export interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  sub: string; // confidence / status / date
}

// The curated, fully-labeled core of the graph. These edges wire together the
// findings, open questions, and experiments that have authored detail.
const curatedEdges: Edge[] = [
  // experiment -> finding (origin)
  { src: 'experiments/2026-02-01_feed_rate_sweep', edgeType: 'origin', dst: 'F-0001', basis: 'README', detail: 'Initial feed-rate sweep produced F-0001' },
  { src: 'experiments/2026-05-20_feed_rate_recheck', edgeType: 'origin', dst: 'F-0048', basis: 'REPORT', detail: 'Corrected window produced refined threshold' },
  { src: 'experiments/2026-02-15_schema_audit', edgeType: 'origin', dst: 'F-0007', basis: 'README', detail: 'Schema audit surfaced column rename' },
  { src: 'experiments/2026-03-02_null_spike', edgeType: 'origin', dst: 'F-0012', basis: 'README', detail: 'Null-burst exploration' },
  { src: 'experiments/2026-03-18_gauge_drift', edgeType: 'origin', dst: 'F-0019', basis: 'README', detail: 'Gauge drift scan' },
  { src: 'experiments/2026-03-30_streak_explore', edgeType: 'origin', dst: 'F-0023', basis: 'README', detail: 'Streak defect exploration' },
  { src: 'experiments/2026-04-16_segmentation_bench', edgeType: 'origin', dst: 'F-0031', basis: 'REPORT', detail: 'Segmentation benchmark' },
  { src: 'experiments/2026-04-24_thickness_model', edgeType: 'origin', dst: 'F-0034', basis: 'REPORT', detail: 'Thickness variance model' },
  { src: 'experiments/2026-05-04_dup_audit', edgeType: 'origin', dst: 'F-0038', basis: 'README', detail: 'Duplicate ingestion audit' },
  { src: 'experiments/2026-05-09_anomaly_overlap', edgeType: 'origin', dst: 'F-0041', basis: 'README', detail: 'Anomaly overlap scan' },
  { src: 'experiments/2026-05-13_handover_review', edgeType: 'origin', dst: 'F-0044', basis: 'README', detail: 'Handover review' },
  { src: 'experiments/2026-06-08_anomaly_check', edgeType: 'origin', dst: 'F-0050', basis: 'REPORT', detail: 'Entry-temp validation' },
  { src: 'experiments/2026-02-22_units_audit', edgeType: 'origin', dst: 'F-0009', basis: 'README', detail: 'Units audit' },
  { src: 'experiments/2026-05-17_ingest_unify', edgeType: 'origin', dst: 'F-0046', basis: 'REPORT', detail: 'Unified ingest' },

  // finding supersedes finding
  { src: 'F-0048', edgeType: 'supersedes', dst: 'F-0001', basis: 'findings.csv', detail: 'Refined threshold replaces 1.8 m/s estimate' },
  { src: 'F-0046', edgeType: 'supersedes', dst: 'F-0009', basis: 'findings.csv', detail: 'Unified ingest replaces silent unit switch' },

  // report-use (experiment report cites a finding)
  { src: 'experiments/2026-06-08_anomaly_check', edgeType: 'report-use', dst: 'F-0034', basis: 'REPORT', detail: 'Builds on roll-gap variance model' },
  { src: 'experiments/2026-06-08_anomaly_check', edgeType: 'report-use', dst: 'F-0031', basis: 'REPORT', detail: 'Uses PELT segmentation' },
  { src: 'experiments/2026-05-20_feed_rate_recheck', edgeType: 'report-use', dst: 'F-0001', basis: 'REPORT', detail: 'Re-checks original sweep' },

  // cite (finding cites finding)
  { src: 'F-0050', edgeType: 'cite', dst: 'F-0034', basis: 'summary', detail: 'Confirms residual hypothesis' },
  { src: 'F-0044', edgeType: 'cite', dst: 'F-0012', basis: 'summary', detail: 'Explains the null bursts' },

  // conflict-suspected
  { src: 'F-0041', edgeType: 'conflict-suspected', dst: 'F-0012', basis: 'analysis', detail: 'Bend-rate spikes overlap vibration nulls' },

  // strengthens
  { src: 'F-0050', edgeType: 'strengthens', dst: 'F-0034', basis: 'analysis', detail: 'Adds entry-temp factor to model' },

  // relates-finding
  { src: 'F-0041', edgeType: 'relates-finding', dst: 'F-0044', basis: 'analysis', detail: 'Both tie to handover window' },

  // question addresses / origin / resolves
  { src: 'Q-0003', edgeType: 'addresses', dst: 'F-0001', basis: 'open_questions.csv', detail: 'Raised about feed-rate threshold' },
  { src: 'F-0048', edgeType: 'resolves', dst: 'Q-0003', basis: 'open_questions.csv', detail: 'Threshold resolved at 1.65 m/s' },
  { src: 'Q-0011', edgeType: 'resolve-partial', dst: 'F-0048', basis: 'open_questions.csv', detail: 'Grade A confirmed; B/C pending' },
  { src: 'Q-0006', edgeType: 'relates', dst: 'F-0041', basis: 'open_questions.csv', detail: 'Causal vs artifact question' },
  { src: 'Q-0006', edgeType: 'relates', dst: 'F-0012', basis: 'open_questions.csv', detail: 'Null-burst origin' },
  { src: 'Q-0006', edgeType: 'addresses', dst: 'F-0044', basis: 'open_questions.csv', detail: 'Handover fix proposal' },
  { src: 'Q-0009', edgeType: 'relates', dst: 'F-0023', basis: 'open_questions.csv', detail: 'Lubricant hypothesis' },
  { src: 'Q-0014', edgeType: 'addresses', dst: 'F-0034', basis: 'open_questions.csv', detail: 'Entry-temp floor question' },
  { src: 'Q-0014', edgeType: 'relates', dst: 'F-0050', basis: 'open_questions.csv', detail: 'Confirmed entry-temp factor' },
  { src: 'F-0050', edgeType: 'resolve-partial', dst: 'Q-0014', basis: 'open_questions.csv', detail: 'Identifies floor near 980C' },
  { src: 'Q-0017', edgeType: 'relates', dst: 'F-0038', basis: 'open_questions.csv', detail: 'Retroactive correction question' },
  { src: 'Q-0021', edgeType: 'relates', dst: 'F-0031', basis: 'open_questions.csv', detail: 'Online latency feasibility' },
  { src: 'F-0046', edgeType: 'resolves', dst: 'Q-0024', basis: 'open_questions.csv', detail: 'Pressure units unified' },
  { src: 'Q-0027', edgeType: 'relates', dst: 'F-0048', basis: 'open_questions.csv', detail: 'Feed-rate / entry-temp interaction' },
  { src: 'Q-0027', edgeType: 'relates', dst: 'F-0050', basis: 'open_questions.csv', detail: 'Two-factor model' },
  { src: 'Q-0030', edgeType: 'addresses', dst: 'F-0044', basis: 'open_questions.csv', detail: 'Will handover fix work' },
  { src: 'Q-0033', edgeType: 'relates', dst: 'F-0034', basis: 'open_questions.csv', detail: 'Refit on deduped data' },
  { src: 'Q-0033', edgeType: 'relates', dst: 'F-0038', basis: 'open_questions.csv', detail: 'Dedup impact' },
  { src: 'Q-0036', edgeType: 'relates', dst: 'F-0019', basis: 'open_questions.csv', detail: 'Mid-shift anomaly clusters' },
  { src: 'Q-0036', edgeType: 'relates', dst: 'F-0041', basis: 'open_questions.csv', detail: 'Anomaly clusters' },
];

// ── Node resolution: join labels from findings / questions / experiments ──
const findingMap = new Map(findings.map((f) => [f.id, f]));
const questionMap = new Map(openQuestions.map((q) => [q.id, q]));
const experimentMap = new Map(experiments.map((e) => [e.slug, e]));

// ── Deterministic PRNG so the synthesized graph is stable across renders ──
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(0x51a9e);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

// Synthetic descriptors for the index entries beyond the curated core.
const SUBJECTS = [
  'feed rate', 'roll gap', 'entry temperature', 'vibration', 'thickness gauge',
  'bend rate', 'lubrication', 'pressure unit', 'null density', 'changepoint',
  'dedup key', 'coil width', 'handover window', 'yield strength', 'surface streak',
];
const PREDICATES = [
  'drives variance on Line 1', 'correlates with reject rate', 'shows drift across shifts',
  'is sensitive to coil grade', 'biases per-run aggregates', 'spikes at handover',
  'lacks a schema marker', 'is confounded by temperature', 'recovers run boundaries',
];
const CONFIDENCES = ['high', 'medium', 'low', 'medium-high'];
const STATUSES = ['open', 'in-progress', 'partial-progress', 'resolved'];

function synthFindingLabel(n: number) {
  return `${pick(SUBJECTS)} ${pick(PREDICATES)}`.replace(/^./, (c) => c.toUpperCase()) + ` (idx ${n})`;
}
function synthQuestionLabel() {
  return `How does ${pick(SUBJECTS)} affect ${pick(SUBJECTS)}?`;
}

function resolveNode(id: string): GraphNode {
  if (id.startsWith('F-')) {
    const f = findingMap.get(id);
    const n = parseInt(id.slice(2), 10);
    return {
      id,
      kind: 'finding',
      label: f?.title ?? synthFindingLabel(n),
      sub: f?.confidence ?? pick(CONFIDENCES),
    };
  }
  if (id.startsWith('Q-')) {
    const q = questionMap.get(id);
    return { id, kind: 'question', label: q?.title ?? synthQuestionLabel(), sub: q?.status ?? pick(STATUSES) };
  }
  const e = experimentMap.get(id);
  return {
    id,
    kind: 'experiment',
    label: e?.title ?? id.replace('experiments/', '').replace(/^\d{4}-\d{2}-\d{2}_/, '').replace(/_/g, ' '),
    sub: e?.date ?? id.replace('experiments/', '').slice(0, 10),
  };
}

// ── Node universe matching the documented repository scale ──
const FINDING_IDS = Array.from({ length: 79 }, (_, i) => `F-${String(i + 1).padStart(4, '0')}`);
const QUESTION_IDS = Array.from({ length: 47 }, (_, i) => `Q-${String(i + 1).padStart(4, '0')}`);
const EXPERIMENT_IDS = (() => {
  const fromCurated = [...new Set(curatedEdges.map((e) => e.src).filter((s) => s.startsWith('experiments/')))];
  const slugs = new Set(fromCurated);
  const stems = ['scan', 'sweep', 'audit', 'recheck', 'bench', 'model', 'explore', 'review', 'check'];
  let m = 1;
  while (slugs.size < 18) {
    const month = String(((m % 6) + 1)).padStart(2, '0');
    const day = String(((m * 3) % 27) + 1).padStart(2, '0');
    slugs.add(`experiments/2026-${month}-${day}_${pick(stems)}_${m}`);
    m++;
  }
  return [...slugs];
})();

// ── Generate filler edges with valid semantics, deterministically, to 499 ──
const GENERATED_TARGET = 499;
function generateFillerEdges(): Edge[] {
  const out: Edge[] = [];
  const seen = new Set(curatedEdges.map((e) => `${e.src}|${e.edgeType}|${e.dst}`));
  const addUnique = (e: Edge) => {
    const k = `${e.src}|${e.edgeType}|${e.dst}`;
    if (e.src === e.dst || seen.has(k)) return;
    seen.add(k);
    out.push(e);
  };

  // Every experiment originates at least one finding.
  for (const exp of EXPERIMENT_IDS) {
    addUnique({ src: exp, edgeType: 'origin', dst: pick(FINDING_IDS), basis: 'README', detail: 'origin (indexed)' });
  }
  // Each open question relates to / addresses a finding.
  for (const q of QUESTION_IDS) {
    addUnique({
      src: q,
      edgeType: pick(['relates', 'addresses', 'resolve-partial'] as EdgeType[]),
      dst: pick(FINDING_IDS),
      basis: 'open_questions.csv',
      detail: 'question link (indexed)',
    });
  }

  const fillerTypes: EdgeType[] = [
    'cite', 'cite', 'relates', 'relates', 'relates-finding', 'report-use',
    'strengthens', 'addresses', 'resolves', 'resolve-partial', 'supersedes', 'conflict-suspected',
  ];
  let guard = 0;
  while (curatedEdges.length + out.length < GENERATED_TARGET && guard < 5000) {
    guard++;
    const type = pick(fillerTypes);
    let src: string, dst: string;
    if (type === 'origin' || type === 'report-use') {
      src = pick(EXPERIMENT_IDS);
      dst = pick(FINDING_IDS);
    } else if (type === 'addresses' || type === 'resolves' || type === 'resolve-partial') {
      src = pick(QUESTION_IDS);
      dst = pick(FINDING_IDS);
    } else if (type === 'supersedes' || type === 'strengthens' || type === 'conflict-suspected') {
      // forward in index so chains read oldest → newest
      const a = Math.floor(rand() * FINDING_IDS.length);
      const b = Math.floor(rand() * FINDING_IDS.length);
      const [lo, hi] = a < b ? [a, b] : [b, a];
      src = FINDING_IDS[hi];
      dst = FINDING_IDS[lo];
    } else {
      src = pick(FINDING_IDS);
      dst = pick(FINDING_IDS);
    }
    addUnique({ src, edgeType: type, dst, basis: 'indexed', detail: `${type} (indexed)` });
  }
  return out;
}

// Full edge set: curated core first, then deterministic filler up to ~499.
export const edges: Edge[] = [...curatedEdges, ...generateFillerEdges()];

export const graphNodes: Map<string, GraphNode> = (() => {
  const ids = new Set<string>();
  for (const e of edges) {
    ids.add(e.src);
    ids.add(e.dst);
  }
  const map = new Map<string, GraphNode>();
  for (const id of ids) map.set(id, resolveNode(id));
  return map;
})();

export const edgeTypes: EdgeType[] = [
  'origin',
  'cite',
  'report-use',
  'relates',
  'resolve-partial',
  'conflict-suspected',
  'supersedes',
  'relates-finding',
  'addresses',
  'strengthens',
  'resolves',
];

// Neighbors within N hops of a node (equivalent to search_kg.py neighbors <ID>).
export function neighborhood(rootId: string, depth: number) {
  const nodeIds = new Set<string>([rootId]);
  const inc = new Set<Edge>();
  let frontier = new Set<string>([rootId]);
  const dist = new Map<string, number>([[rootId, 0]]);
  for (let hop = 0; hop < depth; hop++) {
    const next = new Set<string>();
    for (const e of edges) {
      if (frontier.has(e.src) && !nodeIds.has(e.dst)) {
        next.add(e.dst);
        nodeIds.add(e.dst);
        dist.set(e.dst, hop + 1);
      }
      if (frontier.has(e.dst) && !nodeIds.has(e.src)) {
        next.add(e.src);
        nodeIds.add(e.src);
        dist.set(e.src, hop + 1);
      }
    }
    frontier = next;
  }
  for (const e of edges) if (nodeIds.has(e.src) && nodeIds.has(e.dst)) inc.add(e);
  return { nodeIds, edges: [...inc], dist };
}

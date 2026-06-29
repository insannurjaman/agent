// In/Out view model.
//
// Design rules:
// 1. The same finding / open-question ID MUST NOT appear as both an input
//    and an output without an explicit role. Either it predates the
//    experiment (input) or it was produced by it (output), not both.
// 2. Relationship endpoints resolve to the actual entity. There is no
//    silent fallback to the selected experiment title.
// 3. The view model is decoupled from the raw CSV shapes so the final
//    Imai-san specification can be wired in without rewriting the page.

import type { Edge, EdgeType, Experiment, Finding, OpenQuestion } from './types';

// ── Entity types ────────────────────────────────────────────────────────

export type InOutEntityKind = 'finding' | 'question' | 'experiment' | 'document' | 'dataset' | 'artifact' | 'unknown';

export interface InOutEntity {
  id: string;
  kind: InOutEntityKind;
  title: string;
  status?: string;
  confidence?: string;
  href?: string;
  unresolved?: boolean;
}

// ── Inputs ──────────────────────────────────────────────────────────────

export type InOutInputRole = 'previous-finding' | 'previous-question' | 'source-data' | 'source-document';

export interface InOutInput {
  id: string;
  role: InOutInputRole;
  entity: InOutEntity;
  note?: string;
  group: 'data' | 'documents' | 'previous-findings' | 'previous-questions';
}

// ── Outputs ─────────────────────────────────────────────────────────────

export type InOutOutputRole = 'produced-finding' | 'produced-question' | 'updated-finding' | 'carried-forward' | 'artifact';

export interface InOutOutput {
  id: string;
  role: InOutOutputRole;
  entity: InOutEntity;
  note?: string;
  group: 'findings' | 'open-questions' | 'artifacts';
}

// ── Experiment ──────────────────────────────────────────────────────────

export type InOutExperimentStatus = 'completed' | 'in-progress' | 'planned' | 'exploration' | 'blocked';

export interface InOutExperiment {
  id: string;
  slug: string;
  title: string;
  status: InOutExperimentStatus;
  date: string;
  lastModified: string;
  description?: string;
  stage: string;
  entity: InOutEntity;
  meta: {
    findingsCount: number;
    questionsCount: number;
    figuresCount: number;
  };
}

// ── Relationships ───────────────────────────────────────────────────────

export type InOutRelationshipKind = 'input-to-experiment' | 'experiment-to-output' | 'cross-link' | 'external';
export type InOutRelationshipScope = 'visible' | 'external' | 'unresolved';

export interface InOutRelationship {
  id: string;
  kind: InOutRelationshipKind;
  scope: InOutRelationshipScope;
  from: InOutEntity;
  to: InOutEntity;
  edgeType: EdgeType | 'produces' | 'updates' | 'reuses' | 'cites';
  label: string;
  basis?: string;
  detail?: string;
  /** Whether the relationship is already visible via a connector. */
  shownInMap: boolean;
}

export interface InOutViewModel {
  experiment: InOutExperiment | null;
  inputs: InOutInput[];
  outputs: InOutOutput[];
  relationships: InOutRelationship[];
  /** Subset of relationships already drawn as connectors in the map. */
  visibleRelationships: InOutRelationship[];
  /** Subset of relationships outside the map (external / unresolved). */
  additionalRelationships: InOutRelationship[];
}

// ── Helpers ─────────────────────────────────────────────────────────────

function formatRowCount(value: string | number | undefined): string {
  if (value == null) return '—';
  const str = String(value).trim();
  if (!str) return '—';
  // Avoid duplicated "rows rows" style artifacts.
  const m = str.match(/^([\d,.]+)\s*(.*)$/);
  if (!m) return str;
  const num = m[1];
  const tail = m[2] ? ` ${m[2].replace(/\brows rows\b/g, 'rows')}` : '';
  return `${num}${tail}`.replace(/\s{2,}/g, ' ').trim();
}

function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

function formatShortId(id: string): string {
  return id.replace('experiments/', '');
}

function experimentStatus(e: Experiment): InOutExperimentStatus {
  if (e.outdated) return 'blocked';
  switch (e.reportStatus) {
    case 'report':
      return 'completed';
    case 'exploration-only':
      return 'exploration';
    case 'missing':
      return 'planned';
  }
}

function experimentStageLabel(e: Experiment): string {
  if (e.outdated) return 'Superseded data';
  switch (e.reportStatus) {
    case 'report':
      return 'REPORT.md published';
    case 'exploration-only':
      return 'README only';
    case 'missing':
      return 'No report yet';
  }
}

function findingAsEntity(f: Finding): InOutEntity {
  return {
    id: f.id,
    kind: 'finding',
    title: f.title,
    confidence: f.confidence,
    status: f.confidence === 'superseded' ? 'superseded' : f.confidence,
    href: `/findings?focus=${f.id}`,
  };
}

function questionAsEntity(q: OpenQuestion): InOutEntity {
  return {
    id: q.id,
    kind: 'question',
    title: q.title,
    status: q.status,
    href: `/findings?tab=questions&focus=${q.id}`,
  };
}

function experimentAsEntity(e: Experiment): InOutEntity {
  return {
    id: e.slug,
    kind: 'experiment',
    title: e.title,
    status: e.outdated ? 'outdated' : e.reportStatus,
    href: `/experiments/${e.slug}`,
  };
}

function buildExperimentVm(e: Experiment): InOutExperiment {
  return {
    id: e.slug,
    slug: e.slug,
    title: e.title,
    status: experimentStatus(e),
    date: e.date,
    lastModified: e.lastModified,
    description: e.conclusions[0],
    stage: experimentStageLabel(e),
    entity: experimentAsEntity(e),
    meta: {
      findingsCount: e.relatedFindings.length,
      questionsCount: e.relatedQuestions?.length ?? 0,
      figuresCount: e.figures.length,
    },
  };
}

// Determine whether a finding existed before the experiment's date so we
// can place it in the right side (input vs output) without producing
// unexplained duplicates.
function findingIsPredecessor(findingDate: string | undefined, experimentDate: string): boolean {
  if (!findingDate) return false;
  return findingDate < experimentDate;
}

// ── Relationship label mapping ──────────────────────────────────────────

const EDGE_TYPE_LABEL: Record<EdgeType, string> = {
  origin: 'originates',
  cite: 'cites',
  'report-use': 'uses',
  relates: 'relates to',
  'resolve-partial': 'partially resolves',
  'conflict-suspected': 'conflicts with',
  supersedes: 'supersedes',
  'relates-finding': 'relates to',
  addresses: 'addresses',
  strengthens: 'strengthens',
  resolves: 'resolves',
};

const EDGE_TYPE_VERB: Record<EdgeType, string> = {
  origin: 'originated from',
  cite: 'cites',
  'report-use': 'used in report',
  relates: 'relates to',
  'resolve-partial': 'partially resolves',
  'conflict-suspected': 'conflicts with',
  supersedes: 'superseded by',
  'relates-finding': 'relates to',
  addresses: 'addresses',
  strengthens: 'strengthens',
  resolves: 'resolves',
};

function describeRelationshipSentence(
  fromEntity: InOutEntity,
  toEntity: InOutEntity,
  edgeType: EdgeType | 'produces' | 'updates' | 'reuses' | 'cites',
): string {
  if (edgeType === 'produces') return `${fromEntity.title} ${pluralize(1, 'produces', 'produces').replace('1 produces', 'produces')} ${toEntity.title}`;
  if (edgeType === 'updates') return `${fromEntity.title} updates ${toEntity.title}`;
  if (edgeType === 'reuses') return `${fromEntity.title} is reused by ${toEntity.title}`;
  if (edgeType === 'cites') return `${fromEntity.title} cites ${toEntity.title}`;
  const verb = EDGE_TYPE_VERB[edgeType as EdgeType] ?? 'relates to';
  return `${fromEntity.title} ${verb} ${toEntity.title}`;
}

// ── Adapter ─────────────────────────────────────────────────────────────

export interface BuildInOutOptions {
  experiments: Experiment[];
  findings: Finding[];
  openQuestions: OpenQuestion[];
  edges: Edge[];
  focusSlug?: string;
}

export function buildInOutViewModel(opts: BuildInOutOptions): InOutViewModel {
  const { experiments, findings, openQuestions, edges, focusSlug } = opts;

  const sorted = [...experiments].sort((a, b) => b.date.localeCompare(a.date));
  const experiment = focusSlug
    ? experiments.find((e) => e.slug === focusSlug || e.slug.endsWith(focusSlug))
    : sorted[0];

  if (!experiment) {
    return emptyViewModel();
  }

  const expEntity = experimentAsEntity(experiment);
  const findingMap = new Map(findings.map((f) => [f.id, f] as const));
  const questionMap = new Map(openQuestions.map((q) => [q.id, q] as const));

  // ── Inputs ────────────────────────────────────────────────────────────
  // Anything in `relatedFindings` / `relatedQuestions` that PREDATES the
  // experiment is treated as a previous-input. Same-id findings that date
  // on/after the experiment are intentionally NOT shown as inputs; they
  // belong on the output side.
  const inputs: InOutInput[] = [];
  const seenInput = new Set<string>();

  for (const fid of experiment.relatedFindings) {
    const f = findingMap.get(fid);
    if (!f) continue;
    if (!findingIsPredecessor(f.date, experiment.date)) continue;
    if (seenInput.has(fid)) continue;
    seenInput.add(fid);
    inputs.push({
      id: `input:finding:${fid}`,
      role: 'previous-finding',
      entity: findingAsEntity(f),
      group: 'previous-findings',
      note: f.confidence === 'superseded' ? 'Superseded claim' : undefined,
    });
  }
  for (const qid of experiment.relatedQuestions ?? []) {
    const q = questionMap.get(qid);
    if (!q) continue;
    // Open questions are by definition pre-existing inputs.
    if (seenInput.has(qid)) continue;
    seenInput.add(qid);
    inputs.push({
      id: `input:question:${qid}`,
      role: 'previous-question',
      entity: questionAsEntity(q),
      group: 'previous-questions',
      note: q.status === 'resolved' ? 'Resolved' : undefined,
    });
  }

  // Source data (parquet inputs) and source document (README/REPORT) come
  // from the experiment's own metadata — not invented.
  inputs.push({
    id: `input:dataset:${experiment.slug}`,
    role: 'source-data',
    entity: {
      id: `dataset:${experiment.slug}`,
      kind: 'dataset',
      title: 'Parquet inputs',
      status: `${formatRowCount(experiment.freshness.rowCounts)} · ${experiment.freshness.dateRange}`,
    },
    group: 'data',
    note: experiment.freshness.parquetMtime,
  });
  inputs.push({
    id: `input:document:${experiment.slug}`,
    role: 'source-document',
    entity: {
      id: `doc:${experiment.slug}`,
      kind: 'document',
      title: experiment.reportStatus === 'report' ? 'REPORT.md' : 'README.md',
      status: experiment.reportStatus === 'report' ? 'REPORT available' : experiment.reportStatus,
    },
    group: 'documents',
    note: experiment.slug,
  });

  // ── Outputs ───────────────────────────────────────────────────────────
  // Anything in `relatedFindings` / `relatedQuestions` that does NOT predate
  // the experiment is a produced output. Older findings that are still on
  // the experiment's relatedFindings list are carried-forward: keep them
  // in the output column but mark them with the `carried-forward` role.
  const outputs: InOutOutput[] = [];
  const seenOutput = new Set<string>();

  for (const fid of experiment.relatedFindings) {
    const f = findingMap.get(fid);
    if (!f) continue;
    if (seenOutput.has(fid)) continue;
    seenOutput.add(fid);

    const predates = findingIsPredecessor(f.date, experiment.date);
    if (predates) {
      outputs.push({
        id: `output:finding:${fid}`,
        role: 'carried-forward',
        entity: findingAsEntity(f),
        group: 'findings',
        note: 'Carried forward as a reference output',
      });
    } else if (f.supersededBy) {
      outputs.push({
        id: `output:finding:${fid}`,
        role: 'updated-finding',
        entity: findingAsEntity(f),
        group: 'findings',
        note: `Updated by ${f.supersededBy}`,
      });
    } else {
      outputs.push({
        id: `output:finding:${fid}`,
        role: 'produced-finding',
        entity: findingAsEntity(f),
        group: 'findings',
      });
    }
  }
  for (const qid of experiment.relatedQuestions ?? []) {
    const q = questionMap.get(qid);
    if (!q) continue;
    if (seenOutput.has(qid)) continue;
    seenOutput.add(qid);
    outputs.push({
      id: `output:question:${qid}`,
      role: 'produced-question',
      entity: questionAsEntity(q),
      group: 'open-questions',
    });
  }
  if (experiment.figures.length > 0) {
    outputs.push({
      id: `output:artifacts:${experiment.slug}`,
      role: 'artifact',
      entity: {
        id: `artifacts:${experiment.slug}`,
        kind: 'artifact',
        title: pluralize(experiment.figures.length, 'figure', 'figures'),
        status: experiment.figures[0]?.replace('outputs/figures/', ''),
        href: `/experiments/${experiment.slug}`,
      },
      group: 'artifacts',
    });
  }

  // ── Visible relationships (input→exp, exp→output) ─────────────────────
  const visibleRelationships: InOutRelationship[] = [];
  for (const input of inputs) {
    if (input.role === 'previous-finding' || input.role === 'previous-question') {
      visibleRelationships.push({
        id: `rel:visible:in:${input.id}:${experiment.slug}`,
        kind: 'input-to-experiment',
        scope: 'visible',
        from: input.entity,
        to: expEntity,
        edgeType: 'origin',
        label: 'informs',
        basis: 'relatedFindings / relatedQuestions',
        detail: `${input.entity.id} predates the experiment`,
        shownInMap: true,
      });
    }
  }
  for (const output of outputs) {
    if (
      output.role === 'produced-finding' ||
      output.role === 'produced-question' ||
      output.role === 'updated-finding' ||
      output.role === 'carried-forward'
    ) {
      visibleRelationships.push({
        id: `rel:visible:out:${experiment.slug}:${output.id}`,
        kind: 'experiment-to-output',
        scope: 'visible',
        from: expEntity,
        to: output.entity,
        edgeType: output.role === 'updated-finding' ? 'updates' : 'produces',
        label: output.role === 'updated-finding' ? 'updates' : 'produced',
        basis: 'relatedFindings / relatedQuestions',
        detail: `${output.entity.id} is registered against this experiment`,
        shownInMap: true,
      });
    }
  }

  // ── Additional relationships from the knowledge graph ─────────────────
  // We include only the relationships that touch entities visible in the
  // current view (inputs, outputs, the experiment itself). Endpoints that
  // are not part of the current view are still resolvable but tagged as
  // `external`.
  const additionalRelationships: InOutRelationship[] = [];
  const inputEntityIds = new Set(inputs.map((i) => i.entity.id));
  const outputEntityIds = new Set(outputs.map((o) => o.entity.id));

  for (const edge of edges) {
    const fromIn = inputEntityIds.has(edge.src) || outputEntityIds.has(edge.src) || edge.src === experiment.slug;
    const toIn = inputEntityIds.has(edge.dst) || outputEntityIds.has(edge.dst) || edge.dst === experiment.slug;
    if (!fromIn || !toIn) continue;

    // Already expressed as a visible-map connection? Skip.
    if (edge.src === experiment.slug || edge.dst === experiment.slug) {
      // Edges to/from the experiment are surfaced via the experiment's
      // own connections; if they're the same as the relatedFindings list
      // we already cover them.
      if (visibleRelationships.some((r) => r.from.id === edge.src && r.to.id === edge.dst)) continue;
      if (visibleRelationships.some((r) => r.from.id === edge.dst && r.to.id === edge.src)) continue;
    }

    const fromEntity = resolveEntityStrict(edge.src, findings, openQuestions, experiments);
    const toEntity = resolveEntityStrict(edge.dst, findings, openQuestions, experiments);

    const isVisible =
      fromEntity.kind !== 'unknown' &&
      toEntity.kind !== 'unknown' &&
      (inputEntityIds.has(fromEntity.id) || outputEntityIds.has(fromEntity.id) || fromEntity.id === experiment.slug) &&
      (inputEntityIds.has(toEntity.id) || outputEntityIds.has(toEntity.id) || toEntity.id === experiment.slug);

    const relationship: InOutRelationship = {
      id: `rel:extra:${edge.src}:${edge.edgeType}:${edge.dst}`,
      kind: isVisible ? 'cross-link' : 'external',
      scope: fromEntity.kind === 'unknown' || toEntity.kind === 'unknown' ? 'unresolved' : isVisible ? 'visible' : 'external',
      from: fromEntity,
      to: toEntity,
      edgeType: edge.edgeType,
      label: EDGE_TYPE_LABEL[edge.edgeType] ?? 'relates to',
      basis: edge.basis,
      detail: edge.detail,
      shownInMap: isVisible,
    };
    additionalRelationships.push(relationship);
  }

  const all = [...visibleRelationships, ...additionalRelationships];
  return {
    experiment: buildExperimentVm(experiment),
    inputs,
    outputs,
    relationships: all,
    visibleRelationships,
    additionalRelationships,
  };
}

function emptyViewModel(): InOutViewModel {
  return {
    experiment: null,
    inputs: [],
    outputs: [],
    relationships: [],
    visibleRelationships: [],
    additionalRelationships: [],
  };
}

// ── Entity resolver (strict — no experiment fallback) ──────────────────

export function resolveEntityStrict(
  id: string,
  findings: Finding[],
  openQuestions: OpenQuestion[],
  experiments: Experiment[],
): InOutEntity {
  if (id.startsWith('F-')) {
    const f = findings.find((x) => x.id === id);
    return f ? findingAsEntity(f) : { id, kind: 'unknown', title: id, unresolved: true };
  }
  if (id.startsWith('Q-')) {
    const q = openQuestions.find((x) => x.id === id);
    return q ? questionAsEntity(q) : { id, kind: 'unknown', title: id, unresolved: true };
  }
  if (id.startsWith('experiments/')) {
    const e = experiments.find((x) => x.slug === id);
    return e ? experimentAsEntity(e) : { id, kind: 'unknown', title: id, unresolved: true };
  }
  // Could be a synthetic id like "input:finding:F-0050" or "output:question:Q-0014".
  if (id.startsWith('input:finding:')) {
    const fid = id.replace('input:finding:', '');
    const f = findings.find((x) => x.id === fid);
    return f ? findingAsEntity(f) : { id: fid, kind: 'unknown', title: fid, unresolved: true };
  }
  if (id.startsWith('input:question:')) {
    const qid = id.replace('input:question:', '');
    const q = openQuestions.find((x) => x.id === qid);
    return q ? questionAsEntity(q) : { id: qid, kind: 'unknown', title: qid, unresolved: true };
  }
  if (id.startsWith('output:finding:')) {
    const fid = id.replace('output:finding:', '');
    const f = findings.find((x) => x.id === fid);
    return f ? findingAsEntity(f) : { id: fid, kind: 'unknown', title: fid, unresolved: true };
  }
  if (id.startsWith('output:question:')) {
    const qid = id.replace('output:question:', '');
    const q = openQuestions.find((x) => x.id === qid);
    return q ? questionAsEntity(q) : { id: qid, kind: 'unknown', title: qid, unresolved: true };
  }
  return { id, kind: 'unknown', title: id, unresolved: true };
}

// Re-export for convenience.
export { describeRelationshipSentence, formatRowCount, pluralize, formatShortId };

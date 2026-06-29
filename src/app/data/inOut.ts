// In/Out view model — the data-driven presentation contract used by the
// In/Out page. The page is intentionally decoupled from the raw CSV shapes
// so the final Imai-san specification can be wired in without rewriting
// the layout. Keep this file free of UI concerns.

import type { Edge, EdgeType, Experiment, Finding, OpenQuestion } from './types';

export type InOutInputKind =
  | 'dataset'
  | 'document'
  | 'search-condition'
  | 'instruction'
  | 'previous-finding'
  | 'previous-question'
  | 'other';

export interface InOutInput {
  id: string;
  kind: InOutInputKind;
  label: string;
  detail?: string;
  source?: string;
  meta?: { tone?: 'green' | 'teal' | 'amber' | 'blue' | 'purple' | 'muted' };
  href?: string;
}

export type InOutExperimentStatus = 'planned' | 'running' | 'completed' | 'blocked' | 'exploration';

export interface InOutExperiment {
  id: string;
  slug: string;
  title: string;
  status: InOutExperimentStatus;
  date: string;
  lastModified: string;
  description?: string;
  stage?: string;
  meta: {
    findingsCount: number;
    questionsCount: number;
    figuresCount: number;
  };
}

export type InOutOutputKind =
  | 'finding'
  | 'open-question'
  | 'artifact'
  | 'result-data'
  | 'other';

export interface InOutOutput {
  id: string;
  kind: InOutOutputKind;
  label: string;
  detail?: string;
  source?: string;
  meta?: { tone?: 'green' | 'teal' | 'amber' | 'blue' | 'purple' | 'muted' };
  href?: string;
}

export type InOutRelationshipKind = 'input-to-experiment' | 'experiment-to-output' | 'cross-link';

export interface InOutRelationship {
  id: string;
  kind: InOutRelationshipKind;
  from: string;
  to: string;
  label?: string;
  basis?: string;
  detail?: string;
  edgeType?: EdgeType;
}

export interface InOutViewModel {
  experiment: InOutExperiment | null;
  inputs: InOutInput[];
  outputs: InOutOutput[];
  relationships: InOutRelationship[];
}

// ── Helpers used by the adapter. Keep CSV specifics here, not in the UI. ──

function findingTone(): 'green' {
  return 'green';
}
function questionTone(): 'amber' {
  return 'amber';
}

function findingAsInput(f: Finding): InOutInput {
  return {
    id: `input:finding:${f.id}`,
    kind: 'previous-finding',
    label: f.title,
    detail: `${f.id} · ${f.confidence}`,
    source: f.evidence,
    meta: { tone: findingTone() },
    href: `/findings?focus=${f.id}`,
  };
}

function questionAsInput(q: OpenQuestion): InOutInput {
  return {
    id: `input:question:${q.id}`,
    kind: 'previous-question',
    label: q.title,
    detail: `${q.id} · ${q.status}`,
    meta: { tone: questionTone() },
    href: `/findings?tab=questions&focus=${q.id}`,
  };
}

function findingAsOutput(f: Finding): InOutOutput {
  return {
    id: `output:finding:${f.id}`,
    kind: 'finding',
    label: f.title,
    detail: `${f.id} · ${f.confidence}`,
    source: f.evidence,
    meta: { tone: findingTone() },
    href: `/findings?focus=${f.id}`,
  };
}

function questionAsOutput(q: OpenQuestion): InOutOutput {
  return {
    id: `output:question:${q.id}`,
    kind: 'open-question',
    label: q.title,
    detail: `${q.id} · ${q.status}`,
    meta: { tone: questionTone() },
    href: `/findings?tab=questions&focus=${q.id}`,
  };
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

function buildExperimentVm(e: Experiment): InOutExperiment {
  return {
    id: e.slug,
    slug: e.slug,
    title: e.title,
    status: experimentStatus(e),
    date: e.date,
    lastModified: e.lastModified,
    description: e.conclusions[0],
    stage: e.outdated ? 'Superseded data' : e.reportStatus === 'report' ? 'REPORT.md published' : 'Exploration',
    meta: {
      findingsCount: e.relatedFindings.length,
      questionsCount: e.relatedQuestions?.length ?? 0,
      figuresCount: e.figures.length,
    },
  };
}

function buildRelationships(
  experiment: Experiment,
  inputs: InOutInput[],
  outputs: InOutOutput[],
  edges: Edge[],
): InOutRelationship[] {
  const relationships: InOutRelationship[] = [];

  // Inputs that come from previous findings/questions are linked to the
  // experiment via `relatedFindings` and `relatedQuestions` on the model.
  for (const f of experiment.relatedFindings) {
    const inputId = `input:finding:${f}`;
    if (inputs.some((i) => i.id === inputId)) {
      relationships.push({
        id: `rel:in:${experiment.slug}:${f}`,
        kind: 'input-to-experiment',
        from: inputId,
        to: experiment.slug,
        label: 'informs',
        basis: 'relatedFindings',
        detail: `${f} contributed to this experiment`,
      });
    }
  }
  for (const q of experiment.relatedQuestions ?? []) {
    const inputId = `input:question:${q}`;
    if (inputs.some((i) => i.id === inputId)) {
      relationships.push({
        id: `rel:in:${experiment.slug}:${q}`,
        kind: 'input-to-experiment',
        from: inputId,
        to: experiment.slug,
        label: 'motivated by',
        basis: 'relatedQuestions',
        detail: `${q} motivated this experiment`,
      });
    }
  }

  // Outputs are wired the same way.
  for (const f of experiment.relatedFindings) {
    const outputId = `output:finding:${f}`;
    if (outputs.some((o) => o.id === outputId)) {
      relationships.push({
        id: `rel:out:${experiment.slug}:${f}`,
        kind: 'experiment-to-output',
        from: experiment.slug,
        to: outputId,
        label: 'produced',
        basis: 'relatedFindings',
        detail: `${f} was produced by this experiment`,
      });
    }
  }
  for (const q of experiment.relatedQuestions ?? []) {
    const outputId = `output:question:${q}`;
    if (outputs.some((o) => o.id === outputId)) {
      relationships.push({
        id: `rel:out:${experiment.slug}:${q}`,
        kind: 'experiment-to-output',
        from: experiment.slug,
        to: outputId,
        label: 'surfaced',
        basis: 'relatedQuestions',
        detail: `${q} was surfaced by this experiment`,
      });
    }
  }

  // Traceability edges from the knowledge graph are added as cross-links
  // when the data clearly supports them. This is a safe, narrow surface:
  // we only label an edge when both endpoints are present in the view.
  for (const e of edges) {
    const inputIds = new Set(inputs.map((i) => i.id));
    const outputIds = new Set(outputs.map((o) => o.id));

    const inInput = inputIds.has(`input:finding:${e.src}`) || inputIds.has(`input:question:${e.src}`);
    const inOutput = outputIds.has(`output:finding:${e.src}`) || outputIds.has(`output:question:${e.src}`);
    if (inInput && inOutput) {
      relationships.push({
        id: `rel:x:${e.src}:${e.edgeType}:${e.dst}`,
        kind: 'cross-link',
        from: e.src,
        to: e.dst,
        label: e.edgeType,
        basis: e.basis,
        detail: e.detail,
        edgeType: e.edgeType,
      });
    }
  }

  return relationships;
}

// ── Public adapter. The shape is what the UI consumes. ──

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
    return { experiment: null, inputs: [], outputs: [], relationships: [] };
  }

  // Build inputs from related findings + related questions
  const inputFindings = experiment.relatedFindings
    .map((id) => findings.find((f) => f.id === id))
    .filter((f): f is Finding => !!f);
  const inputQuestions = (experiment.relatedQuestions ?? [])
    .map((id) => openQuestions.find((q) => q.id === id))
    .filter((q): q is OpenQuestion => !!q);

  const inputs: InOutInput[] = [
    ...inputFindings.map(findingAsInput),
    ...inputQuestions.map(questionAsInput),
  ];

  // Add explicit input tokens so the column always has the conceptual
  // input categories represented — these come from the current
  // representation in the product and are not invented data.
  inputs.push(
    {
      id: `input:dataset:${experiment.slug}`,
      kind: 'dataset',
      label: 'Parquet inputs',
      detail: `${experiment.freshness.rowCounts} rows · ${experiment.freshness.dateRange}`,
      source: experiment.freshness.parquetMtime,
      meta: { tone: 'blue' },
    },
    {
      id: `input:document:${experiment.slug}`,
      kind: 'document',
      label: 'README.md',
      detail: experiment.slug,
      meta: { tone: 'muted' },
    },
  );

  // Outputs are the same findings/questions but framed as outputs.
  const outputFindings = inputFindings;
  const outputQuestions = inputQuestions;

  const outputs: InOutOutput[] = [
    ...outputFindings.map(findingAsOutput),
    ...outputQuestions.map(questionAsOutput),
  ];

  if (experiment.figures.length > 0) {
    outputs.push({
      id: `output:figures:${experiment.slug}`,
      kind: 'artifact',
      label: `${experiment.figures.length} figure${experiment.figures.length === 1 ? '' : 's'}`,
      detail: experiment.figures[0].replace('outputs/figures/', ''),
      meta: { tone: 'teal' },
      href: `/experiments/${experiment.slug}`,
    });
  }

  const relationships = buildRelationships(experiment, inputs, outputs, edges);

  return {
    experiment: buildExperimentVm(experiment),
    inputs,
    outputs,
    relationships,
  };
}

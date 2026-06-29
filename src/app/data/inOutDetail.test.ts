// Tests for entity-specific detail view models.
// Verifies that each entity type receives correct fields and actions,
// and that confidence is never labeled as status, artifact filenames
// are never labeled as status, and raw routes are not primary content.

import { describe, expect, it } from 'vitest';
import {
  buildInOutViewModel,
  buildFindingDetail,
  buildQuestionDetail,
  buildDatasetDetail,
  buildDocumentDetail,
  buildArtifactDetail,
  buildExperimentDetail,
  buildRelationshipDetailModel,
  getSummary,
} from './inOut';
import { findings, openQuestions, experiments, edges } from './index';

const exp = experiments.find((e) => e.slug === 'experiments/2026-06-08_anomaly_check')!;

describe('FindingDetail', () => {
  const f = findings.find((x) => x.id === 'F-0050')!;
  const detail = buildFindingDetail(f, 'produced-finding', exp);

  it('has kind = finding', () => {
    expect(detail.kind).toBe('finding');
  });

  it('has confidence as a separate field, not status', () => {
    expect(detail.confidence).toBeDefined();
    expect(detail.confidence).toBe(f.confidence);
  });

  it('does not have a "status" field that holds confidence', () => {
    expect((detail as unknown as Record<string, unknown>).status).toBeUndefined();
  });

  it('has action status as a separate field', () => {
    expect(detail.actionStatus).toBeDefined();
    expect(detail.actionStatus).toContain('Action');
  });

  it('has a category field', () => {
    expect(detail.category).toBe(f.category);
  });

  it('has a source experiment field', () => {
    expect(detail.sourceExperiment).toBe(f.evidence);
  });

  it('has an "Open finding" action, not "Open in findings"', () => {
    expect(detail.actions.length).toBeGreaterThan(0);
    expect(detail.actions[0].label).toBe('Open finding');
    expect(detail.actions[0].href).toContain('/findings?focus=');
  });

  it('does not expose raw route as primary content', () => {
    // The raw route should not be in the title, summary, or relationshipToCurrent
    expect(detail.title).not.toContain('/findings');
    expect(detail.summary).not.toContain('/findings');
  });
});

describe('QuestionDetail', () => {
  const q = openQuestions.find((x) => x.id === 'Q-0014')!;
  const detail = buildQuestionDetail(q, 'produced-question', exp);

  it('has kind = question', () => {
    expect(detail.kind).toBe('question');
  });

  it('has status and priority as separate fields', () => {
    expect(detail.status).toBe(q.status);
    expect(detail.priority).toBe(q.priority);
  });

  it('has area and raisedDate', () => {
    expect(detail.area).toBe(q.area);
    expect(detail.raisedDate).toBe(q.raisedDate);
  });

  it('has an "Open question" action', () => {
    expect(detail.actions[0].label).toBe('Open question');
    expect(detail.actions[0].href).toContain('/findings?tab=questions');
  });
});

describe('DatasetDetail', () => {
  const detail = buildDatasetDetail(exp, 'source-data');

  it('has kind = dataset', () => {
    expect(detail.kind).toBe('dataset');
  });

  it('has rowCount, dateRange, freshness — not status', () => {
    expect(detail.rowCount).toBeDefined();
    expect(detail.dateRange).toBeDefined();
    expect(detail.freshness).toBeDefined();
    expect((detail as unknown as Record<string, unknown>).status).toBeUndefined();
  });

  it('does not have a filename as a field', () => {
    expect(detail.rowCount).not.toContain('.png');
  });
});

describe('DocumentDetail', () => {
  const detail = buildDocumentDetail(exp, 'source-document');

  it('has kind = document', () => {
    expect(detail.kind).toBe('document');
  });

  it('has availability, not status', () => {
    expect(detail.availability).toBeDefined();
    expect((detail as unknown as Record<string, unknown>).status).toBeUndefined();
  });

  it('has an "Open document" action', () => {
    expect(detail.actions[0].label).toBe('Open document');
  });
});

describe('ArtifactDetail', () => {
  // Use an experiment with 2 figures
  const exp2 = experiments.find((e) => e.figures.length === 2) ?? exp;
  const detail = buildArtifactDetail(exp2, 'artifact');

  it('has kind = artifact', () => {
    expect(detail.kind).toBe('artifact');
  });

  it('does not label a filename as status', () => {
    expect((detail as unknown as Record<string, unknown>).status).toBeUndefined();
  });

  it('has artifactType and fileCount', () => {
    expect(detail.artifactType).toBe('Figure');
    expect(detail.fileCount).toBe(exp2.figures.length);
  });

  it('lists all files, not just one', () => {
    expect(detail.files.length).toBe(exp2.figures.length);
    if (exp2.figures.length > 1) {
      expect(detail.files.length).toBeGreaterThan(1);
    }
  });

  it('has a "preview" or "open" action, not "Open in findings"', () => {
    const labels = detail.actions.map((a) => a.label);
    expect(labels).not.toContain('Open in findings');
    expect(labels.some((l) => l.includes('experiment') || l.includes('artifact') || l.includes('preview'))).toBe(true);
  });
});

describe('ExperimentDetail', () => {
  const detail = buildExperimentDetail(exp, 'experiment');

  it('has kind = experiment', () => {
    expect(detail.kind).toBe('experiment');
  });

  it('has status, date, stage', () => {
    expect(detail.status).toBeDefined();
    expect(detail.date).toBe(exp.date);
    expect(detail.stage).toBeDefined();
  });

  it('has an "Open experiment report" action', () => {
    expect(detail.actions[0].label).toContain('experiment');
    expect(detail.actions[0].href).not.toContain('/experiments/experiments/');
  });
});

describe('RelationshipDetailModel', () => {
  const vm = buildInOutViewModel({ experiments, findings, openQuestions, edges, focusSlug: 'experiments/2026-06-08_anomaly_check' });
  const rel = vm.visibleRelationships[0];
  const detail = buildRelationshipDetailModel(rel, exp);

  it('has kind = relationship', () => {
    expect(detail.kind).toBe('relationship');
  });

  it('has from and to entities', () => {
    expect(detail.from).toBeDefined();
    expect(detail.to).toBeDefined();
  });

  it('has an explanation sentence', () => {
    expect(detail.explanation.length).toBeGreaterThan(0);
  });

  it('has bothEndpointsVisible flag', () => {
    expect(typeof detail.bothEndpointsVisible).toBe('boolean');
  });
});

describe('Summary counts', () => {
  const vm = buildInOutViewModel({ experiments, findings, openQuestions, edges, focusSlug: 'experiments/2026-06-08_anomaly_check' });
  const summary = getSummary(vm);

  it('produced + updated + carriedForward + artifacts = outputs (excluding open-questions)', () => {
    const nonQuestionOutputs = vm.outputs.filter((o) => o.group !== 'open-questions').length;
    expect(summary.produced + summary.updated + summary.carriedForward + summary.artifacts).toBe(nonQuestionOutputs);
  });

  it('carriedForward is not counted as produced', () => {
    expect(summary.carriedForward).toBe(vm.outputs.filter((o) => o.group === 'carried-forward').length);
    expect(summary.produced).toBe(vm.outputs.filter((o) => o.group === 'produced').length);
  });

  it('confirmedRelationships equals visibleRelationships length', () => {
    expect(summary.confirmedRelationships).toBe(vm.visibleRelationships.length);
  });
});

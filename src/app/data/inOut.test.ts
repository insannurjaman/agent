// Tests for the In/Out data layer.
//
// These tests are framework-light (vitest) and validate the P0 invariants
// of the entity resolver and view model so we can catch regressions in
// the data layer before they reach the UI.

import { describe, expect, it } from 'vitest';
import {
  buildInOutViewModel,
  resolveEntityStrict,
  describeRelationshipSentence,
  formatRowCount,
  pluralize,
} from './inOut';
import { findings } from './findings';
import { openQuestions } from './openQuestions';
import { experiments } from './experiments';
import { edges } from './edges';

describe('resolveEntityStrict', () => {
  it('resolves a known finding by id', () => {
    const e = resolveEntityStrict('F-0001', findings, openQuestions, experiments);
    expect(e.kind).toBe('finding');
    expect(e.id).toBe('F-0001');
    expect(e.unresolved).toBeFalsy();
    expect(e.title.length).toBeGreaterThan(0);
  });

  it('resolves a known open question by id', () => {
    const e = resolveEntityStrict('Q-0003', findings, openQuestions, experiments);
    expect(e.kind).toBe('question');
    expect(e.id).toBe('Q-0003');
    expect(e.unresolved).toBeFalsy();
  });

  it('resolves a known experiment by slug', () => {
    const e = resolveEntityStrict(
      'experiments/2026-06-08_anomaly_check',
      findings,
      openQuestions,
      experiments,
    );
    expect(e.kind).toBe('experiment');
    expect(e.unresolved).toBeFalsy();
  });

  it('returns unresolved entity for an unknown finding ID', () => {
    const e = resolveEntityStrict('F-9999', findings, openQuestions, experiments);
    expect(e.kind).toBe('unknown');
    expect(e.unresolved).toBe(true);
  });

  it('returns unresolved entity for an unknown question ID', () => {
    const e = resolveEntityStrict('Q-9999', findings, openQuestions, experiments);
    expect(e.kind).toBe('unknown');
    expect(e.unresolved).toBe(true);
  });

  it('returns unresolved entity for an unknown experiment slug', () => {
    const e = resolveEntityStrict(
      'experiments/2099-99-99_nonexistent',
      findings,
      openQuestions,
      experiments,
    );
    expect(e.kind).toBe('unknown');
    expect(e.unresolved).toBe(true);
  });

  it('does not fall back to an experiment for an unrelated ID', () => {
    const f = resolveEntityStrict('F-0050', findings, openQuestions, experiments);
    expect(f.kind).not.toBe('experiment');
  });

  it('resolves synthetic input/output prefixed ids', () => {
    const e = resolveEntityStrict('input:finding:F-0001', findings, openQuestions, experiments);
    expect(e.kind).toBe('finding');
    expect(e.id).toBe('F-0001');
  });

  it('does not return the experiment title for an unrelated question id', () => {
    const exp = experiments[0];
    const e = resolveEntityStrict('Q-0014', findings, openQuestions, experiments);
    expect(e.title).not.toBe(exp.title);
  });
});

describe('buildInOutViewModel', () => {
  const vm = buildInOutViewModel({
    experiments,
    findings,
    openQuestions,
    edges,
    focusSlug: 'experiments/2026-06-08_anomaly_check',
  });

  it('returns the focused experiment', () => {
    expect(vm.experiment?.slug).toBe('experiments/2026-06-08_anomaly_check');
  });

  it('does not duplicate the same finding on both sides without a role', () => {
    const inputIds = new Set(
      vm.inputs.filter((i) => i.entity.kind === 'finding').map((i) => i.entity.id),
    );
    for (const o of vm.outputs) {
      if (o.entity.kind !== 'finding') continue;
      if (o.role === 'carried-forward') continue;
      expect(inputIds.has(o.entity.id)).toBe(false);
    }
  });

  it('groups contain only non-empty buckets', () => {
    const inputGroups = new Set(vm.inputs.map((i) => i.group));
    const outputGroups = new Set(vm.outputs.map((o) => o.group));
    expect(inputGroups.size).toBeGreaterThan(0);
    expect(outputGroups.size).toBeGreaterThan(0);
  });

  it('previous-finding inputs come from related findings older than the experiment', () => {
    const date = vm.experiment?.date;
    expect(date).toBeTruthy();
    for (const i of vm.inputs) {
      if (i.role !== 'previous-finding') continue;
      const f = findings.find((x) => x.id === i.entity.id);
      expect(f).toBeTruthy();
      expect(f!.date < date!).toBe(true);
    }
  });

  it('all relationships resolve to real entities or are marked unresolved', () => {
    for (const r of vm.relationships) {
      const hasFrom = !!r.from.title || !!r.from.unresolved;
      const hasTo = !!r.to.title || !!r.to.unresolved;
      expect(hasFrom).toBe(true);
      expect(hasTo).toBe(true);
      if (r.from.unresolved || r.to.unresolved) {
        expect(r.scope).toBe('unresolved');
      }
    }
  });

  it('relationships never silently fall back to the experiment title', () => {
    for (const r of vm.relationships) {
      if (r.from.id === vm.experiment?.slug) continue;
      if (r.to.id === vm.experiment?.slug) continue;
      expect(r.from.title).not.toBe(vm.experiment?.title);
      expect(r.to.title).not.toBe(vm.experiment?.title);
    }
  });

  it('visible relationships are marked as shownInMap', () => {
    for (const r of vm.visibleRelationships) {
      expect(r.shownInMap).toBe(true);
    }
  });

  it('scope is one of visible | external | unresolved', () => {
    for (const r of vm.additionalRelationships) {
      expect(['visible', 'external', 'unresolved']).toContain(r.scope);
    }
  });
});

describe('formatters', () => {
  it('pluralize handles singular and plural', () => {
    expect(pluralize(1, 'figure', 'figures')).toBe('1 figure');
    expect(pluralize(2, 'figure', 'figures')).toBe('2 figures');
  });

  it('formatRowCount removes "rows rows" duplication', () => {
    expect(formatRowCount('1428 rows rows')).toBe('1428 rows');
  });

  it('formatRowCount leaves clean input alone', () => {
    expect(formatRowCount('1428 rows')).toBe('1428 rows');
  });

  it('formatRowCount handles empty / undefined', () => {
    expect(formatRowCount(undefined)).toBe('—');
    expect(formatRowCount('')).toBe('—');
  });
});

describe('describeRelationshipSentence', () => {
  const e1 = { id: 'F-0050', kind: 'finding' as const, title: 'Entry temperature' };
  const e2 = { id: 'F-0034', kind: 'finding' as const, title: 'Roll-gap variance' };
  const e3 = {
    id: 'experiments/2026-06-08_anomaly_check',
    kind: 'experiment' as const,
    title: 'Anomaly check',
  };
  const e4 = { id: 'F-9999', kind: 'unknown' as const, title: 'F-9999', unresolved: true };

  it('finding → finding cite', () => {
    const s = describeRelationshipSentence(e1, e2, 'cite');
    expect(s).toContain('Entry temperature');
    expect(s).toContain('Roll-gap variance');
  });

  it('experiment → finding produces', () => {
    const s = describeRelationshipSentence(e3, e2, 'produces');
    expect(s).toContain('Anomaly check');
    expect(s).toContain('Roll-gap variance');
  });

  it('unresolved endpoint does not get a made-up title', () => {
    const s = describeRelationshipSentence(e1, e4, 'cite');
    expect(s).toBeTruthy();
  });
});

describe('inputs vs outputs semantics', () => {
  it('a finding that predates the experiment is an input, not an output', () => {
    const vm = buildInOutViewModel({
      experiments,
      findings,
      openQuestions,
      edges,
      focusSlug: 'experiments/2026-06-08_anomaly_check',
    });
    // F-0034 predates 2026-06-08.
    const f = findings.find((x) => x.id === 'F-0034')!;
    expect(f.date < vm.experiment!.date).toBe(true);
    const asInput = vm.inputs.find((i) => i.entity.id === 'F-0034');
    expect(asInput).toBeTruthy();
    expect(asInput!.role).toBe('previous-finding');
  });

  it('a finding dated on/after the experiment is a produced output', () => {
    const vm = buildInOutViewModel({
      experiments,
      findings,
      openQuestions,
      edges,
      focusSlug: 'experiments/2026-05-20_feed_rate_recheck',
    });
    // F-0048 was produced on 2026-05-22 by this experiment.
    const f = findings.find((x) => x.id === 'F-0048')!;
    expect(f.date >= vm.experiment!.date).toBe(true);
    const asOutput = vm.outputs.find((o) => o.entity.id === 'F-0048');
    expect(asOutput).toBeTruthy();
    expect(['produced-finding', 'updated-finding', 'carried-forward']).toContain(asOutput!.role);
  });
});

describe('relationships: visible vs external', () => {
  it('visible relationships connect entities that appear in the map', () => {
    const vm = buildInOutViewModel({
      experiments,
      findings,
      openQuestions,
      edges,
      focusSlug: 'experiments/2026-06-08_anomaly_check',
    });
    for (const r of vm.visibleRelationships) {
      // Either endpoint is in the map (inputs, outputs, or the experiment).
      const inInputs = vm.inputs.some((i) => i.entity.id === r.from.id);
      const inOutputs = vm.outputs.some((o) => o.entity.id === r.to.id);
      const isExperiment = r.from.id === vm.experiment?.id || r.to.id === vm.experiment?.id;
      expect(inInputs || inOutputs || isExperiment).toBe(true);
    }
  });

  it('additional relationships are categorized by scope', () => {
    const vm = buildInOutViewModel({
      experiments,
      findings,
      openQuestions,
      edges,
      focusSlug: 'experiments/2026-06-08_anomaly_check',
    });
    for (const r of vm.additionalRelationships) {
      expect(['visible', 'external', 'unresolved']).toContain(r.scope);
    }
  });

  it('visible relationships never have unresolved endpoints', () => {
    const vm = buildInOutViewModel({
      experiments,
      findings,
      openQuestions,
      edges,
      focusSlug: 'experiments/2026-06-08_anomaly_check',
    });
    for (const r of vm.visibleRelationships) {
      expect(r.from.unresolved).toBeFalsy();
      expect(r.to.unresolved).toBeFalsy();
    }
  });

  it('relationship sentence preserves the entity title for both endpoints', () => {
    const vm = buildInOutViewModel({
      experiments,
      findings,
      openQuestions,
      edges,
      focusSlug: 'experiments/2026-06-08_anomaly_check',
    });
    const inF = vm.inputs.find((i) => i.role === 'previous-finding');
    const outF = vm.outputs.find((o) => o.role === 'produced-finding' || o.role === 'carried-forward');
    expect(inF).toBeTruthy();
    expect(outF).toBeTruthy();
    const rel = vm.visibleRelationships.find(
      (r) => r.from.id === inF!.entity.id || r.to.id === outF!.entity.id,
    );
    if (rel) {
      const sentence = describeRelationshipSentence(rel.from, rel.to, rel.edgeType);
      expect(sentence).toContain(rel.from.title);
      expect(sentence).toContain(rel.to.title);
    }
  });
});

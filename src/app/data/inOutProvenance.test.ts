// Tests for provenance classification — verifies that entity transitions
// are correctly classified and that the same entity is not shown as
// "produced" when it was actually a state transition.

import { describe, expect, it } from 'vitest';
import { buildInOutViewModel, getSummary } from './inOut';
import { experiments, findings, openQuestions, edges } from './index';

describe('Provenance: question transitions', () => {
  // Experiment 2026-05-20_feed_rate_recheck has relatedQuestions: ['Q-0011', 'Q-0003']
  // Q-0003: raisedDate 2026-02-05, status "resolved" — was resolved by this experiment
  // Q-0011: raisedDate 2026-04-10, status "partial-progress" — partially resolved
  const vm = buildInOutViewModel({
    experiments, findings, openQuestions, edges,
    focusSlug: 'experiments/2026-05-20_feed_rate_recheck',
  });

  it('Q-0003 is not classified as produced-question', () => {
    const q0003Output = vm.outputs.find((o) => o.entity.id === 'Q-0003');
    expect(q0003Output).toBeTruthy();
    expect(q0003Output!.role).not.toBe('produced-question');
  });

  it('Q-0003 is classified as a transition (resolved or partially-resolved)', () => {
    const q0003Output = vm.outputs.find((o) => o.entity.id === 'Q-0003');
    expect(['resolved-question', 'partially-resolved-question', 'updated-question']).toContain(q0003Output!.role);
  });

  it('Q-0003 has previousState and resultingState', () => {
    const q0003Output = vm.outputs.find((o) => o.entity.id === 'Q-0003');
    expect(q0003Output!.previousState).toBeDefined();
    expect(q0003Output!.resultingState).toBeDefined();
  });

  it('Q-0003 also appears as a previous-question input', () => {
    const q0003Input = vm.inputs.find((i) => i.entity.id === 'Q-0003');
    expect(q0003Input).toBeTruthy();
    expect(q0003Input!.role).toBe('previous-question');
  });

  it('Q-0011 is not classified as produced-question', () => {
    const q0011Output = vm.outputs.find((o) => o.entity.id === 'Q-0011');
    expect(q0011Output).toBeTruthy();
    expect(q0011Output!.role).not.toBe('produced-question');
  });
});

describe('Provenance: question newly created', () => {
  // Experiment 2026-06-08_anomaly_check has relatedQuestions: ['Q-0014']
  // Q-0014: raisedDate 2026-04-28, status "in-progress" — predates experiment (2026-04-28 < 2026-06-08)
  // So Q-0014 should be a transition, NOT produced
  const vm = buildInOutViewModel({
    experiments, findings, openQuestions, edges,
    focusSlug: 'experiments/2026-06-08_anomaly_check',
  });

  it('Q-0014 is not classified as produced-question', () => {
    const q0014Output = vm.outputs.find((o) => o.entity.id === 'Q-0014');
    expect(q0014Output).toBeTruthy();
    expect(q0014Output!.role).not.toBe('produced-question');
  });

  it('Q-0014 is classified as a transition', () => {
    const q0014Output = vm.outputs.find((o) => o.entity.id === 'Q-0014');
    expect(['resolved-question', 'partially-resolved-question', 'updated-question']).toContain(q0014Output!.role);
  });
});

describe('Provenance: REPORT.md classification', () => {
  // Experiment 2026-06-08_anomaly_check has reportStatus: 'report'
  // REPORT.md should be an outcome, NOT an input
  const vm = buildInOutViewModel({
    experiments, findings, openQuestions, edges,
    focusSlug: 'experiments/2026-06-08_anomaly_check',
  });

  it('REPORT.md does not appear as a source-document input', () => {
    const docInput = vm.inputs.find((i) => i.role === 'source-document');
    expect(docInput).toBeTruthy();
    // The input document should be README.md, not REPORT.md
    expect(docInput!.entity.title).toBe('README.md');
    expect(docInput!.entity.title).not.toBe('REPORT.md');
  });

  it('REPORT.md appears as a generated-report output', () => {
    const reportOutput = vm.outputs.find((o) => o.role === 'generated-report');
    expect(reportOutput).toBeTruthy();
    expect(reportOutput!.entity.title).toBe('REPORT.md');
    expect(reportOutput!.group).toBe('generated-report');
  });
});

describe('Provenance: no REPORT.md as input for exploration-only experiments', () => {
  // For experiments without a report, README.md is the input and no report output
  const expWithoutReport = experiments.find((e) => e.reportStatus === 'exploration-only');
  if (!expWithoutReport) return;
  const vm = buildInOutViewModel({
    experiments, findings, openQuestions, edges,
    focusSlug: expWithoutReport.slug,
  });

  it('no generated-report output for exploration-only experiments', () => {
    const reportOutput = vm.outputs.find((o) => o.role === 'generated-report');
    expect(reportOutput).toBeUndefined();
  });
});

describe('Summary counts match rendered groups', () => {
  const vm = buildInOutViewModel({
    experiments, findings, openQuestions, edges,
    focusSlug: 'experiments/2026-06-08_anomaly_check',
  });
  const summary = getSummary(vm);

  it('newFindings matches new-findings group count', () => {
    expect(summary.newFindings).toBe(vm.outputs.filter((o) => o.group === 'new-findings').length);
  });

  it('newQuestions matches new-questions group count', () => {
    expect(summary.newQuestions).toBe(vm.outputs.filter((o) => o.group === 'new-questions').length);
  });

  it('resolvedQuestions matches resolved-questions group count', () => {
    expect(summary.resolvedQuestions).toBe(vm.outputs.filter((o) => o.group === 'resolved-questions').length);
  });

  it('carriedForward matches carried-forward group count', () => {
    expect(summary.carriedForward).toBe(vm.outputs.filter((o) => o.group === 'carried-forward').length);
  });

  it('carriedForward is not counted as newFindings', () => {
    expect(summary.carriedForward).not.toBe(summary.newFindings);
    expect(summary.newFindings).toBe(vm.outputs.filter((o) => o.group === 'new-findings').length);
    expect(summary.carriedForward).toBe(vm.outputs.filter((o) => o.group === 'carried-forward').length);
  });

  it('generatedReport is true when report output exists', () => {
    expect(summary.generatedReport).toBe(vm.outputs.some((o) => o.group === 'generated-report'));
  });

  it('connections matches visibleRelationships length', () => {
    expect(summary.connections).toBe(vm.visibleRelationships.length);
  });
});

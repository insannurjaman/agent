// Tests for the canonical route helpers.

import { describe, expect, it } from 'vitest';
import { canonicalExperimentPath, canonicalInOutPath, normalizeExperimentId } from './routes';

describe('normalizeExperimentId', () => {
  it('strips a single leading experiments/ segment', () => {
    expect(normalizeExperimentId('experiments/2026-06-08_anomaly_check')).toBe('2026-06-08_anomaly_check');
  });

  it('strips multiple leading experiments/ segments (legacy malformed)', () => {
    expect(normalizeExperimentId('experiments/experiments/2026-06-08_anomaly_check')).toBe('2026-06-08_anomaly_check');
  });

  it('leaves a bare id untouched', () => {
    expect(normalizeExperimentId('2026-06-08_anomaly_check')).toBe('2026-06-08_anomaly_check');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeExperimentId('')).toBe('');
  });
});

describe('canonicalExperimentPath', () => {
  it('builds /experiments/:id from a full slug', () => {
    expect(canonicalExperimentPath('experiments/2026-06-08_anomaly_check')).toBe('/experiments/2026-06-08_anomaly_check');
  });

  it('builds /experiments/:id from a bare id', () => {
    expect(canonicalExperimentPath('2026-06-08_anomaly_check')).toBe('/experiments/2026-06-08_anomaly_check');
  });

  it('never produces /experiments/experiments/', () => {
    const p = canonicalExperimentPath('experiments/experiments/foo');
    expect(p).not.toContain('/experiments/experiments/');
    expect(p).toBe('/experiments/foo');
  });

  it('returns /experiments for empty input', () => {
    expect(canonicalExperimentPath('')).toBe('/experiments');
  });
});

describe('canonicalInOutPath', () => {
  it('builds /in-out/:id from a full slug', () => {
    expect(canonicalInOutPath('experiments/2026-06-08_anomaly_check')).toBe('/in-out/2026-06-08_anomaly_check');
  });

  it('returns /in-out when no slug is given', () => {
    expect(canonicalInOutPath()).toBe('/in-out');
  });
});

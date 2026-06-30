// Canonical route builders.
//
// The experiment `slug` field in the data layer already includes the
// `experiments/` prefix (e.g. `experiments/2026-06-08_anomaly_check`).
// Naively interpolating `/experiments/${slug}` therefore produced
// `/experiments/experiments/2026-06-08_anomaly_check`. This module is the
// single source of truth for building experiment URLs so that bug cannot
// recur.

/**
 * Strip a leading `experiments/` segment from a slug or id so it can be
 * safely interpolated into the canonical `/experiments/:id` route.
 */
export function normalizeExperimentId(slugOrId: string): string {
  if (!slugOrId) return '';
  // Remove any number of leading `experiments/` segments so even
  // `experiments/experiments/foo` collapses to `foo`.
  let s = slugOrId;
  while (s.startsWith('experiments/')) {
    s = s.slice('experiments/'.length);
  }
  return s;
}

/**
 * Build the canonical experiment route: `/experiments/:id`.
 * The id is the bare slug (without the `experiments/` prefix).
 */
export function canonicalExperimentPath(slugOrId?: string): string {
  const id = normalizeExperimentId(slugOrId);
  if (!id) return '/experiments';
  return `/experiments/${id}`;
}

/**
 * Build the canonical In/Out route, optionally focused on an experiment.
 */
export function canonicalInOutPath(slugOrId?: string): string {
  if (!slugOrId) return '/in-out';
  const id = normalizeExperimentId(slugOrId);
  if (!id) return '/in-out';
  return `/in-out/${id}`;
}

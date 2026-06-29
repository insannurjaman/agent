// Smoke test that the In/Out screen module imports cleanly and
// produces a non-empty default export. We avoid rendering the
// component (no DOM testing library is installed) but the import
// itself is a useful catch-all for the screen-level TypeScript
// regressions.

import { describe, expect, it } from 'vitest';

describe('InOutScreen module', () => {
  it('exports InOutScreen as a function', async () => {
    const mod = await import('./InOutScreen');
    expect(typeof mod.InOutScreen).toBe('function');
  });
});

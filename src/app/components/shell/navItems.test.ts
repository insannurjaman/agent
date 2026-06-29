// Tests for the sidebar navigation configuration.

import { describe, expect, it } from 'vitest';
import { navItems } from './navItems';

describe('sidebar order', () => {
  it('has exactly 5 items', () => {
    expect(navItems.length).toBe(5);
  });

  it('orders items as Experiments, Chat, In/Out, Findings & Questions, Knowledge Graph', () => {
    const labels = navItems.map((n) => n.label);
    expect(labels).toEqual([
      'Experiments',
      'Chat',
      'In/Out',
      'Findings & Questions',
      'Knowledge Graph',
    ]);
  });

  it('uses /experiments as the first route', () => {
    expect(navItems[0].to).toBe('/experiments');
  });

  it('uses /chat as the second route', () => {
    expect(navItems[1].to).toBe('/chat');
  });

  it('uses /in-out as the third route', () => {
    expect(navItems[2].to).toBe('/in-out');
  });

  it('every item has a label and an icon', () => {
    for (const item of navItems) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.icon).toBeDefined();
    }
  });

  it('no two items share the same route', () => {
    const routes = navItems.map((n) => n.to);
    expect(new Set(routes).size).toBe(routes.length);
  });
});

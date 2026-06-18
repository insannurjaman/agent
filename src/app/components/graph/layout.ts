import type { Edge } from '../../data';

export interface Pos {
  x: number;
  y: number;
}

// Radial layout for the neighborhood focus view: root centered, each hop ring
// placed at an increasing radius and spread evenly.
export function radialLayout(
  rootId: string,
  nodeIds: Set<string>,
  dist: Map<string, number>,
): Map<string, Pos> {
  const byHop = new Map<number, string[]>();
  for (const id of nodeIds) {
    const h = dist.get(id) ?? 1;
    if (!byHop.has(h)) byHop.set(h, []);
    byHop.get(h)!.push(id);
  }
  const pos = new Map<string, Pos>();
  pos.set(rootId, { x: 0, y: 0 });
  const ringGap = 220;
  for (const [hop, ids] of byHop) {
    if (hop === 0) continue;
    const r = hop * ringGap;
    ids.sort();
    ids.forEach((id, i) => {
      const angle = (i / ids.length) * Math.PI * 2 - Math.PI / 2 + hop * 0.4;
      pos.set(id, { x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    });
  }
  return pos;
}

// Deterministic force-directed layout for the global view.
export function forceLayout(nodeIds: Set<string>, edges: Edge[]): Map<string, Pos> {
  const ids = [...nodeIds].sort();
  const n = ids.length;
  const pos = new Map<string, Pos>();
  // Seeded circular initialization for determinism.
  ids.forEach((id, i) => {
    const a = (i / n) * Math.PI * 2;
    pos.set(id, { x: Math.cos(a) * 320, y: Math.sin(a) * 320 });
  });

  const adj = edges.filter((e) => nodeIds.has(e.src) && nodeIds.has(e.dst));
  const k = 180; // ideal spring length
  const repulsion = 90000;

  for (let iter = 0; iter < 260; iter++) {
    const disp = new Map<string, Pos>();
    ids.forEach((id) => disp.set(id, { x: 0, y: 0 }));

    // Repulsion
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = pos.get(ids[i])!;
        const b = pos.get(ids[j])!;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d2 = dx * dx + dy * dy || 0.01;
        const f = repulsion / d2;
        const d = Math.sqrt(d2);
        dx /= d;
        dy /= d;
        const da = disp.get(ids[i])!;
        const db = disp.get(ids[j])!;
        da.x += dx * f;
        da.y += dy * f;
        db.x -= dx * f;
        db.y -= dy * f;
      }
    }
    // Springs
    for (const e of adj) {
      const a = pos.get(e.src)!;
      const b = pos.get(e.dst)!;
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = (d - k) * 0.12;
      dx = (dx / d) * f;
      dy = (dy / d) * f;
      const da = disp.get(e.src)!;
      const db = disp.get(e.dst)!;
      da.x -= dx;
      da.y -= dy;
      db.x += dx;
      db.y += dy;
    }
    const cool = 1 - iter / 320;
    for (const id of ids) {
      const p = pos.get(id)!;
      const dp = disp.get(id)!;
      const dl = Math.sqrt(dp.x * dp.x + dp.y * dp.y) || 0.01;
      const step = Math.min(dl, 30) * cool;
      p.x += (dp.x / dl) * step;
      p.y += (dp.y / dl) * step;
    }
  }
  return pos;
}

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, Maximize2, RotateCcw, Plus, Minus, X, Crosshair, List, FilterIcon } from 'lucide-react';
import {
  edges as allEdges,
  graphNodes,
  edgeTypes,
  neighborhood,
} from '../../data';
import type { EdgeType, NodeKind } from '../../data';
import { MonoId } from '../common/primitives';
import { EmptyState } from '../common/EmptyState';
import { SegmentedControl } from '../common/SegmentedControl';
import { IconButton } from '../common/IconButton';
import { ResponsiveInspectorOverlay } from '../responsive/ResponsiveInspectorOverlay';
import { NodeInspector } from './NodeInspector';
import { FilterPanel } from './FilterPanel';
import { FocusContextBar } from './FocusContextBar';
import { EDGE_GROUPS, EDGE_GROUP_ORDER, getGroupEdgeTypes, type EdgeGroup } from './edgeGroups';
import { EDGE_COLOR, KIND_COLOR, NODE_W, NODE_H } from './graphConstants';
import { cn } from '../ui/utils';
import { forceLayout, radialLayout, type Pos } from './layout';

type Mode = 'neighborhood' | 'global';
type ViewMode = 'graph' | 'list';
type SortKey = 'default' | 'type' | 'label' | 'edges';
type NodeRenderTier = 'full' | 'compact' | 'pill' | 'dot' | 'cluster';

function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + '\u2026' : s; }

const NO_FOCUS_PLACEHOLDER = 'F-0050';
const COMPACT_W = 100;
const COMPACT_H = 32;
const PILL_W = 60;
const PILL_H = 20;

// ── Tier helpers ──────────────────────────────────────────────────────
function getNodeTier(depth: number, hopDist: number, scope: Mode): NodeRenderTier {
  if (scope === 'global') return 'dot';
  if (depth === 1) return 'full';
  if (depth === 2) return hopDist <= 1 ? 'full' : 'compact';
  if (depth === 3) {
    if (hopDist === 0) return 'full';
    if (hopDist === 1) return 'compact';
    if (hopDist === 2) return 'pill';
    return 'cluster'; // hop >= 3
  }
  return 'full';
}

function getEdgeOpacity(depth: number, hopDistSrc: number, hopDistDst: number, isSelected: boolean, isAdj: boolean): number {
  if (isSelected) return 1;
  if (!isAdj) return 0.04;
  if (depth === 1) return 0.6;
  if (depth === 2) return hopDistSrc <= 1 && hopDistDst <= 1 ? 0.55 : 0.2;
  if (depth === 3) {
    if (hopDistSrc <= 1 && hopDistDst <= 1) return 0.55;
    if (hopDistSrc <= 2 && hopDistDst <= 2) return 0.15;
    return 0.06;
  }
  return 0.4;
}

function getFitParams(scope: Mode, depth: number): { pad: number; minScale: number; maxScale: number } {
  if (scope === 'global') return { pad: 40, minScale: 0.12, maxScale: 0.8 };
  if (depth === 1) return { pad: 100, minScale: 0.5, maxScale: 1.4 };
  if (depth === 2) return { pad: 80, minScale: 0.35, maxScale: 1.2 };
  return { pad: 60, minScale: 0.2, maxScale: 1.0 };
}

const DEFAULT_KINDS = new Set<NodeKind>(['finding', 'question', 'experiment']);
const DEFAULT_EDGE_TYPES = new Set<EdgeType>(edgeTypes);

export function KnowledgeGraphScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialFocus = params.get('focus');

  // ── State ──────────────────────────────────────────────────────────
  const [scope, setScope] = useState<Mode>(initialFocus ? 'neighborhood' : 'neighborhood');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'list';
    return 'graph';
  });
  const [depth, setDepth] = useState(2);
  const [focusId, setFocusId] = useState<string>(initialFocus ?? NO_FOCUS_PLACEHOLDER);
  const [focusStack, setFocusStack] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(focusId);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [activeEdgeTypes, setActiveEdgeTypes] = useState<Set<EdgeType>>(new Set(edgeTypes));
  const [activeKinds, setActiveKinds] = useState<Set<NodeKind>>(new Set(DEFAULT_KINDS));
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [listSort, setListSort] = useState<SortKey>('default');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [instructionsDismissed, setInstructionsDismissed] = useState(() => {
    try { return sessionStorage.getItem('kg-instructions-dismissed') === 'true'; } catch { return false; }
  });
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchIdx, setSearchIdx] = useState(0);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // ── Subgraph ──────────────────────────────────────────────────────
  const sub = useMemo(() => {
    if (scope === 'neighborhood' && graphNodes.has(focusId)) {
      const nb = neighborhood(focusId, depth);
      return { nodeIds: nb.nodeIds, edges: nb.edges, dist: nb.dist };
    }
    const ids = new Set<string>(graphNodes.keys());
    return { nodeIds: ids, edges: allEdges, dist: new Map<string, number>() };
  }, [scope, focusId, depth]);

  // ── Filter ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const nodeIds = new Set([...sub.nodeIds].filter((id) => activeKinds.has(graphNodes.get(id)!.kind)));
    const edges = sub.edges.filter(
      (e) => activeEdgeTypes.has(e.edgeType) && nodeIds.has(e.src) && nodeIds.has(e.dst),
    );
    return { nodeIds, edges };
  }, [sub, activeKinds, activeEdgeTypes]);

  const toggleEdgeGroup = useCallback((group: EdgeGroup) => {
    const groupTypes = getGroupEdgeTypes(group);
    setActiveEdgeTypes((prev) => {
      const allActive = groupTypes.every((t) => prev.has(t));
      const next = new Set(prev);
      for (const t of groupTypes) allActive ? next.delete(t) : next.add(t);
      return next;
    });
  }, []);

  // ── Filter dirty detection ────────────────────────────────────────
  const isFilterDefault = useMemo(() => {
    if (activeKinds.size !== DEFAULT_KINDS.size) return false;
    for (const k of DEFAULT_KINDS) if (!activeKinds.has(k)) return false;
    if (activeEdgeTypes.size !== DEFAULT_EDGE_TYPES.size) return false;
    for (const t of DEFAULT_EDGE_TYPES) if (!activeEdgeTypes.has(t)) return false;
    return true;
  }, [activeKinds, activeEdgeTypes]);

  const filterChanges = useMemo(() => {
    if (isFilterDefault) return 0;
    let c = 0;
    for (const k of DEFAULT_KINDS) if (!activeKinds.has(k)) c++;
    for (const t of DEFAULT_EDGE_TYPES) if (!activeEdgeTypes.has(t)) c++;
    return c;
  }, [isFilterDefault, activeKinds, activeEdgeTypes]);

  const filterLabel = isFilterDefault ? 'Filters' : `Filters · ${filterChanges} hidden`;

  // ── Layout ────────────────────────────────────────────────────────
  const layout = useMemo<Map<string, Pos>>(() => {
    if (scope === 'neighborhood' && graphNodes.has(focusId)) return radialLayout(focusId, filtered.nodeIds, sub.dist);
    return forceLayout(filtered.nodeIds, filtered.edges);
  }, [scope, focusId, filtered, sub.dist]);

  // ── 3-hop clusters ────────────────────────────────────────────────
  const threeHopClusters = useMemo(() => {
    if (depth < 3 || scope !== 'neighborhood') return [];
    const threeHopIds = [...filtered.nodeIds].filter((id) => (sub.dist.get(id) ?? 0) >= 3);
    const byKind: Record<string, { ids: string[] }> = { finding: { ids: [] }, question: { ids: [] }, experiment: { ids: [] } };
    for (const id of threeHopIds) {
      const kind = graphNodes.get(id)?.kind;
      if (kind && byKind[kind]) byKind[kind].ids.push(id);
    }
    return Object.entries(byKind)
      .filter(([, v]) => v.ids.length > 0)
      .map(([kind, v]) => ({
        kind: kind as NodeKind,
        count: v.ids.length,
        x: v.ids.reduce((s, id) => s + (layout.get(id)?.x ?? 0), 0) / v.ids.length,
        y: v.ids.reduce((s, id) => s + (layout.get(id)?.y ?? 0), 0) / v.ids.length,
      }));
  }, [depth, scope, filtered.nodeIds, sub.dist, layout]);

  // ── Global clusters ───────────────────────────────────────────────
  const globalClusters = useMemo(() => {
    if (scope !== 'global') return [];
    const byKind: Record<string, { ids: string[] }> = { finding: { ids: [] }, question: { ids: [] }, experiment: { ids: [] } };
    for (const id of filtered.nodeIds) {
      const kind = graphNodes.get(id)?.kind;
      if (kind && byKind[kind]) byKind[kind].ids.push(id);
    }
    return Object.entries(byKind)
      .filter(([, v]) => v.ids.length > 0)
      .map(([kind, v]) => ({
        kind: kind as NodeKind,
        count: v.ids.length,
        x: v.ids.reduce((s, id) => s + (layout.get(id)?.x ?? 0), 0) / v.ids.length,
        y: v.ids.reduce((s, id) => s + (layout.get(id)?.y ?? 0), 0) / v.ids.length,
      }));
  }, [scope, filtered.nodeIds, layout]);

  // ── Camera ────────────────────────────────────────────────────────
  const { pad: fitPad, minScale: fitMinScale, maxScale: fitMaxScale } = getFitParams(scope, depth);

  const fitView = useCallback(() => {
    const el = wrapRef.current;
    if (!el || filtered.nodeIds.size === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const id of filtered.nodeIds) {
      const p = layout.get(id);
      if (!p) continue;
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }
    const pad = fitPad;
    const w = maxX - minX + pad * 2 + NODE_W;
    const h = maxY - minY + pad * 2 + NODE_H;
    const scale = Math.min(el.clientWidth / w, el.clientHeight / h, fitMaxScale);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setView({ x: el.clientWidth / 2 - cx * scale, y: el.clientHeight / 2 - cy * scale, scale });
  }, [filtered.nodeIds, layout, fitPad, fitMaxScale]);

  useEffect(() => { fitView(); }, [fitView]);

  // Re-fit on structural changes only (not filter changes)
  useEffect(() => { fitView(); }, [depth, scope, focusId]);

  const centerOn = useCallback((id: string) => {
    const p = layout.get(id);
    const el = wrapRef.current;
    if (!p || !el) return;
    const newScale = Math.max(view.scale, 0.5);
    setView({ x: el.clientWidth / 2 - p.x * newScale, y: el.clientHeight / 2 - p.y * newScale, scale: newScale });
  }, [layout, view.scale]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setView((v) => {
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      const scale = Math.min(Math.max(v.scale * factor, 0.08), 3);
      const k = scale / v.scale;
      return { scale, x: mx - (mx - v.x) * k, y: my - (my - v.y) * k };
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setView((v) => ({ ...v, x: d.vx + (e.clientX - d.x), y: d.vy + (e.clientY - d.y) }));
  };
  const onPointerUp = () => { drag.current = null; };
  const zoom = (dir: 1 | -1) => {
    const el = wrapRef.current;
    const cx = (el?.clientWidth ?? 600) / 2;
    const cy = (el?.clientHeight ?? 400) / 2;
    setView((v) => {
      const scale = Math.min(Math.max(v.scale * (dir > 0 ? 1.15 : 0.87), 0.08), 3);
      const k = scale / v.scale;
      return { scale, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });
  };

  // ── Adjacency ────────────────────────────────────────────────────
  const adjacent = useMemo(() => {
    if (!selectedId) return null;
    const ns = new Set<string>([selectedId]);
    for (const e of filtered.edges) {
      if (e.src === selectedId) ns.add(e.dst);
      if (e.dst === selectedId) ns.add(e.src);
    }
    return ns;
  }, [selectedId, filtered.edges]);

  const zoomLevel = view.scale;

  // ── Search ────────────────────────────────────────────────────────
  const searchMatches = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return [...graphNodes.values()]
      .filter((n) => n.id.toLowerCase().includes(q) || n.label.toLowerCase().includes(q))
      .slice(0, 8);
  }, [search]);

  useEffect(() => { setSearchIdx(0); }, [searchMatches.length]);

  const inspectNode = useCallback((id: string) => { setSelectedId(id); setInspectedId(id); }, []);

  const focusNode = useCallback((id: string) => {
    if (focusId && focusId !== id) setFocusStack((prev) => [...prev.slice(-9), focusId]);
    setFocusId(id); setScope('neighborhood'); inspectNode(id);
    setSearch('');
    requestAnimationFrame(() => centerOn(id));
  }, [focusId, centerOn, inspectNode]);

  const goBackFocus = useCallback(() => {
    if (focusStack.length === 0) return;
    const prev = focusStack[focusStack.length - 1];
    setFocusStack((p) => p.slice(0, -1));
    setFocusId(prev); inspectNode(prev);
    requestAnimationFrame(() => centerOn(prev));
  }, [focusStack, centerOn, inspectNode]);

  const clearFocus = useCallback(() => {
    setFocusId(NO_FOCUS_PLACEHOLDER); setFocusStack([]); setScope('neighborhood');
    setSelectedId(null); setInspectedId(null);
  }, []);

  // ── Derived ──────────────────────────────────────────────────────
  const selectedNode = selectedId ? graphNodes.get(selectedId) : undefined;
  const focusNodeData = graphNodes.get(focusId);

  const kindCounts = useMemo(() => {
    const counts: Record<string, number> = { finding: 0, question: 0, experiment: 0 };
    for (const id of filtered.nodeIds) {
      const kind = graphNodes.get(id)?.kind;
      if (kind) counts[kind]++;
    }
    return counts;
  }, [filtered.nodeIds]);

  const sortedList = useMemo(() => {
    const ids = [...filtered.nodeIds];
    switch (listSort) {
      case 'type': ids.sort((a, b) => {
        const ka = graphNodes.get(a)!.kind;
        const kb = graphNodes.get(b)!.kind;
        if (ka !== kb) return ka.localeCompare(kb);
        return a.localeCompare(b);
      }); break;
      case 'label': ids.sort((a, b) => graphNodes.get(a)!.label.localeCompare(graphNodes.get(b)!.label)); break;
      case 'edges': ids.sort((a, b) => {
        const ca = filtered.edges.filter((e) => e.src === a || e.dst === a).length;
        const cb = filtered.edges.filter((e) => e.src === b || e.dst === b).length;
        return cb - ca;
      }); break;
      default: ids.sort((a, b) => a.localeCompare(b));
    }
    return ids;
  }, [filtered.nodeIds, filtered.edges, listSort]);

  const nodeKinds: NodeKind[] = ['finding', 'question', 'experiment'];

  const dismissInstructions = useCallback(() => {
    setInstructionsDismissed(true);
    try { sessionStorage.setItem('kg-instructions-dismissed', 'true'); } catch {}
  }, []);

  // ── Filter panel ─────────────────────────────────────────────────
  const closeFilterPanel = useCallback(() => {
    setFilterPanelOpen(false);
    requestAnimationFrame(() => filterTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!filterPanelOpen) return;
    function onKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') closeFilterPanel(); }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [filterPanelOpen, closeFilterPanel]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-2 bg-surface min-h-10">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-medium text-text">Knowledge Graph</h1>
            <span className="font-mono text-[10px] text-text-muted">{allEdges.length} edges · {graphNodes.size} nodes</span>
          </div>
        </div>

        {/* Compact toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface px-4 py-1.5 min-h-10">
          {/* Search */}
          <div className="relative flex-1 min-w-[140px] max-w-[280px]">
            <div className="flex h-9 items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2 focus-within:border-brand-border transition-colors">
              <Search className="size-3 shrink-0 text-text-muted" />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (!searchMatches.length) return;
                  if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIdx((i) => Math.min(i + 1, searchMatches.length - 1)); }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setSearchIdx((i) => Math.max(i - 1, 0)); }
                  if (e.key === 'Enter') { e.preventDefault(); focusNode(searchMatches[searchIdx].id); }
                  if (e.key === 'Escape') { setSearch(''); searchRef.current?.blur(); }
                }}
                placeholder="Search nodes…" aria-label="Search graph node"
                className="w-full bg-transparent text-[12px] text-text outline-none placeholder:text-text-muted" />
              {search && <button type="button" onClick={() => setSearch('')} className="flex size-5 items-center justify-center rounded-sm text-text-muted hover:text-text" aria-label="Clear search"><X className="size-3" /></button>}
            </div>
            {searchMatches.length > 0 && (
              <div role="listbox" aria-label="Graph nodes" className="absolute z-30 mt-1 w-64 rounded-sm border border-border-strong bg-popover py-1 shadow-xl">
                {searchMatches.map((n, i) => (
                  <button key={n.id} type="button" role="option" aria-selected={selectedId === n.id}
                    onClick={() => focusNode(n.id)}
                    className={cn('flex w-full items-center gap-2 px-2.5 py-2 text-left min-h-10', i === searchIdx ? 'bg-surface-2' : 'hover:bg-surface-2')}>
                    <span className="size-2 shrink-0 rounded-full" style={{ background: KIND_COLOR[n.kind] }} />
                    <MonoId className="shrink-0 text-[11px]">{n.id.replace('experiments/', '')}</MonoId>
                    <span className="truncate text-[11px] text-text-muted">{n.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scope */}
          <select value={scope} onChange={(e) => { setScope(e.target.value as Mode); if (e.target.value === 'global') setFocusStack([]); }}
            className="h-9 rounded-sm border border-border-subtle bg-surface-2 px-2 font-mono text-[11px] text-text outline-none cursor-pointer" aria-label="Graph scope">
            <option value="neighborhood">Neighborhood</option>
            <option value="global">Global</option>
          </select>

          {/* Depth (neighborhood only) */}
          {scope === 'neighborhood' && (
            <select value={String(depth)} onChange={(e) => setDepth(Number(e.target.value))}
              className="h-9 rounded-sm border border-border-subtle bg-surface-2 px-2 font-mono text-[11px] text-text outline-none cursor-pointer" aria-label="Hop depth">
              <option value="1">1-hop</option> <option value="2">2-hop</option> <option value="3">3-hop</option>
            </select>
          )}

          <div className="flex items-center gap-1 ml-auto shrink-0">
            {/* View */}
            <SegmentedControl compact
              segments={[
                { id: 'graph', label: 'Graph', icon: <Crosshair className="size-3" /> },
                { id: 'list', label: 'List', icon: <List className="size-3" /> },
              ]}
              value={viewMode} onChange={(v) => setViewMode(v as 'graph' | 'list')} className="shrink-0" />

            {/* Filters button */}
            <div className="relative">
              <button ref={filterTriggerRef} type="button" onClick={() => setFilterPanelOpen((v) => !v)}
                aria-expanded={filterPanelOpen} aria-haspopup="true" aria-controls="filter-panel"
                className={cn('flex h-9 items-center gap-1.5 rounded-sm border px-2.5 font-mono text-[11px] transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-brand-ring',
                  filterPanelOpen || !isFilterDefault ? 'border-brand-border bg-brand-muted text-brand' : 'border-border-subtle bg-surface-2 text-text-muted hover:text-text-secondary')}>
                <FilterIcon className="size-3" />
                {filterLabel}
              </button>

              {/* Desktop filter popover */}
              {filterPanelOpen && !isMobile && (
                <>
                  <div className="fixed inset-0 z-10" onClick={closeFilterPanel} aria-hidden="true" />
                  <div id="filter-panel" className="absolute right-0 top-full z-20 mt-1 w-[320px] rounded-sm border border-border-strong bg-popover shadow-xl max-h-[70vh] overflow-auto">
                    <FilterPanel
                      activeKinds={activeKinds} activeEdgeTypes={activeEdgeTypes} kindCounts={kindCounts}
                      onToggleKind={(k) => setActiveKinds((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; })}
                      onToggleEdgeType={(t) => setActiveEdgeTypes((prev) => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; })}
                      onToggleGroup={toggleEdgeGroup}
                      onSelectAllKinds={() => setActiveKinds(new Set(DEFAULT_KINDS))}
                      onClearAllKinds={() => setActiveKinds(new Set())}
                      onResetToDefault={() => { setActiveKinds(new Set(DEFAULT_KINDS)); setActiveEdgeTypes(new Set(edgeTypes)); }}
                      isDefault={isFilterDefault}
                      onClose={closeFilterPanel} nodeKinds={nodeKinds} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile filter bottom sheet */}
        {filterPanelOpen && isMobile && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="fixed inset-0 bg-black/50" onClick={closeFilterPanel} />
            <div className="relative max-h-[85vh] w-full rounded-t-sm border-t border-border-strong bg-surface overflow-auto pb-[env(safe-area-inset-bottom)]">
              <FilterPanel
                activeKinds={activeKinds} activeEdgeTypes={activeEdgeTypes} kindCounts={kindCounts}
                onToggleKind={(k) => setActiveKinds((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; })}
                onToggleEdgeType={(t) => setActiveEdgeTypes((prev) => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; })}
                onToggleGroup={toggleEdgeGroup}
                onSelectAllKinds={() => setActiveKinds(new Set(DEFAULT_KINDS))}
                onClearAllKinds={() => setActiveKinds(new Set())}
                onResetToDefault={() => { setActiveKinds(new Set(DEFAULT_KINDS)); setActiveEdgeTypes(new Set(edgeTypes)); }}
                isDefault={isFilterDefault}
                onClose={closeFilterPanel} nodeKinds={nodeKinds} />
            </div>
          </div>
        )}

        {/* Focus context bar */}
        {scope === 'neighborhood' && focusNodeData && (
          <FocusContextBar
            focusId={focusId} focusNode={focusNodeData} hopDepth={depth}
            nodeCount={filtered.nodeIds.size} edgeCount={filtered.edges.length}
            canGoBack={focusStack.length > 0} onBack={goBackFocus} onClear={clearFocus} />
        )}

        {/* Content */}
        {viewMode === 'graph' ? (
          <div ref={wrapRef}
            onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
            className="relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden bg-background active:cursor-grabbing [background-image:radial-gradient(circle,#171c20_1px,transparent_1px)] [background-size:24px_24px]"
            aria-label="Graph canvas — drag to pan, scroll to zoom, double-click a node to focus">
            {filtered.nodeIds.size === 0 ? (
              <EmptyState title="No nodes match current filters" hint="Search for a node or adjust filters to display the graph." />
            ) : (
              <svg className="absolute inset-0 size-full" role="img" aria-label="Knowledge graph visualization">
                <defs>
                  {edgeTypes.map((t) => (
                    <marker key={t} id={`arrow-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                      <path d="M0,0 L10,5 L0,10 z" fill={EDGE_COLOR[t]} />
                    </marker>
                  ))}
                </defs>
                <g transform={`translate(${view.x},${view.y}) scale(${view.scale})`}>
                  {/* ── Global clusters ── */}
                  {scope === 'global' && zoomLevel < 0.4 && globalClusters.map((c) => (
                    <g key={`cluster-${c.kind}`} transform={`translate(${c.x},${c.y})`} opacity={0.9}>
                      <circle r={Math.min(8 + c.count * 0.5, 30)} fill={KIND_COLOR[c.kind]} opacity={0.3} stroke={KIND_COLOR[c.kind]} strokeWidth={1.5} />
                      <text textAnchor="middle" dy="0.35em" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="var(--text)" fontWeight="bold">{c.count}</text>
                      <text textAnchor="middle" dy="1.8em" fontSize="8" fontFamily="JetBrains Mono, monospace" fill="var(--text-muted)">{c.kind}</text>
                    </g>
                  ))}

                  {/* ── Edges ── */}
                  {(scope !== 'global' || zoomLevel >= 0.4) && filtered.edges.map((e, i) => {
                    const a = layout.get(e.src);
                    const b = layout.get(e.dst);
                    if (!a || !b) return null;
                    const sd = sub.dist.get(e.src) ?? 0;
                    const dd = sub.dist.get(e.dst) ?? 0;
                    const isAdj = adjacent && adjacent.has(e.src) && adjacent.has(e.dst);
                    const isSelPath = adjacent && adjacent.has(e.src) && adjacent.has(e.dst) && selectedId && (e.src === selectedId || e.dst === selectedId);
                    if (zoomLevel < 0.3 && !isSelPath) return null;
                    const emphatic = e.edgeType === 'supersedes' || e.edgeType === 'conflict-suspected';
                    const opacity = getEdgeOpacity(depth, sd, dd, isSelPath, !!isAdj);
                    if (opacity < 0.05) return null;
                    return (
                      <g key={i} opacity={opacity}>
                        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                          stroke={EDGE_COLOR[e.edgeType]}
                          strokeWidth={isSelPath ? 2.5 : emphatic ? 1.5 : 0.8}
                          strokeDasharray={e.edgeType === 'conflict-suspected' ? '5 4' : undefined}
                          markerEnd={zoomLevel >= 0.35 ? `url(#arrow-${e.edgeType})` : undefined} />
                        {zoomLevel > 0.7 && isSelPath && (
                          <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 3} textAnchor="middle" fontSize="7"
                            fontFamily="JetBrains Mono, monospace" fill={EDGE_COLOR[e.edgeType]} opacity={0.85}>{e.edgeType}</text>
                        )}
                      </g>
                    );
                  })}

                  {/* ── 3-hop clusters ── */}
                  {threeHopClusters.map((c) => (
                    <g key={`3hop-${c.kind}`} transform={`translate(${c.x},${c.y})`} opacity={0.7}>
                      <circle r={10 + Math.min(c.count, 20) * 0.3} fill={KIND_COLOR[c.kind]} opacity={0.25} stroke={KIND_COLOR[c.kind]} strokeWidth={1} />
                      <text textAnchor="middle" dy="0.35em" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="var(--text)" fontWeight="bold">{c.count}</text>
                      <text textAnchor="middle" dy="1.6em" fontSize="7" fontFamily="JetBrains Mono, monospace" fill="var(--text-muted)">{c.kind}</text>
                    </g>
                  ))}

                  {/* ── Nodes ── */}
                  {(scope !== 'global' || zoomLevel >= 0.4) && [...filtered.nodeIds]
                    .filter((id) => (sub.dist.get(id) ?? 0) < 3) // only non-clustered nodes
                    .map((id) => {
                    const node = graphNodes.get(id)!;
                    const p = layout.get(id);
                    if (!p) return null;
                    const hopDist = sub.dist.get(id) ?? 0;
                    const dim = adjacent && !adjacent.has(id);
                    const isFocused = scope === 'neighborhood' && id === focusId;
                    const isSelected = selectedId === id;
                    const color = KIND_COLOR[node.kind];
                    const tier = getNodeTier(depth, hopDist, scope);
                    const nodeOpacity = isSelected ? 1 : isFocused ? 1 : dim ? 0.08 : tier === 'full' ? 0.95 : tier === 'compact' ? 0.7 : 0.4;
                    if (zoomLevel < 0.2 && !isFocused && !isSelected) return null;

                    if (tier === 'dot' || (zoomLevel < 0.35 && tier !== 'full')) {
                      return (
                        <g key={id} transform={`translate(${p.x},${p.y})`} opacity={nodeOpacity} className="cursor-pointer" role="button" tabIndex={0}
                          aria-label={`${node.kind} ${id}: ${node.label}`}
                          onClick={(e) => { e.stopPropagation(); inspectNode(id); }}
                          onDoubleClick={(e) => { e.stopPropagation(); focusNode(id); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inspectNode(id); } }}>
                          <circle r={isFocused ? 5 : isSelected ? 4 : 2.5} fill={color} stroke={isSelected ? 'var(--text)' : 'none'} strokeWidth={isSelected ? 1.5 : 0} />
                        </g>
                      );
                    }

                    if (tier === 'pill') {
                      return (
                        <g key={id} transform={`translate(${p.x - PILL_W / 2},${p.y - PILL_H / 2})`} opacity={nodeOpacity}
                          className="cursor-pointer" role="button" tabIndex={0}
                          aria-label={`${node.kind} ${id}: ${node.label}`}
                          onClick={(e) => { e.stopPropagation(); inspectNode(id); }}
                          onDoubleClick={(e) => { e.stopPropagation(); focusNode(id); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inspectNode(id); } }}>
                          <rect width={PILL_W} height={PILL_H} rx={3} fill="var(--surface-2)" stroke={isFocused ? color : 'var(--border-subtle)'} strokeWidth={isFocused ? 1.5 : 0.5} />
                          <rect width={2} height={PILL_H} rx={1} fill={color} />
                          <text x={5} y={13} fontSize="8" fontFamily="JetBrains Mono, monospace" fill={color}>{id.replace('experiments/', '')}</text>
                        </g>
                      );
                    }

                    if (tier === 'compact') {
                      return (
                        <g key={id} transform={`translate(${p.x - COMPACT_W / 2},${p.y - COMPACT_H / 2})`} opacity={nodeOpacity}
                          className="cursor-pointer" role="button" tabIndex={0}
                          aria-label={`${node.kind} ${id}: ${node.label}`}
                          onClick={(e) => { e.stopPropagation(); inspectNode(id); }}
                          onDoubleClick={(e) => { e.stopPropagation(); focusNode(id); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inspectNode(id); } }}>
                          <rect width={COMPACT_W} height={COMPACT_H} rx={3} fill="var(--surface-2)" stroke={isFocused ? color : 'var(--border-subtle)'} strokeWidth={isFocused ? 2 : 0.8} />
                          <rect width={2} height={COMPACT_H} rx={1} fill={color} />
                          <text x={8} y={13} fontSize="9" fontFamily="JetBrains Mono, monospace" fill={color}>{id.replace('experiments/', '')}</text>
                          <text x={8} y={24} fontSize="8" fill="var(--text)">{truncate(node.label, 14)}</text>
                        </g>
                      );
                    }

                    // Full card
                    return (
                      <g key={id} transform={`translate(${p.x - NODE_W / 2},${p.y - NODE_H / 2})`} opacity={nodeOpacity}
                        className="cursor-pointer" role="button" tabIndex={0}
                        aria-label={`${node.kind} ${id.replace('experiments/', '')}: ${node.label}`}
                        aria-selected={isSelected}
                        onClick={(e) => { e.stopPropagation(); inspectNode(id); }}
                        onDoubleClick={(e) => { e.stopPropagation(); focusNode(id); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inspectNode(id); } }}>
                        <rect width={NODE_W} height={NODE_H} rx={3} fill="var(--surface-2)" stroke={isFocused ? color : isSelected ? color : 'var(--border-subtle)'} strokeWidth={isFocused ? 2.5 : isSelected ? 2 : 0.8} />
                        <rect width={3} height={NODE_H} rx={1.5} fill={color} />
                        <text x={12} y={18} fontSize="10" fontFamily="JetBrains Mono, monospace" fill={color}>{id.replace('experiments/', '')}</text>
                        <text x={12} y={32} fontSize="9" fill="var(--text)">{truncate(node.label, 22)}</text>
                        {hopDist <= 1 && <text x={12} y={42} fontSize="7" fontFamily="JetBrains Mono, monospace" fill="var(--text-muted)">{node.sub}</text>}
                      </g>
                    );
                  })}
                </g>
              </svg>
            )}

            {/* Floating zoom controls */}
            <div className="absolute bottom-4 right-4 flex gap-1 z-10">
              <IconButton icon={Minus} label="Zoom out" onClick={() => zoom(-1)} />
              <IconButton icon={Plus} label="Zoom in" onClick={() => zoom(1)} />
              <IconButton icon={Maximize2} label="Fit to view" onClick={fitView} />
              {!isFilterDefault && (
                <IconButton icon={RotateCcw} label="Reset filters" onClick={() => {
                  setActiveEdgeTypes(new Set(edgeTypes));
                  setActiveKinds(new Set(DEFAULT_KINDS));
                  fitView();
                }} />
              )}
            </div>

            {/* Minimap — desktop only */}
            {filtered.nodeIds.size > 0 && !isMobile && (
              <MiniMap nodeIds={filtered.nodeIds} layout={layout} rootId={focusId} mode={scope} />
            )}

            {/* Dense graph hint */}
            {scope === 'global' && filtered.edges.length > 200 && zoomLevel < 0.4 && (
              <div className="absolute left-1/2 top-3 z-20 hidden md:flex -translate-x-1/2 items-center gap-2 rounded-sm border border-amber/40 bg-amber/10 px-3 py-1 backdrop-blur">
                <span className="size-1.5 rounded-full bg-amber" />
                <span className="font-mono text-[9px] text-amber">{filtered.edges.length} edges — clusters shown at this zoom</span>
              </div>
            )}

            {/* Help */}
            {!instructionsDismissed ? (
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-sm border border-border-subtle bg-surface/80 px-2.5 py-1.5 backdrop-blur font-mono text-[9px] text-text-muted">
                drag to pan · scroll to zoom · double-click to focus
                <button type="button" onClick={dismissInstructions} className="flex size-5 items-center justify-center rounded-sm text-text-muted hover:text-text" aria-label="Dismiss instructions"><X className="size-3" /></button>
              </div>
            ) : (
              <button type="button" onClick={dismissInstructions} className="absolute bottom-4 left-4 z-10 size-7 rounded-sm border border-border-subtle bg-surface/60 font-mono text-[11px] text-text-muted hover:text-text backdrop-blur" aria-label="Show help" title="Show graph interaction help">?</button>
            )}
          </div>
        ) : (
          /* ── List view ── */
          <div className="min-h-0 flex-1 flex flex-col">
            <div className="flex items-center gap-2 border-b border-border-subtle bg-surface/80 px-4 py-1.5 min-h-9">
              <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted">Sort</span>
              {(['default', 'type', 'label', 'edges'] as SortKey[]).map((s) => (
                <button key={s} type="button" onClick={() => setListSort(s)}
                  className={cn('rounded-sm px-1.5 py-0.5 font-mono text-[10px] transition-colors', listSort === s ? 'bg-brand-muted text-brand' : 'text-text-muted hover:text-text')}>
                  {s === 'default' ? 'ID' : s === 'type' ? 'Type' : s === 'label' ? 'Label' : 'Edges'}
                </button>
              ))}
              <span className="ml-auto font-mono text-[9px] text-text-muted tabular-nums">{filtered.nodeIds.size} nodes</span>
            </div>
            <div className="min-h-0 flex-1 overflow-auto" role="region" aria-label="Relationship list">
              {filtered.nodeIds.size === 0 ? (
                <EmptyState title="No nodes match current filters" hint="Adjust filters to see relationships." />
              ) : (
                <div className="divide-y divide-border-subtle">
                  {sortedList.map((id) => {
                    const node = graphNodes.get(id)!;
                    const isSel = selectedId === id;
                    const incident = filtered.edges.filter((e) => e.src === id || e.dst === id);
                    const color = KIND_COLOR[node.kind];
                    let labelParts: { text: string; highlight: boolean }[] = [{ text: node.label, highlight: false }];
                    if (search.trim()) {
                      const idx = node.label.toLowerCase().indexOf(search.toLowerCase());
                      if (idx >= 0) labelParts = [
                        { text: node.label.slice(0, idx), highlight: false },
                        { text: node.label.slice(idx, idx + search.length), highlight: true },
                        { text: node.label.slice(idx + search.length), highlight: false },
                      ];
                    }
                    return (
                      <button key={id} type="button" onClick={() => inspectNode(id)}
                        className={cn('flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-2', isSel && 'bg-surface-2')}
                        aria-current={isSel ? 'true' : undefined}>
                        <span className="mt-0.5 size-2 shrink-0 rounded-full" style={{ background: color }} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <MonoId className={cn('text-[11px]', node.kind === 'experiment' ? 'text-info' : 'text-brand')}>{id.replace('experiments/', '')}</MonoId>
                            <span className="font-mono text-[9px] uppercase text-text-muted">{node.kind}</span>
                            <span className="ml-auto font-mono text-[9px] text-text-muted tabular-nums">{incident.length} edge{incident.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="mt-0.5 text-[12px] text-text-secondary">
                            {labelParts.map((part, i) => part.highlight ? <mark key={i} className="bg-brand-muted text-text rounded-sm px-0.5">{part.text}</mark> : <span key={i}>{part.text}</span>)}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {incident.slice(0, 3).map((ed, i) => {
                              const other = ed.src === id ? ed.dst : ed.src;
                              return <span key={i} className="rounded-sm border border-border-subtle bg-surface px-1 py-0.5 font-mono text-[9px] text-text-muted">{ed.edgeType} → {other.replace('experiments/', '')}</span>;
                            })}
                            {incident.length > 3 && <span className="font-mono text-[9px] text-text-muted">+{incident.length - 3} more</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Node inspector drawer */}
      {inspectedId && (() => {
        const node = graphNodes.get(inspectedId);
        if (!node) return null;
        return (
          <ResponsiveInspectorOverlay isOpen={true} onDismiss={() => setInspectedId(null)}>
            <NodeInspector node={node}
              incident={filtered.edges.filter((e) => e.src === inspectedId || e.dst === inspectedId)}
              onClose={() => setInspectedId(null)} onFocus={() => focusNode(inspectedId)}
              onPickNode={focusNode} navigate={navigate} />
          </ResponsiveInspectorOverlay>
        );
      })()}
    </div>
  );
}

function MiniMap({ nodeIds, layout, rootId, mode }: {
  nodeIds: Set<string>; layout: Map<string, Pos>; rootId: string; mode: Mode;
}) {
  const W = 120; const H = 80;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const id of nodeIds) { const p = layout.get(id); if (!p) continue; minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
  const pad = 30; const spanX = maxX - minX + pad * 2 || 1; const spanY = maxY - minY + pad * 2 || 1;
  const s = Math.min(W / spanX, H / spanY);
  const ox = (W - spanX * s) / 2 - (minX - pad) * s;
  const oy = (H - spanY * s) / 2 - (minY - pad) * s;
  return (
    <div className="absolute right-3 top-3 overflow-hidden rounded-sm border border-border-subtle bg-surface/80 backdrop-blur hidden sm:block">
      <div className="border-b border-border-subtle px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-text-muted">Minimap</div>
      <svg width={W} height={H}>
        {[...nodeIds].map((id) => {
          const p = layout.get(id); if (!p) return null;
          const node = graphNodes.get(id)!;
          return <circle key={id} cx={p.x * s + ox} cy={p.y * s + oy} r={mode === 'neighborhood' && id === rootId ? 2.5 : 1.5} fill={KIND_COLOR[node.kind]} />;
        })}
      </svg>
    </div>
  );
}

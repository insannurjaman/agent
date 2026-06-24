import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, Maximize2, RotateCcw, Plus, Minus, X, Crosshair, Globe, List, ChevronLeft } from 'lucide-react';
import {
  edges as allEdges,
  graphNodes,
  edgeTypes,
  neighborhood,
  getFindingById,
  getQuestionById,
  getExperimentBySlug,
} from '../../data';
import type { Edge, EdgeType, GraphNode, NodeKind } from '../../data';
import { ScreenHeader, MonoId } from '../common/primitives';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { EmptyState } from '../common/EmptyState';
import { SegmentedControl } from '../common/SegmentedControl';
import { IconButton } from '../common/IconButton';
import { FilterChip } from '../common/FilterChip';
import { ResponsiveInspectorOverlay } from '../responsive/ResponsiveInspectorOverlay';
import { NodeInspector } from './NodeInspector';
import { EDGE_GROUPS, EDGE_GROUP_ORDER, getGroupEdgeTypes, type EdgeGroup } from './edgeGroups';
import { cn } from '../ui/utils';
import { forceLayout, radialLayout, type Pos } from './layout';

const EDGE_COLOR: Record<EdgeType, string> = {
  origin: 'var(--brand-primary)',
  cite: 'var(--blue)',
  'report-use': 'var(--teal)',
  relates: 'var(--text-muted)',
  'resolve-partial': 'var(--amber)',
  'conflict-suspected': 'var(--error)',
  supersedes: 'var(--lineage)',
  'relates-finding': 'var(--text-muted)',
  addresses: 'var(--blue)',
  strengthens: 'var(--green)',
  resolves: 'var(--green)',
};

const KIND_COLOR: Record<NodeKind, string> = {
  finding: 'var(--brand-primary)',
  question: 'var(--amber)',
  experiment: 'var(--teal)',
};

const NODE_W = 158;
const NODE_H = 48;

type Mode = 'neighborhood' | 'global';
type ViewMode = 'graph' | 'list';

const NO_FOCUS_PLACEHOLDER = 'F-0050';

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '\u2026' : s;
}

type SortKey = 'default' | 'type' | 'label' | 'edges';

export function KnowledgeGraphScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialFocus = params.get('focus');

  // ── Consolidated state ──────────────────────────────────────────────
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
  const [activeEdgeTypes, setActiveEdgeTypes] = useState<Set<EdgeType>>(new Set(edgeTypes));
  const [activeKinds, setActiveKinds] = useState<Set<NodeKind>>(new Set(['finding', 'question', 'experiment']));
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [listSort, setListSort] = useState<SortKey>('default');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchListRef = useRef<HTMLDivElement>(null);
  const [searchIdx, setSearchIdx] = useState(0);

  // ── Subgraph from scope + focus ────────────────────────────────────
  const sub = useMemo(() => {
    if (scope === 'neighborhood' && graphNodes.has(focusId)) {
      const nb = neighborhood(focusId, depth);
      return { nodeIds: nb.nodeIds, edges: nb.edges, dist: nb.dist };
    }
    const ids = new Set<string>(graphNodes.keys());
    return { nodeIds: ids, edges: allEdges, dist: new Map<string, number>() };
  }, [scope, focusId, depth]);

  // ── Apply filters ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const nodeIds = new Set([...sub.nodeIds].filter((id) => activeKinds.has(graphNodes.get(id)!.kind)));
    const edges = sub.edges.filter(
      (e) => activeEdgeTypes.has(e.edgeType) && nodeIds.has(e.src) && nodeIds.has(e.dst),
    );
    return { nodeIds, edges };
  }, [sub, activeKinds, activeEdgeTypes]);

  // ── Active edge groups ─────────────────────────────────────────────
  const activeGroups = useMemo(() => {
    const gs = new Set<EdgeGroup>();
    for (const t of activeEdgeTypes) {
      for (const [group, cfg] of Object.entries(EDGE_GROUPS)) {
        if (cfg.types.includes(t)) gs.add(group as EdgeGroup);
      }
    }
    return gs;
  }, [activeEdgeTypes]);

  const toggleEdgeGroup = useCallback((group: EdgeGroup) => {
    const groupTypes = getGroupEdgeTypes(group);
    setActiveEdgeTypes((prev) => {
      const allActive = groupTypes.every((t) => prev.has(t));
      const next = new Set(prev);
      for (const t of groupTypes) {
        allActive ? next.delete(t) : next.add(t);
      }
      return next;
    });
  }, []);

  const allKindsActive = useMemo(() => ['finding', 'question', 'experiment'].every((k) => activeKinds.has(k as NodeKind)), [activeKinds]);

  // ── Layout ─────────────────────────────────────────────────────────
  const layout = useMemo<Map<string, Pos>>(() => {
    if (scope === 'neighborhood' && graphNodes.has(focusId)) {
      return radialLayout(focusId, filtered.nodeIds, sub.dist);
    }
    return forceLayout(filtered.nodeIds, filtered.edges);
  }, [scope, focusId, filtered, sub.dist]);

  // ── Pan / zoom ────────────────────────────────────────────────────
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
    const pad = 120;
    const w = maxX - minX + pad * 2 + NODE_W;
    const h = maxY - minY + pad * 2 + NODE_H;
    const scale = Math.min(el.clientWidth / w, el.clientHeight / h, 1.4);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setView({ x: el.clientWidth / 2 - cx * scale, y: el.clientHeight / 2 - cy * scale, scale });
  }, [filtered.nodeIds, layout]);

  useEffect(() => { fitView(); }, [fitView]);

  // ── Center on a specific node ──────────────────────────────────────
  const centerOn = useCallback((id: string) => {
    const p = layout.get(id);
    const el = wrapRef.current;
    if (!p || !el) return;
    const scale = Math.max(view.scale, 0.6);
    setView({ x: el.clientWidth / 2 - p.x * scale, y: el.clientHeight / 2 - p.y * scale, scale });
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
      const scale = Math.min(Math.max(v.scale * factor, 0.2), 2.5);
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
      const scale = Math.min(Math.max(v.scale * (dir > 0 ? 1.15 : 0.87), 0.2), 2.5);
      const k = scale / v.scale;
      return { scale, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });
  };

  // ── Adjacency highlight ────────────────────────────────────────────
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

  // ── Search ─────────────────────────────────────────────────────────
  const searchMatches = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return [...graphNodes.values()]
      .filter((n) => n.id.toLowerCase().includes(q) || n.label.toLowerCase().includes(q))
      .slice(0, 8);
  }, [search]);

  // Reset search index when matches change
  useEffect(() => { setSearchIdx(0); }, [searchMatches.length]);

  const focusNode = useCallback((id: string) => {
    if (focusId && focusId !== id) {
      setFocusStack((prev) => [...prev.slice(-9), focusId]);
    }
    setFocusId(id);
    setSelectedId(id);
    setScope('neighborhood');
    setSearch('');
    requestAnimationFrame(() => centerOn(id));
  }, [focusId, centerOn]);

  const goBackFocus = useCallback(() => {
    if (focusStack.length === 0) return;
    const prev = focusStack[focusStack.length - 1];
    setFocusStack((prev) => prev.slice(0, -1));
    setFocusId(prev);
    setSelectedId(prev);
    requestAnimationFrame(() => centerOn(prev));
  }, [focusStack, centerOn]);

  const clearFocus = useCallback(() => {
    setFocusId(NO_FOCUS_PLACEHOLDER);
    setFocusStack([]);
    setScope('neighborhood');
    setSelectedId(null);
  }, []);

  const selectedNode = selectedId ? graphNodes.get(selectedId) : undefined;
  const focusNodeData = graphNodes.get(focusId);

  // Node kind counts
  const kindCounts = useMemo(() => {
    const counts: Record<string, number> = { finding: 0, question: 0, experiment: 0 };
    for (const id of filtered.nodeIds) {
      const kind = graphNodes.get(id)?.kind;
      if (kind) counts[kind]++;
    }
    return counts;
  }, [filtered.nodeIds]);

  // ── List view sorting ─────────────────────────────────────────────
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

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <ScreenHeader
          title="Knowledge Graph"
          subtitle={`${allEdges.length} edges \u00B7 Finding, Open Question, Experiment nodes`}
        />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface px-6 py-2.5">
          {/* Search */}
          <div className="relative" ref={searchListRef}>
            <div className="flex h-11 w-56 items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2.5 focus-within:border-brand-border lg:w-64">
              <Search className="size-3.5 shrink-0 text-text-muted" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (!searchMatches.length) return;
                  if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIdx((i) => Math.min(i + 1, searchMatches.length - 1)); }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setSearchIdx((i) => Math.max(i - 1, 0)); }
                  if (e.key === 'Enter') { e.preventDefault(); focusNode(searchMatches[searchIdx].id); }
                  if (e.key === 'Escape') { setSearch(''); searchRef.current?.blur(); }
                }}
                placeholder="Search F-/Q-/slug…"
                aria-label="Search graph node"
                className="w-full bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="flex size-6 items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors" aria-label="Clear search">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            {searchMatches.length > 0 && (
              <div role="listbox" aria-label="Graph nodes" className="absolute z-30 mt-1 w-72 rounded-sm border border-border-strong bg-popover py-1 shadow-xl">
                {searchMatches.map((n, i) => (
                  <button
                    key={n.id}
                    type="button"
                    role="option"
                    aria-selected={selectedId === n.id}
                    onClick={() => focusNode(n.id)}
                    className={cn('flex w-full items-center gap-2 px-2.5 py-2 text-left min-h-11', i === searchIdx ? 'bg-surface-2' : 'hover:bg-surface-2')}
                  >
                    <span className="size-2 shrink-0 rounded-full" style={{ background: KIND_COLOR[n.kind] }} />
                    <MonoId className="shrink-0">{n.id.replace('experiments/', '')}</MonoId>
                    <span className="truncate text-[12px] text-text-muted">{n.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mode */}
          <SegmentedControl
            segments={[
              { id: 'neighborhood', label: 'Neighborhood', icon: <Crosshair className="size-3.5" /> },
              { id: 'global', label: 'Global', icon: <Globe className="size-3.5" /> },
            ]}
            value={scope}
            onChange={(m) => {
              setScope(m as Mode);
              if (m === 'global') setFocusStack([]);
            }}
            className="shrink-0"
          />

          {/* Depth (neighborhood only) */}
          {scope === 'neighborhood' && (
            <SegmentedControl
              segments={[
                { id: '1', label: '1-hop' },
                { id: '2', label: '2-hop' },
                { id: '3', label: '3-hop' },
              ]}
              value={String(depth)}
              onChange={(d) => setDepth(Number(d))}
              className="shrink-0"
            />
          )}

          {/* View + zoom */}
          <div className="ml-auto flex items-center gap-1 shrink-0">
            <SegmentedControl
              segments={[
                { id: 'graph', label: 'Graph', icon: <Crosshair className="size-3.5" /> },
                { id: 'list', label: 'List', icon: <List className="size-3.5" /> },
              ]}
              value={viewMode}
              onChange={(v) => setViewMode(v as 'graph' | 'list')}
            />
            {viewMode === 'graph' && (
              <>
                <IconButton icon={Plus} label="Zoom in" onClick={() => zoom(1)} />
                <IconButton icon={Minus} label="Zoom out" onClick={() => zoom(-1)} />
                <IconButton icon={Maximize2} label="Fit to view" onClick={fitView} />
                <IconButton icon={RotateCcw} label="Reset filters" onClick={() => {
                  setActiveEdgeTypes(new Set(edgeTypes));
                  setActiveKinds(new Set(['finding', 'question', 'experiment']));
                  fitView();
                }} />
              </>
            )}
          </div>
        </div>

        {/* Focus bar (neighborhood only) */}
        {scope === 'neighborhood' && focusNodeData && (
          <div className="flex items-center gap-2 border-b border-border-subtle bg-surface/80 px-6 py-2">
            {focusStack.length > 0 && (
              <button type="button" onClick={goBackFocus} className="flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-[11px] text-text-muted hover:text-text transition-colors" aria-label="Back to previous focus">
                <ChevronLeft className="size-3.5" /> Back
              </button>
            )}
            <span className="size-2 rounded-full" style={{ background: KIND_COLOR[focusNodeData.kind] }} />
            <span className="font-mono text-[12px] font-medium text-text">
              {focusNodeData.id.replace('experiments/', '')}
            </span>
            <span className="truncate text-[12px] text-text-secondary max-w-[300px]">{focusNodeData.label}</span>
            <span className="font-mono text-[11px] text-text-muted tabular-nums">
              {filtered.nodeIds.size} nodes · {filtered.edges.length} edges
            </span>
            <button type="button" onClick={clearFocus} className="ml-auto font-mono text-[11px] text-text-muted hover:text-text transition-colors" aria-label="Clear focus">
              <X className="size-3.5 inline" /> Clear
            </button>
          </div>
        )}

        {/* Filters bar */}
        <div className="border-b border-border-subtle bg-surface px-6 py-2">
          {/* Desktop filters */}
          <div className="flex-col gap-2 hidden md:flex">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">Nodes</span>
              {nodeKinds.map((k) => (
                <FilterChip key={k} selected={activeKinds.has(k)} color={KIND_COLOR[k]} count={kindCounts[k]}
                  onToggle={() => setActiveKinds((prev) => {
                    const n = new Set(prev);
                    n.has(k) ? n.delete(k) : n.add(k);
                    return n;
                  })}
                >{k}</FilterChip>
              ))}
              <button type="button" onClick={() => setActiveKinds(allKindsActive ? new Set() : new Set(['finding', 'question', 'experiment']))}
                className="rounded-sm px-2 py-1 font-mono text-[10px] text-text-muted hover:text-text transition-colors">
                {allKindsActive ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">Edges</span>
              {EDGE_GROUP_ORDER.map((group) => {
                const groupTypes = getGroupEdgeTypes(group);
                const groupAllActive = groupTypes.every((t) => activeEdgeTypes.has(t));
                const groupSomeActive = groupTypes.some((t) => activeEdgeTypes.has(t));
                const groupCount = filtered.edges.filter((e) => groupTypes.includes(e.edgeType)).length;
                return (
                  <div key={group} className="flex items-center gap-0.5">
                    <FilterChip
                      selected={groupAllActive}
                      color="var(--text-muted)"
                      count={groupCount}
                      onToggle={() => toggleEdgeGroup(group)}
                    >{EDGE_GROUPS[group].label}</FilterChip>
                    <div className="flex flex-wrap items-center gap-0.5 ml-0.5">
                      {groupTypes.map((t) => (
                        <FilterChip key={t} selected={activeEdgeTypes.has(t)} color={EDGE_COLOR[t]}
                          onToggle={() => setActiveEdgeTypes((prev) => {
                            const n = new Set(prev);
                            n.has(t) ? n.delete(t) : n.add(t);
                            return n;
                          })}
                          className="text-[10px] px-1.5 min-h-8"
                        >{t}</FilterChip>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-text-muted">
              <span>Node types · {activeKinds.size}/3 active</span>
              <span className="w-px h-3 bg-border-strong" />
              <span>Edge types · {activeEdgeTypes.size}/{edgeTypes.length} active</span>
            </div>
          </div>

          {/* Mobile compact filter button */}
          <div className="flex md:hidden items-center gap-2">
            <button type="button" onClick={() => setFiltersExpanded((v) => !v)}
              className="flex h-11 items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-3 font-mono text-[11px] text-text-muted hover:text-text transition-colors">
              Filters · {activeKinds.size}/3 node · {activeEdgeTypes.size}/{edgeTypes.length} edge
              <span className={cn('transition-transform', filtersExpanded && 'rotate-180')}><ChevronLeft className="size-3 rotate-90" /></span>
            </button>
            {!filtersExpanded && viewMode === 'graph' && scope === 'global' && filtered.edges.length > 120 && (
              <span className="font-mono text-[10px] text-amber">Dense graph — narrow filters</span>
            )}
          </div>

          {/* Mobile expanded filters */}
          {filtersExpanded && (
            <div className="flex flex-col gap-2 mt-2 md:hidden pb-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Nodes</span>
                {nodeKinds.map((k) => (
                  <FilterChip key={k} selected={activeKinds.has(k)} color={KIND_COLOR[k]} count={kindCounts[k]}
                    onToggle={() => setActiveKinds((prev) => {
                      const n = new Set(prev);
                      n.has(k) ? n.delete(k) : n.add(k);
                      return n;
                    })}
                    className="text-[10px] px-1.5 min-h-8"
                  >{k}</FilterChip>
                ))}
                <button type="button" onClick={() => setActiveKinds(allKindsActive ? new Set() : new Set(['finding', 'question', 'experiment']))}
                  className="rounded-sm px-2 py-1 font-mono text-[10px] text-text-muted hover:text-text">
                  {allKindsActive ? 'Clear' : 'All'}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Edges</span>
                {EDGE_GROUP_ORDER.map((group) => {
                  const groupTypes = getGroupEdgeTypes(group);
                  const groupAllActive = groupTypes.every((t) => activeEdgeTypes.has(t));
                  return (
                    <FilterChip key={group} selected={groupAllActive} color="var(--text-muted)"
                      onToggle={() => toggleEdgeGroup(group)}
                      className="text-[10px] px-1.5 min-h-8"
                    >{EDGE_GROUPS[group].label}</FilterChip>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {viewMode === 'graph' ? (
          <div
            ref={wrapRef}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className="relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden bg-background active:cursor-grabbing [background-image:radial-gradient(circle,#171c20_1px,transparent_1px)] [background-size:24px_24px]"
            aria-label="Graph canvas — drag to pan, scroll to zoom, double-click a node to focus"
          >
            {filtered.nodeIds.size === 0 ? (
              <EmptyState title="No nodes match current filters" hint="Search for a node or adjust filters to display the graph." />
            ) : (
              <svg className="absolute inset-0 size-full" role="img" aria-label="Knowledge graph visualization">
                <defs>
                  {edgeTypes.map((t) => (
                    <marker key={t} id={`arrow-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M0,0 L10,5 L0,10 z" fill={EDGE_COLOR[t]} />
                    </marker>
                  ))}
                </defs>
                <g transform={`translate(${view.x},${view.y}) scale(${view.scale})`}>
                  {/* ── Edges ── */}
                  {filtered.edges.map((e, i) => {
                    const a = layout.get(e.src);
                    const b = layout.get(e.dst);
                    if (!a || !b) return null;
                    const dim = adjacent && !(adjacent.has(e.src) && adjacent.has(e.dst));
                    const emphatic = e.edgeType === 'supersedes' || e.edgeType === 'conflict-suspected';
                    // At far zoom, only show emphatic edges
                    if (zoomLevel < 0.4 && !emphatic) return null;
                    return (
                      <g key={i} opacity={dim ? 0.12 : zoomLevel < 0.4 ? 0.4 : 1}>
                        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                          stroke={EDGE_COLOR[e.edgeType]}
                          strokeWidth={emphatic ? 2 : zoomLevel < 0.4 ? 0.8 : 1.2}
                          strokeDasharray={e.edgeType === 'conflict-suspected' ? '5 4' : undefined}
                          markerEnd={zoomLevel >= 0.4 ? `url(#arrow-${e.edgeType})` : undefined}
                        />
                        {zoomLevel > 0.7 && (
                          <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 3} textAnchor="middle" fontSize="9"
                            fontFamily="JetBrains Mono, monospace" fill={EDGE_COLOR[e.edgeType]} opacity={0.85}>
                            {e.edgeType}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* ── Nodes ── */}
                  {[...filtered.nodeIds].map((id) => {
                    const node = graphNodes.get(id)!;
                    const p = layout.get(id);
                    if (!p) return null;
                    const dim = adjacent && !adjacent.has(id);
                    const isSel = selectedId === id;
                    const isRoot = scope === 'neighborhood' && id === focusId;
                    const color = KIND_COLOR[node.kind];

                    // At far zoom, show simplified dots
                    if (zoomLevel < 0.35) {
                      return (
                        <g key={id} transform={`translate(${p.x},${p.y})`} opacity={dim ? 0.2 : 0.7}>
                          <circle r={isRoot ? 6 : 4} fill={color} stroke={isSel ? 'var(--brand-primary)' : 'none'} strokeWidth={isSel ? 2 : 0} />
                        </g>
                      );
                    }

                    return (
                      <g key={id} transform={`translate(${p.x - NODE_W / 2},${p.y - NODE_H / 2})`}
                        opacity={dim ? 0.25 : 1} className="cursor-pointer" role="button" tabIndex={0}
                        aria-label={`${node.kind} ${id.replace('experiments/', '')}: ${node.label}`}
                        aria-selected={isSel}
                        onClick={(e) => { e.stopPropagation(); setSelectedId(id); }}
                        onDoubleClick={(e) => { e.stopPropagation(); focusNode(id); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(id); }
                          if (e.key === 'Enter') { focusNode(id); }
                        }}
                      >
                        <rect width={NODE_W} height={NODE_H} rx={3} fill={isSel ? 'var(--surface-2)' : 'var(--surface-2)'}
                          stroke={isSel || isRoot ? color : 'var(--border-subtle)'}
                          strokeWidth={isSel || isRoot ? 2 : 1}
                        />
                        {isSel && <rect width={3} height={NODE_H} rx={1.5} fill={color} className="animate-pulse" />}
                        {!isSel && <rect width={3} height={NODE_H} rx={1.5} fill={color} />}
                        <text x={12} y={18} fontSize="11" fontFamily="JetBrains Mono, monospace" fill={color}>
                          {id.replace('experiments/', '')}
                        </text>
                        {/* Only show label text at medium zoom+ */}
                        {zoomLevel > 0.5 && (
                          <text x={12} y={32} fontSize="10" fill="var(--text)">{truncate(node.label, zoomLevel > 0.8 ? 22 : 14)}</text>
                        )}
                        {zoomLevel > 0.6 && (
                          <text x={12} y={43} fontSize="9" fontFamily="JetBrains Mono, monospace" fill="var(--text-muted)">
                            {node.sub}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            )}

            {/* Minimap */}
            {filtered.nodeIds.size > 0 && (
              <MiniMap nodeIds={filtered.nodeIds} layout={layout} rootId={focusId} mode={scope} />
            )}

            {/* Dense graph hint */}
            {scope === 'global' && filtered.edges.length > 120 && (
              <div className="absolute left-1/2 top-3 z-20 hidden md:flex -translate-x-1/2 items-center gap-2 rounded-sm border border-amber/40 bg-amber/10 px-3 py-1.5 backdrop-blur">
                <span className="size-1.5 rounded-full bg-amber" />
                <span className="font-mono text-[11px] text-amber">
                  {filtered.edges.length} edges · {filtered.nodeIds.size} nodes — narrow by edge type or switch to Neighborhood focus.
                </span>
              </div>
            )}

            {/* Instructions */}
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-sm border border-border-subtle bg-surface/80 px-2.5 py-1.5 font-mono text-[10px] text-text-muted backdrop-blur">
              drag to pan · scroll to zoom · double-click to focus
            </div>
          </div>
        ) : (
          /* ── List view ── */
          <div className="min-h-0 flex-1 flex flex-col">
            {/* List toolbar */}
            <div className="flex items-center gap-2 border-b border-border-subtle bg-surface/80 px-4 py-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Sort</span>
              {(['default', 'type', 'label', 'edges'] as SortKey[]).map((s) => (
                <button key={s} type="button" onClick={() => setListSort(s)}
                  className={cn('rounded-sm px-2 py-1 font-mono text-[11px] transition-colors', listSort === s ? 'bg-brand-muted text-brand' : 'text-text-muted hover:text-text')}>
                  {s === 'default' ? 'ID' : s === 'type' ? 'Type' : s === 'label' ? 'Label' : 'Edges'}
                </button>
              ))}
              <span className="ml-auto font-mono text-[10px] text-text-muted tabular-nums">{filtered.nodeIds.size} nodes</span>
            </div>

            {/* List items */}
            <div className="min-h-0 flex-1 overflow-auto" role="region" aria-label="Relationship list">
              {filtered.nodeIds.size === 0 ? (
                <EmptyState title="No nodes match current filters" hint="Adjust node or edge type filters to see relationships." />
              ) : (
                <div className="divide-y divide-border-subtle">
                  {sortedList.map((id) => {
                    const node = graphNodes.get(id)!;
                    const isSel = selectedId === id;
                    const incident = filtered.edges.filter((e) => e.src === id || e.dst === id);
                    const color = KIND_COLOR[node.kind];
                    // Highlight search match
                    let labelParts: { text: string; highlight: boolean }[] = [{ text: node.label, highlight: false }];
                    if (search.trim()) {
                      const idx = node.label.toLowerCase().indexOf(search.toLowerCase());
                      if (idx >= 0) {
                        labelParts = [
                          { text: node.label.slice(0, idx), highlight: false },
                          { text: node.label.slice(idx, idx + search.length), highlight: true },
                          { text: node.label.slice(idx + search.length), highlight: false },
                        ];
                      }
                    }
                    return (
                      <button key={id} type="button" onClick={() => {
                        setSelectedId(id);
                        if (scope === 'neighborhood') { /* keep as-is */ }
                      }}
                        className={cn('flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2', isSel && 'bg-surface-2')}
                        aria-current={isSel ? 'true' : undefined}
                      >
                        <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: color }} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <MonoId className={node.kind === 'experiment' ? 'text-info' : 'text-brand'}>{id.replace('experiments/', '')}</MonoId>
                            <span className="font-mono text-[10px] uppercase text-text-muted">{node.kind}</span>
                            <span className="font-mono text-[10px] text-text-muted tabular-nums ml-auto">{incident.length} edge{incident.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="mt-0.5 text-[13px] text-text-secondary">
                            {labelParts.map((part, i) => part.highlight
                              ? <mark key={i} className="bg-brand-muted text-text rounded-sm px-0.5">{part.text}</mark>
                              : <span key={i}>{part.text}</span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {incident.slice(0, 4).map((ed, i) => {
                              const other = ed.src === id ? ed.dst : ed.src;
                              return (
                                <span key={i} className="rounded-sm border border-border-subtle bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                                  {ed.edgeType} → {other.replace('experiments/', '')}
                                </span>
                              );
                            })}
                            {incident.length > 4 && <span className="font-mono text-[10px] text-text-muted">+{incident.length - 4} more</span>}
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

      {/* Node inspector */}
      {selectedNode && (
        <ResponsiveInspectorOverlay isOpen={!!selectedNode} onDismiss={() => setSelectedId(null)}>
          <NodeInspector
            node={selectedNode}
            incident={filtered.edges.filter((e) => e.src === selectedNode.id || e.dst === selectedNode.id)}
            onClose={() => setSelectedId(null)}
            onFocus={() => focusNode(selectedNode.id)}
            onPickNode={focusNode}
            navigate={navigate}
          />
        </ResponsiveInspectorOverlay>
      )}
    </div>
  );
}

function MiniMap({
  nodeIds,
  layout,
  rootId,
  mode,
}: {
  nodeIds: Set<string>;
  layout: Map<string, Pos>;
  rootId: string;
  mode: Mode;
}) {
  const W = 150;
  const H = 110;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const id of nodeIds) {
    const p = layout.get(id);
    if (!p) continue;
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  const pad = 30;
  const spanX = maxX - minX + pad * 2 || 1;
  const spanY = maxY - minY + pad * 2 || 1;
  const s = Math.min(W / spanX, H / spanY);
  const ox = (W - spanX * s) / 2 - (minX - pad) * s;
  const oy = (H - spanY * s) / 2 - (minY - pad) * s;
  return (
    <div className="absolute right-3 top-3 overflow-hidden rounded-sm border border-border-subtle bg-surface/80 backdrop-blur">
      <div className="border-b border-border-subtle px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-text-muted">Minimap</div>
      <svg width={W} height={H}>
        {[...nodeIds].map((id) => {
          const p = layout.get(id);
          if (!p) return null;
          const node = graphNodes.get(id)!;
          const isRoot = mode === 'neighborhood' && id === rootId;
          return <circle key={id} cx={p.x * s + ox} cy={p.y * s + oy} r={isRoot ? 3 : 1.8} fill={KIND_COLOR[node.kind]} />;
        })}
      </svg>
    </div>
  );
}

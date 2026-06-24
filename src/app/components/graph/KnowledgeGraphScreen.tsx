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

const NO_FOCUS_PLACEHOLDER = 'F-0050';

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '\u2026' : s;
}

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
  const [activeKinds, setActiveKinds] = useState<Set<NodeKind>>(new Set(['finding', 'question', 'experiment']));
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

  const allKindsActive = useMemo(() => ['finding', 'question', 'experiment'].every((k) => activeKinds.has(k as NodeKind)), [activeKinds]);

  // ── Layout ────────────────────────────────────────────────────────
  const layout = useMemo<Map<string, Pos>>(() => {
    if (scope === 'neighborhood' && graphNodes.has(focusId)) return radialLayout(focusId, filtered.nodeIds, sub.dist);
    return forceLayout(filtered.nodeIds, filtered.edges);
  }, [scope, focusId, filtered, sub.dist]);

  // ── Camera ────────────────────────────────────────────────────────
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

  const centerOn = useCallback((id: string) => {
    const p = layout.get(id);
    const el = wrapRef.current;
    if (!p || !el) return;
    const newScale = Math.max(view.scale, 0.6);
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

  const inspectNode = useCallback((id: string) => {
    setSelectedId(id);
    setInspectedId(id);
  }, []);

  const focusNode = useCallback((id: string) => {
    if (focusId && focusId !== id) setFocusStack((prev) => [...prev.slice(-9), focusId]);
    setFocusId(id);
    setScope('neighborhood');
    inspectNode(id);
    setSearch('');
    requestAnimationFrame(() => centerOn(id));
  }, [focusId, centerOn, inspectNode]);

  const goBackFocus = useCallback(() => {
    if (focusStack.length === 0) return;
    const prev = focusStack[focusStack.length - 1];
    setFocusStack((prev) => prev.slice(0, -1));
    setFocusId(prev);
    inspectNode(prev);
    requestAnimationFrame(() => centerOn(prev));
  }, [focusStack, centerOn, inspectNode]);

  const clearFocus = useCallback(() => {
    setFocusId(NO_FOCUS_PLACEHOLDER);
    setFocusStack([]);
    setScope('neighborhood');
    setSelectedId(null);
    setInspectedId(null);
  }, []);

  // ── Derived ──────────────────────────────────────────────────────
  const selectedNode = selectedId ? graphNodes.get(selectedId) : undefined;
  const focusNodeData = graphNodes.get(focusId);
  const activeFilterCount = activeEdgeTypes.size + (3 - [...new Set(['finding', 'question', 'experiment'])].filter(k => !activeKinds.has(k as NodeKind)).length);

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

  // ── Filter panel handlers ────────────────────────────────────────
  const closeFilterPanel = useCallback(() => {
    setFilterPanelOpen(false);
    requestAnimationFrame(() => filterTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!filterPanelOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeFilterPanel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [filterPanelOpen, closeFilterPanel]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact inline header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-2 bg-surface min-h-10">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-medium text-text">Knowledge Graph</h1>
            <span className="font-mono text-[10px] text-text-muted">{allEdges.length} edges · {graphNodes.size} nodes</span>
          </div>
        </div>

        {/* Compact toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface px-4 py-1.5 min-h-10">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-[320px]">
            <div className="flex h-9 items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2 focus-within:border-brand-border transition-colors">
              <Search className="size-3 shrink-0 text-text-muted" />
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
                placeholder="Search nodes…"
                aria-label="Search graph node"
                className="w-full bg-transparent text-[12px] text-text outline-none placeholder:text-text-muted"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="flex size-5 items-center justify-center rounded-sm text-text-muted hover:text-text" aria-label="Clear search">
                  <X className="size-3" />
                </button>
              )}
            </div>
            {searchMatches.length > 0 && (
              <div role="listbox" aria-label="Graph nodes" className="absolute z-30 mt-1 w-72 rounded-sm border border-border-strong bg-popover py-1 shadow-xl">
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
            className="h-9 rounded-sm border border-border-subtle bg-surface-2 px-2 font-mono text-[11px] text-text outline-none cursor-pointer"
            aria-label="Graph scope">
            <option value="neighborhood">Neighborhood</option>
            <option value="global">Global</option>
          </select>

          {/* Depth (neighborhood only) */}
          {scope === 'neighborhood' && (
            <select value={String(depth)} onChange={(e) => setDepth(Number(e.target.value))}
              className="h-9 rounded-sm border border-border-subtle bg-surface-2 px-2 font-mono text-[11px] text-text outline-none cursor-pointer"
              aria-label="Hop depth">
              <option value="1">1-hop</option>
              <option value="2">2-hop</option>
              <option value="3">3-hop</option>
            </select>
          )}

          <div className="flex items-center gap-1 ml-auto shrink-0">
            {/* View */}
            <SegmentedControl compact
              segments={[
                { id: 'graph', label: 'Graph', icon: <Crosshair className="size-3" /> },
                { id: 'list', label: 'List', icon: <List className="size-3" /> },
              ]}
              value={viewMode}
              onChange={(v) => setViewMode(v as 'graph' | 'list')}
              className="shrink-0"
            />

            {/* Filters */}
            <div className="relative">
              <button ref={filterTriggerRef} type="button" onClick={() => setFilterPanelOpen((v) => !v)}
                aria-expanded={filterPanelOpen} aria-haspopup="true" aria-controls="filter-panel"
                className={cn(
                  'flex h-9 items-center gap-1.5 rounded-sm border px-2.5 font-mono text-[11px] transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-brand-ring',
                  filterPanelOpen || activeFilterCount > 3 ? 'border-brand-border bg-brand-muted text-brand' : 'border-border-subtle bg-surface-2 text-text-muted hover:text-text-secondary',
                )}>
                <FilterIcon className="size-3" />
                Filters
                {activeFilterCount > 3 && <span className="tabular-nums">· {activeFilterCount}</span>}
              </button>
              {filterPanelOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={closeFilterPanel} aria-hidden="true" />
                  <div id="filter-panel" className="absolute right-0 top-full z-20 mt-1 w-[320px] rounded-sm border border-border-strong bg-popover shadow-xl max-h-[70vh] overflow-auto">
                    <FilterPanel
                      activeKinds={activeKinds}
                      activeEdgeTypes={activeEdgeTypes}
                      kindCounts={kindCounts}
                      onToggleKind={(k) => setActiveKinds((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; })}
                      onToggleEdgeType={(t) => setActiveEdgeTypes((prev) => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; })}
                      onToggleGroup={toggleEdgeGroup}
                      onSelectAllKinds={() => setActiveKinds(new Set(['finding', 'question', 'experiment']))}
                      onClearAllKinds={() => setActiveKinds(new Set())}
                      onClose={closeFilterPanel}
                      nodeKinds={nodeKinds}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Graph-only controls */}
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

        {/* Focus context bar (neighborhood only) */}
        {scope === 'neighborhood' && focusNodeData && (
          <FocusContextBar
            focusId={focusId}
            focusNode={focusNodeData}
            hopDepth={depth}
            nodeCount={filtered.nodeIds.size}
            edgeCount={filtered.edges.length}
            canGoBack={focusStack.length > 0}
            onChangeDepth={setDepth}
            onBack={goBackFocus}
            onClear={clearFocus}
          />
        )}

        {/* Content */}
        {viewMode === 'graph' ? (
          <div ref={wrapRef}
            onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
            className="relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden bg-background active:cursor-grabbing [background-image:radial-gradient(circle,#171c20_1px,transparent_1px)] [background-size:24px_24px]"
            aria-label="Graph canvas — drag to pan, scroll to zoom, double-click a node to focus"
          >
            {filtered.nodeIds.size === 0 ? (
              <EmptyState title="No nodes match current filters" hint="Search for a node or adjust filters to display the graph." />
            ) : (
              <svg className="absolute inset-0 size-full" role="img" aria-label="Knowledge graph visualization">
                <defs>
                  {edgeTypes.map((t) => (
                    <marker key={t} id={`arrow-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M0,0 L10,5 L0,10 z" fill={EDGE_COLOR[t]} />
                    </marker>
                  ))}
                </defs>
                <g transform={`translate(${view.x},${view.y}) scale(${view.scale})`}>
                  {/* Edges */}
                  {filtered.edges.map((e, i) => {
                    const a = layout.get(e.src);
                    const b = layout.get(e.dst);
                    if (!a || !b) return null;
                    const dim = adjacent && !(adjacent.has(e.src) && adjacent.has(e.dst));
                    const emphatic = e.edgeType === 'supersedes' || e.edgeType === 'conflict-suspected';
                    const isSelectedPath = adjacent && adjacent.has(e.src) && adjacent.has(e.dst) && selectedId && (e.src === selectedId || e.dst === selectedId);
                    if (zoomLevel < 0.4 && !emphatic) return null;
                    const opacity = dim ? 0.08 : isSelectedPath ? 1 : zoomLevel < 0.4 ? 0.3 : 0.55;
                    const strokeW = isSelectedPath ? 2.5 : emphatic ? 1.8 : zoomLevel < 0.4 ? 0.6 : 1;
                    return (
                      <g key={i} opacity={opacity}>
                        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                          stroke={EDGE_COLOR[e.edgeType]}
                          strokeWidth={strokeW}
                          strokeDasharray={e.edgeType === 'conflict-suspected' ? '5 4' : undefined}
                          markerEnd={zoomLevel >= 0.4 ? `url(#arrow-${e.edgeType})` : undefined}
                        />
                        {zoomLevel > 0.7 && isSelectedPath && (
                          <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 3} textAnchor="middle" fontSize="8"
                            fontFamily="JetBrains Mono, monospace" fill={EDGE_COLOR[e.edgeType]} opacity={0.9}>
                            {e.edgeType}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {[...filtered.nodeIds].map((id) => {
                    const node = graphNodes.get(id)!;
                    const p = layout.get(id);
                    if (!p) return null;
                    const dim = adjacent && !adjacent.has(id);
                    const isFocused = scope === 'neighborhood' && id === focusId;
                    const isSelected = selectedId === id;
                    const isInspected = inspectedId === id;
                    const color = KIND_COLOR[node.kind];
                    const hopDist = sub.dist.get(id) ?? 0;
                    const nodeOpacity = isSelected ? 1 : isFocused ? 1 : dim ? 0.15 : hopDist === 1 ? 0.95 : hopDist === 2 ? 0.65 : hopDist >= 3 ? 0.4 : dim ? 0.15 : 0.85;

                    if (zoomLevel < 0.35) {
                      return (
                        <g key={id} transform={`translate(${p.x},${p.y})`} opacity={nodeOpacity}>
                          <circle r={isFocused ? 5 : 3.5} fill={color} stroke={isSelected ? 'var(--brand-primary)' : 'none'} strokeWidth={isSelected ? 1.5 : 0} />
                        </g>
                      );
                    }

                    return (
                      <g key={id} transform={`translate(${p.x - NODE_W / 2},${p.y - NODE_H / 2})`}
                        opacity={nodeOpacity} className="cursor-pointer" role="button" tabIndex={0}
                        aria-label={`${node.kind} ${id.replace('experiments/', '')}: ${node.label}`}
                        aria-selected={isSelected}
                        onClick={(e) => { e.stopPropagation(); inspectNode(id); }}
                        onDoubleClick={(e) => { e.stopPropagation(); focusNode(id); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inspectNode(id); }
                          if (e.key === 'Enter') focusNode(id);
                        }}
                      >
                        <rect width={NODE_W} height={NODE_H} rx={3} fill="var(--surface-2)"
                          stroke={isFocused ? color : isSelected ? color : 'var(--border-subtle)'}
                          strokeWidth={isFocused ? 2.5 : isSelected ? 2 : 0.8}
                        />
                        <rect width={3} height={NODE_H} rx={1.5} fill={color} />
                        <text x={12} y={18} fontSize="10" fontFamily="JetBrains Mono, monospace" fill={color}>
                          {id.replace('experiments/', '')}
                        </text>
                        {zoomLevel > 0.5 && (
                          <text x={12} y={32} fontSize="9" fill="var(--text)">
                            {truncate(node.label, zoomLevel > 0.8 ? 22 : 12)}
                          </text>
                        )}
                        {zoomLevel > 0.6 && hopDist <= 1 && (
                          <text x={12} y={42} fontSize="8" fontFamily="JetBrains Mono, monospace" fill="var(--text-muted)">
                            {node.sub}
                          </text>
                        )}
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
            </div>

            {/* Minimap */}
            {filtered.nodeIds.size > 0 && (
              <MiniMap nodeIds={filtered.nodeIds} layout={layout} rootId={focusId} mode={scope} />
            )}

            {/* Dense graph hint */}
            {scope === 'global' && filtered.edges.length > 120 && (
              <div className="absolute left-1/2 top-3 z-20 hidden md:flex -translate-x-1/2 items-center gap-2 rounded-sm border border-amber/40 bg-amber/10 px-3 py-1 backdrop-blur">
                <span className="size-1.5 rounded-full bg-amber" />
                <span className="font-mono text-[10px] text-amber">{filtered.edges.length} edges — narrow by scope or edge type</span>
              </div>
            )}

            {/* Dismissible instructions */}
            {!instructionsDismissed && (
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-sm border border-border-subtle bg-surface/80 px-2.5 py-1.5 backdrop-blur font-mono text-[10px] text-text-muted">
                drag to pan · scroll to zoom · double-click to focus
                <button type="button" onClick={dismissInstructions} className="flex size-5 items-center justify-center rounded-sm text-text-muted hover:text-text" aria-label="Dismiss instructions">
                  <X className="size-3" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* List view */
          <div className="min-h-0 flex-1 flex flex-col">
            {/* List toolbar */}
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
                            {labelParts.map((part, i) => part.highlight
                              ? <mark key={i} className="bg-brand-muted text-text rounded-sm px-0.5">{part.text}</mark>
                              : <span key={i}>{part.text}</span>)}
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
            <NodeInspector
              node={node}
              incident={filtered.edges.filter((e) => e.src === inspectedId || e.dst === inspectedId)}
              onClose={() => setInspectedId(null)}
              onFocus={() => focusNode(inspectedId)}
              onPickNode={focusNode}
              navigate={navigate}
            />
          </ResponsiveInspectorOverlay>
        );
      })()}
    </div>
  );
}

function MiniMap({ nodeIds, layout, rootId, mode }: {
  nodeIds: Set<string>; layout: Map<string, Pos>; rootId: string; mode: Mode;
}) {
  if (typeof window !== 'undefined' && window.innerWidth < 768) return null;
  const W = 130;
  const H = 90;
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
    <div className="absolute right-3 top-3 overflow-hidden rounded-sm border border-border-subtle bg-surface/80 backdrop-blur hidden md:block">
      <div className="border-b border-border-subtle px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-text-muted">Minimap</div>
      <svg width={W} height={H}>
        {[...nodeIds].map((id) => {
          const p = layout.get(id);
          if (!p) return null;
          const node = graphNodes.get(id)!;
          return <circle key={id} cx={p.x * s + ox} cy={p.y * s + oy} r={mode === 'neighborhood' && id === rootId ? 2.5 : 1.5} fill={KIND_COLOR[node.kind]} />;
        })}
      </svg>
    </div>
  );
}

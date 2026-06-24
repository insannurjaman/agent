import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, Maximize2, RotateCcw, Plus, Minus, X, Crosshair, Globe, List } from 'lucide-react';
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
import { EmptyState } from '../common/EmptyState';
import { AskClaudeButton, NavActionButton } from '../common/AskClaudeActions';
import { ResponsiveInspectorOverlay } from '../responsive/ResponsiveInspectorOverlay';
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

export function KnowledgeGraphScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>('neighborhood');
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [depth, setDepth] = useState(2);
  const [rootId, setRootId] = useState<string>(params.get('focus') ?? 'F-0050');
  const [nodeSearch, setNodeSearch] = useState('');
  const [activeEdgeTypes, setActiveEdgeTypes] = useState<Set<EdgeType>>(new Set(edgeTypes));
  const [activeKinds, setActiveKinds] = useState<Set<NodeKind>>(
    new Set(['finding', 'question', 'experiment']),
  );
  const [selected, setSelected] = useState<string | null>(rootId);

  // ── Build the working subgraph ──
  const sub = useMemo(() => {
    if (mode === 'neighborhood' && graphNodes.has(rootId)) {
      const nb = neighborhood(rootId, depth);
      return { nodeIds: nb.nodeIds, edges: nb.edges, dist: nb.dist };
    }
    const ids = new Set<string>(graphNodes.keys());
    return { nodeIds: ids, edges: allEdges, dist: new Map<string, number>() };
  }, [mode, rootId, depth]);

  // Apply node/edge-type filters.
  const filtered = useMemo(() => {
    const nodeIds = new Set(
      [...sub.nodeIds].filter((id) => activeKinds.has(graphNodes.get(id)!.kind)),
    );
    const edges = sub.edges.filter(
      (e) => activeEdgeTypes.has(e.edgeType) && nodeIds.has(e.src) && nodeIds.has(e.dst),
    );
    return { nodeIds, edges };
  }, [sub, activeKinds, activeEdgeTypes]);

  // ── Layout ──
  const layout = useMemo<Map<string, Pos>>(() => {
    if (mode === 'neighborhood' && graphNodes.has(rootId)) {
      return radialLayout(rootId, filtered.nodeIds, sub.dist);
    }
    return forceLayout(filtered.nodeIds, filtered.edges);
  }, [mode, rootId, filtered, sub.dist]);

  // ── Pan / zoom ──
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const fitView = useCallback(() => {
    const el = wrapRef.current;
    if (!el || filtered.nodeIds.size === 0) return;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const id of filtered.nodeIds) {
      const p = layout.get(id);
      if (!p) continue;
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    const pad = 120;
    const w = maxX - minX + pad * 2 + NODE_W;
    const h = maxY - minY + pad * 2 + NODE_H;
    const scale = Math.min(el.clientWidth / w, el.clientHeight / h, 1.4);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setView({ x: el.clientWidth / 2 - cx * scale, y: el.clientHeight / 2 - cy * scale, scale });
  }, [filtered.nodeIds, layout]);

  useEffect(() => {
    fitView();
  }, [fitView]);

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
    const nx = d.vx + (e.clientX - d.x);
    const ny = d.vy + (e.clientY - d.y);
    setView((v) => ({ ...v, x: nx, y: ny }));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

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

  // Adjacency for highlight.
  const adjacent = useMemo(() => {
    if (!selected) return null;
    const ns = new Set<string>([selected]);
    for (const e of filtered.edges) {
      if (e.src === selected) ns.add(e.dst);
      if (e.dst === selected) ns.add(e.src);
    }
    return ns;
  }, [selected, filtered.edges]);

  const searchMatches = useMemo(() => {
    if (!nodeSearch.trim()) return [];
    const q = nodeSearch.toLowerCase();
    return [...graphNodes.values()]
      .filter((n) => n.id.toLowerCase().includes(q) || n.label.toLowerCase().includes(q))
      .slice(0, 6);
  }, [nodeSearch]);

  const focusNode = (id: string) => {
    setRootId(id);
    setSelected(id);
    setMode('neighborhood');
    setNodeSearch('');
  };

  const selectedNode = selected ? graphNodes.get(selected) : undefined;

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <ScreenHeader
          title="Knowledge Graph"
          subtitle={`${allEdges.length} edges · Finding, Open Question, Experiment nodes`}
        />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface px-6 py-2.5">
          {/* Node search */}
          <div className="relative">
            <div className="flex w-60 items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2.5 py-1.5 focus-within:border-brand-border">
              <Search className="size-3.5 shrink-0 text-text-muted" />
              <input
                value={nodeSearch}
                onChange={(e) => setNodeSearch(e.target.value)}
                placeholder="Search node (F-/Q-/slug)…"
                aria-label="Search graph node"
                className="w-full bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
              />
            </div>
            {searchMatches.length > 0 && (
              <div role="listbox" aria-label="Graph nodes" className="absolute z-30 mt-1 w-72 rounded-sm border border-border-strong bg-popover py-1 shadow-xl">
                {searchMatches.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    role="option"
                    aria-selected={selected === n.id}
                    onClick={() => focusNode(n.id)}
                    className="flex w-full items-center gap-2 px-2.5 py-2 text-left hover:bg-surface-2 min-h-11"
                  >
                    <span className="size-2 shrink-0 rounded-full" style={{ background: KIND_COLOR[n.kind] }} />
                    <MonoId className="shrink-0">{n.id.replace('experiments/', '')}</MonoId>
                    <span className="truncate text-[12px] text-text-muted">{n.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-sm border border-border-subtle bg-surface-2 p-0.5">
            <ModeBtn active={mode === 'neighborhood'} onClick={() => setMode('neighborhood')} icon={Crosshair} title="Focus on one node and its 1–2 hop relationships">
              Neighborhood
            </ModeBtn>
            <ModeBtn active={mode === 'global'} onClick={() => setMode('global')} icon={Globe} title="Show all graph edges (dense)">
              Global
            </ModeBtn>
          </div>

          {/* Global helper */}
          {mode === 'global' && (
            <span className="font-mono text-[11px] text-text-muted">
              Global view shows all graph edges and may be dense. Use filters to focus.
            </span>
          )}

          {/* Depth */}
          {mode === 'neighborhood' && (
            <div className="flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-2 px-1 py-0.5">
              <span className="px-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">Depth</span>
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepth(d)}
                  aria-pressed={depth === d}
                  className={cn(
                    'rounded-sm px-2.5 py-1 min-h-11 font-mono text-[12px]',
                    depth === d ? 'bg-brand-muted text-brand' : 'text-text-muted hover:text-text-secondary',
                  )}
                >
                  {d}-hop
                </button>
              ))}
            </div>
          )}

          <div className="ml-auto flex items-center gap-1">
            {/* View switcher */}
            <div className="flex rounded-sm border border-border-subtle bg-surface-2 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('graph')}
                aria-pressed={viewMode === 'graph'}
                aria-label="Visual graph view"
                className={cn(
                  'flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-sm px-2.5 text-[12px] transition-colors',
                  viewMode === 'graph' ? 'bg-brand-muted text-brand' : 'text-text-muted hover:text-text-secondary',
                )}
              >
                <Crosshair className="size-3.5" />
                <span className="hidden sm:inline">Graph</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                aria-label="Relationship list view"
                className={cn(
                  'flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-sm px-2.5 text-[12px] transition-colors',
                  viewMode === 'list' ? 'bg-brand-muted text-brand' : 'text-text-muted hover:text-text-secondary',
                )}
              >
                <List className="size-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
            <IconBtn onClick={() => zoom(1)} label="Zoom in">
              <Plus className="size-4" />
            </IconBtn>
            <IconBtn onClick={() => zoom(-1)} label="Zoom out">
              <Minus className="size-4" />
            </IconBtn>
            <IconBtn onClick={fitView} label="Fit view">
              <Maximize2 className="size-4" />
            </IconBtn>
            <IconBtn
              onClick={() => {
                setActiveEdgeTypes(new Set(edgeTypes));
                setActiveKinds(new Set(['finding', 'question', 'experiment']));
                fitView();
              }}
              label="Reset"
            >
              <RotateCcw className="size-4" />
            </IconBtn>
          </div>
        </div>

        {/* Edge / node type filters */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border-subtle bg-surface px-6 py-2">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">Nodes</span>
          {(['finding', 'question', 'experiment'] as NodeKind[]).map((k) => (
            <FilterChip
              key={k}
              active={activeKinds.has(k)}
              color={KIND_COLOR[k]}
              onClick={() =>
                setActiveKinds((prev) => {
                  const n = new Set(prev);
                  n.has(k) ? n.delete(k) : n.add(k);
                  return n;
                })
              }
            >
              {k}
            </FilterChip>
          ))}
          <span className="mx-2 h-4 w-px bg-border-strong" />
          <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">Edges</span>
          {edgeTypes.map((t) => (
            <FilterChip
              key={t}
              active={activeEdgeTypes.has(t)}
              color={EDGE_COLOR[t]}
              onClick={() =>
                setActiveEdgeTypes((prev) => {
                  const n = new Set(prev);
                  n.has(t) ? n.delete(t) : n.add(t);
                  return n;
                })
              }
            >
              {t}
            </FilterChip>
          ))}
        </div>

        {/* Canvas or Relationship List */}
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
            <EmptyState
              title="No node selected"
              hint="Search a node or pick a different filter set. Too many edges? Narrow by edge type."
            />
          ) : (
            <svg className="absolute inset-0 size-full" role="img" aria-label="Knowledge graph visualization">
              <defs>
                {edgeTypes.map((t) => (
                  <marker
                    key={t}
                    id={`arrow-${t}`}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M0,0 L10,5 L0,10 z" fill={EDGE_COLOR[t]} />
                  </marker>
                ))}
              </defs>
              <g transform={`translate(${view.x},${view.y}) scale(${view.scale})`}>
                {/* edges */}
                {filtered.edges.map((e, i) => {
                  const a = layout.get(e.src);
                  const b = layout.get(e.dst);
                  if (!a || !b) return null;
                  const dim = adjacent && !(adjacent.has(e.src) && adjacent.has(e.dst));
                  const emphatic = e.edgeType === 'supersedes' || e.edgeType === 'conflict-suspected';
                  return (
                    <g key={i} opacity={dim ? 0.12 : 1}>
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke={EDGE_COLOR[e.edgeType]}
                        strokeWidth={emphatic ? 2 : 1.2}
                        strokeDasharray={e.edgeType === 'conflict-suspected' ? '5 4' : undefined}
                        markerEnd={`url(#arrow-${e.edgeType})`}
                      />
                      {view.scale > 0.7 && (
                        <text
                          x={(a.x + b.x) / 2}
                          y={(a.y + b.y) / 2 - 3}
                          textAnchor="middle"
                          fontSize="9"
                          fontFamily="JetBrains Mono, monospace"
                          fill={EDGE_COLOR[e.edgeType]}
                          opacity={0.85}
                        >
                          {e.edgeType}
                        </text>
                      )}
                    </g>
                  );
                })}
                {/* nodes */}
                {[...filtered.nodeIds].map((id) => {
                  const node = graphNodes.get(id)!;
                  const p = layout.get(id);
                  if (!p) return null;
                  const dim = adjacent && !adjacent.has(id);
                  const isSel = selected === id;
                  const isRoot = mode === 'neighborhood' && id === rootId;
                  const color = KIND_COLOR[node.kind];
                  return (
                    <g
                      key={id}
                      transform={`translate(${p.x - NODE_W / 2},${p.y - NODE_H / 2})`}
                      opacity={dim ? 0.25 : 1}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`${node.kind} ${id.replace('experiments/', '')}: ${node.label}`}
                      aria-selected={isSel}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(id);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        focusNode(id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelected(id);
                        }
                      }}
                    >
                      <rect
                        width={NODE_W}
                        height={NODE_H}
                        rx={3}
                        fill="var(--surface-2)"
                        stroke={isSel || isRoot ? color : 'var(--border-subtle)'}
                        strokeWidth={isSel || isRoot ? 2 : 1}
                      />
                      <rect width={3} height={NODE_H} rx={1.5} fill={color} />
                      <text x={12} y={18} fontSize="11" fontFamily="JetBrains Mono, monospace" fill={color}>
                        {id.replace('experiments/', '')}
                      </text>
                      <text x={12} y={32} fontSize="10" fill="var(--text)">
                        {truncate(node.label, 22)}
                      </text>
                      <text x={12} y={43} fontSize="9" fontFamily="JetBrains Mono, monospace" fill="var(--text-muted)">
                        {node.sub}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* Minimap */}
          {filtered.nodeIds.size > 0 && (
            <Minimap nodeIds={filtered.nodeIds} layout={layout} rootId={rootId} mode={mode} />
          )}

          {/* Too-many-edges warning */}
          {mode === 'global' && filtered.edges.length > 120 && (
            <div className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-2 rounded-sm border border-amber/40 bg-amber/10 px-3 py-1.5 backdrop-blur">
              <span className="size-1.5 rounded-full bg-amber" />
              <span className="font-mono text-[11px] text-amber">
                Rendering {filtered.edges.length} edges across {filtered.nodeIds.size} nodes — narrow by edge type or switch to Neighborhood focus.
              </span>
            </div>
          )}

          {/* Legend hint */}
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-sm border border-border-subtle bg-surface/80 px-2.5 py-1.5 font-mono text-[10px] text-text-muted backdrop-blur">
            drag to pan · scroll to zoom · double-click a node to focus
          </div>
        </div>
        ) : (
        /* Relationship List */
        <div className="min-h-0 flex-1 overflow-auto" role="region" aria-label="Relationship list">
          {filtered.nodeIds.size === 0 ? (
            <EmptyState
              title="No nodes match filters"
              hint="Adjust node or edge type filters to see relationships."
            />
          ) : (
            <div className="divide-y divide-border-subtle">
              {[...filtered.nodeIds].map((id) => {
                const node = graphNodes.get(id)!;
                const isSel = selected === id;
                const incident = filtered.edges.filter((e) => e.src === id || e.dst === id);
                const color = KIND_COLOR[node.kind];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelected(id)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2',
                      isSel && 'bg-surface-2',
                    )}
                    aria-current={isSel ? 'true' : undefined}
                  >
                    <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: color }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <MonoId className={node.kind === 'experiment' ? 'text-info' : 'text-brand'}>
                          {id.replace('experiments/', '')}
                        </MonoId>
                        <span className="font-mono text-[10px] uppercase text-text-muted">{node.kind}</span>
                      </div>
                      <div className="mt-0.5 truncate text-[13px] text-text-secondary">{node.label}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {incident.slice(0, 5).map((ed, i) => {
                          const other = ed.src === id ? ed.dst : ed.src;
                          return (
                            <span key={i} className="rounded-sm border border-border-subtle bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                              {ed.edgeType} → {other.replace('experiments/', '')}
                            </span>
                          );
                        })}
                        {incident.length > 5 && (
                          <span className="font-mono text-[10px] text-text-muted">+{incident.length - 5} more</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Node inspector — bottom sheet / overlay below lg */}
      {selectedNode && (
        <ResponsiveInspectorOverlay
          showBackdrop
          onDismiss={() => setSelected(null)}
        >
          <NodeInspector
            node={selectedNode}
            incident={filtered.edges.filter((e) => e.src === selectedNode.id || e.dst === selectedNode.id)}
            onClose={() => setSelected(null)}
            onFocus={() => focusNode(selectedNode.id)}
            onPickNode={focusNode}
            navigate={navigate}
          />
        </ResponsiveInspectorOverlay>
      )}
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function ModeBtn({
  active,
  onClick,
  icon: Icon,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Crosshair;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 min-h-11 text-[12px] transition-colors',
        active ? 'bg-brand-muted text-brand' : 'text-text-muted hover:text-text-secondary',
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </button>
  );
}

function IconBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-border-subtle bg-surface-2 text-text-muted transition-colors hover:text-text"
    >
      {children}
    </button>
  );
}

function FilterChip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-1.5 rounded-sm border px-2 py-1 min-h-11 font-mono text-[11px] transition-colors',
        active
          ? 'border-border-strong bg-surface-2 text-text-secondary'
          : 'border-border-subtle bg-surface text-text-muted opacity-50',
      )}
    >
      <span className="size-2 rounded-full" style={{ background: active ? color : 'var(--border-strong)' }} />
      {children}
    </button>
  );
}

function Minimap({
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
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const id of nodeIds) {
    const p = layout.get(id);
    if (!p) continue;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const pad = 30;
  const spanX = maxX - minX + pad * 2 || 1;
  const spanY = maxY - minY + pad * 2 || 1;
  const s = Math.min(W / spanX, H / spanY);
  const ox = (W - spanX * s) / 2 - (minX - pad) * s;
  const oy = (H - spanY * s) / 2 - (minY - pad) * s;
  return (
    <div className="absolute right-3 top-3 overflow-hidden rounded-sm border border-border-subtle bg-surface/80 backdrop-blur">
      <div className="border-b border-border-subtle px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-text-muted">
        Minimap
      </div>
      <svg width={W} height={H}>
        {[...nodeIds].map((id) => {
          const p = layout.get(id);
          if (!p) return null;
          const node = graphNodes.get(id)!;
          const isRoot = mode === 'neighborhood' && id === rootId;
          return (
            <circle
              key={id}
              cx={p.x * s + ox}
              cy={p.y * s + oy}
              r={isRoot ? 3 : 1.8}
              fill={KIND_COLOR[node.kind]}
            />
          );
        })}
      </svg>
    </div>
  );
}

function NodeInspector({
  node,
  incident,
  onClose,
  onFocus,
  onPickNode,
  navigate,
}: {
  node: GraphNode;
  incident: Edge[];
  onClose: () => void;
  onFocus: () => void;
  onPickNode: (id: string) => void;
  navigate: (to: string) => void;
}) {
  const f = node.kind === 'finding' ? getFindingById(node.id) : undefined;
  const q = node.kind === 'question' ? getQuestionById(node.id) : undefined;
  const e = node.kind === 'experiment' ? getExperimentBySlug(node.id) : undefined;

  const Label = ({ children }: { children: React.ReactNode }) => (
    <h4 className="mt-5 mb-2 font-mono text-[11px] uppercase tracking-wider text-text-muted first:mt-0">
      {children}
    </h4>
  );

  return (
    <aside className="relative ml-auto flex h-full max-h-[80vh] w-full shrink-0 flex-col self-end border-l border-border-subtle bg-surface lg:max-h-none lg:w-[360px] lg:self-auto">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
            {node.kind}
          </span>
          <MonoId className={node.kind === 'experiment' ? 'text-info' : 'text-brand'}>
            {node.id.replace('experiments/', '')}
          </MonoId>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-sm text-text-muted hover:text-text"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        <h3 className="text-[15px] leading-snug text-text">{node.label}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {f && <StatusBadge value={f.confidence} />}
          {f && <StatusBadge value={f.category} showDot={false} />}
          {q && <StatusBadge value={q.status} />}
          {q && <StatusBadge value={q.priority} showDot={false} />}
          {e && <StatusBadge value={e.outdated ? 'outdated' : e.reportStatus} />}
        </div>

        {f && (
          <>
            <Label>Summary</Label>
            <p className="text-[13px] leading-relaxed text-text-secondary">{f.summary}</p>
            <Label>Evidence</Label>
            <MonoId className="text-info">{f.evidence}</MonoId>
            {(f.supersedes || f.supersededBy) && (
              <>
                <Label>Lineage</Label>
                <div className="space-y-1 font-mono text-[12px] text-text-secondary">
                  {f.supersedes && <div>supersedes {f.supersedes}</div>}
                  {f.supersededBy && <div className="text-amber">superseded by {f.supersededBy}</div>}
                </div>
              </>
            )}
          </>
        )}
        {q && (
          <>
            <Label>Detail</Label>
            <p className="text-[13px] leading-relaxed text-text-secondary">
              {q.detail.split('| Date:')[0].trim()}
            </p>
          </>
        )}
        {e && (
          <>
            <Label>README summary</Label>
            <ul className="space-y-1">
              {e.conclusions.map((c, i) => (
                <li key={i} className="flex gap-2 text-[12px] text-text-secondary">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-border-strong" />
                  {c}
                </li>
              ))}
            </ul>
          </>
        )}

        <Label>Incident edges · {incident.length}</Label>
        <div className="space-y-1.5">
          {incident.map((ed, i) => {
            const other = ed.src === node.id ? ed.dst : ed.src;
            const dir = ed.src === node.id ? '→' : '←';
            return (
              <button
                key={i}
                type="button"
                onClick={() => onPickNode(other)}
                className="flex w-full items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2.5 py-2 min-h-11 text-left hover:border-border-strong"
              >
                <StatusBadge value={ed.edgeType} showDot />
                <span className="font-mono text-[11px] text-text-muted">{dir}</span>
                <span className="truncate font-mono text-[11px] text-text-secondary">
                  {other.replace('experiments/', '')}
                </span>
              </button>
            );
          })}
        </div>

        <Label>Actions</Label>
        <div className="flex flex-col gap-2">
          <NavActionButton onClick={onFocus}>
            <Crosshair className="size-3.5" /> Focus neighborhood
          </NavActionButton>
          {f && (
            <NavActionButton onClick={() => navigate(`/findings?focus=${node.id}`)}>
              Open in Table
            </NavActionButton>
          )}
          {q && (
            <NavActionButton onClick={() => navigate(`/findings?tab=questions&focus=${node.id}`)}>
              Open in Table
            </NavActionButton>
          )}
          {e && (
            <NavActionButton onClick={() => navigate(`/experiments/${node.id}`)}>
              Open Report
            </NavActionButton>
          )}
          {(f || e) && (
            <NavActionButton onClick={() => navigate('/lineage')}>View Lineage</NavActionButton>
          )}
          <AskClaudeButton
            onClick={() =>
              navigate(
                `/chat?ctx=${[node.id, ...incident.map((ed) => (ed.src === node.id ? ed.dst : ed.src))].join(',')}`,
              )
            }
          >
            Ask Claude about this node
          </AskClaudeButton>
        </div>
      </div>
    </aside>
  );
}

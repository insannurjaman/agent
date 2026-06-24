import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, Maximize2, RotateCcw, Plus, Minus, X, Crosshair, List, FilterIcon, Link, ArrowUp, ArrowDown } from 'lucide-react';
import { edges as allEdges, graphNodes, edgeTypes, neighborhood } from '../../data';
import type { EdgeType, NodeKind } from '../../data';
import { MonoId } from '../common/primitives';
import { EmptyState } from '../common/EmptyState';
import { SegmentedControl } from '../common/SegmentedControl';
import { IconButton } from '../common/IconButton';
import { ResponsiveInspectorOverlay } from '../responsive/ResponsiveInspectorOverlay';
import { NodeInspector } from './NodeInspector';
import { ClusterInspector, type GraphCluster } from './ClusterInspector';
import { FilterPanel } from './FilterPanel';
import { FocusContextBar } from './FocusContextBar';
import { EDGE_GROUPS, EDGE_GROUP_ORDER, getGroupEdgeTypes, type EdgeGroup } from './edgeGroups';
import { EDGE_COLOR, KIND_COLOR, NODE_W, NODE_H, ZOOM, getZoomBounds } from './graphConstants';
import { parseGraphQuery, serializeGraphQuery, type GraphURLState } from './graphUrl';
import { cn } from '../ui/utils';
import { forceLayout, radialLayout, type Pos } from './layout';

type Mode = 'neighborhood' | 'global';
type ViewMode = 'graph' | 'list';
type SortKey = 'default' | 'type' | 'label' | 'edges';

function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + '\u2026' : s; }

const NO_FOCUS_PLACEHOLDER = 'F-0050';
const COMPACT_W = 100; const COMPACT_H = 32; const PILL_W = 60; const PILL_H = 20;

function getNodeTier(depth: number, hopDist: number, scope: Mode): string {
  if (scope === 'global') return 'dot';
  if (depth === 1) return 'full';
  if (depth === 2) return hopDist <= 1 ? 'full' : 'compact';
  if (depth === 3) { if (hopDist === 0) return 'full'; if (hopDist === 1) return 'compact'; if (hopDist === 2) return 'pill'; return 'cluster'; }
  return 'full';
}

function getEdgeOpacity(depth: number, s: number, d: number, isSel: boolean, isAdj: boolean): number {
  if (isSel) return 1; if (!isAdj) return 0.04;
  if (depth === 1) return 0.6;
  if (depth === 2) return s <= 1 && d <= 1 ? 0.55 : 0.2;
  if (depth === 3) { if (s <= 1 && d <= 1) return 0.55; if (s <= 2 && d <= 2) return 0.15; return 0.06; }
  return 0.4;
}

function getFitParams(scope: string, depth: number): { pad: number; maxScale: number } {
  if (scope === 'global') return { pad: 40, maxScale: ZOOM.max.global };
  if (scope === 'cluster') return { pad: 80, maxScale: ZOOM.max.cluster };
  if (depth === 1) return { pad: 100, maxScale: ZOOM.max.neighborhood1 };
  if (depth === 2) return { pad: 80, maxScale: ZOOM.max.neighborhood2 };
  return { pad: 60, maxScale: ZOOM.max.neighborhood3 };
}

const DEFAULT_KINDS = new Set<NodeKind>(['finding', 'question', 'experiment']);
const DEFAULT_EDGE_TYPES = new Set<EdgeType>(edgeTypes);

function buildClusterData(kind: NodeKind, nodeIds: string[], edges: typeof allEdges, focusId?: string, hopLevel?: number): GraphCluster {
  const id = `cluster-${kind}${hopLevel ? `-${hopLevel}hop` : '-global'}`;
  const nodeTypeCounts = { finding: 0, question: 0, experiment: 0 };
  for (const nid of nodeIds) { const k = graphNodes.get(nid)?.kind; if (k && k in nodeTypeCounts) nodeTypeCounts[k]++; }
  const internalEdgeCount = edges.filter((e) => nodeIds.includes(e.src) && nodeIds.includes(e.dst)).length;
  const externalEdgeCount = edges.filter((e) => (nodeIds.includes(e.src) && !nodeIds.includes(e.dst)) || (!nodeIds.includes(e.src) && nodeIds.includes(e.dst))).length;
  const relGroupCounts: Record<string, number> = {};
  for (const e of edges) { if (nodeIds.includes(e.src) || nodeIds.includes(e.dst)) { for (const [grp, cfg] of Object.entries(EDGE_GROUPS)) { if (cfg.types.includes(e.edgeType)) relGroupCounts[grp] = (relGroupCounts[grp] || 0) + 1; } } }
  const children = nodeIds.slice(0, 50).map((nid) => { const n = graphNodes.get(nid); if (!n) return null; const ec = edges.filter((e) => e.src === nid || e.dst === nid).length; return { id: nid, kind: n.kind, label: n.label, edgeCount: ec }; }).filter(Boolean) as { id: string; kind: string; label: string; edgeCount: number }[];
  const dom = nodeTypeCounts.finding > nodeTypeCounts.question && nodeTypeCounts.finding > nodeTypeCounts.experiment ? 'findings' : nodeTypeCounts.question > nodeTypeCounts.experiment ? 'questions' : 'experiments';
  return { id, label: hopLevel ? `Third-hop ${dom}` : dom.charAt(0).toUpperCase() + dom.slice(1), kind: hopLevel ? 'hop-cluster' : 'global-cluster', nodeIds, nodeCount: nodeIds.length, nodeTypeCounts, internalEdgeCount, externalEdgeCount, relationshipGroupCounts: relGroupCounts, sourceFocusNodeId: focusId, hopLevel, children };
}

interface AggEdge { id: string; sourceClusterId: string; targetId: string; direction: 'outbound' | 'inbound' | 'mixed'; group: string; count: number; externalNodeLabel?: string; }

function buildBoundaryEdges(cluster: GraphCluster, allEdgesData: typeof allEdges): AggEdge[] {
  const extMap = new Map<string, { outbound: Record<string, number>; inbound: Record<string, number> }>();
  for (const e of allEdgesData) {
    const inSrc = cluster.nodeIds.includes(e.src); const inDst = cluster.nodeIds.includes(e.dst);
    if (inSrc && !inDst) {
      if (!extMap.has(e.dst)) extMap.set(e.dst, { outbound: {}, inbound: {} });
      const group = Object.entries(EDGE_GROUPS).find(([, cfg]) => cfg.types.includes(e.edgeType))?.[0] || 'knowledge';
      extMap.get(e.dst)!.outbound[group] = (extMap.get(e.dst)!.outbound[group] || 0) + 1;
    } else if (!inSrc && inDst) {
      if (!extMap.has(e.src)) extMap.set(e.src, { outbound: {}, inbound: {} });
      const group = Object.entries(EDGE_GROUPS).find(([, cfg]) => cfg.types.includes(e.edgeType))?.[0] || 'knowledge';
      extMap.get(e.src)!.inbound[group] = (extMap.get(e.src)!.inbound[group] || 0) + 1;
    }
  }
  const edges: AggEdge[] = [];
  for (const [targetId, dirs] of extMap) {
    const allGroups = new Set([...Object.keys(dirs.outbound), ...Object.keys(dirs.inbound)]);
    for (const group of allGroups) {
      const outC = dirs.outbound[group] || 0; const inC = dirs.inbound[group] || 0;
      const direction = outC > 0 && inC > 0 ? 'mixed' : outC > 0 ? 'outbound' : 'inbound';
      edges.push({ id: `agg-${cluster.id}-${targetId}-${group}`, sourceClusterId: cluster.id, targetId, direction, group, count: outC + inC, externalNodeLabel: graphNodes.get(targetId)?.label });
    }
  }
  edges.sort((a, b) => b.count - a.count);
  return edges.slice(0, ZOOM.maxBoundaryEdges);
}

interface HistEntry { focusId: string; scope: Mode; depth: number; camera: { x: number; y: number; scale: number }; }

export function KnowledgeGraphScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialFocus = params.get('focus');

  const [scope, setScope] = useState<Mode>(initialFocus ? 'neighborhood' : 'neighborhood');
  const [viewMode, setViewMode] = useState<ViewMode>(() => { if (typeof window !== 'undefined' && window.innerWidth < 768) return 'list'; return 'graph'; });
  const [depth, setDepth] = useState(2);
  const [focusId, setFocusId] = useState<string>(initialFocus ?? NO_FOCUS_PLACEHOLDER);
  const [focusStack, setFocusStack] = useState<HistEntry[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(focusId);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<GraphCluster | null>(null);
  const [exploredCluster, setExploredCluster] = useState<GraphCluster | null>(null);
  const [activeEdgeTypes, setActiveEdgeTypes] = useState<Set<EdgeType>>(new Set(edgeTypes));
  const [activeKinds, setActiveKinds] = useState<Set<NodeKind>>(new Set(DEFAULT_KINDS));
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [listSort, setListSort] = useState<SortKey>('default');
  const [listSortDir, setListSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [instructionsDismissed, setInstructionsDismissed] = useState(() => { try { return sessionStorage.getItem('kg-instructions-dismissed') === 'true'; } catch { return false; } });
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchIdx, setSearchIdx] = useState(0);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const urlInitDone = useRef(false);
  const cameraRestoreRef = useRef<{ x: number; y: number; scale: number } | null>(null);
  const [cameraRestorePending, setCameraRestorePending] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const syncURL = useCallback((mode: 'push' | 'replace') => {
    const urlState: GraphURLState = {
      view: viewMode, scope: exploredCluster ? 'cluster' : scope, depth,
      focus: focusId !== NO_FOCUS_PLACEHOLDER ? focusId : undefined,
      cluster: selectedCluster?.id || exploredCluster?.id, selected: selectedId || undefined,
      nodeKinds: [...activeKinds],
      edgeTypeGroups: EDGE_GROUP_ORDER.filter((g) => getGroupEdgeTypes(g).some((t) => activeEdgeTypes.has(t))),
      individualEdgeTypes: [...activeEdgeTypes],
    };
    const qs = serializeGraphQuery(urlState); const url = qs ? `?${qs}` : window.location.pathname;
    if (mode === 'push') window.history.pushState(null, '', url); else window.history.replaceState(null, '', url);
  }, [viewMode, scope, depth, focusId, selectedId, selectedCluster, exploredCluster, activeKinds, activeEdgeTypes]);

  useEffect(() => {
    function onPopState() {
      const p = parseGraphQuery(new URLSearchParams(window.location.search));
      if (p.scope && p.scope !== 'cluster') setScope(p.scope as Mode);
      if (p.depth) setDepth(p.depth); if (p.view) setViewMode(p.view);
      if (p.focus) setFocusId(p.focus);
      if (p.selected) { setSelectedId(p.selected); setInspectedId(p.selected); } else { setSelectedId(null); setInspectedId(null); }
      if (p.nodeKinds) setActiveKinds(new Set(p.nodeKinds));
      if (p.individualEdgeTypes) setActiveEdgeTypes(new Set(p.individualEdgeTypes));
      setExploredCluster(null); setSelectedCluster(null);
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const sub = useMemo(() => {
    if (exploredCluster) { const ids = new Set(exploredCluster.nodeIds); return { nodeIds: ids, edges: allEdges.filter((e) => ids.has(e.src) && ids.has(e.dst)), dist: new Map([...exploredCluster.nodeIds].map((id) => [id, 0] as [string, number])) }; }
    if (scope === 'neighborhood' && graphNodes.has(focusId)) { const nb = neighborhood(focusId, depth); return { nodeIds: nb.nodeIds, edges: nb.edges, dist: nb.dist }; }
    return { nodeIds: new Set(graphNodes.keys()), edges: allEdges, dist: new Map<string, number>() };
  }, [scope, focusId, depth, exploredCluster]);

  const filtered = useMemo(() => {
    const nodeIds = new Set([...sub.nodeIds].filter((id) => activeKinds.has(graphNodes.get(id)!.kind)));
    return { nodeIds, edges: sub.edges.filter((e) => activeEdgeTypes.has(e.edgeType) && nodeIds.has(e.src) && nodeIds.has(e.dst)) };
  }, [sub, activeKinds, activeEdgeTypes]);

  const toggleEdgeGroup = useCallback((group: EdgeGroup) => {
    const groupTypes = getGroupEdgeTypes(group);
    setActiveEdgeTypes((prev) => { const allActive = groupTypes.every((t) => prev.has(t)); const next = new Set(prev); for (const t of groupTypes) allActive ? next.delete(t) : next.add(t); return next; });
  }, []);

  const isFilterDefault = useMemo(() => {
    if (activeKinds.size !== DEFAULT_KINDS.size) return false; for (const k of DEFAULT_KINDS) if (!activeKinds.has(k)) return false;
    if (activeEdgeTypes.size !== DEFAULT_EDGE_TYPES.size) return false; for (const t of DEFAULT_EDGE_TYPES) if (!activeEdgeTypes.has(t)) return false;
    return true;
  }, [activeKinds, activeEdgeTypes]);
  const filterChanges = useMemo(() => { if (isFilterDefault) return 0; let c = 0; for (const k of DEFAULT_KINDS) if (!activeKinds.has(k)) c++; for (const t of DEFAULT_EDGE_TYPES) if (!activeEdgeTypes.has(t)) c++; return c; }, [isFilterDefault, activeKinds, activeEdgeTypes]);
  const filterLabel = isFilterDefault ? 'Filters' : `Filters · ${filterChanges} hidden`;

  const layout = useMemo<Map<string, Pos>>(() => {
    if (exploredCluster) return forceLayout(filtered.nodeIds, filtered.edges);
    if (scope === 'neighborhood' && graphNodes.has(focusId)) return radialLayout(focusId, filtered.nodeIds, sub.dist);
    return forceLayout(filtered.nodeIds, filtered.edges);
  }, [scope, focusId, filtered, sub.dist, exploredCluster]);

  const threeHopClusters = useMemo(() => {
    if (depth < 3 || scope !== 'neighborhood' || exploredCluster) return [];
    const hopIds = [...filtered.nodeIds].filter((id) => (sub.dist.get(id) ?? 0) >= 3);
    const byKind: Record<string, string[]> = { finding: [], question: [], experiment: [] };
    for (const id of hopIds) { const k = graphNodes.get(id)?.kind; if (k && byKind[k]) byKind[k].push(id); }
    return Object.entries(byKind).filter(([, ids]) => ids.length > 0).map(([kind, ids]) => { const c = buildClusterData(kind as NodeKind, ids, filtered.edges, focusId, 3) as GraphCluster & { x: number; y: number }; c.x = ids.reduce((s, id) => s + (layout.get(id)?.x ?? 0), 0) / ids.length; c.y = ids.reduce((s, id) => s + (layout.get(id)?.y ?? 0), 0) / ids.length; return c; });
  }, [depth, scope, exploredCluster, filtered.nodeIds, filtered.edges, sub.dist, layout, focusId]);

  const globalClusters = useMemo(() => {
    if (scope !== 'global' || exploredCluster) return [];
    const byKind: Record<string, string[]> = { finding: [], question: [], experiment: [] };
    for (const id of filtered.nodeIds) { const k = graphNodes.get(id)?.kind; if (k && byKind[k]) byKind[k].push(id); }
    return Object.entries(byKind).filter(([, ids]) => ids.length > 0).map(([kind, ids]) => { const c = buildClusterData(kind as NodeKind, ids, filtered.edges) as GraphCluster & { x: number; y: number }; c.x = ids.reduce((s, id) => s + (layout.get(id)?.x ?? 0), 0) / ids.length; c.y = ids.reduce((s, id) => s + (layout.get(id)?.y ?? 0), 0) / ids.length; return c; });
  }, [scope, exploredCluster, filtered.nodeIds, filtered.edges, layout]);

  const allClusters = useMemo(() => [...threeHopClusters, ...globalClusters], [threeHopClusters, globalClusters]);
  useEffect(() => { if (selectedCluster && !allClusters.find((c) => c.id === selectedCluster.id)) setSelectedCluster(null); }, [allClusters, selectedCluster]);

  const boundaryEdges = useMemo(() => { if (!selectedCluster) return []; return buildBoundaryEdges(selectedCluster, allEdges); }, [selectedCluster, allEdges]);

  // ── Camera — single authoritative effect ─────────────────────────
  const { pad: fitPad, maxScale: fitMaxScale } = getFitParams(exploredCluster ? 'cluster' : scope, depth);
  const zoomBounds = getZoomBounds(exploredCluster ? 'cluster' : scope, depth);

  const fitView = useCallback(() => {
    const el = wrapRef.current; if (!el || filtered.nodeIds.size === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const id of filtered.nodeIds) { const p = layout.get(id); if (!p) continue; minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
    const w = maxX - minX + fitPad * 2 + NODE_W; const h = maxY - minY + fitPad * 2 + NODE_H;
    const scale = Math.min(el.clientWidth / w, el.clientHeight / h, fitMaxScale);
    setView({ x: el.clientWidth / 2 - ((minX + maxX) / 2) * scale, y: el.clientHeight / 2 - ((minY + maxY) / 2) * scale, scale });
  }, [filtered.nodeIds, layout, fitPad, fitMaxScale]);

  // Single camera effect — runs after layout is ready
  useEffect(() => {
    if (cameraRestorePending && cameraRestoreRef.current) {
      const cam = cameraRestoreRef.current;
      const el = wrapRef.current;
      if (!el) { setCameraRestorePending(false); return; }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const id of filtered.nodeIds) { const p = layout.get(id); if (!p) continue; minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
      const cw = maxX - minX; const ch = maxY - minY;
      if (cw < 10 || ch < 10 || cw > 50000 || ch > 50000) { fitView(); setCameraRestorePending(false); return; }
      const visibleW = el.clientWidth / cam.scale; const visibleH = el.clientHeight / cam.scale;
      const offscreen = cam.x + visibleW < minX - 50 || cam.x > maxX + 50 || cam.y + visibleH < minY - 50 || cam.y > maxY + 50;
      if (offscreen) {
        if (focusId && focusId !== NO_FOCUS_PLACEHOLDER) { const p = layout.get(focusId); if (p) { const ns = Math.max(cam.scale, ZOOM.minReadableNode); setView({ x: el.clientWidth / 2 - p.x * ns, y: el.clientHeight / 2 - p.y * ns, scale: ns }); setCameraRestorePending(false); return; } }
        fitView();
      } else { setView(cam); }
      setCameraRestorePending(false);
    } else {
      fitView();
    }
  }, [filtered.nodeIds, layout, fitPad, fitMaxScale, cameraRestorePending, focusId, fitView]);

  const centerOn = useCallback((id: string) => {
    const p = layout.get(id); const el = wrapRef.current;
    if (!p || !el) return;
    const ns = Math.max(ZOOM.minReadableNode, zoomBounds.min, 0.4);
    setView({ x: el.clientWidth / 2 - p.x * ns, y: el.clientHeight / 2 - p.y * ns, scale: ns });
  }, [layout, zoomBounds.min]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault(); const el = wrapRef.current; if (!el) return;
    const r = el.getBoundingClientRect(); const mx = e.clientX - r.left; const my = e.clientY - r.top;
    setView((v) => { const f = e.deltaY < 0 ? 1.12 : 0.89; const s = Math.min(Math.max(v.scale * f, zoomBounds.min), zoomBounds.max); const k = s / v.scale; return { scale: s, x: mx - (mx - v.x) * k, y: my - (my - v.y) * k }; });
  };
  const onPointerDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; (e.target as Element).setPointerCapture?.(e.pointerId); };
  const onPointerMove = (e: React.PointerEvent) => { const d = drag.current; if (!d) return; setView((v) => ({ ...v, x: d.vx + (e.clientX - d.x), y: d.vy + (e.clientY - d.y) })); };
  const onPointerUp = () => { drag.current = null; };
  const zoom = (dir: 1 | -1) => { const el = wrapRef.current; const cx = (el?.clientWidth ?? 600) / 2; const cy = (el?.clientHeight ?? 400) / 2; setView((v) => { const s = Math.min(Math.max(v.scale * (dir > 0 ? 1.15 : 0.87), zoomBounds.min), zoomBounds.max); const k = s / v.scale; return { scale: s, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k }; }); };

  const adjacent = useMemo(() => { if (!selectedId) return null; const ns = new Set<string>([selectedId]); for (const e of filtered.edges) { if (e.src === selectedId) ns.add(e.dst); if (e.dst === selectedId) ns.add(e.src); } return ns; }, [selectedId, filtered.edges]);
  const zoomLevel = view.scale;

  const searchMatches = useMemo(() => { if (!search.trim()) return []; const q = search.toLowerCase(); return [...graphNodes.values()].filter((n) => n.id.toLowerCase().includes(q) || n.label.toLowerCase().includes(q)).slice(0, 8); }, [search]);
  useEffect(() => { setSearchIdx(0); }, [searchMatches.length]);

  const inspectNode = useCallback((id: string) => { setSelectedId(id); setInspectedId(id); setSelectedCluster(null); }, []);

  const focusNode = useCallback((id: string) => {
    if (exploredCluster) setExploredCluster(null);
    if (focusId && focusId !== id) setFocusStack((p) => [...p.slice(-9), { focusId, scope, depth, camera: { x: view.x, y: view.y, scale: view.scale } }]);
    setFocusId(id); setScope('neighborhood'); inspectNode(id); setSearch('');
    syncURL('push');
    requestAnimationFrame(() => centerOn(id));
  }, [focusId, scope, depth, view, centerOn, inspectNode, exploredCluster, syncURL]);

  const goBackFocus = useCallback(() => {
    if (focusStack.length === 0) return;
    const prev = focusStack[focusStack.length - 1];
    setFocusStack((p) => p.slice(0, -1));
    setFocusId(prev.focusId); setScope(prev.scope); setDepth(prev.depth);
    setSelectedId(null); setInspectedId(null); setSelectedCluster(null); setExploredCluster(null);
    cameraRestoreRef.current = prev.camera; setCameraRestorePending(true);
    syncURL('push');
  }, [focusStack, syncURL]);

  const clearFocus = useCallback(() => {
    setFocusId(NO_FOCUS_PLACEHOLDER); setFocusStack([]); setScope('neighborhood');
    setSelectedId(null); setInspectedId(null); setSelectedCluster(null); setExploredCluster(null);
    syncURL('push');
  }, [syncURL]);

  const selectCluster = useCallback((cluster: GraphCluster & { x: number; y: number }) => { setSelectedCluster(cluster); setSelectedId(null); setInspectedId(null); syncURL('replace'); }, [syncURL]);

  const exploreCluster = useCallback(() => {
    if (!selectedCluster) return;
    if (focusId) setFocusStack((p) => [...p.slice(-9), { focusId, scope, depth, camera: { x: view.x, y: view.y, scale: view.scale } }]);
    setExploredCluster(selectedCluster); setSelectedCluster(null);
    setCameraRestorePending(false); cameraRestoreRef.current = null;
    syncURL('push');
    requestAnimationFrame(() => fitView());
  }, [selectedCluster, focusId, scope, depth, view, fitView, syncURL]);

  const viewClusterAsList = useCallback(() => { if (!selectedCluster) return; setViewMode('list'); syncURL('push'); }, [selectedCluster, syncURL]);

  const handleListSort = useCallback((key: SortKey) => {
    if (listSort === key) setListSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setListSort(key); setListSortDir('desc'); }
  }, [listSort]);

  useEffect(() => {
    if (!urlInitDone.current) {
      const p = parseGraphQuery(params);
      if (p.scope && p.scope !== scope) setScope(p.scope as Mode);
      if (p.depth && p.depth !== depth) setDepth(p.depth);
      if (p.view && p.view !== viewMode) setViewMode(p.view);
      if (p.focus && p.focus !== focusId) setFocusId(p.focus);
      if (p.selected) { setSelectedId(p.selected); setInspectedId(p.selected); }
      if (p.nodeKinds) setActiveKinds(new Set(p.nodeKinds));
      if (p.individualEdgeTypes) setActiveEdgeTypes(new Set(p.individualEdgeTypes));
      urlInitDone.current = true;
    }
  }, []);
  useEffect(() => { if (!urlInitDone.current) return; syncURL('replace'); }, [activeKinds, activeEdgeTypes, depth, viewMode]);

  const selectedNode = selectedId ? graphNodes.get(selectedId) : undefined;
  const focusNodeData = exploredCluster ? null : graphNodes.get(focusId);

  const kindCounts = useMemo(() => { const c: Record<string, number> = { finding: 0, question: 0, experiment: 0 }; for (const id of filtered.nodeIds) { const k = graphNodes.get(id)?.kind; if (k) c[k]++; } return c; }, [filtered.nodeIds]);
  const sortedList = useMemo(() => {
    const ids = [...filtered.nodeIds];
    const dir = listSortDir === 'desc' ? -1 : 1;
    switch (listSort) {
      case 'type': ids.sort((a, b) => { const ka = graphNodes.get(a)!.kind; const kb = graphNodes.get(b)!.kind; if (ka !== kb) return ka.localeCompare(kb) * dir; return a.localeCompare(b) * dir; }); break;
      case 'label': ids.sort((a, b) => graphNodes.get(a)!.label.localeCompare(graphNodes.get(b)!.label) * dir); break;
      case 'edges': ids.sort((a, b) => { const ca = filtered.edges.filter((e) => e.src === a || e.dst === a).length; const cb = filtered.edges.filter((e) => e.src === b || e.dst === b).length; return (cb - ca) * dir; }); break;
      default: ids.sort((a, b) => a.localeCompare(b) * dir);
    }
    return ids;
  }, [filtered.nodeIds, filtered.edges, listSort, listSortDir]);
  const nodeKinds: NodeKind[] = ['finding', 'question', 'experiment'];
  const dismissInstructions = useCallback(() => { setInstructionsDismissed(true); try { sessionStorage.setItem('kg-instructions-dismissed', 'true'); } catch {} }, []);
  const closeFilterPanel = useCallback(() => { setFilterPanelOpen(false); requestAnimationFrame(() => filterTriggerRef.current?.focus()); }, []);
  useEffect(() => { if (!filterPanelOpen) return; function h(e: KeyboardEvent) { if (e.key === 'Escape') closeFilterPanel(); } document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); }, [filterPanelOpen, closeFilterPanel]);
  const copyLink = useCallback(() => { navigator.clipboard.writeText(window.location.href).catch(() => {}); }, []);

  const SORT_LABELS: Record<SortKey, string> = { default: 'ID', type: 'Type', label: 'Label', edges: 'Edges' };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-2 bg-surface min-h-10">
          <div className="flex items-center gap-2"><h1 className="text-[15px] font-medium text-text">Knowledge Graph</h1><span className="font-mono text-[10px] text-text-muted">{allEdges.length} edges · {graphNodes.size} nodes</span></div>
          <button type="button" onClick={copyLink} className="flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-[10px] text-text-muted hover:text-text transition-colors" aria-label="Copy link to current graph view" title="Copy link"><Link className="size-3" /> Share</button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface px-4 py-1.5 min-h-10">
          <div className="relative flex-1 min-w-[140px] max-w-[280px]">
            <div className="flex h-9 items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2 focus-within:border-brand-border transition-colors">
              <Search className="size-3 shrink-0 text-text-muted" />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (!searchMatches.length) return; if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIdx((i) => Math.min(i + 1, searchMatches.length - 1)); } if (e.key === 'ArrowUp') { e.preventDefault(); setSearchIdx((i) => Math.max(i - 1, 0)); } if (e.key === 'Enter') { e.preventDefault(); focusNode(searchMatches[searchIdx].id); } if (e.key === 'Escape') { setSearch(''); searchRef.current?.blur(); } }}
                placeholder="Search nodes…" aria-label="Search graph node"
                className="w-full bg-transparent text-[12px] text-text outline-none placeholder:text-text-muted" />
              {search && <button type="button" onClick={() => setSearch('')} className="flex size-5 items-center justify-center rounded-sm text-text-muted hover:text-text" aria-label="Clear search"><X className="size-3" /></button>}
            </div>
            {searchMatches.length > 0 && (<div role="listbox" aria-label="Graph nodes" className="absolute z-30 mt-1 w-64 rounded-sm border border-border-strong bg-popover py-1 shadow-xl">{searchMatches.map((n, i) => (<button key={n.id} type="button" role="option" aria-selected={selectedId === n.id} onClick={() => focusNode(n.id)} className={cn('flex w-full items-center gap-2 px-2.5 py-2 text-left min-h-10', i === searchIdx ? 'bg-surface-2' : 'hover:bg-surface-2')}><span className="size-2 shrink-0 rounded-full" style={{ background: KIND_COLOR[n.kind] }} /><MonoId className="shrink-0 text-[11px]">{n.id.replace('experiments/', '')}</MonoId><span className="truncate text-[11px] text-text-muted">{n.label}</span></button>))}</div>)}
            {search.trim() && searchMatches.length === 0 && (
              <div className="absolute z-30 mt-1 w-64 rounded-sm border border-border-strong bg-popover px-2.5 py-2 shadow-xl"><span className="font-mono text-[11px] text-text-muted">No matching nodes</span></div>
            )}
          </div>

          <select value={scope} onChange={(e) => { setScope(e.target.value as Mode); if (e.target.value === 'global') setFocusStack([]); setExploredCluster(null); syncURL('push'); }}
            className="h-9 rounded-sm border border-border-subtle bg-surface-2 px-2 font-mono text-[11px] text-text outline-none cursor-pointer" aria-label="Graph scope">
            <option value="neighborhood">Neighborhood</option><option value="global">Global</option>
          </select>
          {scope === 'neighborhood' && !exploredCluster && (
            <select value={String(depth)} onChange={(e) => setDepth(Number(e.target.value))}
              className="h-9 rounded-sm border border-border-subtle bg-surface-2 px-2 font-mono text-[11px] text-text outline-none cursor-pointer" aria-label="Hop depth">
              <option value="1">1-hop</option><option value="2">2-hop</option><option value="3">3-hop</option>
            </select>)}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            <SegmentedControl compact segments={[{ id: 'graph', label: 'Graph', icon: <Crosshair className="size-3" /> }, { id: 'list', label: 'List', icon: <List className="size-3" /> }]} value={viewMode} onChange={(v) => setViewMode(v as 'graph' | 'list')} className="shrink-0" />
            <div className="relative">
              <button ref={filterTriggerRef} type="button" onClick={() => setFilterPanelOpen((v) => !v)} aria-expanded={filterPanelOpen} aria-haspopup="true"
                className={cn('flex h-9 items-center gap-1.5 rounded-sm border px-2.5 font-mono text-[11px] transition-colors', 'focus-visible:ring-2 focus-visible:ring-brand-ring', filterPanelOpen || !isFilterDefault ? 'border-brand-border bg-brand-muted text-brand' : 'border-border-subtle bg-surface-2 text-text-muted hover:text-text-secondary')}>
                <FilterIcon className="size-3" /> {filterLabel}
              </button>
              {filterPanelOpen && !isMobile && (<><div className="fixed inset-0 z-10" onClick={closeFilterPanel} aria-hidden="true" /><div id="filter-panel" className="absolute right-0 top-full z-20 mt-1 w-[320px] rounded-sm border border-border-strong bg-popover shadow-xl max-h-[70vh] overflow-auto"><FilterPanel activeKinds={activeKinds} activeEdgeTypes={activeEdgeTypes} kindCounts={kindCounts} onToggleKind={(k) => setActiveKinds((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; })} onToggleEdgeType={(t) => setActiveEdgeTypes((prev) => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; })} onToggleGroup={toggleEdgeGroup} onSelectAllKinds={() => setActiveKinds(new Set(DEFAULT_KINDS))} onClearAllKinds={() => setActiveKinds(new Set())} onResetToDefault={() => { setActiveKinds(new Set(DEFAULT_KINDS)); setActiveEdgeTypes(new Set(edgeTypes)); }} isDefault={isFilterDefault} onClose={closeFilterPanel} nodeKinds={nodeKinds} /></div></>)}
            </div>
          </div>
        </div>

        {filterPanelOpen && isMobile && (<div className="fixed inset-0 z-50 flex flex-col justify-end"><div className="fixed inset-0 bg-black/50" onClick={closeFilterPanel} /><div className="relative max-h-[85vh] w-full rounded-t-sm border-t border-border-strong bg-surface overflow-auto pb-[env(safe-area-inset-bottom)]"><FilterPanel activeKinds={activeKinds} activeEdgeTypes={activeEdgeTypes} kindCounts={kindCounts} onToggleKind={(k) => setActiveKinds((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; })} onToggleEdgeType={(t) => setActiveEdgeTypes((prev) => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; })} onToggleGroup={toggleEdgeGroup} onSelectAllKinds={() => setActiveKinds(new Set(DEFAULT_KINDS))} onClearAllKinds={() => setActiveKinds(new Set())} onResetToDefault={() => { setActiveKinds(new Set(DEFAULT_KINDS)); setActiveEdgeTypes(new Set(edgeTypes)); }} isDefault={isFilterDefault} onClose={closeFilterPanel} nodeKinds={nodeKinds} /></div></div>)}

        {exploredCluster ? (
          <div className="flex items-center gap-3 border-b border-border-subtle bg-surface/80 px-4 py-1.5 min-h-9">
            <button type="button" onClick={goBackFocus} className="flex items-center gap-1 rounded-sm px-1.5 py-1 font-mono text-[11px] text-text-muted hover:text-text transition-colors shrink-0" aria-label="Back to parent graph"><X className="size-3.5" /> Back</button>
            <span className="size-2 shrink-0 rounded-full" style={{ background: KIND_COLOR.finding }} /><span className="font-mono text-[12px] font-medium text-text shrink-0">{exploredCluster.label}</span>
            <span className="truncate text-[12px] text-text-secondary min-w-0">{exploredCluster.nodeCount} nodes</span>
            <span className="shrink-0 font-mono text-[10px] text-text-muted tabular-nums">{exploredCluster.internalEdgeCount} int · {exploredCluster.externalEdgeCount} ext</span>
            <button type="button" onClick={clearFocus} className="ml-auto shrink-0 flex items-center gap-1 rounded-sm px-1.5 py-1 font-mono text-[11px] text-text-muted hover:text-text transition-colors" aria-label="Return to main graph"><X className="size-3.5" /> Clear</button>
          </div>
        ) : scope === 'neighborhood' && focusNodeData && (
          <FocusContextBar focusId={focusId} focusNode={focusNodeData} hopDepth={depth} nodeCount={filtered.nodeIds.size} edgeCount={filtered.edges.length} canGoBack={focusStack.length > 0} onBack={goBackFocus} onClear={clearFocus} />
        )}

        {viewMode === 'graph' ? (
          <div ref={wrapRef} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
            className="relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden bg-background active:cursor-grabbing [background-image:radial-gradient(circle,#171c20_1px,transparent_1px)] [background-size:24px_24px]"
            aria-label="Graph canvas — drag to pan, scroll to zoom, click a node to inspect">
            {filtered.nodeIds.size === 0 ? <EmptyState title="No nodes match current filters" hint="Search for a node or adjust filters to display the graph." /> : (
              <svg className="absolute inset-0 size-full" role="img" aria-label="Knowledge graph visualization">
                <defs>{edgeTypes.map((t) => (<marker key={t} id={`arrow-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={EDGE_COLOR[t]} /></marker>))}</defs>
                <g className="transition-transform duration-150 ease-out" transform={`translate(${view.x},${view.y}) scale(${view.scale})`}>
                  {/* ── Global & 3-hop clusters ── */}
                  {!exploredCluster && scope === 'global' && zoomLevel < 0.4 && (globalClusters as (GraphCluster & { x: number; y: number })[]).map((c) => (
                    <g key={c.id} transform={`translate(${c.x},${c.y})`} opacity={0.9} className="cursor-pointer" role="button" tabIndex={0}
                      aria-label={`Cluster ${c.label}, ${c.nodeCount} nodes, ${c.internalEdgeCount} internal`}
                      onClick={(e) => { e.stopPropagation(); selectCluster(c); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCluster(c); } }}>
                      <circle r={Math.min(8 + c.nodeCount * 0.5, 30)} fill={KIND_COLOR[c.nodeTypeCounts.finding > c.nodeTypeCounts.question && c.nodeTypeCounts.finding > c.nodeTypeCounts.experiment ? 'finding' : c.nodeTypeCounts.question > c.nodeTypeCounts.experiment ? 'question' : 'experiment']} opacity={0.3} stroke={selectedCluster?.id === c.id ? 'var(--brand-primary)' : KIND_COLOR[c.nodeTypeCounts.finding > c.nodeTypeCounts.question && c.nodeTypeCounts.finding > c.nodeTypeCounts.experiment ? 'finding' : c.nodeTypeCounts.question > c.nodeTypeCounts.experiment ? 'question' : 'experiment']} strokeWidth={selectedCluster?.id === c.id ? 2.5 : 1.5} />
                      <text textAnchor="middle" dy="0.35em" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="var(--text)" fontWeight="bold">{c.nodeCount}</text>
                      <text textAnchor="middle" dy="1.8em" fontSize="8" fontFamily="JetBrains Mono, monospace" fill="var(--text-muted)">{c.label}</text>
                      <text textAnchor="middle" dy="2.8em" fontSize="6" fontFamily="JetBrains Mono, monospace" fill="var(--text-muted)">{c.internalEdgeCount} int · {c.externalEdgeCount} ext</text>
                    </g>
                  ))}
                  {!exploredCluster && (threeHopClusters as (GraphCluster & { x: number; y: number })[]).map((c) => (
                    <g key={c.id} transform={`translate(${c.x},${c.y})`} opacity={0.8} className="cursor-pointer" role="button" tabIndex={0}
                      aria-label={`Cluster ${c.label}, ${c.nodeCount} nodes`}
                      onClick={(e) => { e.stopPropagation(); selectCluster(c); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCluster(c); } }}>
                      <circle r={10 + Math.min(c.nodeCount, 20) * 0.3} fill={KIND_COLOR[c.nodeTypeCounts.finding > c.nodeTypeCounts.question && c.nodeTypeCounts.finding > c.nodeTypeCounts.experiment ? 'finding' : c.nodeTypeCounts.question > c.nodeTypeCounts.experiment ? 'question' : 'experiment']} opacity={0.25} stroke={selectedCluster?.id === c.id ? 'var(--brand-primary)' : KIND_COLOR[c.nodeTypeCounts.finding > c.nodeTypeCounts.question && c.nodeTypeCounts.finding > c.nodeTypeCounts.experiment ? 'finding' : c.nodeTypeCounts.question > c.nodeTypeCounts.experiment ? 'question' : 'experiment']} strokeWidth={selectedCluster?.id === c.id ? 2.5 : 1} />
                      <text textAnchor="middle" dy="0.35em" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="var(--text)" fontWeight="bold">{c.nodeCount}</text>
                      <text textAnchor="middle" dy="1.6em" fontSize="7" fontFamily="JetBrains Mono, monospace" fill="var(--text-muted)">{c.label}</text>
                    </g>
                  ))}

                  {/* ── Aggregate boundary edges with collision-free labels ── */}
                  {selectedCluster && (() => {
                    const usedLabelPositions: { x: number; y: number }[] = [];
                    const MIN_LABEL_DIST = 40;
                    return boundaryEdges.map((ae) => {
                      const extPos = layout.get(ae.targetId);
                      const cPos = { x: (selectedCluster as GraphCluster & { x?: number }).x ?? 0, y: (selectedCluster as GraphCluster & { y?: number }).y ?? 0 };
                      if (!extPos) return null;
                      const gc = ae.group === 'evidence' ? 'var(--brand-primary)' : ae.group === 'resolution' ? 'var(--green)' : ae.group === 'conflict' ? 'var(--error)' : 'var(--text-muted)';
                      const showLabel = (zoomLevel > 0.5 || ae.count > 5);
                      const lx = (cPos.x + extPos.x) / 2;
                      const ly = (cPos.y + extPos.y) / 2 - 4;
                      const labelCollides = showLabel && usedLabelPositions.some((u) => Math.abs(u.x - lx) < MIN_LABEL_DIST && Math.abs(u.y - ly) < MIN_LABEL_DIST);
                      if (showLabel && !labelCollides) usedLabelPositions.push({ x: lx, y: ly });
                      return (<g key={ae.id} opacity={0.45} className="cursor-pointer" role="button" tabIndex={0}
                        aria-label={`${ae.count} ${ae.group} ${ae.direction} ${ae.externalNodeLabel || ae.targetId}`}>
                        <line x1={cPos.x} y1={cPos.y} x2={extPos.x} y2={extPos.y}
                          stroke={gc} strokeWidth={Math.min(ae.count * 0.3 + 0.5, ZOOM.maxBoundaryEdgeWidth)} strokeDasharray={ae.direction === 'mixed' ? '4 3' : ae.direction === 'inbound' ? '2 4' : undefined} />
                        {showLabel && !labelCollides && (
                          <text x={lx} y={ly} textAnchor="middle" fontSize="6" fontFamily="JetBrains Mono, monospace" fill={gc} opacity={0.8}>{ae.group} · {ae.count}</text>
                        )}
                      </g>);
                    });
                  })()}

                  {/* ── Regular edges ── */}
                  {(scope !== 'global' || zoomLevel >= 0.4 || exploredCluster) && (() => {
                    const MAX_LABELS = ZOOM.maxSelectedEdgeLabels;
                    const MIN_LABEL_DIST = 50;
                    const selPathEdges: { e: typeof filtered.edges[0]; a: Pos; b: Pos; idx: number }[] = [];
                    const edgeEls: React.ReactNode[] = [];

                    filtered.edges.forEach((e, i) => {
                      const a = layout.get(e.src); const b = layout.get(e.dst); if (!a || !b) return;
                      const sd = sub.dist.get(e.src) ?? 0; const dd = sub.dist.get(e.dst) ?? 0;
                      const isAdj = adjacent && adjacent.has(e.src) && adjacent.has(e.dst);
                      const isSelPath = adjacent && adjacent.has(e.src) && adjacent.has(e.dst) && selectedId && (e.src === selectedId || e.dst === selectedId);
                      if (zoomLevel < 0.3 && !isSelPath && !exploredCluster) return;
                      const emphatic = e.edgeType === 'supersedes' || e.edgeType === 'conflict-suspected';
                      const opacity = exploredCluster ? 0.55 : getEdgeOpacity(depth, sd, dd, isSelPath, !!isAdj);
                      if (opacity < 0.05) return;
                      if (isSelPath && zoomLevel > 0.7) selPathEdges.push({ e, a, b, idx: i });
                      edgeEls.push(<g key={i} opacity={opacity}>
                        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={EDGE_COLOR[e.edgeType]}
                          strokeWidth={isSelPath ? ZOOM.maxSelectedEdgeWidth : emphatic ? 1.5 : 0.8}
                          strokeDasharray={e.edgeType === 'conflict-suspected' ? '5 4' : undefined}
                          markerEnd={zoomLevel >= 0.35 ? `url(#arrow-${e.edgeType})` : undefined} />
                      </g>);
                    });

                    // Render selected-path labels with collision avoidance
                    const usedLabelPos: { x: number; y: number }[] = [];
                    const sortedLabels = selPathEdges.sort((a, b) => {
                      const da = Math.abs(a.a.x - a.b.x) + Math.abs(a.a.y - a.b.y);
                      const db = Math.abs(b.a.x - b.b.x) + Math.abs(b.a.y - b.b.y);
                      return da - db;
                    });
                    sortedLabels.slice(0, MAX_LABELS).forEach(({ e, a, b }) => {
                      const lx = (a.x + b.x) / 2; const ly = (a.y + b.y) / 2 - 3;
                      const collides = usedLabelPos.some((u) => Math.abs(u.x - lx) < MIN_LABEL_DIST && Math.abs(u.y - ly) < MIN_LABEL_DIST);
                      if (!collides) {
                        usedLabelPos.push({ x: lx, y: ly });
                        edgeEls.push(<g key={`label-${e.src}-${e.dst}`} opacity={0.85}>
                          <text x={lx} y={ly} textAnchor="middle" fontSize="7" fontFamily="JetBrains Mono, monospace" fill={EDGE_COLOR[e.edgeType]}>{e.edgeType}</text>
                        </g>);
                      }
                    });

                    return edgeEls;
                  })()}

                  {/* ── Nodes ── */}
                  {(scope !== 'global' || zoomLevel >= 0.4 || exploredCluster) && [...filtered.nodeIds].map((id) => {
                    const node = graphNodes.get(id)!; const p = layout.get(id); if (!p) return null;
                    const hopDist = sub.dist.get(id) ?? 0; const dim = adjacent && !adjacent.has(id);
                    const isFocused = !exploredCluster && scope === 'neighborhood' && id === focusId;
                    const isSelected = selectedId === id; const color = KIND_COLOR[node.kind];
                    const tier = exploredCluster ? 'full' : getNodeTier(depth, hopDist, scope);
                    const nodeOpacity = isSelected ? 1 : isFocused ? 1 : dim ? 0.08 : tier === 'full' ? 0.95 : tier === 'compact' ? 0.7 : 0.4;
                    if (zoomLevel < 0.2 && !isFocused && !isSelected && !exploredCluster) return null;
                    const hasAggEdge = selectedCluster && boundaryEdges.some((ae) => ae.targetId === id);

                    if ((tier === 'dot' || tier === 'cluster') || (zoomLevel < 0.35 && tier !== 'full' && !exploredCluster)) {
                      return (<g key={id} transform={`translate(${p.x},${p.y})`} opacity={nodeOpacity} className="cursor-pointer" role="button" tabIndex={0}
                        aria-label={`${node.kind} ${id}: ${node.label}`}
                        onClick={(e) => { e.stopPropagation(); inspectNode(id); }} onDoubleClick={(e) => { e.stopPropagation(); focusNode(id); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inspectNode(id); } }}>
                        <circle r={isFocused ? 5 : isSelected ? 4 : hasAggEdge ? 3.5 : 2.5} fill={color} stroke={hasAggEdge ? 'var(--brand-primary)' : isSelected ? 'var(--text)' : 'none'} strokeWidth={hasAggEdge ? 1.5 : isSelected ? 1.5 : 0} />
                      </g>);
                    }
                    if (tier === 'pill') return (<g key={id} transform={`translate(${p.x - PILL_W / 2},${p.y - PILL_H / 2})`} opacity={nodeOpacity} className="cursor-pointer" role="button" tabIndex={0}
                      aria-label={`${node.kind} ${id}: ${node.label}`}
                      onClick={(e) => { e.stopPropagation(); inspectNode(id); }} onDoubleClick={(e) => { e.stopPropagation(); focusNode(id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inspectNode(id); } }}>
                      <rect width={PILL_W} height={PILL_H} rx={3} fill="var(--surface-2)" stroke={isFocused ? color : 'var(--border-subtle)'} strokeWidth={isFocused ? 1.5 : 0.5} /><rect width={2} height={PILL_H} rx={1} fill={color} /><text x={5} y={13} fontSize="8" fontFamily="JetBrains Mono, monospace" fill={color}>{id.replace('experiments/', '')}</text>
                    </g>);
                    if (tier === 'compact') return (<g key={id} transform={`translate(${p.x - COMPACT_W / 2},${p.y - COMPACT_H / 2})`} opacity={nodeOpacity} className="cursor-pointer" role="button" tabIndex={0}
                      aria-label={`${node.kind} ${id}: ${node.label}`}
                      onClick={(e) => { e.stopPropagation(); inspectNode(id); }} onDoubleClick={(e) => { e.stopPropagation(); focusNode(id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inspectNode(id); } }}>
                      <rect width={COMPACT_W} height={COMPACT_H} rx={3} fill="var(--surface-2)" stroke={isFocused ? color : 'var(--border-subtle)'} strokeWidth={isFocused ? 2 : 0.8} /><rect width={2} height={COMPACT_H} rx={1} fill={color} /><text x={8} y={13} fontSize="9" fontFamily="JetBrains Mono, monospace" fill={color}>{id.replace('experiments/', '')}</text><text x={8} y={24} fontSize="8" fill="var(--text)">{truncate(node.label, 14)}</text>
                    </g>);
                    return (<g key={id} transform={`translate(${p.x - NODE_W / 2},${p.y - NODE_H / 2})`} opacity={nodeOpacity} className="cursor-pointer" role="button" tabIndex={0}
                      aria-label={`${node.kind} ${id.replace('experiments/', '')}: ${node.label}`} aria-selected={isSelected}
                      onClick={(e) => { e.stopPropagation(); inspectNode(id); }} onDoubleClick={(e) => { e.stopPropagation(); focusNode(id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inspectNode(id); } }}>
                      <rect width={NODE_W} height={NODE_H} rx={3} fill="var(--surface-2)" stroke={isFocused ? color : isSelected ? color : 'var(--border-subtle)'} strokeWidth={isFocused ? 2.5 : isSelected ? 2 : 0.8} /><rect width={3} height={NODE_H} rx={1.5} fill={color} />
                      <text x={12} y={18} fontSize="10" fontFamily="JetBrains Mono, monospace" fill={color}>{id.replace('experiments/', '')}</text><text x={12} y={32} fontSize="9" fill="var(--text)">{truncate(node.label, 22)}</text>{hopDist <= 1 && <text x={12} y={42} fontSize="7" fontFamily="JetBrains Mono, monospace" fill="var(--text-muted)">{node.sub}</text>}
                    </g>);
                  })}
                </g>
              </svg>
            )}
            <div className="absolute bottom-4 right-4 flex gap-1 z-10"><IconButton icon={Minus} label="Zoom out" onClick={() => zoom(-1)} /><IconButton icon={Plus} label="Zoom in" onClick={() => zoom(1)} /><IconButton icon={Maximize2} label="Fit to view" onClick={fitView} />{!isFilterDefault && (<IconButton icon={RotateCcw} label="Reset filters" onClick={() => { setActiveEdgeTypes(new Set(edgeTypes)); setActiveKinds(new Set(DEFAULT_KINDS)); fitView(); }} />)}</div>
            {filtered.nodeIds.size > 0 && !isMobile && (<MiniMap nodeIds={filtered.nodeIds} layout={layout} rootId={focusId} mode={exploredCluster ? 'neighborhood' : scope} />)}
            {!instructionsDismissed ? (<div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-sm border border-border-subtle bg-surface/80 px-2.5 py-1.5 backdrop-blur font-mono text-[9px] text-text-muted">drag to pan · scroll to zoom · click to inspect<button type="button" onClick={dismissInstructions} className="flex size-5 items-center justify-center rounded-sm text-text-muted hover:text-text" aria-label="Dismiss instructions"><X className="size-3" /></button></div>) : (
              <button type="button" onClick={dismissInstructions} className="absolute bottom-4 left-4 z-10 size-7 rounded-sm border border-border-subtle bg-surface/60 font-mono text-[11px] text-text-muted hover:text-text backdrop-blur" aria-label="Show help" title="Show graph interaction help">?</button>
            )}
          </div>
        ) : (
          /* ── List view ── */
          <div className="min-h-0 flex-1 flex flex-col">
            {exploredCluster && (<div className="flex items-center gap-2 border-b border-border-subtle bg-surface/80 px-4 py-2"><span className="font-mono text-[10px] text-text-muted">Cluster: {exploredCluster.label} · {exploredCluster.nodeCount} nodes</span><button type="button" onClick={goBackFocus} className="ml-auto font-mono text-[10px] text-text-muted hover:text-text transition-colors">Back to graph</button></div>)}
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border-subtle bg-surface/80 px-4 py-1.5 min-h-9">
              <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted">Sort</span>
              {(['default', 'type', 'label', 'edges'] as SortKey[]).map((s) => (
                <button key={s} type="button" onClick={() => handleListSort(s)}
                  className={cn('rounded-sm px-1.5 py-0.5 font-mono text-[10px] transition-colors inline-flex items-center gap-0.5', listSort === s ? 'bg-brand-muted text-brand' : 'text-text-muted hover:text-text')}>
                  {SORT_LABELS[s]}
                  {listSort === s && (listSortDir === 'asc' ? <ArrowUp className="size-2.5" /> : <ArrowDown className="size-2.5" />)}
                </button>
              ))}
              <span className="ml-auto font-mono text-[9px] text-text-muted tabular-nums">{filtered.nodeIds.size} nodes</span>
            </div>
            <div className="min-h-0 flex-1 overflow-auto" role="region" aria-label="Relationship list">
              {filtered.nodeIds.size === 0 ? <EmptyState title="No nodes match current filters" hint="Adjust filters to see relationships." /> : (
                <div className="divide-y divide-border-subtle">{sortedList.map((id) => { const node = graphNodes.get(id)!; const isSel = selectedId === id; const incident = filtered.edges.filter((e) => e.src === id || e.dst === id); const color = KIND_COLOR[node.kind]; let parts: { text: string; highlight: boolean }[] = [{ text: node.label, highlight: false }]; if (search.trim()) { const idx = node.label.toLowerCase().indexOf(search.toLowerCase()); if (idx >= 0) parts = [{ text: node.label.slice(0, idx), highlight: false }, { text: node.label.slice(idx, idx + search.length), highlight: true }, { text: node.label.slice(idx + search.length), highlight: false }]; }
                  return (<button key={id} type="button" onClick={() => inspectNode(id)} className={cn('flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-2', isSel && 'bg-surface-2')} aria-current={isSel ? 'true' : undefined}><span className="mt-0.5 size-2 shrink-0 rounded-full" style={{ background: color }} /><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><MonoId className={cn('text-[11px]', node.kind === 'experiment' ? 'text-info' : 'text-brand')}>{id.replace('experiments/', '')}</MonoId><span className="font-mono text-[9px] uppercase text-text-muted">{node.kind}</span><span className="ml-auto font-mono text-[9px] text-text-muted tabular-nums">{incident.length} edge{incident.length !== 1 ? 's' : ''}</span></div><div className="mt-0.5 text-[12px] text-text-secondary">{parts.map((p, i) => p.highlight ? <mark key={i} className="bg-brand-muted text-text rounded-sm px-0.5">{p.text}</mark> : <span key={i}>{p.text}</span>)}</div><div className="mt-1 flex flex-wrap gap-1">{incident.slice(0, 3).map((ed, i) => { const other = ed.src === id ? ed.dst : ed.src; return <span key={i} className="rounded-sm border border-border-subtle bg-surface px-1 py-0.5 font-mono text-[9px] text-text-muted">{ed.edgeType} → {other.replace('experiments/', '')}</span>; })}</div></div></button>); })}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedCluster && !inspectedId && (<ResponsiveInspectorOverlay isOpen={true} onDismiss={() => setSelectedCluster(null)}><ClusterInspector cluster={selectedCluster} onClose={() => setSelectedCluster(null)} onExplore={exploreCluster} onViewAsList={viewClusterAsList} /></ResponsiveInspectorOverlay>)}
      {inspectedId && (() => { const node = graphNodes.get(inspectedId); if (!node) return null; return (<ResponsiveInspectorOverlay isOpen={true} onDismiss={() => setInspectedId(null)}><NodeInspector node={node} incident={filtered.edges.filter((e) => e.src === inspectedId || e.dst === inspectedId)} onClose={() => setInspectedId(null)} onFocus={() => focusNode(inspectedId)} onPickNode={focusNode} navigate={navigate} /></ResponsiveInspectorOverlay>); })()}
    </div>
  );
}

function MiniMap({ nodeIds, layout, rootId, mode }: { nodeIds: Set<string>; layout: Map<string, Pos>; rootId: string; mode: string }) {
  const W = 120; const H = 80;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const id of nodeIds) { const p = layout.get(id); if (!p) continue; minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
  const pad = 30; const sx = maxX - minX + pad * 2 || 1; const sy = maxY - minY + pad * 2 || 1;
  const s = Math.min(W / sx, H / sy); const ox = (W - sx * s) / 2 - (minX - pad) * s; const oy = (H - sy * s) / 2 - (minY - pad) * s;
  return (<div className="absolute right-3 top-3 overflow-hidden rounded-sm border border-border-subtle bg-surface/80 backdrop-blur hidden sm:block"><div className="border-b border-border-subtle px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-text-muted">Minimap</div><svg width={W} height={H}>{[...nodeIds].map((id) => { const p = layout.get(id); const n = graphNodes.get(id); if (!p || !n) return null; return <circle key={id} cx={p.x * s + ox} cy={p.y * s + oy} r={mode === 'neighborhood' && id === rootId ? 2.5 : 1.5} fill={KIND_COLOR[n.kind]} />; })}</svg></div>);
}

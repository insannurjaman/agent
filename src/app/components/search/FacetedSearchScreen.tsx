import { useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, X, ChevronDown, ChevronUp, FileText, Share2, GitBranch, SlidersHorizontal } from 'lucide-react';
import {
  findings,
  openQuestions,
  experiments,
  facetDimensions,
  getFindingById,
} from '../../data';
import type { Finding, OpenQuestion, Experiment } from '../../data';
import { ScreenHeader, MonoId } from '../common/primitives';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { AskClaudeButton, NavActionButton } from '../common/AskClaudeActions';
import { SegmentedControl } from '../common/SegmentedControl';
import { IconButton } from '../common/IconButton';
import { ResponsiveInspectorOverlay } from '../responsive/ResponsiveInspectorOverlay';
import { Drawer } from '../responsive/Drawer';
import { cn } from '../ui/utils';

type ResultKind = 'finding' | 'question' | 'experiment';
type ResultType = 'all' | 'finding' | 'question' | 'experiment';
type SortKey = 'date' | 'confidence' | 'priority' | 'relevance';

interface Result {
  kind: ResultKind;
  id: string;
  title: string;
  facets: string[];
  matched: string[];
  source: string;
  badge: string;
  date: string;
}

function experimentFacets(e: Experiment): string[] {
  const set = new Set<string>();
  for (const fid of e.relatedFindings) getFindingById(fid)?.facets.forEach((f) => set.add(f));
  return [...set];
}

const DEFAULT_LIMIT = 6;
const SORT_LABELS: Record<SortKey, string> = { date: 'Date', confidence: 'Confidence', priority: 'Priority', relevance: 'Relevance' };

function highlightText(text: string, query: string): { text: string; highlight: boolean }[] {
  if (!query.trim()) return [{ text, highlight: false }];
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return [{ text, highlight: false }];
  return [
    { text: text.slice(0, idx), highlight: false },
    { text: text.slice(idx, idx + query.length), highlight: true },
    { text: text.slice(idx + query.length), highlight: false },
  ];
}

export function FacetedSearchScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [mobileFacetsOpen, setMobileFacetsOpen] = useState(false);
  const [resultType, setResultType] = useState<ResultType>('all');
  const [sort, setSort] = useState<SortKey>('date');

  const toggleFacet = useCallback((key: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; }), []);

  const matchesFacets = (facets: string[]) => {
    if (selected.size === 0) return true;
    const byDim = new Map<string, string[]>();
    for (const key of selected) {
      const dim = key.split(':')[0];
      if (!byDim.has(dim)) byDim.set(dim, []);
      byDim.get(dim)!.push(key);
    }
    for (const [, keys] of byDim) {
      if (!keys.some((k) => facets.includes(k))) return false;
    }
    return true;
  };

  const matchesQuery = (text: string) => query.trim() === '' ? true : text.toLowerCase().includes(query.toLowerCase());
  const matchedFacetsOf = (facets: string[]) => facets.filter((f) => selected.has(f));

  // Build all results
  const allResults = useMemo<{ findings: Result[]; questions: Result[]; experiments: Result[] }>(() => {
    const fRes: Result[] = []; const qRes: Result[] = []; const eRes: Result[] = [];
    for (const f of findings as Finding[]) {
      if (!matchesFacets(f.facets)) continue;
      if (!matchesQuery(`${f.id} ${f.title} ${f.summary}`)) continue;
      fRes.push({ kind: 'finding', id: f.id, title: f.title, facets: f.facets, matched: matchedFacetsOf(f.facets), source: f.evidence, badge: f.confidence, date: f.date });
    }
    for (const q of openQuestions as OpenQuestion[]) {
      if (!matchesFacets(q.facets)) continue;
      if (!matchesQuery(`${q.id} ${q.title} ${q.detail}`)) continue;
      qRes.push({ kind: 'question', id: q.id, title: q.title, facets: q.facets, matched: matchedFacetsOf(q.facets), source: q.area, badge: q.status, date: q.raisedDate });
    }
    for (const e of experiments as Experiment[]) {
      const facets = experimentFacets(e);
      if (!matchesFacets(facets)) continue;
      if (!matchesQuery(`${e.slug} ${e.title} ${e.conclusions.join(' ')}`)) continue;
      eRes.push({ kind: 'experiment', id: e.slug, title: e.title, facets, matched: matchedFacetsOf(facets), source: e.slug, badge: e.outdated ? 'outdated' : e.reportStatus, date: e.date });
    }
    return { findings: fRes, questions: qRes, experiments: eRes };
  }, [query, selected]);

  // Default recent results (when no query or facets)
  const defaultResults = useMemo(() => {
    if (query || selected.size > 0) return null;
    return {
      findings: [...findings].sort((a, b) => b.date.localeCompare(a.date)).slice(0, DEFAULT_LIMIT).map((f) => ({
        kind: 'finding' as ResultKind, id: f.id, title: f.title, facets: f.facets, matched: [] as string[], source: f.evidence, badge: f.confidence, date: f.date,
      })),
      questions: [...openQuestions].sort((a, b) => b.raisedDate.localeCompare(a.raisedDate)).slice(0, DEFAULT_LIMIT).map((q) => ({
        kind: 'question' as ResultKind, id: q.id, title: q.title, facets: q.facets, matched: [] as string[], source: q.area, badge: q.status, date: q.raisedDate,
      })),
      experiments: [...experiments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, DEFAULT_LIMIT).map((e) => ({
        kind: 'experiment' as ResultKind, id: e.slug, title: e.title, facets: experimentFacets(e), matched: [] as string[], source: e.slug, badge: e.outdated ? 'outdated' : e.reportStatus, date: e.date,
      })),
    };
  }, [query, selected]);

  // Determine which results to show and sort them
  const visibleResults = useMemo(() => {
    const source = defaultResults || allResults;
    let combined: Result[] = [];
    if (resultType === 'all' || resultType === 'finding') combined = [...combined, ...source.findings];
    if (resultType === 'all' || resultType === 'question') combined = [...combined, ...source.questions];
    if (resultType === 'all' || resultType === 'experiment') combined = [...combined, ...source.experiments];

    const CONFIDENCE_RANK: Record<string, number> = { high: 5, 'medium-high': 4, medium: 3, low: 2, superseded: 1 };
    const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const STATUS_RANK: Record<string, number> = { open: 3, 'in-progress': 2, 'partial-progress': 2, resolved: 1 };

    switch (sort) {
      case 'confidence':
        combined.sort((a, b) => (CONFIDENCE_RANK[b.badge] || 0) - (CONFIDENCE_RANK[a.badge] || 0) || b.date.localeCompare(a.date));
        break;
      case 'priority':
        combined.sort((a, b) => (PRIORITY_RANK[b.badge] || STATUS_RANK[b.badge] || 0) - (PRIORITY_RANK[a.badge] || STATUS_RANK[a.badge] || 0) || b.date.localeCompare(a.date));
        break;
      case 'relevance':
        combined.sort((a, b) => {
          const aMatch = a.matched.length; const bMatch = b.matched.length;
          if (aMatch !== bMatch) return bMatch - aMatch;
          if (query) { const aIdx = a.title.toLowerCase().indexOf(query.toLowerCase()); const bIdx = b.title.toLowerCase().indexOf(query.toLowerCase()); if (aIdx !== bIdx) return (aIdx >= 0 ? aIdx : 999) - (bIdx >= 0 ? bIdx : 999); }
          return b.date.localeCompare(a.date);
        });
        break;
      default:
        combined.sort((a, b) => b.date.localeCompare(a.date));
    }
    return combined;
  }, [allResults, defaultResults, resultType, sort, query]);

  // Facet counts: full dataset when no filters, tab-aware filtered counts when query/selection active
  const facetCounts = useMemo(() => {
    const source = defaultResults ? [...allResults.findings, ...allResults.questions, ...allResults.experiments] : visibleResults;
    const counts = new Map<string, number>();
    for (const dim of facetDimensions) {
      for (const term of dim.terms) {
        const key = `${dim.id}:${term}`;
        let count = 0;
        for (const r of source) {
          if (r.facets.includes(key)) count++;
        }
        counts.set(key, count);
      }
    }
    return counts;
  }, [visibleResults, allResults, defaultResults]);

  const total = visibleResults.length;
  const hasActiveQuery = query.trim() !== '' || selected.size > 0;
  const isDefault = !hasActiveQuery;

  // Counts per type for the result-type tabs
  const typeCounts = useMemo(() => {
    const src = defaultResults || allResults;
    return { all: src.findings.length + src.questions.length + src.experiments.length, finding: src.findings.length, question: src.questions.length, experiment: src.experiments.length };
  }, [allResults, defaultResults]);

  // Group selected facets by dimension for display
  const selectedByDim = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const key of selected) {
      const dim = key.split(':')[0];
      if (!map.has(dim)) map.set(dim, []);
      map.get(dim)!.push(key);
    }
    return map;
  }, [selected]);

  return (
    <div className="flex h-full">
      {/* Left facet panel — desktop */}
      <div className="hidden lg:flex">
        <FacetPanel selected={selected} onToggle={toggleFacet} onClear={() => setSelected(new Set())} facetCounts={facetCounts} />
      </div>

      {/* Mobile facet drawer */}
      <Drawer open={mobileFacetsOpen} onClose={() => setMobileFacetsOpen(false)} side="left" width="w-full sm:w-[360px]" ariaLabel="Filter facets">
        <FacetPanel selected={selected} onToggle={toggleFacet} onClear={() => setSelected(new Set())} facetCounts={facetCounts} />
      </Drawer>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <ScreenHeader title="Faceted Search" subtitle="Search across findings, open questions, and experiments using controlled vocabulary." />

        {/* Mobile: search + filters button */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface px-4 py-2.5 sm:px-6 lg:hidden">
          <button type="button" onClick={() => setMobileFacetsOpen(true)}
            className="flex min-h-11 items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-3 font-mono text-[12px] text-text-secondary hover:text-text"
            aria-label={`Filter facets${selected.size > 0 ? `, ${selected.size} selected` : ''}`}>
            <SlidersHorizontal className="size-4" /> Filters{selected.size > 0 && ` (${selected.size})`}
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 h-11 px-2.5 focus-within:border-brand-border">
            <Search className="size-3.5 shrink-0 text-text-muted" />
            <input aria-label="Search by topic" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Topic — e.g. bend rate, entry temperature…"
              className="w-full bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted" />
          </div>
        </div>

        {/* Desktop: search + result type + sort */}
        <div className="hidden flex-wrap items-center gap-2 border-b border-border-subtle bg-surface px-6 py-2.5 lg:flex">
          <div className="flex flex-1 items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 h-11 px-2.5 focus-within:border-brand-border max-w-[480px]">
            <Search className="size-3.5 shrink-0 text-text-muted" />
            <input aria-label="Search knowledge" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search knowledge by topic — e.g. bend rate, entry temperature…"
              className="w-full bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted" />
            {query && <button type="button" onClick={() => setQuery('')} className="flex size-6 items-center justify-center rounded-sm text-text-muted hover:text-text" aria-label="Clear search"><X className="size-3.5" /></button>}
          </div>

          {/* Result type tabs (compact) */}
          <SegmentedControl compact segments={[
            { id: 'all', label: 'All', count: typeCounts.all },
            { id: 'finding', label: 'Findings', count: typeCounts.finding },
            { id: 'question', label: 'Questions', count: typeCounts.question },
            { id: 'experiment', label: 'Experiments', count: typeCounts.experiment },
          ]} value={resultType} onChange={(v) => setResultType(v as ResultType)} />

          {/* Sort */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 rounded-sm border border-border-subtle bg-surface-2 px-2 font-mono text-[11px] text-text outline-none cursor-pointer" aria-label="Sort results">
              {(['date', 'confidence', 'priority', 'relevance'] as SortKey[]).map((s) => (<option key={s} value={s}>{SORT_LABELS[s]}</option>))}
            </select>
          </div>
        </div>

        {/* Active filter summary */}
        {selected.size > 0 && (
          <div className="sticky top-0 z-10 border-b border-border-subtle bg-surface/90 backdrop-blur px-6 py-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{selected.size} filter{selected.size !== 1 ? 's' : ''} · AND across groups</span>
              {hasActiveQuery && <span className="font-mono text-[10px] text-text-muted">· {total} result{total !== 1 ? 's' : ''}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[...selectedByDim.entries()].map(([dim, keys]) => (
                <div key={dim} className="flex items-center gap-1">
                  {keys.map((k) => {
                    const term = k.split(':')[1];
                    return (
                      <span key={k} className="inline-flex items-center gap-1 rounded-sm border border-brand-border bg-brand-muted/30 px-1.5 py-0.5 font-mono text-[10px] text-brand">
                        <span className="text-text-muted">{dim}:</span>{term}
                        <button type="button" onClick={() => toggleFacet(k)} aria-label={`Remove ${dim}:${term}`} className="ml-0.5 rounded-sm p-0.5 text-text-muted hover:text-text"><X className="size-2.5" /></button>
                      </span>
                    );
                  })}
                </div>
              ))}
              <button type="button" onClick={() => setSelected(new Set())} className="font-mono text-[10px] text-text-muted hover:text-text ml-1">Clear all</button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6">
          {/* Mobile result type */}
          <div className="flex flex-wrap items-center gap-2 mb-3 lg:hidden">
            <SegmentedControl compact segments={[
              { id: 'all', label: 'All', count: typeCounts.all },
              { id: 'finding', label: 'Findings', count: typeCounts.finding },
              { id: 'question', label: 'Questions', count: typeCounts.question },
              { id: 'experiment', label: 'Experiments', count: typeCounts.experiment },
            ]} value={resultType} onChange={(v) => setResultType(v as ResultType)} />
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 rounded-sm border border-border-subtle bg-surface-2 px-2 font-mono text-[11px] text-text outline-none cursor-pointer ml-auto" aria-label="Sort results">
              {(['date', 'confidence', 'priority', 'relevance'] as SortKey[]).map((s) => (<option key={s} value={s}>{SORT_LABELS[s]}</option>))}
            </select>
          </div>

          {isDefault ? (
            // Default: show recent records
            <>
              <p className="font-mono text-[10px] text-text-muted mb-3">Showing recent records. Select facets or enter a topic to narrow.</p>
              <div className="space-y-5">
                {defaultResults && defaultResults.findings.length > 0 && (
                  <ResultGroup label="Findings" count={defaultResults.findings.length}>
                    {defaultResults.findings.map((r) => <ResultRow key={r.id} r={r} selected={selectedResult?.id === r.id} onSelect={() => setSelectedResult(r)} />)}
                  </ResultGroup>
                )}
                {defaultResults && defaultResults.questions.length > 0 && (
                  <ResultGroup label="Open Questions" count={defaultResults.questions.length}>
                    {defaultResults.questions.map((r) => <ResultRow key={r.id} r={r} selected={selectedResult?.id === r.id} onSelect={() => setSelectedResult(r)} />)}
                  </ResultGroup>
                )}
                {defaultResults && defaultResults.experiments.length > 0 && (
                  <ResultGroup label="Experiments" count={defaultResults.experiments.length}>
                    {defaultResults.experiments.map((r) => <ResultRow key={r.id} r={r} selected={selectedResult?.id === r.id} onSelect={() => setSelectedResult(r)} />)}
                  </ResultGroup>
                )}
              </div>
            </>
          ) : total === 0 ? (
            <EmptyState title="No results match current filters" hint="Adjust facets or broaden your search terms.">
              {selected.size > 0 && <button type="button" onClick={() => setSelected(new Set())} className="mt-2 text-[12px] text-brand hover:underline">Clear filters</button>}
              {query && <button type="button" onClick={() => setQuery('')} className="mt-2 text-[12px] text-brand hover:underline ml-3">Clear search</button>}
            </EmptyState>
          ) : (
            /* Active results */
            <div className="space-y-5" role="region" aria-label={`${total} search results`} aria-live="polite">
              {resultType === 'all' || resultType === 'finding' ? (
                (() => {
                  const items = visibleResults.filter((r) => r.kind === 'finding');
                  if (items.length === 0) return null;
                  return (<ResultGroup label="Findings" count={items.length}>{items.map((r) => <ResultRow key={r.id} r={r} selected={selectedResult?.id === r.id} onSelect={() => setSelectedResult(r)} query={query} />)}</ResultGroup>);
                })()
              ) : null}
              {resultType === 'all' || resultType === 'question' ? (
                (() => {
                  const items = visibleResults.filter((r) => r.kind === 'question');
                  if (items.length === 0) return null;
                  return (<ResultGroup label="Open Questions" count={items.length}>{items.map((r) => <ResultRow key={r.id} r={r} selected={selectedResult?.id === r.id} onSelect={() => setSelectedResult(r)} query={query} />)}</ResultGroup>);
                })()
              ) : null}
              {resultType === 'all' || resultType === 'experiment' ? (
                (() => {
                  const items = visibleResults.filter((r) => r.kind === 'experiment');
                  if (items.length === 0) return null;
                  return (<ResultGroup label="Experiments" count={items.length}>{items.map((r) => <ResultRow key={r.id} r={r} selected={selectedResult?.id === r.id} onSelect={() => setSelectedResult(r)} query={query} />)}</ResultGroup>);
                })()
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Result inspector */}
      {selectedResult && (
        <ResponsiveInspectorOverlay isOpen={true} onDismiss={() => setSelectedResult(null)}>
          <ResultInspector result={selectedResult} onClose={() => setSelectedResult(null)} navigate={navigate} />
        </ResponsiveInspectorOverlay>
      )}
    </div>
  );
}

// ── FacetPanel ──────────────────────────────────────────────────────────
function FacetPanel({ selected, onToggle, onClear, facetCounts }: {
  selected: Set<string>; onToggle: (k: string) => void; onClear: () => void; facetCounts: Map<string, number>;
}) {
  const [within, setWithin] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set());

  // Auto-expand dimensions that have selected terms
  const effectiveOpen = useMemo(() => {
    const next = new Set(open);
    for (const key of selected) { const dim = key.split(':')[0]; next.add(dim); }
    return next;
  }, [open, selected]);

  const toggleOpen = (id: string) => setOpen((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-border-subtle bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h2 className="text-[14px] text-text">Facets</h2>
        {selected.size > 0 && (
          <button type="button" onClick={onClear} className="font-mono text-[11px] text-text-muted hover:text-text">Clear all</button>
        )}
      </div>
      <div className="border-b border-border-subtle px-3 py-2">
        <div className="flex items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1.5 focus-within:border-brand-border transition-colors">
          <Search className="size-3.5 shrink-0 text-text-muted" />
          <input aria-label="Filter available facets" value={within} onChange={(e) => setWithin(e.target.value)}
            placeholder="Filter available facets…"
            className="w-full bg-transparent text-[12px] text-text outline-none placeholder:text-text-muted" />
          {within && <button type="button" onClick={() => setWithin('')} className="flex size-5 items-center justify-center rounded-sm text-text-muted hover:text-text" aria-label="Clear facet filter"><X className="size-3" /></button>}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {facetDimensions.map((dim) => {
          const terms = dim.terms.filter((t) => t.toLowerCase().includes(within.toLowerCase()));
          if (terms.length === 0) return null;
          const isOpen = effectiveOpen.has(dim.id);
          const selCount = [...selected].filter((k) => k.startsWith(dim.id + ':')).length;
          return (
            <div key={dim.id} className="mb-1">
              <button type="button" aria-expanded={isOpen} onClick={() => toggleOpen(dim.id)}
                className="flex w-full items-center justify-between rounded-sm px-2 py-2 min-h-9 hover:bg-surface-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">{dim.label}</span>
                  {selCount > 0 && <span className="rounded-sm border border-brand-border bg-brand-muted px-1 font-mono text-[9px] text-brand tabular-nums">{selCount}</span>}
                </div>
                {isOpen ? <ChevronUp className="size-3 text-text-muted" /> : <ChevronDown className="size-3 text-text-muted" />}
              </button>
              {isOpen && (
                <div className="mt-0.5 space-y-0.5 pl-1">
                  {terms.map((term) => {
                    const key = `${dim.id}:${term}`;
                    const checked = selected.has(key);
                    const count = facetCounts.get(key) ?? 0;
                    return (
                      <button key={key} type="button" role="checkbox" aria-checked={checked}
                        onClick={() => onToggle(key)}
                        className={cn('flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left hover:bg-surface-2', count === 0 && !checked && 'opacity-40')}>
                        <span className={cn('flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border', checked ? 'border-brand bg-brand-muted' : 'border-border-strong')}>
                          {checked && <span className="size-1.5 rounded-[1px] bg-brand" />}
                        </span>
                        <span className={cn('font-mono text-[12px]', checked ? 'text-text' : 'text-text-secondary')}>{term}</span>
                        <span className="ml-auto font-mono text-[10px] text-text-muted tabular-nums">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ── ResultGroup ─────────────────────────────────────────────────────────
function ResultGroup({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-text-muted">{label}</h3>
        <span className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 font-mono text-[10px] text-text-muted tabular-nums">{count}</span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

// ── ResultRow ──────────────────────────────────────────────────────────
function ResultRow({ r, selected, onSelect, query: searchQuery }: { r: Result; selected: boolean; onSelect: () => void; query?: string }) {
  const idColor = r.kind === 'finding' ? 'text-brand' : r.kind === 'question' ? 'text-amber' : 'text-info';
  const titleParts = highlightText(r.title, searchQuery || '');

  const summary = (() => {
    if (r.kind === 'finding') { const f = findings.find((x) => x.id === r.id); return f ? f.summary.slice(0, 100) : ''; }
    if (r.kind === 'question') { const q = openQuestions.find((x) => x.id === r.id); return q ? q.detail.split('| Date:')[0].trim().slice(0, 100) : ''; }
    const e = experiments.find((x) => x.slug === r.id); return e ? e.conclusions.join(', ').slice(0, 100) : '';
  })();

  return (
    <button type="button" onClick={onSelect}
      className={cn('w-full rounded-sm border px-3 py-2.5 text-left transition-colors',
        selected ? 'border-brand-border bg-brand-muted/30' : 'border-border-subtle bg-surface hover:border-border-strong hover:bg-surface-2')}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('shrink-0 font-mono text-[12px]', idColor)}>{r.id.replace('experiments/', '')}</span>
          <span className="truncate text-[13px] text-text">
            {titleParts.map((p, i) => p.highlight ? <mark key={i} className="bg-brand-muted text-text rounded-sm px-0.5">{p.text}</mark> : <span key={i}>{p.text}</span>)}
          </span>
        </div>
        <StatusBadge value={r.badge} showDot={false} />
      </div>
      {summary && <p className="mt-1 text-[12px] text-text-secondary leading-relaxed line-clamp-2">{summary}</p>}
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {r.matched.length > 0 ? r.matched.slice(0, 4).map((f) => (
          <span key={f} className="rounded-sm border border-brand-border bg-brand-muted px-1 py-0.5 font-mono text-[10px] text-brand">{f}</span>
        )) : r.facets.slice(0, 2).map((f) => (
          <span key={f} className="rounded-sm border border-border-subtle bg-surface-2 px-1 py-0.5 font-mono text-[10px] text-text-muted">{f}</span>
        ))}
        {r.matched.length > 4 && <span className="font-mono text-[10px] text-text-muted">+{r.matched.length - 4} more</span>}
        <span className="ml-auto font-mono text-[10px] text-text-muted">{r.source.replace('experiments/', '')}</span>
      </div>
    </button>
  );
}

// ── ResultInspector ─────────────────────────────────────────────────────
function ResultInspector({ result, onClose, navigate }: { result: Result; onClose: () => void; navigate: (to: string) => void }) {
  const Sec = ({ children }: { children: React.ReactNode }) => (<div className="mt-5 mb-2 font-mono text-[11px] uppercase tracking-wider text-text-muted first:mt-0">{children}</div>);
  const tablePath = result.kind === 'question' ? `/findings?tab=questions&focus=${result.id}` : result.kind === 'finding' ? `/findings?focus=${result.id}` : `/experiments/${result.id}`;

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">{result.kind}</span>
          <MonoId className={result.kind === 'experiment' ? 'text-info' : 'text-brand'}>{result.id.replace('experiments/', '')}</MonoId>
        </div>
        <IconButton icon={X} label="Close" onClick={onClose} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        <h3 className="text-[15px] leading-snug text-text">{result.title}</h3>
        <div className="mt-2"><StatusBadge value={result.badge} /></div>

        <Sec>Matching Facets</Sec>
        <div className="flex flex-wrap gap-1.5">
          {(result.matched.length ? result.matched : result.facets).map((f) => (
            <span key={f} className={cn('rounded-sm border px-1.5 py-0.5 font-mono text-[11px]', result.matched.includes(f) ? 'border-brand-border bg-brand-muted text-brand' : 'border-border-subtle bg-surface-2 text-text-secondary')}>{f}</span>
          ))}
        </div>

        <Sec>Source / Evidence</Sec>
        <MonoId className="text-info">{result.source}</MonoId>

        <Sec>Date</Sec>
        <MonoId>{result.date}</MonoId>

        <Sec>Actions</Sec>
        <div className="flex flex-col gap-2">
          <NavActionButton onClick={() => navigate(tablePath)}><FileText className="size-3.5" /> Open detail</NavActionButton>
          {result.kind !== 'question' && (
            <NavActionButton onClick={() => navigate(result.kind === 'experiment' ? `/experiments/${result.id}` : `/experiments/${result.source}`)}>
              <FileText className="size-3.5" /> View evidence report
            </NavActionButton>
          )}
          <NavActionButton onClick={() => navigate(`/graph?focus=${result.id}`)}><Share2 className="size-3.5" /> View node in graph</NavActionButton>
          {result.kind === 'finding' && <NavActionButton onClick={() => navigate(`/lineage?focus=${result.id}`)}><GitBranch className="size-3.5" /> Trace lineage</NavActionButton>}
          <AskClaudeButton onClick={() => navigate(`/chat?ctx=${result.id}`)}>Ask Claude about this result</AskClaudeButton>
        </div>
      </div>
    </aside>
  );
}

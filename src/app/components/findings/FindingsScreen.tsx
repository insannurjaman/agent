import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { findings as allFindings, openQuestions as allQuestions } from '../../data';
import type { Finding, OpenQuestion } from '../../data';
import { ScreenHeader } from '../common/primitives';
import { StatusBadge } from '../common/StatusBadge';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { EmptyState } from '../common/EmptyState';
import { FilterSelect } from '../common/FilterSelect';
import { SegmentedControl } from '../common/SegmentedControl';
import { SummaryMetrics } from '../common/SummaryMetrics';
import { FilterChips } from '../common/FilterChips';
import { ResponsiveInspectorOverlay } from '../responsive/ResponsiveInspectorOverlay';
import { FindingInspector, QuestionInspector } from './Inspectors';
import { FindingRow } from './FindingRow';
import { QuestionRow } from './QuestionRow';
import { SectionHeading } from './SectionHeading';
import { mapActionableToState } from '../common/ActionStateBadge';
import { isDateInThisWeek, countThisWeek } from './dateUtils';
import { cn } from '../ui/utils';

type DatasetType = 'all' | 'findings' | 'questions';
type SortKey = 'date' | 'confidence' | 'priority';
type Density = 'comfortable' | 'compact';
type DateRange = 'this-week' | undefined;

interface QueryState {
  dataset: DatasetType;
  search: string;
  sort: SortKey;
  density: Density;
  dateRange: DateRange;
  findingFilters: {
    confidence: string;
    action: string;
    category: string;
  };
  questionFilters: {
    status: string;
    priority: string;
    area: string;
  };
}

const CONFIDENCE_RANK: Record<string, number> = {
  high: 5, 'medium-high': 4, medium: 3, low: 2, superseded: 1,
};
const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

const CATEGORIES = ['all', ...new Set(allFindings.map((f) => f.category))] as string[];
const AREAS = ['all', ...new Set(allQuestions.map((q) => q.area))] as string[];
const PRIORITIES = ['all', 'high', 'medium', 'low'] as string[];

type ActiveMetricId = 'action-required' | 'high-confidence' | 'high-priority' | 'new-this-week' | 'recently-resolved' | null;

type FilterChip = { group: string; key: string; label: string; value: string };

// ── Dynamic Action options ──────────────────────────────────────────────

function getAvailableActionOptions(findings: Finding[]): string[] {
  const present = new Set<string>();
  present.add('all');
  for (const f of findings) {
    present.add(mapActionableToState(f.actionable, f.confidence));
  }
  return ACTION_ORDER.filter((a) => present.has(a));
}

const ACTION_ORDER = ['all', 'action-required', 'review-recommended', 'no-action', 'blocked'] as const;

const CHIP_LABELS: Record<string, Record<string, string>> = {
  confidence: { high: 'High', 'medium-high': 'Med-High', medium: 'Medium', low: 'Low', superseded: 'Superseded' },
  status: { open: 'Open', 'in-progress': 'In Progress', 'partial-progress': 'Partial', resolved: 'Resolved' },
  priority: { high: 'High', medium: 'Medium', low: 'Low' },
  category: { factor: 'Factor', schema: 'Schema', 'data-quality': 'Data Quality', process: 'Process', hypothesis: 'Hypothesis', 'anomaly-pattern': 'Anomaly', method: 'Method' },
  area: { rolling: 'Rolling', 'data-quality': 'Data Quality', 'surface-quality': 'Surface Quality' },
  action: { 'action-required': 'Required', 'review-recommended': 'Review', 'no-action': 'No Action', blocked: 'Blocked' },
  dateRange: { 'this-week': 'This week' },
};

function chipDisplayValue(key: string, value: string): string {
  return CHIP_LABELS[key]?.[value] ?? value;
}

// ── Helpers ───────────────────────────────────────────────────────────

function isMetricActive(query: QueryState): ActiveMetricId {
  if (query.dateRange === 'this-week') return 'new-this-week';
  if (query.findingFilters.action === 'action-required') return 'action-required';
  if (query.findingFilters.confidence === 'high') return 'high-confidence';
  if (query.questionFilters.priority === 'high') return 'high-priority';
  if (query.questionFilters.status === 'resolved') return 'recently-resolved';
  return null;
}

function buildFilterChips(query: QueryState): FilterChip[] {
  const chips: FilterChip[] = [];

  if (query.dateRange === 'this-week') {
    chips.push({ group: 'shared', key: 'dateRange', label: 'Date', value: chipDisplayValue('dateRange', 'this-week') });
  }
  if (query.dataset !== 'questions') {
    const f = query.findingFilters;
    if (f.confidence !== 'all') chips.push({ group: 'findings', key: 'confidence', label: 'Confidence', value: chipDisplayValue('confidence', f.confidence) });
    if (f.action !== 'all') chips.push({ group: 'findings', key: 'action', label: 'Action', value: chipDisplayValue('action', f.action) });
    if (f.category !== 'all') chips.push({ group: 'findings', key: 'category', label: 'Category', value: chipDisplayValue('category', f.category) });
  }
  if (query.dataset !== 'findings') {
    const q = query.questionFilters;
    if (q.status !== 'all') chips.push({ group: 'questions', key: 'status', label: 'Status', value: chipDisplayValue('status', q.status) });
    if (q.priority !== 'all') chips.push({ group: 'questions', key: 'priority', label: 'Priority', value: chipDisplayValue('priority', q.priority) });
    if (q.area !== 'all') chips.push({ group: 'questions', key: 'area', label: 'Area', value: chipDisplayValue('area', q.area) });
  }
  return chips;
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={cn('border-b border-border-strong px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted', className)}>
      {children}
    </th>
  );
}

function FindingCard({ f, onSelect }: { f: Finding; onSelect: () => void }) {
  const superseded = f.confidence === 'superseded' || !!f.supersededBy;
  return (
    <button type="button" onClick={onSelect} className={cn('w-full rounded-sm border border-border-subtle bg-surface px-3 py-2.5 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background', superseded && 'opacity-60')}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] text-text">{f.id}</span>
        <span className="font-mono text-[10px] text-text-muted">{f.date}</span>
      </div>
      <div className="mt-1 text-[14px] leading-snug text-text line-clamp-2">{f.title}</div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {f.confidence === 'superseded' ? <StatusBadge value="superseded" /> : <ConfidenceIndicator level={f.confidence as 'high' | 'medium-high' | 'medium' | 'low'} />}
        <StatusBadge value={f.category} showDot={false} />
        {f.actionable && <StatusBadge value="action required" tone="brand" />}
      </div>
    </button>
  );
}

function QuestionCard({ q, onSelect }: { q: OpenQuestion; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="w-full rounded-sm border border-border-subtle bg-surface px-3 py-2.5 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] text-amber">{q.id}</span>
        <span className="font-mono text-[10px] text-text-muted">{q.raisedDate}</span>
      </div>
      <div className="mt-1 text-[14px] leading-snug text-text line-clamp-2">{q.title}</div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StatusBadge value={q.status} />
        <span className="font-mono text-[10px] text-text-muted">{q.area}</span>
      </div>
    </button>
  );
}

function initQueryState(): QueryState {
  let d: Density = 'compact';
  try { const s = localStorage.getItem('findings-density'); if (s === 'comfortable' || s === 'compact') d = s; } catch {}
  return {
    dataset: 'all',
    search: '',
    sort: 'date',
    density: d,
    dateRange: undefined,
    findingFilters: { confidence: 'all', action: 'all', category: 'all' },
    questionFilters: { status: 'all', priority: 'all', area: 'all' },
  };
}

export function FindingsScreen() {
  const [query, setQueryRaw] = useState<QueryState>(initQueryState);
  const [selected, setSelected] = useState<{ kind: 'f' | 'q'; id: string } | null>(null);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const moreFiltersTriggerRef = useRef<HTMLButtonElement>(null);
  const moreFiltersPanelRef = useRef<HTMLDivElement>(null);

  const updateQuery = useCallback((partial: Partial<QueryState>) => {
    setQueryRaw(prev => ({ ...prev, ...partial }));
  }, []);

  const updateFindingFilter = useCallback((key: string, value: string) => {
    setQueryRaw(prev => ({
      ...prev,
      findingFilters: { ...prev.findingFilters, [key]: value },
    }));
  }, []);

  const updateQuestionFilter = useCallback((key: string, value: string) => {
    setQueryRaw(prev => ({
      ...prev,
      questionFilters: { ...prev.questionFilters, [key]: value },
    }));
  }, []);

  useEffect(() => {
    try { localStorage.setItem('findings-density', query.density); } catch {}
  }, [query.density]);

  // ── Tab switching ─────────────────────────────────────────────────
  const switchDataset = useCallback((dataset: DatasetType) => {
    setQueryRaw(prev => {
      const next: QueryState = {
        ...prev,
        dataset,
        findingFilters: { ...prev.findingFilters },
        questionFilters: { ...prev.questionFilters },
      };
      if (dataset === 'findings') {
        next.questionFilters = { status: 'all', priority: 'all', area: 'all' };
        if (prev.sort === 'priority') next.sort = 'date';
      } else if (dataset === 'questions') {
        next.findingFilters = { confidence: 'all', action: 'all', category: 'all' };
        if (prev.sort === 'confidence') next.sort = 'date';
      }
      return next;
    });
    setSelected(null);
  }, []);

  // ── Metric click ──────────────────────────────────────────────────
  const handleMetricClick = useCallback((id: string) => {
    setQueryRaw(prev => {
      const already = isMetricActive(prev) === id;
      if (already) {
        const cleared: QueryState = {
          ...prev,
          findingFilters: { ...prev.findingFilters },
          questionFilters: { ...prev.questionFilters },
        };
        switch (id) {
          case 'action-required': cleared.findingFilters.action = 'all'; break;
          case 'high-confidence': cleared.findingFilters.confidence = 'all'; break;
          case 'high-priority': cleared.questionFilters.priority = 'all'; break;
          case 'new-this-week': cleared.dateRange = undefined; break;
          case 'recently-resolved': cleared.questionFilters.status = 'all'; break;
        }
        return cleared;
      }
      const applied: QueryState = {
        ...prev,
        findingFilters: { ...prev.findingFilters },
        questionFilters: { ...prev.questionFilters },
      };
      switch (id) {
        case 'action-required':
          applied.dataset = 'findings';
          applied.findingFilters.action = 'action-required';
          applied.findingFilters.confidence = 'all';
          applied.findingFilters.category = 'all';
          applied.questionFilters = { status: 'all', priority: 'all', area: 'all' };
          applied.dateRange = undefined;
          break;
        case 'high-confidence':
          applied.dataset = 'findings';
          applied.findingFilters.confidence = 'high';
          applied.findingFilters.action = 'all';
          applied.findingFilters.category = 'all';
          applied.questionFilters = { status: 'all', priority: 'all', area: 'all' };
          applied.dateRange = undefined;
          break;
        case 'high-priority':
          applied.dataset = 'questions';
          applied.questionFilters.priority = 'high';
          applied.questionFilters.status = 'all';
          applied.questionFilters.area = 'all';
          applied.findingFilters = { confidence: 'all', action: 'all', category: 'all' };
          applied.dateRange = undefined;
          break;
        case 'new-this-week':
          applied.dataset = 'all';
          applied.dateRange = 'this-week';
          applied.sort = 'date';
          applied.findingFilters = { confidence: 'all', action: 'all', category: 'all' };
          applied.questionFilters = { status: 'all', priority: 'all', area: 'all' };
          break;
        case 'recently-resolved':
          applied.dataset = 'questions';
          applied.questionFilters.status = 'resolved';
          applied.questionFilters.priority = 'all';
          applied.questionFilters.area = 'all';
          applied.findingFilters = { confidence: 'all', action: 'all', category: 'all' };
          applied.dateRange = undefined;
          break;
      }
      return applied;
    });
    setSelected(null);
  }, []);

  // ── Chip remove ────────────────────────────────────────────────────
  const handleRemoveChip = useCallback((key: string) => {
    switch (key) {
      case 'dateRange': setQueryRaw(prev => ({ ...prev, dateRange: undefined })); break;
      case 'confidence': updateFindingFilter('confidence', 'all'); break;
      case 'action': updateFindingFilter('action', 'all'); break;
      case 'category': updateFindingFilter('category', 'all'); break;
      case 'status': updateQuestionFilter('status', 'all'); break;
      case 'priority': updateQuestionFilter('priority', 'all'); break;
      case 'area': updateQuestionFilter('area', 'all'); break;
    }
  }, [updateFindingFilter, updateQuestionFilter]);

  const clearSearch = useCallback(() => {
    updateQuery({ search: '' });
  }, [updateQuery]);

  const clearFilters = useCallback(() => {
    setQueryRaw(prev => ({
      ...prev,
      dateRange: undefined,
      findingFilters: { confidence: 'all', action: 'all', category: 'all' },
      questionFilters: { status: 'all', priority: 'all', area: 'all' },
    }));
  }, []);

  const clearSearchAndFilters = useCallback(() => {
    setQueryRaw(prev => ({
      ...prev,
      search: '',
      dateRange: undefined,
      findingFilters: { confidence: 'all', action: 'all', category: 'all' },
      questionFilters: { status: 'all', priority: 'all', area: 'all' },
    }));
  }, []);

  // ── Derived state ──────────────────────────────────────────────────
  const activeMetric = isMetricActive(query);
  const filterChips = buildFilterChips(query);
  const hasActiveFilters = filterChips.length > 0;
  const hasActiveSearch = query.search.trim().length > 0;
  const hasActiveQuery = hasActiveFilters || hasActiveSearch;

  const ACTION_OPTIONS = useMemo(() => getAvailableActionOptions(allFindings), []);

  const matchQ = (text: string) => text.toLowerCase().includes(query.search.toLowerCase());

  const visibleFindings = useMemo(() => {
    if (query.dataset === 'questions') return [];
    let rows = allFindings.filter((f) => matchQ(f.title) || matchQ(f.id) || matchQ(f.summary));
    const f = query.findingFilters;
    if (f.confidence !== 'all') rows = rows.filter(r => r.confidence === f.confidence);
    if (f.category !== 'all') rows = rows.filter(r => r.category === f.category);
    if (f.action !== 'all') rows = rows.filter(r => mapActionableToState(r.actionable, r.confidence) === f.action);
    if (query.dateRange === 'this-week') rows = rows.filter(r => isDateInThisWeek(r.date));
    return [...rows].sort((a, b) =>
      query.sort === 'confidence'
        ? CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence]
        : b.date.localeCompare(a.date),
    );
  }, [query.dataset, query.search, query.sort, query.findingFilters, query.dateRange]);

  const visibleQuestions = useMemo(() => {
    if (query.dataset === 'findings') return [];
    let rows = allQuestions.filter((q) => matchQ(q.title) || matchQ(q.id) || matchQ(q.detail));
    const q = query.questionFilters;
    if (q.status !== 'all') rows = rows.filter(r => r.status === q.status);
    if (q.priority !== 'all') rows = rows.filter(r => r.priority === q.priority);
    if (q.area !== 'all') rows = rows.filter(r => r.area === q.area);
    if (query.dateRange === 'this-week') rows = rows.filter(r => isDateInThisWeek(r.raisedDate));
    return [...rows].sort((a, b) =>
      query.sort === 'priority'
        ? PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]
        : b.raisedDate.localeCompare(a.raisedDate),
    );
  }, [query.dataset, query.search, query.sort, query.questionFilters, query.dateRange]);

  const selectedFinding = selected?.kind === 'f' ? allFindings.find(f => f.id === selected.id) : undefined;
  const selectedQuestion = selected?.kind === 'q' ? allQuestions.find(q => q.id === selected.id) : undefined;

  const totalRows = visibleFindings.length + visibleQuestions.length;

  const tabsConfig = [
    { id: 'all' as DatasetType, label: 'All', count: allFindings.length + allQuestions.length },
    { id: 'findings' as DatasetType, label: 'Findings', count: allFindings.length },
    { id: 'questions' as DatasetType, label: 'Open Questions', count: allQuestions.length },
  ];

  const ALL_VIEW_LIMIT = 6;
  const displayFindings = query.dataset === 'all' ? visibleFindings.slice(0, ALL_VIEW_LIMIT) : visibleFindings;
  const displayQuestions = query.dataset === 'all' ? visibleQuestions.slice(0, ALL_VIEW_LIMIT) : visibleQuestions;
  const hasMoreFindings = query.dataset === 'all' && visibleFindings.length > ALL_VIEW_LIMIT;
  const hasMoreQuestions = query.dataset === 'all' && visibleQuestions.length > ALL_VIEW_LIMIT;

  const sortOptions: readonly string[] = useMemo(() => {
    if (query.dataset === 'findings') return ['date', 'confidence'];
    if (query.dataset === 'questions') return ['date', 'priority'];
    return ['date', 'confidence', 'priority'];
  }, [query.dataset]);

  // ── More Filters popover keyboard/focus ────────────────────────────
  const closeMoreFilters = useCallback(() => {
    setMoreFiltersOpen(false);
    requestAnimationFrame(() => moreFiltersTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!moreFiltersOpen) return;
    const panel = moreFiltersPanelRef.current;
    if (!panel) return;
    const firstInput = panel.querySelector<HTMLElement>('select, button, input, a');
    requestAnimationFrame(() => firstInput?.focus());
  }, [moreFiltersOpen]);

  useEffect(() => {
    if (!moreFiltersOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMoreFilters();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [moreFiltersOpen, closeMoreFilters]);

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <ScreenHeader title="Findings & Open Questions" subtitle="Browse accumulated findings and unresolved issues from knowledge/*.csv." />

        <SummaryMetrics findings={allFindings} questions={allQuestions} activeMetricId={activeMetric} onMetricClick={handleMetricClick} />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface px-6 py-2.5">
          {/* Search */}
          <div className="flex h-11 min-w-[200px] flex-1 items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2.5 focus-within:border-brand-border transition-colors lg:min-w-[260px]">
            <Search className="size-3.5 shrink-0 text-text-muted" />
            <input
              value={query.search}
              onChange={(e) => updateQuery({ search: e.target.value })}
              placeholder="Search IDs, titles, summaries…"
              aria-label="Search findings and questions"
              className="w-full bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
            />
            {query.search && (
              <button type="button" onClick={() => updateQuery({ search: '' })} className="flex size-6 items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors" aria-label="Clear search">
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <SegmentedControl
            segments={tabsConfig.map(t => ({ id: t.id, label: t.label, count: t.count }))}
            value={query.dataset}
            onChange={(id) => switchDataset(id as DatasetType)}
            className="w-auto shrink-0"
          />

          {/* Filters area */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {query.dataset === 'findings' && (
              <>
                <FilterSelect label="Confidence" value={query.findingFilters.confidence} onChange={(v) => updateFindingFilter('confidence', v)} options={['all', 'high', 'medium-high', 'medium', 'low', 'superseded']} />
                <FilterSelect label="Action" value={query.findingFilters.action} onChange={(v) => updateFindingFilter('action', v)} options={ACTION_OPTIONS} />
                <FilterSelect label="Category" value={query.findingFilters.category} onChange={(v) => updateFindingFilter('category', v)} options={CATEGORIES} />
              </>
            )}
            {query.dataset === 'questions' && (
              <>
                <FilterSelect label="Status" value={query.questionFilters.status} onChange={(v) => updateQuestionFilter('status', v)} options={['all', 'open', 'in-progress', 'partial-progress', 'resolved']} />
                <FilterSelect label="Priority" value={query.questionFilters.priority} onChange={(v) => updateQuestionFilter('priority', v)} options={PRIORITIES} />
                <FilterSelect label="Area" value={query.questionFilters.area} onChange={(v) => updateQuestionFilter('area', v)} options={AREAS} />
              </>
            )}
            {query.dataset === 'all' && (
              <>
                <FilterSelect label="Attention" value={
                  query.findingFilters.action !== 'all' ? query.findingFilters.action :
                  query.questionFilters.status !== 'all' ? query.questionFilters.status :
                  query.findingFilters.confidence !== 'all' ? query.findingFilters.confidence :
                  'all'} onChange={(v) => {
                  if (v === 'action-required') { updateFindingFilter('action', v); }
                  else if (v === 'resolved') { updateQuestionFilter('status', v); }
                  else if (v === 'high' || v === 'all') { updateFindingFilter('confidence', v); }
                }} options={['all', 'action-required', 'high', 'resolved']} />

                {/* More Filters popover */}
                <div className="relative">
                  <button
                    ref={moreFiltersTriggerRef}
                    type="button"
                    onClick={() => setMoreFiltersOpen(v => !v)}
                    aria-expanded={moreFiltersOpen}
                    aria-controls="more-filters-panel"
                    aria-haspopup="true"
                    className={cn(
                      'flex h-11 items-center gap-1.5 rounded-sm border px-2.5 font-mono text-[11px] transition-colors cursor-pointer',
                      'focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      moreFiltersOpen ? 'border-brand-border bg-brand-muted text-brand' : 'border-border-subtle bg-surface-2 text-text-muted hover:text-text-secondary',
                    )}
                  >
                    More filters
                    <ChevronDown className="size-3" />
                  </button>
                  {moreFiltersOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={closeMoreFilters} aria-hidden="true" />
                      <div
                        id="more-filters-panel"
                        ref={moreFiltersPanelRef}
                        role="region"
                        aria-label="More filters"
                        className="absolute right-0 top-full z-20 mt-1 w-[280px] rounded-sm border border-border-subtle bg-surface shadow-xl"
                      >
                        <div className="px-3 py-2 border-b border-border-subtle">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Findings</span>
                          <div className="mt-1.5 flex flex-col gap-1.5">
                            <FilterSelect label="Confidence" value={query.findingFilters.confidence} onChange={(v) => updateFindingFilter('confidence', v)} options={['all', 'high', 'medium-high', 'medium', 'low', 'superseded']} />
                            <FilterSelect label="Action" value={query.findingFilters.action} onChange={(v) => updateFindingFilter('action', v)} options={ACTION_OPTIONS} />
                            <FilterSelect label="Category" value={query.findingFilters.category} onChange={(v) => updateFindingFilter('category', v)} options={CATEGORIES} />
                          </div>
                        </div>
                        <div className="px-3 py-2">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Questions</span>
                          <div className="mt-1.5 flex flex-col gap-1.5">
                            <FilterSelect label="Status" value={query.questionFilters.status} onChange={(v) => updateQuestionFilter('status', v)} options={['all', 'open', 'in-progress', 'partial-progress', 'resolved']} />
                            <FilterSelect label="Priority" value={query.questionFilters.priority} onChange={(v) => updateQuestionFilter('priority', v)} options={PRIORITIES} />
                            <FilterSelect label="Area" value={query.questionFilters.area} onChange={(v) => updateQuestionFilter('area', v)} options={AREAS} />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            <FilterSelect label="Sort" value={query.sort} onChange={(v) => updateQuery({ sort: v as SortKey })} options={sortOptions} />

            <div className="flex h-11 items-center rounded-sm border border-border-subtle bg-surface-2 p-0.5" role="radiogroup" aria-label="Table density">
              <button type="button" role="radio" aria-checked={query.density === 'compact'} onClick={() => updateQuery({ density: 'compact' })}
                className={cn('flex h-10 items-center rounded-sm px-2.5 font-mono text-[11px] transition-colors', query.density === 'compact' ? 'bg-background text-foreground shadow-sm' : 'text-text-muted hover:text-text-secondary', 'focus-visible:ring-2 focus-visible:ring-brand-ring')}>
                Compact
              </button>
              <button type="button" role="radio" aria-checked={query.density === 'comfortable'} onClick={() => updateQuery({ density: 'comfortable' })}
                className={cn('flex h-10 items-center rounded-sm px-2.5 font-mono text-[11px] transition-colors', query.density === 'comfortable' ? 'bg-background text-foreground shadow-sm' : 'text-text-muted hover:text-text-secondary', 'focus-visible:ring-2 focus-visible:ring-brand-ring')}>
                Comfortable
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {filterChips.length > 0 && (
          <FilterChips chips={filterChips} onRemove={handleRemoveChip} onClearAll={clearFilters} />
        )}

        {/* Onboarding */}
        <div className="hidden border-b border-border-subtle bg-surface px-6 py-1.5 lg:block">
          <span className="font-mono text-[11px] text-text-muted">Select a row to inspect evidence, lineage, and Claude actions.</span>
        </div>

        <div aria-live="polite" aria-atomic="true" className="sr-only">{totalRows} result{totalRows !== 1 ? 's' : ''} found</div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-auto">
          {totalRows === 0 && hasActiveQuery ? (
            <EmptyState icon={Search} title="No matching findings or questions" hint="Adjust search terms or clear filters to view all findings.">
              {hasActiveFilters && hasActiveSearch && (
                <button type="button" onClick={clearSearchAndFilters} className="mt-2 text-[12px] text-brand hover:underline">Clear search and filters</button>
              )}
              {hasActiveFilters && !hasActiveSearch && (
                <button type="button" onClick={clearFilters} className="mt-2 text-[12px] text-brand hover:underline">Clear filters</button>
              )}
              {!hasActiveFilters && hasActiveSearch && (
                <button type="button" onClick={clearSearch} className="mt-2 text-[12px] text-brand hover:underline">Clear search</button>
              )}
            </EmptyState>
          ) : totalRows === 0 && !hasActiveQuery ? (
            <EmptyState icon={Search} title="No findings yet" hint="Findings are registered through Claude-mediated knowledge workflows." />
          ) : (
            <>
              <div className="flex flex-col gap-2 p-3 lg:hidden">
                {visibleFindings.length > 0 && (
                  <div className="font-mono text-[12px] font-semibold uppercase tracking-wider text-text-muted px-1 pb-1">Findings · {visibleFindings.length}</div>
                )}
                {visibleFindings.map(f => <FindingCard key={f.id} f={f} onSelect={() => setSelected({ kind: 'f', id: f.id })} />)}
                {visibleQuestions.length > 0 && (
                  <div className="font-mono text-[12px] font-semibold uppercase tracking-wider text-text-muted px-1 pb-1 pt-3">Open Questions · {visibleQuestions.length}</div>
                )}
                {visibleQuestions.map(q => <QuestionCard key={q.id} q={q} onSelect={() => setSelected({ kind: 'q', id: q.id })} />)}
              </div>

              <div className="hidden lg:block">
                {displayFindings.length > 0 && (
                  <div>
                    <SectionHeading title="Findings" count={visibleFindings.length} hasMore={hasMoreFindings} onViewAll={() => switchDataset('findings')} />
                    <table className="w-full border-collapse text-[13px]" aria-label="Findings">
                      <thead className="sticky top-0 z-10 bg-surface"><tr>
                        <Th className="w-20">ID</Th>
                        <Th className="min-w-[200px] xl:min-w-[320px]">Title</Th>
                        <Th className="hidden xl:table-cell">Category</Th>
                        <Th>Confidence</Th>
                        <Th>Action</Th>
                        <Th className="hidden lg:table-cell">Date</Th>
                        <Th className="w-10" />
                      </tr></thead>
                      <tbody>{displayFindings.map(f => (
                        <FindingRow key={f.id} f={f} selected={selected?.kind === 'f' && selected.id === f.id} density={query.density} onSelect={() => setSelected({ kind: 'f', id: f.id })} />
                      ))}</tbody>
                    </table>
                  </div>
                )}

                {query.dataset === 'all' && displayFindings.length > 0 && displayQuestions.length > 0 && (
                  <div className="border-b-2 border-border-strong" />
                )}

                {displayQuestions.length > 0 && (
                  <div>
                    <SectionHeading title="Open Questions" count={visibleQuestions.length} hasMore={hasMoreQuestions} onViewAll={() => switchDataset('questions')} />
                    <table className="w-full border-collapse text-[13px]" aria-label="Open questions">
                      <thead className="sticky top-0 z-10 bg-surface"><tr>
                        <Th className="w-20">ID</Th>
                        <Th className="min-w-[200px] xl:min-w-[320px]">Question</Th>
                        <Th>Status</Th>
                        <Th>Priority</Th>
                        <Th className="hidden xl:table-cell">Area</Th>
                        <Th className="hidden lg:table-cell">Date</Th>
                        <Th className="w-10" />
                      </tr></thead>
                      <tbody>{displayQuestions.map(q => (
                        <QuestionRow key={q.id} q={q} selected={selected?.kind === 'q' && selected.id === q.id} density={query.density} onSelect={() => setSelected({ kind: 'q', id: q.id })} />
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ResponsiveInspectorOverlay isOpen={!!(selectedFinding || selectedQuestion)} onDismiss={() => setSelected(null)}>
        {selectedFinding && <FindingInspector finding={selectedFinding} onClose={() => setSelected(null)} />}
        {selectedQuestion && <QuestionInspector question={selectedQuestion} onClose={() => setSelected(null)} />}
      </ResponsiveInspectorOverlay>
    </div>
  );
}

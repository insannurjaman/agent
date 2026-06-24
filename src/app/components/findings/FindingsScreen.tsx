import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { Search, X } from 'lucide-react';
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
import { cn } from '../ui/utils';

type Tab = 'all' | 'findings' | 'questions';
type Sort = 'date' | 'confidence' | 'priority';
type Density = 'comfortable' | 'compact';

const CONFIDENCE_RANK: Record<string, number> = {
  high: 5,
  'medium-high': 4,
  medium: 3,
  low: 2,
  superseded: 1,
};
const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

const CATEGORIES = ['all', ...new Set(allFindings.map((f) => f.category))] as string[];
const AREAS = ['all', ...new Set(allQuestions.map((q) => q.area))] as string[];
const PRIORITIES = ['all', 'high', 'medium', 'low'] as string[];
const ACTION_OPTIONS = ['all', 'action-required', 'review-recommended', 'no-action', 'blocked'] as string[];

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-border-strong px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted',
        className,
      )}
    >
      {children}
    </th>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <tr key={i} className="h-[42px] border-b border-border-subtle animate-pulse">
          <td className="px-3 py-2">
            <div className="h-3 w-16 rounded-sm bg-surface-2" />
          </td>
          <td className="px-3 py-2">
            <div className="h-3 w-64 rounded-sm bg-surface-2" />
          </td>
          <td className="px-3 py-2">
            <div className="h-4 w-20 rounded-sm bg-surface-2" />
          </td>
          <td className="px-3 py-2">
            <div className="h-4 w-24 rounded-sm bg-surface-2" />
          </td>
          <td className="px-3 py-2">
            <div className="h-4 w-32 rounded-sm bg-surface-2" />
          </td>
          <td className="px-3 py-2">
            <div className="h-4 w-20 rounded-sm bg-surface-2" />
          </td>
          <td className="px-1">
            <div className="mx-auto size-8 rounded-sm bg-surface-2" />
          </td>
        </tr>
      ))}
    </>
  );
}

function FindingCard({ f, onSelect }: { f: Finding; onSelect: () => void }) {
  const superseded = f.confidence === 'superseded' || !!f.supersededBy;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-sm border border-border-subtle bg-surface px-3 py-2.5 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        superseded && 'opacity-60',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] text-text">{f.id}</span>
        <span className="font-mono text-[10px] text-text-muted">{f.date}</span>
      </div>
      <div className="mt-1 text-[14px] leading-snug text-text line-clamp-2">{f.title}</div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {f.confidence === 'superseded' ? (
          <StatusBadge value="superseded" />
        ) : (
          <ConfidenceIndicator level={f.confidence as 'high' | 'medium-high' | 'medium' | 'low'} />
        )}
        <StatusBadge value={f.category} showDot={false} />
        {f.actionable && <StatusBadge value="action required" tone="brand" />}
      </div>
    </button>
  );
}

function QuestionCard({ q, onSelect }: { q: OpenQuestion; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-sm border border-border-subtle bg-surface px-3 py-2.5 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
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

export function FindingsScreen() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('date');
  const [confFilter, setConfFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [selected, setSelected] = useState<{ kind: 'f' | 'q'; id: string } | null>(null);
  const [density, setDensity] = useState<Density>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('findings-density') as Density) || 'compact';
    }
    return 'compact';
  });
  const [prevTab, setPrevTab] = useState<Tab>('all');

  // Persist density to localStorage
  useEffect(() => {
    localStorage.setItem('findings-density', density);
  }, [density]);

  // Deep-link support
  useEffect(() => {
    const t = params.get('tab');
    if (t === 'questions' || t === 'findings' || t === 'all') setTab(t);
    const focus = params.get('focus');
    if (focus) {
      if (focus.startsWith('F-')) setSelected({ kind: 'f', id: focus });
      else if (focus.startsWith('Q-')) setSelected({ kind: 'q', id: focus });
    }
    const actionable = params.get('actionable');
    if (actionable === 'true') setActionFilter('action-required');
    const act = params.get('action');
    if (act && ACTION_OPTIONS.includes(act)) setActionFilter(act);
    const conf = params.get('conf');
    if (conf) setConfFilter(conf);
    const status = params.get('status');
    if (status) setStatusFilter(status);
    const sortParam = params.get('sort');
    if (sortParam === 'date' || sortParam === 'confidence' || sortParam === 'priority') setSort(sortParam);
    const cat = params.get('category');
    if (cat && CATEGORIES.includes(cat)) setCategoryFilter(cat);
    const pri = params.get('priority');
    if (pri && PRIORITIES.includes(pri)) setPriorityFilter(pri);
    const area = params.get('area');
    if (area && AREAS.includes(area)) setAreaFilter(area);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear incompatible filters and selection on tab switch
  useEffect(() => {
    if (prevTab !== tab) {
      setSelected(null);
      if (tab === 'findings') {
        setStatusFilter('all');
        setPriorityFilter('all');
        setAreaFilter('all');
        if (sort === 'priority') setSort('date');
      } else if (tab === 'questions') {
        setConfFilter('all');
        setActionFilter('all');
        setCategoryFilter('all');
        if (sort === 'confidence') setSort('date');
      }
      setPrevTab(tab);
    }
  }, [tab, prevTab, sort]);

  const activeMetricId = useMemo(() => {
    if (params.get('actionable') === 'true' || params.get('action') === 'action-required') return 'action-required';
    if (params.get('conf') === 'high') return 'high-confidence';
    if (params.get('priority') === 'high') return 'high-priority';
    if (params.get('sort') === 'date') return 'new-this-week';
    if (params.get('status') === 'resolved') return 'recently-resolved';
    return null;
  }, [params]);

  const matchQ = (text: string) => text.toLowerCase().includes(query.toLowerCase());

  const visibleFindings = useMemo(() => {
    if (tab === 'questions') return [];
    let rows = allFindings.filter((f) => matchQ(f.title) || matchQ(f.id) || matchQ(f.summary));
    if (confFilter !== 'all') rows = rows.filter((f) => f.confidence === confFilter);
    if (categoryFilter !== 'all') rows = rows.filter((f) => f.category === categoryFilter);
    if (actionFilter !== 'all') {
      rows = rows.filter((f) => mapActionableToState(f.actionable, f.confidence) === actionFilter);
    }
    rows = [...rows].sort((a, b) =>
      sort === 'confidence'
        ? CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence]
        : b.date.localeCompare(a.date),
    );
    return rows;
  }, [tab, query, confFilter, categoryFilter, actionFilter, sort]);

  const visibleQuestions = useMemo(() => {
    if (tab === 'findings') return [];
    let rows = allQuestions.filter((q) => matchQ(q.title) || matchQ(q.id) || matchQ(q.detail));
    if (statusFilter !== 'all') rows = rows.filter((q) => q.status === statusFilter);
    if (priorityFilter !== 'all') rows = rows.filter((q) => q.priority === priorityFilter);
    if (areaFilter !== 'all') rows = rows.filter((q) => q.area === areaFilter);
    rows = [...rows].sort((a, b) =>
      sort === 'priority'
        ? PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]
        : b.raisedDate.localeCompare(a.raisedDate),
    );
    return rows;
  }, [tab, query, statusFilter, priorityFilter, areaFilter, sort]);

  const selectedFinding =
    selected?.kind === 'f' ? allFindings.find((f) => f.id === selected.id) : undefined;
  const selectedQuestion =
    selected?.kind === 'q' ? allQuestions.find((q) => q.id === selected.id) : undefined;

  const totalRows = visibleFindings.length + visibleQuestions.length;

  const tabsConfig: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: allFindings.length + allQuestions.length },
    { id: 'findings', label: 'Findings', count: allFindings.length },
    { id: 'questions', label: 'Open Questions', count: allQuestions.length },
  ];

  // In All view, limit rows per section
  const ALL_VIEW_LIMIT = 6;
  const displayFindings = tab === 'all' ? visibleFindings.slice(0, ALL_VIEW_LIMIT) : visibleFindings;
  const displayQuestions = tab === 'all' ? visibleQuestions.slice(0, ALL_VIEW_LIMIT) : visibleQuestions;
  const hasMoreFindings = tab === 'all' && visibleFindings.length > ALL_VIEW_LIMIT;
  const hasMoreQuestions = tab === 'all' && visibleQuestions.length > ALL_VIEW_LIMIT;

  const handleDismissDrawer = useCallback(() => setSelected(null), []);

  const handleTabChange = useCallback((id: string) => setTab(id as Tab), []);

  const handleMetricClick = useCallback((id: string) => {
    switch (id) {
      case 'action-required':
        setActionFilter((prev) => (prev === 'action-required' ? 'all' : 'action-required'));
        setTab('findings');
        break;
      case 'high-confidence':
        setConfFilter((prev) => (prev === 'high' ? 'all' : 'high'));
        setTab('findings');
        break;
      case 'high-priority':
        setPriorityFilter((prev) => (prev === 'high' ? 'all' : 'high'));
        setTab('questions');
        break;
      case 'new-this-week':
        setSort('date');
        break;
      case 'recently-resolved':
        setStatusFilter((prev) => (prev === 'resolved' ? 'all' : 'resolved'));
        setTab('questions');
        break;
    }
  }, []);

  // Contextual filter controls: which FilterSelects to show
  const filterControls = useMemo(() => {
    const controls: { key: string; label: string; value: string; options: readonly string[]; onChange: (v: string) => void }[] = [];
    if (tab !== 'questions') {
      controls.push({ key: 'conf', label: 'Confidence', value: confFilter, options: ['all', 'high', 'medium-high', 'medium', 'low', 'superseded'], onChange: setConfFilter });
      controls.push({ key: 'action', label: 'Action', value: actionFilter, options: ACTION_OPTIONS, onChange: setActionFilter });
      controls.push({ key: 'category', label: 'Category', value: categoryFilter, options: CATEGORIES, onChange: setCategoryFilter });
    }
    if (tab !== 'findings') {
      controls.push({ key: 'status', label: 'Status', value: statusFilter, options: ['all', 'open', 'in-progress', 'partial-progress', 'resolved'], onChange: setStatusFilter });
      controls.push({ key: 'priority', label: 'Priority', value: priorityFilter, options: PRIORITIES, onChange: setPriorityFilter });
      controls.push({ key: 'area', label: 'Area', value: areaFilter, options: AREAS, onChange: setAreaFilter });
    }
    return controls;
  }, [tab, confFilter, actionFilter, categoryFilter, statusFilter, priorityFilter, areaFilter]);

  // Contextual sort options
  const sortOptions: readonly string[] = useMemo(() => {
    if (tab === 'findings') return ['date', 'confidence'];
    if (tab === 'questions') return ['date', 'priority'];
    return ['date', 'confidence', 'priority'];
  }, [tab]);

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Page Header */}
        <ScreenHeader
          title="Findings & Open Questions"
          subtitle="Browse accumulated findings and unresolved issues from knowledge/*.csv."
        />

        {/* Summary Metrics */}
        <SummaryMetrics findings={allFindings} questions={allQuestions} activeMetricId={activeMetricId} onMetricClick={handleMetricClick} />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface px-6 py-2.5">
          {/* Search */}
          <div className="flex h-11 min-w-[240px] flex-1 items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2.5 focus-within:border-brand-border transition-colors lg:min-w-[320px]">
            <Search className="size-3.5 shrink-0 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search IDs, titles, summaries…"
              aria-label="Search findings and questions"
              className="w-full bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="flex size-6 items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Dataset tabs */}
          <SegmentedControl
            segments={tabsConfig.map((t) => ({ id: t.id, label: t.label, count: t.count }))}
            value={tab}
            onChange={handleTabChange}
            className="w-auto shrink-0"
          />

          {/* Contextual filters */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {filterControls.map((ctrl) => (
              <FilterSelect
                key={ctrl.key}
                label={ctrl.label}
                value={ctrl.value}
                onChange={ctrl.onChange}
                options={ctrl.options}
              />
            ))}

            <FilterSelect
              label="Sort"
              value={sort}
              onChange={(v) => setSort(v as Sort)}
              options={sortOptions}
            />

            {/* Density toggle */}
            <button
              type="button"
              role="radio"
              aria-label={`Table density: ${density}`}
              onClick={() => setDensity(density === 'comfortable' ? 'compact' : 'comfortable')}
              className={cn(
                'flex h-11 items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2.5 font-mono text-[11px] text-text-muted transition-colors cursor-pointer',
                'focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'hover:text-text-secondary',
              )}
              title={density === 'comfortable' ? 'Switch to compact density' : 'Switch to comfortable density'}
            >
              {density === 'comfortable' ? 'Comfortable' : 'Compact'}
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        <FilterChips />

        {/* Onboarding helper */}
        <div className="hidden border-b border-border-subtle bg-surface px-6 py-1.5 lg:block">
          <span className="font-mono text-[11px] text-text-muted">
            Select a row to inspect evidence, lineage, and Claude actions.
          </span>
        </div>

        {/* Live region for screen readers */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {totalRows} result{totalRows !== 1 ? 's' : ''} found
        </div>

        {/* Content area */}
        <div className="min-h-0 flex-1 overflow-auto">
          {totalRows === 0 ? (
            <EmptyState
              icon={Search}
              title={query ? 'No matching findings or questions' : 'No findings yet'}
              hint={
                query
                  ? 'Adjust search terms or clear filters to view all findings.'
                  : 'Findings are registered through Claude-mediated knowledge workflows.'
              }
            >
              {(query || actionFilter !== 'all' || confFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all' || areaFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setActionFilter('all');
                    setConfFilter('all');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                    setPriorityFilter('all');
                    setAreaFilter('all');
                  }}
                  className="mt-2 text-[12px] text-brand hover:underline"
                >
                  Clear search and filters
                </button>
              )}
            </EmptyState>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="flex flex-col gap-2 p-3 lg:hidden">
                {visibleFindings.length > 0 && (
                  <div className="font-mono text-[12px] font-semibold uppercase tracking-wider text-text-muted px-1 pb-1">
                    Findings · {visibleFindings.length}
                  </div>
                )}
                {visibleFindings.map((f) => (
                  <FindingCard key={f.id} f={f} onSelect={() => setSelected({ kind: 'f', id: f.id })} />
                ))}
                {visibleQuestions.length > 0 && (
                  <div className="font-mono text-[12px] font-semibold uppercase tracking-wider text-text-muted px-1 pb-1 pt-3">
                    Open Questions · {visibleQuestions.length}
                  </div>
                )}
                {visibleQuestions.map((q) => (
                  <QuestionCard key={q.id} q={q} onSelect={() => setSelected({ kind: 'q', id: q.id })} />
                ))}
              </div>

              {/* Desktop: separate tables per section */}
              <div className="hidden lg:block">
                {/* FINDINGS section */}
                {displayFindings.length > 0 && (
                  <div>
                    <SectionHeading
                      title="Findings"
                      count={visibleFindings.length}
                      hasMore={hasMoreFindings}
                      onViewAll={() => setTab('findings')}
                    />
                    <table className="w-full border-collapse text-[13px]" aria-label="Findings">
                      <thead className="sticky top-0 z-10 bg-surface">
                        <tr>
                          <Th className="w-24">ID</Th>
                          <Th className="min-w-[320px]">Title</Th>
                          <Th>Category</Th>
                          <Th>Confidence</Th>
                          <Th>Action</Th>
                          <Th>Date</Th>
                          <Th className="w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {displayFindings.map((f) => (
                          <FindingRow
                            key={f.id}
                            f={f}
                            selected={selected?.kind === 'f' && selected.id === f.id}
                            density={density}
                            onSelect={() => setSelected({ kind: 'f', id: f.id })}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Separator in All view */}
                {tab === 'all' && displayFindings.length > 0 && displayQuestions.length > 0 && (
                  <div className="border-b-2 border-border-strong" />
                )}

                {/* OPEN QUESTIONS section */}
                {displayQuestions.length > 0 && (
                  <div>
                    <SectionHeading
                      title="Open Questions"
                      count={visibleQuestions.length}
                      hasMore={hasMoreQuestions}
                      onViewAll={() => setTab('questions')}
                    />
                    <table className="w-full border-collapse text-[13px]" aria-label="Open questions">
                      <thead className="sticky top-0 z-10 bg-surface">
                        <tr>
                          <Th className="w-24">ID</Th>
                          <Th className="min-w-[320px]">Question</Th>
                          <Th>Status</Th>
                          <Th>Priority</Th>
                          <Th>Area</Th>
                          <Th>Date</Th>
                          <Th className="w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {displayQuestions.map((q) => (
                          <QuestionRow
                            key={q.id}
                            q={q}
                            selected={selected?.kind === 'q' && selected.id === q.id}
                            density={density}
                            onSelect={() => setSelected({ kind: 'q', id: q.id })}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Inspector overlay */}
      <ResponsiveInspectorOverlay isOpen={!!(selectedFinding || selectedQuestion)} onDismiss={handleDismissDrawer}>
        {selectedFinding && <FindingInspector finding={selectedFinding} onClose={handleDismissDrawer} />}
        {selectedQuestion && <QuestionInspector question={selectedQuestion} onClose={handleDismissDrawer} />}
      </ResponsiveInspectorOverlay>
    </div>
  );
}

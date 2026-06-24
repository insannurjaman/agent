import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, X, Loader2 } from 'lucide-react';
import { findings as allFindings, openQuestions as allQuestions } from '../../data';
import type { Finding, OpenQuestion } from '../../data';
import { ScreenHeader } from '../common/primitives';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
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
          <td className="px-1 text-center">
            <div className="mx-auto size-4 rounded-sm bg-surface-2" />
          </td>
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
          <td className="px-3 py-2">
            <div className="h-3 w-20 rounded-sm bg-surface-2" />
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
        <PriorityBadge priority={q.priority as 'critical' | 'high' | 'medium' | 'low'} />
        <span className="font-mono text-[10px] text-text-muted">{q.area}</span>
      </div>
    </button>
  );
}

export function FindingsScreen() {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('date');
  const [confFilter, setConfFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionableOnly, setActionableOnly] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<{ kind: 'f' | 'q'; id: string } | null>(null);
  const [density, setDensity] = useState<Density>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('findings-density') as Density) || 'compact';
    }
    return 'compact';
  });

  // Persist density to localStorage
  useEffect(() => {
    localStorage.setItem('findings-density', density);
  }, [density]);

  // Deep-link support: ?tab=, ?focus=, ?actionable=, ?conf=, ?status=, ?priority=
  useEffect(() => {
    const t = params.get('tab');
    if (t === 'questions' || t === 'findings' || t === 'all') setTab(t);
    const focus = params.get('focus');
    if (focus) {
      if (focus.startsWith('F-')) setSelected({ kind: 'f', id: focus });
      else if (focus.startsWith('Q-')) setSelected({ kind: 'q', id: focus });
    }
    const actionable = params.get('actionable');
    if (actionable === 'true') setActionableOnly(true);
    const conf = params.get('conf');
    if (conf) setConfFilter(conf);
    const status = params.get('status');
    if (status) setStatusFilter(status);
    const sortParam = params.get('sort');
    if (sortParam === 'date' || sortParam === 'confidence' || sortParam === 'priority') setSort(sortParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matchQ = (text: string) => text.toLowerCase().includes(query.toLowerCase());

  const visibleFindings = useMemo(() => {
    if (tab === 'questions') return [];
    let rows = allFindings.filter((f) => matchQ(f.title) || matchQ(f.id) || matchQ(f.summary));
    if (confFilter !== 'all') rows = rows.filter((f) => f.confidence === confFilter);
    if (actionableOnly) rows = rows.filter((f) => f.actionable);
    rows = [...rows].sort((a, b) =>
      sort === 'confidence'
        ? CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence]
        : b.date.localeCompare(a.date),
    );
    return rows;
  }, [tab, query, confFilter, actionableOnly, sort]);

  const visibleQuestions = useMemo(() => {
    if (tab === 'findings') return [];
    let rows = allQuestions.filter((q) => matchQ(q.title) || matchQ(q.id) || matchQ(q.detail));
    if (statusFilter !== 'all') rows = rows.filter((q) => q.status === statusFilter);
    rows = [...rows].sort((a, b) =>
      sort === 'priority'
        ? PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]
        : b.raisedDate.localeCompare(a.raisedDate),
    );
    return rows;
  }, [tab, query, statusFilter, sort]);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedFinding =
    selected?.kind === 'f' ? allFindings.find((f) => f.id === selected.id) : undefined;
  const selectedQuestion =
    selected?.kind === 'q' ? allQuestions.find((q) => q.id === selected.id) : undefined;

  const totalRows = visibleFindings.length + visibleQuestions.length;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: allFindings.length + allQuestions.length },
    { id: 'findings', label: 'Findings', count: allFindings.length },
    { id: 'questions', label: 'Open Questions', count: allQuestions.length },
  ];

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Page Header */}
        <ScreenHeader
          title="Findings & Open Questions"
          subtitle="Browse accumulated findings and unresolved issues from knowledge/*.csv."
        />

        {/* Summary Metrics */}
        <SummaryMetrics findings={allFindings} questions={allQuestions} />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface px-6 py-2.5">
          {/* Search */}
          <div className="flex h-11 min-w-[320px] items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2.5 focus-within:border-brand-border transition-colors">
            <Search className="size-3.5 shrink-0 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search IDs, titles, summaries, facets, or evidence…"
              aria-label="Search findings by ID, title, summary, facets, or evidence"
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

          {/* Segmented Control */}
          <SegmentedControl
            segments={tabs.map((t) => ({ id: t.id, label: t.label, count: t.count }))}
            value={tab}
            onChange={(id) => setTab(id as Tab)}
            className="w-auto"
          />

          {/* Right side filters */}
          <div className="ml-auto flex items-center gap-2">
            {tab !== 'questions' && (
              <FilterSelect
                label="Confidence"
                value={confFilter}
                onChange={setConfFilter}
                options={['all', 'high', 'medium-high', 'medium', 'low', 'superseded']}
              />
            )}
            {tab !== 'findings' && (
              <FilterSelect
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={['all', 'open', 'in-progress', 'partial-progress', 'resolved']}
              />
            )}
            <FilterSelect
              label="Sort"
              value={sort}
              onChange={(v) => setSort(v as Sort)}
              options={['date', 'confidence', 'priority']}
            />

            {/* Actionable toggle */}
            <button
              type="button"
              role="checkbox"
              aria-checked={actionableOnly}
              aria-label="Show actionable items only"
              onClick={() => setActionableOnly((v) => !v)}
              className={cn(
                'flex h-11 items-center gap-1.5 rounded-sm border px-2.5 font-mono text-[11px] transition-colors cursor-pointer',
                'focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                actionableOnly
                  ? 'border-brand-border bg-brand-muted text-brand'
                  : 'border-border-subtle bg-surface-2 text-text-muted hover:text-text-secondary',
              )}
            >
              {actionableOnly ? (
                <span className="flex size-3.5 items-center justify-center rounded-sm bg-brand text-white">
                  <svg className="size-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                </span>
              ) : (
                <span className="size-3.5 shrink-0 rounded-sm border border-border-strong" />
              )}
              Actionable
            </button>

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

        {/* Table */}
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
              {(query || actionableOnly || confFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setActionableOnly(false);
                    setConfFilter('all');
                    setStatusFilter('all');
                  }}
                  className="mt-2 text-[12px] text-brand hover:underline"
                >
                  Clear search and filters
                </button>
              )}
            </EmptyState>
          ) : (
            <>
              {/* Card list for mobile + tablet portrait (< lg) */}
              <div className="flex flex-col gap-2 p-3 lg:hidden">
                {visibleFindings.map((f) => (
                  <FindingCard key={f.id} f={f} onSelect={() => setSelected({ kind: 'f', id: f.id })} />
                ))}
                {visibleQuestions.map((q) => (
                  <QuestionCard key={q.id} q={q} onSelect={() => setSelected({ kind: 'q', id: q.id })} />
                ))}
              </div>

              {/* Dense table for lg+ */}
              <table className="hidden w-full border-collapse text-[13px] lg:table" aria-label="Findings and open questions">
                <caption className="sr-only">
                  {totalRows} result{totalRows !== 1 ? 's' : ''} found
                </caption>
                {/* FINDINGS */}
                {visibleFindings.length > 0 && (
                  <>
                    {tab === 'all' && (
                      <thead className="sticky top-0 z-10 bg-surface">
                        <tr>
                          <Th colSpan={9} className="py-2">
                            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text">
                              Findings · {visibleFindings.length}
                            </span>
                          </Th>
                        </tr>
                      </thead>
                    )}
                    <thead className="sticky top-0 z-10 bg-surface">
                      <tr>
                        <Th className="w-10" />
                        <Th className="w-24">ID</Th>
                        <Th className="min-w-[320px]">Title</Th>
                        <Th>Category</Th>
                        <Th>Confidence</Th>
                        <Th>Facets</Th>
                        <Th>Action</Th>
                        <Th>Date</Th>
                        <Th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {visibleFindings.map((f) => (
                        <FindingRow
                          key={f.id}
                          f={f}
                          expanded={expanded.has(f.id)}
                          selected={selected?.kind === 'f' && selected.id === f.id}
                          density={density}
                          onToggle={() => toggleExpand(f.id)}
                          onSelect={() => setSelected({ kind: 'f', id: f.id })}
                          onGoLatest={(id) => setSelected({ kind: 'f', id })}
                        />
                      ))}
                    </tbody>
                  </>
                )}

                {/* Separator between groups in All view */}
                {tab === 'all' && visibleFindings.length > 0 && visibleQuestions.length > 0 && (
                  <tbody>
                    <tr>
                      <td colSpan={9} className="border-b-2 border-border-strong" />
                    </tr>
                  </tbody>
                )}

                {/* OPEN QUESTIONS */}
                {visibleQuestions.length > 0 && (
                  <>
                    {tab === 'all' && (
                      <thead className="sticky top-0 z-10 bg-surface">
                        <tr>
                          <Th colSpan={9} className="py-2">
                            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text">
                              Open Questions · {visibleQuestions.length}
                            </span>
                          </Th>
                        </tr>
                      </thead>
                    )}
                    <thead className="sticky top-0 z-10 bg-surface">
                      <tr>
                        <Th className="w-10" />
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
                      {visibleQuestions.map((q) => (
                        <QuestionRow
                          key={q.id}
                          q={q}
                          expanded={expanded.has(q.id)}
                          selected={selected?.kind === 'q' && selected.id === q.id}
                          density={density}
                          onToggle={() => toggleExpand(q.id)}
                          onSelect={() => setSelected({ kind: 'q', id: q.id })}
                        />
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            </>
          )}
        </div>
      </div>

      {(selectedFinding || selectedQuestion) && (
        <ResponsiveInspectorOverlay>
          {selectedFinding && <FindingInspector finding={selectedFinding} onClose={() => setSelected(null)} />}
          {selectedQuestion && <QuestionInspector question={selectedQuestion} onClose={() => setSelected(null)} />}
        </ResponsiveInspectorOverlay>
      )}
    </div>
  );
}
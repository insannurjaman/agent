import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { ChevronRight, Search, MoreHorizontal, ArrowUpRight } from 'lucide-react';
import { findings as allFindings, openQuestions as allQuestions } from '../../data';
import type { Finding, OpenQuestion } from '../../data';
import { getLatestVersion } from '../../data';
import { ScreenHeader } from '../common/primitives';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { FindingInspector, QuestionInspector } from './Inspectors';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../ui/utils';

type Tab = 'all' | 'findings' | 'questions';
type Sort = 'date' | 'confidence' | 'priority';

const CONFIDENCE_RANK: Record<string, number> = {
  high: 5,
  'medium-high': 4,
  medium: 3,
  low: 2,
  superseded: 1,
};
const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

function FacetCells({ facets }: { facets: string[] }) {
  const shown = facets.slice(0, 2);
  const extra = facets.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((f) => (
        <span
          key={f}
          className="rounded-sm border border-border-subtle bg-surface-2 px-1 py-0.5 font-mono text-[10px] text-text-secondary"
        >
          {f}
        </span>
      ))}
      {extra > 0 && <span className="font-mono text-[10px] text-text-muted">+{extra}</span>}
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'border-b border-border-strong px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted',
        className,
      )}
    >
      {children}
    </th>
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

  // Deep-link support: ?tab=, ?focus=
  useEffect(() => {
    const t = params.get('tab');
    if (t === 'questions' || t === 'findings' || t === 'all') setTab(t);
    const focus = params.get('focus');
    if (focus) {
      if (focus.startsWith('F-')) setSelected({ kind: 'f', id: focus });
      else if (focus.startsWith('Q-')) setSelected({ kind: 'q', id: focus });
    }
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
        <ScreenHeader
          title="Findings & Open Questions"
          subtitle="Browse accumulated findings and unresolved issues from knowledge/*.csv."
        />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface px-6 py-2.5">
          <div className="flex w-64 items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2.5 py-1.5 focus-within:border-teal/40">
            <Search className="size-3.5 shrink-0 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search id, title, summary…"
              className="w-full bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
            />
          </div>

          <div className="flex rounded-sm border border-border-subtle bg-surface-2 p-0.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[12px] transition-colors',
                  tab === t.id ? 'bg-elevated text-text' : 'text-text-muted hover:text-text-secondary',
                )}
              >
                {t.label}
                <span className="font-mono text-[10px] text-text-muted">{t.count}</span>
              </button>
            ))}
          </div>

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
            <button
              type="button"
              onClick={() => setActionableOnly((v) => !v)}
              className={cn(
                'rounded-sm border px-2 py-1 font-mono text-[11px] uppercase tracking-wide transition-colors',
                actionableOnly
                  ? 'border-green/40 bg-green/10 text-green'
                  : 'border-border-subtle bg-surface-2 text-text-muted hover:text-text-secondary',
              )}
            >
              Actionable
            </button>
          </div>
        </div>

        {/* Onboarding helper */}
        <div className="hidden border-b border-border-subtle bg-surface px-6 py-1.5 lg:block">
          <span className="font-mono text-[11px] text-text-muted">
            Select a row to inspect evidence, lineage, and Claude actions.
          </span>
        </div>

        {/* Table */}
        <div className="min-h-0 flex-1 overflow-auto">
          {totalRows === 0 ? (
            <EmptyState
              icon={Search}
              title={query ? 'No matching filters' : 'No findings found'}
              hint={
                query
                  ? 'No findings, open questions match the current search and filters.'
                  : 'Adjust filters to see accumulated knowledge.'
              }
            />
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
            <table className="hidden w-full border-collapse text-[13px] lg:table">
              {/* FINDINGS */}
              {visibleFindings.length > 0 && (
                <>
                  <thead className="sticky top-0 z-10 bg-surface">
                    <tr>
                      <Th className="w-8" />
                      <Th className="w-24">ID</Th>
                      <Th className="min-w-[280px]">Title</Th>
                      <Th>Category</Th>
                      <Th>Confidence</Th>
                      <Th>Facets</Th>
                      <Th>Actionable</Th>
                      <Th>Evidence</Th>
                      <Th>Supersedes</Th>
                      <Th>Date</Th>
                      <Th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleFindings.map((f) => (
                      <FindingRow
                        key={f.id}
                        f={f}
                        expanded={expanded.has(f.id)}
                        selected={selected?.kind === 'f' && selected.id === f.id}
                        onToggle={() => toggleExpand(f.id)}
                        onSelect={() => setSelected({ kind: 'f', id: f.id })}
                        onGoLatest={(id) => setSelected({ kind: 'f', id })}
                      />
                    ))}
                  </tbody>
                </>
              )}

              {/* OPEN QUESTIONS */}
              {visibleQuestions.length > 0 && (
                <>
                  <thead className="sticky top-0 z-10 bg-surface">
                    <tr>
                      <Th className="w-8" />
                      <Th className="w-24">ID</Th>
                      <Th className="min-w-[280px]">Title</Th>
                      <Th>Status</Th>
                      <Th>Priority</Th>
                      <Th>Area</Th>
                      <Th>Facets</Th>
                      <Th>Raised By</Th>
                      <Th>Related</Th>
                      <Th>Raised Date</Th>
                      <Th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleQuestions.map((q) => (
                      <QuestionRow
                        key={q.id}
                        q={q}
                        expanded={expanded.has(q.id)}
                        selected={selected?.kind === 'q' && selected.id === q.id}
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
        <div className="fixed inset-0 z-50 lg:static lg:inset-auto lg:z-auto lg:flex">
          {selectedFinding && <FindingInspector finding={selectedFinding} onClose={() => setSelected(null)} />}
          {selectedQuestion && <QuestionInspector question={selectedQuestion} onClose={() => setSelected(null)} />}
        </div>
      )}
    </div>
  );
}

function FindingCard({ f, onSelect }: { f: Finding; onSelect: () => void }) {
  const superseded = f.confidence === 'superseded' || !!f.supersededBy;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-sm border border-border-subtle bg-surface px-3 py-2.5 text-left transition-colors hover:border-border-strong',
        superseded && 'opacity-60',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] text-green">{f.id}</span>
        <span className="font-mono text-[10px] text-text-muted">{f.date}</span>
      </div>
      <div className="mt-1 text-[14px] leading-snug text-text">{f.title}</div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StatusBadge value={f.confidence} />
        <StatusBadge value={f.category} showDot={false} />
        {f.actionable && <span className="font-mono text-[10px] text-green">actionable</span>}
      </div>
    </button>
  );
}

function QuestionCard({ q, onSelect }: { q: OpenQuestion; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-sm border border-border-subtle bg-surface px-3 py-2.5 text-left transition-colors hover:border-border-strong"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] text-amber">{q.id}</span>
        <span className="font-mono text-[10px] text-text-muted">{q.raisedDate}</span>
      </div>
      <div className="mt-1 text-[14px] leading-snug text-text">{q.title}</div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StatusBadge value={q.status} />
        <StatusBadge value={q.priority} showDot={false} />
        <span className="font-mono text-[10px] text-text-muted">{q.area}</span>
      </div>
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[12px] text-text-secondary outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-surface-2 text-text">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function FindingRow({
  f,
  expanded,
  selected,
  onToggle,
  onSelect,
  onGoLatest,
}: {
  f: Finding;
  expanded: boolean;
  selected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onGoLatest: (id: string) => void;
}) {
  const isSuperseded = f.confidence === 'superseded' || !!f.supersededBy;
  return (
    <>
      <tr
        onClick={onSelect}
        className={cn(
          'cursor-pointer border-b border-border-subtle transition-colors hover:bg-surface-2',
          selected && 'bg-surface-2',
          isSuperseded && 'opacity-55',
        )}
      >
        <td className="px-1 text-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="text-text-muted hover:text-text"
          >
            <ChevronRight className={cn('size-4 transition-transform', expanded && 'rotate-90')} />
          </button>
        </td>
        <td className="px-3 py-2">
          <span className="font-mono text-[13px] text-teal">{f.id}</span>
        </td>
        <td className="px-3 py-2 text-text">
          <div className="flex items-center gap-2">
            <span className="line-clamp-1">{f.title}</span>
            {isSuperseded && <StatusBadge value="superseded" showDot={false} />}
          </div>
        </td>
        <td className="px-3 py-2">
          <StatusBadge value={f.category} showDot={false} />
        </td>
        <td className="px-3 py-2">
          <StatusBadge value={f.confidence} />
        </td>
        <td className="px-3 py-2">
          <FacetCells facets={f.facets} />
        </td>
        <td className="px-3 py-2">
          {f.actionable ? (
            <span className="font-mono text-[11px] text-green">yes</span>
          ) : (
            <span className="font-mono text-[11px] text-text-muted">no</span>
          )}
        </td>
        <td className="px-3 py-2">
          <span className="font-mono text-[12px] text-text-secondary">{f.evidence.replace('experiments/', '')}</span>
        </td>
        <td className="px-3 py-2">
          {f.supersedes ? (
            <span className="font-mono text-[12px] text-text-muted">{f.supersedes}</span>
          ) : (
            <span className="text-text-muted">—</span>
          )}
        </td>
        <td className="px-3 py-2">
          <span className="font-mono text-[12px] text-text-muted">{f.date}</span>
        </td>
        <td className="px-1">
          <RowMenu />
        </td>
      </tr>
      {expanded && (
        <tr className={cn('border-b border-border-subtle bg-surface', isSuperseded && 'opacity-70')}>
          <td />
          <td colSpan={10} className="px-3 pb-3 pt-1">
            <p className="max-w-3xl text-[13px] leading-relaxed text-text-secondary">{f.summary}</p>
            {isSuperseded && f.supersededBy && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onGoLatest(getLatestVersion(f.id));
                }}
                className="mt-2 inline-flex items-center gap-1 font-mono text-[12px] text-teal hover:underline"
              >
                Go to Latest Version {getLatestVersion(f.id)} <ArrowUpRight className="size-3" />
              </button>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function QuestionRow({
  q,
  expanded,
  selected,
  onToggle,
  onSelect,
}: {
  q: OpenQuestion;
  expanded: boolean;
  selected: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  return (
    <>
      <tr
        onClick={onSelect}
        className={cn(
          'cursor-pointer border-b border-border-subtle transition-colors hover:bg-surface-2',
          selected && 'bg-surface-2',
        )}
      >
        <td className="px-1 text-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="text-text-muted hover:text-text"
          >
            <ChevronRight className={cn('size-4 transition-transform', expanded && 'rotate-90')} />
          </button>
        </td>
        <td className="px-3 py-2">
          <span className="font-mono text-[13px] text-amber">{q.id}</span>
        </td>
        <td className="px-3 py-2 text-text">
          <span className="line-clamp-1">{q.title}</span>
        </td>
        <td className="px-3 py-2">
          <StatusBadge value={q.status} />
        </td>
        <td className="px-3 py-2">
          <StatusBadge value={q.priority} showDot={false} />
        </td>
        <td className="px-3 py-2">
          <span className="font-mono text-[12px] text-text-secondary">{q.area}</span>
        </td>
        <td className="px-3 py-2">
          <FacetCells facets={q.facets} />
        </td>
        <td className="px-3 py-2">
          <span className="font-mono text-[12px] text-text-muted">{q.raisedBy}</span>
        </td>
        <td className="px-3 py-2">
          <span className="font-mono text-[12px] text-text-secondary">{q.related.length} linked</span>
        </td>
        <td className="px-3 py-2">
          <span className="font-mono text-[12px] text-text-muted">{q.raisedDate}</span>
        </td>
        <td className="px-1">
          <RowMenu isQuestion />
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border-subtle bg-surface">
          <td />
          <td colSpan={10} className="px-3 pb-3 pt-1">
            <p className="max-w-3xl text-[13px] leading-relaxed text-text-secondary">
              {q.detail.split('| Date:')[0].trim()}
            </p>
          </td>
        </tr>
      )}
    </>
  );
}

function RowMenu({ isQuestion }: { isQuestion?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="flex size-6 items-center justify-center rounded-sm text-text-muted hover:text-text"
          aria-label="Row actions"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-mono text-[12px]">
        <DropdownMenuItem>View in Graph</DropdownMenuItem>
        <DropdownMenuItem>View Lineage</DropdownMenuItem>
        <DropdownMenuItem>Copy ID</DropdownMenuItem>
        <DropdownMenuItem className="text-purple">
          {isQuestion ? 'Ask Claude to resolve' : 'Ask Claude about this'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

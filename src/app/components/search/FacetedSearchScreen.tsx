import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, X, ChevronDown, FileText, Share2, GitBranch } from 'lucide-react';
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
import { ResponsiveInspectorOverlay } from '../responsive/ResponsiveInspectorOverlay';
import { cn } from '../ui/utils';

type Mode = 'topic' | 'facet' | 'neighbors' | 'experiment';
type ResultKind = 'finding' | 'question' | 'experiment';

interface Result {
  kind: ResultKind;
  id: string;
  title: string;
  facets: string[];
  matched: string[];
  source: string;
  badge: string;
}

// Experiments inherit facets from their related findings.
function experimentFacets(e: Experiment): string[] {
  const set = new Set<string>();
  for (const fid of e.relatedFindings) getFindingById(fid)?.facets.forEach((f) => set.add(f));
  return [...set];
}

export function FacetedSearchScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('facet');
  const [topic, setTopic] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);

  const toggleFacet = (key: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  // AND across dimensions, OR within a dimension.
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

  const matchesTopic = (text: string) =>
    topic.trim() === '' ? true : text.toLowerCase().includes(topic.toLowerCase());

  const matchedFacetsOf = (facets: string[]) => facets.filter((f) => selected.has(f));

  const results = useMemo<{ findings: Result[]; questions: Result[]; experiments: Result[] }>(() => {
    const fRes: Result[] = [];
    const qRes: Result[] = [];
    const eRes: Result[] = [];

    const includeFindings = mode !== 'experiment';
    const includeQuestions = mode === 'topic' || mode === 'facet';

    if (includeFindings) {
      for (const f of findings as Finding[]) {
        if (!matchesFacets(f.facets)) continue;
        if (!matchesTopic(`${f.id} ${f.title} ${f.summary}`)) continue;
        fRes.push({
          kind: 'finding',
          id: f.id,
          title: f.title,
          facets: f.facets,
          matched: matchedFacetsOf(f.facets),
          source: f.evidence,
          badge: f.confidence,
        });
      }
    }
    if (includeQuestions) {
      for (const q of openQuestions as OpenQuestion[]) {
        if (!matchesFacets(q.facets)) continue;
        if (!matchesTopic(`${q.id} ${q.title} ${q.detail}`)) continue;
        qRes.push({
          kind: 'question',
          id: q.id,
          title: q.title,
          facets: q.facets,
          matched: matchedFacetsOf(q.facets),
          source: q.area,
          badge: q.status,
        });
      }
    }
    for (const e of experiments as Experiment[]) {
      const facets = experimentFacets(e);
      if (!matchesFacets(facets)) continue;
      if (!matchesTopic(`${e.slug} ${e.title} ${e.conclusions.join(' ')}`)) continue;
      eRes.push({
        kind: 'experiment',
        id: e.slug,
        title: e.title,
        facets,
        matched: matchedFacetsOf(facets),
        source: e.slug,
        badge: e.outdated ? 'outdated' : e.reportStatus,
      });
    }
    return { findings: fRes, questions: qRes, experiments: eRes };
  }, [mode, topic, selected]);

  const total = results.findings.length + results.questions.length + results.experiments.length;
  const hasInput = topic.trim() !== '' || selected.size > 0;

  return (
    <div className="flex h-full">
      {/* Left facet panel — hidden below lg */}
      <div className="hidden lg:flex">
        <FacetPanel selected={selected} onToggle={toggleFacet} onClear={() => setSelected(new Set())} />
      </div>

      {/* Main result area */}
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <ScreenHeader
          title="Faceted Search"
          subtitle="Search across findings, open questions, and experiments using controlled vocabulary."
        />

        {/* Search bar + mode selector */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface px-6 py-2.5">
          <div className="flex flex-1 items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2.5 py-1.5 focus-within:border-brand-border">
            <Search className="size-3.5 shrink-0 text-text-muted" />
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic — e.g. bend rate, entry temperature, schema drift…"
              className="w-full bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
            />
          </div>
          <div className="flex rounded-sm border border-border-subtle bg-surface-2 p-0.5">
            {(['topic', 'facet', 'neighbors', 'experiment'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  'rounded-sm px-2.5 py-1 font-mono text-[12px] capitalize transition-colors',
                  mode === m ? 'bg-brand-muted text-brand' : 'text-text-muted hover:text-text-secondary',
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Selected facet summary */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border-subtle bg-surface px-6 py-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
              {selected.size} facets
            </span>
            {[...selected].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => toggleFacet(k)}
                className="flex items-center gap-1 rounded-sm border border-brand-border bg-brand-muted px-1.5 py-0.5 font-mono text-[11px] text-brand hover:bg-brand-surface"
              >
                {k}
                <X className="size-3" />
              </button>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
          {mode === 'neighbors' ? (
            <EmptyState
              icon={Share2}
              title="Neighbors mode runs in the Knowledge Graph"
              hint="Open a node's neighborhood focus view to trace its relationships."
            >
              <NavActionButton onClick={() => navigate('/graph')}>
                <Share2 className="size-3.5" /> Open Knowledge Graph
              </NavActionButton>
            </EmptyState>
          ) : !hasInput ? (
            <EmptyState icon={Search} title="Select facets or enter a topic to search knowledge." />
          ) : total === 0 ? (
            <EmptyState title="No matching findings, open questions, or experiments." />
          ) : (
            <div className="space-y-6">
              {results.findings.length > 0 && (
                <ResultGroup label="Findings" count={results.findings.length}>
                  {results.findings.map((r) => (
                    <ResultRow key={r.id} r={r} selected={selectedResult?.id === r.id} onSelect={() => setSelectedResult(r)} />
                  ))}
                </ResultGroup>
              )}
              {results.questions.length > 0 && (
                <ResultGroup label="Open Questions" count={results.questions.length}>
                  {results.questions.map((r) => (
                    <ResultRow key={r.id} r={r} selected={selectedResult?.id === r.id} onSelect={() => setSelectedResult(r)} />
                  ))}
                </ResultGroup>
              )}
              {results.experiments.length > 0 && (
                <ResultGroup label="Experiments" count={results.experiments.length}>
                  {results.experiments.map((r) => (
                    <ResultRow key={r.id} r={r} selected={selectedResult?.id === r.id} onSelect={() => setSelectedResult(r)} />
                  ))}
                </ResultGroup>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right selected-result inspector — overlay below lg */}
      {selectedResult && (
        <ResponsiveInspectorOverlay>
          <ResultInspector result={selectedResult} onClose={() => setSelectedResult(null)} navigate={navigate} />
        </ResponsiveInspectorOverlay>
      )}
    </div>
  );
}

function FacetPanel({
  selected,
  onToggle,
  onClear,
}: {
  selected: Set<string>;
  onToggle: (k: string) => void;
  onClear: () => void;
}) {
  const [within, setWithin] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set(facetDimensions.map((d) => d.id)));

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-border-subtle bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h2 className="text-text" style={{ fontSize: '14px' }}>
          Facets
        </h2>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="font-mono text-[11px] text-text-muted hover:text-text"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="border-b border-border-subtle px-3 py-2">
        <div className="flex items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1.5 focus-within:border-brand-border">
          <Search className="size-3.5 shrink-0 text-text-muted" />
          <input
            value={within}
            onChange={(e) => setWithin(e.target.value)}
            placeholder="Search facet terms…"
            className="w-full bg-transparent text-[12px] text-text outline-none placeholder:text-text-muted"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {facetDimensions.map((dim) => {
          const terms = dim.terms.filter((t) => t.toLowerCase().includes(within.toLowerCase()));
          if (terms.length === 0) return null;
          const isOpen = open.has(dim.id);
          return (
            <div key={dim.id} className="mb-1">
              <button
                type="button"
                onClick={() =>
                  setOpen((prev) => {
                    const n = new Set(prev);
                    n.has(dim.id) ? n.delete(dim.id) : n.add(dim.id);
                    return n;
                  })
                }
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 hover:bg-surface-2"
              >
                <span className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">
                  {dim.label}
                </span>
                <ChevronDown className={cn('size-3.5 text-text-muted transition-transform', !isOpen && '-rotate-90')} />
              </button>
              {isOpen && (
                <div className="mt-0.5 space-y-0.5 pl-1">
                  {terms.map((term) => {
                    const key = `${dim.id}:${term}`;
                    const checked = selected.has(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onToggle(key)}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left hover:bg-surface-2"
                      >
                        <span
                          className={cn(
                            'flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border',
                            checked ? 'border-brand bg-brand-muted' : 'border-border-strong',
                          )}
                        >
                          {checked && <span className="size-1.5 rounded-[1px] bg-brand" />}
                        </span>
                        <span className={cn('font-mono text-[12px]', checked ? 'text-text' : 'text-text-secondary')}>
                          {term}
                        </span>
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

function ResultGroup({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-text-muted">{label}</h3>
        <span className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 font-mono text-[10px] text-text-muted">
          {count}
        </span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function ResultRow({ r, selected, onSelect }: { r: Result; selected: boolean; onSelect: () => void }) {
  const idColor = r.kind === 'finding' ? 'text-brand' : r.kind === 'question' ? 'text-warning' : 'text-info';
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-sm border px-3 py-2.5 text-left transition-colors',
        selected ? 'border-brand-border bg-brand-muted' : 'border-border-subtle bg-surface hover:border-border-strong hover:bg-surface-2',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('shrink-0 font-mono text-[12px]', idColor)}>{r.id.replace('experiments/', '')}</span>
          <span className="truncate text-[13px] text-text">{r.title}</span>
        </div>
        <StatusBadge value={r.badge} showDot={false} />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {r.matched.length > 0 ? (
          r.matched.map((f) => (
            <span key={f} className="rounded-sm border border-brand-border bg-brand-muted px-1 py-0.5 font-mono text-[10px] text-brand">
              {f}
            </span>
          ))
        ) : (
          r.facets.slice(0, 3).map((f) => (
            <span key={f} className="rounded-sm border border-border-subtle bg-surface-2 px-1 py-0.5 font-mono text-[10px] text-text-muted">
              {f}
            </span>
          ))
        )}
        <span className="ml-auto font-mono text-[10px] text-text-muted">{r.source.replace('experiments/', '')}</span>
      </div>
    </button>
  );
}

function ResultInspector({
  result,
  onClose,
  navigate,
}: {
  result: Result;
  onClose: () => void;
  navigate: (to: string) => void;
}) {
  const Label = ({ children }: { children: React.ReactNode }) => (
    <div className="mt-5 mb-2 font-mono text-[11px] uppercase tracking-wider text-text-muted first:mt-0">
      {children}
    </div>
  );
  const tablePath =
    result.kind === 'question'
      ? `/findings?tab=questions&focus=${result.id}`
      : result.kind === 'finding'
        ? `/findings?focus=${result.id}`
        : `/experiments/${result.id}`;

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-l border-border-subtle bg-surface lg:w-[340px]">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">{result.kind}</span>
          <MonoId className={result.kind === 'experiment' ? 'text-info' : 'text-brand'}>
            {result.id.replace('experiments/', '')}
          </MonoId>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-6 items-center justify-center rounded-sm text-text-muted hover:text-text"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        <h3 className="text-[15px] leading-snug text-text">{result.title}</h3>
        <div className="mt-2">
          <StatusBadge value={result.badge} />
        </div>

        <Label>Matching Facets</Label>
        <div className="flex flex-wrap gap-1.5">
          {(result.matched.length ? result.matched : result.facets).map((f) => (
            <span
              key={f}
              className={cn(
                'rounded-sm border px-1.5 py-0.5 font-mono text-[11px]',
                result.matched.includes(f)
                  ? 'border-brand-border bg-brand-muted text-brand'
                  : 'border-border-subtle bg-surface-2 text-text-secondary',
              )}
            >
              {f}
            </span>
          ))}
        </div>

        <Label>Source / Evidence</Label>
        <MonoId className="text-info">{result.source}</MonoId>

        <Label>Actions</Label>
        <div className="flex flex-col gap-2">
          <NavActionButton onClick={() => navigate(tablePath)}>
            <FileText className="size-3.5" /> Open detail
          </NavActionButton>
          {result.kind !== 'question' && (
            <NavActionButton
              onClick={() =>
                navigate(
                  result.kind === 'experiment'
                    ? `/experiments/${result.id}`
                    : `/experiments/${result.source}`,
                )
              }
            >
              <FileText className="size-3.5" /> View evidence report
            </NavActionButton>
          )}
          <NavActionButton onClick={() => navigate(`/graph?focus=${result.id}`)}>
            <Share2 className="size-3.5" /> View node in graph
          </NavActionButton>
          {result.kind === 'finding' && (
            <NavActionButton onClick={() => navigate(`/lineage?focus=${result.id}`)}>
              <GitBranch className="size-3.5" /> Trace lineage
            </NavActionButton>
          )}
          <AskClaudeButton onClick={() => navigate(`/chat?ctx=${result.id}`)}>
            Ask Claude about this result
          </AskClaudeButton>
        </div>
      </div>
    </aside>
  );
}

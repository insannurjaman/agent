import {
  useMemo, useState, useCallback, useEffect, useRef, useLayoutEffect,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  ArrowRight, ArrowDown, AlertTriangle, GitBranch, FileText, FlaskConical,
  Database, CircleHelp, X, Check, ChevronsUpDown, Search, ExternalLink,
  Link2, Unlink, ChevronDown, ChevronRight, type LucideIcon,
} from 'lucide-react';
import {
  buildInOutViewModel, getSummary,
  buildFindingDetail, buildQuestionDetail, buildDatasetDetail,
  buildDocumentDetail, buildArtifactDetail, buildExperimentDetail,
  buildReportDetail, buildRelationshipDetailModel,
  experiments, findings, openQuestions, edges, getExperimentBySlug,
  describeRelationshipSentence, formatShortId, canonicalExperimentPath,
  type InOutEntity, type InOutExperiment, type InOutInput, type InOutOutput,
  type InOutRelationship, type InOutViewModel, type InOutSummary,
  type InOutDetail, type FindingDetail, type QuestionDetail,
  type DatasetDetail, type DocumentDetail, type ArtifactDetail,
  type ExperimentDetail, type ReportDetail, type RelationshipDetailModel,
} from '../../data';
import type { Finding, OpenQuestion, Experiment } from '../../data/types';
import { MonoId } from '../common/primitives';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { useBreakpoint } from '../responsive/useBreakpoint';
import { cn } from '../ui/utils';

// ── Tokens ──────────────────────────────────────────────────────────────

const INPUT_ROLE_LABEL: Record<InOutInput['role'], string> = {
  'previous-finding': 'Previous finding', 'previous-question': 'Previous question',
  'source-data': 'Source data', 'source-document': 'Source document',
};

const OUTPUT_ROLE_LABEL: Record<InOutOutput['role'], string> = {
  'produced-finding': 'New finding', 'produced-question': 'New question',
  'updated-finding': 'Updated finding', 'resolved-question': 'Resolved',
  'partially-resolved-question': 'Partially resolved', 'updated-question': 'Advanced',
  'carried-forward': 'Carried forward', 'artifact': 'Artifact', 'generated-report': 'Generated report',
};

const OUTPUT_ROLE_TONE: Record<InOutOutput['role'], 'green' | 'amber' | 'teal' | 'purple' | 'muted' | 'blue'> = {
  'produced-finding': 'green', 'produced-question': 'amber', 'updated-finding': 'purple',
  'resolved-question': 'green', 'partially-resolved-question': 'amber', 'updated-question': 'amber',
  'carried-forward': 'muted', 'artifact': 'teal', 'generated-report': 'blue',
};

const INPUT_ROLE_TONE: Record<InOutInput['role'], 'green' | 'amber' | 'blue' | 'muted'> = {
  'previous-finding': 'green', 'previous-question': 'amber', 'source-data': 'blue', 'source-document': 'muted',
};

const INPUT_ROLE_ICON: Record<InOutInput['role'], LucideIcon> = {
  'previous-finding': FlaskConical, 'previous-question': CircleHelp,
  'source-data': Database, 'source-document': FileText,
};

const OUTPUT_ROLE_ICON: Record<InOutOutput['role'], LucideIcon> = {
  'produced-finding': FlaskConical, 'produced-question': CircleHelp,
  'updated-finding': GitBranch, 'resolved-question': Check,
  'partially-resolved-question': CircleHelp, 'updated-question': CircleHelp,
  'carried-forward': Link2, 'artifact': FileText, 'generated-report': FileText,
};

const OUTPUT_GROUP_TITLE: Record<InOutOutput['group'], string> = {
  'new-findings': 'Newly produced findings', 'new-questions': 'Newly created questions',
  'updated-findings': 'Updated findings', 'resolved-questions': 'Question transitions',
  'carried-forward': 'Carried-forward references', 'artifacts': 'Generated artifacts',
  'generated-report': 'Generated report',
};

const OUTPUT_GROUP_ORDER: InOutOutput['group'][] = [
  'new-findings', 'new-questions', 'updated-findings', 'resolved-questions',
  'carried-forward', 'generated-report', 'artifacts',
];

const INPUT_GROUP_TITLE: Record<InOutInput['group'], string> = {
  'previous-findings': 'Previous findings', 'previous-questions': 'Previous questions',
  'data': 'Data', 'documents': 'Documents',
};

const INPUT_GROUP_ORDER: InOutInput['group'][] = [
  'previous-findings', 'previous-questions', 'data', 'documents',
];

const EXPERIMENT_STATUS_LABEL: Record<InOutExperiment['status'], string> = {
  completed: 'Completed', 'in-progress': 'In progress', planned: 'Planned',
  exploration: 'Exploration', blocked: 'Superseded data',
};

const EXPERIMENT_STATUS_TONE: Record<InOutExperiment['status'], Parameters<typeof StatusBadge>[0]['tone']> = {
  completed: 'success', 'in-progress': 'info', planned: 'neutral',
  exploration: 'warning', blocked: 'error',
};

const ENTITY_KIND_LABEL: Record<InOutEntity['kind'], string> = {
  finding: 'Finding', question: 'Question', experiment: 'Experiment',
  dataset: 'Dataset', document: 'Document', artifact: 'Artifact',
  report: 'Report', unknown: 'Unknown',
};

// Selection: blue accent, distinct from orange brand and error red
const SELECTED_CARD_CLS = 'border-blue/50 bg-blue/8 ring-1 ring-blue/20';
const HIGHLIGHTED_CARD_CLS = 'border-blue/30 bg-blue/5';
const DIMMED_CARD_CLS = 'opacity-55';

// Sticky header height constant for scroll offsets
const STICKY_HEADER_H = 56;

// ── Screen ──────────────────────────────────────────────────────────────

export function InOutScreen() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const sortedExperiments = useMemo(
    () => [...experiments].sort((a, b) => b.date.localeCompare(a.date)),
    [],
  );

  const experimentParam = params.get('experiment');
  const entityParam = params.get('entity');

  const [selectedSlug, setSelectedSlug] = useState<string | null>(() => {
    if (experimentParam && getExperimentBySlug(experimentParam)) return experimentParam;
    return sortedExperiments[0]?.slug ?? null;
  });

  useEffect(() => {
    if (experimentParam && getExperimentBySlug(experimentParam)) {
      setSelectedSlug(experimentParam);
    }
  }, [experimentParam]);

  const viewModel = useMemo<InOutViewModel>(() => {
    return buildInOutViewModel({
      experiments, findings, openQuestions, edges,
      focusSlug: selectedSlug ?? undefined,
    });
  }, [selectedSlug]);

  const summary = useMemo(() => getSummary(viewModel), [viewModel]);

  const selectedInputId = useMemo(() => {
    if (!entityParam) return null;
    return viewModel.inputs.find((i) => i.entity.id === entityParam || i.id === entityParam)?.id ?? null;
  }, [entityParam, viewModel.inputs]);

  const selectedOutputId = useMemo(() => {
    if (!entityParam) return null;
    return viewModel.outputs.find((o) => o.entity.id === entityParam || o.id === entityParam)?.id ?? null;
  }, [entityParam, viewModel.outputs]);

  const selectedRelationshipId = useMemo(() => {
    if (!entityParam) return null;
    return viewModel.relationships.find((r) => r.id === entityParam)?.id ?? null;
  }, [entityParam, viewModel.relationships]);

  const selectedInput = useMemo(
    () => viewModel.inputs.find((i) => i.id === selectedInputId) ?? null,
    [viewModel, selectedInputId],
  );
  const selectedOutput = useMemo(
    () => viewModel.outputs.find((o) => o.id === selectedOutputId) ?? null,
    [viewModel, selectedOutputId],
  );
  const selectedRelationship = useMemo(
    () => viewModel.relationships.find((r) => r.id === selectedRelationshipId) ?? null,
    [viewModel, selectedRelationshipId],
  );

  const detailOpen = !!(selectedInput || selectedOutput || selectedRelationship);

  const selectEntity = useCallback((entityId: string | null) => {
    const next = new URLSearchParams(params);
    if (entityId) next.set('entity', entityId);
    else next.delete('entity');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const handleSelectExperiment = useCallback((slug: string) => {
    const next = new URLSearchParams(params);
    next.set('experiment', slug);
    next.delete('entity');
    setParams(next, { replace: false });
  }, [params, setParams]);

  const closeDetail = useCallback(() => selectEntity(null), [selectEntity]);

  const highlightedInputIds = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    if (selectedInputId) set.add(selectedInputId);
    if (selectedRelationship) {
      const inId = viewModel.inputs.find((i) => i.entity.id === selectedRelationship.from.id)?.id;
      if (inId) set.add(inId);
      const inIdTo = viewModel.inputs.find((i) => i.entity.id === selectedRelationship.to.id)?.id;
      if (inIdTo) set.add(inIdTo);
    }
    return set;
  }, [selectedInputId, selectedRelationship, viewModel.inputs]);

  const highlightedOutputIds = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    if (selectedOutputId) set.add(selectedOutputId);
    if (selectedRelationship) {
      const outId = viewModel.outputs.find((o) => o.entity.id === selectedRelationship.to.id)?.id;
      if (outId) set.add(outId);
      const outIdFrom = viewModel.outputs.find((o) => o.entity.id === selectedRelationship.from.id)?.id;
      if (outIdFrom) set.add(outIdFrom);
    }
    return set;
  }, [selectedOutputId, selectedRelationship, viewModel.outputs]);

  const dimUnrelated = detailOpen;

  const detailModel = useMemo<InOutDetail | null>(() => {
    const exp = viewModel.experiment;
    const rawExperiment = exp ? experiments.find((e) => e.slug === exp.slug) ?? null : null;
    if (selectedInput) return buildInputDetail(selectedInput, rawExperiment);
    if (selectedOutput) return buildOutputDetail(selectedOutput, rawExperiment);
    if (selectedRelationship) return buildRelationshipDetailModel(selectedRelationship, rawExperiment);
    return null;
  }, [selectedInput, selectedOutput, selectedRelationship, viewModel]);

  // Scroll selected card into view when drawer opens
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!detailOpen || !entityParam) return;
    const t = window.setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const card = container.querySelector<HTMLElement>(`[data-card-entity-id="${cssEscape(entityParam)}"]`);
      if (card) {
        const cardRect = card.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        // Account for drawer width on desktop
        const drawerWidth = !isMobile && detailOpen ? 400 : 0;
        const visibleRight = containerRect.right - drawerWidth;
        if (cardRect.top < containerRect.top + 8 || cardRect.bottom > containerRect.bottom ||
            (cardRect.right > visibleRight)) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 80);
    return () => window.clearTimeout(t);
  }, [detailOpen, entityParam, isMobile]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CompactHeader summary={summary} right={
        <InOutCombobox experiments={sortedExperiments} selectedSlug={selectedSlug} onSelect={handleSelectExperiment} />
      } />

      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-auto bg-background"
        style={{ scrollPaddingTop: `${STICKY_HEADER_H + 8}px` }}>
        {!viewModel.experiment ? (
          <EmptyState icon={GitBranch} title="No experiment selected"
            hint="Pick an experiment from the selector to view its inputs, processing context, and outcomes." />
        ) : isMobile ? (
          <InOutMobileFlow viewModel={viewModel} selectedInputId={selectedInputId} selectedOutputId={selectedOutputId}
            onSelectInput={(i) => selectEntity(i.entity.id)} onSelectOutput={(o) => selectEntity(o.entity.id)} />
        ) : (
          <InOutMap viewModel={viewModel} summary={summary}
            selectedInputId={selectedInputId} selectedOutputId={selectedOutputId}
            selectedRelationshipId={selectedRelationshipId}
            highlightedInputIds={highlightedInputIds} highlightedOutputIds={highlightedOutputIds}
            dimUnrelated={dimUnrelated} detailOpen={detailOpen}
            onSelectInput={(i) => selectEntity(i.entity.id)}
            onSelectOutput={(o) => selectEntity(o.entity.id)}
            onSelectRelationship={(r) => selectEntity(r.id)} />
        )}
      </div>

      {!isMobile && detailOpen && detailModel && (
        <InOutDetailDrawer detail={detailModel} experiment={viewModel.experiment} onClose={closeDetail} navigate={navigate} />
      )}
      {isMobile && detailOpen && detailModel && (
        <InOutDetailSheet detail={detailModel} experiment={viewModel.experiment} onClose={closeDetail} navigate={navigate} />
      )}
    </div>
  );
}

// ── Compact sticky header ───────────────────────────────────────────────

function CompactHeader({ summary, right }: { summary: InOutSummary; right: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-surface px-4 py-2 sm:px-6"
      style={{ minHeight: `${STICKY_HEADER_H}px` }}>
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-[16px] font-semibold text-text whitespace-nowrap">In/Out</h1>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] text-text-muted">
          <span>{pluralize(summary.inputs, 'input', 'inputs')}</span>
          <span aria-hidden>·</span>
          <span className="text-green">{pluralize(summary.newFindings, 'new', 'new')}</span>
          <span aria-hidden>·</span>
          <span className="text-amber">{pluralize(summary.resolvedQuestions, 'transition', 'transitions')}</span>
          <span aria-hidden>·</span>
          <span className="text-text-muted">{pluralize(summary.carriedForward, 'carried ref', 'carried refs')}</span>
          {summary.generatedReport && <><span aria-hidden>·</span><span className="text-blue">1 report</span></>}
          {summary.artifacts > 0 && <><span aria-hidden>·</span><span className="text-teal">{pluralize(summary.artifacts, 'artifact', 'artifacts')}</span></>}
          <span aria-hidden>·</span>
          <span>{pluralize(summary.connections, 'link', 'links')}</span>
        </div>
      </div>
      {right}
    </header>
  );
}

// ── Combobox (unchanged from prior — anchored, keyboard-navigable) ─────

function InOutCombobox({ experiments: exps, selectedSlug, onSelect }: {
  experiments: { slug: string; title: string; date: string }[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [popStyle, setPopStyle] = useState<React.CSSProperties>({ position: 'fixed', top: 0, left: 0, width: 300 });

  const selected = exps.find((e) => e.slug === selectedSlug) ?? exps[0];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exps;
    return exps.filter((e) => e.title.toLowerCase().includes(q) || formatShortId(e.slug).toLowerCase().includes(q));
  }, [exps, query]);

  useEffect(() => { setActiveIndex(0); }, [query, open]);

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger || !open) return;
    const r = trigger.getBoundingClientRect();
    const POP_W = Math.max(r.width, 280);
    const POP_MAX_H = Math.min(380, window.innerHeight * 0.5);
    let left = r.left;
    let top = r.bottom + 6;
    if (left + POP_W > window.innerWidth - 8) left = Math.max(8, window.innerWidth - POP_W - 8);
    if (top + POP_MAX_H > window.innerHeight - 8) {
      const aboveTop = r.top - POP_MAX_H - 6;
      if (aboveTop > 8) top = aboveTop;
    }
    setPopStyle({ position: 'fixed', top, left, width: POP_W });
  }, [open]);

  useLayoutEffect(() => { reposition(); }, [reposition]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => reposition();
    const onResize = () => reposition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); setQuery(''); triggerRef.current?.focus(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1))); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(0, i - 1)); }
      else if (e.key === 'Enter') {
        const choice = filtered[activeIndex];
        if (choice) { e.preventDefault(); onSelect(choice.slug); setOpen(false); setQuery(''); triggerRef.current?.focus(); }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, filtered, activeIndex, onSelect]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <div className="flex w-full min-w-[180px] flex-col gap-1 md:w-[260px]">
      <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted">Experiment</span>
      <button ref={triggerRef} type="button" onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox" aria-expanded={open} aria-label="Select experiment"
        className={cn('flex min-h-9 w-full items-center justify-between gap-2 rounded-sm border bg-surface-2 px-2.5 text-left text-text outline-none',
          'transition-colors hover:border-border-strong', 'focus-visible:ring-2 focus-visible:ring-brand-ring',
          open ? 'border-brand-border' : 'border-border-subtle')}>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[12px] font-medium text-text">{selected?.title ?? 'Select an experiment'}</span>
          <span className="truncate font-mono text-[9px] text-text-muted">{selected ? formatShortId(selected.slug) : 'No experiments available'}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-text-muted" aria-hidden />
      </button>

      {open && (
        <>
          <button type="button" aria-label="Close experiment selector" tabIndex={-1}
            onClick={() => { setOpen(false); setQuery(''); triggerRef.current?.focus(); }}
            className="fixed inset-0 z-40 cursor-default" style={{ background: 'transparent' }} />
          <div role="dialog" aria-modal="false" aria-label="Select experiment" style={popStyle}
            className="z-50 flex max-h-[50vh] flex-col overflow-hidden rounded-sm border border-border-strong bg-surface shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
              <Search className="size-4 shrink-0 text-text-muted" aria-hidden />
              <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title or ID…" className="flex-1 bg-transparent text-[12px] text-text outline-none placeholder:text-text-muted"
                aria-label="Search experiments" autoComplete="off" spellCheck={false} />
              <button type="button" onClick={() => { setOpen(false); setQuery(''); triggerRef.current?.focus(); }}
                aria-label="Close" className="flex size-7 items-center justify-center rounded-sm text-text-muted hover:bg-surface-hover hover:text-text">
                <X className="size-3.5" />
              </button>
            </div>
            <ul ref={listRef} role="listbox" aria-label="Experiments" className="min-h-0 max-h-[40vh] flex-1 overflow-auto p-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-[12px] text-text-muted">No experiments match "{query}"</li>
              ) : filtered.map((e, i) => {
                const isSelected = e.slug === selectedSlug;
                const isActive = i === activeIndex;
                return (
                  <li key={e.slug} role="presentation">
                    <button type="button" role="option" aria-selected={isSelected} data-idx={i}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => { onSelect(e.slug); setOpen(false); setQuery(''); triggerRef.current?.focus(); }}
                      className={cn('flex w-full min-h-11 flex-col gap-0.5 rounded-sm px-2.5 py-1.5 text-left transition-colors',
                        isActive ? 'bg-surface-hover' : 'bg-transparent', isSelected && 'bg-brand-muted/40')}>
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[12px] font-medium text-text">{e.title}</span>
                        {isSelected && <Check className="size-3.5 shrink-0 text-brand" aria-hidden />}
                      </span>
                      <span className="flex items-center gap-2 truncate font-mono text-[9px] text-text-muted">
                        <span>{formatShortId(e.slug)}</span><span aria-hidden>·</span><span>{e.date}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-border-subtle px-3 py-1.5 font-mono text-[9px] text-text-muted">
              {filtered.length} of {exps.length} · ↑↓ navigate · ↵ select · esc close
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Map view ────────────────────────────────────────────────────────────

function InOutMap({ viewModel, summary, selectedInputId, selectedOutputId, selectedRelationshipId,
  highlightedInputIds, highlightedOutputIds, dimUnrelated, detailOpen,
  onSelectInput, onSelectOutput, onSelectRelationship }: {
  viewModel: InOutViewModel; summary: InOutSummary;
  selectedInputId: string | null; selectedOutputId: string | null; selectedRelationshipId: string | null;
  highlightedInputIds: Set<string>; highlightedOutputIds: Set<string>;
  dimUnrelated: boolean; detailOpen: boolean;
  onSelectInput: (i: InOutInput) => void; onSelectOutput: (o: InOutOutput) => void;
  onSelectRelationship: (r: InOutRelationship) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={mapRef} className={cn('relative mx-auto w-full max-w-[1320px] px-4 py-4 sm:px-6 transition-[padding] duration-200',
      detailOpen && 'lg:pr-[420px]')}>
      {/* Legend — near the top */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-text-muted" aria-hidden>
          <span className="font-mono text-[10px] uppercase tracking-wider">Inputs</span>
          <ArrowRight className="size-3.5" />
          <span className="font-mono text-[10px] uppercase tracking-wider">Experiment</span>
          <ArrowRight className="size-3.5" />
          <span className="font-mono text-[10px] uppercase tracking-wider">Outcomes</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[9px] text-text-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-border-strong" /> Group flow
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-5 border-t-2 border-blue/60" /> Selected
          </span>
        </div>
      </div>

      <div className="relative grid gap-x-5 gap-y-2 lg:grid-cols-[minmax(200px,1fr)_minmax(260px,1.25fr)_minmax(200px,1fr)]">
        <InputsColumn viewModel={viewModel} selectedId={selectedInputId} highlightedIds={highlightedInputIds} dimUnrelated={dimUnrelated} onSelect={onSelectInput} />
        <ExperimentColumn viewModel={viewModel} summary={summary} />
        <OutputsColumn viewModel={viewModel} selectedId={selectedOutputId} highlightedIds={highlightedOutputIds} dimUnrelated={dimUnrelated} onSelect={onSelectOutput} />
        <ConnectorLayer viewModel={viewModel} highlightedInputIds={highlightedInputIds} highlightedOutputIds={highlightedOutputIds} dimUnrelated={dimUnrelated} />
      </div>

      <AdditionalRelationshipsPanel viewModel={viewModel} selectedRelationshipId={selectedRelationshipId} onSelectRelationship={onSelectRelationship} />
    </div>
  );
}

// ── Connector layer with ResizeObserver ─────────────────────────────────

function ConnectorLayer({ viewModel, highlightedInputIds, highlightedOutputIds, dimUnrelated }: {
  viewModel: InOutViewModel; highlightedInputIds: Set<string>; highlightedOutputIds: Set<string>; dimUnrelated: boolean;
}) {
  const layerRef = useRef<SVGSVGElement>(null);
  const [, force] = useState(0);
  const recompute = useCallback(() => force((n) => n + 1), []);

  useLayoutEffect(() => {
    recompute();
    const t = window.setTimeout(recompute, 60);
    return () => window.clearTimeout(t);
  }, [viewModel, recompute]);

  useEffect(() => {
    const onResize = () => recompute();
    const onScroll = () => recompute();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);

    // ResizeObserver for layout changes within the map
    const container = layerRef.current?.parentElement;
    let ro: ResizeObserver | undefined;
    if (container && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => recompute());
      ro.observe(container);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
      ro?.disconnect();
    };
  }, [recompute]);

  const container = layerRef.current?.parentElement;
  if (!container) return <svg ref={layerRef} className="pointer-events-none absolute inset-0 z-0 size-full" aria-hidden />;

  const containerRect = container.getBoundingClientRect();
  const W = container.scrollWidth;
  const H = container.scrollHeight;

  const inputCards = viewModel.inputs
    .map((i) => {
      const el = container.querySelector<HTMLElement>(`[data-card-id="${cssEscape(i.id)}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { id: i.id, x: r.right - containerRect.left, y: r.top + r.height / 2 - containerRect.top };
    })
    .filter((c): c is { id: string; x: number; y: number } => !!c);

  const outputCards = viewModel.outputs
    .map((o) => {
      const el = container.querySelector<HTMLElement>(`[data-card-id="${cssEscape(o.id)}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { id: o.id, x: r.left - containerRect.left, y: r.top + r.height / 2 - containerRect.top };
    })
    .filter((c): c is { id: string; x: number; y: number } => !!c);

  const expEl = container.querySelector<HTMLElement>('[data-experiment-anchor]');
  const expRect = expEl?.getBoundingClientRect();
  const expLeft = expRect ? expRect.left - containerRect.left : 0;
  const expRight = expRect ? expRect.right - containerRect.left : 0;
  const expTop = expRect ? expRect.top + expRect.height / 2 - containerRect.top : 0;

  const lines: { d: string; highlight: boolean; dim: boolean; key: string; isTransition: boolean }[] = [];
  for (const ic of inputCards) {
    const highlight = highlightedInputIds.has(ic.id);
    const dim = dimUnrelated && !highlight;
    lines.push({
      d: `M ${ic.x} ${ic.y} C ${(ic.x + expLeft) / 2} ${ic.y}, ${(ic.x + expLeft) / 2} ${expTop}, ${expLeft} ${expTop}`,
      highlight, dim, key: `in-${ic.id}`, isTransition: false,
    });
  }
  for (const oc of outputCards) {
    const highlight = highlightedOutputIds.has(oc.id);
    const dim = dimUnrelated && !highlight;
    const output = viewModel.outputs.find((o) => o.id === oc.id);
    const isTransition = output?.role === 'resolved-question' || output?.role === 'partially-resolved-question' || output?.role === 'updated-question';
    lines.push({
      d: `M ${expRight} ${expTop} C ${(expRight + oc.x) / 2} ${expTop}, ${(expRight + oc.x) / 2} ${oc.y}, ${oc.x} ${oc.y}`,
      highlight, dim, key: `out-${oc.id}`, isTransition,
    });
  }

  return (
    <svg ref={layerRef} className="pointer-events-none absolute inset-0 z-0 size-full" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <defs>
        <marker id="inout-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--border-strong)" />
        </marker>
        <marker id="inout-arrow-hi" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--blue)" />
        </marker>
      </defs>
      {lines.map((l) => (
        <path key={l.key} d={l.d} fill="none"
          stroke={l.highlight ? 'var(--blue)' : 'var(--border-strong)'}
          strokeWidth={l.highlight ? 2 : 1.5}
          strokeDasharray={l.highlight ? undefined : l.isTransition ? '2 3' : '5 4'}
          opacity={l.dim ? 0.2 : l.highlight ? 0.9 : 0.65}
          markerEnd={l.highlight ? 'url(#inout-arrow-hi)' : 'url(#inout-arrow)'}
        />
      ))}
    </svg>
  );
}

function cssEscape(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, (m) => `\\${m}`);
}

// ── Columns ─────────────────────────────────────────────────────────────

function InputsColumn({ viewModel, selectedId, highlightedIds, dimUnrelated, onSelect }: {
  viewModel: InOutViewModel; selectedId: string | null; highlightedIds: Set<string>; dimUnrelated: boolean; onSelect: (i: InOutInput) => void;
}) {
  const groups = useMemo(() => groupInputs(viewModel.inputs), [viewModel.inputs]);
  return (
    <section aria-label="Inputs" className="relative z-10 flex min-w-0 flex-col">
      <ColumnHeader eyebrow="Inputs" title="What went in" count={viewModel.inputs.length} align="left" />
      <div className="flex flex-col gap-3">
        {groups.length === 0 ? <GroupEmptyState message="No inputs are recorded for this experiment." /> :
          groups.map((g) => <InputGroup key={g.key} title={INPUT_GROUP_TITLE[g.key]} items={g.items} selectedId={selectedId} highlightedIds={highlightedIds} dimUnrelated={dimUnrelated} onSelect={onSelect} />)}
      </div>
    </section>
  );
}

function InputGroup({ title, items, selectedId, highlightedIds, dimUnrelated, onSelect }: {
  title: string; items: InOutInput[]; selectedId: string | null; highlightedIds: Set<string>; dimUnrelated: boolean; onSelect: (i: InOutInput) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">
        <span>{title}</span><span className="tabular-nums text-text-muted/70">{items.length}</span>
      </h3>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => <EntityCard key={item.id} id={item.id} roleLabel={INPUT_ROLE_LABEL[item.role]} roleTone={INPUT_ROLE_TONE[item.role]} Icon={INPUT_ROLE_ICON[item.role]} entity={item.entity} displayId={item.displayId} note={item.note} selected={selectedId === item.id} highlighted={highlightedIds.has(item.id)} dim={dimUnrelated && !highlightedIds.has(item.id) && selectedId !== item.id} onClick={() => onSelect(item)} />)}
      </div>
    </div>
  );
}

function OutputsColumn({ viewModel, selectedId, highlightedIds, dimUnrelated, onSelect }: {
  viewModel: InOutViewModel; selectedId: string | null; highlightedIds: Set<string>; dimUnrelated: boolean; onSelect: (o: InOutOutput) => void;
}) {
  const groups = useMemo(() => groupOutputs(viewModel.outputs), [viewModel.outputs]);
  return (
    <section aria-label="Outcomes" className="relative z-10 flex min-w-0 flex-col">
      <ColumnHeader eyebrow="Outcomes" title="Experiment outcomes" count={viewModel.outputs.length} align="right" />
      <div className="flex flex-col gap-3">
        {groups.length === 0 ? <GroupEmptyState message="No outcomes have been registered for this experiment yet." /> :
          groups.map((g) => <OutputGroup key={g.key} title={OUTPUT_GROUP_TITLE[g.key]} items={g.items} selectedId={selectedId} highlightedIds={highlightedIds} dimUnrelated={dimUnrelated} onSelect={onSelect} />)}
      </div>
    </section>
  );
}

function OutputGroup({ title, items, selectedId, highlightedIds, dimUnrelated, onSelect }: {
  title: string; items: InOutOutput[]; selectedId: string | null; highlightedIds: Set<string>; dimUnrelated: boolean; onSelect: (o: InOutOutput) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">
        <span>{title}</span><span className="tabular-nums text-text-muted/70">{items.length}</span>
      </h3>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => <EntityCard key={item.id} id={item.id} roleLabel={OUTPUT_ROLE_LABEL[item.role]} roleTone={OUTPUT_ROLE_TONE[item.role]} Icon={OUTPUT_ROLE_ICON[item.role]} entity={item.entity} displayId={item.displayId} note={item.note} transitionNote={item.previousState && item.resultingState ? `${item.previousState} → ${item.resultingState}` : undefined} selected={selectedId === item.id} highlighted={highlightedIds.has(item.id)} dim={dimUnrelated && !highlightedIds.has(item.id) && selectedId !== item.id} onClick={() => onSelect(item)} />)}
      </div>
    </div>
  );
}

// ── Experiment column — neutral elevated, not orange ───────────────────

function ExperimentColumn({ viewModel, summary }: { viewModel: InOutViewModel; summary: InOutSummary }) {
  const exp = viewModel.experiment;
  if (!exp) return null;
  return (
    <section aria-label="Experiment" className="relative z-10 flex min-w-0 flex-col items-stretch">
      <ColumnHeader eyebrow="Experiment" title="Processing context" count={null} align="center" />
      <article data-experiment-anchor
        className="relative flex flex-col gap-2.5 rounded-sm border border-border-strong bg-elevated px-4 py-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="size-4 shrink-0 text-text-secondary" strokeWidth={1.75} />
          <StatusBadge value={EXPERIMENT_STATUS_LABEL[exp.status]} tone={EXPERIMENT_STATUS_TONE[exp.status]} />
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-snug text-text">{exp.title}</h2>
          <MonoId muted className="mt-0.5 block break-all text-[10px]">{exp.slug}</MonoId>
        </div>
        {exp.description && <p className="text-[12px] leading-relaxed text-text-secondary">{exp.description}</p>}
        <dl className="grid grid-cols-3 gap-2 border-t border-border-subtle pt-2">
          <ExperimentMeta label="Date" value={exp.date} />
          <ExperimentMeta label="Stage" value={exp.stage} />
          <ExperimentMeta label="New" value={String(summary.newFindings + summary.newQuestions)} />
        </dl>
      </article>
    </section>
  );
}

function ExperimentMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[9px] uppercase tracking-wider text-text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-[11px] text-text">{value}</dd>
    </div>
  );
}

// ── Entity card ─────────────────────────────────────────────────────────

function EntityCard({ id, roleLabel, roleTone, Icon, entity, displayId, note, transitionNote, selected, highlighted, dim, onClick }: {
  id: string; roleLabel: string; roleTone: 'green' | 'amber' | 'blue' | 'teal' | 'purple' | 'muted';
  Icon: LucideIcon; entity: InOutEntity; displayId?: string; note?: string; transitionNote?: string;
  selected: boolean; highlighted: boolean; dim: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      data-card-id={id} data-card-entity-id={entity.id}
      aria-pressed={selected} title={entity.title}
      className={cn(
        'group relative flex w-full min-h-11 items-start gap-2.5 rounded-sm border bg-surface-2 px-2.5 py-2 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring',
        selected ? SELECTED_CARD_CLS : highlighted ? HIGHLIGHTED_CARD_CLS : 'border-border-subtle hover:border-border-strong hover:bg-surface',
        dim && DIMMED_CARD_CLS,
      )}
      style={{ scrollMarginTop: `${STICKY_HEADER_H + 8}px` }}
    >
      {selected && <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-blue" aria-hidden />}
      <span className={cn('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm border bg-surface',
        selected ? 'border-blue/50 text-blue' : highlighted ? 'border-blue/30 text-blue' : 'border-border-strong text-text-secondary')} aria-hidden>
        <Icon className="size-3.5" strokeWidth={1.75} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted">{roleLabel}</span>
        <span className="line-clamp-2 text-[12px] font-medium leading-snug text-text">{entity.title}</span>
        <span className="flex flex-wrap items-center gap-1.5 font-mono text-[9px] text-text-muted">
          {displayId && <span className="truncate">{displayId}</span>}
          {transitionNote && <span className="text-amber/80">· {transitionNote}</span>}
          {note && !transitionNote && <span className="text-text-muted/70">· {note}</span>}
          {entity.status && !transitionNote && <span className="text-text-muted/70">· {entity.status}</span>}
        </span>
      </span>
    </button>
  );
}

function ColumnHeader({ eyebrow, title, count, align }: { eyebrow: string; title: string; count: number | null; align: 'left' | 'center' | 'right' }) {
  return (
    <header className={cn('mb-2 flex flex-col gap-0.5', align === 'left' && 'items-start text-left', align === 'center' && 'items-center text-center', align === 'right' && 'items-end text-right')}>
      <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted">{eyebrow}</span>
      <div className={cn('flex items-baseline gap-2', align === 'right' && 'flex-row-reverse')}>
        <h2 className="text-[13px] font-medium text-text">{title}</h2>
        {count != null && <span className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] text-text-muted tabular-nums">{count}</span>}
      </div>
    </header>
  );
}

// ── Detail drawer (overlay — preserves map viewport) ────────────────────

function InOutDetailDrawer({ detail, experiment, onClose, navigate }: {
  detail: InOutDetail; experiment: InOutExperiment | null; onClose: () => void; navigate: (to: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement;
    const t = window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => { window.clearTimeout(t); previouslyFocused.current?.focus(); };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { e.preventDefault(); onClose(); } }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40" role="presentation">
      <button type="button" aria-label="Close detail" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/15" />
      <aside ref={panelRef} role="complementary" aria-label="Entity detail" tabIndex={-1}
        className="absolute right-0 top-0 bottom-0 flex w-full max-w-[400px] flex-col border-l border-border-subtle bg-surface shadow-2xl outline-none">
        <DetailContent detail={detail} experiment={experiment} onClose={onClose} navigate={navigate} />
      </aside>
    </div>
  );
}

function InOutDetailSheet({ detail, experiment, onClose, navigate }: {
  detail: InOutDetail; experiment: InOutExperiment | null; onClose: () => void; navigate: (to: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement;
    const t = window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => { window.clearTimeout(t); previouslyFocused.current?.focus(); };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { e.preventDefault(); onClose(); } }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Entity detail" className="fixed inset-0 z-50 flex flex-col bg-surface">
      <DetailContent detail={detail} experiment={experiment} onClose={onClose} navigate={navigate} />
    </div>
  );
}

function DetailContent({ detail, experiment, onClose, navigate }: {
  detail: InOutDetail; experiment: InOutExperiment | null; onClose: () => void; navigate: (to: string) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = window.setTimeout(() => bodyRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <>
      <header className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5 shrink-0">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{detail.kind}</span>
        <IconButton icon={X} label="Close detail" onClick={onClose} />
      </header>
      <div ref={bodyRef} tabIndex={-1} className="min-h-0 flex-1 overflow-auto px-4 py-4 outline-none">
        <DetailRenderer detail={detail} experiment={experiment} navigate={navigate} />
      </div>
    </>
  );
}

// ── Detail renderer ─────────────────────────────────────────────────────

function DetailRenderer({ detail, experiment, navigate }: {
  detail: InOutDetail; experiment: InOutExperiment | null; navigate: (to: string) => void;
}) {
  switch (detail.kind) {
    case 'finding': return <FindingDetailView detail={detail} experiment={experiment} navigate={navigate} />;
    case 'question': return <QuestionDetailView detail={detail} experiment={experiment} navigate={navigate} />;
    case 'dataset': return <DatasetDetailView detail={detail} navigate={navigate} />;
    case 'document': return <DocumentDetailView detail={detail} navigate={navigate} />;
    case 'artifact': return <ArtifactDetailView detail={detail} navigate={navigate} />;
    case 'experiment': return <ExperimentDetailView detail={detail} navigate={navigate} />;
    case 'report': return <ReportDetailView detail={detail} navigate={navigate} />;
    case 'relationship': return <RelationshipDetailView detail={detail} navigate={navigate} />;
  }
}

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-0.5 break-words text-[12px] text-text">{children}</div>
    </div>
  );
}

function DetailActions({ actions, navigate, experimentTitle }: { actions: InOutDetail['actions']; navigate: (to: string) => void; experimentTitle?: string }) {
  return (
    <div className="mt-3 flex flex-col gap-2">
      {actions.map((a, i) => (
        <Button key={i} variant="secondary" size="md" onClick={() => navigate(a.href)} className="w-full justify-start gap-2">
          <ExternalLink className="size-3.5" /> {a.label}
        </Button>
      ))}
      <Button variant="ghost" size="md" onClick={() => navigate(`/chat?ctx=${encodeURIComponent(experimentTitle ?? '')}`)} className="w-full justify-start gap-2">
        <GitBranch className="size-3.5" /> Ask the agent about this
      </Button>
    </div>
  );
}

function TechnicalDetails({ items }: { items: { label: string; value: string }[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-text-muted hover:text-text">
        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        Technical details
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 rounded-sm border border-border-subtle bg-surface-2 p-2.5">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-[80px_1fr] gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{item.label}</span>
              <span className="break-all font-mono text-[10px] text-text-secondary">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FindingDetailView({ detail, experiment, navigate }: { detail: FindingDetail; experiment: InOutExperiment | null; navigate: (to: string) => void }) {
  return (
    <article className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <FlaskConical className="size-4 text-text-secondary" strokeWidth={1.75} aria-hidden />
        <StatusBadge value="Finding" tone="green" showDot={false} />
        <StatusBadge value={detail.role} tone="neutral" showDot={false} />
      </div>
      <div>
        <h3 className="text-[15px] font-semibold leading-snug text-text">{detail.title}</h3>
        <MonoId className="text-text-muted">{detail.id}</MonoId>
      </div>
      <p className="text-[12px] leading-relaxed text-text-secondary">{detail.summary}</p>
      <DetailSection label="Relationship to experiment">{detail.relationshipToCurrent}</DetailSection>
      <div className="grid grid-cols-2 gap-3">
        <DetailSection label="Confidence">{detail.confidence}</DetailSection>
        <DetailSection label="Category">{detail.category}</DetailSection>
        <DetailSection label="Action status">{detail.actionStatus}</DetailSection>
        <DetailSection label="Date">{detail.date}</DetailSection>
      </div>
      <DetailActions actions={detail.actions} navigate={navigate} experimentTitle={experiment?.title} />
      <TechnicalDetails items={[{ label: 'Source exp', value: detail.sourceExperiment }, { label: 'Route', value: `/findings?focus=${detail.id}` }]} />
    </article>
  );
}

function QuestionDetailView({ detail, experiment, navigate }: { detail: QuestionDetail; experiment: InOutExperiment | null; navigate: (to: string) => void }) {
  return (
    <article className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <CircleHelp className="size-4 text-text-secondary" strokeWidth={1.75} aria-hidden />
        <StatusBadge value="Question" tone="amber" showDot={false} />
        <StatusBadge value={detail.role} tone="neutral" showDot={false} />
      </div>
      <div>
        <h3 className="text-[15px] font-semibold leading-snug text-text">{detail.title}</h3>
        <MonoId className="text-text-muted">{detail.id}</MonoId>
      </div>
      <p className="text-[12px] leading-relaxed text-text-secondary">{detail.summary}</p>
      <DetailSection label="Relationship to experiment">{detail.relationshipToCurrent}</DetailSection>
      {detail.previousState && detail.resultingState && (
        <div className="rounded-sm border border-amber/30 bg-amber/10 px-3 py-2">
          <div className="font-mono text-[10px] uppercase tracking-wider text-amber">State transition</div>
          <p className="mt-0.5 text-[12px] text-amber">{detail.previousState} → {detail.resultingState}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <DetailSection label="Status">{detail.status}</DetailSection>
        <DetailSection label="Priority">{detail.priority}</DetailSection>
        <DetailSection label="Area">{detail.area}</DetailSection>
        <DetailSection label="Raised date">{detail.raisedDate}</DetailSection>
      </div>
      <DetailActions actions={detail.actions} navigate={navigate} experimentTitle={experiment?.title} />
      <TechnicalDetails items={[{ label: 'Source exp', value: detail.sourceExperiment }, { label: 'Route', value: `/findings?tab=questions&focus=${detail.id}` }]} />
    </article>
  );
}

function DatasetDetailView({ detail, navigate }: { detail: DatasetDetail; navigate: (to: string) => void }) {
  return (
    <article className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Database className="size-4 text-text-secondary" strokeWidth={1.75} aria-hidden />
        <StatusBadge value="Dataset" tone="blue" showDot={false} />
        <StatusBadge value={detail.role} tone="neutral" showDot={false} />
      </div>
      <div>
        <h3 className="text-[15px] font-semibold leading-snug text-text">{detail.title}</h3>
      </div>
      <DetailSection label="Relationship to experiment">{detail.relationshipToCurrent}</DetailSection>
      <div className="grid grid-cols-2 gap-3">
        <DetailSection label="Row count">{detail.rowCount}</DetailSection>
        <DetailSection label="Date range">{detail.dateRange}</DetailSection>
        <DetailSection label="Freshness">{detail.freshness}</DetailSection>
      </div>
      <DetailActions actions={detail.actions} navigate={navigate} />
    </article>
  );
}

function DocumentDetailView({ detail, navigate }: { detail: DocumentDetail; navigate: (to: string) => void }) {
  return (
    <article className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="size-4 text-text-secondary" strokeWidth={1.75} aria-hidden />
        <StatusBadge value="Document" tone="neutral" showDot={false} />
        <StatusBadge value={detail.role} tone="neutral" showDot={false} />
      </div>
      <div>
        <h3 className="text-[15px] font-semibold leading-snug text-text">{detail.title}</h3>
      </div>
      <DetailSection label="Relationship to experiment">{detail.relationshipToCurrent}</DetailSection>
      <div className="grid grid-cols-2 gap-3">
        <DetailSection label="Availability">{detail.availability}</DetailSection>
        <DetailSection label="Updated date">{detail.updatedDate}</DetailSection>
      </div>
      <DetailActions actions={detail.actions} navigate={navigate} />
      <TechnicalDetails items={[{ label: 'Source exp', value: detail.sourceExperiment }]} />
    </article>
  );
}

function ArtifactDetailView({ detail, navigate }: { detail: ArtifactDetail; navigate: (to: string) => void }) {
  return (
    <article className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="size-4 text-text-secondary" strokeWidth={1.75} aria-hidden />
        <StatusBadge value="Artifact" tone="teal" showDot={false} />
        <StatusBadge value={detail.role} tone="neutral" showDot={false} />
      </div>
      <div>
        <h3 className="text-[15px] font-semibold leading-snug text-text">{detail.title}</h3>
      </div>
      <DetailSection label="Relationship to experiment">{detail.relationshipToCurrent}</DetailSection>
      <div className="grid grid-cols-2 gap-3">
        <DetailSection label="Type">{detail.artifactType}</DetailSection>
        <DetailSection label="Files">{String(detail.fileCount)}</DetailSection>
        <DetailSection label="Generated date">{detail.generatedDate}</DetailSection>
      </div>
      {detail.files.length > 0 && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">File list</div>
          <ul className="mt-1 space-y-1">
            {detail.files.map((f, i) => (
              <li key={i} className="flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1 font-mono text-[10px] text-text-secondary">
                <FileText className="size-3 shrink-0 text-text-muted" />{f}
              </li>
            ))}
          </ul>
        </div>
      )}
      <DetailActions actions={detail.actions} navigate={navigate} />
      <TechnicalDetails items={[{ label: 'Source exp', value: detail.sourceExperiment }]} />
    </article>
  );
}

function ExperimentDetailView({ detail, navigate }: { detail: ExperimentDetail; navigate: (to: string) => void }) {
  return (
    <article className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <FlaskConical className="size-4 text-text-secondary" strokeWidth={1.75} aria-hidden />
        <StatusBadge value="Experiment" tone="brand" showDot={false} />
      </div>
      <div>
        <h3 className="text-[15px] font-semibold leading-snug text-text">{detail.title}</h3>
        <MonoId className="text-text-muted">{detail.id}</MonoId>
      </div>
      <p className="text-[12px] leading-relaxed text-text-secondary">{detail.summary}</p>
      <DetailSection label="Relationship">{detail.relationshipToCurrent}</DetailSection>
      <div className="grid grid-cols-2 gap-3">
        <DetailSection label="Status">{detail.status}</DetailSection>
        <DetailSection label="Date">{detail.date}</DetailSection>
        <DetailSection label="Stage">{detail.stage}</DetailSection>
      </div>
      <DetailActions actions={detail.actions} navigate={navigate} />
    </article>
  );
}

function ReportDetailView({ detail, navigate }: { detail: ReportDetail; navigate: (to: string) => void }) {
  return (
    <article className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="size-4 text-text-secondary" strokeWidth={1.75} aria-hidden />
        <StatusBadge value="Report" tone="blue" showDot={false} />
        <StatusBadge value={detail.role} tone="neutral" showDot={false} />
      </div>
      <div>
        <h3 className="text-[15px] font-semibold leading-snug text-text">{detail.title}</h3>
      </div>
      <DetailSection label="Relationship to experiment">{detail.relationshipToCurrent}</DetailSection>
      <div className="grid grid-cols-2 gap-3">
        <DetailSection label="Availability">{detail.availability}</DetailSection>
        <DetailSection label="Generated date">{detail.generatedDate}</DetailSection>
      </div>
      <DetailActions actions={detail.actions} navigate={navigate} />
      <TechnicalDetails items={[{ label: 'Source exp', value: detail.sourceExperiment }]} />
    </article>
  );
}

function RelationshipDetailView({ detail, navigate }: { detail: RelationshipDetailModel; navigate: (to: string) => void }) {
  const isUnresolved = detail.from.unresolved || detail.to.unresolved;
  return (
    <article className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <GitBranch className="size-4 text-text-secondary" strokeWidth={1.75} aria-hidden />
        <StatusBadge value="Relationship" tone="neutral" showDot={false} />
        {detail.scope === 'external' && <StatusBadge value="External" tone="neutral" showDot={false} />}
        {detail.scope === 'unresolved' && <StatusBadge value="Unresolved" tone="warning" showDot={false} />}
      </div>
      <div className="flex flex-col gap-2 rounded-sm border border-border-subtle bg-surface-2 p-3">
        <div className="flex items-start gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted w-12 shrink-0">From</span>
          <EndpointBody entity={detail.from} />
        </div>
        <div className="flex items-center gap-2 pl-12 text-text-muted"><ArrowDown className="size-3.5" aria-hidden /></div>
        <div className="flex items-start gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted w-12 shrink-0">To</span>
          <EndpointBody entity={detail.to} />
        </div>
      </div>
      <p className="text-[13px] leading-relaxed text-text">{detail.explanation}</p>
      <DetailSection label="Type">{detail.edgeType}</DetailSection>
      <DetailSection label="Both endpoints visible">{detail.bothEndpointsVisible ? 'Yes' : 'No'}</DetailSection>
      {isUnresolved && (
        <div className="flex items-start gap-2 rounded-sm border border-amber/30 bg-amber/10 px-3 py-2">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber" />
          <p className="text-[12px] text-amber">One endpoint could not be resolved. The relationship is shown for traceability but should not be treated as confirmed.</p>
        </div>
      )}
      <DetailActions actions={detail.actions} navigate={navigate} />
      <TechnicalDetails items={[{ label: 'Source', value: detail.basis }]} />
    </article>
  );
}

function EndpointBody({ entity }: { entity: InOutEntity }) {
  if (entity.unresolved) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[12px] text-amber">{entity.id}</span>
        <span className="text-[11px] text-amber">Referenced entity unavailable</span>
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{ENTITY_KIND_LABEL[entity.kind]}</span>
      <span className="text-[12px] font-medium text-text">{entity.title}</span>
      <span className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-text-muted">
        <span>{entity.id}</span>
        {entity.status && <span>· {entity.status}</span>}
      </span>
    </div>
  );
}

// ── Input/Output detail builders ────────────────────────────────────────

function buildInputDetail(input: InOutInput, experiment: Experiment | null): InOutDetail {
  if (input.role === 'previous-finding') {
    const f = findings.find((x) => x.id === input.entity.id);
    if (f) return buildFindingDetail(f, input.role, experiment);
  }
  if (input.role === 'previous-question') {
    const q = openQuestions.find((x) => x.id === input.entity.id);
    if (q) return buildQuestionDetail(q, input.role, experiment);
  }
  if (input.role === 'source-data' && experiment) return buildDatasetDetail(experiment, input.role);
  if (input.role === 'source-document' && experiment) return buildDocumentDetail(experiment, input.role);
  return {
    kind: 'finding', role: input.role, title: input.entity.title, id: input.entity.id,
    summary: '', confidence: '—', category: '—', actionStatus: '—', date: '—',
    sourceExperiment: '—', relationshipToCurrent: 'Referenced entity unavailable.',
    actions: [], unresolved: true,
  };
}

function buildOutputDetail(output: InOutOutput, experiment: Experiment | null): InOutDetail {
  if (output.role === 'produced-finding' || output.role === 'updated-finding' || output.role === 'carried-forward') {
    const f = findings.find((x) => x.id === output.entity.id);
    if (f) return buildFindingDetail(f, output.role, experiment);
  }
  if (output.role === 'produced-question' || output.role === 'resolved-question' || output.role === 'partially-resolved-question' || output.role === 'updated-question') {
    const q = openQuestions.find((x) => x.id === output.entity.id);
    if (q) return buildQuestionDetail(q, output.role, experiment, output.previousState);
  }
  if (output.role === 'artifact' && experiment) return buildArtifactDetail(experiment, output.role);
  if (output.role === 'generated-report' && experiment) {
    return buildReportDetail(experiment, output.role);
  }
  return {
    kind: 'finding', role: output.role, title: output.entity.title, id: output.entity.id,
    summary: '', confidence: '—', category: '—', actionStatus: '—', date: '—',
    sourceExperiment: '—', relationshipToCurrent: 'Referenced entity unavailable.',
    actions: [], unresolved: true,
  };
}

// ── Mobile flow ─────────────────────────────────────────────────────────

function InOutMobileFlow({ viewModel, selectedInputId, selectedOutputId, onSelectInput, onSelectOutput }: {
  viewModel: InOutViewModel; selectedInputId: string | null; selectedOutputId: string | null;
  onSelectInput: (i: InOutInput) => void; onSelectOutput: (o: InOutOutput) => void;
}) {
  const exp = viewModel.experiment;
  if (!exp) return null;
  const inputGroups = groupInputs(viewModel.inputs);
  const outputGroups = groupOutputs(viewModel.outputs);
  return (
    <ol className="flex w-full flex-col gap-4 px-4 py-4" aria-label="Experiment flow">
      <Step index={1} label="Inputs" count={viewModel.inputs.length}>
        <div className="flex flex-col gap-3">
          {inputGroups.length === 0 ? <GroupEmptyState message="No inputs are recorded for this experiment." /> :
            inputGroups.map((g) => <InputGroup key={`m-i-${g.key}`} title={INPUT_GROUP_TITLE[g.key]} items={g.items} selectedId={selectedInputId} highlightedIds={new Set()} dimUnrelated={false} onSelect={onSelectInput} />)}
        </div>
      </Step>
      <Connector />
      <Step index={2} label="Experiment">
        <article aria-label="Experiment" className="flex flex-col gap-2.5 rounded-sm border border-border-strong bg-elevated px-4 py-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 shrink-0 text-text-secondary" strokeWidth={1.75} aria-hidden />
            <StatusBadge value={EXPERIMENT_STATUS_LABEL[exp.status]} tone={EXPERIMENT_STATUS_TONE[exp.status]} />
          </div>
          <h2 className="text-[14px] font-semibold leading-snug text-text">{exp.title}</h2>
          <MonoId muted className="block break-all text-[10px]">{exp.slug}</MonoId>
        </article>
      </Step>
      <Connector />
      <Step index={3} label="Outcomes" count={viewModel.outputs.length}>
        <div className="flex flex-col gap-3">
          {outputGroups.length === 0 ? <GroupEmptyState message="No outcomes have been registered for this experiment yet." /> :
            outputGroups.map((g) => <OutputGroup key={`m-o-${g.key}`} title={OUTPUT_GROUP_TITLE[g.key]} items={g.items} selectedId={selectedOutputId} highlightedIds={new Set()} dimUnrelated={false} onSelect={onSelectOutput} />)}
        </div>
      </Step>
    </ol>
  );
}

function Step({ index, label, count, children }: { index: number; label: string; count?: number; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-sm border border-border-strong bg-surface-2 font-mono text-[11px] text-text">{index}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
        {count != null && <span className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-muted tabular-nums">{count}</span>}
      </div>
      {children}
    </li>
  );
}

function Connector() {
  return <li aria-hidden className="flex justify-center text-text-muted"><ArrowDown className="size-4" /></li>;
}

function GroupEmptyState({ message }: { message: string }) {
  return <div className="rounded-sm border border-dashed border-border-subtle bg-surface-2/40 px-3 py-3 text-[12px] text-text-muted">{message}</div>;
}

// ── Additional relationships panel ──────────────────────────────────────

function AdditionalRelationshipsPanel({ viewModel, selectedRelationshipId, onSelectRelationship }: {
  viewModel: InOutViewModel; selectedRelationshipId: string | null; onSelectRelationship: (r: InOutRelationship) => void;
}) {
  const [open, setOpen] = useState(false);
  const list = viewModel.additionalRelationships;
  if (list.length === 0) {
    return (
      <section aria-label="Additional relationships" className="mt-4 rounded-sm border border-dashed border-border-subtle bg-surface-2/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <GitBranch className="size-3.5 text-text-muted" aria-hidden />
          <h2 className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Additional relationships</h2>
        </div>
        <p className="mt-0.5 text-[12px] text-text-muted">No external or unresolved relationships found.</p>
      </section>
    );
  }
  const externalCount = list.filter((r) => r.scope === 'external').length;
  const unresolvedCount = list.filter((r) => r.scope === 'unresolved').length;
  const crossCount = list.filter((r) => r.scope === 'visible').length;
  return (
    <section aria-label="Additional relationships" className="mt-4 rounded-sm border border-border-subtle bg-surface">
      <header className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
        <div className="flex items-center gap-2">
          <GitBranch className="size-3.5 text-text-muted" aria-hidden />
          <h2 className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Additional relationships</h2>
          <span className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] text-text-muted tabular-nums">{list.length}</span>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="inout-additional-rels"
          className="flex min-h-8 items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2.5 font-mono text-[10px] text-text-secondary hover:border-border-strong hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring">
          {open ? 'Hide' : 'Show'}
          <ArrowDown className={cn('size-3 transition-transform', open && 'rotate-180')} aria-hidden />
        </button>
      </header>
      {open && (
        <div id="inout-additional-rels" className="flex flex-col gap-2 p-3">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-text-muted">
            <span>{crossCount} visible</span><span aria-hidden>·</span>
            <span>{externalCount} external</span><span aria-hidden>·</span>
            <span>{unresolvedCount} unresolved</span>
          </div>
          <ul className="flex flex-col gap-1">
            {list.map((r) => <RelationshipRow key={r.id} relationship={r} selected={r.id === selectedRelationshipId} onSelect={onSelectRelationship} />)}
          </ul>
        </div>
      )}
    </section>
  );
}

function RelationshipRow({ relationship, selected, onSelect }: {
  relationship: InOutRelationship; selected: boolean; onSelect: (r: InOutRelationship) => void;
}) {
  const fromTitle = relationship.from.unresolved ? relationship.from.id : relationship.from.title;
  const toTitle = relationship.to.unresolved ? relationship.to.id : relationship.to.title;
  const fromId = relationship.from.id;
  const toId = relationship.to.id;
  const verb = relationship.label;
  return (
    <li>
      <button type="button" onClick={() => onSelect(relationship)} aria-pressed={selected}
        title={`${fromTitle} ${verb} ${toTitle}`}
        className={cn('flex w-full flex-col gap-0.5 rounded-sm border px-2.5 py-1.5 text-left transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring',
          selected ? SELECTED_CARD_CLS : 'border-border-subtle bg-surface-2 hover:border-border-strong hover:bg-surface')}>
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-[12px] font-medium text-text">{fromTitle}</span>
          <ArrowRight className="size-3 shrink-0 text-text-muted" aria-hidden />
          <span className="truncate text-[12px] font-medium text-text">{toTitle}</span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted">
          {fromId} → {toId} · {verb} · {relationship.basis ?? '—'}
        </span>
        {relationship.scope === 'external' && <StatusBadge value="External" tone="neutral" showDot={false} />}
        {relationship.scope === 'unresolved' && <StatusBadge value="Unresolved" tone="warning" showDot={false} />}
      </button>
    </li>
  );
}

// ── Grouping helpers ────────────────────────────────────────────────────

function groupInputs(inputs: InOutInput[]): { key: InOutInput['group']; items: InOutInput[] }[] {
  const groups: Record<InOutInput['group'], InOutInput[]> = { 'previous-findings': [], 'previous-questions': [], data: [], documents: [] };
  for (const i of inputs) groups[i.group].push(i);
  return INPUT_GROUP_ORDER.filter((key) => groups[key].length > 0).map((key) => ({ key, items: groups[key] }));
}

function groupOutputs(outputs: InOutOutput[]): { key: InOutOutput['group']; items: InOutOutput[] }[] {
  const groups: Record<InOutOutput['group'], InOutOutput[]> = {
    'new-findings': [], 'new-questions': [], 'updated-findings': [], 'resolved-questions': [],
    'carried-forward': [], 'artifacts': [], 'generated-report': [],
  };
  for (const o of outputs) groups[o.group].push(o);
  return OUTPUT_GROUP_ORDER.filter((key) => groups[key].length > 0).map((key) => ({ key, items: groups[key] }));
}

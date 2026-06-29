import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  ArrowRight,
  ArrowDown,
  AlertTriangle,
  GitBranch,
  FileText,
  FlaskConical,
  Database,
  CircleHelp,
  X,
  Check,
  ChevronsUpDown,
  Search,
  ExternalLink,
  Link2,
  Unlink,
  type LucideIcon,
} from 'lucide-react';
import {
  buildInOutViewModel,
  experiments,
  findings,
  openQuestions,
  edges,
  getExperimentBySlug,
  describeRelationshipSentence,
  formatShortId,
  type InOutEntity,
  type InOutExperiment,
  type InOutInput,
  type InOutOutput,
  type InOutRelationship,
  type InOutViewModel,
} from '../../data';
import { ScreenHeader, MonoId } from '../common/primitives';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { NavActionButton, AskClaudeButton } from '../common/AskClaudeActions';
import { IconButton } from '../common/IconButton';
import { useBreakpoint } from '../responsive/useBreakpoint';
import { cn } from '../ui/utils';

// ── Visual tokens ───────────────────────────────────────────────────────

const INPUT_ROLE_LABEL: Record<InOutInput['role'], string> = {
  'previous-finding': 'Previous finding',
  'previous-question': 'Previous open question',
  'source-data': 'Source data',
  'source-document': 'Source document',
};

const OUTPUT_ROLE_LABEL: Record<InOutOutput['role'], string> = {
  'produced-finding': 'Produced finding',
  'produced-question': 'Produced open question',
  'updated-finding': 'Updated finding',
  'carried-forward': 'Carried forward',
  artifact: 'Artifact',
};

const INPUT_ROLE_TONE: Record<InOutInput['role'], 'green' | 'amber' | 'blue' | 'muted'> = {
  'previous-finding': 'green',
  'previous-question': 'amber',
  'source-data': 'blue',
  'source-document': 'muted',
};

const OUTPUT_ROLE_TONE: Record<InOutOutput['role'], 'green' | 'amber' | 'teal' | 'purple' | 'muted'> = {
  'produced-finding': 'green',
  'produced-question': 'amber',
  'updated-finding': 'purple',
  'carried-forward': 'muted',
  artifact: 'teal',
};

const INPUT_ROLE_ICON: Record<InOutInput['role'], LucideIcon> = {
  'previous-finding': FlaskConical,
  'previous-question': CircleHelp,
  'source-data': Database,
  'source-document': FileText,
};

const OUTPUT_ROLE_ICON: Record<InOutOutput['role'], LucideIcon> = {
  'produced-finding': FlaskConical,
  'produced-question': CircleHelp,
  'updated-finding': GitBranch,
  'carried-forward': Link2,
  artifact: FileText,
};

const GROUP_TITLE: Record<InOutInput['group'], string> = {
  data: 'Data',
  documents: 'Documents',
  'previous-findings': 'Previous findings',
  'previous-questions': 'Previous open questions',
};

const OUTPUT_GROUP_TITLE: Record<InOutOutput['group'], string> = {
  findings: 'Findings',
  'open-questions': 'Open questions',
  artifacts: 'Artifacts',
};

const EXPERIMENT_STATUS_LABEL: Record<InOutExperiment['status'], string> = {
  completed: 'Completed',
  'in-progress': 'In progress',
  planned: 'Planned',
  exploration: 'Exploration',
  blocked: 'Superseded data',
};

const EXPERIMENT_STATUS_TONE: Record<InOutExperiment['status'], Parameters<typeof StatusBadge>[0]['tone']> = {
  completed: 'success',
  'in-progress': 'info',
  planned: 'neutral',
  exploration: 'warning',
  blocked: 'error',
};

const ENTITY_KIND_LABEL: Record<InOutEntity['kind'], string> = {
  finding: 'Finding',
  question: 'Open question',
  experiment: 'Experiment',
  document: 'Document',
  dataset: 'Dataset',
  artifact: 'Artifact',
  unknown: 'Unknown',
};

// ── Screen ──────────────────────────────────────────────────────────────

export function InOutScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const focusParam = params.get('focus');
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';

  const sortedExperiments = useMemo(
    () => [...experiments].sort((a, b) => b.date.localeCompare(a.date)),
    [],
  );

  const [selectedSlug, setSelectedSlug] = useState<string | null>(() => {
    if (focusParam && getExperimentBySlug(focusParam)) return focusParam;
    return sortedExperiments[0]?.slug ?? null;
  });

  useEffect(() => {
    if (focusParam && getExperimentBySlug(focusParam)) {
      setSelectedSlug(focusParam);
    }
  }, [focusParam]);

  const viewModel = useMemo<InOutViewModel>(() => {
    return buildInOutViewModel({
      experiments,
      findings,
      openQuestions,
      edges,
      focusSlug: selectedSlug ?? undefined,
    });
  }, [selectedSlug]);

  const [selectedInputId, setSelectedInputId] = useState<string | null>(null);
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);

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

  const closeDetail = useCallback(() => {
    setSelectedInputId(null);
    setSelectedOutputId(null);
    setSelectedRelationshipId(null);
  }, []);

  // Reset selections when the experiment changes.
  useEffect(() => {
    setSelectedInputId(null);
    setSelectedOutputId(null);
    setSelectedRelationshipId(null);
  }, [selectedSlug]);

  // Determine which relationships are "highlighted" by the current selection.
  // - If an input is selected, highlight its visible connection.
  // - If an output is selected, highlight its visible connection.
  // - If a relationship is selected, highlight its two endpoints.
  // - If nothing is selected but the experiment is "active" (i.e. we have
  //   detail closed), all visible relationships are equally un-highlighted.
  const highlightedInputIds = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    if (selectedInputId) set.add(selectedInputId);
    if (selectedRelationship) {
      const inId = viewModel.inputs.find((i) => i.entity.id === selectedRelationship.from.id)?.id;
      if (inId) set.add(inId);
    }
    return set;
  }, [selectedInputId, selectedRelationship, viewModel.inputs]);

  const highlightedOutputIds = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    if (selectedOutputId) set.add(selectedOutputId);
    if (selectedRelationship) {
      const outId = viewModel.outputs.find((o) => o.entity.id === selectedRelationship.to.id)?.id;
      if (outId) set.add(outId);
    }
    return set;
  }, [selectedOutputId, selectedRelationship, viewModel.outputs]);

  const dimUnrelated = !!(selectedInputId || selectedOutputId || selectedRelationship);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScreenHeader
        title="In/Out"
        subtitle="Trace inputs into the experiment, what it processed, and what it produced."
        right={
          <InOutCombobox
            experiments={sortedExperiments}
            selectedSlug={selectedSlug}
            onSelect={setSelectedSlug}
            inputCount={viewModel.inputs.length}
            outputCount={viewModel.outputs.length}
            relationshipCount={viewModel.visibleRelationships.length}
          />
        }
      />

      <div className="min-h-0 flex-1 overflow-auto bg-background">
        {!viewModel.experiment ? (
          <EmptyState
            icon={GitBranch}
            title="No experiment selected"
            hint="Pick an experiment from the selector to view its inputs, processing context, and outputs."
          />
        ) : isMobile ? (
          <InOutMobileFlow
            viewModel={viewModel}
            selectedInputId={selectedInputId}
            selectedOutputId={selectedOutputId}
            onSelectInput={(i) => {
              setSelectedRelationshipId(null);
              setSelectedInputId(i.id);
              setSelectedOutputId(null);
            }}
            onSelectOutput={(o) => {
              setSelectedRelationshipId(null);
              setSelectedOutputId(o.id);
              setSelectedInputId(null);
            }}
            onOpenExperimentDetail={() => {
              if (!viewModel.experiment) return;
              // Mobile detail opens the experiment entity detail.
            }}
          />
        ) : (
          <InOutMap
            viewModel={viewModel}
            selectedInputId={selectedInputId}
            selectedOutputId={selectedOutputId}
            selectedRelationshipId={selectedRelationshipId}
            highlightedInputIds={highlightedInputIds}
            highlightedOutputIds={highlightedOutputIds}
            dimUnrelated={dimUnrelated}
            onSelectInput={(i) => {
              setSelectedRelationshipId(null);
              setSelectedInputId(i.id);
              setSelectedOutputId(null);
            }}
            onSelectOutput={(o) => {
              setSelectedRelationshipId(null);
              setSelectedOutputId(o.id);
              setSelectedInputId(null);
            }}
            onSelectRelationship={(r) => {
              setSelectedRelationshipId(r.id);
              setSelectedInputId(null);
              setSelectedOutputId(null);
            }}
            onCloseDetail={closeDetail}
            navigate={navigate}
          />
        )}
      </div>

      {/* Mobile: full-screen detail sheet */}
      {isMobile && detailOpen && (
        <InOutDetailSheet
          viewModel={viewModel}
          selectedInput={selectedInput}
          selectedOutput={selectedOutput}
          selectedRelationship={selectedRelationship}
          onClose={closeDetail}
          navigate={navigate}
        />
      )}
    </div>
  );
}

// ── Combobox ────────────────────────────────────────────────────────────

function InOutCombobox({
  experiments,
  selectedSlug,
  onSelect,
  inputCount,
  outputCount,
  relationshipCount,
}: {
  experiments: { slug: string; title: string; date: string }[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  inputCount: number;
  outputCount: number;
  relationshipCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = experiments.find((e) => e.slug === selectedSlug) ?? experiments[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return experiments;
    return experiments.filter(
      (e) => e.title.toLowerCase().includes(q) || formatShortId(e.slug).toLowerCase().includes(q),
    );
  }, [experiments, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        const choice = filtered[activeIndex];
        if (choice) {
          e.preventDefault();
          onSelect(choice.slug);
          setOpen(false);
          setQuery('');
          triggerRef.current?.focus();
        }
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
    <div className="flex w-full flex-wrap items-center justify-end gap-2 md:flex-nowrap">
      <div className="flex w-full min-w-0 flex-col gap-1 md:w-[300px]">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Experiment</span>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Select experiment"
          className={cn(
            'flex min-h-9 w-full items-center justify-between gap-2 rounded-sm border bg-surface-2 px-2.5 text-left text-text outline-none',
            'transition-colors hover:border-border-strong',
            'focus-visible:ring-2 focus-visible:ring-brand-ring',
            open ? 'border-brand-border' : 'border-border-subtle',
          )}
        >
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-medium text-text">{selected?.title ?? 'Select an experiment'}</span>
            <span className="truncate font-mono text-[10px] text-text-muted">
              {selected ? formatShortId(selected.slug) : 'No experiments available'}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-text-muted" aria-hidden />
        </button>
      </div>
      <div className="ml-auto flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-text-muted">
        <span>{inputCount} inputs</span>
        <span aria-hidden>·</span>
        <span>{outputCount} outputs</span>
        <span aria-hidden>·</span>
        <span>{relationshipCount} connections</span>
      </div>

      {open && (
        <div
          role="presentation"
          className="fixed inset-0 z-40 flex items-start justify-center px-4 pt-[12vh] md:items-start md:justify-end md:pr-4 md:pt-[10vh]"
        >
          <button
            type="button"
            aria-label="Close experiment selector"
            onClick={() => {
              setOpen(false);
              setQuery('');
              triggerRef.current?.focus();
            }}
            className="absolute inset-0 bg-black/60"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Select experiment"
            className="relative z-50 flex max-h-[70vh] w-full max-w-[420px] flex-col overflow-hidden rounded-sm border border-border-strong bg-surface shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
              <Search className="size-4 shrink-0 text-text-muted" aria-hidden />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title or ID…"
                className="flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
                aria-label="Search experiments"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setQuery('');
                  triggerRef.current?.focus();
                }}
                aria-label="Close"
                className="flex size-7 items-center justify-center rounded-sm text-text-muted hover:bg-surface-hover hover:text-text"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <ul
              ref={listRef}
              role="listbox"
              aria-label="Experiments"
              className="min-h-0 flex-1 overflow-auto p-1"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-[12px] text-text-muted">
                  No experiments match “{query}”
                </li>
              ) : (
                filtered.map((e, i) => {
                  const isSelected = e.slug === selectedSlug;
                  const isActive = i === activeIndex;
                  return (
                    <li key={e.slug} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        data-idx={i}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => {
                          onSelect(e.slug);
                          setOpen(false);
                          setQuery('');
                          triggerRef.current?.focus();
                        }}
                        className={cn(
                          'flex w-full min-h-11 flex-col gap-0.5 rounded-sm px-2.5 py-1.5 text-left transition-colors',
                          isActive ? 'bg-surface-hover' : 'bg-transparent',
                          isSelected && 'bg-brand-muted/40',
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[13px] font-medium text-text">{e.title}</span>
                          {isSelected && <Check className="size-3.5 shrink-0 text-brand" aria-hidden />}
                        </span>
                        <span className="flex items-center gap-2 truncate font-mono text-[10px] text-text-muted">
                          <span>{formatShortId(e.slug)}</span>
                          <span aria-hidden>·</span>
                          <span>{e.date}</span>
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="border-t border-border-subtle px-3 py-1.5 font-mono text-[10px] text-text-muted">
              {filtered.length} of {experiments.length} · ↑↓ navigate · ↵ select · esc close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Map view (desktop / tablet) ─────────────────────────────────────────

function InOutMap({
  viewModel,
  selectedInputId,
  selectedOutputId,
  selectedRelationshipId,
  highlightedInputIds,
  highlightedOutputIds,
  dimUnrelated,
  onSelectInput,
  onSelectOutput,
  onSelectRelationship,
  onCloseDetail,
  navigate,
}: {
  viewModel: InOutViewModel;
  selectedInputId: string | null;
  selectedOutputId: string | null;
  selectedRelationshipId: string | null;
  highlightedInputIds: Set<string>;
  highlightedOutputIds: Set<string>;
  dimUnrelated: boolean;
  onSelectInput: (i: InOutInput) => void;
  onSelectOutput: (o: InOutOutput) => void;
  onSelectRelationship: (r: InOutRelationship) => void;
  onCloseDetail: () => void;
  navigate: (to: string) => void;
}) {
  const detailOpen = !!(selectedInputId || selectedOutputId || selectedRelationshipId);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-4 py-6 sm:px-6">
      <div
        className={cn(
          'grid gap-x-4 gap-y-3',
          detailOpen
            ? 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,420px)]'
            : 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)]',
        )}
      >
        <InputsColumn
          viewModel={viewModel}
          selectedId={selectedInputId}
          highlightedIds={highlightedInputIds}
          dimUnrelated={dimUnrelated}
          onSelect={onSelectInput}
        />
        <ExperimentColumn viewModel={viewModel} onCloseDetail={onCloseDetail} detailOpen={detailOpen} />
        <OutputsColumn
          viewModel={viewModel}
          selectedId={selectedOutputId}
          highlightedIds={highlightedOutputIds}
          dimUnrelated={dimUnrelated}
          onSelect={onSelectOutput}
        />
        {detailOpen && (
          <DetailPanel
            viewModel={viewModel}
            selectedInputId={selectedInputId}
            selectedOutputId={selectedOutputId}
            selectedRelationshipId={selectedRelationshipId}
            onSelectRelationship={onSelectRelationship}
            onClose={onCloseDetail}
            navigate={navigate}
          />
        )}
      </div>

      <AdditionalRelationshipsPanel
        viewModel={viewModel}
        selectedRelationshipId={selectedRelationshipId}
        onSelectRelationship={onSelectRelationship}
      />
    </div>
  );
}

// ── Inputs column ───────────────────────────────────────────────────────

function InputsColumn({
  viewModel,
  selectedId,
  highlightedIds,
  dimUnrelated,
  onSelect,
}: {
  viewModel: InOutViewModel;
  selectedId: string | null;
  highlightedIds: Set<string>;
  dimUnrelated: boolean;
  onSelect: (i: InOutInput) => void;
}) {
  const groups = useMemo(() => groupInputs(viewModel.inputs), [viewModel.inputs]);
  return (
    <section aria-label="Inputs" className="flex min-w-0 flex-col">
      <ColumnHeader
        eyebrow="Inputs"
        title="What went into the experiment"
        count={viewModel.inputs.length}
        align="left"
      />
      <div className="flex flex-col gap-5">
        {groups.length === 0 ? (
          <GroupEmptyState message="No inputs are recorded for this experiment." />
        ) : (
          groups.map((g) => (
            <InputGroup
              key={g.key}
              groupKey={g.key}
              title={GROUP_TITLE[g.key]}
              items={g.items}
              selectedId={selectedId}
              highlightedIds={highlightedIds}
              dimUnrelated={dimUnrelated}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </section>
  );
}

function InputGroup({
  groupKey,
  title,
  items,
  selectedId,
  highlightedIds,
  dimUnrelated,
  onSelect,
}: {
  groupKey: InOutInput['group'];
  title: string;
  items: InOutInput[];
  selectedId: string | null;
  highlightedIds: Set<string>;
  dimUnrelated: boolean;
  onSelect: (i: InOutInput) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">
        <span>{title}</span>
        <span className="tabular-nums text-text-muted/70">{items.length}</span>
      </h3>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <EntityCard
            key={item.id}
            id={item.id}
            kind="input"
            roleLabel={INPUT_ROLE_LABEL[item.role]}
            roleTone={INPUT_ROLE_TONE[item.role]}
            Icon={INPUT_ROLE_ICON[item.role]}
            entity={item.entity}
            note={item.note}
            selected={selectedId === item.id}
            highlighted={highlightedIds.has(item.id)}
            dim={dimUnrelated && !highlightedIds.has(item.id) && selectedId !== item.id}
            onClick={() => onSelect(item)}
          />
        ))}
      </div>
    </div>
  );
}

function OutputsColumn({
  viewModel,
  selectedId,
  highlightedIds,
  dimUnrelated,
  onSelect,
}: {
  viewModel: InOutViewModel;
  selectedId: string | null;
  highlightedIds: Set<string>;
  dimUnrelated: boolean;
  onSelect: (o: InOutOutput) => void;
}) {
  const groups = useMemo(() => groupOutputs(viewModel.outputs), [viewModel.outputs]);
  return (
    <section aria-label="Outputs" className="flex min-w-0 flex-col">
      <ColumnHeader
        eyebrow="Outputs"
        title="What the experiment produced"
        count={viewModel.outputs.length}
        align="right"
      />
      <div className="flex flex-col gap-5">
        {groups.length === 0 ? (
          <GroupEmptyState message="No outputs have been registered for this experiment yet." />
        ) : (
          groups.map((g) => (
            <OutputGroup
              key={g.key}
              groupKey={g.key}
              title={OUTPUT_GROUP_TITLE[g.key]}
              items={g.items}
              selectedId={selectedId}
              highlightedIds={highlightedIds}
              dimUnrelated={dimUnrelated}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </section>
  );
}

function OutputGroup({
  groupKey,
  title,
  items,
  selectedId,
  highlightedIds,
  dimUnrelated,
  onSelect,
}: {
  groupKey: InOutOutput['group'];
  title: string;
  items: InOutOutput[];
  selectedId: string | null;
  highlightedIds: Set<string>;
  dimUnrelated: boolean;
  onSelect: (o: InOutOutput) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">
        <span>{title}</span>
        <span className="tabular-nums text-text-muted/70">{items.length}</span>
      </h3>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <EntityCard
            key={item.id}
            id={item.id}
            kind="output"
            roleLabel={OUTPUT_ROLE_LABEL[item.role]}
            roleTone={OUTPUT_ROLE_TONE[item.role]}
            Icon={OUTPUT_ROLE_ICON[item.role]}
            entity={item.entity}
            note={item.note}
            selected={selectedId === item.id}
            highlighted={highlightedIds.has(item.id)}
            dim={dimUnrelated && !highlightedIds.has(item.id) && selectedId !== item.id}
            onClick={() => onSelect(item)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Experiment column ───────────────────────────────────────────────────

function ExperimentColumn({
  viewModel,
  detailOpen,
  onCloseDetail,
}: {
  viewModel: InOutViewModel;
  detailOpen: boolean;
  onCloseDetail: () => void;
}) {
  const exp = viewModel.experiment;
  if (!exp) return null;
  const figures = pluralizeExp(exp.meta.figuresCount, 'figure', 'figures');
  const findings = pluralizeExp(exp.meta.findingsCount, 'finding', 'findings');
  const questions = pluralizeExp(exp.meta.questionsCount, 'open question', 'open questions');

  return (
    <section aria-label="Experiment" className="flex min-w-0 flex-col items-stretch">
      <ColumnHeader eyebrow="Experiment" title="The selected experiment" count={null} align="center" />
      <article
        className={cn(
          'relative flex flex-col gap-3 rounded-sm border-2 border-brand-border bg-elevated px-5 py-4',
          'shadow-[inset_0_0_0_1px_rgba(255,62,1,0.04)]',
        )}
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="size-4 shrink-0 text-brand" strokeWidth={1.75} />
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Experiment</span>
          <StatusBadge
            value={EXPERIMENT_STATUS_LABEL[exp.status]}
            tone={EXPERIMENT_STATUS_TONE[exp.status]}
          />
        </div>
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold leading-snug text-text">{exp.title}</h2>
          <MonoId muted className="mt-1 block break-all text-[10px] sm:text-[11px]">{exp.slug}</MonoId>
        </div>

        {exp.description && (
          <p className="text-[13px] leading-relaxed text-text-secondary">{exp.description}</p>
        )}

        <dl className="grid grid-cols-2 gap-3 border-t border-border-subtle pt-3 sm:grid-cols-4">
          <ExperimentMeta label="Date" value={exp.date} />
          <ExperimentMeta label="Stage" value={exp.stage} />
          <ExperimentMeta label="Findings" value={findings} />
          <ExperimentMeta label="Open Qs" value={questions} />
        </dl>
        <p className="text-[11px] text-text-muted">
          <span className="font-mono">{figures}</span> · <span className="font-mono">{exp.lastModified}</span>
        </p>

        {detailOpen && (
          <button
            type="button"
            onClick={onCloseDetail}
            className="self-end font-mono text-[10px] uppercase tracking-wider text-text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
          >
            Close detail
          </button>
        )}
      </article>
    </section>
  );
}

function pluralizeExp(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

function ExperimentMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[9px] uppercase tracking-wider text-text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-[12px] text-text">{value}</dd>
    </div>
  );
}

// ── Entity card ─────────────────────────────────────────────────────────

function EntityCard({
  id,
  kind,
  roleLabel,
  roleTone,
  Icon,
  entity,
  note,
  selected,
  highlighted,
  dim,
  onClick,
}: {
  id: string;
  kind: 'input' | 'output';
  roleLabel: string;
  roleTone: 'green' | 'amber' | 'blue' | 'teal' | 'purple' | 'muted';
  Icon: LucideIcon;
  entity: InOutEntity;
  note?: string;
  selected: boolean;
  highlighted: boolean;
  dim: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-card-id={id}
      data-card-kind={kind}
      data-card-entity-id={entity.id}
      aria-pressed={selected}
      className={cn(
        'group relative flex w-full min-h-11 items-start gap-2.5 rounded-sm border bg-surface-2 px-2.5 py-2 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring',
        selected
          ? 'border-brand-border bg-brand-muted shadow-[inset_0_0_0_1px_rgba(255,62,1,0.06)]'
          : highlighted
            ? 'border-brand/40 bg-surface-2'
            : 'border-border-subtle hover:border-border-strong hover:bg-surface',
        dim && 'opacity-55',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-sm border bg-surface',
          selected
            ? 'border-brand-border text-brand'
            : highlighted
              ? 'border-brand/40 text-brand'
              : 'border-border-strong text-text-secondary',
        )}
        aria-hidden
      >
        <Icon className="size-3.5" strokeWidth={1.75} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{roleLabel}</span>
          <RoleDot tone={roleTone} />
        </span>
        <span className="line-clamp-2 text-[13px] font-medium leading-snug text-text">{entity.title}</span>
        <span className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-text-muted">
          <span className="truncate">{entity.id}</span>
          {entity.status && <span className="text-text-muted/70">· {entity.status}</span>}
          {note && <span className="text-text-muted/70">· {note}</span>}
        </span>
      </span>
    </button>
  );
}

function RoleDot({ tone }: { tone: 'green' | 'amber' | 'blue' | 'teal' | 'purple' | 'muted' }) {
  const color = TONE_TO_DOT[tone];
  return <span className={cn('inline-block size-1.5 rounded-full', color)} aria-hidden />;
}

const TONE_TO_DOT: Record<'green' | 'amber' | 'blue' | 'teal' | 'purple' | 'muted', string> = {
  green: 'bg-green',
  amber: 'bg-amber',
  blue: 'bg-blue',
  teal: 'bg-teal',
  purple: 'bg-purple',
  muted: 'bg-text-muted',
};

// ── Column header ───────────────────────────────────────────────────────

function ColumnHeader({
  eyebrow,
  title,
  count,
  align,
}: {
  eyebrow: string;
  title: string;
  count: number | null;
  align: 'left' | 'center' | 'right';
}) {
  return (
    <header
      className={cn(
        'mb-2 flex flex-col gap-0.5',
        align === 'left' && 'items-start text-left',
        align === 'center' && 'items-center text-center',
        align === 'right' && 'items-end text-right',
      )}
    >
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{eyebrow}</span>
      <div
        className={cn(
          'flex items-baseline gap-2',
          align === 'right' && 'flex-row-reverse',
        )}
      >
        <h2 className="text-[14px] font-medium text-text">{title}</h2>
        {count != null && (
          <span className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-muted tabular-nums">
            {count}
          </span>
        )}
      </div>
    </header>
  );
}

// ── Detail panel (desktop / tablet) ─────────────────────────────────────

function DetailPanel({
  viewModel,
  selectedInputId,
  selectedOutputId,
  selectedRelationshipId,
  onSelectRelationship,
  onClose,
  navigate,
}: {
  viewModel: InOutViewModel;
  selectedInputId: string | null;
  selectedOutputId: string | null;
  selectedRelationshipId: string | null;
  onSelectRelationship: (r: InOutRelationship) => void;
  onClose: () => void;
  navigate: (to: string) => void;
}) {
  const selectedInput = viewModel.inputs.find((i) => i.id === selectedInputId) ?? null;
  const selectedOutput = viewModel.outputs.find((o) => o.id === selectedOutputId) ?? null;
  const selectedRelationship =
    viewModel.relationships.find((r) => r.id === selectedRelationshipId) ?? null;

  return (
    <aside
      role="complementary"
      aria-label="Entity detail"
      className="flex min-w-0 flex-col rounded-sm border border-border-subtle bg-surface"
    >
      <header className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Detail</span>
        <IconButton icon={X} label="Close detail" onClick={onClose} />
      </header>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        {selectedInput && (
          <InputDetail
            input={selectedInput}
            experiment={viewModel.experiment}
            onSelectRelationship={onSelectRelationship}
            onClose={onClose}
            navigate={navigate}
          />
        )}
        {selectedOutput && (
          <OutputDetail
            output={selectedOutput}
            experiment={viewModel.experiment}
            onSelectRelationship={onSelectRelationship}
            onClose={onClose}
            navigate={navigate}
          />
        )}
        {selectedRelationship && (
          <RelationshipDetail
            relationship={selectedRelationship}
            experiment={viewModel.experiment}
            onSelectRelationship={onSelectRelationship}
            onClose={onClose}
            navigate={navigate}
          />
        )}
      </div>
    </aside>
  );
}

function InputDetail({
  input,
  experiment,
  onSelectRelationship,
  onClose,
  navigate,
}: {
  input: InOutInput;
  experiment: InOutExperiment | null;
  onSelectRelationship: (r: InOutRelationship) => void;
  onClose: () => void;
  navigate: (to: string) => void;
}) {
  const Icon = INPUT_ROLE_ICON[input.role];
  return (
    <article className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-text-secondary" strokeWidth={1.75} aria-hidden />
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Input · {ENTITY_KIND_LABEL[input.entity.kind]}</span>
        <StatusBadge value={INPUT_ROLE_LABEL[input.role]} tone={INPUT_ROLE_TONE[input.role] === 'muted' ? 'neutral' : INPUT_ROLE_TONE[input.role]} showDot={false} />
      </div>
      <h3 className="text-[15px] font-semibold leading-snug text-text">{input.entity.title}</h3>
      <MonoId className="text-text-muted">{input.entity.id}</MonoId>

      {input.entity.unresolved ? (
        <UnavailableState />
      ) : (
        <p className="text-[12px] text-text-secondary">
          {sentenceFor(input.entity, experiment, 'input')}
        </p>
      )}

      {input.note && <DetailRow label="Note" value={input.note} />}

      {input.entity.status && <DetailRow label="Status" value={input.entity.status} />}

      {input.entity.href && <DetailRow label="Link" value={input.entity.href} mono />}

      <DetailActions
        primary={input.entity.href ? { label: 'Open in findings', href: input.entity.href } : null}
        askAgent={`/chat?ctx=${encodeURIComponent(input.entity.id)}`}
        navigate={navigate}
      />
    </article>
  );
}

function OutputDetail({
  output,
  experiment,
  onSelectRelationship,
  onClose,
  navigate,
}: {
  output: InOutOutput;
  experiment: InOutExperiment | null;
  onSelectRelationship: (r: InOutRelationship) => void;
  onClose: () => void;
  navigate: (to: string) => void;
}) {
  const Icon = OUTPUT_ROLE_ICON[output.role];
  return (
    <article className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-text-secondary" strokeWidth={1.75} aria-hidden />
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Output · {ENTITY_KIND_LABEL[output.entity.kind]}</span>
        <StatusBadge
          value={OUTPUT_ROLE_LABEL[output.role]}
          tone={
            OUTPUT_ROLE_TONE[output.role] === 'muted'
              ? 'neutral'
              : OUTPUT_ROLE_TONE[output.role]
          }
          showDot={false}
        />
      </div>
      <h3 className="text-[15px] font-semibold leading-snug text-text">{output.entity.title}</h3>
      <MonoId className="text-text-muted">{output.entity.id}</MonoId>

      {output.entity.unresolved ? (
        <UnavailableState />
      ) : (
        <p className="text-[12px] text-text-secondary">
          {sentenceFor(output.entity, experiment, 'output')}
        </p>
      )}

      {output.note && <DetailRow label="Note" value={output.note} />}
      {output.entity.status && <DetailRow label="Status" value={output.entity.status} />}
      {output.entity.href && <DetailRow label="Link" value={output.entity.href} mono />}

      <DetailActions
        primary={output.entity.href ? { label: 'Open in findings', href: output.entity.href } : null}
        askAgent={`/chat?ctx=${encodeURIComponent(output.entity.id)}`}
        navigate={navigate}
      />
    </article>
  );
}

function RelationshipDetail({
  relationship,
  experiment,
  onClose,
  navigate,
}: {
  relationship: InOutRelationship;
  experiment: InOutExperiment | null;
  onSelectRelationship: (r: InOutRelationship) => void;
  onClose: () => void;
  navigate: (to: string) => void;
}) {
  const isUnresolved = relationship.from.unresolved || relationship.to.unresolved;
  const isExternal = relationship.scope === 'external';
  const sentence = describeRelationshipSentence(relationship.from, relationship.to, relationship.edgeType);

  return (
    <article className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <GitBranch className="size-4 text-text-secondary" strokeWidth={1.75} aria-hidden />
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Relationship</span>
        <StatusBadge value={relationship.label} tone="muted" showDot={false} />
        {relationship.scope === 'external' && <StatusBadge value="External" tone="neutral" showDot={false} />}
        {relationship.scope === 'unresolved' && <StatusBadge value="Unresolved" tone="warning" showDot={false} />}
      </div>

      <RelationshipEndpoints from={relationship.from} to={relationship.to} />

      <p className="text-[13px] leading-relaxed text-text">{sentence}</p>

      {relationship.detail && <DetailRow label="Detail" value={relationship.detail} />}

      {isUnresolved && (
        <div className="flex items-start gap-2 rounded-sm border border-amber/30 bg-amber/10 px-3 py-2">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber" />
          <p className="text-[12px] text-amber">
            One endpoint could not be resolved. The relationship is shown for traceability but should not be treated as confirmed.
          </p>
        </div>
      )}

      {!isExternal && !isUnresolved && relationship.basis && (
        <DetailRow label="Source" value={relationship.basis} mono />
      )}

      <DetailActions
        primary={
          experiment
            ? { label: 'Open experiment report', href: `/experiments/${experiment.slug}` }
            : null
        }
        askAgent={
          experiment
            ? `/chat?ctx=${encodeURIComponent(`${relationship.from.id}→${relationship.to.id}`)}`
            : `/chat?ctx=relationship`
        }
        navigate={navigate}
      />
    </article>
  );
}

function RelationshipEndpoints({ from, to }: { from: InOutEntity; to: InOutEntity }) {
  return (
    <div className="flex flex-col gap-2 rounded-sm border border-border-subtle bg-surface-2 p-3">
      <div className="flex items-start gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted w-12 shrink-0">From</span>
        <EndpointBody entity={from} />
      </div>
      <div className="flex items-center gap-2 pl-12 text-text-muted">
        <ArrowDown className="size-3.5" aria-hidden />
      </div>
      <div className="flex items-start gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted w-12 shrink-0">To</span>
        <EndpointBody entity={to} />
      </div>
    </div>
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
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {ENTITY_KIND_LABEL[entity.kind]}
      </span>
      <span className="text-[12px] font-medium text-text">{entity.title}</span>
      <span className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-text-muted">
        <span>{entity.id}</span>
        {entity.status && <span>· {entity.status}</span>}
      </span>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className={cn('mt-0.5 break-words text-[12px] text-text', mono && 'font-mono')}>{value}</div>
    </div>
  );
}

function DetailActions({
  primary,
  askAgent,
  navigate,
}: {
  primary: { label: string; href: string } | null;
  askAgent: string;
  navigate: (to: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {primary && (
        <NavActionButton onClick={() => navigate(primary.href)}>
          <ExternalLink className="size-3.5" /> {primary.label}
        </NavActionButton>
      )}
      <AskClaudeButton onClick={() => navigate(askAgent)}>
        Ask the agent about this
      </AskClaudeButton>
    </div>
  );
}

// ── Mobile flow ─────────────────────────────────────────────────────────

function InOutMobileFlow({
  viewModel,
  selectedInputId,
  selectedOutputId,
  onSelectInput,
  onSelectOutput,
}: {
  viewModel: InOutViewModel;
  selectedInputId: string | null;
  selectedOutputId: string | null;
  onSelectInput: (i: InOutInput) => void;
  onSelectOutput: (o: InOutOutput) => void;
  onOpenExperimentDetail: () => void;
}) {
  const exp = viewModel.experiment;
  if (!exp) return null;
  const inputGroups = groupInputs(viewModel.inputs);
  const outputGroups = groupOutputs(viewModel.outputs);
  return (
    <ol className="flex w-full flex-col gap-6 px-4 py-5" aria-label="Experiment flow">
      <Step index={1} label="Inputs" count={viewModel.inputs.length}>
        <div className="flex flex-col gap-4">
          {inputGroups.length === 0 ? (
            <GroupEmptyState message="No inputs are recorded for this experiment." />
          ) : (
            inputGroups.map((g) => (
              <InputGroup
                key={`m-i-${g.key}`}
                groupKey={g.key}
                title={GROUP_TITLE[g.key]}
                items={g.items}
                selectedId={selectedInputId}
                highlightedIds={new Set()}
                dimUnrelated={false}
                onSelect={onSelectInput}
              />
            ))
          )}
        </div>
      </Step>
      <Connector />
      <Step index={2} label="Experiment">
        <article
          aria-label="Experiment"
          className="flex flex-col gap-3 rounded-sm border-2 border-brand-border bg-elevated px-4 py-4 shadow-[inset_0_0_0_1px_rgba(255,62,1,0.04)]"
        >
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 shrink-0 text-brand" strokeWidth={1.75} aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Experiment</span>
            <StatusBadge
              value={EXPERIMENT_STATUS_LABEL[exp.status]}
              tone={EXPERIMENT_STATUS_TONE[exp.status]}
            />
          </div>
          <h2 className="text-[16px] font-semibold leading-snug text-text">{exp.title}</h2>
          <MonoId muted className="block break-all text-[10px]">{exp.slug}</MonoId>
          {exp.description && (
            <p className="text-[13px] leading-relaxed text-text-secondary">{exp.description}</p>
          )}
          <dl className="grid grid-cols-2 gap-3 border-t border-border-subtle pt-3">
            <ExperimentMeta label="Date" value={exp.date} />
            <ExperimentMeta label="Stage" value={exp.stage} />
            <ExperimentMeta label="Findings" value={pluralizeExp(exp.meta.findingsCount, 'finding', 'findings')} />
            <ExperimentMeta label="Open Qs" value={pluralizeExp(exp.meta.questionsCount, 'open question', 'open questions')} />
          </dl>
        </article>
      </Step>
      <Connector />
      <Step index={3} label="Outputs" count={viewModel.outputs.length}>
        <div className="flex flex-col gap-4">
          {outputGroups.length === 0 ? (
            <GroupEmptyState message="No outputs have been registered for this experiment yet." />
          ) : (
            outputGroups.map((g) => (
              <OutputGroup
                key={`m-o-${g.key}`}
                groupKey={g.key}
                title={OUTPUT_GROUP_TITLE[g.key]}
                items={g.items}
                selectedId={selectedOutputId}
                highlightedIds={new Set()}
                dimUnrelated={false}
                onSelect={onSelectOutput}
              />
            ))
          )}
        </div>
      </Step>
    </ol>
  );
}

function Step({
  index,
  label,
  count,
  children,
}: {
  index: number;
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-sm border border-border-strong bg-surface-2 font-mono text-[12px] text-text">
          {index}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
        {count != null && (
          <span className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-muted tabular-nums">
            {count}
          </span>
        )}
      </div>
      {children}
    </li>
  );
}

function Connector() {
  return (
    <li aria-hidden className="flex justify-center text-text-muted">
      <ArrowDown className="size-4" />
    </li>
  );
}

function GroupEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-sm border border-dashed border-border-subtle bg-surface-2/40 px-3 py-3 text-[12px] text-text-muted">
      {message}
    </div>
  );
}

function UnavailableState() {
  return (
    <div className="flex items-start gap-2 rounded-sm border border-amber/30 bg-amber/10 px-3 py-2">
      <Unlink className="mt-0.5 size-3.5 shrink-0 text-amber" />
      <p className="text-[12px] text-amber">
        Referenced entity unavailable. The data backing this entry could not be resolved.
      </p>
    </div>
  );
}

// ── Mobile detail sheet ─────────────────────────────────────────────────

function InOutDetailSheet({
  viewModel,
  selectedInput,
  selectedOutput,
  selectedRelationship,
  onClose,
  navigate,
}: {
  viewModel: InOutViewModel;
  selectedInput: InOutInput | null;
  selectedOutput: InOutOutput | null;
  selectedRelationship: InOutRelationship | null;
  onClose: () => void;
  navigate: (to: string) => void;
}) {
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement;
    const t = window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      window.clearTimeout(t);
      previouslyFocused.current?.focus();
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Entity detail" className="fixed inset-0 z-50 flex flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Detail</span>
        <IconButton icon={X} label="Close detail" onClick={onClose} />
      </header>
      <div ref={panelRef} tabIndex={-1} className="min-h-0 flex-1 overflow-auto px-4 py-4 outline-none">
        {selectedInput && (
          <InputDetail
            input={selectedInput}
            experiment={viewModel.experiment}
            onSelectRelationship={() => {}}
            onClose={onClose}
            navigate={navigate}
          />
        )}
        {selectedOutput && (
          <OutputDetail
            output={selectedOutput}
            experiment={viewModel.experiment}
            onSelectRelationship={() => {}}
            onClose={onClose}
            navigate={navigate}
          />
        )}
        {selectedRelationship && (
          <RelationshipDetail
            relationship={selectedRelationship}
            experiment={viewModel.experiment}
            onSelectRelationship={() => {}}
            onClose={onClose}
            navigate={navigate}
          />
        )}
      </div>
    </div>
  );
}

// ── Additional relationships panel ──────────────────────────────────────

function AdditionalRelationshipsPanel({
  viewModel,
  selectedRelationshipId,
  onSelectRelationship,
}: {
  viewModel: InOutViewModel;
  selectedRelationshipId: string | null;
  onSelectRelationship: (r: InOutRelationship) => void;
}) {
  const [open, setOpen] = useState(false);
  const list = viewModel.additionalRelationships;
  if (list.length === 0) {
    return (
      <section
        aria-label="Additional relationships"
        className="rounded-sm border border-dashed border-border-subtle bg-surface-2/40 px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <GitBranch className="size-3.5 text-text-muted" aria-hidden />
          <h2 className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Additional relationships</h2>
        </div>
        <p className="mt-1 text-[12px] text-text-muted">
          No external or unresolved relationships found for this experiment.
        </p>
      </section>
    );
  }
  const externalCount = list.filter((r) => r.scope === 'external').length;
  const unresolvedCount = list.filter((r) => r.scope === 'unresolved').length;
  const crossCount = list.filter((r) => r.scope === 'visible').length;
  return (
    <section
      aria-label="Additional relationships"
      className="rounded-sm border border-border-subtle bg-surface"
    >
      <header className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <div className="flex items-center gap-2">
          <GitBranch className="size-3.5 text-text-muted" aria-hidden />
          <h2 className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Additional relationships</h2>
          <span className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-muted tabular-nums">
            {list.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="inout-additional-rels"
          className="flex min-h-9 items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2.5 font-mono text-[11px] text-text-secondary hover:border-border-strong hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
        >
          {open ? 'Hide' : 'Show'}
          <ArrowDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
        </button>
      </header>
      {open && (
        <div id="inout-additional-rels" className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            <span>{crossCount} visible</span>
            <span aria-hidden>·</span>
            <span>{externalCount} external</span>
            <span aria-hidden>·</span>
            <span>{unresolvedCount} unresolved</span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {list.map((r) => (
              <RelationshipRow
                key={r.id}
                relationship={r}
                selected={r.id === selectedRelationshipId}
                onSelect={onSelectRelationship}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function RelationshipRow({
  relationship,
  selected,
  onSelect,
}: {
  relationship: InOutRelationship;
  selected: boolean;
  onSelect: (r: InOutRelationship) => void;
}) {
  const fromText = relationship.from.unresolved
    ? relationship.from.id
    : relationship.from.title;
  const toText = relationship.to.unresolved ? relationship.to.id : relationship.to.title;
  const sentence = describeRelationshipSentence(relationship.from, relationship.to, relationship.edgeType);
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(relationship)}
        aria-pressed={selected}
        className={cn(
          'flex w-full flex-col gap-1 rounded-sm border px-3 py-2 text-left transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring',
          selected
            ? 'border-brand-border bg-brand-muted'
            : 'border-border-subtle bg-surface-2 hover:border-border-strong hover:bg-surface',
        )}
      >
        <span className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-[12px] font-medium text-text">{fromText}</span>
          <ArrowRight className="size-3 text-text-muted" aria-hidden />
          <span className="text-[12px] font-medium text-text">{toText}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">· {relationship.label}</span>
        </span>
        {sentence && sentence !== `${fromText} ${relationship.label} ${toText}` && (
          <span className="text-[12px] text-text-secondary">{sentence}</span>
        )}
        <span className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-text-muted">
          <span>{relationship.from.id}</span>
          <ArrowRight className="size-2.5" aria-hidden />
          <span>{relationship.to.id}</span>
          {relationship.basis && <span>· {relationship.basis}</span>}
        </span>
        {relationship.scope === 'external' && <StatusBadge value="External" tone="neutral" showDot={false} />}
        {relationship.scope === 'unresolved' && <StatusBadge value="Unresolved" tone="warning" showDot={false} />}
      </button>
    </li>
  );
}

// ── Sentence helpers ────────────────────────────────────────────────────

function sentenceFor(
  entity: InOutEntity,
  experiment: InOutExperiment | null,
  side: 'input' | 'output',
): string {
  if (entity.unresolved) return 'Referenced entity unavailable.';
  if (!experiment) return '';
  if (side === 'input') {
    return `This ${ENTITY_KIND_LABEL[entity.kind].toLowerCase()} predates ${experiment.title} and contributed to the experiment.`;
  }
  return `${experiment.title} registered or updated this ${ENTITY_KIND_LABEL[entity.kind].toLowerCase()}.`;
}

// ── Grouping helpers ────────────────────────────────────────────────────

function groupInputs(inputs: InOutInput[]): { key: InOutInput['group']; items: InOutInput[] }[] {
  const order: InOutInput['group'][] = ['previous-findings', 'previous-questions', 'data', 'documents'];
  const groups: Record<InOutInput['group'], InOutInput[]> = {
    'previous-findings': [],
    'previous-questions': [],
    data: [],
    documents: [],
  };
  for (const i of inputs) groups[i.group].push(i);
  return order
    .filter((key) => groups[key].length > 0)
    .map((key) => ({ key, items: groups[key] }));
}

function groupOutputs(outputs: InOutOutput[]): { key: InOutOutput['group']; items: InOutOutput[] }[] {
  const order: InOutOutput['group'][] = ['findings', 'open-questions', 'artifacts'];
  const groups: Record<InOutOutput['group'], InOutOutput[]> = {
    findings: [],
    'open-questions': [],
    artifacts: [],
  };
  for (const o of outputs) groups[o.group].push(o);
  return order
    .filter((key) => groups[key].length > 0)
    .map((key) => ({ key, items: groups[key] }));
}

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  ArrowRight,
  ArrowDown,
  AlertTriangle,
  GitBranch,
  FileText,
  FlaskConical,
  Database,
  BookMarked,
  CircleHelp,
  PanelRightOpen,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  buildInOutViewModel,
  experiments,
  findings,
  openQuestions,
  edges,
  getExperimentBySlug,
} from '../../data';
import type { InOutInput, InOutOutput, InOutRelationship, InOutViewModel } from '../../data';
import { ScreenHeader, MonoId } from '../common/primitives';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { NavActionButton, AskClaudeButton } from '../common/AskClaudeActions';
import { IconButton } from '../common/IconButton';
import { ResponsiveInspectorOverlay } from '../responsive/ResponsiveInspectorOverlay';
import { useBreakpoint } from '../responsive/useBreakpoint';
import { cn } from '../ui/utils';

const TONE_TO_BADGE: Record<NonNullable<InOutInput['meta']>['tone'] & string, Parameters<typeof StatusBadge>[0]['tone']> = {
  green: 'green',
  teal: 'teal',
  amber: 'amber',
  blue: 'blue',
  purple: 'purple',
  muted: 'neutral',
};

const INPUT_ICON: Record<InOutInput['kind'], LucideIcon> = {
  dataset: Database,
  document: FileText,
  'search-condition': GitBranch,
  instruction: BookMarked,
  'previous-finding': FlaskConical,
  'previous-question': CircleHelp,
  other: FileText,
};

const OUTPUT_ICON: Record<InOutOutput['kind'], LucideIcon> = {
  finding: FlaskConical,
  'open-question': CircleHelp,
  artifact: FileText,
  'result-data': Database,
  other: FileText,
};

const EXPERIMENT_STATUS_LABEL: Record<string, string> = {
  completed: 'Completed',
  running: 'Running',
  planned: 'Planned',
  exploration: 'Exploration',
  blocked: 'Superseded data',
};

const EXPERIMENT_STATUS_TONE: Record<string, Parameters<typeof StatusBadge>[0]['tone']> = {
  completed: 'success',
  running: 'info',
  planned: 'neutral',
  exploration: 'warning',
  blocked: 'error',
};

export function InOutScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const focusParam = params.get('focus');
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const isTablet = bp === 'tablet';

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

  const [selectedInput, setSelectedInput] = useState<InOutInput | null>(null);
  const [selectedOutput, setSelectedOutput] = useState<InOutOutput | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<InOutRelationship | null>(null);

  const closeDetail = useCallback(() => {
    setSelectedInput(null);
    setSelectedOutput(null);
    setSelectedRelationship(null);
  }, []);

  const handleSelect = useCallback(
    (kind: 'input' | 'output', item: InOutInput | InOutOutput) => {
      setSelectedRelationship(null);
      if (kind === 'input') {
        setSelectedInput(item as InOutInput);
        setSelectedOutput(null);
      } else {
        setSelectedOutput(item as InOutOutput);
        setSelectedInput(null);
      }
    },
    [],
  );

  const detailOpen = selectedInput || selectedOutput || selectedRelationship;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScreenHeader
        title="In/Out"
        subtitle="What went into the experiment, what happened, and what came out."
        right={<InOutToolbar viewModel={viewModel} onSelectExperiment={setSelectedSlug} selectedSlug={selectedSlug} />}
      />

      <div className="min-h-0 flex-1 overflow-auto bg-background">
        {!viewModel.experiment ? (
          <EmptyState
            icon={GitBranch}
            title="No experiment selected"
            hint="Select an experiment from the toolbar to view its inputs, processing context, and outputs."
          />
        ) : (
          <InOutDiagram
            viewModel={viewModel}
            isMobile={isMobile}
            isTablet={isTablet}
            onSelectInput={(i) => handleSelect('input', i)}
            onSelectOutput={(o) => handleSelect('output', o)}
            onSelectRelationship={setSelectedRelationship}
            selectedInputId={selectedInput?.id ?? null}
            selectedOutputId={selectedOutput?.id ?? null}
            selectedRelationshipId={selectedRelationship?.id ?? null}
            onOpenDetail={() => {
              if (!detailOpen) {
                const first = viewModel.inputs[0] ?? viewModel.outputs[0];
                if (first) {
                  if (viewModel.inputs.includes(first as InOutInput)) {
                    setSelectedInput(first as InOutInput);
                  } else {
                    setSelectedOutput(first as InOutOutput);
                  }
                }
              }
            }}
          />
        )}
      </div>

      {detailOpen && (
        <ResponsiveInspectorOverlay isOpen onDismiss={closeDetail}>
          {selectedInput && (
            <InputInspector
              input={selectedInput}
              experimentTitle={viewModel.experiment?.title ?? ''}
              onClose={closeDetail}
              navigate={navigate}
            />
          )}
          {selectedOutput && (
            <OutputInspector
              output={selectedOutput}
              experimentTitle={viewModel.experiment?.title ?? ''}
              onClose={closeDetail}
              navigate={navigate}
            />
          )}
          {selectedRelationship && (
            <RelationshipInspector
              relationship={selectedRelationship}
              viewModel={viewModel}
              onClose={closeDetail}
              navigate={navigate}
            />
          )}
        </ResponsiveInspectorOverlay>
      )}
    </div>
  );
}

// ── Toolbar ─────────────────────────────────────────────────────────────

function InOutToolbar({
  viewModel,
  selectedSlug,
  onSelectExperiment,
}: {
  viewModel: InOutViewModel;
  selectedSlug: string | null;
  onSelectExperiment: (slug: string) => void;
}) {
  const sortedExperiments = useMemo(
    () => [...experiments].sort((a, b) => b.date.localeCompare(a.date)),
    [],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="font-mono text-[10px] uppercase tracking-wider text-text-muted" htmlFor="inout-experiment">
        Experiment
      </label>
      <select
        id="inout-experiment"
        value={selectedSlug ?? ''}
        onChange={(e) => onSelectExperiment(e.target.value)}
        className="h-9 min-w-[200px] max-w-[360px] rounded-sm border border-border-subtle bg-surface-2 px-2 font-mono text-[12px] text-text outline-none focus-visible:border-brand-border"
        aria-label="Select an experiment"
      >
        {sortedExperiments.map((e) => (
          <option key={e.slug} value={e.slug}>
            {e.slug.replace('experiments/', '')} · {e.title.slice(0, 60)}
          </option>
        ))}
      </select>
      <div className="ml-2 hidden items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-text-muted md:flex">
        <span>{viewModel.inputs.length} inputs</span>
        <span aria-hidden>·</span>
        <span>{viewModel.outputs.length} outputs</span>
        <span aria-hidden>·</span>
        <span>{viewModel.relationships.length} relationships</span>
      </div>
    </div>
  );
}

// ── Diagram ─────────────────────────────────────────────────────────────

function InOutDiagram({
  viewModel,
  isMobile,
  isTablet,
  onSelectInput,
  onSelectOutput,
  onSelectRelationship,
  selectedInputId,
  selectedOutputId,
  selectedRelationshipId,
  onOpenDetail,
}: {
  viewModel: InOutViewModel;
  isMobile: boolean;
  isTablet: boolean;
  onSelectInput: (i: InOutInput) => void;
  onSelectOutput: (o: InOutOutput) => void;
  onSelectRelationship: (r: InOutRelationship) => void;
  selectedInputId: string | null;
  selectedOutputId: string | null;
  selectedRelationshipId: string | null;
  onOpenDetail: () => void;
}) {
  const experiment = viewModel.experiment!;

  if (isMobile) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5">
        <InputsColumn
          title="Inputs"
          subtitle="What went into this experiment"
          inputs={viewModel.inputs}
          selectedId={selectedInputId}
          onSelect={onSelectInput}
        />
        <DirectionalDivider direction="down" label="Into experiment" />
        <ExperimentCard experiment={experiment} compact />
        <DirectionalDivider direction="down" label="Out of experiment" />
        <OutputsColumn
          title="Outputs"
          subtitle="What came out of this experiment"
          outputs={viewModel.outputs}
          selectedId={selectedOutputId}
          onSelect={onSelectOutput}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <div
        className={cn(
          'grid gap-4',
          isTablet ? 'grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)]',
        )}
      >
        <InputsColumn
          title="Inputs"
          subtitle="What went into this experiment"
          inputs={viewModel.inputs}
          selectedId={selectedInputId}
          onSelect={onSelectInput}
        />
        <div className="flex min-w-0 flex-col">
          <ExperimentCard experiment={experiment} onOpenDetail={onOpenDetail} />
        </div>
        <OutputsColumn
          title="Outputs"
          subtitle="What came out of this experiment"
          outputs={viewModel.outputs}
          selectedId={selectedOutputId}
          onSelect={onSelectOutput}
        />
      </div>

      <RelationshipsBar
        relationships={viewModel.relationships}
        selectedId={selectedRelationshipId}
        onSelect={onSelectRelationship}
      />
    </div>
  );
}

function DirectionalDivider({ direction, label }: { direction: 'down' | 'right'; label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1 text-text-muted" aria-hidden>
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
      {direction === 'down' ? <ArrowDown className="size-3.5" /> : <ArrowRight className="size-3.5" />}
    </div>
  );
}

function InputsColumn({
  title,
  subtitle,
  inputs,
  selectedId,
  onSelect,
}: {
  title: string;
  subtitle: string;
  inputs: InOutInput[];
  selectedId: string | null;
  onSelect: (i: InOutInput) => void;
}) {
  return (
    <section
      aria-label={title}
      className="flex min-w-0 flex-col rounded-sm border border-border-subtle bg-surface"
    >
      <header className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{title}</h2>
          <p className="mt-0.5 text-[12px] text-text-secondary">{subtitle}</p>
        </div>
        <span className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-muted tabular-nums">
          {inputs.length}
        </span>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
        {inputs.length === 0 ? (
          <EmptyState title="No inputs available" hint="This experiment has no recorded inputs yet." />
        ) : (
          inputs.map((i) => (
            <InputCard
              key={i.id}
              input={i}
              selected={selectedId === i.id}
              onSelect={() => onSelect(i)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function OutputsColumn({
  title,
  subtitle,
  outputs,
  selectedId,
  onSelect,
}: {
  title: string;
  subtitle: string;
  outputs: InOutOutput[];
  selectedId: string | null;
  onSelect: (o: InOutOutput) => void;
}) {
  return (
    <section
      aria-label={title}
      className="flex min-w-0 flex-col rounded-sm border border-border-subtle bg-surface"
    >
      <header className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{title}</h2>
          <p className="mt-0.5 text-[12px] text-text-secondary">{subtitle}</p>
        </div>
        <span className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-muted tabular-nums">
          {outputs.length}
        </span>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
        {outputs.length === 0 ? (
          <EmptyState title="No outputs generated yet" hint="Outputs will appear here as the experiment produces findings, questions, or artifacts." />
        ) : (
          outputs.map((o) => (
            <OutputCard
              key={o.id}
              output={o}
              selected={selectedId === o.id}
              onSelect={() => onSelect(o)}
            />
          ))
        )}
      </div>
    </section>
  );
}

// ── Cards ───────────────────────────────────────────────────────────────

function InputCard({
  input,
  selected,
  onSelect,
}: {
  input: InOutInput;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = INPUT_ICON[input.kind];
  const tone = input.meta?.tone ?? 'muted';
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex w-full min-h-11 items-start gap-2 rounded-sm border px-2.5 py-2 text-left transition-colors',
        selected
          ? 'border-brand-border bg-brand-muted shadow-[inset_0_0_0_1px_rgba(255,62,1,0.04)]'
          : 'border-border-subtle bg-surface-2 hover:border-border-strong hover:bg-surface',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring',
      )}
    >
      <span className="mt-0.5 size-6 shrink-0 rounded-sm border border-border-strong bg-surface flex items-center justify-center">
        <Icon className={cn('size-3.5', tone === 'muted' ? 'text-text-muted' : `text-${tone}`)} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-medium text-text">{input.label}</span>
        {input.detail && (
          <span className="mt-0.5 block truncate font-mono text-[10px] text-text-muted">
            {input.detail}
          </span>
        )}
        {input.kind !== 'other' && (
          <span className="mt-1 inline-block">
            <StatusBadge value={input.kind.replace(/-/g, ' ')} tone={TONE_TO_BADGE[tone]} showDot={false} className="text-[9px]" />
          </span>
        )}
      </span>
    </button>
  );
}

function OutputCard({
  output,
  selected,
  onSelect,
}: {
  output: InOutOutput;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = OUTPUT_ICON[output.kind];
  const tone = output.meta?.tone ?? 'muted';
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex w-full min-h-11 items-start gap-2 rounded-sm border px-2.5 py-2 text-left transition-colors',
        selected
          ? 'border-brand-border bg-brand-muted shadow-[inset_0_0_0_1px_rgba(255,62,1,0.04)]'
          : 'border-border-subtle bg-surface-2 hover:border-border-strong hover:bg-surface',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring',
      )}
    >
      <span className="mt-0.5 size-6 shrink-0 rounded-sm border border-border-strong bg-surface flex items-center justify-center">
        <Icon className={cn('size-3.5', tone === 'muted' ? 'text-text-muted' : `text-${tone}`)} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-medium text-text">{output.label}</span>
        {output.detail && (
          <span className="mt-0.5 block truncate font-mono text-[10px] text-text-muted">
            {output.detail}
          </span>
        )}
        <span className="mt-1 inline-block">
          <StatusBadge value={output.kind.replace(/-/g, ' ')} tone={TONE_TO_BADGE[tone]} showDot={false} className="text-[9px]" />
        </span>
      </span>
    </button>
  );
}

function ExperimentCard({
  experiment,
  compact,
  onOpenDetail,
}: {
  experiment: ReturnType<typeof buildInOutViewModel>['experiment'];
  compact?: boolean;
  onOpenDetail?: () => void;
}) {
  if (!experiment) return null;
  return (
    <section
      aria-label="Experiment"
      className={cn(
        'flex min-w-0 flex-col rounded-sm border-2 border-brand-border bg-elevated shadow-[0_0_0_1px_rgba(255,62,1,0.04)]',
        compact ? 'gap-2 px-4 py-3' : 'gap-3 px-5 py-4',
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 shrink-0 text-brand" strokeWidth={1.75} />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Experiment</span>
            <StatusBadge
              value={EXPERIMENT_STATUS_LABEL[experiment.status] ?? experiment.status}
              tone={EXPERIMENT_STATUS_TONE[experiment.status] ?? 'muted'}
            />
          </div>
          <h3 className="mt-1.5 text-[16px] font-semibold leading-tight text-text">{experiment.title}</h3>
          <MonoId muted className="mt-1 block break-all text-[10px] sm:text-[11px]">
            {experiment.slug}
          </MonoId>
        </div>
        {onOpenDetail && (
          <button
            type="button"
            onClick={onOpenDetail}
            aria-label="Open experiment detail"
            className="flex min-h-10 shrink-0 items-center gap-2 rounded-sm border border-border-strong bg-surface-2 px-3 text-[12px] text-text-secondary outline-none transition-colors hover:border-brand-border hover:text-text focus-visible:ring-2 focus-visible:ring-brand-ring"
          >
            <PanelRightOpen className="size-4" />
            <span className="hidden sm:inline">Details</span>
          </button>
        )}
      </header>

      {!compact && experiment.description && (
        <p className="text-[13px] leading-relaxed text-text-secondary">{experiment.description}</p>
      )}

      <div className="grid grid-cols-2 gap-2 border-t border-border-subtle pt-3 sm:grid-cols-4">
        <MetaCell label="Date" value={experiment.date} />
        <MetaCell label="Status" value={EXPERIMENT_STATUS_LABEL[experiment.status] ?? experiment.status} />
        <MetaCell label="Stage" value={experiment.stage ?? '—'} />
        <MetaCell label="Findings" value={String(experiment.meta.findingsCount)} />
      </div>
    </section>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[9px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-0.5 truncate text-[12px] text-text">{value}</div>
    </div>
  );
}

// ── Relationships bar ───────────────────────────────────────────────────

function RelationshipsBar({
  relationships,
  selectedId,
  onSelect,
}: {
  relationships: InOutRelationship[];
  selectedId: string | null;
  onSelect: (r: InOutRelationship) => void;
}) {
  if (relationships.length === 0) {
    return (
      <section
        aria-label="Relationships"
        className="rounded-sm border border-dashed border-border-subtle bg-surface px-4 py-3"
      >
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">
          <GitBranch className="size-3.5" /> Relationship data is unavailable
        </div>
        <p className="mt-1 text-[12px] text-text-muted">
          The current data does not contain explicit input/output relationships for this experiment.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Relationships"
      className="rounded-sm border border-border-subtle bg-surface"
    >
      <header className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <div className="flex items-center gap-2">
          <GitBranch className="size-3.5 text-text-muted" />
          <h2 className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Relationships</h2>
        </div>
        <span className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-muted tabular-nums">
          {relationships.length}
        </span>
      </header>
      <div className="flex flex-wrap gap-2 p-3">
        {relationships.map((r) => {
          const selected = r.id === selectedId;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r)}
              aria-pressed={selected}
              className={cn(
                'flex min-h-8 items-center gap-1.5 rounded-sm border px-2 py-1 font-mono text-[11px] transition-colors',
                selected
                  ? 'border-brand-border bg-brand-muted text-brand'
                  : 'border-border-subtle bg-surface-2 text-text-secondary hover:border-border-strong hover:text-text',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring',
              )}
            >
              <span className="truncate text-text-secondary">{r.from.replace('experiments/', '').replace('input:finding:', '').replace('input:question:', '').replace('output:finding:', '').replace('output:question:', '')}</span>
              <ArrowRight className="size-3 text-text-muted" />
              <span className="truncate text-text">{r.to.replace('experiments/', '').replace('input:finding:', '').replace('input:question:', '').replace('output:finding:', '').replace('output:question:', '')}</span>
              {r.label && <span className="ml-1 text-text-muted">· {r.label}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── Inspectors ──────────────────────────────────────────────────────────

function InputInspector({
  input,
  experimentTitle,
  onClose,
  navigate,
}: {
  input: InOutInput;
  experimentTitle: string;
  onClose: () => void;
  navigate: (to: string) => void;
}) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Input</span>
          <StatusBadge value={input.kind.replace(/-/g, ' ')} tone={TONE_TO_BADGE[input.meta?.tone ?? 'muted']} showDot />
        </div>
        <IconButton icon={X} label="Close" onClick={onClose} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        <h3 className="text-[15px] leading-snug text-text">{input.label}</h3>
        {input.detail && <p className="mt-1 font-mono text-[12px] text-text-secondary">{input.detail}</p>}

        <SectionLabel>Connected to</SectionLabel>
        <p className="text-[12px] text-text-secondary">
          This input is part of <span className="font-medium text-text">{experimentTitle}</span>.
        </p>

        {input.source && (
          <>
            <SectionLabel>Source</SectionLabel>
            <MonoId className="text-info">{input.source}</MonoId>
          </>
        )}

        <SectionLabel>Actions</SectionLabel>
        <div className="flex flex-col gap-2">
          {input.href && (
            <NavActionButton onClick={() => navigate(input.href!)}>
              <FileText className="size-3.5" /> Open referenced item
            </NavActionButton>
          )}
          <AskClaudeButton onClick={() => navigate(`/chat?ctx=${encodeURIComponent(experimentTitle)}`)}>
            Ask Claude about this input
          </AskClaudeButton>
        </div>
      </div>
    </aside>
  );
}

function OutputInspector({
  output,
  experimentTitle,
  onClose,
  navigate,
}: {
  output: InOutOutput;
  experimentTitle: string;
  onClose: () => void;
  navigate: (to: string) => void;
}) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Output</span>
          <StatusBadge value={output.kind.replace(/-/g, ' ')} tone={TONE_TO_BADGE[output.meta?.tone ?? 'muted']} showDot />
        </div>
        <IconButton icon={X} label="Close" onClick={onClose} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        <h3 className="text-[15px] leading-snug text-text">{output.label}</h3>
        {output.detail && <p className="mt-1 font-mono text-[12px] text-text-secondary">{output.detail}</p>}

        <SectionLabel>Produced by</SectionLabel>
        <p className="text-[12px] text-text-secondary">
          Produced by <span className="font-medium text-text">{experimentTitle}</span>.
        </p>

        {output.source && (
          <>
            <SectionLabel>Source</SectionLabel>
            <MonoId className="text-info">{output.source}</MonoId>
          </>
        )}

        <SectionLabel>Actions</SectionLabel>
        <div className="flex flex-col gap-2">
          {output.href && (
            <NavActionButton onClick={() => navigate(output.href!)}>
              <FileText className="size-3.5" /> Open output
            </NavActionButton>
          )}
          <AskClaudeButton onClick={() => navigate(`/chat?ctx=${encodeURIComponent(experimentTitle)}`)}>
            Ask Claude about this output
          </AskClaudeButton>
        </div>
      </div>
    </aside>
  );
}

function RelationshipInspector({
  relationship,
  viewModel,
  onClose,
  navigate,
}: {
  relationship: InOutRelationship;
  viewModel: InOutViewModel;
  onClose: () => void;
  navigate: (to: string) => void;
}) {
  const inputById = new Map(viewModel.inputs.map((i) => [i.id, i]));
  const outputById = new Map(viewModel.outputs.map((o) => [o.id, o]));

  const fromInput = inputById.get(relationship.from);
  const fromOutput = outputById.get(relationship.from);
  const toInput = inputById.get(relationship.to);
  const toOutput = outputById.get(relationship.to);

  const experiment = viewModel.experiment;

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Relationship</span>
          {relationship.label && <StatusBadge value={relationship.label} tone="muted" showDot />}
        </div>
        <IconButton icon={X} label="Close" onClick={onClose} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        <h3 className="text-[15px] leading-snug text-text">
          {relationship.from.replace('experiments/', '')} <ArrowRight className="inline size-3.5 text-text-muted" /> {relationship.to.replace('experiments/', '')}
        </h3>
        {relationship.detail && (
          <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">{relationship.detail}</p>
        )}

        <SectionLabel>From</SectionLabel>
        <p className="text-[12px] text-text">
          {fromInput?.label ?? fromOutput?.label ?? experiment?.title ?? relationship.from}
        </p>

        <SectionLabel>To</SectionLabel>
        <p className="text-[12px] text-text">
          {toInput?.label ?? toOutput?.label ?? experiment?.title ?? relationship.to}
        </p>

        {relationship.basis && (
          <>
            <SectionLabel>Basis</SectionLabel>
            <MonoId>{relationship.basis}</MonoId>
          </>
        )}

        {!fromInput && !fromOutput && !toInput && !toOutput && (
          <div className="mt-3 flex items-start gap-2 rounded-sm border border-amber/30 bg-amber/10 px-3 py-2">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber" />
            <p className="text-[12px] text-amber">
              This relationship connects a node that is not currently part of the visible In/Out map.
            </p>
          </div>
        )}

        <SectionLabel>Actions</SectionLabel>
        <div className="flex flex-col gap-2">
          {experiment && (
            <NavActionButton onClick={() => navigate(`/experiments/${experiment.slug}`)}>
              <FlaskConical className="size-3.5" /> Open experiment report
            </NavActionButton>
          )}
          <AskClaudeButton onClick={() => navigate(`/chat?ctx=${encodeURIComponent(experiment?.title ?? '')}`)}>
            Ask Claude about this relationship
          </AskClaudeButton>
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mt-5 mb-2 font-mono text-[11px] uppercase tracking-wider text-text-muted first:mt-0">
      {children}
    </h4>
  );
}

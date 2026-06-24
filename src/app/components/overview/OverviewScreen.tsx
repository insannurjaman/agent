import { useNavigate } from 'react-router';
import {
  HelpCircle,
  Search,
  FolderPlus,
  Play,
  CheckCheck,
  BookMarked,
  CircleHelp,
  FileText,
  BadgeCheck,
  ChevronRight,
  Table2,
  FlaskConical,
  SlidersHorizontal,
  Share2,
  Terminal,
  type LucideIcon,
} from 'lucide-react';
import { ScreenHeader, MonoId } from '../common/primitives';
import { StatusBadge } from '../common/StatusBadge';
import { cn } from '../ui/utils';

interface LoopNode {
  step: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  tone: 'green' | 'teal' | 'amber' | 'blue' | 'purple';
  emphasis?: boolean;
}

interface LoopPhase {
  id: string;
  label: string;
  nodes: LoopNode[];
}

const LOOP_PHASES: LoopPhase[] = [
  {
    id: 'P1',
    label: 'Phase 1 · Input',
    nodes: [
      { step: '01', label: 'Question', sub: 'Unresolved issue or investigation prompt', icon: HelpCircle, tone: 'amber' },
      { step: '02', label: 'Review Knowledge', sub: 'Search findings, questions, facets, and graph', icon: Search, tone: 'blue', emphasis: true },
    ],
  },
  {
    id: 'P2',
    label: 'Phase 2 · Experiment',
    nodes: [
      { step: '03', label: 'Create Experiment', sub: 'Create experiments/<slug>/ workspace', icon: FolderPlus, tone: 'teal', emphasis: true },
      { step: '04', label: 'Execute', sub: 'Run analysis code and generate artifacts', icon: Play, tone: 'blue' },
      { step: '05', label: 'Validate', sub: 'Check outputs, metrics, and evidence', icon: CheckCheck, tone: 'teal' },
    ],
  },
  {
    id: 'P3',
    label: 'Phase 3 · Knowledge Output',
    nodes: [
      { step: '06', label: 'Knowledge', sub: 'Register findings through Claude-mediated workflow', icon: BookMarked, tone: 'green', emphasis: true },
      { step: '07', label: 'Issues', sub: 'Register open questions through Claude-mediated workflow', icon: CircleHelp, tone: 'amber' },
      { step: '08', label: 'Report', sub: 'Generate README / REPORT.md', icon: FileText, tone: 'teal', emphasis: true },
      { step: '09', label: 'Promotion', sub: 'User confirms promoted knowledge', icon: BadgeCheck, tone: 'purple', emphasis: true },
    ],
  },
];

interface DocLayer {
  id: string;
  path: string;
  purpose: string;
  files: string[];
  status: string;
  tone: 'green' | 'teal' | 'amber' | 'blue' | 'purple' | 'muted';
}

const LAYERS: DocLayer[] = [
  { id: 'L0', path: 'CLAUDE.md', purpose: 'Critical promoted knowledge · manually updated', files: ['CLAUDE.md'], status: 'Curated', tone: 'purple' },
  { id: 'L1', path: 'doc/*.md', purpose: 'Curated workflows, glossary, report style guide, system overview', files: ['glossary.md', 'report_style_guide.md', 'system_overview.html'], status: 'Curated', tone: 'teal' },
  {
    id: 'L2',
    path: 'knowledge/*.csv + recipes/',
    purpose: 'Machine-readable fact database',
    files: ['findings.csv', 'open_questions.csv', 'tag_taxonomy.csv', 'knowledge_graph_edges.csv'],
    status: 'Indexed',
    tone: 'green',
  },
  { id: 'L3', path: 'experiments/<slug>/', purpose: 'Experiment logs, README, REPORT, code, figures, artifacts', files: ['README.md', 'REPORT.md', 'analysis.py', 'outputs/'], status: 'Indexed', tone: 'green' },
];

interface ActivityRow {
  type: string;
  tone: 'green' | 'teal' | 'amber' | 'blue';
  title: string;
  source: string;
  time: string;
  action: string;
  to: string;
}

const ACTIVITY: ActivityRow[] = [
  { type: 'finding', tone: 'green', title: 'F-0050 updated · entry temperature variance', source: 'knowledge/findings.csv', time: '2m ago', action: 'Open', to: '/findings?focus=F-0050' },
  { type: 'link', tone: 'blue', title: 'Q-0014 linked to F-0050', source: 'knowledge_graph_edges.csv', time: '12m ago', action: 'View graph', to: '/graph?focus=Q-0014' },
  { type: 'report', tone: 'teal', title: 'REPORT.md indexed', source: 'experiments/2026-06-17_roll_gap_variance', time: '18m ago', action: 'Open report', to: '/experiments' },
  { type: 'graph', tone: 'teal', title: 'knowledge_graph_edges.csv refreshed · 499 edges', source: 'knowledge/knowledge_graph_edges.csv', time: '22m ago', action: 'View graph', to: '/graph' },
  { type: 'taxonomy', tone: 'amber', title: 'tag_taxonomy.csv loaded · 40 terms', source: 'knowledge/tag_taxonomy.csv', time: '30m ago', action: 'Search facets', to: '/search' },
];

export function OverviewScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Overview / System Map" subtitle="The analytical knowledge loop and documentation layers." />
      <div className="min-h-0 flex-1 overflow-auto p-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
          {/* Main column */}
          <div className="flex flex-col gap-5">
            <KnowledgeLoop />
            <DocumentationLayers />
            <RecentActivity navigate={navigate} />
          </div>

          {/* Right panel — surfaced above the main column on mobile/tablet for guidance */}
          <div className="flex flex-col gap-5 max-lg:order-first">
            <CurrentWork navigate={navigate} />
            <QuickActions navigate={navigate} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  desc,
  children,
  right,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-border-subtle bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <div>
          <h2 className="text-text" style={{ fontSize: '13px' }}>
            {title}
          </h2>
          {desc && <p className="mt-0.5 text-[12px] text-text-secondary">{desc}</p>}
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

const TONE_TEXT: Record<string, string> = {
  green: 'text-green',
  teal: 'text-teal',
  amber: 'text-amber',
  blue: 'text-blue',
  purple: 'text-purple',
  muted: 'text-text-muted',
};
const TONE_DOT: Record<string, string> = {
  green: 'bg-green',
  teal: 'bg-teal',
  amber: 'bg-amber',
  blue: 'bg-blue',
  purple: 'bg-purple',
  muted: 'bg-text-muted',
};

function LoopCard({ n }: { n: LoopNode }) {
  return (
    <div
      className={cn(
        'flex w-full flex-col rounded-sm border px-2.5 py-2 md:w-[150px]',
        n.emphasis ? 'border-border-strong bg-elevated' : 'border-border-subtle bg-surface-2',
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn('font-mono text-[10px]', n.emphasis ? 'text-text-secondary' : 'text-text-muted')}>{n.step}</span>
        <span className={cn('size-1.5 rounded-full', TONE_DOT[n.tone])} />
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        <n.icon className={cn('size-3.5 shrink-0', TONE_TEXT[n.tone])} strokeWidth={1.75} />
        <span className={cn('text-[12px]', n.emphasis ? 'text-text' : 'text-text-secondary')}>{n.label}</span>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-text-muted">{n.sub}</p>
    </div>
  );
}

function KnowledgeLoop() {
  return (
    <Panel title="Knowledge Loop" desc="Agent-driven experiments convert questions into reusable knowledge, reports, and unresolved issues.">
      <div className="flex flex-col flex-wrap items-stretch gap-x-3 gap-y-4 md:flex-row">
        {LOOP_PHASES.map((phase, pi) => (
          <div key={phase.id} className="flex items-stretch gap-3">
            <div className="flex flex-1 flex-col">
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">{phase.label}</div>
              <div className="flex flex-col flex-wrap items-stretch gap-2 md:flex-row">
                {phase.nodes.map((n, i) => (
                  <div key={n.step} className="flex items-stretch gap-2">
                    <LoopCard n={n} />
                    {i < phase.nodes.length - 1 && (
                      <div className="hidden items-center self-center text-text-muted md:flex">
                        <ChevronRight className="size-4" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {pi < LOOP_PHASES.length - 1 && (
              <div className="hidden items-center self-end pb-4 text-border-strong md:flex">
                <ChevronRight className="size-5" aria-hidden="true" />
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DocumentationLayers() {
  return (
    <Panel title="Documentation Layers">
      <div className="flex flex-col gap-2">
        {LAYERS.map((l) => (
          <div key={l.id} className="flex flex-col gap-2 rounded-sm border border-border-subtle bg-surface-2 px-3 py-2.5 sm:flex-row sm:items-center">
            <div className="flex w-16 shrink-0 items-center gap-2">
              <span className={cn('font-mono text-[13px]', TONE_TEXT[l.tone])}>{l.id}</span>
            </div>
            <div className="min-w-0 flex-1">
              <MonoId className="text-info">{l.path}</MonoId>
              <p className="mt-0.5 text-[12px] text-text-secondary">{l.purpose}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {l.files.map((f) => (
                  <span key={f} className="rounded-sm border border-border-subtle bg-surface px-1 py-0.5 font-mono text-[10px] text-text-muted">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <StatusBadge value={l.status} tone={l.tone === 'muted' ? undefined : l.tone} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ActionLink({ children, onClick, claude }: { children: React.ReactNode; onClick: () => void; claude?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-sm border px-1.5 py-0.5 font-mono text-[11px] transition-colors',
        claude
          ? 'border-brand-border bg-brand-muted text-brand hover:bg-brand-surface'
          : 'border-border-strong bg-surface-2 text-text-secondary hover:text-text',
      )}
    >
      {children}
    </button>
  );
}

function CurrentWork({ navigate }: { navigate: (to: string) => void }) {
  return (
    <Panel title="Current Work">
      {/* Recommended next step */}
      <button
        type="button"
        onClick={() => navigate('/chat?ctx=Q-0014,F-0050')}
        className="mb-2.5 flex w-full items-center gap-2 rounded-sm border border-brand-border bg-brand-muted px-3 py-2 text-left transition-colors hover:bg-brand-surface"
      >
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Recommended next step</span>
        <span className="ml-auto font-mono text-[12px] text-brand">Ask Claude to investigate Q-0014 →</span>
      </button>
      <div className="flex flex-col gap-2.5">
        {/* Active Investigation */}
        <div className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Active Investigation</span>
            <span className="ml-auto font-mono text-[10px] text-text-muted">2m ago</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <MonoId className="text-brand">F-0050</MonoId>
            <span className="text-[13px] text-text">Entry temperature variance</span>
          </div>
          <p className="mt-1 text-[12px] leading-snug text-text-secondary">
            Residual thickness variance remains linked to roll-gap and entry temperature interactions.
          </p>
          <div className="mt-1.5 font-mono text-[10px] text-text-muted">
            Related: <span className="text-amber">Q-0014</span> · experiments/2026-06-17_roll_gap_variance
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ActionLink onClick={() => navigate('/findings?focus=F-0050')}>Open Finding</ActionLink>
            <ActionLink claude onClick={() => navigate('/chat?ctx=F-0050,Q-0014')}>Ask Claude</ActionLink>
            <ActionLink onClick={() => navigate('/experiments')}>View Report</ActionLink>
          </div>
        </div>

        {/* Open Question */}
        <div className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Open Question</span>
            <span className="ml-auto"><StatusBadge value="High" tone="red" showDot={false} /></span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <MonoId className="text-amber">Q-0014</MonoId>
            <span className="text-[13px] text-text">Does entry temperature interact with roll-gap setpoint?</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] text-text-muted">
            <StatusBadge value="open" />
            <span>Related finding: <span className="text-brand">F-0050</span></span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ActionLink onClick={() => navigate('/findings?tab=questions&focus=Q-0014')}>Open Question</ActionLink>
            <ActionLink claude onClick={() => navigate('/chat?ctx=Q-0014,F-0050')}>Ask Claude to Investigate</ActionLink>
          </div>
        </div>

        {/* Latest Report */}
        <div className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Latest Report</span>
            <span className="ml-auto font-mono text-[10px] text-text-muted">indexed 18m ago</span>
          </div>
          <div className="mt-1 text-[13px] text-text">REPORT.md indexed</div>
          <MonoId muted className="mt-0.5 block text-[11px]">
            experiments/2026-06-17_roll_gap_variance/REPORT.md
          </MonoId>
          <div className="mt-1.5 font-mono text-[10px] text-text-muted">Figures: 2 · Related findings: 3</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ActionLink onClick={() => navigate('/experiments')}>Open Report</ActionLink>
            <ActionLink onClick={() => navigate('/graph?focus=F-0050')}>View Graph</ActionLink>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function QuickAction({
  icon: Icon,
  label,
  desc,
  onClick,
  claude,
}: {
  icon: LucideIcon;
  label: string;
  desc: string;
  onClick: () => void;
  claude?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full flex-col rounded-sm border px-3 py-2 text-left transition-colors',
        claude
          ? 'border-brand-border bg-brand-muted hover:bg-brand-surface'
          : 'border-border-strong bg-surface-2 hover:border-brand-border',
      )}
    >
      <span className={cn('flex items-center gap-2 text-[13px]', claude ? 'text-brand' : 'text-text')}>
        <Icon className="size-3.5" /> {label}
      </span>
      <span className="mt-0.5 pl-[22px] font-mono text-[10px] text-text-muted">{desc}</span>
    </button>
  );
}

function QuickActions({ navigate }: { navigate: (to: string) => void }) {
  return (
    <Panel title="Quick Actions">
      <div className="flex flex-col gap-2">
        <QuickAction icon={Table2} label="Open Findings" desc="Browse findings and open questions" onClick={() => navigate('/findings')} />
        <QuickAction icon={FlaskConical} label="Open Reports" desc="Review experiment REPORT.md files" onClick={() => navigate('/experiments')} />
        <QuickAction icon={SlidersHorizontal} label="Search by Facets" desc="Use controlled vocabulary search" onClick={() => navigate('/search')} />
        <QuickAction icon={Share2} label="View Knowledge Graph" desc="Trace relationships and lineage" onClick={() => navigate('/graph')} />
        <QuickAction icon={Terminal} label="Start Claude Session" desc="Ask Claude with attached context" onClick={() => navigate('/chat')} claude />
      </div>
    </Panel>
  );
}

function RecentActivity({ navigate }: { navigate: (to: string) => void }) {
  return (
    <Panel title="Recent Knowledge Activity">
      <div className="flex flex-col">
        {ACTIVITY.map((a, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border-subtle py-2 last:border-0">
            <span className={cn('w-20 shrink-0 rounded-sm border px-1.5 py-0.5 text-center font-mono text-[10px] uppercase', TONE_TEXT[a.tone], 'border-border-subtle bg-surface-2')}>
              {a.type}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] text-text">{a.title}</div>
              <MonoId muted className="text-[11px]">
                {a.source}
              </MonoId>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-text-muted">{a.time}</span>
            <button
              type="button"
              onClick={() => navigate(a.to)}
              className="shrink-0 rounded-sm border border-border-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-text-secondary transition-colors hover:text-text"
            >
              {a.action}
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

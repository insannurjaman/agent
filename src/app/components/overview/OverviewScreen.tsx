import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  HelpCircle, Search, FolderPlus, Play, CheckCheck, BookMarked, CircleHelp,
  FileText, BadgeCheck, ChevronRight, ChevronDown, AlertTriangle, Sparkles,
  Table2, FlaskConical, SlidersHorizontal, Share2, GitBranch, type LucideIcon,
} from 'lucide-react';
import { ScreenHeader, MonoId } from '../common/primitives';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { repoStatus } from '../../data';
import { cn } from '../ui/utils';

// ── Data ────────────────────────────────────────────────────────────────

interface LoopNode { step: string; label: string; sub: string; icon: LucideIcon; tone: 'green' | 'teal' | 'amber' | 'blue' | 'purple'; clickable?: boolean; to?: string; }

interface LoopPhase { id: string; label: string; nodes: LoopNode[]; }

const LOOP_PHASES: LoopPhase[] = [
  { id: 'P1', label: 'Phase 1 · Input', nodes: [
    { step: '01', label: 'Question', sub: 'Unresolved issue or investigation prompt', icon: HelpCircle, tone: 'amber', clickable: true, to: '/findings?tab=questions' },
    { step: '02', label: 'Review Knowledge', sub: 'Search findings, questions, facets, and graph', icon: Search, tone: 'blue', clickable: true, to: '/search' },
  ]},
  { id: 'P2', label: 'Phase 2 · Experiment', nodes: [
    { step: '03', label: 'Create Experiment', sub: 'Create experiments/<slug>/ workspace', icon: FolderPlus, tone: 'teal', clickable: true, to: '/experiments' },
    { step: '04', label: 'Execute', sub: 'Run analysis code and generate artifacts', icon: Play, tone: 'blue' },
    { step: '05', label: 'Validate', sub: 'Check outputs, metrics, and evidence', icon: CheckCheck, tone: 'teal' },
  ]},
  { id: 'P3', label: 'Phase 3 · Knowledge Output', nodes: [
    { step: '06', label: 'Knowledge', sub: 'Register findings through Claude-mediated workflow', icon: BookMarked, tone: 'green', clickable: true, to: '/findings' },
    { step: '07', label: 'Issues', sub: 'Register open questions through Claude-mediated workflow', icon: CircleHelp, tone: 'amber', clickable: true, to: '/findings?tab=questions' },
    { step: '08', label: 'Report', sub: 'Generate README / REPORT.md', icon: FileText, tone: 'teal', clickable: true, to: '/experiments' },
    { step: '09', label: 'Promotion', sub: 'User confirms promoted knowledge', icon: BadgeCheck, tone: 'purple' },
  ]},
];

interface DocLayer { id: string; path: string; purpose: string; files: string[]; status: string; tone: 'green' | 'teal' | 'amber' | 'blue' | 'purple' | 'muted'; }

const LAYERS: DocLayer[] = [
  { id: 'L0', path: 'CLAUDE.md', purpose: 'Critical promoted knowledge', files: ['CLAUDE.md'], status: 'Curated', tone: 'purple' },
  { id: 'L1', path: 'doc/*.md', purpose: 'Curated workflows, glossary, style guide', files: ['glossary.md', 'report_style_guide.md', 'system_overview.html'], status: 'Curated', tone: 'teal' },
  { id: 'L2', path: 'knowledge/*.csv + recipes/', purpose: 'Machine-readable fact database', files: ['findings.csv', 'open_questions.csv', 'tag_taxonomy.csv', 'knowledge_graph_edges.csv'], status: 'Indexed', tone: 'green' },
  { id: 'L3', path: 'experiments/<slug>/', purpose: 'Experiment logs, README, REPORT, code, figures', files: ['README.md', 'REPORT.md', 'analysis.py', 'outputs/'], status: 'Indexed', tone: 'green' },
];

interface ActivityRow { type: string; tone: 'green' | 'teal' | 'amber' | 'blue'; title: string; source: string; time: string; to: string; }

const ACTIVITY: ActivityRow[] = [
  { type: 'finding', tone: 'green', title: 'F-0050 updated · entry temperature variance', source: 'knowledge/findings.csv', time: '2m ago', to: '/findings?focus=F-0050' },
  { type: 'link', tone: 'blue', title: 'Q-0014 linked to F-0050', source: 'knowledge_graph_edges.csv', time: '12m ago', to: '/graph?focus=Q-0014' },
  { type: 'report', tone: 'teal', title: 'REPORT.md indexed', source: 'experiments/2026-06-17_roll_gap_variance', time: '18m ago', to: '/experiments' },
  { type: 'graph', tone: 'teal', title: 'knowledge_graph_edges.csv refreshed · 499 edges', source: 'knowledge/knowledge_graph_edges.csv', time: '22m ago', to: '/graph' },
  { type: 'taxonomy', tone: 'amber', title: 'tag_taxonomy.csv loaded · 40 terms', source: 'knowledge/tag_taxonomy.csv', time: '30m ago', to: '/search' },
];

const TONE_TEXT: Record<string, string> = { green: 'text-green', teal: 'text-teal', amber: 'text-amber', blue: 'text-blue', purple: 'text-purple', muted: 'text-text-muted' };

function Sec({ title, desc, children, right }: { title: string; desc?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-border-subtle bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <div>
          <h2 className="text-[13px] font-medium text-text">{title}</h2>
          {desc && <p className="mt-0.5 text-[12px] text-text-secondary">{desc}</p>}
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function OverviewScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Overview" subtitle="System status and current knowledge work." />
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-5">
          {/* System Status Strip */}
          <SystemStatus />

          {/* Current Work */}
          <CurrentWorkSection navigate={navigate} />

          {/* Knowledge Loop */}
          <Sec title="Knowledge Loop" desc="Agent-driven experiments convert questions into reusable knowledge, reports, and unresolved issues.">
            <KnowledgeLoop />
          </Sec>

          {/* Documentation Layers */}
          <Sec title="Documentation Layers">
            <DocLayers />
          </Sec>

          {/* Recent Activity */}
          <Sec title="Recent Knowledge Activity">
            <RecentActivitySection navigate={navigate} />
          </Sec>

          {/* Quick Actions (de-emphasized, compact) */}
          <QuickActionsSection navigate={navigate} />
        </div>
      </div>
    </div>
  );
}

// ── System Status ───────────────────────────────────────────────────────
function SystemStatus() {
  const items = [
    { label: 'Findings', count: repoStatus.findings, to: '/findings' },
    { label: 'Questions', count: repoStatus.openQuestions, to: '/findings?tab=questions' },
    { label: 'Edges', count: repoStatus.edges, to: '/graph' },
    { label: 'Experiments', count: repoStatus.experiments, to: '/experiments' },
    { label: 'Figures', count: repoStatus.pngFigures, to: '/experiments' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-sm border border-border-subtle bg-surface/80 px-4 py-2.5 font-mono text-[10px] text-text-muted">
      {items.map((item) => (
        <button key={item.label} type="button" onClick={() => {}} // no nav — purely informational
          className="flex items-center gap-1.5 cursor-default">
          <span className="tabular-nums text-text-secondary font-medium">{item.count}</span>
          <span>{item.label}</span>
        </button>
      ))}
      <span className="ml-auto text-text-muted">Indexed {repoStatus.indexedAgo}</span>
    </div>
  );
}

// ── Current Work ────────────────────────────────────────────────────────
function CurrentWorkSection({ navigate }: { navigate: (to: string) => void }) {
  return (
    <section className="rounded-sm border border-brand-border bg-elevated">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-border/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-medium text-text">Current Investigation</h2>
          <span className="font-mono text-[10px] text-text-muted">Updated 2m ago</span>
        </div>
      </div>

      <div className="p-4">
        {/* Active finding */}
        <div className="flex items-start gap-3">
          <span className="size-2 shrink-0 rounded-full bg-brand mt-1.5" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] text-brand font-medium">F-0050</span>
              <span className="text-[13px] text-text font-medium">Entry temperature variance</span>
            </div>
            <p className="mt-1 text-[12px] text-text-secondary leading-relaxed">
              Residual thickness variance remains linked to roll-gap and entry temperature interactions.
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-text-muted">
              <span>Related: <button type="button" onClick={() => navigate('/findings?tab=questions&focus=Q-0014')} className="text-amber hover:underline">Q-0014</button></span>
              <span>·</span>
              <span>experiments/2026-06-17_roll_gap_variance</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-border-subtle" />

        {/* Recommended next step */}
        <div className="rounded-sm border border-brand-border/40 bg-brand-muted/20 px-3 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-brand">Recommended next step</span>
          </div>
          <p className="mt-1 text-[13px] text-text">
            Investigate whether entry temperature interacts with the roll-gap setpoint.
          </p>
          <p className="mt-0.5 text-[12px] text-text-secondary">
            Q-0014 indicates an entry-temp floor near 980°C. Confirming this could refine the thickness model.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => navigate('/chat?ctx=Q-0014,F-0050')}
              className="flex h-11 items-center gap-1.5 rounded-sm bg-brand px-4 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-brand-hover">
              <Sparkles className="size-3.5" /> Continue investigation
            </button>
            <button type="button" onClick={() => navigate('/findings?focus=F-0050')}
              className="flex h-11 items-center rounded-sm border border-border-strong bg-surface-2 px-3 text-[12px] text-text-secondary transition-colors hover:text-text">
              Open finding
            </button>
            <button type="button" onClick={() => navigate('/findings?tab=questions&focus=Q-0014')}
              className="flex h-11 items-center rounded-sm border border-border-strong bg-surface-2 px-3 text-[12px] text-text-secondary transition-colors hover:text-text">
              View question
            </button>
            <button type="button" onClick={() => navigate('/graph?focus=F-0050')}
              className="flex h-11 items-center rounded-sm border border-border-strong bg-surface-2 px-3 text-[12px] text-text-secondary transition-colors hover:text-text">
              View graph
            </button>
          </div>
        </div>

        {/* Related question + report row */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Open Question</span>
                <MonoId className="text-amber text-[11px]">Q-0014</MonoId>
              </div>
              <PriorityBadge priority="high" />
            </div>
            <div className="mt-1.5 text-[13px] text-text">Does entry temperature interact with roll-gap setpoint?</div>
            <button type="button" onClick={() => navigate('/findings?tab=questions&focus=Q-0014')}
              className="mt-1.5 font-mono text-[11px] text-brand hover:underline">View question →</button>
          </div>
          <div className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Latest Report</span>
              <span className="font-mono text-[10px] text-text-muted">18m ago</span>
            </div>
            <div className="mt-1.5 text-[13px] text-text">Roll-gap variance report</div>
            <MonoId muted className="text-[11px]">experiments/2026-06-17_roll_gap_variance</MonoId>
            <div className="mt-1 flex gap-3 font-mono text-[10px] text-text-muted">
              <span>2 figures</span>
              <span>3 related findings</span>
            </div>
            <button type="button" onClick={() => navigate('/experiments')}
              className="mt-1.5 font-mono text-[11px] text-brand hover:underline">Open report →</button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Knowledge Loop ──────────────────────────────────────────────────────
function KnowledgeLoop() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
      {LOOP_PHASES.map((phase, pi) => (
        <div key={phase.id} className="flex flex-1 flex-col gap-2">
          <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{phase.label}</div>
          <div className="flex flex-col gap-2 flex-1">
            {phase.nodes.map((n) => (
              <LoopCard key={n.step} n={n} />
            ))}
          </div>
          {pi < LOOP_PHASES.length - 1 && (
            <div className="flex items-center justify-center py-1 text-text-muted sm:py-0 sm:px-2 sm:self-stretch sm:items-center">
              <ChevronRight className="size-5 shrink-0 hidden sm:block" />
              <ChevronDown className="size-5 shrink-0 sm:hidden" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LoopCard({ n }: { n: LoopNode }) {
  const navigate = useNavigate();
  const Tag = n.clickable ? 'button' : 'div';
  return (
    <Tag
      type={n.clickable ? 'button' : undefined}
      onClick={n.clickable ? () => navigate(n.to!) : undefined}
      className={cn(
        'flex gap-2.5 rounded-sm border px-3 py-2 min-h-11 text-left',
        n.clickable ? 'cursor-pointer border-border-strong bg-elevated hover:border-brand-border transition-colors' : 'border-border-subtle bg-surface-2',
        n.clickable && 'hover:bg-elevated',
      )}
    >
      <div className="flex flex-col items-center gap-1">
        <n.icon className={cn('size-4 shrink-0', TONE_TEXT[n.tone])} strokeWidth={1.75} />
        <span className={cn('size-1 rounded-full', TONE_TEXT[n.tone])} />
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn('text-[12px]', n.clickable ? 'text-text' : 'text-text-secondary')}>{n.label}</div>
        <p className="text-[10px] leading-snug text-text-muted">{n.sub}</p>
      </div>
    </Tag>
  );
}

// ── Documentation Layers ───────────────────────────────────────────────
function DocLayers() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="flex flex-col gap-1.5">
      {LAYERS.map((l) => {
        const isOpen = expanded.has(l.id);
        return (
          <div key={l.id}>
            <button type="button" aria-expanded={isOpen} onClick={() => toggle(l.id)}
              className="flex w-full items-center gap-3 rounded-sm border border-border-subtle bg-surface-2 px-3 py-2.5 text-left transition-colors hover:border-border-strong">
              <span className={cn('font-mono text-[13px] w-10 shrink-0', TONE_TEXT[l.tone])}>{l.id}</span>
              <div className="min-w-0 flex-1">
                <MonoId className="text-info text-[12px]">{l.path}</MonoId>
                <p className="text-[12px] text-text-secondary">{l.purpose}</p>
              </div>
              <div className="hidden sm:block shrink-0">
                <StatusBadge value={l.status} tone={l.tone === 'muted' ? undefined : l.tone} />
              </div>
              <span className="shrink-0 font-mono text-[10px] text-text-muted">{l.files.length} files</span>
              <ChevronDown className={cn('size-3.5 text-text-muted shrink-0 transition-transform', isOpen && 'rotate-180')} />
            </button>
            {isOpen && (
              <div className="flex flex-wrap gap-1.5 px-3 pt-1.5 pb-2">
                {l.files.map((f) => (
                  <span key={f} className="rounded-sm border border-border-subtle bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted">{f}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Recent Activity ─────────────────────────────────────────────────────
function RecentActivitySection({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div className="flex flex-col">
      {ACTIVITY.map((a, i) => (
        <button key={i} type="button" onClick={() => navigate(a.to)}
          className="flex items-center gap-3 border-b border-border-subtle py-2 last:border-0 px-2 -mx-2 rounded-sm hover:bg-surface-2 transition-colors text-left min-h-11">
          <span className={cn('w-16 shrink-0 font-mono text-[10px] uppercase', TONE_TEXT[a.tone])}>{a.type}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] text-text">{a.title}</div>
            <MonoId muted className="text-[11px]">{a.source}</MonoId>
          </div>
          <span className="shrink-0 font-mono text-[11px] text-text-muted">{a.time}</span>
          <ChevronRight className="size-3.5 shrink-0 text-text-muted" />
        </button>
      ))}
    </div>
  );
}

// ── Quick Actions ───────────────────────────────────────────────────────
function QuickActionsSection({ navigate }: { navigate: (to: string) => void }) {
  const actions: { icon: LucideIcon; label: string; to: string }[] = [
    { icon: Table2, label: 'Open Findings', to: '/findings' },
    { icon: FlaskConical, label: 'Open Reports', to: '/experiments' },
    { icon: SlidersHorizontal, label: 'Faceted Search', to: '/search' },
    { icon: Share2, label: 'Knowledge Graph', to: '/graph' },
    { icon: GitBranch, label: 'View Lineage', to: '/lineage' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 pb-4">
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted mr-1">Navigate</span>
      {actions.map((a) => (
        <button key={a.to} type="button" onClick={() => navigate(a.to)}
          className="flex h-9 items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2.5 font-mono text-[11px] text-text-muted transition-colors hover:text-text hover:border-border-strong">
          <a.icon className="size-3" /> {a.label}
        </button>
      ))}
    </div>
  );
}

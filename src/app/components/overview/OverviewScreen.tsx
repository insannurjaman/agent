import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  HelpCircle, Search, FolderPlus, Play, CheckCheck, BookMarked, CircleHelp,
  FileText, BadgeCheck, ArrowDown, ArrowRight, Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { ScreenHeader, MonoId } from '../common/primitives';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { repoStatus, getFindingById } from '../../data';
import { cn } from '../ui/utils';

// ── Data ────────────────────────────────────────────────────────────────

interface LoopNode { step: string; label: string; sub: string; icon: LucideIcon; tone: 'green' | 'teal' | 'amber' | 'blue' | 'purple'; clickable?: boolean; to?: string; }

const LOOP_NODES: LoopNode[] = [
  { step: '01', label: 'Question', sub: 'Unresolved issue or investigation prompt', icon: HelpCircle, tone: 'amber', clickable: true, to: '/findings?tab=questions' },
  { step: '02', label: 'Review Knowledge', sub: 'Search findings, questions, facets, and graph', icon: Search, tone: 'blue', clickable: true, to: '/search' },
  { step: '03', label: 'Create Experiment', sub: 'Create experiments/<slug>/ workspace', icon: FolderPlus, tone: 'teal', clickable: true, to: '/experiments' },
  { step: '04', label: 'Execute', sub: 'Run analysis code and generate artifacts', icon: Play, tone: 'blue' },
  { step: '05', label: 'Validate', sub: 'Check outputs, metrics, and evidence', icon: CheckCheck, tone: 'teal' },
  { step: '06', label: 'Knowledge', sub: 'Register findings through Claude-mediated workflow', icon: BookMarked, tone: 'green', clickable: true, to: '/findings' },
  { step: '07', label: 'Issues', sub: 'Register open questions through Claude-mediated workflow', icon: CircleHelp, tone: 'amber', clickable: true, to: '/findings?tab=questions' },
  { step: '08', label: 'Report', sub: 'Generate README / REPORT.md', icon: FileText, tone: 'teal', clickable: true, to: '/experiments' },
  { step: '09', label: 'Promotion', sub: 'User confirms promoted knowledge', icon: BadgeCheck, tone: 'purple' },
];

const PHASE_BOUNDARIES = [1, 3, 5]; // step indices where phases start (0-based)

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

const PHASE_LABELS = ['Phase 1 · Input', 'Phase 2 · Experiment', 'Phase 3 · Knowledge Output'];

function Sec({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-border-subtle bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <div>
          <h2 className="text-[13px] font-medium text-text">{title}</h2>
          {desc && <p className="mt-0.5 text-[12px] text-text-secondary">{desc}</p>}
        </div>
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
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 lg:max-w-7xl">
          <SystemStatus />
          <CurrentWorkSection navigate={navigate} />
          <Sec title="Knowledge Loop" desc="Agent-driven experiments convert questions into reusable knowledge, reports, and unresolved issues.">
            <KnowledgeLoop />
          </Sec>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1fr]">
            <Sec title="Documentation Layers"><DocLayers /></Sec>
            <Sec title="Recent Knowledge Activity"><RecentActivitySection navigate={navigate} /></Sec>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── System Status ───────────────────────────────────────────────────────
function SystemStatus() {
  const navigate = useNavigate();
  const items = [
    { label: 'Findings', count: repoStatus.findings, to: '/findings' },
    { label: 'Open Questions', count: repoStatus.openQuestions, to: '/findings?tab=questions' },
    { label: 'Experiments', count: repoStatus.experiments, to: '/experiments' },
    { label: 'Relationships', count: repoStatus.edges, to: '/graph' },
    { label: 'Figures', count: repoStatus.pngFigures, to: '/experiments' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-sm border border-border-subtle bg-surface/80 px-5 py-3">
      {items.map((item) => (
        <button key={item.label} type="button" onClick={() => navigate(item.to)}
          className="group flex items-center gap-1.5 rounded-sm px-1 -mx-1 py-0.5 transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-brand-ring"
          aria-label={`${item.count} ${item.label} — click to view`}>
          <span className="tabular-nums text-[14px] font-medium text-text">{item.count}</span>
          <span className="text-[12px] text-text-secondary group-hover:text-text transition-colors">{item.label}</span>
        </button>
      ))}
      <span className="ml-auto text-[12px] text-text-muted">Indexed {repoStatus.indexedAgo}</span>
    </div>
  );
}

// ── Current Work ────────────────────────────────────────────────────────
function CurrentWorkSection({ navigate }: { navigate: (to: string) => void }) {
  const f0034 = getFindingById('F-0034');
  const f0031 = getFindingById('F-0031');
  return (
    <section className="rounded-sm border border-brand-border bg-elevated">
      <div className="flex items-center justify-between border-b border-brand-border/20 px-5 py-3">
        <h2 className="text-[14px] font-medium text-text">Current Investigation</h2>
        <span className="text-[12px] text-text-muted">Updated 2m ago</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Finding */}
        <div className="flex items-start gap-3">
          <span className="size-2.5 shrink-0 rounded-full bg-brand mt-1" />
          <div className="min-w-0 flex-1">
            <span className="font-mono text-[13px] text-brand font-medium">F-0050</span>
            <span className="text-[14px] text-text font-medium ml-2">Entry temperature variance</span>
            <p className="mt-0.5 text-[12px] text-text-secondary leading-relaxed">
              Residual thickness variance remains linked to roll-gap and entry temperature interactions.
            </p>
          </div>
        </div>

        {/* Blocking question */}
        <div className="flex items-start gap-3 pl-6">
          <span className="size-2 shrink-0 rounded-full bg-amber mt-1.5" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-text-muted">Open question blocking progress</span>
              <MonoId className="text-amber text-[12px]">Q-0014</MonoId>
              <PriorityBadge priority="high" />
            </div>
            <div className="mt-0.5 text-[13px] text-text">Does entry temperature interact with roll-gap setpoint?</div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border-subtle" />

        {/* Recommended next step — no internal border */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand shrink-0" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-brand">Recommended next step</span>
          </div>
          <p className="text-[14px] text-text">
            Investigate whether entry temperature interacts with the roll-gap setpoint.
          </p>
          <p className="text-[12px] text-text-secondary">
            Q-0014 indicates an entry-temp floor near 980°C. Confirming this could refine the thickness model.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => navigate('/chat?ctx=Q-0014,F-0050')}
              className="flex h-10 items-center gap-1.5 rounded-sm bg-brand px-4 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand-ring">
              <Sparkles className="size-3.5" /> Continue investigation
            </button>
            <button type="button" onClick={() => navigate('/findings?focus=F-0050')}
              className="flex h-10 items-center rounded-sm border border-border-strong bg-surface-2 px-3 text-[12px] text-text-secondary transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-brand-ring">
              Open finding
            </button>
            <button type="button" onClick={() => navigate('/findings?tab=questions&focus=Q-0014')}
              className="flex h-10 items-center rounded-sm border border-border-strong bg-surface-2 px-3 text-[12px] text-text-secondary transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-brand-ring">
              View question
            </button>
            <button type="button" onClick={() => navigate('/graph?focus=F-0050')}
              className="flex h-10 items-center rounded-sm border border-border-strong bg-surface-2 px-3 text-[12px] text-text-secondary transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-brand-ring">
              View graph
            </button>
          </div>
        </div>

        {/* Related cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-sm border border-border-subtle bg-surface px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-wider text-text-muted font-medium">Latest Report</span>
              <span className="text-[11px] text-text-muted">indexed 18m ago</span>
            </div>
            <div className="mt-1">
              <span className="text-[13px] text-text">Roll-gap variance</span>
              <MonoId muted className="block text-[12px] mt-0.5">experiments/2026-06-17_roll_gap_variance</MonoId>
            </div>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-text-muted">
              <span>2 figures</span>
              <span>3 related</span>
              <button type="button" onClick={() => navigate('/experiments')} className="ml-auto text-brand hover:underline">Open →</button>
            </div>
          </div>

          {/* Related Findings — with real titles */}
          <div className="rounded-sm border border-border-subtle bg-surface px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-text-muted font-medium">Related Findings</span>
              <span className="text-[11px] text-text-muted">· 2</span>
            </div>
            <div className="mt-1.5 space-y-1.5">
              {f0034 && (
                <button type="button" onClick={() => navigate(`/findings?focus=${f0034.id}`)}
                  className="flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-left hover:bg-surface-2 transition-colors focus-visible:ring-2 focus-visible:ring-brand-ring min-h-8">
                  <span className="font-mono text-[11px] text-text-secondary shrink-0">F-0034</span>
                  <span className="text-[12px] text-text truncate">{f0034.title}</span>
                </button>
              )}
              {f0031 && (
                <button type="button" onClick={() => navigate(`/findings?focus=${f0031.id}`)}
                  className="flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-left hover:bg-surface-2 transition-colors focus-visible:ring-2 focus-visible:ring-brand-ring min-h-8">
                  <span className="font-mono text-[11px] text-text-secondary shrink-0">F-0031</span>
                  <span className="text-[12px] text-text truncate">{f0031.title}</span>
                </button>
              )}
            </div>
            <button type="button" onClick={() => navigate('/findings?focus=F-0050')} className="mt-1.5 text-[11px] text-brand hover:underline">View all related →</button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Knowledge Loop ──────────────────────────────────────────────────────
function KnowledgeLoop() {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0">
      {[0, 1, 2].map((phaseIdx) => {
        const start = PHASE_BOUNDARIES[phaseIdx];
        const end = phaseIdx < PHASE_BOUNDARIES.length - 1 ? PHASE_BOUNDARIES[phaseIdx + 1] : LOOP_NODES.length;
        const phaseNodes = LOOP_NODES.slice(start, end);
        return (
          <div key={phaseIdx} className="flex flex-1 flex-col">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-text-muted font-medium px-1">{PHASE_LABELS[phaseIdx]}</div>
            <div className="flex flex-col gap-0 flex-1">
              {phaseNodes.map((n, ni) => {
                const globalIdx = start + ni;
                return (
                  <div key={n.step} className="flex flex-col">
                    <LoopCard n={n} globalIdx={globalIdx} />
                    {ni < phaseNodes.length - 1 && (
                      <div className="flex justify-center py-1 text-text-muted">
                        <ArrowDown className="size-3.5" aria-hidden="true" />
                      </div>
                    )}
                    {/* Inter-phase connector: after last card of phase i to first card of phase i+1 */}
                    {ni === phaseNodes.length - 1 && phaseIdx < 2 && (
                      <div className="flex items-center justify-center py-2 sm:py-0 sm:px-2 sm:self-stretch sm:min-h-[40px]">
                        <ArrowRight className="size-4 hidden sm:block text-text-muted" aria-hidden="true" />
                        <ArrowDown className="size-4 sm:hidden text-text-muted" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LoopCard({ n, globalIdx }: { n: LoopNode; globalIdx: number }) {
  const navigate = useNavigate();
  const Tag = n.clickable ? 'button' : 'div';
  return (
    <Tag
      type={n.clickable ? 'button' : undefined}
      onClick={n.clickable ? () => navigate(n.to!) : undefined}
      className={cn(
        'flex gap-3 rounded-sm border px-3 py-2.5 min-h-11 text-left flex-1',
        n.clickable
          ? 'cursor-pointer border-border-strong bg-elevated hover:border-brand-border hover:bg-elevated transition-colors focus-visible:ring-2 focus-visible:ring-brand-ring'
          : 'border-border-subtle bg-surface-2',
      )}
      aria-label={n.clickable ? `${n.step}: ${n.label} — ${n.sub}` : undefined}
    >
      <div className="flex flex-col items-center gap-0.5 pt-0.5">
        <span className="font-mono text-[10px] text-text-muted tabular-nums">{n.step}</span>
        <span className={cn('size-1 rounded-full', TONE_TEXT[n.tone])} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <n.icon className={cn('size-3.5 shrink-0', TONE_TEXT[n.tone])} strokeWidth={1.75} />
          <span className={cn('text-[13px]', n.clickable ? 'text-text font-medium' : 'text-text-secondary')}>{n.label}</span>
        </div>
        <p className="text-[11px] leading-snug text-text-muted mt-0.5">{n.sub}</p>
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
              className="flex w-full items-center gap-3 rounded-sm border border-border-subtle bg-surface-2 px-3 py-2.5 text-left transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-brand-ring min-h-10">
              <span className={cn('font-mono text-[13px] w-10 shrink-0', TONE_TEXT[l.tone])}>{l.id}</span>
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[12px] text-info">{l.path}</span>
                <p className="text-[12px] text-text-secondary">{l.purpose}</p>
              </div>
              <div className="hidden sm:block shrink-0">
                <StatusBadge value={l.status} tone={l.tone === 'muted' ? undefined : l.tone} />
              </div>
              <span className="shrink-0 text-[12px] text-text-muted">{l.files.length} files</span>
              <span className={cn('size-3.5 shrink-0 text-text-muted transition-transform', isOpen && 'rotate-180')}>
                ▼
              </span>
            </button>
            {isOpen && (
              <div className="flex flex-wrap gap-1.5 px-3 pt-1.5 pb-2">
                {l.files.map((f) => (
                  <span key={f} className="rounded-sm border border-border-subtle bg-surface px-1.5 py-0.5 font-mono text-[11px] text-text-muted">{f}</span>
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
          className="flex items-center gap-3 border-b border-border-subtle py-2.5 last:border-0 px-2 -mx-2 rounded-sm hover:bg-surface-2 transition-colors text-left min-h-10 focus-visible:ring-2 focus-visible:ring-brand-ring">
          <span className={cn('w-16 shrink-0 text-[11px] uppercase font-medium', TONE_TEXT[a.tone])}>{a.type}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] text-text">{a.title}</div>
            <span className="text-[12px] text-text-muted">{a.source}</span>
          </div>
          <span className="shrink-0 text-[12px] text-text-muted">{a.time}</span>
          <span className="size-3.5 shrink-0 text-text-muted">→</span>
        </button>
      ))}
    </div>
  );
}

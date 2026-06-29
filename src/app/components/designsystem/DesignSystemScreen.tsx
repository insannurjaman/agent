import { Send, Square, Paperclip, Loader2, Pause, Play, ArrowRight, X, AlertTriangle, ChevronDown } from 'lucide-react';
import { ScreenHeader } from '../common/primitives';
import { StatusBadge } from '../common/StatusBadge';
import { ChatEventView, ActivityGroup, ProposalGroup, type ChatEventHandlers, type ProposalStatus, type Density } from '../chat/ChatEvents';
import type { ChatEvent, FindingProposal, QuestionProposal } from '../../data/chat';
import { composerModeDescriptions } from '../../data/chat';
import { cn } from '../ui/utils';

const noop = () => {};
function handlers(status: Record<string, ProposalStatus> = {}, density: Density = 'focus'): ChatEventHandlers {
  return {
    onNav: noop,
    onOpenArtifact: noop,
    onAttachResults: noop,
    onOpenInOut: noop,
    onReview: noop,
    onConfirmFinding: noop,
    onConfirmQuestion: noop,
    onRetryProposal: noop,
    proposalStatus: status,
    onOpenLog: noop,
    density,
  };
}

const finding: FindingProposal = {
  findingId: 'F-0061',
  title: 'Entry temperature moderates residual thickness after roll-gap correction.',
  summary: 'Entry temperature remains a significant residual factor after controlling for roll-gap setpoint.',
  confidence: 'medium-high',
  evidence: 'experiments/2026-06-17_roll_gap_variance',
  facets: ['process:rolling', 'phenomena:thermal'],
  actionable: true,
  targetFile: 'knowledge/findings.csv',
  gateway: 'knowledge-searcher / log-finding',
};
const question: QuestionProposal = {
  questionId: 'Q-0031',
  title: 'Should entry temperature thresholds be segmented by coil width?',
  priority: 'medium',
  status: 'open',
  area: 'thermal',
  relatedFinding: 'F-0061',
  targetFile: 'knowledge/open_questions.csv',
  gateway: 'add-open-question',
};

const opEvents: ChatEvent[] = [
  { kind: 'system', id: 'o1', time: '11:32', label: 'Created experiment directory', detail: 'experiments/2026-06-17_roll_gap_variance' },
  { kind: 'tool', id: 'o2', time: '11:31', action: 'search_kg.py facet', command: 'search_kg.py facet process:rolling equipment:roll-gap', status: 'completed', result: '4 findings · 2 open questions', resultIds: ['F-0050', 'F-0048', 'Q-0014', 'Q-0011'] },
  { kind: 'exec', id: 'o3', time: '11:40', command: 'analysis.py', duration: '12.4s', exitCode: 0 },
  { kind: 'artifact', id: 'o4', time: '11:40', artifactId: 'thickness_by_roll_gap.png', path: 'outputs/figures/thickness_by_roll_gap.png' },
  { kind: 'report', id: 'o5', time: '11:42', path: 'REPORT.md', sections: ['Phenomenon', 'Variables', 'Mechanism', 'Countermeasures'] },
];
type OpEvent = Extract<ChatEvent, { kind: 'system' | 'tool' | 'exec' | 'artifact' | 'report' }>;
const ops = opEvents as OpEvent[];

const messageSamples: { label: string; event: ChatEvent }[] = [
  { label: 'User message', event: { kind: 'user', id: 'u', time: '11:30', text: 'Investigate residual thickness variance after roll-gap adjustment.' } },
  { label: 'Agent planning response', event: { kind: 'claude', id: 'c1', time: '11:30', text: "I'll search existing findings, then create a follow-up experiment if evidence is insufficient." } },
  { label: 'Agent analysis response', event: { kind: 'analysis', id: 'a', time: '11:32', summary: 'Roll-gap explains most variance; entry temperature appears as a residual factor.', relatedFindings: [{ id: 'F-0050', text: 'Entry temperature accounts for residual variance' }], openQuestions: [{ id: 'Q-0014', text: 'Does entry temperature interact with roll-gap?' }] } },
  { label: 'Error event', event: { kind: 'error', id: 'er', time: '09:55', command: 'analysis.py', exitCode: 1, reason: 'missing parquet snapshot for handover window' } },
];

export function DesignSystemScreen() {
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Design System / Components" subtitle="Chat Workspace V3 — calm message, activity, proposal, composer, session, and artifact specimens." />
      <div className="min-h-0 flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <Group title="Message & conversation components">
            {messageSamples.map((s) => (
              <Spec key={s.label} label={s.label}>
                <ChatEventView event={s.event} h={handlers()} />
              </Spec>
            ))}
          </Group>

          <Group title="Activity group (collapsed by default in Focus)">
            <Spec label="Activity group · Focus">
              <ActivityGroup events={ops} h={handlers()} />
            </Spec>
            <Spec label="Activity group · Trace">
              <ActivityGroup events={ops} h={handlers({}, 'trace')} />
            </Spec>
          </Group>

          <Group title="Proposal summary & confirmation flow">
            <Spec label="Proposal summary (Focus)">
              <ProposalGroup findings={[finding]} questions={[question]} time="11:42" h={handlers()} />
            </Spec>
            <Spec label="Confirmation pending">
              <ProposalGroup findings={[finding]} questions={[question]} time="11:42" h={handlers({ 'F-0061': 'pending', 'Q-0031': 'pending' })} />
            </Spec>
            <Spec label="Confirmation completed">
              <ProposalGroup findings={[finding]} questions={[question]} time="11:42" h={handlers({ 'F-0061': 'completed', 'Q-0031': 'completed' })} />
            </Spec>
            <Spec label="Full proposal cards (Trace)">
              <ProposalGroup findings={[finding]} questions={[question]} time="11:42" h={handlers({}, 'trace')} />
            </Spec>
          </Group>

          <Group title="Composer components">
            <Spec label="Context chips">
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="green">F-0050</Chip>
                <Chip tone="amber">Q-0014</Chip>
                <Chip tone="teal">experiment:2026-06-08_anomaly_check</Chip>
                <Chip tone="teal">REPORT.md</Chip>
              </div>
            </Spec>
            <Spec label="Mode dropdown + description">
              <div className="rounded-sm border border-border-subtle bg-surface-2">
                <div className="flex items-center gap-1.5 border-b border-border-subtle px-2 py-1.5 font-mono text-[11px] text-text-secondary">
                  Mode: <span className="text-text">Investigate</span> <ChevronDown className="size-3" />
                </div>
                <div className="px-3 py-1.5 font-mono text-[11px] text-text-muted">{composerModeDescriptions.Investigate}</div>
              </div>
            </Spec>
            <Spec label="Active composer controls">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface px-2 py-1 font-mono text-[11px] text-text-secondary">
                  <Paperclip className="size-3.5" /> Attach context
                </span>
                <span className="flex items-center gap-1.5 rounded-sm border border-brand-border bg-brand px-3 py-1.5 text-[12px] text-primary-foreground">
                  <Send className="size-3.5" /> Send
                </span>
              </div>
            </Spec>
            <Spec label="Streaming + stop">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-[13px] text-brand">
                  <Loader2 className="size-3.5 animate-spin" /> Agent is working…
                </span>
                <span className="flex items-center gap-1.5 rounded-sm border border-red/40 bg-red/10 px-3 py-1.5 text-[12px] text-red">
                  <Square className="size-3.5" /> Stop
                </span>
              </div>
            </Spec>
          </Group>

          <Group title="Session components">
            <Spec label="Session rows (running / completed / failed)">
              <div className="space-y-1.5">
                <SessionSpec id="chat_2026-06-17_001" title="Residual thickness investigation" status="running" tone="teal" selected />
                <SessionSpec id="chat_2026-06-16_004" title="Feed-rate threshold review" status="completed" tone="green" />
                <SessionSpec id="chat_2026-06-13_002" title="Shift handover null burst" status="failed" tone="red" />
              </div>
            </Spec>
            <Spec label="Session mismatch warning">
              <div className="flex items-center gap-2 rounded-sm border border-amber/30 bg-amber/[0.06] px-3 py-2">
                <AlertTriangle className="size-4 text-amber" />
                <span className="text-[12px] text-amber">Session data mismatch — transcript and artifact viewer reference different directories.</span>
              </div>
            </Spec>
          </Group>

          <Group title="Artifact components">
            <Spec label="Auto-follow ON">
              <Banner tone="teal">
                <span className="size-1.5 rounded-full bg-brand" /> Following latest artifact
                <span className="ml-auto flex items-center gap-1 text-text-secondary"><Pause className="size-3" /> Pause</span>
              </Banner>
            </Spec>
            <Spec label="Auto-follow paused">
              <Banner tone="amber">
                <span className="size-1.5 rounded-full bg-amber" /> Viewing pinned artifact
                <span className="ml-auto flex items-center gap-2 text-text-secondary">
                  <span className="flex items-center gap-1"><Play className="size-3" /> Resume</span>
                  <span className="flex items-center gap-1 text-brand">Open latest <ArrowRight className="size-3" /></span>
                </span>
              </Banner>
            </Spec>
            <Spec label="New artifact notification">
              <Banner tone="muted">
                <span className="size-1.5 rounded-full bg-brand" /> New artifact generated: <span className="text-brand">residual_trend.png</span>
                <span className="ml-auto flex items-center gap-2">
                  <span className="text-brand">Open latest</span>
                  <span className="flex items-center gap-0.5 text-text-muted">Keep pinned <X className="size-3" /></span>
                </span>
              </Banner>
            </Spec>
            <Spec label="No artifact state">
              <div className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-4 text-center">
                <div className="text-[13px] text-text-secondary">No artifacts yet</div>
                <div className="mt-0.5 text-[12px] text-text-muted">Generated PNG, HTML, and JSON artifacts will appear here.</div>
              </div>
            </Spec>
          </Group>
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 border-b border-border-subtle pb-1.5 font-mono text-[11px] uppercase tracking-wider text-text-muted">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4">
      <div className="pt-1 font-mono text-[11px] text-text-muted">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function Chip({ tone, children }: { tone: 'green' | 'amber' | 'teal'; children: React.ReactNode }) {
  const cls = tone === 'green' ? 'text-green border-green/30' : tone === 'amber' ? 'text-amber border-amber/30' : 'text-brand border-brand-border';
  return <span className={cn('rounded-sm border bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]', cls)}>{children}</span>;
}

function Banner({ tone, children }: { tone: 'teal' | 'amber' | 'red' | 'muted'; children: React.ReactNode }) {
  const bg = tone === 'teal' ? 'bg-brand-muted' : tone === 'amber' ? 'bg-amber/[0.06]' : tone === 'red' ? 'bg-red/[0.06]' : 'bg-surface-2';
  return <div className={cn('flex items-center gap-2 rounded-sm border border-border-subtle px-3 py-1.5 font-mono text-[11px] text-text-secondary', bg)}>{children}</div>;
}

function SessionSpec({ id, title, status, tone, selected }: { id: string; title: string; status: string; tone: 'teal' | 'green' | 'red'; selected?: boolean }) {
  return (
    <div className={cn('relative rounded-sm border px-2.5 py-2', selected ? 'border-border-strong bg-surface-2' : 'border-border-subtle bg-surface')}>
      {selected && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand" />}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-text-secondary">{id}</span>
        <StatusBadge value={status} tone={tone} showDot />
      </div>
      <div className="mt-0.5 text-[13px] text-text">{title}</div>
    </div>
  );
}

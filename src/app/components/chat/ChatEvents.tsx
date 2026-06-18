import { useState } from 'react';
import {
  Terminal,
  FolderPlus,
  FileText,
  Image as ImageIcon,
  Sparkles,
  AlertTriangle,
  Play,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Activity as ActivityIcon,
} from 'lucide-react';
import type { ChatEvent, FindingProposal, QuestionProposal } from '../../data/chat';
import { cn } from '../ui/utils';

export type ProposalStatus = 'idle' | 'pending' | 'completed' | 'failed';
export type Density = 'focus' | 'trace';

export interface ChatEventHandlers {
  onNav: (id: string) => void;
  onOpenArtifact: (artifactId: string) => void;
  onAttachResults: (ids: string[]) => void;
  onOpenFacetedSearch: () => void;
  onReview: (findings: FindingProposal[], questions: QuestionProposal[]) => void;
  onConfirmFinding: (p: FindingProposal) => void;
  onConfirmQuestion: (p: QuestionProposal) => void;
  onRetryProposal: (id: string) => void;
  proposalStatus: Record<string, ProposalStatus>;
  onOpenLog: () => void;
  density: Density;
}

function IdLink({ id, onNav }: { id: string; onNav: (id: string) => void }) {
  const color = id.startsWith('F-') ? 'text-green' : id.startsWith('Q-') ? 'text-amber' : 'text-teal';
  return (
    <button type="button" onClick={() => onNav(id)} className={cn('font-mono hover:underline', color)}>
      {id}
    </button>
  );
}

function UtilityBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-sm border border-border-strong bg-surface-2 px-2.5 py-1 text-[12px] text-text-secondary transition-colors hover:text-text"
    >
      {children}
    </button>
  );
}

function ClaudeBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-sm border border-purple/40 bg-purple/10 px-2.5 py-1 text-[12px] text-purple transition-colors hover:bg-purple/15"
    >
      {children}
    </button>
  );
}

// ── Conversation + interrupting events (user / claude / analysis / error) ──
export function ChatEventView({ event, h }: { event: ChatEvent; h: ChatEventHandlers }) {
  switch (event.kind) {
    case 'user':
      return (
        <div className="flex flex-col items-end">
          <span className="mb-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">You</span>
          <div className="max-w-[88%] text-[14px] leading-relaxed text-text">{event.text}</div>
        </div>
      );

    case 'claude':
      return (
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <Sparkles className="size-3 text-text-muted" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Claude</span>
          </div>
          <p className="text-[14px] leading-relaxed text-text-secondary">{event.text}</p>
        </div>
      );

    case 'analysis':
      return (
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <Sparkles className="size-3 text-text-muted" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Claude · Analysis</span>
          </div>
          <p className="text-[14px] leading-relaxed text-text-secondary">{event.summary}</p>
          <div className="mt-2 space-y-1 border-l border-border-subtle pl-3">
            {event.relatedFindings.map((f) => (
              <div key={f.id} className="flex gap-2 text-[13px] text-text-secondary">
                <IdLink id={f.id} onNav={h.onNav} />
                <span className="truncate text-text-muted">{f.text}</span>
              </div>
            ))}
            {event.openQuestions.map((q) => (
              <div key={q.id} className="flex gap-2 text-[13px] text-text-secondary">
                <IdLink id={q.id} onNav={h.onNav} />
                <span className="truncate text-text-muted">{q.text}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'error':
      return (
        <div className="rounded-sm border border-red/30 bg-red/[0.06]">
          <div className="flex items-center gap-1.5 border-b border-red/20 px-3 py-1.5">
            <AlertTriangle className="size-3.5 text-red" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-red">Tool Error</span>
            <span className="ml-auto font-mono text-[10px] text-text-muted">{event.time}</span>
          </div>
          <div className="px-3 py-3">
            <div className="font-mono text-[12px] text-text">
              {event.command} failed · <span className="text-red">exit {event.exitCode}</span>
            </div>
            <div className="mt-1 font-mono text-[12px] text-red">stderr: {event.reason}</div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <UtilityBtn onClick={h.onOpenLog}>Open run.log</UtilityBtn>
              <UtilityBtn>Ask Claude to inspect</UtilityBtn>
              <UtilityBtn>Retry</UtilityBtn>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

// ── Activity group: collapses consecutive operational events ──
type OpEvent = Extract<ChatEvent, { kind: 'system' | 'tool' | 'exec' | 'artifact' | 'report' }>;

function summarize(ev: OpEvent): string {
  switch (ev.kind) {
    case 'system':
      return ev.label;
    case 'tool':
      return ev.action;
    case 'exec':
      return `${ev.command}`;
    case 'artifact':
      return 'artifact generated';
    case 'report':
      return 'REPORT.md updated';
  }
}

export function ActivityGroup({ events, h }: { events: OpEvent[]; h: ChatEventHandlers }) {
  const [open, setOpen] = useState(h.density === 'trace');
  const chips = events.map(summarize).slice(0, 4).join(' · ');
  return (
    <div className="rounded-sm border border-border-subtle bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <ActivityIcon className="size-3.5 shrink-0 text-text-muted" />
        <span className="text-[12px] text-text-secondary">
          {events.length} action{events.length !== 1 ? 's' : ''} completed
        </span>
        <span className="truncate font-mono text-[11px] text-text-muted">· {chips}</span>
        <span className="ml-auto shrink-0 font-mono text-[11px] text-text-muted">{open ? 'Hide' : 'View activity'}</span>
        <ChevronRight className={cn('size-3.5 shrink-0 text-text-muted transition-transform', open && 'rotate-90')} />
      </button>
      {open && (
        <div className="border-t border-border-subtle">
          {events.map((ev) => (
            <ActivityRow key={ev.id} ev={ev} h={h} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityRow({ ev, h }: { ev: OpEvent; h: ChatEventHandlers }) {
  const [open, setOpen] = useState(false);
  const Icon =
    ev.kind === 'tool' ? Terminal : ev.kind === 'exec' ? Play : ev.kind === 'artifact' ? ImageIcon : ev.kind === 'report' ? FileText : FolderPlus;

  let line: React.ReactNode;
  if (ev.kind === 'tool') line = <>{ev.action} {ev.status === 'completed' ? 'completed' : ev.status}{ev.result ? ` · ${ev.result}` : ''}</>;
  else if (ev.kind === 'exec') line = <>{ev.command} executed · {ev.duration} · exit {ev.exitCode}</>;
  else if (ev.kind === 'artifact') line = <>Artifact generated · {ev.path.split('/').pop()}</>;
  else if (ev.kind === 'report') line = <>REPORT.md updated · {ev.sections.length} sections</>;
  else line = <>{ev.label}{ev.detail ? ` · ${ev.detail}` : ''}</>;

  const expandable = ev.kind === 'tool' || ev.kind === 'artifact' || ev.kind === 'report';

  return (
    <div className="border-b border-border-subtle last:border-0">
      <button
        type="button"
        onClick={() => {
          if (ev.kind === 'artifact') h.onOpenArtifact(ev.artifactId);
          else if (ev.kind === 'report') h.onOpenArtifact('REPORT.md');
          else if (expandable) setOpen((v) => !v);
        }}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left"
      >
        <Icon className="size-3.5 shrink-0 text-text-muted" />
        <span className="truncate font-mono text-[12px] text-text-secondary">{line}</span>
        <span className="ml-auto shrink-0 font-mono text-[10px] text-text-muted">{ev.time}</span>
      </button>
      {open && ev.kind === 'tool' && (
        <div className="border-t border-border-subtle px-3 py-2">
          <div className="rounded-sm border border-border-subtle bg-surface-2 px-2 py-1.5 font-mono text-[12px] text-text-secondary">
            <span className="text-text-muted">$ </span>
            {ev.command}
          </div>
          {ev.resultIds && ev.resultIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {ev.resultIds.map((id) => (
                <IdLink key={id} id={id} onNav={h.onNav} />
              ))}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <UtilityBtn onClick={() => ev.resultIds && h.onAttachResults(ev.resultIds)}>Attach results to context</UtilityBtn>
            <UtilityBtn onClick={h.onOpenFacetedSearch}>Open in Faceted Search</UtilityBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Proposal group: compact summary (focus) or full cards (trace) ──
export function ProposalGroup({
  findings,
  questions,
  time,
  h,
}: {
  findings: FindingProposal[];
  questions: QuestionProposal[];
  time: string;
  h: ChatEventHandlers;
}) {
  if (h.density === 'trace') {
    return (
      <div className="flex flex-col gap-3">
        {findings.map((p) => (
          <FindingProposalCard key={p.findingId} p={p} time={time} h={h} />
        ))}
        {questions.map((p) => (
          <QuestionProposalCard key={p.questionId} p={p} time={time} h={h} />
        ))}
      </div>
    );
  }
  return <ProposalSummary findings={findings} questions={questions} time={time} h={h} />;
}

function statusOf(ids: string[], map: Record<string, ProposalStatus>): ProposalStatus {
  const states = ids.map((id) => map[id] ?? 'idle');
  if (states.some((s) => s === 'failed')) return 'failed';
  if (states.some((s) => s === 'pending')) return 'pending';
  if (states.length > 0 && states.every((s) => s === 'completed')) return 'completed';
  return 'idle';
}

function ProposalSummary({
  findings,
  questions,
  time,
  h,
}: {
  findings: FindingProposal[];
  questions: QuestionProposal[];
  time: string;
  h: ChatEventHandlers;
}) {
  const ids = [...findings.map((f) => f.findingId), ...questions.map((q) => q.questionId)];
  const status = statusOf(ids, h.proposalStatus);
  return (
    <div className="rounded-sm border border-amber/30 bg-amber/[0.05]">
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        <Sparkles className="size-3.5 text-amber" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-amber">Claude proposed updates</span>
        <span className="ml-auto font-mono text-[10px] text-text-muted">{time}</span>
      </div>
      <div className="px-3 pb-2.5">
        <div className="space-y-1">
          {findings.map((f) => (
            <div key={f.findingId} className="flex items-center gap-2 text-[13px]">
              <span className="font-mono text-green">{f.findingId}</span>
              <span className="text-text-secondary">Finding · {f.confidence} confidence</span>
            </div>
          ))}
          {questions.map((q) => (
            <div key={q.questionId} className="flex items-center gap-2 text-[13px]">
              <span className="font-mono text-amber">{q.questionId}</span>
              <span className="text-text-secondary">Open Question · {q.priority} priority</span>
            </div>
          ))}
        </div>

        {status === 'idle' && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            <UtilityBtn onClick={() => h.onReview(findings, questions)}>Review proposals</UtilityBtn>
            <UtilityBtn>Ask Claude to revise</UtilityBtn>
          </div>
        )}
        {status === 'pending' && (
          <div className="mt-2.5 flex items-center gap-2 text-[12px] text-teal">
            <Loader2 className="size-3.5 animate-spin" /> Registering through Claude…
          </div>
        )}
        {status === 'completed' && (
          <div className="mt-2.5 flex items-center gap-2 text-[12px] text-green">
            <CheckCircle2 className="size-3.5" /> Registered through Claude · knowledge updated
          </div>
        )}
        {status === 'failed' && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[12px] text-red">
              <AlertTriangle className="size-3.5" /> Registration failed
            </span>
            <UtilityBtn onClick={() => ids.forEach((id) => h.onRetryProposal(id))}>Retry</UtilityBtn>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-muted first:mt-0">{children}</div>
  );
}

function ConfirmationState({
  status,
  kind,
  id,
  targetFile,
  onRetry,
}: {
  status: ProposalStatus;
  kind: 'finding' | 'question';
  id: string;
  targetFile: string;
  onRetry: () => void;
}) {
  const noun = kind === 'finding' ? 'Finding' : 'Open question';
  if (status === 'pending')
    return (
      <div className="mt-2.5 flex items-center gap-2 rounded-sm border border-teal/30 bg-teal/[0.06] px-2.5 py-1.5">
        <Loader2 className="size-3.5 animate-spin text-teal" />
        <span className="text-[12px] text-teal">
          {noun} registration requested · <span className="font-mono">Pending</span>
        </span>
      </div>
    );
  if (status === 'completed')
    return (
      <div className="mt-2.5 rounded-sm border border-green/30 bg-green/[0.06] px-2.5 py-1.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-3.5 text-green" />
          <span className="text-[12px] text-green">{noun} registered through Claude</span>
        </div>
        <div className="mt-1 font-mono text-[11px] text-text-muted">
          <span className="text-green">{id}</span> · {targetFile} updated
        </div>
      </div>
    );
  if (status === 'failed')
    return (
      <div className="mt-2.5 rounded-sm border border-red/30 bg-red/[0.06] px-2.5 py-1.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-3.5 text-red" />
          <span className="text-[12px] text-red">{noun} registration failed</span>
        </div>
        <div className="mt-2 flex gap-2">
          <UtilityBtn>Ask Claude to inspect</UtilityBtn>
          <UtilityBtn onClick={onRetry}>Retry</UtilityBtn>
        </div>
      </div>
    );
  return null;
}

function FindingProposalCard({ p, time, h }: { p: FindingProposal; time: string; h: ChatEventHandlers }) {
  const status = h.proposalStatus[p.findingId] ?? 'idle';
  return (
    <div className="rounded-sm border border-border-strong bg-surface">
      <div className="flex items-center gap-1.5 border-b border-border-subtle px-3 py-1.5">
        <Sparkles className="size-3.5 text-amber" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">Proposed New Finding</span>
        <span className="ml-auto font-mono text-[10px] text-text-muted">{time}</span>
      </div>
      <div className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] text-green">{p.findingId}</span>
          <span className="font-mono text-[11px] text-text-muted">{p.confidence}</span>
        </div>
        <p className="mt-1.5 text-[13px] text-text">{p.title}</p>
        <div className="mt-2 space-y-0.5 font-mono text-[11px] text-text-muted">
          <div>evidence: <span className="text-teal">{p.evidence}</span></div>
          <div>target: {p.targetFile} · gateway: {p.gateway}</div>
        </div>
        {status === 'idle' ? (
          <div className="mt-2.5 flex flex-wrap gap-2">
            <UtilityBtn onClick={() => h.onReview([p], [])}>Review proposal</UtilityBtn>
            <UtilityBtn>Ask Claude to revise</UtilityBtn>
            <ClaudeBtn onClick={() => h.onConfirmFinding(p)}>Confirm through Claude</ClaudeBtn>
          </div>
        ) : (
          <ConfirmationState status={status} kind="finding" id={p.findingId} targetFile={p.targetFile} onRetry={() => h.onRetryProposal(p.findingId)} />
        )}
      </div>
    </div>
  );
}

function QuestionProposalCard({ p, time, h }: { p: QuestionProposal; time: string; h: ChatEventHandlers }) {
  const status = h.proposalStatus[p.questionId] ?? 'idle';
  return (
    <div className="rounded-sm border border-amber/30 bg-amber/[0.05]">
      <div className="flex items-center gap-1.5 border-b border-amber/20 px-3 py-1.5">
        <Sparkles className="size-3.5 text-amber" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-amber">Proposed Open Question</span>
        <span className="ml-auto font-mono text-[10px] text-text-muted">{time}</span>
      </div>
      <div className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] text-amber">{p.questionId}</span>
          <span className="font-mono text-[11px] text-text-muted">{p.priority}</span>
        </div>
        <p className="mt-1.5 text-[13px] text-text">{p.title}</p>
        <div className="mt-2 space-y-0.5 font-mono text-[11px] text-text-muted">
          <div>related: <span className="text-green">{p.relatedFinding}</span> · area: {p.area}</div>
          <div>target: {p.targetFile} · gateway: {p.gateway}</div>
        </div>
        {status === 'idle' ? (
          <div className="mt-2.5 flex flex-wrap gap-2">
            <UtilityBtn onClick={() => h.onReview([], [p])}>Review proposal</UtilityBtn>
            <UtilityBtn>Ask Claude to revise</UtilityBtn>
            <ClaudeBtn onClick={() => h.onConfirmQuestion(p)}>Ask Claude to add open question</ClaudeBtn>
          </div>
        ) : (
          <ConfirmationState status={status} kind="question" id={p.questionId} targetFile={p.targetFile} onRetry={() => h.onRetryProposal(p.questionId)} />
        )}
      </div>
    </div>
  );
}

export { Label };

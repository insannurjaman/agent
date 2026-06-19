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
  return (
    <button type="button" onClick={() => onNav(id)} className="font-mono text-text-secondary hover:text-text hover:underline">
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
      className="rounded-sm border border-brand-border bg-brand-muted px-2.5 py-1 text-[12px] text-brand transition-colors hover:bg-brand-surface"
    >
      {children}
    </button>
  );
}

// ── Conversation events (user / claude / analysis / error) ──
export function ChatEventView({ event, h }: { event: ChatEvent; h: ChatEventHandlers }) {
  switch (event.kind) {
    case 'user':
      return (
        <div className="flex flex-col items-end">
          <div className="max-w-[88%] rounded-sm bg-surface-2 px-3 py-2 text-[14px] leading-relaxed text-text">
            {event.text}
          </div>
        </div>
      );

    case 'claude':
      return (
        <div>
          <p className="text-[14px] leading-relaxed text-text-secondary">{event.text}</p>
        </div>
      );

    case 'analysis':
      return (
        <div>
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

// ── Activity group: always collapsed by default ──
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
  const [open, setOpen] = useState(false);
  const chips = events.map(summarize).slice(0, 3).join(' · ');
  return (
    <div className="rounded-sm border border-border-subtle bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${events.length} actions completed. ${open ? 'Hide' : 'View'} activity.`}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <ActivityIcon className="size-3.5 shrink-0 text-text-muted" />
        <span className="text-[12px] text-text-secondary">
          {events.length} action{events.length !== 1 ? 's' : ''} completed
        </span>
        <span className="truncate font-mono text-[11px] text-text-muted">· {chips}</span>
        <span className="ml-auto shrink-0 font-mono text-[11px] text-text-muted">{open ? 'Hide' : 'View'}</span>
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
  else if (ev.kind === 'exec') line = <>{ev.command} · {ev.duration} · exit {ev.exitCode}</>;
  else if (ev.kind === 'artifact') line = <>Artifact · {ev.path.split('/').pop()}</>;
  else if (ev.kind === 'report') line = <>REPORT.md · {ev.sections.length} sections</>;
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
            <UtilityBtn onClick={() => ev.resultIds && h.onAttachResults(ev.resultIds)}>Attach results</UtilityBtn>
            <UtilityBtn onClick={h.onOpenFacetedSearch}>Search</UtilityBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Proposal group: always compact summary ──
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
  return <ProposalSummary findings={findings} questions={questions} time={time} h={h} />;
}

function statusOf(ids: string[], map?: Record<string, ProposalStatus>): ProposalStatus {
  const states = ids.map((id) => map?.[id] ?? 'idle');
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
  const status = statusOf(ids, h?.proposalStatus);
  return (
    <div className="rounded-sm border border-border-subtle bg-surface">
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        <Sparkles className="size-3.5 text-text-muted" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">Proposed updates</span>
        <span className="ml-auto font-mono text-[10px] text-text-muted">{time}</span>
      </div>
      <div className="px-3 pb-2.5">
        <div className="space-y-1">
          {findings.map((f) => (
            <div key={f.findingId} className="flex items-center gap-2 text-[13px]">
              <span className="font-mono text-text-secondary">{f.findingId}</span>
              <span className="text-text-muted">Finding · {f.confidence}</span>
            </div>
          ))}
          {questions.map((q) => (
            <div key={q.questionId} className="flex items-center gap-2 text-[13px]">
              <span className="font-mono text-text-secondary">{q.questionId}</span>
              <span className="text-text-muted">Question · {q.priority}</span>
            </div>
          ))}
        </div>

        {status === 'idle' && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            <UtilityBtn onClick={() => h.onReview(findings, questions)}>Review</UtilityBtn>
            <UtilityBtn>Revise</UtilityBtn>
          </div>
        )}
        {status === 'pending' && (
          <div className="mt-2.5 flex items-center gap-2 text-[12px] text-text-muted">
            <Loader2 className="size-3.5 animate-spin" /> Registering…
          </div>
        )}
        {status === 'completed' && (
          <div className="mt-2.5 flex items-center gap-2 text-[12px] text-green">
            <CheckCircle2 className="size-3.5" /> Registered
          </div>
        )}
        {status === 'failed' && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[12px] text-red">
              <AlertTriangle className="size-3.5" /> Failed
            </span>
            <UtilityBtn onClick={() => ids.forEach((id) => h.onRetryProposal(id))}>Retry</UtilityBtn>
          </div>
        )}
      </div>
    </div>
  );
}

export { IdLink };

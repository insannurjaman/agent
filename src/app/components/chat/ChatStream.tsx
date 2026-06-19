import { useState, useRef, useEffect } from 'react';
import { Send, Square, Paperclip, X, Loader2, Link2, MessageSquareDashed, ChevronDown, MoreHorizontal } from 'lucide-react';
import {
  composerModes,
  composerModeDescriptions,
  type ChatSession,
  type ChatEvent,
  type ComposerMode,
  type FindingProposal,
  type QuestionProposal,
} from '../../data/chat';
import { ChatEventView, ActivityGroup, ProposalGroup, type ChatEventHandlers } from './ChatEvents';
import { cn } from '../ui/utils';

const PRIMARY_PROMPTS = ['Explain this finding', 'Trace evidence', 'Create follow-up experiment'];
const MORE_PROMPTS = [
  'Generate report summary',
  'Check superseded lineage',
  'Add open question through Claude',
  'Resolve open question through Claude',
  'Update knowledge through Claude',
];

type OpEvent = Extract<ChatEvent, { kind: 'system' | 'tool' | 'exec' | 'artifact' | 'report' }>;
type Segment =
  | { type: 'event'; event: ChatEvent }
  | { type: 'activity'; events: OpEvent[] }
  | { type: 'proposals'; findings: FindingProposal[]; questions: QuestionProposal[]; time: string };

const OP_KINDS = new Set(['system', 'tool', 'exec', 'artifact', 'report']);

function buildSegments(transcript: ChatEvent[]): Segment[] {
  const segs: Segment[] = [];
  let act: OpEvent[] = [];
  let props: { findings: FindingProposal[]; questions: QuestionProposal[]; time: string } | null = null;
  const flushAct = () => {
    if (act.length) segs.push({ type: 'activity', events: act });
    act = [];
  };
  const flushProps = () => {
    if (props) segs.push({ type: 'proposals', ...props });
    props = null;
  };
  for (const ev of transcript) {
    if (OP_KINDS.has(ev.kind)) {
      flushProps();
      act.push(ev as OpEvent);
    } else if (ev.kind === 'finding-proposal' || ev.kind === 'question-proposal') {
      flushAct();
      if (!props) props = { findings: [], questions: [], time: ev.time };
      if (ev.kind === 'finding-proposal') props.findings.push(ev.proposal);
      else props.questions.push(ev.proposal);
    } else {
      flushAct();
      flushProps();
      segs.push({ type: 'event', event: ev });
    }
  }
  flushAct();
  flushProps();
  return segs;
}

export function ChatStream({
  session,
  transcript,
  attachedContext,
  onRemoveContext,
  onAttachContext,
  h,
}: {
  session: ChatSession;
  transcript: ChatEvent[];
  attachedContext: string[];
  onRemoveContext: (id: string) => void;
  onAttachContext: () => void;
  h: ChatEventHandlers;
}) {
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<ComposerMode>('Investigate');
  const [streaming, setStreaming] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [streaming, transcript]);

  const send = () => {
    if (!draft.trim()) return;
    setStreaming(true);
    setDraft('');
    setTimeout(() => setStreaming(false), 2600);
  };

  const primary = attachedContext.find((c) => c.startsWith('F-')) ?? attachedContext.find((c) => c.startsWith('Q-'));
  const placeholder = primary ? `Ask Claude about ${primary}…` : 'Ask Claude about the selected context…';
  const segments = buildSegments(transcript);

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-background">
      {/* Compact active chat header */}
      <div className="border-b border-border-subtle bg-surface px-5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Active Chat</span>
          <span className="font-mono text-[12px] text-brand">{session.id}</span>
          <span className="text-[13px] text-text">· {session.title}</span>
          <span
            className={cn(
              'ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] uppercase',
              session.status === 'running' ? 'text-brand' : session.status === 'failed' ? 'text-red' : 'text-green',
            )}
          >
            {session.status === 'running' && <Loader2 className="size-3 animate-spin" />}
            {session.status}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[11px] text-text-muted">
          <span>
            Experiment: <span className="text-info">{session.slug}</span>
          </span>
          <span>· working dir fixed</span>
          <span className="inline-flex items-center gap-1 text-green">
            <Link2 className="size-3" /> Session linked
          </span>
        </div>
      </div>

      {/* Context strip */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border-subtle bg-surface px-5 py-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Context</span>
        {attachedContext.length === 0 && <span className="font-mono text-[11px] text-text-muted">none</span>}
        {attachedContext.map((c) => (
          <ContextChip key={c} id={c} onRemove={() => onRemoveContext(c)} onClick={() => h.onNav(c)} />
        ))}
      </div>

      {/* Trace mode notice */}
      {h.density === 'trace' && transcript.length > 0 && (
        <div className="border-b border-border-subtle bg-surface px-5 py-1.5">
          <span className="font-mono text-[11px] text-text-muted">
            Trace Mode shows Claude tool events, commands, and generated files.
          </span>
        </div>
      )}

      {/* Transcript */}
      <div ref={bodyRef} className="min-h-0 flex-1 overflow-auto">
        {transcript.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-sm border border-border-strong bg-surface-2">
              <MessageSquareDashed className="size-5 text-text-muted" />
            </div>
            <div className="text-[14px] text-text-secondary">No conversation yet</div>
            <div className="mt-1 max-w-sm text-[13px] text-text-muted">
              Attach a finding, question, report, or graph node to ask Claude with context.
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-5">
            {segments.map((seg, i) => {
              if (seg.type === 'event') return <ChatEventView key={i} event={seg.event} h={h} />;
              if (seg.type === 'activity') return <ActivityGroup key={i} events={seg.events} h={h} />;
              return <ProposalGroup key={i} findings={seg.findings} questions={seg.questions} time={seg.time} h={h} />;
            })}
            {streaming && (
              <div className="flex items-center gap-2 text-[13px] text-brand">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Claude is working…</span>
              </div>
            )}
          </div>
        )}
      </div>

      <Composer
        draft={draft}
        setDraft={setDraft}
        mode={mode}
        setMode={setMode}
        streaming={streaming}
        onSend={send}
        onStop={() => setStreaming(false)}
        onAttachContext={onAttachContext}
        attachedCount={attachedContext.length}
        placeholder={placeholder}
      />
    </div>
  );
}

function ContextChip({ id, onRemove, onClick }: { id: string; onRemove: () => void; onClick: () => void }) {
  const color = id.startsWith('F-')
    ? 'text-brand border-brand-border'
    : id.startsWith('Q-')
      ? 'text-amber border-amber/30'
      : 'text-brand border-brand-border';
  return (
    <span className={cn('flex items-center gap-1 rounded-sm border bg-surface-2 px-1.5 py-0.5', color)}>
      <button type="button" onClick={onClick} className="font-mono text-[11px] hover:underline">
        {id.replace('experiments/', 'experiment:')}
      </button>
      <button type="button" onClick={onRemove} className="text-text-muted hover:text-text">
        <X className="size-3" />
      </button>
    </span>
  );
}

function Composer({
  draft,
  setDraft,
  mode,
  setMode,
  streaming,
  onSend,
  onStop,
  onAttachContext,
  attachedCount,
  placeholder,
}: {
  draft: string;
  setDraft: (v: string) => void;
  mode: ComposerMode;
  setMode: (m: ComposerMode) => void;
  streaming: boolean;
  onSend: () => void;
  onStop: () => void;
  onAttachContext: () => void;
  attachedCount: number;
  placeholder: string;
}) {
  const [modeOpen, setModeOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="border-t border-border-subtle bg-surface px-5 py-3">
      {/* Suggested prompts: 3 primary + More */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {PRIMARY_PROMPTS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setDraft(a)}
            className="rounded-sm border border-border-subtle bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-text-secondary transition-colors hover:border-brand-border hover:text-text"
          >
            {a}
          </button>
        ))}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className="flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-text-muted hover:text-text"
          >
            <MoreHorizontal className="size-3.5" /> More actions
          </button>
          {moreOpen && (
            <div className="absolute bottom-full z-20 mb-1 w-60 rounded-sm border border-border-strong bg-popover py-1 shadow-xl">
              {MORE_PROMPTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setDraft(a);
                    setMoreOpen(false);
                  }}
                  className="block w-full px-2.5 py-1.5 text-left font-mono text-[11px] text-text-secondary hover:bg-surface-2 hover:text-text"
                >
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-sm border border-border-subtle bg-surface-2 focus-within:border-brand-border">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSend();
          }}
          rows={2}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent px-3 py-2.5 text-[14px] text-text outline-none placeholder:text-text-muted"
        />

        <div className="border-t border-border-subtle px-3 py-1 font-mono text-[11px] text-text-muted">
          {composerModeDescriptions[mode]}
        </div>

        <div className="flex items-center gap-2 border-t border-border-subtle px-2 py-1.5">
          <button
            type="button"
            onClick={onAttachContext}
            className="flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface px-2 py-1 font-mono text-[11px] text-text-secondary hover:text-text"
          >
            <Paperclip className="size-3.5" /> Attach context
            {attachedCount > 0 && <span className="text-text-muted">· {attachedCount}</span>}
          </button>

          {/* Mode dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setModeOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface px-2 py-1 font-mono text-[11px] text-text-secondary hover:text-text"
            >
              Mode: <span className="text-text">{mode}</span>
              <ChevronDown className="size-3" />
            </button>
            {modeOpen && (
              <div className="absolute bottom-full z-20 mb-1 w-44 rounded-sm border border-border-strong bg-popover py-1 shadow-xl">
                {composerModes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setModeOpen(false);
                    }}
                    title={composerModeDescriptions[m]}
                    className={cn(
                      'block w-full px-2.5 py-1.5 text-left font-mono text-[11px] hover:bg-surface-2',
                      m === mode ? 'text-text' : 'text-text-secondary',
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ml-auto">
            {streaming ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center gap-1.5 rounded-sm border border-red/40 bg-red/10 px-3 py-1.5 text-[12px] text-red hover:bg-red/15"
              >
                <Square className="size-3.5" /> Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!draft.trim()}
                className={cn(
                  'flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[12px] transition-colors',
                  draft.trim()
                    ? 'border border-brand-border bg-brand text-primary-foreground hover:bg-brand-hover'
                    : 'cursor-not-allowed border border-border-subtle bg-surface text-text-muted',
                )}
              >
                <Send className="size-3.5" /> Send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

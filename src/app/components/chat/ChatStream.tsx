import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Send,
  Square,
  Paperclip,
  X,
  Loader2,
  Menu,
  MoreHorizontal,
  ChevronDown,
  MessageSquareDashed,
} from 'lucide-react';
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
  onOpenSidebar,
}: {
  session: ChatSession;
  transcript: ChatEvent[];
  attachedContext: string[];
  onRemoveContext: (id: string) => void;
  onAttachContext: () => void;
  h: ChatEventHandlers;
  onOpenSidebar?: () => void;
}) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<ComposerMode>('Investigate');
  const [streaming, setStreaming] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // ⌘K → search, ⌘N → new chat (for when TopBar is hidden on mobile)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/search');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        onOpenSidebar?.();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navigate, onOpenSidebar]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [streaming, transcript]);

  const send = () => {
    if (!draft.trim()) return;
    setStreaming(true);
    setDraft('');
    setTimeout(() => setStreaming(false), 2600);
  };

  const segments = buildSegments(transcript);

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-background">
      {/* Compact header */}
      <div className="flex items-center gap-3 border-b border-border-subtle bg-surface px-4 py-2.5 md:px-5">
        {/* Mobile hamburger */}
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="flex size-11 items-center justify-center rounded-sm text-text-muted hover:text-text md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-medium text-text">{session.title}</div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-text-muted">
            <span>{session.id}</span>
            <span
              className={cn(
                'inline-flex items-center gap-1',
                session.status === 'running' ? 'text-brand' : session.status === 'failed' ? 'text-red' : 'text-green',
              )}
            >
              {session.status === 'running' && <Loader2 className="size-3 animate-spin" />}
              {session.status}
            </span>
          </div>
        </div>
        {/* Overflow menu */}
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-sm text-text-muted hover:text-text"
          aria-label="Session options"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      {/* Context summary — compact */}
      {attachedContext.length > 0 && (
        <div className="flex items-center gap-2 border-b border-border-subtle bg-surface px-4 py-1.5 md:px-5">
          <Paperclip className="size-3 text-text-muted" />
          <span className="font-mono text-[11px] text-text-muted">
            {attachedContext.length} reference{attachedContext.length !== 1 ? 's' : ''} attached
          </span>
          <div className="ml-auto flex flex-wrap gap-1">
            {attachedContext.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onRemoveContext(c)}
                className="group flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-text-secondary hover:border-border-strong hover:text-text"
              >
                {c}
                <X className="size-3 text-text-muted opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
      <div ref={bodyRef} className="min-h-0 flex-1 overflow-auto">
        {transcript.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-sm border border-border-strong bg-surface-2">
              <MessageSquareDashed className="size-5 text-text-muted" />
            </div>
            <div className="text-[15px] font-medium text-text">What would you like to investigate?</div>
            <div className="mt-1 max-w-sm text-[13px] text-text-muted">
              Ask Claude anything about your findings, experiments, or knowledge base.
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {PRIMARY_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDraft(p)}
                  className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-1.5 text-[12px] text-text-secondary transition-colors hover:border-brand-border hover:text-text"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-5">
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

      {/* Composer */}
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
      />
    </div>
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
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [modeOpen, setModeOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const selectPrompt = (text: string) => {
    setDraft(text);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  return (
    <div className="border-t border-border-subtle bg-surface px-4 py-3 md:px-5">
      {/* Mode summary + attach */}
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={onAttachContext}
          className="flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1 font-mono text-[11px] text-text-secondary hover:text-text"
        >
          <Paperclip className="size-3.5" /> Context{attachedCount > 0 ? ` · ${attachedCount}` : ''}
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setModeOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1 font-mono text-[11px] text-text-secondary hover:text-text"
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
      </div>

      {/* Suggested prompts */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {PRIMARY_PROMPTS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => selectPrompt(a)}
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
            <MoreHorizontal className="size-3.5" /> More
          </button>
          {moreOpen && (
            <div className="absolute bottom-full z-20 mb-1 w-60 rounded-sm border border-border-strong bg-popover py-1 shadow-xl">
              {MORE_PROMPTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    selectPrompt(a);
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

      {/* Input */}
      <div className="rounded-sm border border-border-subtle bg-surface-2 focus-within:border-brand-border">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSend();
          }}
          rows={2}
          placeholder="Ask Claude about anything…"
          className="w-full resize-none bg-transparent px-3 py-2.5 text-[14px] text-text outline-none placeholder:text-text-muted"
        />
        <div className="flex items-center gap-2 border-t border-border-subtle px-2 py-1.5">
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

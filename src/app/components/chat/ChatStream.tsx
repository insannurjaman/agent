import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Send,
  Square,
  Paperclip,
  X,
  Loader2,
  MoreHorizontal,
  ChevronDown,
  MessageSquareDashed,
  ImageIcon,
  ExternalLink,
  Eye,
  Layers,
} from 'lucide-react';
import {
  composerModes,
  composerModeDescriptions,
  type ChatSession,
  type ChatEvent,
  type ComposerMode,
  type FindingProposal,
  type QuestionProposal,
  type Artifact,
} from '../../data/chat';
import { ChatEventView, ActivityGroup, ProposalGroup, type ChatEventHandlers } from './ChatEvents';
import { cn } from '../ui/utils';
import { useNavContext } from '../shell/NavContext';
import { EmptyState } from '../common/EmptyState';

const PRIMARY_PROMPTS = ['Explain this finding', 'Create follow-up experiment'];
const MORE_PROMPTS = [
  'Trace evidence',
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
  | { type: 'proposals'; findings: FindingProposal[]; questions: QuestionProposal[]; time: string }
  | { type: 'artifact'; event: Extract<ChatEvent, { kind: 'artifact' }> };

const OP_KINDS = new Set(['system', 'tool', 'exec', 'report']);

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
    if (ev.kind === 'artifact') {
      flushAct();
      flushProps();
      segs.push({ type: 'artifact', event: ev });
    } else if (OP_KINDS.has(ev.kind)) {
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
  onOpenPanel,
  onToggleArtifact,
  hasArtifact,
}: {
  session: ChatSession;
  transcript: ChatEvent[];
  attachedContext: string[];
  onRemoveContext: (id: string) => void;
  onAttachContext: () => void;
  h: ChatEventHandlers;
  onOpenPanel?: () => void;
  onToggleArtifact?: () => void;
  hasArtifact?: boolean;
}) {
  const navigate = useNavigate();
  const { openNav } = useNavContext();
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<ComposerMode>('Investigate');
  const [streaming, setStreaming] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const jumpBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        openNav('chats');
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openNav]);

  // Auto-scroll: only if user is near bottom (within 100px)
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom < 100) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      setShowJumpToLatest(false);
    } else {
      setShowJumpToLatest(true);
    }
  }, [streaming, transcript]);

  // Track scroll position to show/hide jump-to-latest
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    function onScroll() {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distFromBottom < 100) {
        setShowJumpToLatest(false);
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToBottom = () => {
    const el = bodyRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setShowJumpToLatest(false);
    jumpBtnRef.current?.focus();
  };

  const send = () => {
    if (!draft.trim() || streaming) return;
    setStreaming(true);
    setDraft('');
    setTimeout(() => setStreaming(false), 2600);
  };

  const segments = buildSegments(transcript);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
      {/* Chat header — compact, desktop only */}
      <div className="hidden shrink-0 items-center gap-2 border-b border-border-subtle bg-surface px-4 py-2 md:flex">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-text">{session.title}</div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-text-muted">
            <span className="truncate">{session.slug}</span>
            <span
              className={cn(
                'inline shrink-0 items-center gap-1',
                session.status === 'running' ? 'text-brand' : session.status === 'failed' ? 'text-red' : 'text-green',
              )}
            >
              {session.status === 'running' && <Loader2 className="inline size-2.5 animate-spin" />}
              {' '}{session.status}
            </span>
          </div>
        </div>
        {hasArtifact && onToggleArtifact && (
          <button
            type="button"
            onClick={onToggleArtifact}
            className="flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1 text-[11px] text-text-secondary hover:text-text"
            aria-label="Toggle artifact viewer"
          >
            <Layers className="size-3" />
            Artifact
          </button>
        )}
      </div>

      {/* Mobile header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle bg-surface px-3 py-2 md:hidden">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-text">{session.title}</div>
        </div>
        {onOpenPanel && (
          <button
            type="button"
            onClick={onOpenPanel}
            className="flex size-9 items-center justify-center rounded-sm border border-border-subtle bg-surface-2 text-text-muted hover:text-text"
            aria-label="Open session explorer"
          >
            <MoreHorizontal className="size-4" />
          </button>
        )}
        {hasArtifact && onToggleArtifact && (
          <button
            type="button"
            onClick={onToggleArtifact}
            className="flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1 text-[11px] text-text-secondary"
            aria-label="Open artifact"
          >
            <Layers className="size-3" />
          </button>
        )}
      </div>

      {/* Context summary — compact */}
      {attachedContext.length > 0 && (
        <div className="flex items-center gap-2 border-b border-border-subtle bg-surface px-4 py-1.5">
          <Paperclip className="size-3 text-text-muted" />
          <span className="font-mono text-[11px] text-text-muted">
            {attachedContext.length} reference{attachedContext.length !== 1 ? 's' : ''} attached
          </span>
          <div className="ml-auto hidden flex-wrap gap-1 md:flex">
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
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div ref={bodyRef} role="log" aria-label="Chat conversation" aria-live="polite" className="h-full overflow-auto">
          {transcript.length === 0 ? (
            <EmptyState
              icon={MessageSquareDashed}
              title="What would you like to investigate?"
              hint="Ask Claude anything about your findings, experiments, or knowledge base."
            >
              <div className="flex flex-wrap justify-center gap-2">
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
            </EmptyState>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-5">
              {segments.map((seg, i) => {
                if (seg.type === 'artifact') return <ArtifactItem key={i} event={seg.event} h={h} />;
                if (seg.type === 'event') return <ChatEventView key={i} event={seg.event} h={h} />;
                if (seg.type === 'activity') return <ActivityGroup key={i} events={seg.events} h={h} />;
                return <ProposalGroup key={i} findings={seg.findings} questions={seg.questions} time={seg.time} h={h} />;
              })}
              {streaming && (
                <div role="status" aria-live="polite" className="flex items-center gap-2 text-[13px] text-brand">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Claude is working…</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Jump to latest */}
        {showJumpToLatest && (
          <button
            ref={jumpBtnRef}
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-sm border border-border-strong bg-surface px-3 py-1.5 text-[12px] text-text-secondary shadow-md transition-colors hover:bg-surface-2 hover:text-text focus-visible:ring-2 focus-visible:ring-brand-ring"
          >
            Jump to latest
          </button>
        )}
      </div>

      {/* Composer — sticky bottom */}
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

function ArtifactItem({
  event,
  h,
}: {
  event: Extract<ChatEvent, { kind: 'artifact' }>;
  h: ChatEventHandlers;
}) {
  const name = event.path.split('/').pop() || event.path;
  return (
    <div className="flex items-start gap-3 rounded-sm border border-l-2 border-l-brand border-border-subtle bg-surface p-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-brand-muted">
        <ImageIcon className="size-4 text-brand" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] uppercase tracking-wider text-brand">Artifact generated</div>
        <div className="mt-0.5 truncate text-[13px] font-medium text-text">{name}</div>
        <div className="mt-0.5 font-mono text-[10px] text-text-muted">generated {event.time}</div>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          onClick={() => h.onOpenArtifact(event.artifactId)}
          className="flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1 text-[11px] text-text-secondary hover:text-text"
        >
          <Eye className="size-3" />
          Preview
        </button>
        <button
          type="button"
          onClick={() => h.onOpenArtifact(event.artifactId)}
          className="flex items-center gap-1 rounded-sm bg-brand px-2 py-1 text-[11px] text-primary-foreground hover:bg-brand-hover"
        >
          <ExternalLink className="size-3" />
          Open
        </button>
      </div>
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
  const [moreOpen, setMoreOpen] = useState(false);

  const selectPrompt = (text: string) => {
    setDraft(text);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  // Escape closes More dropdown
  useEffect(() => {
    if (!moreOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMoreOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [moreOpen]);

  return (
    <div className="shrink-0 border-t border-border-subtle bg-surface px-4 py-3 md:px-5">
      {/* Suggested prompts — 2 primary + More */}
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
            aria-expanded={moreOpen}
            aria-haspopup="true"
            className="flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-text-muted hover:text-text"
          >
            <MoreHorizontal className="size-3.5" /> More
          </button>
          {moreOpen && (
            <div role="menu" className="absolute bottom-full z-20 mb-1 w-60 rounded-sm border border-border-strong bg-popover py-1 shadow-xl">
              {MORE_PROMPTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  role="menuitem"
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
        <label htmlFor="chat-composer" className="sr-only">Message Claude</label>
        <textarea
          ref={textareaRef}
          id="chat-composer"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          rows={2}
          placeholder="Message Claude…"
          aria-describedby="composer-helper"
          className="w-full resize-none bg-transparent px-3 py-2.5 text-[14px] text-text outline-none placeholder:text-text-muted"
        />
        <div className="flex items-center gap-2 border-t border-border-subtle px-2 py-1.5">
          <button
            type="button"
            onClick={onAttachContext}
            className="flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1 font-mono text-[11px] text-text-secondary hover:text-text"
          >
            <Paperclip className="size-3.5" /> Context{attachedCount > 0 ? ` · ${attachedCount}` : ''}
          </button>
          <div id="composer-helper" className="hidden text-[10px] text-text-muted md:inline">
            Enter to send · Shift+Enter for new line
          </div>
          <div className="ml-auto">
            {streaming ? (
              <button
                type="button"
                onClick={onStop}
                className="flex min-h-[36px] items-center gap-1.5 rounded-sm border border-red/40 bg-red/10 px-3 py-1.5 text-[12px] text-red hover:bg-red/15"
              >
                <Square className="size-3.5" /> Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!draft.trim()}
                className={cn(
                  'flex min-h-[36px] items-center gap-1.5 rounded-sm px-3 py-1.5 text-[12px] transition-colors',
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

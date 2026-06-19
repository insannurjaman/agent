import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Terminal, RefreshCw, BookOpen, Save, AlertTriangle, WifiOff, Loader2, Settings2 } from 'lucide-react';
import {
  sessions as baseSessions,
  getSessionBundle,
  type ChatSession,
  type SessionBundle,
  type FileNode,
  type FindingProposal,
  type QuestionProposal,
} from '../../data/chat';
import { ScreenHeader } from '../common/primitives';
import { SessionExplorerPane } from './SessionExplorerPane';
import { ChatStream } from './ChatStream';
import { ArtifactViewer, type RelatedItem } from './ArtifactViewer';
import { NewChatModal } from './NewChatModal';
import { ProposalReviewDrawer, type ReviewSet } from './ProposalReviewDrawer';
import type { ChatEventHandlers, ProposalStatus, Density } from './ChatEvents';
import { useBreakpoint } from '../responsive/useBreakpoint';
import { Drawer } from '../responsive/Drawer';
import { SegmentedControl } from '../responsive/SegmentedControl';
import { cn } from '../ui/utils';

type RelayState = 'connected' | 'not-configured' | 'connecting' | 'disconnected';
type ViewState = 'normal' | 'backend-offline' | 'session-mismatch';

export function ChatWorkspaceScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [relay, setRelay] = useState<RelayState>('connected');
  const [view, setView] = useState<ViewState>('normal');
  const [density, setDensity] = useState<Density>('focus');
  const [devOpen, setDevOpen] = useState(false);

  const [extraSessions, setExtraSessions] = useState<ChatSession[]>([]);
  const [extraBundles, setExtraBundles] = useState<Record<string, SessionBundle>>({});
  const allSessions = useMemo(() => [...extraSessions, ...baseSessions], [extraSessions]);

  const [activeSessionId, setActiveSessionId] = useState(baseSessions[0].id);
  const bundle = extraBundles[activeSessionId] ?? getSessionBundle(activeSessionId)!;
  const activeSession = allSessions.find((s) => s.id === activeSessionId)!;

  const [newChatOpen, setNewChatOpen] = useState(false);

  const [contextMap, setContextMap] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const s of baseSessions) map[s.id] = getSessionBundle(s.id)?.context ?? [];
    const ctx = (params.get('ctx') ?? '').split(',').map((x) => x.trim()).filter(Boolean);
    if (ctx.length) map[baseSessions[0].id] = [...new Set([...ctx, ...map[baseSessions[0].id]])];
    return map;
  });
  const attachedContext = contextMap[activeSessionId] ?? bundle.context;

  const [autoFollow, setAutoFollow] = useState(true);
  const [pinnedArtifactId, setPinnedArtifactId] = useState<string | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  const latestId = bundle.latestArtifactId;
  const shownArtifactId = autoFollow ? latestId : pinnedArtifactId ?? latestId;
  const activeArtifact = shownArtifactId ? bundle.artifacts[shownArtifactId] ?? null : null;
  const newArtifact =
    !autoFollow && !noticeDismissed && latestId && pinnedArtifactId && pinnedArtifactId !== latestId
      ? { id: latestId, name: bundle.artifacts[latestId]?.name ?? latestId }
      : null;

  const [proposalStatus, setProposalStatus] = useState<Record<string, ProposalStatus>>({});
  const [reviewSet, setReviewSet] = useState<ReviewSet | null>(null);

  const bp = useBreakpoint();
  const [mobileTab, setMobileTab] = useState<'chat' | 'context' | 'artifact'>('chat');
  const [sessionsOpen, setSessionsOpen] = useState(false);

  const runConfirm = (id: string) => {
    setProposalStatus((p) => ({ ...p, [id]: 'pending' }));
    setTimeout(() => setProposalStatus((p) => ({ ...p, [id]: 'completed' })), 2200);
  };

  const selectSession = (id: string) => {
    setActiveSessionId(id);
    setAutoFollow(true);
    setPinnedArtifactId(null);
    setNoticeDismissed(false);
    setReviewSet(null);
  };

  const openArtifact = (artifactId: string) => {
    if (!bundle.artifacts[artifactId]) return;
    setAutoFollow(false);
    setPinnedArtifactId(artifactId);
    setNoticeDismissed(false);
    setReviewSet(null);
  };

  const onNav = (id: string) => {
    if (bundle.artifacts[id]) {
      openArtifact(id);
      return;
    }
    if (id.startsWith('experiments/')) navigate(`/experiments/${id}`);
    else if (id.startsWith('Q-')) navigate(`/findings?tab=questions&focus=${id}`);
    else if (id.startsWith('F-')) navigate(`/findings?focus=${id}`);
  };

  const handlers: ChatEventHandlers = {
    onNav,
    onOpenArtifact: openArtifact,
    onAttachResults: (ids) =>
      setContextMap((m) => ({ ...m, [activeSessionId]: [...new Set([...(m[activeSessionId] ?? bundle.context), ...ids])] })),
    onOpenFacetedSearch: () => navigate('/search'),
    onReview: (findings, questions) => setReviewSet({ findings, questions }),
    onConfirmFinding: (p: FindingProposal) => runConfirm(p.findingId),
    onConfirmQuestion: (p: QuestionProposal) => runConfirm(p.questionId),
    onRetryProposal: (id) => runConfirm(id),
    proposalStatus,
    onOpenLog: () => openArtifact('run.log'),
    density,
  };

  const related: RelatedItem[] = useMemo(() => {
    const out: RelatedItem[] = [{ label: 'Source experiment', id: activeSession.slug, tone: 'text-info' }];
    for (const ev of bundle.transcript) {
      if (ev.kind === 'finding-proposal') out.push({ label: 'Related finding proposal', id: ev.proposal.findingId, tone: 'text-brand' });
      if (ev.kind === 'question-proposal') out.push({ label: 'Related open question', id: ev.proposal.questionId, tone: 'text-amber' });
    }
    if (bundle.artifacts['REPORT.md']) out.push({ label: 'Related report', id: 'REPORT.md', tone: 'text-text-secondary' });
    return out;
  }, [bundle, activeSession]);

  const startNewChat = (slug: string, prompt: string, context: string[]) => {
    const id = `chat_2026-06-17_${String(baseSessions.length + extraSessions.length + 1).padStart(3, '0')}`;
    const title = prompt.trim() ? prompt.trim().slice(0, 48) : 'New analysis session';
    const session: ChatSession = { id, title, slug, status: 'running', lastUpdated: '2026-06-17 11:45' };
    const nb: SessionBundle = {
      context,
      latestArtifactId: null,
      transcript: [
        { kind: 'system', id: `${id}-s1`, time: '11:45', label: 'Chat session created', detail: id },
        { kind: 'system', id: `${id}-s2`, time: '11:45', label: 'Experiment directory generated', detail: slug },
        { kind: 'system', id: `${id}-s3`, time: '11:45', label: 'Working directory fixed', detail: `${slug}/` },
        { kind: 'system', id: `${id}-s4`, time: '11:45', label: 'Claude relay connected' },
      ],
      tree: [
        { name: 'README.md', path: 'README.md', kind: 'file', type: 'markdown', generated: true, generatedAt: '2026-06-17 11:45' },
        { name: 'REPORT.md', path: 'REPORT.md', kind: 'file', type: 'markdown' },
        { name: 'outputs', path: 'outputs', kind: 'dir', children: [{ name: 'figures', path: 'outputs/figures', kind: 'dir', children: [] }] },
      ],
      timeline: [
        { label: 'Chat session created', time: '11:45' },
        { label: 'Experiment directory generated', time: '11:45' },
        { label: 'Working directory fixed', time: '11:45' },
        { label: 'Claude relay connected', time: '11:45' },
      ],
      artifacts: {},
    };
    setExtraSessions((s) => [session, ...s]);
    setExtraBundles((b) => ({ ...b, [id]: nb }));
    setContextMap((m) => ({ ...m, [id]: context }));
    setNewChatOpen(false);
    setRelay('connected');
    selectSession(id);
  };

  const gated = relay === 'not-configured' || relay === 'disconnected' || relay === 'connecting';

  return (
    <div className="relative flex h-full flex-col">
      <ScreenHeader
        title="Chat Workspace"
        subtitle="Run Claude-guided analysis inside a fixed experiment directory."
        right={
          <div className="relative flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-2 p-0.5">
              {(['focus', 'trace'] as Density[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDensity(d)}
                  title={d === 'focus' ? 'Conversation-first' : 'Full execution trace'}
                  className={cn(
                    'rounded-sm px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition-colors',
                    density === d ? 'bg-brand-muted text-brand' : 'text-text-muted hover:text-text-secondary',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setDevOpen((v) => !v)}
              aria-label="Developer controls"
              className={cn(
                'flex size-7 items-center justify-center rounded-sm border border-border-subtle transition-colors',
                devOpen ? 'bg-surface-2 text-text' : 'text-text-muted hover:text-text-secondary',
              )}
            >
              <Settings2 className="size-4" />
            </button>
            {devOpen && <DevControls relay={relay} setRelay={setRelay} view={view} setView={setView} />}
          </div>
        }
      />

      {gated ? (
        <RelayGate relay={relay} onRetry={() => setRelay('connected')} navigate={navigate} />
      ) : view === 'session-mismatch' ? (
        <MismatchPanel onReload={() => setView('normal')} />
      ) : (
        (() => {
          const sessionsPane = (
            <SessionExplorerPane
              sessionList={allSessions}
              activeSessionId={activeSessionId}
              onSelectSession={(id) => {
                selectSession(id);
                setSessionsOpen(false);
                setMobileTab('chat');
              }}
              onNewChat={() => setNewChatOpen(true)}
              relay={relay}
              currentSlug={activeSession.slug}
              tree={bundle.tree}
              activeFilePath={!autoFollow ? pinnedArtifactId : null}
              onSelectFile={(n: FileNode) => n.kind === 'file' && n.name && openArtifact(n.name)}
            />
          );

          const centerPane =
            view === 'backend-offline' ? (
              <BackendDisabledCenter />
            ) : (
              <ChatStream
                session={activeSession}
                transcript={bundle.transcript}
                attachedContext={attachedContext}
                onRemoveContext={(id) =>
                  setContextMap((m) => ({ ...m, [activeSessionId]: (m[activeSessionId] ?? bundle.context).filter((x) => x !== id) }))
                }
                onAttachContext={() =>
                  setContextMap((m) => ({ ...m, [activeSessionId]: [...new Set([...(m[activeSessionId] ?? bundle.context), 'REPORT.md'])] }))
                }
                h={handlers}
              />
            );

          const rightPane = (
            <ArtifactViewer
              artifact={activeArtifact}
              autoFollow={autoFollow}
              onPause={() => {
                setAutoFollow(false);
                setPinnedArtifactId(latestId);
              }}
              onResume={() => {
                setAutoFollow(true);
                setNoticeDismissed(false);
              }}
              onOpenLatest={() => {
                setAutoFollow(true);
                setNoticeDismissed(false);
              }}
              newArtifact={newArtifact}
              onKeepPinned={() => setNoticeDismissed(true)}
              timeline={bundle.timeline}
              onTimelineOpen={(item) => item.artifactId && openArtifact(item.artifactId)}
              related={related}
              backendOffline={view === 'backend-offline'}
              onNav={onNav}
            />
          );

          const reviewPane = reviewSet ? (
            <ProposalReviewDrawer
              set={reviewSet}
              onClose={() => setReviewSet(null)}
              onConfirm={(_kind, id) => {
                runConfirm(id);
                setReviewSet(null);
              }}
            />
          ) : null;

          const modal = newChatOpen && <NewChatModal onClose={() => setNewChatOpen(false)} onStart={startNewChat} />;

          // Mobile: single pane with segmented Chat / Context / Artifact tabs.
          if (bp === 'mobile') {
            return (
              <div className="relative flex min-h-0 flex-1 flex-col">
                <div className="border-b border-border-subtle bg-surface px-3 py-2">
                  <SegmentedControl
                    value={mobileTab}
                    onChange={setMobileTab}
                    options={[
                      { value: 'chat', label: 'Chat' },
                      { value: 'context', label: 'Context' },
                      { value: 'artifact', label: 'Artifact' },
                    ]}
                  />
                </div>
                <div className="flex min-h-0 flex-1">
                  {mobileTab === 'chat' && centerPane}
                  {mobileTab === 'context' && sessionsPane}
                  {mobileTab === 'artifact' && rightPane}
                </div>
                {reviewSet && <div className="fixed inset-0 z-50">{reviewPane}</div>}
                {modal}
              </div>
            );
          }

          // Tablet: two-pane (chat + artifact), sessions in a left drawer.
          if (bp === 'tablet') {
            return (
              <div className="relative flex min-h-0 flex-1">
                <button
                  type="button"
                  onClick={() => setSessionsOpen(true)}
                  className="absolute left-2 top-2 z-20 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1 font-mono text-[11px] text-text-secondary hover:text-text"
                >
                  Sessions
                </button>
                {centerPane}
                {reviewSet ? reviewPane : rightPane}
                {sessionsOpen && (
                  <Drawer side="left" width="w-[300px]" onClose={() => setSessionsOpen(false)}>
                    {sessionsPane}
                  </Drawer>
                )}
                {modal}
              </div>
            );
          }

          // Desktop: full three-pane layout.
          return (
            <div className="relative flex min-h-0 flex-1">
              {sessionsPane}
              {centerPane}
              {reviewSet ? reviewPane : rightPane}
              {modal}
            </div>
          );
        })()
      )}
    </div>
  );
}

function DevControls({
  relay,
  setRelay,
  view,
  setView,
}: {
  relay: RelayState;
  setRelay: (r: RelayState) => void;
  view: ViewState;
  setView: (v: ViewState) => void;
}) {
  const relayStates: RelayState[] = ['connected', 'connecting', 'disconnected', 'not-configured'];
  const viewStates: { id: ViewState; label: string }[] = [
    { id: 'normal', label: 'normal' },
    { id: 'backend-offline', label: 'backend offline' },
    { id: 'session-mismatch', label: 'session mismatch' },
  ];
  const chip = (active: boolean) =>
    `rounded-sm border px-2 py-0.5 font-mono text-[10px] transition-colors ${
      active ? 'border-brand-border bg-brand-muted text-brand' : 'border-border-subtle bg-surface-2 text-text-muted hover:text-text-secondary'
    }`;
  return (
    <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-sm border border-border-strong bg-popover p-3 shadow-xl">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">Prototype States · developer</div>
      <div className="mb-2">
        <div className="mb-1 font-mono text-[10px] text-text-muted">Relay</div>
        <div className="flex flex-wrap gap-1">
          {relayStates.map((s) => (
            <button key={s} type="button" onClick={() => setRelay(s)} className={chip(relay === s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-1 font-mono text-[10px] text-text-muted">View</div>
        <div className="flex flex-wrap gap-1">
          {viewStates.map((s) => (
            <button key={s.id} type="button" onClick={() => setView(s.id)} className={chip(view === s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RelayGate({ relay, onRetry, navigate }: { relay: RelayState; onRetry: () => void; navigate: (to: string) => void }) {
  if (relay === 'connecting') {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-[14px] text-text-secondary">
          <Loader2 className="size-4 animate-spin text-amber" /> Connecting to Claude relay…
        </div>
      </div>
    );
  }
  const disconnected = relay === 'disconnected';
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-sm border border-border-subtle bg-surface p-6 text-center">
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-sm border border-border-strong bg-surface-2">
          <Terminal className="size-5 text-text-muted" />
        </div>
        <h3 className="text-[15px] text-text">{disconnected ? 'Claude disconnected' : 'Claude relay not configured'}</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-text-secondary">
          {disconnected
            ? 'The Claude Code stream relay dropped. Reconnect to resume the session or save the transcript locally.'
            : 'Chat requires Claude Code stream relay. Configure the local backend to enable chat.'}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button type="button" onClick={onRetry} className="flex items-center gap-1.5 rounded-sm border border-brand-border bg-brand-muted px-3 py-1.5 text-[12px] text-brand hover:bg-brand-surface">
            <RefreshCw className="size-3.5" /> {disconnected ? 'Reconnect' : 'Retry connection'}
          </button>
          <button type="button" onClick={() => navigate('/status')} className="flex items-center gap-1.5 rounded-sm border border-border-strong bg-surface-2 px-3 py-1.5 text-[12px] text-text-secondary hover:text-text">
            {disconnected ? <Save className="size-3.5" /> : <BookOpen className="size-3.5" />}
            {disconnected ? 'Save transcript locally' : 'View setup guide'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BackendDisabledCenter() {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center bg-background p-6 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-sm border border-red/30 bg-red/10">
        <WifiOff className="size-5 text-red" />
      </div>
      <h3 className="text-[15px] text-text">Backend connection failed</h3>
      <p className="mt-1.5 max-w-sm text-[13px] text-text-secondary">
        Chat is disabled while the local backend is offline. The artifact viewer shows the last cached preview.
      </p>
    </div>
  );
}

function MismatchPanel({ onReload }: { onReload: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-sm border border-amber/30 bg-amber/[0.06] p-6 text-center">
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-sm border border-amber/40 bg-amber/10">
          <AlertTriangle className="size-5 text-amber" />
        </div>
        <h3 className="text-[15px] text-text">Session data mismatch</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-text-secondary">
          This chat transcript and artifact viewer reference different experiment directories.
        </p>
        <button type="button" onClick={onReload} className="mt-4 inline-flex items-center gap-1.5 rounded-sm border border-brand-border bg-brand-muted px-3 py-1.5 text-[12px] text-brand hover:bg-brand-surface">
          <RefreshCw className="size-3.5" /> Reload session
        </button>
      </div>
    </div>
  );
}

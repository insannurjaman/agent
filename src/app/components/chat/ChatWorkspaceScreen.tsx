import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { X, Search, Layers } from 'lucide-react';
import { sessions as initialSessions, getSessionBundle, type ChatSession, type FindingProposal, type QuestionProposal, type TimelineItem } from '../../data/chat';
import type { ChatEventHandlers, ProposalStatus } from './ChatEvents';
import { ChatStream } from './ChatStream';
import { SessionExplorerPane } from './SessionExplorerPane';
import { ArtifactViewer } from './ArtifactViewer';
import { ProposalReviewDrawer } from './ProposalReviewDrawer';
import { NewChatModal } from './NewChatModal';
import { useBreakpoint } from '../responsive/useBreakpoint';
import { Drawer } from '../responsive/Drawer';
import { IconButton } from '../common/IconButton';
import { cn } from '../ui/utils';

const EMPTY_BUNDLE = { transcript: [], tree: [], artifacts: {}, timeline: [] as TimelineItem[], context: [], latestArtifactId: null };

type MobilePanel = 'workspace' | 'explorer' | 'viewer' | null;

/** Sanitize a user prompt into a readable session title. */
function sanitizeTitle(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return 'New investigation';
  // Take first line, truncate to 60 chars, collapse whitespace
  const firstLine = trimmed.split('\n')[0].trim();
  const collapsed = firstLine.replace(/\s+/g, ' ');
  if (collapsed.length <= 60) return collapsed;
  return collapsed.slice(0, 57) + '…';
}

export function ChatWorkspaceScreen() {
  const bp = useBreakpoint();
  const navigate = useNavigate();
  const [sessionList, setSessionList] = useState<ChatSession[]>(initialSessions);
  const [session, setSession] = useState<ChatSession>(initialSessions[0]);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const [attachedContext, setAttachedContext] = useState<string[]>(['F-0050', 'Q-0014']);
  const [reviewing, setReviewing] = useState<{
    findings: FindingProposal[];
    questions: QuestionProposal[];
  } | null>(null);
  const [proposalStatus, setProposalStatus] = useState<Record<string, ProposalStatus>>({});
  const [newChatOpen, setNewChatOpen] = useState(false);

  const bundle = getSessionBundle(session.id) ?? EMPTY_BUNDLE;
  const artifact = artifactId ? bundle.artifacts[artifactId] ?? null : null;

  const handlers: ChatEventHandlers = {
    onNav: (id) => setAttachedContext((prev) => (prev.includes(id) ? prev : [...prev, id])),
    onOpenArtifact: (id) => {
      setArtifactId(id);
      setMobilePanel('viewer');
    },
    onAttachResults: (ids) => setAttachedContext((prev) => [...new Set([...prev, ...ids])]),
    onOpenInOut: () => navigate('/in-out'),
    onReview: (findings, questions) => setReviewing({ findings, questions }),
    onConfirmFinding: (p) => setProposalStatus((prev) => ({ ...prev, [p.findingId]: 'pending' })),
    onConfirmQuestion: (p) => setProposalStatus((prev) => ({ ...prev, [p.questionId]: 'pending' })),
    onRetryProposal: (id) => setProposalStatus((prev) => ({ ...prev, [id]: 'pending' })),
    onOpenLog: () => {},
    proposalStatus,
    density: 'focus' as const,
  };

  const handleNewChat = useCallback(() => { setNewChatOpen(true); }, []);

  const handleOpenArtifact = useCallback((id: string) => {
    setArtifactId(id);
    setMobilePanel('viewer');
  }, []);

  const handleNewArtifact = bundle.latestArtifactId
    ? { id: bundle.latestArtifactId, name: bundle.latestArtifactId }
    : null;

  const closeMobilePanel = useCallback(() => {
    setMobilePanel(null);
  }, []);

  /** Create a new session with a sanitized title and add it to the sidebar list. */
  const handleStart = useCallback((slug: string, prompt: string, context: string[]) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return; // Guard against empty prompts
    const newSession: ChatSession = {
      id: `s-${Date.now()}`,
      slug: slug || 'auto',
      title: sanitizeTitle(trimmedPrompt),
      status: 'running',
      lastUpdated: 'just now',
    };
    setSessionList((prev) => [newSession, ...prev]);
    setSession(newSession);
    setAttachedContext(context);
    setNewChatOpen(false);
  }, []);

  const selectSession = useCallback((id: string) => {
    const s = sessionList.find((x) => x.id === id);
    if (s) setSession(s);
  }, [sessionList]);

  const isDesktop = bp === 'desktop';

  // Desktop: CSS Grid layout
  if (isDesktop) {
    return (
      <>
        <div
          className="grid h-full min-h-0 w-full overflow-hidden"
          style={{ gridTemplateColumns: mobilePanel === 'viewer' ? '280px minmax(520px,1fr) 420px' : '280px minmax(0,1fr)' }}
        >
          <div className="hidden border-r border-border-subtle md:block xl:block">
            <SessionExplorerPane
              sessionList={sessionList}
              activeSessionId={session.id}
              onSelectSession={selectSession}
              onNewChat={handleNewChat}
              relay="connected"
              tree={bundle.tree}
              artifacts={bundle.artifacts}
              onSelectArtifact={handleOpenArtifact}
              context={attachedContext}
            />
          </div>
          <div className="flex min-h-0 min-w-0 flex-col">
            <ChatStream
              session={session} transcript={bundle.transcript}
              attachedContext={attachedContext}
              onRemoveContext={(id) => setAttachedContext((prev) => prev.filter((x) => x !== id))}
              onAttachContext={() => {}}
              h={handlers}
              onToggleArtifact={() => setMobilePanel(mobilePanel === 'viewer' ? null : 'viewer')}
              hasArtifact={bundle.latestArtifactId !== null}
              onPanelChange={setMobilePanel}
            />
          </div>
          {mobilePanel === 'viewer' && (
            <div className="h-full min-h-0 overflow-hidden border-l border-border-subtle">
              <ArtifactViewer
                artifact={artifact} onClose={closeMobilePanel}
                newArtifact={handleNewArtifact} timeline={bundle.timeline}
                onTimelineOpen={(item) => { if (item.artifactId) setArtifactId(item.artifactId); }}
                related={[]} onNav={handlers.onNav}
              />
            </div>
          )}
        </div>
        {reviewing && (
          <ProposalReviewDrawer set={reviewing} onClose={() => setReviewing(null)}
            onConfirm={(kind, id) => {
              if (kind === 'finding') { const p = reviewing.findings.find((f) => f.findingId === id); if (p) handlers.onConfirmFinding(p); }
              else { const p = reviewing.questions.find((q) => q.questionId === id); if (p) handlers.onConfirmQuestion(p); }
            }} />
        )}
        {newChatOpen && (
          <NewChatModal onClose={() => setNewChatOpen(false)}
            onStart={handleStart} />
        )}
      </>
    );
  }

  // Mobile/tablet: full-width chat, panels as drawers
  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      {/* Workspace navigation drawer */}
      <Drawer open={mobilePanel === 'workspace'} onClose={closeMobilePanel} side="left" width="w-full sm:w-[360px]" ariaLabel="Session explorer">
        <SessionExplorerPane
          sessionList={sessionList} activeSessionId={session.id}
          onSelectSession={(id) => { selectSession(id); closeMobilePanel(); }}
          onNewChat={() => { closeMobilePanel(); setNewChatOpen(true); }}
          relay="connected" tree={bundle.tree} artifacts={bundle.artifacts}
          onSelectArtifact={(id) => { setArtifactId(id); setMobilePanel('viewer'); }}
          context={attachedContext} onClose={closeMobilePanel}
        />
      </Drawer>

      {/* Artifact Viewer drawer */}
      <Drawer open={mobilePanel === 'viewer'} onClose={closeMobilePanel} side="right" width="w-full sm:w-[420px]" ariaLabel="Artifact viewer">
        <ArtifactViewer
          artifact={artifact} onClose={closeMobilePanel}
          newArtifact={handleNewArtifact} timeline={bundle.timeline}
          onTimelineOpen={(item) => { if (item.artifactId) setArtifactId(item.artifactId); }}
          related={[]} onNav={handlers.onNav}
        />
      </Drawer>

      {/* Main Chat */}
      <ChatStream
        session={session} transcript={bundle.transcript}
        attachedContext={attachedContext}
        onRemoveContext={(id) => setAttachedContext((prev) => prev.filter((x) => x !== id))}
        onAttachContext={() => {}}
        h={handlers}
        onOpenPanel={() => setMobilePanel('workspace')}
        onToggleArtifact={() => setMobilePanel(mobilePanel === 'viewer' ? null : 'viewer')}
        hasArtifact={bundle.latestArtifactId !== null}
        onPanelChange={setMobilePanel}
      />

      {/* Proposal review */}
      {reviewing && (
        <ProposalReviewDrawer set={reviewing} onClose={() => setReviewing(null)}
          onConfirm={(kind, id) => {
            if (kind === 'finding') { const p = reviewing.findings.find((f) => f.findingId === id); if (p) handlers.onConfirmFinding(p); }
            else { const p = reviewing.questions.find((q) => q.questionId === id); if (p) handlers.onConfirmQuestion(p); }
          }} />
      )}

      {newChatOpen && (
        <NewChatModal onClose={() => setNewChatOpen(false)}
          onStart={handleStart} />
      )}
    </div>
  );
}

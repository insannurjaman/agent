import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { X, Search, Layers } from 'lucide-react';
import { sessions, getSessionBundle, type ChatSession, type FindingProposal, type QuestionProposal, type TimelineItem } from '../../data/chat';
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

export function ChatWorkspaceScreen() {
  const bp = useBreakpoint();
  const navigate = useNavigate();
  const [session, setSession] = useState<ChatSession>(sessions[0]);
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
    onOpenFacetedSearch: () => navigate('/search'),
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
              sessionList={sessions}
              activeSessionId={session.id}
              onSelectSession={(id) => { const s = sessions.find((x) => x.id === id); if (s) setSession(s); }}
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
          <Drawer open onClose={() => setReviewing(null)} side="right" ariaLabel="Proposal review">
            <ProposalReviewDrawer set={reviewing} onClose={() => setReviewing(null)}
              onConfirm={(kind, id) => {
                if (kind === 'finding') { const p = reviewing.findings.find((f) => f.findingId === id); if (p) handlers.onConfirmFinding(p); }
                else { const p = reviewing.questions.find((q) => q.questionId === id); if (p) handlers.onConfirmQuestion(p); }
              }} />
          </Drawer>
        )}
        {newChatOpen && (
          <NewChatModal onClose={() => setNewChatOpen(false)}
            onStart={(slug, prompt, context) => {
              setSession({ id: `s-${Date.now()}`, slug, title: prompt || 'New session', status: 'running', lastUpdated: 'just now' });
              setAttachedContext(context); setNewChatOpen(false);
            }} />
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
          sessionList={sessions} activeSessionId={session.id}
          onSelectSession={(id) => { const s = sessions.find((x) => x.id === id); if (s) { setSession(s); closeMobilePanel(); } }}
          onNewChat={() => { closeMobilePanel(); setNewChatOpen(true); }}
          relay="connected" tree={bundle.tree} artifacts={bundle.artifacts}
          onSelectArtifact={(id) => { setArtifactId(id); setMobilePanel('viewer'); }}
          context={attachedContext}
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
        <Drawer open onClose={() => setReviewing(null)} side="right" ariaLabel="Proposal review">
          <ProposalReviewDrawer set={reviewing} onClose={() => setReviewing(null)}
            onConfirm={(kind, id) => {
              if (kind === 'finding') { const p = reviewing.findings.find((f) => f.findingId === id); if (p) handlers.onConfirmFinding(p); }
              else { const p = reviewing.questions.find((q) => q.questionId === id); if (p) handlers.onConfirmQuestion(p); }
            }} />
        </Drawer>
      )}

      {newChatOpen && (
        <NewChatModal onClose={() => setNewChatOpen(false)}
          onStart={(slug, prompt, context) => {
            setSession({ id: `s-${Date.now()}`, slug, title: prompt || 'New session', status: 'running', lastUpdated: 'just now' });
            setAttachedContext(context); setNewChatOpen(false);
          }} />
      )}
    </div>
  );
}

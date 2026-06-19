import { useState, useCallback } from 'react';
import { sessions, getSessionBundle, type ChatSession, type FindingProposal, type QuestionProposal, type TimelineItem } from '../../data/chat';
import type { ChatEventHandlers, ProposalStatus } from './ChatEvents';
import { ChatStream } from './ChatStream';
import { SessionExplorerPane } from './SessionExplorerPane';
import { ArtifactViewer } from './ArtifactViewer';
import { ProposalReviewDrawer } from './ProposalReviewDrawer';
import { NewChatModal } from './NewChatModal';
import { useBreakpoint } from '../responsive/useBreakpoint';
import { Drawer } from '../responsive/Drawer';

const EMPTY_BUNDLE = { transcript: [], tree: [], artifacts: {}, timeline: [] as TimelineItem[], context: [], latestArtifactId: null };

export function ChatWorkspaceScreen() {
  const bp = useBreakpoint();
  const [session, setSession] = useState<ChatSession>(sessions[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [artifactOpen, setArtifactOpen] = useState(false);
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
      setArtifactOpen(true);
    },
    onAttachResults: (ids) =>
      setAttachedContext((prev) => [...new Set([...prev, ...ids])]),
    onOpenFacetedSearch: () => {},
    onReview: (findings, questions) => setReviewing({ findings, questions }),
    onConfirmFinding: (p) =>
      setProposalStatus((prev) => ({ ...prev, [p.findingId]: 'pending' })),
    onConfirmQuestion: (p) =>
      setProposalStatus((prev) => ({ ...prev, [p.questionId]: 'pending' })),
    onRetryProposal: (id) =>
      setProposalStatus((prev) => ({ ...prev, [id]: 'pending' })),
    onOpenLog: () => {},
    density: 'focus' as const,
  };

  const handleNewChat = useCallback(() => {
    setNewChatOpen(true);
  }, []);

  const handleNewArtifact = bundle.latestArtifactId
    ? { id: bundle.latestArtifactId, name: bundle.latestArtifactId }
    : null;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Desktop sidebar */}
      {bp === 'desktop' && (
        <SessionExplorerPane
          sessionList={sessions}
          activeSessionId={session.id}
          onSelectSession={(id) => {
            const s = sessions.find((x) => x.id === id);
            if (s) setSession(s);
          }}
          onNewChat={handleNewChat}
          relay="connected"
          currentSlug={session.slug}
          tree={bundle.tree}
          activeFilePath={null}
          onSelectFile={() => {}}
        />
      )}

      {/* Tablet/mobile sidebar drawer */}
      {bp !== 'desktop' && (
        <Drawer
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          side="left"
          width="w-[300px]"
        >
          <SessionExplorerPane
            sessionList={sessions}
            activeSessionId={session.id}
            onSelectSession={(id) => {
              const s = sessions.find((x) => x.id === id);
              if (s) {
                setSession(s);
                setSidebarOpen(false);
              }
            }}
            onNewChat={() => {
              setSidebarOpen(false);
              setNewChatOpen(true);
            }}
            relay="connected"
            currentSlug={session.slug}
            tree={bundle.tree}
            activeFilePath={null}
            onSelectFile={() => {}}
          />
        </Drawer>
      )}

      {/* Main chat area */}
      <ChatStream
        session={session}
        transcript={bundle.transcript}
        attachedContext={attachedContext}
        onRemoveContext={(id) => setAttachedContext((prev) => prev.filter((x) => x !== id))}
        onAttachContext={() => {}}
        h={handlers}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {/* Artifact panel — closed by default, desktop only */}
      {bp === 'desktop' && artifactOpen && (
        <ArtifactViewer
          artifact={artifact}
          autoFollow={false}
          onPause={() => {}}
          onResume={() => {}}
          onOpenLatest={() => {
            if (bundle.latestArtifactId) {
              setArtifactId(bundle.latestArtifactId);
            }
          }}
          newArtifact={handleNewArtifact}
          onKeepPinned={() => {}}
          timeline={bundle.timeline}
          onTimelineOpen={(item) => {
            if (item.artifactId) {
              setArtifactId(item.artifactId);
            }
          }}
          related={[]}
          backendOffline={false}
          onNav={handlers.onNav}
        />
      )}

      {/* Artifact overlay — mobile/tablet */}
      {bp !== 'desktop' && artifactOpen && (
        <Drawer open onClose={() => setArtifactOpen(false)} side="right">
          <ArtifactViewer
            artifact={artifact}
            autoFollow={false}
            onPause={() => {}}
            onResume={() => {}}
            onOpenLatest={() => {
              if (bundle.latestArtifactId) {
                setArtifactId(bundle.latestArtifactId);
              }
            }}
            newArtifact={handleNewArtifact}
            onKeepPinned={() => {}}
            timeline={bundle.timeline}
            onTimelineOpen={(item) => {
              if (item.artifactId) {
                setArtifactId(item.artifactId);
              }
            }}
            related={[]}
            backendOffline={false}
            onNav={handlers.onNav}
          />
        </Drawer>
      )}

      {/* Proposal review overlay */}
      {reviewing && (
        <Drawer open onClose={() => setReviewing(null)} side="right">
          <ProposalReviewDrawer
            set={reviewing}
            onClose={() => setReviewing(null)}
            onConfirm={(kind, id) => {
              if (kind === 'finding') {
                const p = reviewing.findings.find((f) => f.findingId === id);
                if (p) handlers.onConfirmFinding(p);
              } else {
                const p = reviewing.questions.find((q) => q.questionId === id);
                if (p) handlers.onConfirmQuestion(p);
              }
            }}
          />
        </Drawer>
      )}

      {/* New chat modal */}
      {newChatOpen && (
        <NewChatModal
          onClose={() => setNewChatOpen(false)}
          onStart={(slug, prompt, context) => {
            const newSession: ChatSession = {
              id: `s-${Date.now()}`,
              slug,
              title: prompt || 'New session',
              status: 'running',
              lastUpdated: 'just now',
            };
            setSession(newSession);
            setAttachedContext(context);
            setNewChatOpen(false);
          }}
        />
      )}
    </div>
  );
}

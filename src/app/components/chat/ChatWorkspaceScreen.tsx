import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { sessions, getSessionBundle, type ChatSession, type FindingProposal, type QuestionProposal, type TimelineItem } from '../../data/chat';
import type { ChatEventHandlers, ProposalStatus } from './ChatEvents';
import { ChatStream } from './ChatStream';
import { SessionExplorerPane } from './SessionExplorerPane';
import { ArtifactViewer } from './ArtifactViewer';
import { ProposalReviewDrawer } from './ProposalReviewDrawer';
import { NewChatModal } from './NewChatModal';
import { useBreakpoint } from '../responsive/useBreakpoint';
import { Drawer } from '../responsive/Drawer';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../ui/resizable';

const EMPTY_BUNDLE = { transcript: [], tree: [], artifacts: {}, timeline: [] as TimelineItem[], context: [], latestArtifactId: null };

export function ChatWorkspaceScreen() {
  const bp = useBreakpoint();
  const navigate = useNavigate();
  const [session, setSession] = useState<ChatSession>(sessions[0]);
  const [artifactOpen, setArtifactOpen] = useState(false);
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const [attachedContext, setAttachedContext] = useState<string[]>(['F-0050', 'Q-0014']);
  const [reviewing, setReviewing] = useState<{
    findings: FindingProposal[];
    questions: QuestionProposal[];
  } | null>(null);
  const [proposalStatus, setProposalStatus] = useState<Record<string, ProposalStatus>>({});
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

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
    onOpenFacetedSearch: () => navigate('/search'),
    onReview: (findings, questions) => setReviewing({ findings, questions }),
    onConfirmFinding: (p) =>
      setProposalStatus((prev) => ({ ...prev, [p.findingId]: 'pending' })),
    onConfirmQuestion: (p) =>
      setProposalStatus((prev) => ({ ...prev, [p.questionId]: 'pending' })),
    onRetryProposal: (id) =>
      setProposalStatus((prev) => ({ ...prev, [id]: 'pending' })),
    onOpenLog: () => {}, // Log viewer not in V1 scope
    proposalStatus,
    density: 'focus' as const,
  };

  const handleNewChat = useCallback(() => {
    setNewChatOpen(true);
  }, []);

  const handleOpenArtifact = useCallback((id: string) => {
    setArtifactId(id);
    setArtifactOpen(true);
  }, []);

  const handleNewArtifact = bundle.latestArtifactId
    ? { id: bundle.latestArtifactId, name: bundle.latestArtifactId }
    : null;

  // Desktop: ResizablePanelGroup layout
  if (bp === 'desktop') {
    return (
      <div className="flex h-full min-h-0 w-full overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full min-h-0">
          {/* Left Panel — Chats/Explorer */}
          <ResizablePanel defaultSize={22} minSize={18} maxSize={30}>
            <SessionExplorerPane
              sessionList={sessions}
              activeSessionId={session.id}
              onSelectSession={(id) => {
                const s = sessions.find((x) => x.id === id);
                if (s) setSession(s);
              }}
              onNewChat={handleNewChat}
              relay="connected"
              tree={bundle.tree}
              artifacts={bundle.artifacts}
              onSelectArtifact={handleOpenArtifact}
              context={attachedContext}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Main Chat */}
          <ResizablePanel defaultSize={artifactOpen ? 48 : 78} minSize={40}>
            <ChatStream
              session={session}
              transcript={bundle.transcript}
              attachedContext={attachedContext}
              onRemoveContext={(id) => setAttachedContext((prev) => prev.filter((x) => x !== id))}
              onAttachContext={() => {}}
              h={handlers}
              onToggleArtifact={() => setArtifactOpen(!artifactOpen)}
              hasArtifact={bundle.latestArtifactId !== null}
            />
          </ResizablePanel>

          {/* Artifact Viewer — collapsible */}
          {artifactOpen && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                <ArtifactViewer
                  artifact={artifact}
                  onClose={() => setArtifactOpen(false)}
                  newArtifact={handleNewArtifact}
                  timeline={bundle.timeline}
                  onTimelineOpen={(item) => {
                    if (item.artifactId) {
                      setArtifactId(item.artifactId);
                    }
                  }}
                  related={[]}
                  onNav={handlers.onNav}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>

        {/* Overlays */}
        {reviewing && (
          <Drawer open onClose={() => setReviewing(null)} side="right" ariaLabel="Proposal review">
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

  // Tablet: Chat full-width, panels open as drawers
  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      {/* Left Panel drawer */}
      <Drawer open={panelOpen} onClose={() => setPanelOpen(false)} side="left" width="w-[min(86vw,320px)]" ariaLabel="Session explorer">
        <SessionExplorerPane
          sessionList={sessions}
          activeSessionId={session.id}
          onSelectSession={(id) => {
            const s = sessions.find((x) => x.id === id);
            if (s) {
              setSession(s);
              setPanelOpen(false);
            }
          }}
          onNewChat={() => {
            setPanelOpen(false);
            setNewChatOpen(true);
          }}
          relay="connected"
          tree={bundle.tree}
          artifacts={bundle.artifacts}
          onSelectArtifact={(id) => {
            handleOpenArtifact(id);
            setPanelOpen(false);
          }}
          context={attachedContext}
        />
      </Drawer>

      {/* Artifact Viewer drawer */}
      <Drawer open={artifactOpen} onClose={() => setArtifactOpen(false)} side="right" width="w-[min(86vw,400px)]" ariaLabel="Artifact viewer">
        <ArtifactViewer
          artifact={artifact}
          onClose={() => setArtifactOpen(false)}
          newArtifact={handleNewArtifact}
          timeline={bundle.timeline}
          onTimelineOpen={(item) => {
            if (item.artifactId) {
              setArtifactId(item.artifactId);
            }
          }}
          related={[]}
          onNav={handlers.onNav}
        />
      </Drawer>

      {/* Main Chat */}
      <ChatStream
        session={session}
        transcript={bundle.transcript}
        attachedContext={attachedContext}
        onRemoveContext={(id) => setAttachedContext((prev) => prev.filter((x) => x !== id))}
        onAttachContext={() => {}}
        h={handlers}
        onOpenPanel={() => setPanelOpen(true)}
        onToggleArtifact={() => setArtifactOpen(!artifactOpen)}
        hasArtifact={bundle.latestArtifactId !== null}
      />

      {/* Proposal review */}
      {reviewing && (
        <Drawer open onClose={() => setReviewing(null)} side="right" ariaLabel="Proposal review">
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

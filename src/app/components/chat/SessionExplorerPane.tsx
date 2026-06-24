import { useState } from 'react';
import { Folder, FileText, ImageIcon, Code, File, ChevronRight, ChevronDown, Plus, Search } from 'lucide-react';
import { type ChatSession, type FileNode, type SessionStatus, type Artifact } from '../../data/chat';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { cn } from '../ui/utils';

type RelayLabel = 'connected' | 'connecting' | 'disconnected' | 'not-configured';

const STATUS_TONE: Record<SessionStatus, string> = {
  running: 'bg-green',
  completed: 'bg-text-muted',
  failed: 'bg-red',
};

const FILE_ICONS: Record<string, typeof FileText> = {
  png: ImageIcon,
  json: Code,
  html: FileText,
  markdown: FileText,
  log: File,
};

function formatTime(lastUpdated: string): string {
  const match = lastUpdated.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2})/);
  if (!match) return lastUpdated;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[parseInt(match[2], 10) - 1];
  return `${month} ${parseInt(match[3], 10)} · ${match[4]}`;
}

export function SessionExplorerPane({
  sessionList,
  activeSessionId,
  onSelectSession,
  onNewChat,
  relay,
  tree,
  artifacts,
  onSelectArtifact,
  context,
}: {
  sessionList: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  relay: RelayLabel;
  tree?: FileNode[];
  artifacts?: Record<string, Artifact>;
  onSelectArtifact?: (id: string) => void;
  context?: string[];
}) {
  const [tab, setTab] = useState<'chats' | 'explorer'>('chats');

  const unique = dedup(sessionList);
  const running = unique.filter((s) => s.status === 'running');
  const completed = unique.filter((s) => s.status === 'completed');
  const failed = unique.filter((s) => s.status === 'failed');

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r border-border-subtle bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2.5">
        <span className="text-[13px] font-semibold text-text">Workspace</span>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-2 mt-2 shrink-0">
          <TabsTrigger value="chats" className="flex-1 text-[11px]">Chats</TabsTrigger>
          <TabsTrigger value="explorer" className="flex-1 text-[11px]">Explorer</TabsTrigger>
        </TabsList>

        {/* Chats tab */}
        <TabsContent value="chats" className="min-h-0 flex-1 overflow-auto p-2">
          {/* New Chat */}
          <button
            type="button"
            onClick={onNewChat}
            className="mb-2 flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-brand-hover"
          >
            <Plus className="size-3.5" />
            New Chat
          </button>

          {/* Relay status */}
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className={cn('size-1.5 rounded-full', relay === 'connected' ? 'bg-green' : relay === 'connecting' ? 'bg-amber' : 'bg-red')} />
            <span className="font-mono text-[10px] text-text-muted">
              {relay === 'connected' ? 'Claude relay connected' : relay}
            </span>
          </div>

          {/* Session groups */}
          {running.length > 0 && (
            <SessionGroup label="Running" sessions={running} activeId={activeSessionId} onSelect={onSelectSession} />
          )}
          {completed.length > 0 && (
            <SessionGroup label="Completed" sessions={completed} activeId={activeSessionId} onSelect={onSelectSession} />
          )}
          {failed.length > 0 && (
            <SessionGroup label="Failed" sessions={failed} activeId={activeSessionId} onSelect={onSelectSession} />
          )}
        </TabsContent>

        {/* Explorer tab */}
        <TabsContent value="explorer" className="min-h-0 flex-1 overflow-auto p-2">
          {/* Context chips */}
          {context && context.length > 0 && (
            <div className="mb-3">
              <div className="mb-1 px-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                Attached context
              </div>
              <div className="flex flex-wrap gap-1">
                {context.map((id) => (
                  <span key={id} className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-secondary">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* File tree */}
          {tree && tree.length > 0 ? (
            <div
              role="tree"
              aria-label="Workspace files"
              className="space-y-0.5"
              onKeyDown={(e) => {
                const focusable = Array.from(
                  (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="treeitem"] > button'),
                );
                const idx = focusable.indexOf(document.activeElement as HTMLElement);
                if (idx === -1) return;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  focusable[Math.min(idx + 1, focusable.length - 1)]?.focus();
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  focusable[Math.max(idx - 1, 0)]?.focus();
                } else if (e.key === 'Home') {
                  e.preventDefault();
                  focusable[0]?.focus();
                } else if (e.key === 'End') {
                  e.preventDefault();
                  focusable[focusable.length - 1]?.focus();
                }
              }}
            >
              {tree.map((node) => (
                <FileNodeRow
                  key={node.path}
                  node={node}
                  depth={0}
                  artifacts={artifacts}
                  onSelectArtifact={onSelectArtifact}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <Folder className="mb-2 size-6 text-text-muted" />
              <div className="text-[11px] text-text-muted">No files in workspace</div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SessionGroup({
  label,
  sessions: groupSessions,
  activeId,
  onSelect,
}: {
  label: string;
  sessions: ChatSession[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-1 px-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {label} · {groupSessions.length}
      </div>
      <div className="flex flex-col gap-0.5">
        {groupSessions.map((s) => (
          <SessionRow key={s.id} session={s} isActive={s.id === activeId} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function SessionRow({
  session,
  isActive,
  onSelect,
}: {
  session: ChatSession;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(session.id)}
      className={cn(
        'flex min-h-[40px] w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors',
        isActive
          ? 'bg-brand-muted border-l-2 border-brand pl-1.5'
          : 'hover:bg-surface-2',
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', STATUS_TONE[session.status])} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] text-text-secondary">{session.title}</div>
        <div className="font-mono text-[10px] text-text-muted">{formatTime(session.lastUpdated)}</div>
      </div>
      {session.status === 'running' && (
        <span className="shrink-0 rounded-sm bg-green/15 px-1 py-0.5 font-mono text-[9px] uppercase text-green">Live</span>
      )}
    </button>
  );
}

function FileNodeRow({
  node,
  depth,
  artifacts,
  onSelectArtifact,
}: {
  node: FileNode;
  depth: number;
  artifacts?: Record<string, Artifact>;
  onSelectArtifact?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isDir = node.kind === 'dir';
  const Icon = node.type ? (FILE_ICONS[node.type] ?? File) : isDir ? Folder : File;
  const isArtifact = node.type && node.generated;
  const artifactData = artifacts?.[node.name];

  return (
    <div role="treeitem" aria-level={depth + 1} aria-expanded={isDir ? expanded : undefined}>
      <button
        type="button"
        tabIndex={depth === 0 ? 0 : -1}
        onClick={() => {
          if (isDir) {
            setExpanded(!expanded);
          } else if (isArtifact && artifactData && onSelectArtifact) {
            onSelectArtifact(artifactData.id);
          }
        }}
        className={cn(
          'flex min-h-[32px] w-full items-center gap-1.5 rounded-sm px-1.5 py-1 text-left transition-colors hover:bg-surface-2',
          isArtifact && 'text-brand',
        )}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
      >
        {isDir ? (
          expanded ? (
            <ChevronDown className="size-3 shrink-0 text-text-muted" />
          ) : (
            <ChevronRight className="size-3 shrink-0 text-text-muted" />
          )
        ) : (
          <span className="w-3" />
        )}
        <Icon className={cn('size-3.5 shrink-0', isArtifact ? 'text-brand' : 'text-text-muted')} />
        <span className={cn('truncate text-[11px]', isArtifact ? 'text-brand' : 'text-text-secondary')}>
          {node.name}
        </span>
        {isArtifact && node.generatedAt && (
          <span className="ml-auto shrink-0 font-mono text-[9px] text-text-muted">{node.generatedAt}</span>
        )}
      </button>
      {isDir && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileNodeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              artifacts={artifacts}
              onSelectArtifact={onSelectArtifact}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function dedup(list: ChatSession[]): ChatSession[] {
  const seen = new Set<string>();
  return list.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

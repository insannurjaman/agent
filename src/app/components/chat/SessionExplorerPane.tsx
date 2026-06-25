import { useState, useMemo } from 'react';
import { Folder, FileText, ImageIcon, Code, File, ChevronRight, ChevronDown, Plus, X } from 'lucide-react';
import { type ChatSession, type FileNode, type SessionStatus, type Artifact } from '../../data/chat';
import { IconButton } from '../common/IconButton';
import { cn } from '../ui/utils';

type RelayLabel = 'connected' | 'connecting' | 'disconnected' | 'not-configured';

const STATUS_TONE: Record<SessionStatus, string> = {
  running: 'bg-green', completed: 'bg-text-muted', failed: 'bg-red',
};

const FILE_ICONS: Record<string, typeof FileText> = {
  png: ImageIcon, json: Code, html: FileText, markdown: FileText, log: File,
};

const CHAT_GROUPS = [
  { status: 'running' as const, label: 'Running' },
  { status: 'completed' as const, label: 'Completed' },
  { status: 'failed' as const, label: 'Failed' },
];

function formatTime(lastUpdated: string): string {
  const m = lastUpdated.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2})/);
  if (!m) return lastUpdated;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m[2],10)-1]} ${parseInt(m[3],10)} · ${m[4]}`;
}

export function SessionExplorerPane({
  sessionList, activeSessionId, onSelectSession, onNewChat, relay, tree, artifacts, onSelectArtifact, context, onClose,
}: {
  sessionList: ChatSession[]; activeSessionId: string; onSelectSession: (id: string) => void; onNewChat: () => void;
  relay: RelayLabel; tree?: FileNode[]; artifacts?: Record<string, Artifact>; onSelectArtifact?: (id: string) => void;
  context?: string[]; onClose?: () => void;
}) {
  const [tab, setTab] = useState<'chats' | 'explorer'>('chats');

  // Canonical grouped data — computed once, rendered once
  const groups = useMemo(() => {
    const seen = new Set<string>();
    const byStatus: Record<string, ChatSession[]> = { running: [], completed: [], failed: [] };
    for (const s of sessionList) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      if (byStatus[s.status]) byStatus[s.status].push(s);
    }
    return CHAT_GROUPS.map((g) => ({ ...g, sessions: byStatus[g.status] }));
  }, [sessionList]);

  return (
    <div className="flex h-full w-full shrink-0 flex-col bg-surface">
      {/* Header with close button */}
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2.5 shrink-0">
        <span className="text-[13px] font-semibold text-text">Workspace</span>
        {onClose && <IconButton icon={X} label="Close workspace navigation" onClick={onClose} className="shrink-0" />}
      </div>

      {/* Tab switcher — simple buttons, no Radix Tabs to avoid mounting issues */}
      <div className="flex border-b border-border-subtle shrink-0">
        <button type="button" onClick={() => setTab('chats')}
          className={cn('flex-1 py-2.5 text-[11px] font-medium uppercase tracking-wide transition-colors', tab === 'chats' ? 'border-b-2 border-brand text-brand' : 'text-text-muted hover:text-text-secondary')}>
          Chats
        </button>
        <button type="button" onClick={() => setTab('explorer')}
          className={cn('flex-1 py-2.5 text-[11px] font-medium uppercase tracking-wide transition-colors', tab === 'explorer' ? 'border-b-2 border-brand text-brand' : 'text-text-muted hover:text-text-secondary')}>
          Explorer
        </button>
      </div>

      {/* Content — one canonical list */}
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {tab === 'chats' ? (
          <div>
            <button type="button" onClick={onNewChat}
              className="mb-2 flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-brand-hover">
              <Plus className="size-3.5" /> New Chat
            </button>
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className={cn('size-1.5 rounded-full', relay === 'connected' ? 'bg-green' : relay === 'connecting' ? 'bg-amber' : 'bg-red')} />
              <span className="font-mono text-[10px] text-text-muted">{relay === 'connected' ? 'Claude relay connected' : relay}</span>
            </div>
            {/* Single pass through groups — never duplicated */}
            {groups.map((group) => group.sessions.length > 0 && (
              <div key={group.status} className="mb-2 last:mb-0">
                <div className="mb-1 px-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">{group.label} · {group.sessions.length}</div>
                <div className="flex flex-col gap-0.5">
                  {group.sessions.map((s) => (
                    <button key={s.id} type="button" onClick={() => onSelectSession(s.id)}
                      className={cn('flex min-h-[40px] w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors', s.id === activeSessionId ? 'bg-brand-muted border-l-2 border-brand pl-1.5' : 'hover:bg-surface-2')}>
                      <span className={cn('size-1.5 shrink-0 rounded-full', STATUS_TONE[s.status])} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] text-text-secondary">{s.title}</div>
                        <div className="font-mono text-[10px] text-text-muted">{formatTime(s.lastUpdated)}</div>
                      </div>
                      {s.status === 'running' && <span className="shrink-0 rounded-sm bg-green/15 px-1 py-0.5 font-mono text-[9px] uppercase text-green">Live</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {context && context.length > 0 && (
              <div className="mb-3">
                <div className="mb-1 px-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">Attached context</div>
                <div className="flex flex-wrap gap-1">{context.map((id) => (<span key={id} className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-secondary">{id}</span>))}</div>
              </div>
            )}
            {tree && tree.length > 0 ? (
              <div role="tree" aria-label="Workspace files" className="space-y-0.5"
                onKeyDown={(e) => {
                  const fa = Array.from((e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="treeitem"] > button'));
                  const idx = fa.indexOf(document.activeElement as HTMLElement);
                  if (idx === -1) return;
                  if (e.key === 'ArrowDown') { e.preventDefault(); fa[Math.min(idx+1, fa.length-1)]?.focus(); }
                  if (e.key === 'ArrowUp') { e.preventDefault(); fa[Math.max(idx-1, 0)]?.focus(); }
                  if (e.key === 'Home') { e.preventDefault(); fa[0]?.focus(); }
                  if (e.key === 'End') { e.preventDefault(); fa[fa.length-1]?.focus(); }
                }}>
                {tree.map((node) => <FileNodeRow key={node.path} node={node} depth={0} artifacts={artifacts} onSelectArtifact={onSelectArtifact} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center"><Folder className="mb-2 size-6 text-text-muted" /><div className="text-[11px] text-text-muted">No files in workspace</div></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FileNodeRow({ node, depth, artifacts, onSelectArtifact }: {
  node: FileNode; depth: number; artifacts?: Record<string, Artifact>; onSelectArtifact?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isDir = node.kind === 'dir';
  const Icon = node.type ? (FILE_ICONS[node.type] ?? File) : isDir ? Folder : File;
  const isArtifact = node.type && node.generated;
  const artifactData = artifacts?.[node.name];
  return (
    <div role="treeitem" aria-level={depth+1} aria-expanded={isDir ? expanded : undefined}>
      <button type="button" tabIndex={depth === 0 ? 0 : -1}
        onClick={() => { if (isDir) setExpanded(!expanded); else if (isArtifact && artifactData && onSelectArtifact) onSelectArtifact(artifactData.id); }}
        className={cn('flex min-h-[32px] w-full items-center gap-1.5 rounded-sm px-1.5 py-1 text-left transition-colors hover:bg-surface-2', isArtifact && 'text-brand')}
        style={{ paddingLeft: `${depth*12+6}px` }}>
        {isDir ? (expanded ? <ChevronDown className="size-3 shrink-0 text-text-muted" /> : <ChevronRight className="size-3 shrink-0 text-text-muted" />) : <span className="w-3" />}
        <Icon className={cn('size-3.5 shrink-0', isArtifact ? 'text-brand' : 'text-text-muted')} />
        <span className={cn('truncate text-[11px]', isArtifact ? 'text-brand' : 'text-text-secondary')}>{node.name}</span>
        {isArtifact && node.generatedAt && <span className="ml-auto shrink-0 font-mono text-[9px] text-text-muted">{node.generatedAt}</span>}
      </button>
      {isDir && expanded && node.children && <div>{node.children.map((child) => <FileNodeRow key={child.path} node={child} depth={depth+1} artifacts={artifacts} onSelectArtifact={onSelectArtifact} />)}</div>}
    </div>
  );
}

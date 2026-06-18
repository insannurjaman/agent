import { useState } from 'react';
import {
  Plus,
  ChevronRight,
  Folder,
  FileText,
  FileCode2,
  Image as ImageIcon,
  Braces,
  ScrollText,
  File as FileIcon,
} from 'lucide-react';
import { type ChatSession, type FileNode, type SessionStatus } from '../../data/chat';
import { StatusBadge } from '../common/StatusBadge';
import { cn } from '../ui/utils';

type RelayLabel = 'connected' | 'connecting' | 'disconnected' | 'not-configured';
type Tab = 'sessions' | 'files';

const STATUS_TONE: Record<SessionStatus, 'green' | 'teal' | 'red'> = {
  running: 'teal',
  completed: 'green',
  failed: 'red',
};

const RELAY_TEXT: Record<RelayLabel, string> = {
  connected: 'Claude relay connected',
  connecting: 'Connecting to Claude relay…',
  disconnected: 'Claude disconnected',
  'not-configured': 'Claude relay not configured',
};

function fileIcon(node: FileNode) {
  if (node.kind === 'dir') return Folder;
  switch (node.type) {
    case 'markdown':
      return FileText;
    case 'png':
      return ImageIcon;
    case 'json':
      return Braces;
    case 'log':
      return ScrollText;
    default:
      return node.name.endsWith('.py') ? FileCode2 : FileIcon;
  }
}

export function SessionExplorerPane({
  sessionList,
  activeSessionId,
  onSelectSession,
  onNewChat,
  relay,
  currentSlug,
  tree,
  activeFilePath,
  onSelectFile,
}: {
  sessionList: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  relay: RelayLabel;
  currentSlug: string;
  tree: FileNode[];
  activeFilePath: string | null;
  onSelectFile: (node: FileNode) => void;
}) {
  const [tab, setTab] = useState<Tab>('sessions');
  const groups: { status: SessionStatus; label: string }[] = [
    { status: 'running', label: 'Running' },
    { status: 'completed', label: 'Completed' },
    { status: 'failed', label: 'Failed' },
  ];

  return (
    <aside className="flex w-full shrink-0 flex-col border-r border-border-subtle bg-surface md:w-[300px]">
      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-border-subtle p-1.5">
        {(['sessions', 'files'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-sm px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition-colors',
              tab === t ? 'bg-surface-2 text-text' : 'text-text-muted hover:text-text-secondary',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'sessions' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-border-subtle p-3">
            <button
              type="button"
              onClick={onNewChat}
              className="flex w-full items-center justify-center gap-2 rounded-sm border border-purple/40 bg-purple/10 px-3 py-2 text-[13px] text-purple transition-colors hover:bg-purple/15"
            >
              <Plus className="size-4" /> New Chat
            </button>
            <div className="mt-2.5 flex items-center gap-2">
              <span
                className={cn(
                  'size-2 rounded-full',
                  relay === 'connected' ? 'bg-green' : relay === 'connecting' ? 'bg-amber' : relay === 'disconnected' ? 'bg-red' : 'bg-text-muted',
                )}
              />
              <span className="font-mono text-[11px] text-text-secondary">{RELAY_TEXT[relay]}</span>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
            {groups.map((g) => {
              const rows = sessionList.filter((s) => s.status === g.status);
              if (rows.length === 0) return null;
              return (
                <div key={g.status} className="mb-2 last:mb-0">
                  <div className="px-1 pb-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    {g.label} · {rows.length}
                  </div>
                  {rows.map((s) => (
                    <SessionRow key={s.id} session={s} active={s.id === activeSessionId} onClick={() => onSelectSession(s.id)} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-border-subtle px-3 py-2.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Current Experiment</div>
            <div className="mt-0.5 font-mono text-[11px] text-teal">{currentSlug}/</div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
            <FileTree nodes={tree} depth={0} activeFilePath={activeFilePath} onSelect={onSelectFile} />
          </div>
        </div>
      )}
    </aside>
  );
}

function SessionRow({ session, active, onClick }: { session: ChatSession; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative mb-1 w-full rounded-sm border px-2.5 py-2 text-left transition-colors',
        active ? 'border-border-strong bg-surface-2' : 'border-transparent hover:border-border-subtle hover:bg-surface-2',
      )}
    >
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-teal" />}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-text-secondary">{session.id}</span>
        <StatusBadge value={session.status} tone={STATUS_TONE[session.status]} showDot />
      </div>
      <div className="mt-0.5 line-clamp-1 text-[13px] text-text">{session.title}</div>
      <div className="mt-0.5 line-clamp-1 font-mono text-[10px] text-text-muted">{session.slug.replace('experiments/', '')}</div>
      <div className="mt-1 font-mono text-[10px] text-text-muted">{session.lastUpdated}</div>
    </button>
  );
}

function FileTree({
  nodes,
  depth,
  activeFilePath,
  onSelect,
}: {
  nodes: FileNode[];
  depth: number;
  activeFilePath: string | null;
  onSelect: (n: FileNode) => void;
}) {
  return (
    <div>
      {nodes.map((node) => (
        <FileRow key={node.path} node={node} depth={depth} activeFilePath={activeFilePath} onSelect={onSelect} />
      ))}
    </div>
  );
}

function FileRow({
  node,
  depth,
  activeFilePath,
  onSelect,
}: {
  node: FileNode;
  depth: number;
  activeFilePath: string | null;
  onSelect: (n: FileNode) => void;
}) {
  const [open, setOpen] = useState(true);
  const Icon = fileIcon(node);
  const isActive = activeFilePath === node.path;

  if (node.kind === 'dir') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 rounded-sm py-1 pr-2 text-text-secondary hover:bg-surface-2"
          style={{ paddingLeft: depth * 12 + 4 }}
        >
          <ChevronRight className={cn('size-3.5 shrink-0 text-text-muted transition-transform', open && 'rotate-90')} />
          <Folder className="size-3.5 shrink-0 text-text-muted" />
          <span className="font-mono text-[12px]">{node.name}</span>
        </button>
        {open && node.children && <FileTree nodes={node.children} depth={depth + 1} activeFilePath={activeFilePath} onSelect={onSelect} />}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      title={node.generated && node.generatedAt ? `Generated ${node.generatedAt}` : undefined}
      className={cn(
        'flex w-full items-center gap-1.5 rounded-sm py-1 pr-2 transition-colors',
        isActive ? 'bg-surface-2 text-text' : 'text-text-secondary hover:bg-surface-2',
      )}
      style={{ paddingLeft: depth * 12 + 18 }}
    >
      <Icon className="size-3.5 shrink-0 text-text-muted" />
      <span className="truncate font-mono text-[12px]">{node.name}</span>
      {node.generated && (
        <span className="ml-auto rounded-sm border border-teal/30 bg-teal/10 px-1 font-mono text-[9px] uppercase text-teal">new</span>
      )}
      {!node.generated && node.modified && <span className="ml-auto size-1.5 rounded-full bg-amber" />}
    </button>
  );
}

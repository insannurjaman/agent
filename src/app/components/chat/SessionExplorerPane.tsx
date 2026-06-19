import { Plus } from 'lucide-react';
import { type ChatSession, type SessionStatus } from '../../data/chat';
import { StatusBadge } from '../common/StatusBadge';
import { cn } from '../ui/utils';

type RelayLabel = 'connected' | 'connecting' | 'disconnected' | 'not-configured';

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

export function SessionExplorerPane({
  sessionList,
  activeSessionId,
  onSelectSession,
  onNewChat,
  relay,
}: {
  sessionList: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  relay: RelayLabel;
  currentSlug?: string;
  tree?: unknown[];
  activeFilePath?: string | null;
  onSelectFile?: (node: unknown) => void;
}) {
  const groups: { status: SessionStatus; label: string }[] = [
    { status: 'running', label: 'Running' },
    { status: 'completed', label: 'Completed' },
    { status: 'failed', label: 'Failed' },
  ];

  return (
    <aside className="flex w-full shrink-0 flex-col border-r border-border-subtle bg-surface md:w-[280px]">
      <div className="border-b border-border-subtle p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-sm border border-brand-border bg-brand-muted px-3 py-2 text-[13px] text-brand transition-colors hover:bg-brand-surface"
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
        active ? 'border-brand-border bg-brand-muted' : 'border-transparent hover:border-border-subtle hover:bg-surface-2',
      )}
    >
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand" />}
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] text-text">{session.title}</span>
        <StatusBadge value={session.status} tone={STATUS_TONE[session.status]} showDot />
      </div>
      <div className="mt-0.5 font-mono text-[10px] text-text-muted">{session.id} · {session.lastUpdated}</div>
    </button>
  );
}

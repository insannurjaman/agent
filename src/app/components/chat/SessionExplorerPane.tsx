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
      {/* Header with New Chat + relay */}
      <div className="border-b border-border-subtle p-3">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <span className="text-[13px] font-semibold text-text">Quick Agent System</span>
        </div>
        <button
          type="button"
          onClick={onNewChat}
          className="mt-3 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-sm border border-brand-border bg-brand-muted px-3 py-2 text-[13px] text-brand transition-colors hover:bg-brand-surface"
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

      {/* Session list */}
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
      aria-label={`${session.title} — ${session.status}`}
      className={cn(
        'group relative mb-0.5 flex min-h-[44px] w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left transition-colors',
        active
          ? 'bg-brand-muted'
          : 'hover:bg-surface-2',
      )}
    >
      {/* Active indicator — subtle left bar */}
      {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-brand" />}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] text-text">{session.title}</div>
        <div className="font-mono text-[10px] text-text-muted">
          {session.id} · {formatTime(session.lastUpdated)}
        </div>
      </div>
      {session.status === 'running' && (
        <span className="shrink-0 rounded-sm bg-green/15 px-1.5 py-0.5 font-mono text-[9px] uppercase text-green">Live</span>
      )}
      {session.status === 'failed' && (
        <StatusBadge value={session.status} tone={STATUS_TONE[session.status]} showDot />
      )}
    </button>
  );
}

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { X, Plus } from 'lucide-react';
import { navItems } from './navItems';
import { sessions, type ChatSession, type SessionStatus } from '../../data/chat';
import { Drawer } from '../responsive/Drawer';
import { cn } from '../ui/utils';
import type { DrawerTab } from './NavContext';

const STATUS_TONE: Record<SessionStatus, string> = {
  running: 'bg-green',
  completed: 'bg-text-muted',
  failed: 'bg-red',
};

function formatTime(lastUpdated: string): string {
  const match = lastUpdated.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2})/);
  if (!match) return lastUpdated;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[parseInt(match[2], 10) - 1];
  return `${month} ${parseInt(match[3], 10)} · ${match[4]}`;
}

function uniqueSessions(list: ChatSession[]): ChatSession[] {
  const seen = new Set<string>();
  return list.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

export function NavDrawer({
  open,
  onClose,
  initialTab = 'navigation',
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: DrawerTab;
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<DrawerTab>(initialTab);

  // Sync tab when drawer opens with a new initialTab
  if (open) {
    // Use initialTab when opening
  }

  const unique = uniqueSessions(sessions);
  const running = unique.filter((s) => s.status === 'running');
  const completed = unique.filter((s) => s.status === 'completed');
  const failed = unique.filter((s) => s.status === 'failed');

  function handleSessionSelect(id: string) {
    navigate('/chat');
    // Small delay to allow navigation, then close
    setTimeout(() => onClose(), 50);
  }

  function handleNavSelect(to: string) {
    navigate(to);
    onClose();
  }

  function handleNewChat() {
    navigate('/chat');
    onClose();
  }

  return (
    <Drawer open={open} onClose={onClose} side="left" width="w-[min(86vw,320px)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <span className="text-[13px] font-semibold text-text">Quick Agent System</span>
        <button
          type="button"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-sm text-text-muted hover:text-text md:size-9"
          aria-label="Close navigation"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Tabs — sticky below header */}
      <div className="sticky top-0 z-10 flex border-b border-border-subtle bg-surface">
        {(['chats', 'navigation'] as DrawerTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2.5 text-[12px] font-medium uppercase tracking-wide transition-colors',
              tab === t
                ? 'border-b-2 border-brand text-brand'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            {t === 'chats' ? 'Chats' : 'Navigation'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'chats' ? (
          <ChatsTab
            running={running}
            completed={completed}
            failed={failed}
            onNewChat={handleNewChat}
            onSelectSession={handleSessionSelect}
          />
        ) : (
          <NavigationTab onNavigate={handleNavSelect} />
        )}
      </div>
    </Drawer>
  );
}

function ChatsTab({
  running,
  completed,
  failed,
  onNewChat,
  onSelectSession,
}: {
  running: ChatSession[];
  completed: ChatSession[];
  failed: ChatSession[];
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
}) {
  return (
    <>
      {/* New Chat */}
      <div className="border-b border-border-subtle p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-sm bg-brand px-3 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-brand-hover"
        >
          <Plus className="size-4" />
          New Chat
        </button>
      </div>

      {/* Relay status */}
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
        <span className="size-2 rounded-full bg-green" />
        <span className="font-mono text-[11px] text-text-secondary">Claude relay connected</span>
      </div>

      {/* Session groups */}
      <div className="p-3">
        {running.length > 0 && (
          <SessionGroup label="Running" sessions={running} onSelect={onSelectSession} />
        )}
        {completed.length > 0 && (
          <SessionGroup label="Completed" sessions={completed} onSelect={onSelectSession} />
        )}
        {failed.length > 0 && (
          <SessionGroup label="Failed" sessions={failed} onSelect={onSelectSession} />
        )}
      </div>
    </>
  );
}

function SessionGroup({
  label,
  sessions: groupSessions,
  onSelect,
}: {
  label: string;
  sessions: ChatSession[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {label} · {groupSessions.length}
      </div>
      <div className="flex flex-col gap-0.5">
        {groupSessions.map((s) => (
          <SessionRow key={s.id} session={s} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function SessionRow({
  session,
  onSelect,
}: {
  session: ChatSession;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(session.id)}
      className="flex min-h-[44px] w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-surface-2"
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', STATUS_TONE[session.status])} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] text-text-secondary">{session.title}</div>
        <div className="font-mono text-[10px] text-text-muted">
          {session.id} · {formatTime(session.lastUpdated)}
        </div>
      </div>
      {session.status === 'running' && (
        <span className="shrink-0 rounded-sm bg-green/15 px-1.5 py-0.5 font-mono text-[9px] uppercase text-green">Live</span>
      )}
      {session.status === 'failed' && (
        <span className="shrink-0 rounded-sm bg-red/15 px-1.5 py-0.5 font-mono text-[9px] uppercase text-red">Failed</span>
      )}
    </button>
  );
}

function NavigationTab({ onNavigate }: { onNavigate: (to: string) => void }) {
  return (
    <div className="p-3">
      <div className="flex flex-col gap-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => onNavigate(to)}
            className={({ isActive }) =>
              cn(
                'flex min-h-[44px] items-center gap-2.5 rounded-sm px-2.5 text-[13px] transition-colors',
                isActive ? 'bg-brand-muted text-brand' : 'text-text-secondary hover:bg-surface-2',
              )
            }
          >
            <Icon className="size-4 shrink-0" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

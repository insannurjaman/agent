import { NavLink } from 'react-router';
import { X, Plus } from 'lucide-react';
import { navItems } from './navItems';
import { sessions, type ChatSession, type SessionStatus } from '../../data/chat';
import { Drawer } from '../responsive/Drawer';
import { cn } from '../ui/utils';

const STATUS_TONE: Record<SessionStatus, string> = {
  running: 'bg-green',
  completed: 'bg-text-muted',
  failed: 'bg-red',
};

function formatTime(lastUpdated: string): string {
  // "2026-06-17 11:42" → "Jun 17 · 11:42"
  const match = lastUpdated.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2})/);
  if (!match) return lastUpdated;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[parseInt(match[2], 10) - 1];
  return `${month} ${parseInt(match[3], 10)} · ${match[4]}`;
}

// Deduplicate sessions by ID (defensive)
function uniqueSessions(list: ChatSession[]): ChatSession[] {
  const seen = new Set<string>();
  return list.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

export function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const unique = uniqueSessions(sessions);
  const running = unique.filter((s) => s.status === 'running');
  const completed = unique.filter((s) => s.status === 'completed');
  const failed = unique.filter((s) => s.status === 'failed');

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

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* New Chat */}
        <div className="border-b border-border-subtle p-3">
          <NavLink
            to="/chat"
            onClick={onClose}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-sm bg-brand px-3 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-brand-hover"
          >
            <Plus className="size-4" />
            New Chat
          </NavLink>
        </div>

        {/* Relay status */}
        <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
          <span className="size-2 rounded-full bg-green" />
          <span className="font-mono text-[11px] text-text-secondary">Claude relay connected</span>
        </div>

        {/* Conversations */}
        <div className="p-3">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">Conversations</div>
          <div className="flex flex-col gap-0.5">
            {running.map((s) => (
              <SessionRow key={s.id} session={s} onClose={onClose} />
            ))}
            {completed.map((s) => (
              <SessionRow key={s.id} session={s} onClose={onClose} />
            ))}
            {failed.map((s) => (
              <SessionRow key={s.id} session={s} onClose={onClose} />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="border-t border-border-subtle p-3">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">Navigation</div>
          <div className="flex flex-col gap-0.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
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
      </div>
    </Drawer>
  );
}

function SessionRow({ session, onClose }: { session: ChatSession; onClose: () => void }) {
  return (
    <NavLink
      to="/chat"
      onClick={onClose}
      className="flex min-h-[44px] items-center gap-2.5 rounded-sm px-2.5 text-[13px] transition-colors hover:bg-surface-2"
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', STATUS_TONE[session.status])} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-text-secondary">{session.title}</div>
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
    </NavLink>
  );
}

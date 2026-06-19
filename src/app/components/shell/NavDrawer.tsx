import { NavLink } from 'react-router';
import { X, Plus } from 'lucide-react';
import { navItems } from './navItems';
import { sessions } from '../../data/chat';
import { cn } from '../ui/utils';

// Primary mobile navigation drawer with chat history.
export function NavDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/60" />
      <div onClick={(e) => e.stopPropagation()} className="relative flex h-full w-[280px] flex-col border-l border-border-strong bg-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <span className="text-[13px] font-semibold text-text">Quick Agent System</span>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-sm text-text-muted hover:text-text" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {/* New Chat */}
          <div className="border-b border-border-subtle p-3">
            <NavLink
              to="/chat"
              onClick={onClose}
              className="flex items-center gap-2 rounded-sm bg-brand px-3 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-brand-hover"
            >
              <Plus className="size-4" />
              New Chat
            </NavLink>
          </div>

          {/* Chats section */}
          <div className="p-3">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">Chats</div>
            <div className="flex flex-col gap-0.5">
              {sessions.map((s) => (
                <NavLink
                  key={s.id}
                  to="/chat"
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] transition-colors hover:bg-surface-2"
                >
                  <span className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    s.status === 'running' ? 'bg-green' : s.status === 'failed' ? 'bg-red' : 'bg-text-muted',
                  )} />
                  <span className="min-w-0 truncate text-text-secondary">{s.title}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Navigation section */}
          <div className="border-t border-border-subtle p-3">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">Navigation</div>
            <div className="flex flex-col gap-0.5">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[40px] items-center gap-2.5 rounded-sm px-2.5 text-[13px] transition-colors',
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
      </div>
    </div>
  );
}

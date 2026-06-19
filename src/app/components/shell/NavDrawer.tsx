import { NavLink } from 'react-router';
import { X } from 'lucide-react';
import { navItems } from './navItems';
import { cn } from '../ui/utils';

// Mobile "More" drawer listing all destinations.
export function NavDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/60" />
      <div onClick={(e) => e.stopPropagation()} className="relative ml-auto flex h-full w-[280px] flex-col border-l border-border-strong bg-surface">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Navigate</span>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-sm text-text-muted hover:text-text" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex flex-col p-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[44px] items-center gap-3 rounded-sm px-3 text-[14px] transition-colors',
                  isActive ? 'bg-brand-muted text-brand' : 'text-text-secondary hover:bg-surface-2',
                )
              }
            >
              <Icon className="size-[18px] shrink-0 text-current" strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

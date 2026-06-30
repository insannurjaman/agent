import { NavLink } from 'react-router';
import { X } from 'lucide-react';
import { navItems } from './navItems';
import { Drawer } from '../responsive/Drawer';
import { IconButton } from '../common/IconButton';
import { cn } from '../ui/utils';

export function NavDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  function handleNavSelect() {
    onClose();
  }

  return (
    <Drawer open={open} onClose={onClose} side="left" width="w-full sm:w-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <span className="text-[13px] font-semibold text-text">Quick Agent System</span>
        <IconButton icon={X} label="Close navigation" onClick={onClose} className="md:hidden" />
      </div>

      {/* Navigation only — Chats removed (duplicates workspace Sessions panel) */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => handleNavSelect(to)}
              aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
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
    </Drawer>
  );
}

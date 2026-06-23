import { useAuth } from '../../data/auth';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { LogOut, User } from 'lucide-react';

export function ProfileMenu() {
  const { user, logout } = useAuth();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-sm transition-colors hover:bg-surface-2 md:size-9"
          aria-label="Open profile menu"
        >
          <Avatar className="size-7">
            <AvatarFallback className="bg-brand-muted text-[11px] font-medium text-brand">
              {user.initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-56 p-0">
        <div className="border-b border-border-subtle px-3 py-2.5">
          <div className="text-[13px] font-medium text-text">{user.name}</div>
          <div className="text-[11px] text-text-muted">{user.email}</div>
          {user.role && (
            <div className="mt-0.5 font-mono text-[10px] text-text-muted">{user.role}</div>
          )}
        </div>
        <div className="p-1">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-[13px] text-text-secondary hover:bg-surface-2 hover:text-text"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

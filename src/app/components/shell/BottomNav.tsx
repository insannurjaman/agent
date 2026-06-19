import { useState } from 'react';
import { NavLink } from 'react-router';
import { LayoutGrid, Table2, FlaskConical, Share2, Terminal, MoreHorizontal } from 'lucide-react';
import { cn } from '../ui/utils';
import { NavDrawer } from './NavDrawer';

const PRIMARY = [
  { to: '/overview', label: 'Overview', icon: LayoutGrid },
  { to: '/findings', label: 'Findings', icon: Table2 },
  { to: '/experiments', label: 'Experiments', icon: FlaskConical },
  { to: '/graph', label: 'Graph', icon: Share2 },
  { to: '/chat', label: 'Chat', icon: Terminal },
];

export function BottomNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <>
      <nav className="flex shrink-0 items-stretch border-t border-border-subtle bg-surface pb-[env(safe-area-inset-bottom)]">
        {PRIMARY.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 text-text-muted',
                isActive && 'text-brand',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-brand" />}
                <Icon className="size-[18px]" strokeWidth={1.75} />
                <span className="font-mono text-[10px]">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 text-text-muted"
        >
          <MoreHorizontal className="size-[18px]" strokeWidth={1.75} />
          <span className="font-mono text-[10px]">More</span>
        </button>
      </nav>
      {drawerOpen && <NavDrawer onClose={() => setDrawerOpen(false)} />}
    </>
  );
}

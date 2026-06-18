import { Outlet } from 'react-router';
import { NavRail } from './NavRail';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

export function AppShell() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-text">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        {/* Icon rail on tablet/desktop only */}
        <div className="hidden md:flex">
          <NavRail />
        </div>
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      {/* Bottom navigation on mobile only */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

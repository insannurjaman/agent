import { Outlet, useLocation } from 'react-router';
import { NavRail } from './NavRail';
import { TopBar } from './TopBar';

export function AppShell() {
  const location = useLocation();
  const isChat = location.pathname === '/chat' || location.pathname === '/chat/';

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-text">
      {/* TopBar hidden on mobile chat (chat has its own mobile header) */}
      <div className={isChat ? 'hidden md:block' : ''}>
        <TopBar />
      </div>
      <div className="flex min-h-0 flex-1">
        {/* Icon rail on tablet/desktop only */}
        <div className="hidden md:flex">
          <NavRail />
        </div>
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

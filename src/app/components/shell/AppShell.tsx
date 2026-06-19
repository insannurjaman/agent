import { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { NavRail } from './NavRail';
import { TopBar } from './TopBar';
import { NavDrawer } from './NavDrawer';
import { NavContext, type DrawerTab } from './NavContext';

export function AppShell() {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('navigation');

  const openNav = useCallback((tab?: DrawerTab) => {
    if (tab) setDrawerTab(tab);
    setMobileNavOpen(true);
  }, []);

  const closeNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <NavContext.Provider value={{ openNav, closeNav }}>
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
      </div>

      {/* Global mobile navigation drawer */}
      <NavDrawer open={mobileNavOpen} onClose={closeNav} initialTab={drawerTab} />
    </NavContext.Provider>
  );
}

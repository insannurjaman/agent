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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded-sm focus:bg-brand focus:px-3 focus:py-2 focus:text-[13px] focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-brand-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-text">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          {/* Icon rail on tablet/desktop only */}
          <div className="hidden md:flex">
            <NavRail />
          </div>
          <main id="main-content" className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global mobile navigation drawer */}
      <NavDrawer open={mobileNavOpen} onClose={closeNav} initialTab={drawerTab} />
    </NavContext.Provider>
  );
}

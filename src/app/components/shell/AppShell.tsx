import { useState, useCallback, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { NavRail } from './NavRail';
import { TopBar } from './TopBar';
import { NavDrawer } from './NavDrawer';
import { NavContext, type DrawerTab } from './NavContext';

export function AppShell() {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('navigation');
  const mainRef = useRef<HTMLElement>(null);
  const prevPathname = useRef(location.pathname);

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

  // Route focus management: move focus to main content after route changes
  useEffect(() => {
    if (location.pathname !== prevPathname.current) {
      prevPathname.current = location.pathname;
      requestAnimationFrame(() => {
        if (!mainRef.current) return;
        // Try to focus the first heading in the new route
        const heading = mainRef.current.querySelector<HTMLElement>('h1, h2, [role="heading"]');
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus();
          heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), { once: true });
        } else {
          mainRef.current.setAttribute('tabindex', '-1');
          mainRef.current.focus();
          mainRef.current.addEventListener('blur', () => mainRef.current?.removeAttribute('tabindex'), { once: true });
        }
      });
    }
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
          <main ref={mainRef} id="main-content" className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global mobile navigation drawer */}
      <NavDrawer open={mobileNavOpen} onClose={closeNav} initialTab={drawerTab} />
    </NavContext.Provider>
  );
}

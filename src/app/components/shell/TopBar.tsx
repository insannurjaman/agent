import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Settings, Menu } from 'lucide-react';
import { BackendStatusPill } from './BackendStatusPill';
import { CommandSheet } from './CommandSheet';
import { ThemeToggle } from './ThemeToggle';
import { NavDrawer } from './NavDrawer';

function SystemLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden className="shrink-0">
      <rect x="0.5" y="0.5" width="21" height="21" rx="2" stroke="var(--border-strong)" />
      {[3, 8, 13, 18].map((x) =>
        [3, 8, 13, 18].map((y) => {
          const on = (x + y) % 3 === 0;
          return <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill={on ? 'var(--brand-primary)' : 'var(--border-subtle)'} />;
        }),
      )}
    </svg>
  );
}

export function TopBar() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K to focus search
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (window.innerWidth >= 768) {
          inputRef.current?.focus();
        } else {
          setSearchOpen(true);
        }
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setDrawerOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [navigate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    } else {
      navigate('/search');
    }
  }

  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b border-border-subtle bg-surface px-3 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 shrink-0 items-center gap-2.5">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex size-11 items-center justify-center rounded-sm text-text-muted hover:text-text md:hidden"
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
          >
            <Menu className="size-5" />
          </button>
          <SystemLogo />
          <span className="text-[14px] font-semibold text-text md:hidden xl:inline">
            Quick Agent System
          </span>
          <span className="hidden font-mono text-[13px] font-semibold tracking-wide text-text md:inline xl:hidden">
            QAS
          </span>
          <span className="hidden rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-muted xl:inline">
            v0.1.0
          </span>
        </div>

        {/* Desktop / tablet search input */}
        <form onSubmit={handleSubmit} className="group mx-auto hidden min-w-0 max-w-xl flex-1 md:block">
          <div className="flex items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-3 py-1.5 transition-colors hover:border-border-strong focus-within:border-brand-border focus-within:bg-code-surface focus-within:ring-2 focus-within:ring-brand-ring">
            <Search className="size-4 shrink-0 text-text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
              placeholder="Search findings, open questions, experiments, reports…"
            />
            <kbd className="hidden rounded-sm border border-border-strong px-1 font-mono text-[10px] text-text-muted lg:inline">⌘K</kbd>
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* Mobile search icon */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex size-11 items-center justify-center rounded-sm border border-border-subtle bg-surface-2 text-text-muted outline-none transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-text focus-visible:ring-2 focus-visible:ring-brand-ring md:hidden"
            aria-label="Search"
          >
            <Search className="size-4" />
          </button>

          <div className="hidden md:block">
            <BackendStatusPill />
          </div>
          <ThemeToggle />

          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-sm border border-border-subtle bg-surface-2 text-text-muted outline-none transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-text focus-visible:ring-2 focus-visible:ring-brand-ring md:size-9"
            aria-label="Settings"
          >
            <Settings className="size-4" />
          </button>
        </div>
      </header>

      {searchOpen && <CommandSheet onClose={() => setSearchOpen(false)} />}
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

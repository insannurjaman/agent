import { useState } from 'react';
import { Search, Settings } from 'lucide-react';
import { useNavigate } from 'react-router';
import { BackendStatusPill } from './BackendStatusPill';
import { CommandSheet } from './CommandSheet';

function SystemLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden className="shrink-0">
      <rect x="0.5" y="0.5" width="21" height="21" rx="2" stroke="#343c43" />
      {[3, 8, 13, 18].map((x) =>
        [3, 8, 13, 18].map((y) => {
          const on = (x + y) % 3 === 0;
          return <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill={on ? '#ff3e01' : '#252b30'} />;
        }),
      )}
    </svg>
  );
}

export function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border-subtle bg-surface px-3 sm:gap-3 sm:px-4">
      <div className="flex min-w-0 shrink-0 items-center gap-2.5">
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
      <div className="group mx-auto hidden min-w-0 max-w-xl flex-1 items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-3 py-1.5 transition-colors hover:border-border-strong focus-within:border-brand-border focus-within:bg-code-surface focus-within:ring-2 focus-within:ring-brand-ring md:flex">
        <Search className="size-4 shrink-0 text-text-muted" />
        <input
          className="w-full bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
          placeholder="Search findings, open questions, experiments, reports…"
        />
        <kbd className="hidden rounded-sm border border-border-strong px-1 font-mono text-[10px] text-text-muted lg:inline">⌘K</kbd>
      </div>

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

        {/* Backend status: full pill on md+, dot on mobile */}
        <div className="hidden md:block">
          <BackendStatusPill />
        </div>
        <button
          type="button"
          onClick={() => navigate('/status')}
          aria-label="Backend status"
          className="flex size-11 items-center justify-center rounded-sm border border-border-subtle bg-surface-2 outline-none transition-colors hover:border-border-strong hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-brand-ring md:hidden"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-green" />
          </span>
        </button>

        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-sm border border-border-subtle bg-surface-2 text-text-muted outline-none transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-text focus-visible:ring-2 focus-visible:ring-brand-ring md:size-9"
          aria-label="Settings"
        >
          <Settings className="size-4" />
        </button>
      </div>

      {searchOpen && <CommandSheet onClose={() => setSearchOpen(false)} />}
    </header>
  );
}

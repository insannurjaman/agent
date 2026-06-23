import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useNavContext } from './NavContext';
import { ThemeToggle } from './ThemeToggle';
import { ProfileMenu } from './ProfileMenu';

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
  const { openNav } = useNavContext();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border-subtle bg-surface px-3 sm:gap-3 sm:px-4">
      <div className="flex min-w-0 shrink-0 items-center gap-2.5">
        <button
          type="button"
          onClick={() => openNav()}
          className="flex size-11 items-center justify-center rounded-sm text-text-muted hover:text-text md:hidden"
          aria-label="Open navigation"
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

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
}

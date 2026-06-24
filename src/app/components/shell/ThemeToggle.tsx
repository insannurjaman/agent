import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={theme === 'dark'}
      className="flex size-11 items-center justify-center rounded-sm border border-border-subtle bg-surface-2 text-text-muted outline-none transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-text focus-visible:ring-2 focus-visible:ring-brand-ring md:size-9"
      aria-label="Toggle theme"
    >
      <Sun className="size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" aria-hidden="true" />
      <Moon className="size-4 absolute rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" aria-hidden="true" />
    </button>
  );
}

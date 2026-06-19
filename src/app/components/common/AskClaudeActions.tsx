import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../ui/utils';

// Read-only product rule: knowledge is mutated through Claude chat, never via
// direct Edit/Delete/Save/Resolve. These are the only "write-intent" actions.

export function AskClaudeButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-10 w-full items-center gap-2 rounded-sm border border-brand-border bg-brand-muted px-3 py-2 text-left text-[13px] text-brand outline-none transition-colors hover:bg-brand-surface focus-visible:ring-2 focus-visible:ring-brand-ring disabled:pointer-events-none disabled:opacity-50"
    >
      <Sparkles className="size-3.5 shrink-0" />
      {children}
    </button>
  );
}

export function NavActionButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-10 w-full items-center gap-2 rounded-sm border border-border-strong bg-surface-2 px-3 py-2 text-left text-[13px] text-text-secondary outline-none transition-colors hover:border-brand-border hover:bg-surface-hover hover:text-text focus-visible:ring-2 focus-visible:ring-brand-ring disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

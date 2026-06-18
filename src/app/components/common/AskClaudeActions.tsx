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
      className="flex w-full items-center gap-2 rounded-sm border border-purple/30 bg-purple/10 px-3 py-2 text-left text-[13px] text-purple transition-colors hover:bg-purple/15"
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
        'flex w-full items-center gap-2 rounded-sm border border-border-strong bg-surface-2 px-3 py-2 text-left text-[13px] text-text-secondary transition-colors hover:border-teal/40 hover:text-text',
        className,
      )}
    >
      {children}
    </button>
  );
}

import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { cn } from '../ui/utils';

// Read-only product rule: knowledge is mutated through Claude chat, never via
// direct Edit/Delete/Save/Resolve. These are the only "write-intent" actions.

export function AskClaudeButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <Button variant="ghost" size="md" onClick={onClick} className="w-full justify-start gap-2">
      <Sparkles className="size-3.5 shrink-0" />
      {children}
    </Button>
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
    <Button variant="secondary" size="md" onClick={onClick} className={cn('w-full justify-start gap-2', className)}>
      {children}
    </Button>
  );
}

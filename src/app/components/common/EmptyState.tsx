import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

// Typed empty/loading/error state with exact brief copy — no generic filler.
export function EmptyState({
  icon: Icon = Inbox,
  title,
  hint,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-sm border border-border-strong bg-surface-2">
        <Icon className="size-5 text-text-muted" />
      </div>
      <div className="text-[14px] text-text-secondary">{title}</div>
      {hint && <div className="mt-1 max-w-sm text-[13px] text-text-muted">{hint}</div>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

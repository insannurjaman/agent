import type { ReactNode } from 'react';
import { cn } from '../ui/utils';

// Monospace identifier (F-IDs, Q-IDs, slugs, paths, timestamps).
export function MonoId({
  children,
  className,
  muted,
}: {
  children: ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <span className={cn('font-mono text-[13px]', muted ? 'text-text-muted' : 'text-text-secondary', className)}>
      {children}
    </span>
  );
}

// Uppercase micro-label + value row used throughout inspectors.
export function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-1.5 border-b border-border-subtle last:border-0">
      <div className="font-mono text-[11px] uppercase tracking-wider text-text-muted pt-0.5">{label}</div>
      <div className="text-[13px] text-text">{children}</div>
    </div>
  );
}

// Screen title block.
export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between border-b border-border-subtle px-6 py-4 bg-surface">
      <div>
        <h1 className="text-text" style={{ fontSize: '18px' }}>
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-text-secondary">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

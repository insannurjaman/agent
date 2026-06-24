import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { MonoId } from './primitives';
import { IconButton } from './IconButton';

export function InspectorFrame({
  kicker,
  id,
  onClose,
  children,
}: {
  kicker: string;
  id: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">{kicker}</span>
          <MonoId className="text-brand">{id}</MonoId>
        </div>
        <IconButton icon={X} label="Close inspector" onClick={onClose} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">{children}</div>
    </aside>
  );
}

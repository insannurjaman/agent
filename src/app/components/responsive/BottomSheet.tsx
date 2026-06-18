import type { ReactNode } from 'react';
import { X } from 'lucide-react';

// Mobile bottom sheet: backdrop + bottom-anchored panel with a grab bar.
export function BottomSheet({
  title,
  onClose,
  children,
  footer,
}: {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="relative flex max-h-[85vh] flex-col rounded-t-md border-t border-border-strong bg-surface pb-[env(safe-area-inset-bottom)] shadow-2xl">
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <div className="mx-auto h-1 w-9 rounded-full bg-border-strong" />
        </div>
        {title && (
          <div className="flex items-center justify-between border-b border-border-subtle px-4 pb-2.5">
            <h2 className="text-text" style={{ fontSize: '14px' }}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-sm text-text-muted hover:text-text"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-auto px-4 py-3">{children}</div>
        {footer && <div className="border-t border-border-subtle px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}

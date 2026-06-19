import { useEffect, type ReactNode } from 'react';
import { cn } from '../ui/utils';

// Slide-over drawer used for tablet inspectors and the Chat sessions/files pane.
export function Drawer({
  side = 'right',
  width = 'w-[360px]',
  onClose,
  children,
}: {
  side?: 'left' | 'right';
  width?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <button type="button" aria-label="Close drawer" className="absolute inset-0 bg-black/60" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative flex h-full flex-col bg-surface shadow-2xl',
          width,
          side === 'right' ? 'ml-auto border-l border-border-strong' : 'mr-auto border-r border-border-strong',
        )}
      >
        {children}
      </div>
    </div>
  );
}

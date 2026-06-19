import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../ui/utils';

// Accessible slide-over drawer with open/close transitions and body scroll lock.
export function Drawer({
  open = true,
  side = 'right',
  width = 'w-[360px]',
  onClose,
  children,
}: {
  open?: boolean;
  side?: 'left' | 'right';
  width?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Escape key closes
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Focus trap + restore
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      // Focus the panel after transition
      requestAnimationFrame(() => panelRef.current?.focus());
    } else if (previousFocus.current) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, [open]);

  // Close on viewport resize above mobile
  useEffect(() => {
    if (!open) return;
    function onResize() {
      if (window.innerWidth >= 768) onClose();
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          'relative flex h-full flex-col bg-surface shadow-2xl outline-none transition-transform duration-200 ease-out',
          width,
          side === 'right' ? 'ml-auto border-l border-border-strong' : 'mr-auto border-r border-border-strong',
        )}
      >
        {children}
      </div>
    </div>
  );
}

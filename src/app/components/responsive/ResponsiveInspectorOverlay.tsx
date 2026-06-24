import { useRef, useEffect, type ReactNode } from 'react';
import { cn } from '../ui/utils';

export function ResponsiveInspectorOverlay({
  children,
  onDismiss,
  isOpen,
}: {
  children: ReactNode;
  onDismiss?: () => void;
  isOpen: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => {
        panelRef.current?.focus();
      });
    }
    return () => {
      if (!isOpen && previousFocus.current) {
        previousFocus.current.focus();
        previousFocus.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && onDismiss && isOpen) {
        e.preventDefault();
        onDismiss();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onDismiss, isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for overlay modes (lg only, not 2xl) */}
      <div
        className="fixed inset-0 z-30 bg-black/50 2xl:hidden"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Inspector"
        tabIndex={-1}
        className={cn(
          'fixed inset-0 z-40 flex flex-col bg-surface',
          'lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[480px] lg:border-l lg:border-border-subtle lg:shadow-2xl',
          '2xl:static 2xl:inset-auto 2xl:z-auto 2xl:w-[480px] 2xl:shadow-none 2xl:border-l 2xl:border-border-subtle',
        )}
      >
        {children}
      </div>
    </>
  );
}

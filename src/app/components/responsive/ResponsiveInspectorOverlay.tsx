import { useRef, useEffect, type ReactNode } from 'react';

export function ResponsiveInspectorOverlay({
  children,
  onDismiss,
  showBackdrop = false,
}: {
  children: ReactNode;
  onDismiss?: () => void;
  showBackdrop?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement;
    return () => {
      previousFocus.current?.focus();
    };
  }, []);

  // Escape key closes on mobile overlay
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && onDismiss) {
        e.preventDefault();
        onDismiss();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onDismiss]);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Inspector"
      className="fixed inset-0 z-50 lg:static lg:inset-auto lg:z-auto lg:flex"
    >
      {showBackdrop && (
        <button
          type="button"
          aria-label="Close inspector"
          className="absolute inset-0 bg-black/50 lg:hidden"
          onClick={onDismiss}
        />
      )}
      {children}
    </div>
  );
}

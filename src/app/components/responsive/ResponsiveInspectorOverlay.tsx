import type { ReactNode } from 'react';

export function ResponsiveInspectorOverlay({
  children,
  onDismiss,
  showBackdrop = false,
}: {
  children: ReactNode;
  onDismiss?: () => void;
  showBackdrop?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 lg:static lg:inset-auto lg:z-auto lg:flex">
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

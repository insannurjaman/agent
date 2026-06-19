import { Search, X } from 'lucide-react';

// Full-screen mobile search overlay.
export function CommandSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2 border-b border-border-subtle bg-surface px-3 py-3">
        <div className="flex flex-1 items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-3 py-2 focus-within:border-brand-border">
          <Search className="size-4 shrink-0 text-text-muted" />
          <input
            autoFocus
            className="w-full bg-transparent text-[14px] text-text outline-none placeholder:text-text-muted"
            placeholder="Search findings, questions, experiments, reports…"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-sm border border-border-subtle text-text-muted hover:text-text"
          aria-label="Close search"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="flex-1 px-4 py-6">
        <p className="font-mono text-[12px] text-text-muted">
          Type to search across findings, open questions, experiments, and reports.
        </p>
      </div>
    </div>
  );
}

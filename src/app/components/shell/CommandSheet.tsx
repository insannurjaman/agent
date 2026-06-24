import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Search, X } from 'lucide-react';

export function CommandSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    onClose();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    } else {
      navigate('/search');
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-50 flex flex-col bg-background pt-[env(safe-area-inset-top)]"
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-b border-border-subtle bg-surface px-3 py-3">
        <div className="flex flex-1 items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-3 py-2 focus-within:border-brand-border">
          <Search className="size-4 shrink-0 text-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search findings, questions, experiments, reports"
            className="w-full bg-transparent text-[14px] text-text outline-none placeholder:text-text-muted"
            placeholder="Search findings, questions, experiments, reports…"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-border-subtle text-text-muted hover:text-text"
          aria-label="Close search"
        >
          <X className="size-4" />
        </button>
      </form>
      <div className="flex-1 px-4 py-6">
        <p className="font-mono text-[12px] text-text-muted">
          Type to search across findings, open questions, experiments, and reports.
        </p>
      </div>
    </div>
  );
}

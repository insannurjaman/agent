import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown, Plus } from 'lucide-react';
import { IconButton } from '../common/IconButton';
import { cn } from '../ui/utils';

const MODES = [
  { label: 'Ask', desc: 'General questions' },
  { label: 'Investigate', desc: 'Deep analysis' },
  { label: 'Write Report', desc: 'Generate report' },
  { label: 'Update Knowledge', desc: 'Modify findings' },
];

const SUGGESTED_CONTEXT = ['F-0050', 'Q-0014', 'REPORT.md'];

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export function NewChatModal({
  onClose,
  onStart,
}: {
  onClose: () => void;
  onStart: (slug: string, prompt: string, context: string[]) => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState<string[]>(['F-0050', 'Q-0014']);
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState('Investigate');
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Save previous focus
  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement;
    return () => {
      previousFocus.current?.focus();
    };
  }, []);

  // Auto-focus textarea
  useEffect(() => {
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, []);

  // Escape key
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

  // Focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-chat-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="w-full max-w-md rounded-sm border border-border-strong bg-surface shadow-2xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 id="new-chat-title" className="text-[15px] font-semibold text-text">New chat</h2>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>

        {/* Body */}
        <div className="space-y-4 px-4 py-4">
          {/* Mode */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Mode</label>
            <div className="grid grid-cols-2 gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setMode(m.label)}
                  aria-pressed={mode === m.label}
                  className={cn(
                    'rounded-sm border px-3 py-2 text-left text-[12px] transition-colors',
                    mode === m.label
                      ? 'border-brand-border bg-brand-muted text-brand'
                      : 'border-border-subtle bg-surface-2 text-text-secondary hover:text-text',
                  )}
                >
                  <div className="font-medium">{m.label}</div>
                  <div className="text-[10px] text-text-muted">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Context */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">Context</label>
            <div className="flex flex-wrap gap-1.5">
              {context.map((c) => (
                <span key={c} className="flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1 font-mono text-[11px] text-text-secondary">
                  {c}
                  <button
                    type="button"
                    onClick={() => setContext((prev) => prev.filter((x) => x !== c))}
                    className="ml-0.5 text-text-muted hover:text-text"
                    aria-label={`Remove ${c}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAdding((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={adding}
                  className="flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1 font-mono text-[11px] text-text-muted hover:text-text"
                >
                  <Plus className="size-3" /> Add
                  <ChevronDown className="size-3" />
                </button>
                {adding && (
                  <div role="listbox" className="absolute bottom-full z-20 mb-1 w-40 rounded-sm border border-border-strong bg-popover py-1 shadow-xl">
                    {SUGGESTED_CONTEXT.filter((s) => !context.includes(s)).map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="option"
                        onClick={() => {
                          setContext((prev) => [...prev, s]);
                          setAdding(false);
                        }}
                        className="block w-full px-2.5 py-1.5 text-left font-mono text-[11px] text-text-secondary hover:bg-surface-2 hover:text-text"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label htmlFor="new-chat-prompt" className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              What would you like to investigate?
            </label>
            <textarea
              ref={textareaRef}
              id="new-chat-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe what you want Claude to look into…"
              className="w-full resize-none rounded-sm border border-border-subtle bg-surface-2 px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-text-muted focus:border-brand-border"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-1.5 text-[12px] text-text-secondary hover:text-text"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!prompt.trim()}
            onClick={() => onStart('auto', prompt, context)}
            className={cn(
              'rounded-sm px-3 py-1.5 text-[12px] font-medium transition-colors',
              prompt.trim()
                ? 'bg-brand text-primary-foreground hover:bg-brand-hover'
                : 'cursor-not-allowed bg-surface text-text-muted',
            )}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}

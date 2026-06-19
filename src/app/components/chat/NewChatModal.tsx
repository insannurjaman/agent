import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '../ui/utils';

const MODES: { label: string; desc: string }[] = [
  { label: 'Ask', desc: 'Answer using attached context and repository knowledge.' },
  { label: 'Investigate', desc: 'Create a new experiment and run analysis.' },
  { label: 'Write Report', desc: 'Update REPORT.md through report-writer.' },
  { label: 'Update Knowledge', desc: 'Propose findings or open questions through Claude.' },
];

const SUGGESTED_CONTEXT = ['F-0050', 'Q-0014', 'REPORT.md'];

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
  const [mode, setMode] = useState(MODES[1].label);

  const addable = SUGGESTED_CONTEXT.filter((c) => !context.includes(c));

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="flex max-h-full w-full max-w-md flex-col rounded-sm border border-border-strong bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 className="text-[15px] font-medium text-text">New chat</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-6 items-center justify-center rounded-sm text-text-muted hover:text-text"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
          <label className="mb-3 block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-muted">What do you want to do?</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe your task…"
              className="w-full resize-none rounded-sm border border-border-subtle bg-surface-2 px-3 py-2 text-[13px] text-text outline-none placeholder:text-text-muted focus:border-brand-border"
            />
          </label>

          <label className="mb-3 block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-muted">Context</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {context.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-text-secondary"
                >
                  {c}
                  <button type="button" onClick={() => setContext((p) => p.filter((x) => x !== c))} className="text-text-muted hover:text-text">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAdding((v) => !v)}
                  className="flex items-center gap-1 rounded-sm border border-border-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-text-secondary hover:text-text"
                >
                  <Plus className="size-3" /> Add
                </button>
                {adding && addable.length > 0 && (
                  <div className="absolute z-10 mt-1 w-48 rounded-sm border border-border-strong bg-popover py-1 shadow-xl">
                    {addable.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setContext((p) => [...p, c]);
                          setAdding(false);
                        }}
                        className="block w-full px-2.5 py-1.5 text-left font-mono text-[11px] text-text-secondary hover:bg-surface-2 hover:text-text"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </label>

          <label className="mb-3 block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-muted">Mode</span>
            <div className="grid grid-cols-2 gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setMode(m.label)}
                  className={cn(
                    'rounded-sm border px-2.5 py-1.5 text-left transition-colors',
                    mode === m.label ? 'border-brand-border bg-brand-muted' : 'border-border-subtle bg-surface hover:border-border-strong',
                  )}
                >
                  <div className="text-[12px] text-text">{m.label}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-text-muted">{m.desc}</div>
                </button>
              ))}
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-border-strong bg-surface-2 px-3 py-1.5 text-[12px] text-text-secondary hover:text-text"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!prompt.trim()}
            onClick={() => onStart('auto', prompt, context)}
            className={cn(
              'rounded-sm border px-3 py-1.5 text-[12px] transition-colors',
              prompt.trim()
                ? 'border-brand-border bg-brand text-primary-foreground hover:bg-brand-hover'
                : 'cursor-not-allowed border-border-subtle bg-surface text-text-muted',
            )}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}

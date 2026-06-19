import { useState } from 'react';
import { X, FolderPlus, Plus, Folder, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { sessions } from '../../data/chat';
import { cn } from '../ui/utils';

const MODES: { label: string; desc: string }[] = [
  { label: 'Ask existing knowledge', desc: 'Answer using attached context and repository knowledge.' },
  { label: 'Investigate with new experiment', desc: 'Create a new experiment directory and run analysis.' },
  { label: 'Generate report', desc: 'Update REPORT.md through report-writer.' },
  { label: 'Update knowledge through Claude', desc: 'Propose findings or open questions, confirmed through Claude.' },
];

const SUGGESTED_CONTEXT = ['F-0050', 'Q-0014', 'experiments/2026-06-08_anomaly_check', 'REPORT.md'];

function slugFromPrompt(prompt: string) {
  const stem =
    prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .join('_') || 'session';
  return `experiments/2026-06-17_${stem}`;
}

type SlugValidity = 'valid' | 'duplicate' | 'invalid';

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

  const slug = slugFromPrompt(prompt || 'roll gap variance');
  const validity: SlugValidity = /[^a-z0-9_/-]/.test(slug.replace('experiments/', ''))
    ? 'invalid'
    : sessions.some((s) => s.slug === slug)
      ? 'duplicate'
      : 'valid';

  const addable = SUGGESTED_CONTEXT.filter((c) => !context.includes(c));

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="flex max-h-full w-full max-w-lg flex-col rounded-sm border border-border-strong bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <div>
            <h2 className="text-text" style={{ fontSize: '15px' }}>
              Start new Claude session
            </h2>
            <p className="mt-0.5 font-mono text-[11px] text-text-muted">
              Each chat session is associated with exactly one experiment directory.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-6 items-center justify-center rounded-sm text-text-muted hover:text-text"
            aria-label="Cancel"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
          <Field label="Prompt">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe what you want Claude to investigate…"
              className="w-full resize-none rounded-sm border border-border-subtle bg-surface-2 px-3 py-2 text-[13px] text-text outline-none placeholder:text-text-muted focus:border-brand-border"
            />
          </Field>

          <Field label="Initial context">
            <div className="flex flex-wrap items-center gap-1.5">
              {context.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1 rounded-sm border border-brand-border bg-brand-muted px-1.5 py-0.5 font-mono text-[11px] text-brand"
                >
                  {c.replace('experiments/', 'experiment:')}
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
                  <Plus className="size-3" /> Add context
                </button>
                {adding && addable.length > 0 && (
                  <div className="absolute z-10 mt-1 w-56 rounded-sm border border-border-strong bg-popover py-1 shadow-xl">
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
          </Field>

          <Field label="Experiment slug (auto-generated)">
            <div
              className={cn(
                'rounded-sm border bg-surface-2 px-3 py-2 font-mono text-[12px]',
                validity === 'valid' ? 'border-border-subtle text-brand' : validity === 'duplicate' ? 'border-amber/40 text-amber' : 'border-red/40 text-red',
              )}
            >
              {slug}
            </div>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px]">
              {validity === 'valid' && (
                <span className="flex items-center gap-1 text-green">
                  <CheckCircle2 className="size-3" /> Valid slug · fixed once session starts
                </span>
              )}
              {validity === 'duplicate' && (
                <span className="flex items-center gap-1 text-amber">
                  <AlertTriangle className="size-3" /> Duplicate slug — a session already uses this directory
                </span>
              )}
              {validity === 'invalid' && (
                <span className="flex items-center gap-1 text-red">
                  <AlertTriangle className="size-3" /> Invalid characters in slug
                </span>
              )}
            </div>
          </Field>

          <Field label="Working directory preview">
            <div className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-2 font-mono text-[12px] text-text-secondary">
              <div className="text-brand">{slug}/</div>
              <div className="mt-1 space-y-0.5 pl-3 text-text-muted">
                <div className="flex items-center gap-1.5">
                  <FileText className="size-3" /> README.md
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="size-3" /> REPORT.md
                </div>
                <div className="flex items-center gap-1.5">
                  <Folder className="size-3" /> outputs/
                </div>
              </div>
            </div>
          </Field>

          <Field label="Mode">
            <div className="grid grid-cols-1 gap-1.5">
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
          </Field>

          <p className="mt-1 flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2.5 py-1.5 font-mono text-[11px] text-text-muted">
            <FolderPlus className="size-3.5 shrink-0 text-brand" />
            Each chat session is associated with one experiment directory.
          </p>
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
            disabled={validity !== 'valid'}
            onClick={() => onStart(slug, prompt, context)}
            className={cn(
              'rounded-sm border px-3 py-1.5 text-[12px] transition-colors',
              validity === 'valid'
                ? 'border-brand-border bg-brand text-primary-foreground hover:bg-brand-hover'
                : 'cursor-not-allowed border-border-subtle bg-surface text-text-muted',
            )}
          >
            Start session
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
      {children}
    </label>
  );
}

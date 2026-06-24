import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { X, ShieldCheck } from 'lucide-react';
import type { FindingProposal, QuestionProposal } from '../../data/chat';
import { StatusBadge } from '../common/StatusBadge';
import { MonoId } from '../common/primitives';
import { cn } from '../ui/utils';

export interface ReviewSet {
  findings: FindingProposal[];
  questions: QuestionProposal[];
}

interface Tab {
  key: string;
  label: string;
  kind: 'finding' | 'question';
  finding?: FindingProposal;
  question?: QuestionProposal;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-border-subtle py-2 last:border-0">
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className="text-[13px] text-text">{children}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-muted first:mt-0">{children}</div>;
}

export function ProposalReviewDrawer({
  set,
  onClose,
  onConfirm,
}: {
  set: ReviewSet;
  onClose: () => void;
  onConfirm: (kind: 'finding' | 'question', id: string) => void;
}) {
  const tabs: Tab[] = [
    ...set.findings.map((f) => ({ key: f.findingId, label: `Finding ${f.findingId}`, kind: 'finding' as const, finding: f })),
    ...set.questions.map((q) => ({ key: q.questionId, label: `Open Question ${q.questionId}`, kind: 'question' as const, question: q })),
  ];
  const [active, setActive] = useState(tabs[0]?.key);
  const tab = tabs.find((t) => t.key === active) ?? tabs[0];
  const navigate = useNavigate();
  if (!tab) return null;
  const isFinding = tab.kind === 'finding';

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = tabs.findIndex((t) => t.key === active);
      if (idx === -1) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActive(tabs[(idx + 1) % tabs.length].key);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActive(tabs[(idx - 1 + tabs.length) % tabs.length].key);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setActive(tabs[0].key);
      } else if (e.key === 'End') {
        e.preventDefault();
        setActive(tabs[tabs.length - 1].key);
      }
    },
    [tabs, active],
  );

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-l border-border-subtle bg-surface md:w-[360px] xl:w-[420px]">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h2 className="text-text" style={{ fontSize: '14px' }}>
          Review proposed updates
        </h2>
        <button type="button" onClick={onClose} className="flex min-h-11 min-w-11 items-center justify-center rounded-sm text-text-muted hover:text-text" aria-label="Cancel review">
          <X className="size-4" />
        </button>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div role="tablist" aria-label="Proposals" className="flex gap-0.5 border-b border-border-subtle bg-surface px-2 py-1.5" onKeyDown={handleTabKeyDown}>
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`proposal-tab-${t.key}`}
              aria-selected={t.key === active}
              aria-controls={`proposal-panel-${t.key}`}
              tabIndex={t.key === active ? 0 : -1}
              onClick={() => setActive(t.key)}
              className={cn(
                'rounded-sm px-2.5 py-1 font-mono text-[11px] transition-colors',
                t.key === active ? 'bg-brand-muted text-brand' : 'text-text-muted hover:text-text-secondary',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        <SectionLabel>Proposed fields</SectionLabel>
        <div
          role="tabpanel"
          id={`proposal-panel-${tab.key}`}
          aria-labelledby={`proposal-tab-${tab.key}`}
          className="rounded-sm border border-border-subtle bg-surface-2 px-3"
        >
          {isFinding && tab.finding ? <FindingFields p={tab.finding} /> : tab.question ? <QuestionFields p={tab.question} /> : null}
        </div>

        <SectionLabel>Target</SectionLabel>
        <MonoId className="text-info">{isFinding ? tab.finding!.targetFile : tab.question!.targetFile}</MonoId>

        <SectionLabel>Gateway</SectionLabel>
        <MonoId className="text-text-secondary">{isFinding ? tab.finding!.gateway : tab.question!.gateway}</MonoId>

        <SectionLabel>Execution</SectionLabel>
        <p className="flex items-start gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2.5 py-2 text-[12px] leading-relaxed text-text-muted">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand" />
          Frontend is read-only. Updates are performed through Claude-mediated workflows.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-4 py-3">
        <button type="button" onClick={onClose} className="rounded-sm border border-border-strong bg-surface-2 px-3 py-1.5 text-[12px] text-text-secondary hover:text-text">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            const id = isFinding ? tab.finding!.findingId : tab.question!.questionId;
            navigate(`/chat?ctx=${id}`);
          }}
          className="rounded-sm border border-border-strong bg-surface-2 px-3 py-1.5 text-[12px] text-text-secondary hover:text-text"
        >
          Ask Claude to revise
        </button>
        <button
          type="button"
          onClick={() => onConfirm(tab.kind, isFinding ? tab.finding!.findingId : tab.question!.questionId)}
          className="rounded-sm border border-brand-border bg-brand px-3 py-1.5 text-[12px] text-primary-foreground hover:bg-brand-hover"
        >
          Confirm through Claude
        </button>
      </div>
    </aside>
  );
}

function FindingFields({ p }: { p: FindingProposal }) {
  return (
    <>
      <Field label="ID"><MonoId className="text-brand">{p.findingId}</MonoId></Field>
      <Field label="Title">{p.title}</Field>
      <Field label="Summary"><span className="text-text-secondary">{p.summary}</span></Field>
      <Field label="Evidence"><MonoId className="text-info">{p.evidence}</MonoId></Field>
      <Field label="Confidence"><StatusBadge value={p.confidence} /></Field>
      <Field label="Facets">
        <div className="flex flex-wrap gap-1">
          {p.facets.map((f) => (
            <span key={f} className="rounded-sm border border-border-subtle bg-surface px-1 py-0.5 font-mono text-[10px] text-text-secondary">
              {f}
            </span>
          ))}
        </div>
      </Field>
      <Field label="Supersedes">{p.supersedes ? <MonoId>{p.supersedes}</MonoId> : <span className="text-text-muted">none</span>}</Field>
    </>
  );
}

function QuestionFields({ p }: { p: QuestionProposal }) {
  return (
    <>
      <Field label="ID"><MonoId className="text-amber">{p.questionId}</MonoId></Field>
      <Field label="Title">{p.title}</Field>
      <Field label="Priority"><StatusBadge value={p.priority} showDot={false} /></Field>
      <Field label="Area">{p.area}</Field>
      <Field label="Related"><MonoId className="text-brand">{p.relatedFinding}</MonoId></Field>
    </>
  );
}

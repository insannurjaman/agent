import { useState, useCallback, useEffect, useRef } from 'react';
import { X, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import type { FindingProposal, QuestionProposal } from '../../data/chat';

type ConfirmState = 'idle' | 'loading' | 'success' | 'error';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { IconButton } from '../common/IconButton';
import { Button } from '../common/Button';
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

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sm:grid-cols-[110px_1fr] max-sm:flex max-sm:flex-col max-sm:gap-0.5 grid gap-3 border-b border-border-subtle py-2 last:border-0">
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted shrink-0">{label}</div>
      <div className="min-w-0 text-[13px] text-text [overflow-wrap:anywhere]">{children}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-muted first:mt-0">{children}</div>;
}

function FacetChips({ facets }: { facets: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {facets.map((f) => (
        <span key={f} className="rounded-sm border border-border-subtle bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-secondary whitespace-nowrap">
          {f}
        </span>
      ))}
    </div>
  );
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
  const [confirmState, setConfirmState] = useState<ConfirmState>('idle');

  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Save focus and restore on close
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  // Focus first focusable element when tabs change
  useEffect(() => {
    if (!panelRef.current) return;
    const focusable = getFocusableElements(panelRef.current);
    if (focusable.length > 0) focusable[0].focus();
  }, [active, tab.key]);

  // Escape closes
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Focus trap
  const handlePanelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusable = getFocusableElements(panelRef.current);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, []);

  if (!tab) return null;
  const isFinding = tab.kind === 'finding';
  const isDisabled = confirmState === 'loading' || confirmState === 'success';
  const isConfirming = confirmState === 'loading';

  const handleConfirm = useCallback(() => {
    if (isDisabled) return;
    setConfirmState('loading');
    const id = isFinding ? tab.finding!.findingId : tab.question!.questionId;
    // Use a microtask so the loading state renders before the synchronous handler runs
    queueMicrotask(() => {
      try {
        onConfirm(tab.kind, id);
        setConfirmState('success');
        setTimeout(() => setConfirmState('idle'), 2000);
      } catch {
        setConfirmState('error');
      }
    });
  }, [isDisabled, isFinding, tab, onConfirm]);

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = tabs.findIndex((t) => t.key === active);
      if (idx === -1) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); setActive(tabs[(idx + 1) % tabs.length].key); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setActive(tabs[(idx - 1 + tabs.length) % tabs.length].key); }
      else if (e.key === 'Home') { e.preventDefault(); setActive(tabs[0].key); }
      else if (e.key === 'End') { e.preventDefault(); setActive(tabs[tabs.length - 1].key); }
    },
    [tabs, active],
  );

  const confirmBtnContent = () => {
    if (confirmState === 'loading') return <><Loader2 className="size-4 animate-spin" /> Confirming…</>;
    if (confirmState === 'success') return <><CheckCircle2 className="size-4" /> Confirmed</>;
    return 'Confirm via agent';
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button type="button" aria-label="Close review drawer" tabIndex={-1} onClick={onClose}
        className="absolute inset-0 bg-black/60 cursor-default" />

      {/* Panel */}
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Review proposed updates"
        onKeyDown={handlePanelKeyDown}
        className="fixed inset-y-0 right-0 flex w-full max-w-[100dvw] flex-col border-l border-border-subtle bg-surface shadow-2xl outline-none
          sm:w-[clamp(440px,32vw,520px)]"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 shrink-0 min-h-0">
          <h2 className="text-[14px] font-semibold text-text">Review proposed updates</h2>
          <IconButton icon={X} label="Close review drawer" onClick={onClose} />
        </div>

        {/* ── Tabs ── */}
        {tabs.length > 1 && (
          <div role="tablist" aria-label="Proposals"
            className="flex gap-0.5 border-b border-border-subtle bg-surface px-2 py-1.5 shrink-0 min-h-0 overflow-x-auto"
            onKeyDown={handleTabKeyDown}
          >
            {tabs.map((t) => (
              <button key={t.key} type="button" role="tab" id={`proposal-tab-${t.key}`}
                aria-selected={t.key === active} aria-controls={`proposal-panel-${t.key}`}
                tabIndex={t.key === active ? 0 : -1}
                onClick={() => setActive(t.key)}
                className={cn(
                  'rounded-sm px-2.5 py-1 font-mono text-[11px] whitespace-nowrap transition-colors shrink-0',
                  t.key === active ? 'bg-brand-muted text-brand' : 'text-text-muted hover:text-text-secondary',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Scrollable Content ── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <SectionLabel>Proposed fields</SectionLabel>
          <div role="tabpanel" id={`proposal-panel-${tab.key}`} aria-labelledby={`proposal-tab-${tab.key}`}
            className="rounded-sm border border-border-subtle bg-surface-2 px-3"
          >
            {isFinding && tab.finding ? <FindingFields p={tab.finding} /> : tab.question ? <QuestionFields p={tab.question} /> : null}
          </div>

          <SectionLabel>Target</SectionLabel>
          <MonoId className="text-info [overflow-wrap:anywhere]">{isFinding ? tab.finding!.targetFile : tab.question!.targetFile}</MonoId>

          <SectionLabel>Gateway</SectionLabel>
          <MonoId className="text-text-secondary [overflow-wrap:anywhere]">{isFinding ? tab.finding!.gateway : tab.question!.gateway}</MonoId>

          <SectionLabel>Execution</SectionLabel>
          <p className="flex items-start gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2.5 py-2 text-[12px] leading-relaxed text-text-muted">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand" />
            Frontend is read-only. Updates are performed through the agent-mediated workflows.
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="flex flex-col gap-2 border-t border-border-subtle px-4 py-3 shrink-0 min-h-0">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="ghost" size="sm" disabled={isDisabled}
              onClick={() => {
                const id = isFinding ? tab.finding!.findingId : tab.question!.questionId;
                window.dispatchEvent(new CustomEvent('proposal-revise', { detail: id }));
              }}
            >
              Ask agent to revise
            </Button>
          </div>
          <Button variant="primary" size="md" disabled={isDisabled} onClick={handleConfirm}
            className="w-full justify-center gap-2"
          >
            {confirmBtnContent()}
          </Button>
          {confirmState === 'error' && (
            <p className="text-[11px] text-red text-center">Failed to confirm. Please try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FindingFields({ p }: { p: FindingProposal }) {
  return (
    <>
      <Field label="ID"><MonoId className="text-brand">{p.findingId}</MonoId></Field>
      <Field label="Title">{p.title}</Field>
      <Field label="Summary"><span className="text-text-secondary">{p.summary}</span></Field>
      <Field label="Evidence"><MonoId className="text-info [overflow-wrap:anywhere]">{p.evidence}</MonoId></Field>
      <Field label="Confidence">
        {p.confidence === 'superseded' ? (
          <StatusBadge value="superseded" />
        ) : (
          <ConfidenceIndicator level={p.confidence as 'high' | 'medium-high' | 'medium' | 'low'} />
        )}
      </Field>
      <Field label="Facets"><FacetChips facets={p.facets} /></Field>
      <Field label="Supersedes">{p.supersedes ? <MonoId>{p.supersedes}</MonoId> : <span className="text-text-muted">none</span>}</Field>
    </>
  );
}

function QuestionFields({ p }: { p: QuestionProposal }) {
  return (
    <>
      <Field label="ID"><MonoId className="text-amber">{p.questionId}</MonoId></Field>
      <Field label="Title">{p.title}</Field>
      <Field label="Priority"><PriorityBadge priority={p.priority as 'critical' | 'high' | 'medium' | 'low'} /></Field>
      <Field label="Area">{p.area}</Field>
      <Field label="Related"><MonoId className="text-brand [overflow-wrap:anywhere]">{p.relatedFinding}</MonoId></Field>
    </>
  );
}

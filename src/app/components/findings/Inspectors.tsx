import { FileText, Share2, GitBranch, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Finding, OpenQuestion } from '../../data';
import { getLatestVersion } from '../../data';
import { StatusBadge } from '../common/StatusBadge';
import { MetaRow, MonoId } from '../common/primitives';
import { AskClaudeButton, NavActionButton } from '../common/AskClaudeActions';
import { InspectorFrame } from '../common/InspectorFrame';

function Tags({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span
          key={t}
          className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-text-secondary"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mt-5 mb-2 font-mono text-[11px] uppercase tracking-wider text-text-muted first:mt-0">
      {children}
    </h4>
  );
}

export function FindingInspector({ finding, onClose }: { finding: Finding; onClose: () => void }) {
  const navigate = useNavigate();
  const isSuperseded = finding.confidence === 'superseded' || !!finding.supersededBy;
  const latest = finding.supersededBy ? getLatestVersion(finding.id) : undefined;

  return (
    <InspectorFrame kicker="FINDING" id={finding.id} onClose={onClose}>
      <h3 className="text-[15px] leading-snug text-text">{finding.title}</h3>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusBadge value={finding.category} />
        <StatusBadge value={finding.confidence} />
        {finding.actionable && <StatusBadge value="actionable" tone="brand" />}
      </div>

      {isSuperseded && (
        <div className="mt-4 rounded-sm border border-border-strong bg-surface-2 px-3 py-2.5">
          <div className="font-mono text-[11px] uppercase tracking-wider text-amber">Superseded</div>
          <p className="mt-1 text-[12px] text-text-muted">
            Historical record. Do not use as latest conclusion.
          </p>
          {latest && (
            <button
              type="button"
              onClick={() => navigate(`/findings?focus=${latest}`)}
              className="mt-2 inline-flex items-center gap-1 font-mono text-[12px] text-brand hover:underline"
            >
              Go to Latest Version <MonoId className="text-brand">{latest}</MonoId>
              <ArrowUpRight className="size-3" />
            </button>
          )}
        </div>
      )}

      <SectionLabel>Metadata</SectionLabel>
      <div className="rounded-sm border border-border-subtle bg-surface-2 px-3">
        <MetaRow label="Category">{finding.category}</MetaRow>
        <MetaRow label="Confidence">{finding.confidence}</MetaRow>
        <MetaRow label="Date">
          <MonoId>{finding.date}</MonoId>
        </MetaRow>
        <MetaRow label="Evidence">
          <MonoId className="text-info">{finding.evidence}</MonoId>
        </MetaRow>
        {finding.supersedes && (
          <MetaRow label="Supersedes">
            <MonoId>{finding.supersedes}</MonoId>
          </MetaRow>
        )}
        {finding.supersededBy && (
          <MetaRow label="Superseded By">
            <MonoId>{finding.supersededBy}</MonoId>
          </MetaRow>
        )}
        <MetaRow label="Actionable">{finding.actionable ? 'yes' : 'no'}</MetaRow>
      </div>

      <SectionLabel>Summary</SectionLabel>
      <p className="text-[13px] leading-relaxed text-text-secondary">{finding.summary}</p>

      <SectionLabel>Tags</SectionLabel>
      <Tags items={finding.tags} />

      <SectionLabel>Facets</SectionLabel>
      <Tags items={finding.facets} />

      {finding.relatedQuestions && finding.relatedQuestions.length > 0 && (
        <>
          <SectionLabel>Related Open Questions</SectionLabel>
          <div className="flex flex-col gap-1.5">
            {finding.relatedQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => navigate(`/findings?tab=questions&focus=${q}`)}
                className="text-left font-mono text-[12px] text-brand hover:underline"
              >
                {q}
              </button>
            ))}
          </div>
        </>
      )}

      <SectionLabel>Primary action</SectionLabel>
      <AskClaudeButton
        onClick={() =>
          navigate(
            `/chat?ctx=${[finding.id, finding.evidence, ...(finding.relatedQuestions ?? [])].join(',')}`,
          )
        }
      >
        Ask Claude about this finding
      </AskClaudeButton>
      <SectionLabel>Secondary actions</SectionLabel>
      <div className="flex flex-col gap-2">
        <NavActionButton onClick={() => navigate(`/experiments/${finding.evidence}`)}>
          <FileText className="size-3.5" /> View Evidence Report
        </NavActionButton>
        <NavActionButton onClick={() => navigate('/graph')}>
          <Share2 className="size-3.5" /> View Node in Graph
        </NavActionButton>
        <NavActionButton onClick={() => navigate('/lineage')}>
          <GitBranch className="size-3.5" /> View Lineage
        </NavActionButton>
      </div>
    </InspectorFrame>
  );
}

// Parse "| Date: YYYY-MM-DD — text" update-history segments from detail.
function parseHistory(detail: string) {
  const parts = detail.split('| Date:').map((s) => s.trim());
  const lead = parts.shift() ?? '';
  const events = parts.map((p) => {
    const m = p.match(/^(\S+)\s*[—-]\s*(.*)$/);
    return m ? { date: m[1], text: m[2] } : { date: '', text: p };
  });
  return { lead, events };
}

export function QuestionInspector({ question, onClose }: { question: OpenQuestion; onClose: () => void }) {
  const navigate = useNavigate();
  const { lead, events } = parseHistory(question.detail);

  return (
    <InspectorFrame kicker="OPEN QUESTION" id={question.id} onClose={onClose}>
      <h3 className="text-[15px] leading-snug text-text">{question.title}</h3>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusBadge value={question.status} />
        <StatusBadge value={question.priority} />
      </div>

      <SectionLabel>Metadata</SectionLabel>
      <div className="rounded-sm border border-border-subtle bg-surface-2 px-3">
        <MetaRow label="Status">{question.status}</MetaRow>
        <MetaRow label="Priority">{question.priority}</MetaRow>
        <MetaRow label="Area">{question.area}</MetaRow>
        <MetaRow label="Raised By">
          <MonoId>{question.raisedBy}</MonoId>
        </MetaRow>
        <MetaRow label="Raised Date">
          <MonoId>{question.raisedDate}</MonoId>
        </MetaRow>
      </div>

      <SectionLabel>Detail</SectionLabel>
      <p className="text-[13px] leading-relaxed text-text-secondary">{lead}</p>

      {events.length > 0 && (
        <>
          <SectionLabel>Update History</SectionLabel>
          <ol className="relative ml-1 border-l border-border-strong pl-4">
            {events.map((e, i) => (
              <li key={i} className="relative pb-3 last:pb-0">
                <span className="absolute -left-[21px] top-1 size-2 rounded-full border border-border-strong bg-brand" />
                <MonoId className="text-brand">{e.date}</MonoId>
                <p className="mt-0.5 text-[12px] text-text-secondary">{e.text}</p>
              </li>
            ))}
          </ol>
        </>
      )}

      <SectionLabel>Facets</SectionLabel>
      <Tags items={question.facets} />

      <SectionLabel>Related Findings / Experiments</SectionLabel>
      <div className="flex flex-col gap-1.5">
        {question.related.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => navigate(r.startsWith('experiments/') ? `/experiments/${r}` : `/findings?focus=${r}`)}
            className="text-left font-mono text-[12px] text-brand hover:underline"
          >
            {r}
          </button>
        ))}
      </div>

      <SectionLabel>Actions</SectionLabel>
      <div className="flex flex-col gap-2">
        <NavActionButton onClick={() => navigate('/graph')}>
          <Share2 className="size-3.5" /> View Node in Graph
        </NavActionButton>
        <AskClaudeButton
          onClick={() => navigate(`/chat?ctx=${[question.id, ...question.related].join(',')}`)}
        >
          Ask Claude about this open question
        </AskClaudeButton>
      </div>
    </InspectorFrame>
  );
}

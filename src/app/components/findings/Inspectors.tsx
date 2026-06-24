import { useState } from 'react';
import { FileText, Share2, GitBranch, ArrowUpRight, ChevronRight, Clock, Activity, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Finding, OpenQuestion } from '../../data';
import { getLatestVersion } from '../../data';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { ActionStateBadge, mapActionableToState } from '../common/ActionStateBadge';
import { MetaRow, MonoId } from '../common/primitives';
import { AskClaudeButton, NavActionButton } from '../common/AskClaudeActions';
import { InspectorFrame } from '../common/InspectorFrame';
import { cn } from '../ui/utils';

type FindingTab = 'overview' | 'evidence' | 'lineage' | 'related' | 'activity' | 'agent';
type QuestionTab = 'overview' | 'detail' | 'history' | 'related' | 'activity' | 'actions';

const FINDING_TABS: { id: FindingTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <FileText className="size-3.5" /> },
  { id: 'evidence', label: 'Evidence', icon: <Activity className="size-3.5" /> },
  { id: 'lineage', label: 'Lineage', icon: <GitBranch className="size-3.5" /> },
  { id: 'related', label: 'Related', icon: <Share2 className="size-3.5" /> },
  { id: 'activity', label: 'Activity', icon: <Clock className="size-3.5" /> },
  { id: 'agent', label: 'Agent', icon: <Zap className="size-3.5" /> },
];

const QUESTION_TABS: { id: QuestionTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <FileText className="size-3.5" /> },
  { id: 'detail', label: 'Detail', icon: <Activity className="size-3.5" /> },
  { id: 'history', label: 'History', icon: <Clock className="size-3.5" /> },
  { id: 'related', label: 'Related', icon: <Share2 className="size-3.5" /> },
  { id: 'activity', label: 'Activity', icon: <Activity className="size-3.5" /> },
  { id: 'actions', label: 'Actions', icon: <Zap className="size-3.5" /> },
];

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

function RelationshipChip({
  count,
  label,
  onClick,
}: {
  count: number;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1 font-mono text-[11px] text-text-secondary transition-colors',
        onClick && 'cursor-pointer hover:border-brand-border hover:text-brand',
      )}
    >
      <span className="font-medium">{count}</span>
      <span className="text-text-muted">{label}</span>
      {onClick && <ChevronRight className="size-3 text-text-muted" />}
    </button>
  );
}

export function FindingInspector({ finding, onClose }: { finding: Finding; onClose: () => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FindingTab>('overview');
  const isSuperseded = finding.confidence === 'superseded' || !!finding.supersededBy;
  const latest = finding.supersededBy ? getLatestVersion(finding.id) : undefined;
  const actionState = mapActionableToState(finding.actionable, finding.confidence);
  const relatedQuestionCount = finding.relatedQuestions?.length ?? 0;

  return (
    <InspectorFrame kicker="FINDING" id={finding.id} onClose={onClose}>
      {/* Title and metadata */}
      <h3 className="text-[15px] leading-snug text-text">{finding.title}</h3>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusBadge value={finding.category} />
        {finding.confidence === 'superseded' ? (
          <StatusBadge value="superseded" />
        ) : (
          <ConfidenceIndicator level={finding.confidence as 'high' | 'medium-high' | 'medium' | 'low'} showPercent showTooltip />
        )}
        <ActionStateBadge state={actionState} showDot={false} />
      </div>

      {/* Superseded warning */}
      {isSuperseded && (
        <div className="mt-4 rounded-sm border border-amber/30 bg-amber/10 px-3 py-2.5">
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

      {/* Tab navigation */}
      <div className="mt-4 flex overflow-x-auto border-b border-border-subtle" role="tablist" aria-label="Finding sections">
        {FINDING_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 py-2 font-mono text-[11px] transition-colors whitespace-nowrap',
                isActive
                  ? 'border-brand text-brand'
                  : 'border-transparent text-text-muted hover:text-text',
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'related' && relatedQuestionCount > 0 && (
                <span className="ml-0.5 text-text-muted">({relatedQuestionCount})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'overview' && (
          <>
            <SectionLabel>Metadata</SectionLabel>
            <div className="rounded-sm border border-border-subtle bg-surface-2 px-3">
              <MetaRow label="Category">{finding.category}</MetaRow>
              <MetaRow label="Confidence">{finding.confidence}</MetaRow>
              <MetaRow label="Date">
                <MonoId>{finding.date}</MonoId>
              </MetaRow>
              <MetaRow label="Actionable">{finding.actionable ? 'Yes' : 'No'}</MetaRow>
            </div>

            <SectionLabel>Summary</SectionLabel>
            <p className="text-[13px] leading-relaxed text-text-secondary">{finding.summary}</p>

            <SectionLabel>Tags</SectionLabel>
            <Tags items={finding.tags} />

            <SectionLabel>Facets</SectionLabel>
            <Tags items={finding.facets} />
          </>
        )}

        {activeTab === 'evidence' && (
          <>
            <SectionLabel>Evidence Source</SectionLabel>
            <div className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-2">
              <MonoId className="text-info">{finding.evidence}</MonoId>
            </div>
            <NavActionButton onClick={() => navigate(`/experiments/${finding.evidence}`)}>
              <FileText className="size-3.5" /> View Evidence Report
            </NavActionButton>
          </>
        )}

        {activeTab === 'lineage' && (
          <>
            {finding.supersedes && (
              <>
                <SectionLabel>Supersedes</SectionLabel>
                <button
                  type="button"
                  onClick={() => navigate(`/findings?focus=${finding.supersedes}`)}
                  className="inline-flex items-center gap-1 font-mono text-[12px] text-brand hover:underline"
                >
                  {finding.supersedes} <ArrowUpRight className="size-3" />
                </button>
              </>
            )}
            {finding.supersededBy && (
              <>
                <SectionLabel>Superseded By</SectionLabel>
                <button
                  type="button"
                  onClick={() => navigate(`/findings?focus=${finding.supersededBy}`)}
                  className="inline-flex items-center gap-1 font-mono text-[12px] text-brand hover:underline"
                >
                  {finding.supersededBy} <ArrowUpRight className="size-3" />
                </button>
              </>
            )}
            <NavActionButton onClick={() => navigate('/lineage')}>
              <GitBranch className="size-3.5" /> View Full Lineage
            </NavActionButton>
          </>
        )}

        {activeTab === 'related' && (
          <>
            <SectionLabel>Related Open Questions ({relatedQuestionCount})</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {relatedQuestionCount > 0 ? (
                finding.relatedQuestions?.map((q) => (
                  <RelationshipChip
                    key={q}
                    count={1}
                    label={q}
                    onClick={() => navigate(`/findings?tab=questions&focus=${q}`)}
                  />
                ))
              ) : (
                <p className="text-[13px] text-text-muted">No related questions</p>
              )}
            </div>
          </>
        )}

        {activeTab === 'activity' && (
          <>
            <SectionLabel>Activity History</SectionLabel>
            <div className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-2">
              <p className="text-[12px] text-text-muted">Activity tracking available in production.</p>
            </div>
          </>
        )}

        {activeTab === 'agent' && (
          <>
            <SectionLabel>Agent Actions</SectionLabel>
            <AskClaudeButton
              onClick={() =>
                navigate(
                  `/chat?ctx=${[finding.id, finding.evidence, ...(finding.relatedQuestions ?? [])].join(',')}`,
                )
              }
            >
              Ask Claude about this finding
            </AskClaudeButton>
          </>
        )}
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
  const [activeTab, setActiveTab] = useState<QuestionTab>('overview');
  const { lead, events } = parseHistory(question.detail);
  const relatedCount = question.related.length;

  return (
    <InspectorFrame kicker="OPEN QUESTION" id={question.id} onClose={onClose}>
      {/* Title and metadata */}
      <h3 className="text-[15px] leading-snug text-text">{question.title}</h3>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusBadge value={question.status} />
        <PriorityBadge priority={question.priority as 'critical' | 'high' | 'medium' | 'low'} />
      </div>

      {/* Tab navigation */}
      <div className="mt-4 flex overflow-x-auto border-b border-border-subtle" role="tablist" aria-label="Question sections">
        {QUESTION_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 py-2 font-mono text-[11px] transition-colors whitespace-nowrap',
                isActive
                  ? 'border-brand text-brand'
                  : 'border-transparent text-text-muted hover:text-text',
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'related' && relatedCount > 0 && (
                <span className="ml-0.5 text-text-muted">({relatedCount})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'overview' && (
          <>
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
          </>
        )}

        {activeTab === 'detail' && (
          <>
            <SectionLabel>Detail</SectionLabel>
            <p className="text-[13px] leading-relaxed text-text-secondary">{lead}</p>

            <SectionLabel>Facets</SectionLabel>
            <Tags items={question.facets} />
          </>
        )}

        {activeTab === 'history' && (
          <>
            {events.length > 0 ? (
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
            ) : (
              <p className="text-[13px] text-text-muted">No history available.</p>
            )}
          </>
        )}

        {activeTab === 'related' && (
          <>
            <SectionLabel>Related Findings / Experiments ({relatedCount})</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {relatedCount > 0 ? (
                question.related.map((r) => (
                  <RelationshipChip
                    key={r}
                    count={1}
                    label={r}
                    onClick={() =>
                      navigate(r.startsWith('experiments/') ? `/experiments/${r}` : `/findings?focus=${r}`)
                    }
                  />
                ))
              ) : (
                <p className="text-[13px] text-text-muted">No related items</p>
              )}
            </div>
          </>
        )}

        {activeTab === 'activity' && (
          <>
            <SectionLabel>Activity History</SectionLabel>
            <div className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-2">
              <p className="text-[12px] text-text-muted">Activity tracking available in production.</p>
            </div>
          </>
        )}

        {activeTab === 'actions' && (
          <>
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
          </>
        )}
      </div>
    </InspectorFrame>
  );
}
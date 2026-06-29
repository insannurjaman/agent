import { useState } from 'react';
import { FileText, Share2, GitBranch, ArrowUpRight, Clock, Activity, Zap } from 'lucide-react';
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

type FindingTab = 'overview' | 'evidence' | 'lineage' | 'related';
type QuestionTab = 'overview' | 'context' | 'related' | 'activity';

const FINDING_TABS: { id: FindingTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <FileText className="size-3.5" /> },
  { id: 'evidence', label: 'Evidence', icon: <Activity className="size-3.5" /> },
  { id: 'lineage', label: 'Lineage', icon: <GitBranch className="size-3.5" /> },
  { id: 'related', label: 'Related', icon: <Share2 className="size-3.5" /> },
];

const QUESTION_TABS: { id: QuestionTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <FileText className="size-3.5" /> },
  { id: 'context', label: 'Context', icon: <Activity className="size-3.5" /> },
  { id: 'related', label: 'Related', icon: <Share2 className="size-3.5" /> },
  { id: 'activity', label: 'Activity', icon: <Clock className="size-3.5" /> },
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
      {/* Title */}
      <h3 className="text-[15px] leading-snug text-text">{finding.title}</h3>

      {/* Badges */}
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
      <div className="mt-4 flex border-b border-border-subtle" role="tablist" aria-label="Finding sections">
        {FINDING_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`finding-tabpanel-${tab.id}`}
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
          <div role="tabpanel" id="finding-tabpanel-overview" aria-labelledby="finding-tab-overview">
            {/* Summary — primary content, shown first */}
            <SectionLabel>Summary</SectionLabel>
            <p className="text-[13px] leading-relaxed text-text-secondary">{finding.summary}</p>

            {/* Metadata */}
            <SectionLabel>Metadata</SectionLabel>
            <div className="rounded-sm border border-border-subtle bg-surface-2 px-3">
              <MetaRow label="Category">{finding.category}</MetaRow>
              <MetaRow label="Confidence">{finding.confidence}</MetaRow>
              <MetaRow label="Date">
                <MonoId>{finding.date}</MonoId>
              </MetaRow>
              <MetaRow label="Action status">{finding.actionable ? 'Action required' : 'No action'}</MetaRow>
            </div>

            {/* Tags */}
            <SectionLabel>Tags</SectionLabel>
            <Tags items={finding.tags} />

            {/* Facets */}
            <SectionLabel>Facets</SectionLabel>
            <Tags items={finding.facets} />

            {/* Activity note */}
            <SectionLabel>Activity</SectionLabel>
            <div className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-2">
              <p className="text-[12px] text-text-muted">Activity tracking available in production.</p>
            </div>

            {/* Agent action */}
            <SectionLabel>Agent Actions</SectionLabel>
            <AskClaudeButton
              onClick={() =>
                navigate(
                  `/chat?ctx=${[finding.id, finding.evidence, ...(finding.relatedQuestions ?? [])].join(',')}`,
                )
              }
            >
              <Zap className="size-3.5" /> Ask Claude about this finding
            </AskClaudeButton>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div role="tabpanel" id="finding-tabpanel-evidence" aria-labelledby="finding-tab-evidence">
            <SectionLabel>Evidence Source</SectionLabel>
            <div className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-2">
              <MonoId className="text-info">{finding.evidence}</MonoId>
            </div>
            <NavActionButton onClick={() => navigate(`/experiments/${finding.evidence}`)}>
              <FileText className="size-3.5" /> View Evidence Report
            </NavActionButton>
          </div>
        )}

        {activeTab === 'lineage' && (
          <div role="tabpanel" id="finding-tabpanel-lineage" aria-labelledby="finding-tab-lineage">
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
            <NavActionButton onClick={() => navigate('/in-out')}>
              <GitBranch className="size-3.5" /> View Full Lineage
            </NavActionButton>
          </div>
        )}

        {activeTab === 'related' && (
          <div role="tabpanel" id="finding-tabpanel-related" aria-labelledby="finding-tab-related">
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
          </div>
        )}
      </div>
    </InspectorFrame>
  );
}

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
      {/* Title */}
      <h3 className="text-[15px] leading-snug text-text">{question.title}</h3>

      {/* Badges */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusBadge value={question.status} />
        <PriorityBadge priority={question.priority as 'critical' | 'high' | 'medium' | 'low'} />
      </div>

      {/* Tab navigation */}
      <div className="mt-4 flex border-b border-border-subtle" role="tablist" aria-label="Question sections">
        {QUESTION_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`question-tabpanel-${tab.id}`}
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
          <div role="tabpanel" id="question-tabpanel-overview" aria-labelledby="question-tab-overview">
            {/* Detail — primary content */}
            <SectionLabel>Detail</SectionLabel>
            <p className="text-[13px] leading-relaxed text-text-secondary">{lead}</p>

            {/* Raised by */}
            <SectionLabel>Raised By</SectionLabel>
            <MonoId>{question.raisedBy}</MonoId>

            {/* Metadata */}
            <SectionLabel>Metadata</SectionLabel>
            <div className="rounded-sm border border-border-subtle bg-surface-2 px-3">
              <MetaRow label="Status">{question.status}</MetaRow>
              <MetaRow label="Priority">{question.priority}</MetaRow>
              <MetaRow label="Area">{question.area}</MetaRow>
              <MetaRow label="Raised Date">
                <MonoId>{question.raisedDate}</MonoId>
              </MetaRow>
            </div>

            {/* Agent action */}
            <SectionLabel>Actions</SectionLabel>
            <AskClaudeButton
              onClick={() => navigate(`/chat?ctx=${[question.id, ...question.related].join(',')}`)}
            >
              <Zap className="size-3.5" /> Ask Claude about this question
            </AskClaudeButton>
          </div>
        )}

        {activeTab === 'context' && (
          <div role="tabpanel" id="question-tabpanel-context" aria-labelledby="question-tab-context">
            <SectionLabel>Facets</SectionLabel>
            <Tags items={question.facets} />

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
          </div>
        )}

        {activeTab === 'related' && (
          <div role="tabpanel" id="question-tabpanel-related" aria-labelledby="question-tab-related">
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
          </div>
        )}

        {activeTab === 'activity' && (
          <div role="tabpanel" id="question-tabpanel-activity" aria-labelledby="question-tab-activity">
            <SectionLabel>Activity History</SectionLabel>
            <div className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-2">
              <p className="text-[12px] text-text-muted">Activity tracking available in production.</p>
            </div>
          </div>
        )}
      </div>
    </InspectorFrame>
  );
}

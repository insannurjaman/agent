import { useState } from 'react';
import { X, Crosshair, GitBranch, Zap, FileText } from 'lucide-react';
import type { Edge, GraphNode } from '../../data';
import { getFindingById, getQuestionById, getExperimentBySlug } from '../../data';
import { MonoId } from '../common/primitives';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { IconButton } from '../common/IconButton';
import { AskClaudeButton, NavActionButton } from '../common/AskClaudeActions';
import { cn } from '../ui/utils';

type TabId = 'overview' | 'relationships' | 'details' | 'actions';

export function NodeInspector({
  node,
  incident,
  onClose,
  onFocus,
  onPickNode,
  navigate,
}: {
  node: GraphNode;
  incident: Edge[];
  onClose: () => void;
  onFocus: () => void;
  onPickNode: (id: string) => void;
  navigate: (to: string) => void;
}) {
  const [tab, setTab] = useState<TabId>('overview');
  const f = node.kind === 'finding' ? getFindingById(node.id) : undefined;
  const q = node.kind === 'question' ? getQuestionById(node.id) : undefined;
  const e = node.kind === 'experiment' ? getExperimentBySlug(node.id) : undefined;

  const showRelationships = incident.length > 0;
  const showDetails = (() => {
    if (f) return f.tags.length > 0 || f.facets.length > 0 || !!f.evidence || (f.supersedes != null) || (f.supersededBy != null);
    if (q) return q.facets.length > 0 || !!q.raisedBy || !!q.raisedDate;
    if (e) return e.figures.length > 0 || !!e.lastModified || !!e.reportStatus;
    return false;
  })();

  const TABS: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    ...(showRelationships ? [{ id: 'relationships' as TabId, label: `Relationships (${incident.length})` }] : []),
    ...(showDetails ? [{ id: 'details' as TabId, label: 'Details' }] : []),
    { id: 'actions', label: 'Actions' },
  ];

  const Sec = ({ children }: { children: React.ReactNode }) => (
    <h4 className="mt-5 mb-2 font-mono text-[11px] uppercase tracking-wider text-text-muted first:mt-0">{children}</h4>
  );

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">{node.kind}</span>
          <MonoId className={node.kind === 'experiment' ? 'text-info' : 'text-brand'}>
            {node.id.replace('experiments/', '')}
          </MonoId>
        </div>
        <IconButton icon={X} label="Close" onClick={onClose} />
      </div>

      {/* Title + badges */}
      <div className="border-b border-border-subtle px-4 pt-4 pb-3">
        <h3 className="text-[15px] leading-snug text-text">{node.label}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {f && (f.confidence === 'superseded' ? <StatusBadge value="superseded" /> : <ConfidenceIndicator level={f.confidence as 'high' | 'medium-high' | 'medium' | 'low'} />)}
          {f && <StatusBadge value={f.category} showDot={false} />}
          {q && <StatusBadge value={q.status} />}
          {q && <PriorityBadge priority={q.priority as 'critical' | 'high' | 'medium' | 'low'} />}
          {e && <StatusBadge value={e.outdated ? 'outdated' : e.reportStatus} />}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle" role="tablist" aria-label="Node sections">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`node-tabpanel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 border-b-2 px-3 py-2 font-mono text-[11px] transition-colors text-center',
                isActive ? 'border-brand text-brand' : 'border-transparent text-text-muted hover:text-text',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        {tab === 'overview' && (
          <div role="tabpanel" id="node-tabpanel-overview">
            {f && (
              <>
                <Sec>Summary</Sec>
                <p className="text-[13px] leading-relaxed text-text-secondary">{f.summary}</p>
                {(f.supersedes || f.supersededBy) && (
                  <>
                    <Sec>Lineage</Sec>
                    <div className="space-y-1 font-mono text-[12px] text-text-secondary">
                      {f.supersedes && <div>supersedes {f.supersedes}</div>}
                      {f.supersededBy && <div className="text-amber">superseded by {f.supersededBy}</div>}
                    </div>
                  </>
                )}
              </>
            )}
            {q && (
              <>
                <Sec>Detail</Sec>
                <p className="text-[13px] leading-relaxed text-text-secondary">
                  {q.detail.split('| Date:')[0].trim()}
                </p>
              </>
            )}
            {e && (
              <>
                <Sec>Conclusions</Sec>
                <ul className="space-y-1">
                  {e.conclusions.map((c, i) => (
                    <li key={i} className="flex gap-2 text-[12px] text-text-secondary">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-border-strong" />
                      {c}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {tab === 'relationships' && (
          <div role="tabpanel" id="node-tabpanel-relationships">
            <Sec>Incident edges · {incident.length}</Sec>
            <div className="space-y-1.5">
              {incident.length === 0 && <p className="text-[12px] text-text-muted">No incident edges.</p>}
              {incident.map((ed, i) => {
                const other = ed.src === node.id ? ed.dst : ed.src;
                const dir = ed.src === node.id ? '→' : '←';
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onPickNode(other)}
                    className="flex w-full items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2.5 py-2 min-h-11 text-left hover:border-border-strong"
                  >
                    <StatusBadge value={ed.edgeType} showDot />
                    <span className="font-mono text-[11px] text-text-muted">{dir}</span>
                    <span className="truncate font-mono text-[11px] text-text-secondary">
                      {other.replace('experiments/', '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'details' && (
          <div role="tabpanel" id="node-tabpanel-details">
            {f && (
              <>
                <Sec>Evidence</Sec>
                <MonoId className="text-info">{f.evidence}</MonoId>
                <Sec>Tags</Sec>
                <div className="flex flex-wrap gap-1.5">
                  {f.tags.map((t) => (
                    <span key={t} className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-text-secondary">{t}</span>
                  ))}
                </div>
                <Sec>Facets</Sec>
                <div className="flex flex-wrap gap-1.5">
                  {f.facets.map((t) => (
                    <span key={t} className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-text-secondary">{t}</span>
                  ))}
                </div>
              </>
            )}
            {q && (
              <>
                <Sec>Facets</Sec>
                <div className="flex flex-wrap gap-1.5">
                  {q.facets.map((t) => (
                    <span key={t} className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-text-secondary">{t}</span>
                  ))}
                </div>
                <Sec>Raised By</Sec>
                <MonoId>{q.raisedBy}</MonoId>
                <Sec>Raised Date</Sec>
                <MonoId>{q.raisedDate}</MonoId>
              </>
            )}
            {e && (
              <>
                <Sec>Last Modified</Sec>
                <MonoId>{e.lastModified}</MonoId>
                <Sec>Report Status</Sec>
                <StatusBadge value={e.reportStatus} />
                {e.figures.length > 0 && (
                  <>
                    <Sec>Figures</Sec>
                    <div className="flex flex-wrap gap-1.5">
                      {e.figures.map((fig) => (
                        <span key={fig} className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-text-secondary">{fig}</span>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
            {!f && !q && !e && (
              <p className="text-[13px] text-text-muted">No additional details available for this node type.</p>
            )}
          </div>
        )}

        {tab === 'actions' && (
          <div role="tabpanel" id="node-tabpanel-actions">
            <Sec>Navigation</Sec>
            <div className="flex flex-col gap-2">
              <NavActionButton onClick={onFocus}>
                <Crosshair className="size-3.5" /> Focus neighborhood
              </NavActionButton>
              {f && (
                <NavActionButton onClick={() => navigate(`/findings?focus=${node.id}`)}>
                  <FileText className="size-3.5" /> Open in Table
                </NavActionButton>
              )}
              {q && (
                <NavActionButton onClick={() => navigate(`/findings?tab=questions&focus=${node.id}`)}>
                  <FileText className="size-3.5" /> Open in Table
                </NavActionButton>
              )}
              {e && (
                <NavActionButton onClick={() => navigate(`/experiments/${node.id}`)}>
                  <FileText className="size-3.5" /> Open Report
                </NavActionButton>
              )}
              {(f || e) && (
                <NavActionButton onClick={() => navigate('/in-out')}>
                  <GitBranch className="size-3.5" /> View Lineage
                </NavActionButton>
              )}
            </div>
            <Sec>AI</Sec>
            <AskClaudeButton
              onClick={() =>
                navigate(
                  `/chat?ctx=${[node.id, ...incident.map((ed) => (ed.src === node.id ? ed.dst : ed.src))].join(',')}`,
                )
              }
            >
              <Zap className="size-3.5" /> Ask Claude about this node
            </AskClaudeButton>
          </div>
        )}
      </div>
    </aside>
  );
}

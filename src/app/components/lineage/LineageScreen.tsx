import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowDown, ArrowUpRight, AlertTriangle, FlaskConical, GitBranch, X } from 'lucide-react';
import {
  getFindingById,
  getSupersedesChain,
  getLatestVersion,
  getLineageRoots,
  edges,
} from '../../data';
import type { Finding } from '../../data';
import { ScreenHeader, MonoId } from '../common/primitives';
import { StatusBadge } from '../common/StatusBadge';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { EmptyState } from '../common/EmptyState';
import { AskClaudeButton, NavActionButton } from '../common/AskClaudeActions';
import { IconButton } from '../common/IconButton';
import { ResponsiveInspectorOverlay } from '../responsive/ResponsiveInspectorOverlay';
import { cn } from '../ui/utils';

export function LineageScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roots = useMemo(() => getLineageRoots(), []);
  const focusParam = params.get('focus');
  const initial = focusParam && getFindingById(focusParam) ? focusParam : roots[0] ?? 'F-0001';

  const [activeId, setActiveId] = useState<string>(initial);
  const [selected, setSelected] = useState<string>(initial);

  useEffect(() => {
    if (focusParam && getFindingById(focusParam)) {
      setActiveId(focusParam);
      setSelected(focusParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusParam]);

  const chain = useMemo(() => getSupersedesChain(activeId), [activeId]);
  const latest = chain[chain.length - 1];
  const selectedFinding = getFindingById(selected);

  // Chains presented in the left rail — one per supersedes lineage.
  const chains = useMemo(() => {
    const seen = new Set<string>();
    const out: string[][] = [];
    for (const r of roots) {
      const c = getSupersedesChain(r);
      const key = c.join('>');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
    return out;
  }, [roots]);

  return (
    <div className="flex h-full">
      {/* Left: lineage chains — hidden below md */}
      <div className="hidden w-[300px] shrink-0 flex-col border-r border-border-subtle bg-surface md:flex">
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 className="text-text font-medium" style={{ fontSize: '15px' }}>
            Lineage Trace
          </h2>
          <p className="mt-0.5 font-mono text-[11px] text-text-muted">
            {chains.length} supersedes chains
          </p>
        </div>
        <ul role="listbox" aria-label="Lineage chains" className="min-h-0 flex-1 overflow-auto p-2">
          {chains.map((c) => {
            const head = c[0];
            const tail = c[c.length - 1];
            const isActive = chain.join('>') === c.join('>');
            return (
              <li key={c.join('>')}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveId(head);
                    setSelected(head);
                  }}
                  className={cn(
                    'mb-1.5 w-full rounded-sm border px-3 py-3 min-h-11 text-left transition-colors',
                    isActive
                      ? 'border-brand-border bg-brand-muted'
                      : 'border-border-subtle bg-surface hover:border-border-strong hover:bg-surface-2',
                  )}
                >
                  <div className="flex items-center gap-1.5 font-mono text-[12px]">
                    <span className="text-text-muted">{head}</span>
                    <ArrowUpRight className="size-3 text-text-muted" />
                    <span className="text-brand">{tail}</span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-[12px] text-text-secondary">
                    {getFindingById(tail)?.title}
                  </div>
                  <div className="mt-1.5 font-mono text-[10px] text-text-muted">{c.length} versions</div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Center: chain timeline */}
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <ScreenHeader
          title="Supersedes Trace"
          subtitle="Follow a claim from its obsolete origin to the latest valid finding."
        />
        <div className="min-h-0 flex-1 overflow-auto px-6 py-6">
          {chain.length === 0 ? (
            <EmptyState icon={GitBranch} title="No lineage found" hint="This finding has no supersedes relationships in the knowledge graph." />
          ) : (
            <div className="mx-auto max-w-2xl">
              {chain.map((id, i) => {
                const f = getFindingById(id)!;
                const isLatest = id === latest;
                return (
                  <div key={id}>
                    <ChainCard
                      finding={f}
                      isLatest={isLatest}
                      selected={selected === id}
                      onClick={() => setSelected(id)}
                      onGoLatest={() => setSelected(latest)}
                    />
                    {i < chain.length - 1 && (
                      <div className="flex items-center gap-2 py-2 pl-6 text-text-muted">
                        <ArrowDown className="size-4" />
                        <StatusBadge value="supersedes" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: detail inspector — overlay below lg */}
      {selectedFinding && (
        <ResponsiveInspectorOverlay>
          <LineageInspector
            finding={selectedFinding}
            latest={getLatestVersion(selectedFinding.id)}
            onClose={() => setSelected('')}
            onGoLatest={() => setSelected(getLatestVersion(selectedFinding.id))}
            navigate={navigate}
          />
        </ResponsiveInspectorOverlay>
      )}
    </div>
  );
}

function ChainCard({
  finding,
  isLatest,
  selected,
  onClick,
  onGoLatest,
}: {
  finding: Finding;
  isLatest: boolean;
  selected: boolean;
  onClick: () => void;
  onGoLatest: () => void;
}) {
  const obsolete = !isLatest;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'block w-full rounded-sm border px-4 py-3 text-left transition-colors',
        selected ? 'border-brand-border bg-brand-muted' : 'border-border-subtle hover:border-border-strong',
        isLatest ? 'bg-surface' : 'bg-surface opacity-60',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MonoId className={isLatest ? 'text-brand' : 'text-text-muted'}>{finding.id}</MonoId>
          {isLatest ? (
            <StatusBadge value="high" tone="success" />
          ) : (
            <StatusBadge value="superseded" showDot={false} />
          )}
        </div>
        <span className="font-mono text-[11px] text-text-muted">{finding.date}</span>
      </div>
      <div className="mt-1.5 text-[14px] text-text">{finding.title}</div>
      <p className="mt-1 line-clamp-2 text-[12px] text-text-secondary">{finding.summary}</p>

      {isLatest && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-brand-border bg-brand-muted px-2 py-0.5 font-mono text-[11px] text-brand">
          Latest valid claim
        </div>
      )}
      {obsolete && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-sm border border-border-strong bg-surface-2 px-2.5 py-1.5">
          <span className="flex items-center gap-1.5 text-[11px] text-amber">
            <AlertTriangle className="size-3.5" />
            Historical record. Do not use as latest conclusion.
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onGoLatest();
            }}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-brand hover:underline"
          >
            Go to Latest <ArrowUpRight className="size-3" />
          </button>
        </div>
      )}
    </button>
  );
}

function LineageInspector({
  finding,
  latest,
  onClose,
  onGoLatest,
  navigate,
}: {
  finding: Finding;
  latest: string;
  onClose: () => void;
  onGoLatest: () => void;
  navigate: (to: string) => void;
}) {
  const isLatest = finding.id === latest;
  const incident = edges.filter((e) => e.src === finding.id || e.dst === finding.id);
  const origins = incident.filter((e) => e.edgeType === 'origin' && e.dst === finding.id);
  const cites = incident.filter((e) => e.edgeType === 'cite' || e.edgeType === 'report-use');
  const conflicts = incident.filter((e) => e.edgeType === 'conflict-suspected');
  const resolved = incident.filter((e) => e.edgeType === 'resolves' || e.edgeType === 'resolve-partial');

  const Label = ({ children }: { children: React.ReactNode }) => (
    <div className="mt-5 mb-2 font-mono text-[11px] uppercase tracking-wider text-text-muted first:mt-0">
      {children}
    </div>
  );
  const Ref = ({ id }: { id: string }) => (
    <button
      type="button"
      onClick={() =>
        navigate(
          id.startsWith('experiments/')
            ? `/experiments/${id}`
            : id.startsWith('Q-')
              ? `/findings?tab=questions&focus=${id}`
              : `/findings?focus=${id}`,
        )
      }
      className="font-mono text-[12px] text-brand hover:underline"
    >
      {id.replace('experiments/', '')}
    </button>
  );

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-l border-border-subtle bg-surface lg:w-[360px]">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">FINDING</span>
          <MonoId className="text-brand">{finding.id}</MonoId>
        </div>
        <IconButton icon={X} label="Close" onClick={onClose} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        <h3 className="text-[15px] leading-snug text-text">{finding.title}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {finding.confidence === 'superseded' ? (
            <StatusBadge value="superseded" />
          ) : (
            <ConfidenceIndicator level={finding.confidence as 'high' | 'medium-high' | 'medium' | 'low'} showBars />
          )}
          <StatusBadge value={finding.category} showDot={false} />
        </div>

        {!isLatest && (
          <div className="mt-4 rounded-sm border border-border-strong bg-surface-2 px-3 py-2.5">
            <div className="font-mono text-[11px] uppercase tracking-wider text-amber">Superseded</div>
            <p className="mt-1 text-[12px] text-text-muted">Historical record. Do not use as latest conclusion.</p>
            <button
              type="button"
              onClick={onGoLatest}
              className="mt-2 inline-flex items-center gap-1 font-mono text-[12px] text-brand hover:underline"
            >
              Go to Latest Version {latest} <ArrowUpRight className="size-3" />
            </button>
          </div>
        )}

        <Label>Summary</Label>
        <p className="text-[13px] leading-relaxed text-text-secondary">{finding.summary}</p>

        <Label>Supersedes Relationships</Label>
        <div className="space-y-1 font-mono text-[12px] text-text-secondary">
          {finding.supersedes ? <div>supersedes <Ref id={finding.supersedes} /></div> : null}
          {finding.supersededBy ? (
            <div className="text-amber">
              superseded by <Ref id={finding.supersededBy} />
            </div>
          ) : null}
          {!finding.supersedes && !finding.supersededBy && <span className="text-text-muted">none</span>}
        </div>

        <Label>Experiments That Generated It</Label>
        {origins.length ? (
          <div className="flex flex-col gap-1.5">
            {origins.map((e, i) => (
              <div key={i} className="flex items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1.5">
                <FlaskConical className="size-3.5 shrink-0 text-text-muted" />
                <Ref id={e.src} />
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[12px] text-text-muted">—</span>
        )}

        <Label>Citation Sources</Label>
        {cites.length ? (
          <div className="flex flex-wrap gap-1.5">
            {cites.map((e, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5">
                <StatusBadge value={e.edgeType} showDot />
                <Ref id={e.src === finding.id ? e.dst : e.src} />
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[12px] text-text-muted">—</span>
        )}

        {conflicts.length > 0 && (
          <>
            <Label>Conflict Suspected</Label>
            <div className="space-y-1.5">
              {conflicts.map((e, i) => (
                <div key={i} className="flex items-center gap-2 rounded-sm border border-red/30 bg-red/10 px-2 py-1.5">
                  <AlertTriangle className="size-3.5 shrink-0 text-red" />
                  <span className="text-[11px] text-red">conflict with</span>
                  <Ref id={e.src === finding.id ? e.dst : e.src} />
                </div>
              ))}
            </div>
          </>
        )}

        {resolved.length > 0 && (
          <>
            <Label>Resolved / Partially-Resolved Questions</Label>
            <div className="flex flex-wrap gap-1.5">
              {resolved.map((e, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5">
                  <StatusBadge value={e.edgeType} showDot />
                  <Ref id={e.src === finding.id ? e.dst : e.src} />
                </div>
              ))}
            </div>
          </>
        )}

        <Label>Actions</Label>
        <div className="flex flex-col gap-2">
          <NavActionButton onClick={() => navigate(`/findings?focus=${finding.id}`)}>
            Open in Table
          </NavActionButton>
          <NavActionButton onClick={() => navigate(`/graph?focus=${finding.id}`)}>
            <GitBranch className="size-3.5" /> View Node in Graph
          </NavActionButton>
          <AskClaudeButton
            onClick={() =>
              navigate(
                `/chat?ctx=${[finding.id, finding.supersededBy, finding.supersedes].filter(Boolean).join(',')}`,
              )
            }
          >
            Ask Claude explain this lineage
          </AskClaudeButton>
        </div>
      </div>
    </aside>
  );
}

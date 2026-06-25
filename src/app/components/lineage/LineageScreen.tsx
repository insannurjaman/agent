import { useMemo, useState, useEffect, useCallback } from 'react';
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
import { ChangeSummary } from './ChangeSummary';
import { cn } from '../ui/utils';

const CONFIDENCE_RANK: Record<string, number> = { high: 5, 'medium-high': 4, medium: 3, low: 2, superseded: 1 };

export function LineageScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roots = useMemo(() => getLineageRoots(), []);
  const focusParam = params.get('focus');
  const inspectParam = params.get('inspect');
  const initial = focusParam && getFindingById(focusParam) ? focusParam : roots[0] ?? 'F-0001';

  const [activeId, setActiveId] = useState<string>(initial);
  // inspectedId is separate from activeId — only set on explicit user action or deep link
  const [inspectedId, setInspectedId] = useState<string>(
    inspectParam && getFindingById(inspectParam) ? inspectParam : ''
  );
  const [expanded, setExpanded] = useState(true);

  // Handle URL focus param on mount
  useEffect(() => {
    if (focusParam && getFindingById(focusParam)) {
      setActiveId(focusParam);
      // Do NOT set inspectedId — drawer stays closed
    }
    if (inspectParam && getFindingById(inspectParam)) {
      setInspectedId(inspectParam);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const chain = useMemo(() => getSupersedesChain(activeId), [activeId]);
  const latest = chain[chain.length - 1];
  const inspectedFinding = inspectedId ? getFindingById(inspectedId) : undefined;
  const latestFinding = getFindingById(latest);

  const chains = useMemo(() => {
    const seen = new Set<string>(); const out: string[][] = [];
    for (const r of roots) { const c = getSupersedesChain(r); const key = c.join('>'); if (seen.has(key)) continue; seen.add(key); out.push(c); }
    return out;
  }, [roots]);

  const selectChain = useCallback((id: string) => {
    setActiveId(id); setExpanded(true); setInspectedId(''); // close drawer when switching chains
  }, []);

  const inspectFinding = useCallback((id: string) => {
    setInspectedId(id);
  }, []);

  const closeDrawer = useCallback(() => {
    setInspectedId('');
  }, []);

  const showGoToLatest = useCallback((id: string, index: number) => {
    // Only show Go to Latest when the latest version is not directly visible
    // Hide for 2-version chains where latest is adjacent
    if (chain.length <= 2) return false;
    // For longer chains, show if this is not the last or second-to-last visible version
    if (!expanded) {
      // When collapsed, only first and last are shown — show on historical (first)
      return id === chain[0];
    }
    // When expanded, show if there are at least 2 versions below this one
    return index < chain.length - 2;
  }, [chain.length, expanded]);

  return (
    <div className="flex h-full">
      {/* Left sidebar */}
      <div className="hidden w-[280px] shrink-0 flex-col border-r border-border-subtle bg-surface md:flex">
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 className="text-[15px] font-medium text-text">Claim Lineage</h2>
          <p className="mt-0.5 font-mono text-[11px] text-text-muted">{chains.length} chains</p>
        </div>
        <ul role="listbox" aria-label="Lineage chains" className="min-h-0 flex-1 overflow-auto p-2">
          {chains.map((c) => {
            const head = c[0]; const tail = c[c.length - 1];
            const tailF = getFindingById(tail);
            const isActive = chain.join('>') === c.join('>');
            const hasConflict = [...c].some((id) => edges.some((e) => (e.src === id || e.dst === id) && e.edgeType === 'conflict-suspected'));
            return (
              <li key={c.join('>')}>
                <button type="button" role="option" aria-selected={isActive} onClick={() => selectChain(head)}
                  className={cn('mb-1.5 w-full rounded-sm border px-3 py-3 min-h-11 text-left transition-colors', isActive ? 'border-brand-border bg-brand-muted' : 'border-border-subtle bg-surface hover:border-border-strong hover:bg-surface-2')}>
                  <div className="flex items-center gap-1.5 font-mono text-[12px]">
                    <span className="text-text-muted">{head}</span>
                    <ArrowUpRight className="size-3 text-text-muted" />
                    <span className="text-brand">{tail}</span>
                    {hasConflict && <AlertTriangle className="size-3 text-error" />}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[12px] text-text-secondary">{tailF?.title}</div>
                  <div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] text-text-muted">
                    <span>{c.length} version{c.length !== 1 ? 's' : ''}</span>
                    {tailF && <span>· {tailF.confidence}</span>}
                    {tailF && <span>· {tailF.date}</span>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Center: timeline */}
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <ScreenHeader title="Supersedes Trace" subtitle="Follow a claim from its obsolete origin to the latest valid finding." />

        {/* Mobile chain selector with proper context */}
        <div className="flex items-center gap-2 border-b border-border-subtle bg-surface px-4 py-2 md:hidden">
          <select value={activeId} onChange={(e) => selectChain(e.target.value)}
            className="flex-1 h-10 rounded-sm border border-border-subtle bg-surface-2 px-2 font-mono text-[12px] text-text outline-none cursor-pointer">
            {chains.map((c) => {
              const tail = getFindingById(c[c.length - 1]);
              return (
                <option key={c.join('>')} value={c[0]}>
                  {c[0]} → {c[c.length - 1]} · {c.length}v · {tail?.title?.slice(0, 60) || ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Lineage summary bar */}
        {chain.length > 0 && (() => {
          const firstF = getFindingById(chain[0]); const lastF = getFindingById(latest);
          const fConf = firstF?.confidence ? CONFIDENCE_RANK[firstF.confidence] || 0 : 0;
          const lConf = lastF?.confidence ? CONFIDENCE_RANK[lastF.confidence] || 0 : 0;
          const confDir = lConf > fConf ? '↑' : lConf < fConf ? '↓' : '→';
          return (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border-subtle bg-surface px-6 py-2 font-mono text-[10px] text-text-muted">
              <span>{chain.length} version{chain.length !== 1 ? 's' : ''}</span>
              <span>{chain[0]} → {latest}</span>
              {firstF && lastF && <span>{firstF.date} → {lastF.date}</span>}
              {firstF && lastF && <span>{firstF.confidence} {confDir} {lastF.confidence}</span>}
            </div>
          );
        })()}

        {/* Timeline */}
        <div className="min-h-0 flex-1 overflow-auto px-4 py-6 sm:px-6">
          {chain.length === 0 ? (
            <EmptyState icon={GitBranch} title="No lineage found" hint="This finding has no supersedes relationships in the knowledge graph." />
          ) : (
            <div className="mx-auto max-w-2xl">
              {chain.map((id, i) => {
                const f = getFindingById(id)!;
                const isLatest = id === latest;
                const isInspected = inspectedId === id;
                const isFirst = i === 0;
                const isLast = i === chain.length - 1;
                const isMiddleCollapsed = chain.length > 2 && !isFirst && !isLast && !expanded;

                if (isMiddleCollapsed) {
                  if (i === 1 && !expanded) {
                    return (
                      <div key="collapse" className="flex flex-col items-center py-2">
                        <button type="button" onClick={() => setExpanded(true)}
                          className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-1.5 font-mono text-[11px] text-text-muted hover:text-text transition-colors">
                          Show all {chain.length} versions
                        </button>
                        <div className="flex items-center gap-2 py-2 text-text-muted">
                          <ArrowDown className="size-4" />
                          <span className="font-mono text-[10px] text-text-muted">Superseded by</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }

                return (
                  <div key={id}>
                    <ChainCard
                      finding={f}
                      isLatest={isLatest}
                      selected={isInspected}
                      onClick={() => inspectFinding(id)}
                      showGoToLatest={showGoToLatest(id, i)}
                      onGoLatest={() => inspectFinding(latest)}
                    />
                    {i < chain.length - 1 && (
                      <>
                        <div className="flex items-center gap-2 py-2 pl-6 text-text-muted">
                          <ArrowDown className="size-4" />
                          <StatusBadge value="superseded" />
                          <span className="font-mono text-[10px] text-text-muted">by</span>
                        </div>
                        {(() => {
                          const nextF = getFindingById(chain[i + 1]);
                          if (!nextF) return null;
                          if (chain.length > 2 && !expanded && i < chain.length - 2) return null;
                          return <ChangeSummary oldF={f} newF={nextF} />;
                        })()}
                      </>
                    )}
                  </div>
                );
              })}

              {chain.length > 2 && !expanded && (
                <div className="flex justify-center py-2">
                  <button type="button" onClick={() => setExpanded(true)}
                    className="rounded-sm border border-border-subtle bg-surface-2 px-3 py-1.5 font-mono text-[11px] text-text-muted hover:text-text transition-colors">
                    Expand all versions
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right inspector — only opens on explicit inspection */}
      {inspectedFinding && (
        <ResponsiveInspectorOverlay isOpen={!!inspectedFinding} onDismiss={closeDrawer}>
          <LineageInspector
            finding={inspectedFinding}
            latest={getLatestVersion(inspectedFinding.id)}
            onClose={closeDrawer}
            onGoLatest={() => setInspectedId(getLatestVersion(inspectedFinding.id))}
            navigate={navigate}
          />
        </ResponsiveInspectorOverlay>
      )}
    </div>
  );
}

// ── ChainCard ──────────────────────────────────────────────────────────
function ChainCard({ finding, isLatest, selected, onClick, showGoToLatest, onGoLatest }: {
  finding: Finding; isLatest: boolean; selected: boolean; onClick: () => void; showGoToLatest?: boolean; onGoLatest: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={cn('block w-full rounded-sm border px-4 py-3 text-left transition-colors',
        selected ? 'border-brand-border bg-brand-muted' : 'border-border-subtle hover:border-border-strong')}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MonoId className={isLatest ? 'text-brand' : 'text-text-muted'}>{finding.id}</MonoId>
          <span className="font-mono text-[11px] text-text-muted">{finding.date}</span>
        </div>
        {isLatest ? (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-brand-border bg-brand-muted px-2 py-0.5 font-mono text-[11px] text-brand">Current claim</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-amber/30 bg-amber/10 px-2 py-0.5 font-mono text-[10px] text-amber">Superseded</span>
        )}
      </div>
      <div className="mt-1.5 text-[14px] text-text">{finding.title}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {finding.confidence === 'superseded' ? <StatusBadge value="superseded" /> : <ConfidenceIndicator level={finding.confidence as 'high' | 'medium-high' | 'medium' | 'low'} />}
        <StatusBadge value={finding.category} showDot={false} />
      </div>
      <p className="mt-1.5 text-[12px] text-text-secondary leading-relaxed">{finding.summary}</p>
      {!isLatest && finding.supersedeReason && (
        <div className="mt-2 flex items-start gap-1.5 rounded-sm border border-amber/20 bg-amber/5 px-2.5 py-1.5">
          <AlertTriangle className="size-3 shrink-0 mt-0.5 text-amber" />
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-amber">Why superseded</span>
            <p className="text-[12px] text-text-muted mt-0.5">{finding.supersedeReason}</p>
          </div>
        </div>
      )}
      <div className="mt-2 flex items-center gap-1.5">
        <FlaskConical className="size-3 text-text-muted" />
        <span className="font-mono text-[11px] text-info">{finding.evidence.replace('experiments/', '')}</span>
      </div>
      {showGoToLatest && (
        <div className="mt-2 flex justify-end">
          <button type="button" onClick={(e) => { e.stopPropagation(); onGoLatest(); }}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-brand hover:underline">
            Go to latest <ArrowUpRight className="size-3" />
          </button>
        </div>
      )}
    </button>
  );
}

// ── LineageInspector (no duplicated content) ───────────────────────────
function LineageInspector({ finding, latest, onClose, onGoLatest, navigate }: {
  finding: Finding; latest: string; onClose: () => void; onGoLatest: () => void; navigate: (to: string) => void;
}) {
  const isLatest = finding.id === latest;
  const incident = edges.filter((e) => e.src === finding.id || e.dst === finding.id);
  const origins = incident.filter((e) => e.edgeType === 'origin' && e.dst === finding.id);
  const cites = incident.filter((e) => e.edgeType === 'cite' || e.edgeType === 'report-use');
  const conflicts = incident.filter((e) => e.edgeType === 'conflict-suspected');
  const resolved = incident.filter((e) => e.edgeType === 'resolves' || e.edgeType === 'resolve-partial');

  const Sec = ({ children }: { children: React.ReactNode }) => (<div className="mt-5 mb-2 font-mono text-[11px] uppercase tracking-wider text-text-muted first:mt-0">{children}</div>);
  const Ref = ({ id }: { id: string }) => (
    <button type="button" onClick={() => navigate(id.startsWith('experiments/') ? `/experiments/${id}` : id.startsWith('Q-') ? `/findings?tab=questions&focus=${id}` : `/findings?focus=${id}`)}
      className="font-mono text-[12px] text-brand hover:underline">{id.replace('experiments/', '')}</button>
  );

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-surface">
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
          {finding.confidence === 'superseded' ? <StatusBadge value="superseded" /> : <ConfidenceIndicator level={finding.confidence as 'high' | 'medium-high' | 'medium' | 'low'} />}
          <StatusBadge value={finding.category} showDot={false} />
        </div>

        {/* Only the superseded notice — Summary and relationships are in the timeline */}
        {!isLatest && (
          <div className="mt-4 rounded-sm border border-border-strong bg-surface-2 px-3 py-2.5">
            <div className="font-mono text-[11px] uppercase tracking-wider text-amber">Superseded</div>
            {finding.supersedeReason && <p className="mt-1 text-[12px] text-text-muted">{finding.supersedeReason}</p>}
            <p className="mt-1 text-[12px] text-text-muted">Do not use as latest conclusion.</p>
            <button type="button" onClick={onGoLatest}
              className="mt-2 inline-flex items-center gap-1 font-mono text-[12px] text-brand hover:underline">
              Go to Latest Version {latest} <ArrowUpRight className="size-3" />
            </button>
          </div>
        )}

        {/* Detail sections not visible in the timeline cards */}
        <Sec>Experiments That Generated It</Sec>
        {origins.length ? (<div className="flex flex-col gap-1.5">{origins.map((e, i) => (<div key={i} className="flex items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1.5"><FlaskConical className="size-3.5 shrink-0 text-text-muted" /><Ref id={e.src} /></div>))}</div>) : <span className="text-[12px] text-text-muted">—</span>}

        <Sec>Citation Sources</Sec>
        {cites.length ? (<div className="flex flex-wrap gap-1.5">{cites.map((e, i) => (<div key={i} className="flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5"><StatusBadge value={e.edgeType} showDot /><Ref id={e.src === finding.id ? e.dst : e.src} /></div>))}</div>) : <span className="text-[12px] text-text-muted">—</span>}

        {conflicts.length > 0 && (<><Sec>Conflict Suspected</Sec><div className="space-y-1.5">{conflicts.map((e, i) => (<div key={i} className="flex items-center gap-2 rounded-sm border border-red/30 bg-red/10 px-2 py-1.5"><AlertTriangle className="size-3.5 shrink-0 text-red" /><span className="text-[11px] text-red">conflict with</span><Ref id={e.src === finding.id ? e.dst : e.src} /></div>))}</div></>)}

        {resolved.length > 0 && (<><Sec>Resolved Questions</Sec><div className="flex flex-wrap gap-1.5">{resolved.map((e, i) => (<div key={i} className="flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5"><StatusBadge value={e.edgeType} showDot /><Ref id={e.src === finding.id ? e.dst : e.src} /></div>))}</div></>)}

        <Sec>Actions</Sec>
        <div className="flex flex-col gap-2">
          <NavActionButton onClick={() => navigate(`/findings?focus=${finding.id}`)}>Open in Table</NavActionButton>
          <NavActionButton onClick={() => navigate(`/graph?focus=${finding.id}`)}><GitBranch className="size-3.5" /> View Node in Graph</NavActionButton>
          <AskClaudeButton onClick={() => navigate(`/chat?ctx=${[finding.id, finding.supersededBy, finding.supersedes].filter(Boolean).join(',')}`)}>Ask Claude explain this lineage</AskClaudeButton>
        </div>
      </div>
    </aside>
  );
}

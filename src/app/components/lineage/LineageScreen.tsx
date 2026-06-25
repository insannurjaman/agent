import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowDown, ArrowUpRight, AlertTriangle, FlaskConical, GitBranch, X, ChevronLeft } from 'lucide-react';
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
  const initial = focusParam && getFindingById(focusParam) ? focusParam : roots[0] ?? 'F-0001';

  const [activeId, setActiveId] = useState<string>(initial);
  const [selected, setSelected] = useState<string>(initial);
  const [expanded, setExpanded] = useState(true);
  const [mobileListOpen, setMobileListOpen] = useState(false);

  useEffect(() => {
    if (focusParam && getFindingById(focusParam)) {
      setActiveId(focusParam); setSelected(focusParam);
    }
  }, [focusParam]);

  const chain = useMemo(() => getSupersedesChain(activeId), [activeId]);
  const latest = chain[chain.length - 1];
  const selectedFinding = getFindingById(selected);
  const latestFinding = getFindingById(latest);

  const chains = useMemo(() => {
    const seen = new Set<string>(); const out: string[][] = [];
    for (const r of roots) { const c = getSupersedesChain(r); const key = c.join('>'); if (seen.has(key)) continue; seen.add(key); out.push(c); }
    return out;
  }, [roots]);

  const selectChain = useCallback((id: string) => {
    setActiveId(id); setSelected(id); setExpanded(true); setMobileListOpen(false);
  }, []);

  const latestFindingIncident = useMemo(() => {
    if (!latestFinding) return [];
    return edges.filter((e) => e.src === latest || e.dst === latest);
  }, [latest, latestFinding]);

  // Mobile chain selector as dropdown
  const mobileChainOptions = useMemo(() => chains.map((c) => {
    const tail = getFindingById(c[c.length - 1]);
    return { id: c[0], label: `${c[0]} → ${c[c.length - 1]}: ${tail?.title?.slice(0, 50) || ''}`, count: c.length };
  }), [chains]);

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

        {/* Mobile chain selector */}
        <div className="flex items-center gap-2 border-b border-border-subtle bg-surface px-4 py-2 md:hidden">
          <select value={activeId} onChange={(e) => selectChain(e.target.value)}
            className="flex-1 h-10 rounded-sm border border-border-subtle bg-surface-2 px-2 font-mono text-[12px] text-text outline-none cursor-pointer">
            {mobileChainOptions.map((opt) => (<option key={opt.id} value={opt.id}>{opt.label} ({opt.count})</option>))}
          </select>
        </div>

        {/* Lineage summary bar */}
        {chain.length > 0 && (() => {
          const firstF = getFindingById(chain[0]); const lastF = getFindingById(latest);
          const firstConf = firstF?.confidence ? CONFIDENCE_RANK[firstF.confidence] || 0 : 0;
          const lastConf = lastF?.confidence ? CONFIDENCE_RANK[lastF.confidence] || 0 : 0;
          const confDir = lastConf > firstConf ? '↑' : lastConf < firstConf ? '↓' : '→';
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
                const isSelected = selected === id;
                const isFirst = i === 0;
                const isLast = i === chain.length - 1;
                // For chains > 2, collapse middle unless expanded
                const isMiddleCollapsed = chain.length > 2 && !isFirst && !isLast && !expanded;
                if (isMiddleCollapsed) {
                  if (i === 1 && !expanded) {
                    // Show a "show all" button instead of middle versions
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
                  return null; // skip collapsed middle versions after the show-all button
                }
                return (
                  <div key={id}>
                    <ChainCard
                      finding={f}
                      isLatest={isLatest}
                      selected={isSelected}
                      onClick={() => setSelected(id)}
                      onGoLatest={() => setSelected(latest)}
                    />
                    {i < chain.length - 1 && (
                      <>
                        <div className="flex items-center gap-2 py-2 pl-6 text-text-muted">
                          <ArrowDown className="size-4" />
                          <StatusBadge value="superseded" />
                          <span className="font-mono text-[10px] text-text-muted">by</span>
                        </div>
                        {/* Change summary between adjacent versions */}
                        {(() => {
                          const nextF = getFindingById(chain[i + 1]);
                          if (!nextF) return null;
                          // For collapsed multi-version, only show change summary between the visible pair
                          if (chain.length > 2 && !isLast) {
                            // Show change summary only for the last visible transition
                            if (expanded || i === chain.length - 2) {
                              return <ChangeSummary oldF={f} newF={nextF} />;
                            }
                            return null;
                          }
                          return <ChangeSummary oldF={f} newF={nextF} />;
                        })()}
                      </>
                    )}
                  </div>
                );
              })}

              {/* Expand all link when collapsed */}
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

      {/* Right inspector */}
      {selectedFinding && (
        <ResponsiveInspectorOverlay isOpen={!!selectedFinding} onDismiss={() => setSelected('')}>
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

// ── ChainCard ──────────────────────────────────────────────────────────
function ChainCard({ finding, isLatest, selected, onClick, onGoLatest }: {
  finding: Finding; isLatest: boolean; selected: boolean; onClick: () => void; onGoLatest: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={cn('block w-full rounded-sm border px-4 py-3 text-left transition-colors',
        selected ? 'border-brand-border bg-brand-muted' : 'border-border-subtle hover:border-border-strong')}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MonoId className={isLatest ? 'text-brand' : 'text-text-muted'}>{finding.id}</MonoId>
          <span className="font-mono text-[11px] text-text-muted">{finding.date}</span>
        </div>
        {isLatest ? (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-brand-border bg-brand-muted px-2 py-0.5 font-mono text-[11px] text-brand">
            Current claim
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-amber/30 bg-amber/10 px-2 py-0.5 font-mono text-[10px] text-amber">
            Superseded
          </span>
        )}
      </div>

      {/* Title */}
      <div className="mt-1.5 text-[14px] text-text">{finding.title}</div>

      {/* Confidence + category */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {finding.confidence === 'superseded' ? (
          <StatusBadge value="superseded" />
        ) : (
          <ConfidenceIndicator level={finding.confidence as 'high' | 'medium-high' | 'medium' | 'low'} />
        )}
        <StatusBadge value={finding.category} showDot={false} />
      </div>

      {/* Summary */}
      <p className="mt-1.5 text-[12px] text-text-secondary leading-relaxed">{finding.summary}</p>

      {/* Supersede reason (for historical) */}
      {!isLatest && finding.supersedeReason && (
        <div className="mt-2 flex items-start gap-1.5 rounded-sm border border-amber/20 bg-amber/5 px-2.5 py-1.5">
          <AlertTriangle className="size-3 shrink-0 mt-0.5 text-amber" />
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-amber">Why superseded</span>
            <p className="text-[12px] text-text-muted mt-0.5">{finding.supersedeReason}</p>
          </div>
        </div>
      )}

      {/* Evidence */}
      <div className="mt-2 flex items-center gap-1.5">
        <FlaskConical className="size-3 text-text-muted" />
        <span className="font-mono text-[11px] text-info">{finding.evidence.replace('experiments/', '')}</span>
      </div>

      {/* Go to latest (for historical) */}
      {!isLatest && (
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

// ── LineageInspector ───────────────────────────────────────────────────
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

        <Sec>Summary</Sec>
        <p className="text-[13px] leading-relaxed text-text-secondary">{finding.summary}</p>

        <Sec>Supersedes Relationships</Sec>
        <div className="space-y-1 font-mono text-[12px] text-text-secondary">
          {finding.supersedes ? <div>supersedes <Ref id={finding.supersedes} /></div> : null}
          {finding.supersededBy ? <div className="text-amber">superseded by <Ref id={finding.supersededBy} /></div> : null}
          {!finding.supersedes && !finding.supersededBy && <span className="text-text-muted">none</span>}
        </div>

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

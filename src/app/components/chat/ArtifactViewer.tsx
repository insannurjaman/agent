import { useState } from 'react';
import { Image as ImageIcon, Pause, Play, ArrowRight, WifiOff, X } from 'lucide-react';
import type { Artifact, TimelineItem } from '../../data/chat';
import { Markdown } from '../experiments/markdown';
import { EmptyState } from '../common/EmptyState';
import { cn } from '../ui/utils';

type Tab = 'preview' | 'metadata' | 'related' | 'timeline';

export interface RelatedItem {
  label: string;
  id: string;
  tone: string;
}

export function ArtifactViewer({
  artifact,
  autoFollow,
  onPause,
  onResume,
  onOpenLatest,
  newArtifact,
  onKeepPinned,
  timeline,
  onTimelineOpen,
  related,
  backendOffline,
  onNav,
}: {
  artifact: Artifact | null;
  autoFollow: boolean;
  onPause: () => void;
  onResume: () => void;
  onOpenLatest: () => void;
  newArtifact: { id: string; name: string } | null;
  onKeepPinned: () => void;
  timeline: TimelineItem[];
  onTimelineOpen: (item: TimelineItem) => void;
  related: RelatedItem[];
  backendOffline: boolean;
  onNav: (id: string) => void;
}) {
  const [tab, setTab] = useState<Tab>('preview');

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-l border-border-subtle bg-surface md:w-[360px] xl:w-[420px]">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h2 className="text-text" style={{ fontSize: '14px' }}>
          Artifact Viewer
        </h2>
      </div>

      {!artifact ? (
        <EmptyState
          icon={ImageIcon}
          title="No artifacts yet"
          hint="Generated PNG, HTML, and JSON artifacts will appear here."
        />
      ) : (
        <>
          {/* Auto-follow banner */}
          {autoFollow ? (
            <div className="flex items-center gap-2 border-b border-border-subtle bg-brand-muted px-4 py-1.5">
              <span className="size-1.5 rounded-full bg-brand" />
              <span className="font-mono text-[11px] text-brand">Following latest artifact</span>
              <button
                type="button"
                onClick={onPause}
                className="ml-auto flex items-center gap-1 font-mono text-[11px] text-text-secondary hover:text-text"
              >
                <Pause className="size-3" /> Pause auto-follow
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-amber/[0.06] px-4 py-1.5">
              <span className="size-1.5 rounded-full bg-amber" />
              <span className="font-mono text-[11px] text-amber">Auto-follow paused · viewing pinned artifact</span>
              <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={onResume} className="flex items-center gap-1 font-mono text-[11px] text-text-secondary hover:text-text">
                  <Play className="size-3" /> Resume
                </button>
                <button type="button" onClick={onOpenLatest} className="flex items-center gap-1 font-mono text-[11px] text-brand hover:underline">
                  Open latest <ArrowRight className="size-3" />
                </button>
              </div>
            </div>
          )}

          {/* New artifact notification (while paused) */}
          {!autoFollow && newArtifact && (
            <div className="flex items-center gap-2 border-b border-border-subtle bg-surface-2 px-4 py-2">
              <span className="size-1.5 rounded-full bg-brand" />
              <span className="font-mono text-[11px] text-text-secondary">
                New artifact generated: <span className="text-brand">{newArtifact.name}</span>
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={onOpenLatest} className="font-mono text-[11px] text-brand hover:underline">
                  Open latest
                </button>
                <button type="button" onClick={onKeepPinned} className="flex items-center gap-0.5 font-mono text-[11px] text-text-muted hover:text-text-secondary">
                  Keep pinned <X className="size-3" />
                </button>
              </div>
            </div>
          )}

          {/* Backend offline cached banner */}
          {backendOffline && (
            <div className="flex items-center gap-2 border-b border-border-subtle bg-red/[0.06] px-4 py-1.5">
              <WifiOff className="size-3.5 text-red" />
              <span className="font-mono text-[11px] text-red">Backend offline · showing cached preview</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-0.5 border-b border-border-subtle bg-surface px-2 py-1.5">
            {(['preview', 'metadata', 'related', 'timeline'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  'rounded-sm px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition-colors',
                  tab === t ? 'bg-brand-muted text-brand' : 'text-text-muted hover:text-text-secondary',
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            {tab === 'preview' && <Preview artifact={artifact} />}
            {tab === 'metadata' && <Metadata artifact={artifact} />}
            {tab === 'related' && <Related related={related} onNav={onNav} />}
            {tab === 'timeline' && <Timeline timeline={timeline} onOpen={onTimelineOpen} />}
          </div>
        </>
      )}
    </aside>
  );
}

function Preview({ artifact }: { artifact: Artifact }) {
  return (
    <div>
      <ArtifactBody artifact={artifact} />
      {artifact.caption && <p className="mt-3 text-[12px] leading-relaxed text-text-secondary">{artifact.caption}</p>}
      <div className="mt-3 space-y-1 font-mono text-[11px]">
        <Row k="file path" v={artifact.path} />
        <Row k="generated" v={artifact.generatedAt} />
        <Row k="source command" v={artifact.sourceCommand} accent />
      </div>
    </div>
  );
}

function ArtifactBody({ artifact }: { artifact: Artifact }) {
  switch (artifact.type) {
    case 'png':
      return <PngPreview />;
    case 'json':
      return (
        <div className="overflow-auto rounded-sm border border-border-subtle bg-surface-2 p-3">
          <JsonTree value={artifact.json} depth={0} />
        </div>
      );
    case 'html':
      return (
        <iframe
          title={artifact.name}
          sandbox=""
          srcDoc={artifact.html ?? '<p>preview</p>'}
          className="h-72 w-full rounded-sm border border-border-subtle bg-white"
        />
      );
    case 'markdown':
      return (
        <div className="rounded-sm border border-border-subtle bg-surface-2 p-3">
          <Markdown source={artifact.markdown ?? ''} />
        </div>
      );
    case 'log':
      return (
        <pre className="overflow-auto rounded-sm border border-border-subtle bg-surface-2 p-3 font-mono text-[11px] leading-relaxed text-text-secondary">
          {artifact.log}
        </pre>
      );
    default:
      return null;
  }
}

function PngPreview() {
  return (
    <div className="overflow-hidden rounded-sm border border-border-subtle bg-surface-2">
      <div className="relative h-56 bg-[radial-gradient(circle,#252b30_1px,transparent_1px)] [background-size:14px_14px]">
        <svg viewBox="0 0 400 220" preserveAspectRatio="none" className="absolute inset-0 size-full">
          <line x1="40" y1="10" x2="40" y2="190" stroke="#343c43" strokeWidth="1" />
          <line x1="40" y1="190" x2="390" y2="190" stroke="#343c43" strokeWidth="1" />
          {[60, 120, 180, 240, 300, 360].map((x, i) => (
            <circle key={i} cx={x} cy={180 - i * 22 - (i % 2) * 10} r="4" fill="#ff3e01" />
          ))}
          <polyline points="60,160 120,150 180,120 240,108 300,80 360,58" fill="none" stroke="#ff3e01" strokeWidth="1.5" />
          <polyline points="60,176 120,170 180,160 240,150 300,138 360,120" fill="none" stroke="#6ba6ff" strokeWidth="1" strokeDasharray="3 3" />
        </svg>
      </div>
    </div>
  );
}

function JsonTree({ value, depth }: { value: unknown; depth: number }) {
  if (value === null) return <span className="text-text-muted">null</span>;
  if (typeof value !== 'object') {
    const color = typeof value === 'number' ? 'text-brand' : typeof value === 'boolean' ? 'text-amber' : 'text-text-secondary';
    return <span className={cn('font-mono text-[11px]', color)}>{JSON.stringify(value)}</span>;
  }
  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);
  return (
    <div style={{ paddingLeft: depth ? 12 : 0 }}>
      {entries.map(([k, v]) => (
        <div key={k} className="py-0.5 font-mono text-[11px]">
          <span className="text-text-muted">{k}</span>
          <span className="text-text-muted">: </span>
          <JsonTree value={v} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}

function Metadata({ artifact }: { artifact: Artifact }) {
  return (
    <div className="space-y-1.5 font-mono text-[11px]">
      <Row k="PATH" v={artifact.path} />
      <Row k="TYPE" v={artifact.type.toUpperCase()} />
      <Row k="SOURCE" v={artifact.sourceCommand} accent />
      <Row k="STATUS" v="generated" />
      <Row k="SIZE" v={artifact.size} />
      <Row k="GENERATED BY" v={artifact.generatedBy} />
      <Row k="LAST UPDATED" v={artifact.generatedAt} />
    </div>
  );
}

function Related({ related, onNav }: { related: RelatedItem[]; onNav: (id: string) => void }) {
  if (related.length === 0) return <span className="text-[12px] text-text-muted">No related items.</span>;
  return (
    <div className="space-y-2">
      {related.map((it) => (
        <div key={it.label} className="flex items-center justify-between rounded-sm border border-border-subtle bg-surface-2 px-3 py-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-text-muted">{it.label}</span>
          <button type="button" onClick={() => onNav(it.id)} className={cn('font-mono text-[12px] hover:underline', it.tone)}>
            {it.id.replace('experiments/', '')}
          </button>
        </div>
      ))}
    </div>
  );
}

function Timeline({ timeline, onOpen }: { timeline: TimelineItem[]; onOpen: (item: TimelineItem) => void }) {
  return (
    <ol className="relative ml-1 border-l border-border-strong pl-4">
      {timeline.map((t, i) => {
        const clickable = !!t.artifactId;
        return (
          <li key={i} className="relative pb-3 last:pb-0">
            <span className="absolute -left-[21px] top-1 flex size-4 items-center justify-center rounded-full border border-border-strong bg-surface text-[9px] text-brand">
              {i + 1}
            </span>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onOpen(t)}
              className={cn(
                'text-left text-[12px]',
                clickable ? 'text-text-secondary hover:text-brand hover:underline' : 'cursor-default text-text-secondary',
              )}
            >
              {t.label}
            </button>
            <div className="font-mono text-[10px] text-text-muted">{t.time}</div>
          </li>
        );
      })}
    </ol>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 uppercase tracking-wide text-text-muted">{k}</span>
      <span className={cn('text-right break-all', accent ? 'text-brand' : 'text-text-secondary')}>{v}</span>
    </div>
  );
}

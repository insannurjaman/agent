import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { FolderTree, AlertTriangle, Share2, Copy, Image as ImageIcon } from 'lucide-react';
import { experiments, getExperimentBySlug } from '../../data';
import type { Experiment } from '../../data';
import { StatusBadge } from '../common/StatusBadge';
import { MonoId } from '../common/primitives';
import { EmptyState } from '../common/EmptyState';
import { AskClaudeButton, NavActionButton } from '../common/AskClaudeActions';
import { Markdown, extractHeadings } from './markdown';
import { useBreakpoint } from '../responsive/useBreakpoint';
import { cn } from '../ui/utils';

export function ExperimentsScreen() {
  const params = useParams();
  const navigate = useNavigate();
  const bp = useBreakpoint();
  // The :slug param captures the rest of the path after /experiments/.
  const slugParam = params['*'] ?? '';
  const sorted = useMemo(() => [...experiments].sort((a, b) => b.date.localeCompare(a.date)), []);
  const active = slugParam ? getExperimentBySlug(slugParam) : sorted[0];

  // Mobile: list-first — show the list until an experiment is chosen, then the report.
  const mobileShowReport = bp === 'mobile' && !!slugParam && !!active;
  const mobileShowList = bp === 'mobile' && !mobileShowReport;

  return (
    <div className="flex h-full">
      {/* Left: experiment list */}
      <div
        className={cn(
          'flex shrink-0 flex-col border-r border-border-subtle bg-surface',
          'w-full md:w-[300px] lg:w-[340px]',
          bp === 'mobile' && !mobileShowList && 'hidden',
        )}
      >
        <div className="border-b border-border-subtle px-4 py-3">
          <h1 className="text-text" style={{ fontSize: '15px' }}>
            Experiments & Reports
          </h1>
          <p className="mt-0.5 font-mono text-[11px] text-text-muted">
            {experiments.length} experiments + _template
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-2">
          {sorted.map((e) => (
            <ExperimentListItem
              key={e.slug}
              exp={e}
              active={active?.slug === e.slug}
              onClick={() => navigate(`/experiments/${e.slug}`)}
            />
          ))}
        </div>
      </div>

      {/* Center: report viewer */}
      <div className={cn('flex min-w-0 flex-1 flex-col bg-background', mobileShowList && 'hidden')}>
        {active ? (
          <>
            {bp === 'mobile' && (
              <button
                type="button"
                onClick={() => navigate('/experiments')}
                className="flex items-center gap-1.5 border-b border-border-subtle bg-surface px-4 py-2 text-left font-mono text-[12px] text-teal"
              >
                ← All experiments
              </button>
            )}
            <ReportViewer exp={active} />
          </>
        ) : (
          <EmptyState title="Select an experiment" />
        )}
      </div>

      {/* Right: outline + metadata — desktop only */}
      {active && (
        <div className="hidden xl:flex">
          <OutlinePanel exp={active} />
        </div>
      )}
    </div>
  );
}

function ExperimentListItem({
  exp,
  active,
  onClick,
}: {
  exp: Experiment;
  active: boolean;
  onClick: () => void;
}) {
  const bare = exp.slug.replace('experiments/', '');
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'mb-1.5 w-full rounded-sm border px-3 py-2.5 text-left transition-colors',
        active
          ? 'border-teal/40 bg-surface-2'
          : 'border-border-subtle bg-surface hover:border-border-strong hover:bg-surface-2',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <MonoId className="text-teal">{bare}</MonoId>
        <StatusBadge value={exp.outdated ? 'outdated' : exp.reportStatus} showDot={false} />
      </div>
      <div className="mt-1 line-clamp-1 text-[13px] text-text">{exp.title}</div>
      <ul className="mt-1.5 space-y-0.5">
        {exp.conclusions.slice(0, 3).map((c, i) => (
          <li key={i} className="flex gap-1.5 text-[11px] leading-snug text-text-muted">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-border-strong" />
            <span className="line-clamp-1">{c}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-text-muted">
        <span>{exp.relatedFindings.length} findings</span>
        <span>·</span>
        <span>{exp.lastModified}</span>
      </div>
    </button>
  );
}

function ReportViewer({ exp }: { exp: Experiment }) {
  const hasReport = exp.reportStatus === 'report' && exp.report;
  const doc = hasReport ? exp.report! : exp.readme;
  const docKind = hasReport ? 'REPORT.md' : 'README.md';
  const path = `${exp.slug}/${docKind}`;

  return (
    <>
      <div className="border-b border-border-subtle bg-surface px-6 py-4">
        <div className="flex items-center gap-2">
          <StatusBadge value={exp.outdated ? 'outdated' : exp.reportStatus} />
          {exp.reportStatus === 'exploration-only' && (
            <span className="font-mono text-[11px] text-text-muted">
              No REPORT — showing README
            </span>
          )}
          {exp.reportStatus === 'missing' && (
            <span className="font-mono text-[11px] text-text-muted">
              REPORT.md not found — showing README
            </span>
          )}
        </div>
        <h1 className="mt-2 text-text" style={{ fontSize: '18px' }}>
          {exp.title}
        </h1>
        <MonoId muted className="mt-1 block">
          {path}
        </MonoId>
        {exp.outdated && (
          <div className="mt-3 flex items-center gap-2 rounded-sm border border-red/30 bg-red/10 px-3 py-2">
            <AlertTriangle className="size-4 text-red" />
            <span className="text-[12px] text-red">
              Outdated data — fit before the dedup fix (F-0038). Conclusions may shift on refit.
            </span>
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
        <div className="max-w-3xl">
          <Markdown source={doc} />
        </div>
      </div>
    </>
  );
}

function OutlinePanel({ exp }: { exp: Experiment }) {
  const navigate = useNavigate();
  const hasReport = exp.reportStatus === 'report' && exp.report;
  const headings = extractHeadings(hasReport ? exp.report! : exp.readme).filter((h) => h.level > 1);

  const Label = ({ children }: { children: React.ReactNode }) => (
    <div className="mt-5 mb-2 font-mono text-[11px] uppercase tracking-wider text-text-muted first:mt-0">
      {children}
    </div>
  );

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-border-subtle bg-surface">
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        <Label>On This Page</Label>
        <nav className="flex flex-col gap-1">
          {headings.length === 0 && <span className="text-[12px] text-text-muted">No sections</span>}
          {headings.map((h) => (
            <a
              key={h.id}
              href={`#${h.id}`}
              className="border-l border-border-subtle pl-2 text-[12px] text-text-secondary transition-colors hover:border-teal hover:text-text"
            >
              {h.text}
            </a>
          ))}
        </nav>

        <Label>Metadata</Label>
        <div className="space-y-1.5 font-mono text-[11px]">
          <MetaLine k="SOURCE" v={exp.slug} />
          <MetaLine k="REPORT PATH" v={hasReport ? `${exp.slug}/REPORT.md` : '—'} />
          <MetaLine k="README PATH" v={`${exp.slug}/README.md`} />
          <MetaLine k="FIGURES" v={`${exp.figures.length}`} />
          <MetaLine k="LAST INDEXED" v={exp.lastModified} />
        </div>

        <Label>Data Freshness</Label>
        <div className="space-y-1.5 rounded-sm border border-border-subtle bg-surface-2 px-3 py-2 font-mono text-[11px]">
          <MetaLine k="parquet_mtime" v={exp.freshness.parquetMtime} />
          <MetaLine k="row_counts" v={exp.freshness.rowCounts} />
          <MetaLine k="date_range" v={exp.freshness.dateRange} />
        </div>

        <Label>Related Findings</Label>
        <div className="flex flex-wrap gap-1.5">
          {exp.relatedFindings.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => navigate(`/findings?focus=${f}`)}
              className="rounded-sm border border-green/30 bg-green/10 px-1.5 py-0.5 font-mono text-[11px] text-green hover:bg-green/15"
            >
              {f}
            </button>
          ))}
        </div>

        {exp.relatedQuestions && exp.relatedQuestions.length > 0 && (
          <>
            <Label>Related Open Questions</Label>
            <div className="flex flex-wrap gap-1.5">
              {exp.relatedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => navigate(`/findings?tab=questions&focus=${q}`)}
                  className="rounded-sm border border-amber/30 bg-amber/10 px-1.5 py-0.5 font-mono text-[11px] text-amber hover:bg-amber/15"
                >
                  {q}
                </button>
              ))}
            </div>
          </>
        )}

        {exp.figures.length > 0 && (
          <>
            <Label>Figures</Label>
            <div className="space-y-1">
              {exp.figures.map((fig) => (
                <div
                  key={fig}
                  className="flex items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1.5"
                >
                  <ImageIcon className="size-3.5 shrink-0 text-text-muted" />
                  <span className="truncate font-mono text-[11px] text-text-secondary">
                    {fig.replace('outputs/figures/', '')}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <Label>Actions</Label>
        <div className="flex flex-col gap-2">
          <NavActionButton onClick={() => navigate('/graph')}>
            <Share2 className="size-3.5" /> View in Graph
          </NavActionButton>
          <NavActionButton onClick={() => navigate('/chat')}>
            <FolderTree className="size-3.5" /> Open Evidence
          </NavActionButton>
          <NavActionButton>
            <Copy className="size-3.5" /> Copy Path
          </NavActionButton>
          <AskClaudeButton
            onClick={() =>
              navigate(
                `/chat?ctx=${[exp.slug, ...exp.relatedFindings, ...(exp.relatedQuestions ?? [])].join(',')}`,
              )
            }
          >
            Ask Claude about this report
          </AskClaudeButton>
        </div>
      </div>
    </aside>
  );
}

function MetaLine({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="shrink-0 uppercase tracking-wide text-text-muted">{k}</span>
      <span className="truncate text-right text-text-secondary">{v}</span>
    </div>
  );
}

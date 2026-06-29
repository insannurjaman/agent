import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  AlertTriangle,
  Check,
  Copy,
  FileText,
  FolderTree,
  Image as ImageIcon,
  PanelRightOpen,
  Share2,
} from 'lucide-react';
import { experiments, getExperimentBySlug, canonicalExperimentPath } from '../../data';
import type { Experiment } from '../../data';
import { StatusBadge } from '../common/StatusBadge';
import { MonoId } from '../common/primitives';
import { EmptyState } from '../common/EmptyState';
import { AskClaudeButton, NavActionButton } from '../common/AskClaudeActions';
import { Drawer } from '../responsive/Drawer';
import { Markdown, extractHeadings, type Heading } from './markdown';
import { useBreakpoint } from '../responsive/useBreakpoint';
import { cn } from '../ui/utils';

export function ExperimentsScreen() {
  const params = useParams();
  const navigate = useNavigate();
  const bp = useBreakpoint();
  const slugParam = params['*'] ?? '';
  const sorted = useMemo(() => [...experiments].sort((a, b) => b.date.localeCompare(a.date)), []);
  const active = slugParam ? getExperimentBySlug(slugParam) : sorted[0];

  const mobileShowReport = bp === 'mobile' && !!slugParam && !!active;
  const mobileShowList = bp === 'mobile' && !mobileShowReport;

  return (
    <div className="flex h-full">
      <section
        aria-label="Experiment reports"
        className={cn(
          'flex shrink-0 flex-col border-r border-border-subtle bg-surface',
          'w-full md:w-[300px] lg:w-[320px]',
          bp === 'mobile' && !mobileShowList && 'hidden',
        )}
      >
        <div className="border-b border-border-subtle px-4 py-3.5">
          <h1 className="text-[15px] font-semibold text-text">Experiments & Reports</h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {experiments.length} indexed experiments · 1 template
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-2 py-2.5 [scrollbar-gutter:stable]">
          <div className="space-y-2">
            {sorted.map((experiment) => (
              <ExperimentListItem
                key={experiment.slug}
                exp={experiment}
                active={active?.slug === experiment.slug}
                onClick={() => navigate(canonicalExperimentPath(experiment.slug))}
              />
            ))}
          </div>
        </div>
      </section>

      <div className={cn('flex min-w-0 flex-1 bg-background', mobileShowList && 'hidden')}>
        {active ? (
          <ReportWorkspace
            key={active.slug}
            exp={active}
            showMobileBack={bp === 'mobile'}
            onBack={() => navigate('/experiments')}
          />
        ) : (
          <EmptyState title="Select an experiment" hint="Choose an experiment from the list to view its report." />
        )}
      </div>
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
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative min-h-28 w-full overflow-hidden rounded-sm border px-3 py-3 text-left outline-none transition-[background-color,border-color,box-shadow]',
        'focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand-ring',
        active
          ? 'border-brand-border bg-brand-muted shadow-[inset_0_0_0_1px_rgba(255,62,1,0.04)]'
          : 'border-border-subtle bg-surface hover:border-border-strong hover:bg-surface-hover',
      )}
    >
      {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-brand" />}

      <div className="flex items-start justify-between gap-3">
        <h2 className={cn('line-clamp-2 text-[13px] font-semibold leading-snug', active ? 'text-text' : 'text-text-secondary group-hover:text-text')}>
          {exp.title}
        </h2>
        <StatusBadge
          value={exp.outdated ? 'outdated' : exp.reportStatus}
          showDot={false}
          className="mt-0.5 shrink-0 text-[9px]"
        />
      </div>

      <div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] text-text-muted">
        <span className={cn('truncate', active && 'text-brand')}>{bare}</span>
        <span aria-hidden>·</span>
        <span className="shrink-0">{exp.date}</span>
      </div>

      <ul className="mt-2 space-y-1">
        {exp.conclusions.slice(0, 2).map((conclusion, index) => (
          <li key={index} className="flex gap-1.5 text-[11px] leading-[1.45] text-text-muted">
            <span className="mt-[6px] size-1 shrink-0 rounded-full bg-border-strong" />
            <span className="line-clamp-1">{conclusion}</span>
          </li>
        ))}
      </ul>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border-subtle pt-2 font-mono text-[10px] text-text-muted">
        <span>{exp.relatedFindings.length} findings</span>
        <span className="truncate text-right">modified {exp.lastModified}</span>
      </div>
    </button>
  );
}

function ReportWorkspace({
  exp,
  showMobileBack,
  onBack,
}: {
  exp: Experiment;
  showMobileBack: boolean;
  onBack: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);

  const hasReport = exp.reportStatus === 'report' && !!exp.report;
  const doc = hasReport ? exp.report! : exp.readme;
  const headings = useMemo(
    () => extractHeadings(doc).filter((heading) => heading.level > 1),
    [doc],
  );

  useEffect(() => {
    setActiveSection(headings[0]?.id ?? '');
  }, [exp.slug, headings]);

  const handleReportScroll = () => {
    const scroller = scrollRef.current;
    if (!scroller || headings.length === 0) return;

    const scrollerTop = scroller.getBoundingClientRect().top;
    let current = headings[0].id;
    for (const heading of headings) {
      const element = scroller.querySelector<HTMLElement>(`[data-report-heading="${heading.id}"]`);
      if (element && element.getBoundingClientRect().top - scrollerTop <= 120) current = heading.id;
    }
    setActiveSection(current);
  };

  const scrollToSection = (id: string) => {
    const scroller = scrollRef.current;
    const element = scroller?.querySelector<HTMLElement>(`[data-report-heading="${id}"]`);
    if (!scroller || !element) return;
    scroller.scrollTo({ top: element.offsetTop - 18, behavior: 'smooth' });
    setActiveSection(id);
  };

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col">
        {showMobileBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex min-h-11 items-center gap-1.5 border-b border-border-subtle bg-surface px-4 text-left font-mono text-[12px] text-brand outline-none hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-brand-ring"
          >
            ← All experiments
          </button>
        )}

        <ReportHeader exp={exp} onOpenDetails={() => setDetailsOpen(true)} />

        <div
          ref={scrollRef}
          onScroll={handleReportScroll}
          className="min-h-0 flex-1 overflow-auto px-4 py-5 [scrollbar-gutter:stable] sm:px-6 lg:px-8 lg:py-7"
        >
          <article className="mx-auto max-w-[800px]">
            <Markdown source={doc} suppressTitle />
          </article>
        </div>
      </div>

      <aside className="hidden h-full w-[300px] shrink-0 border-l border-border-subtle bg-surface xl:flex">
        <ReportDetailsContent
          exp={exp}
          headings={headings}
          activeSection={activeSection}
          onSelectSection={scrollToSection}
        />
      </aside>

      {detailsOpen && (
        <div className="xl:hidden">
          <Drawer side="right" width="w-full sm:w-[380px]" onClose={() => setDetailsOpen(false)}>
            <ReportDetailsContent
              exp={exp}
              headings={headings}
              activeSection={activeSection}
              onSelectSection={(id) => {
                setDetailsOpen(false);
                requestAnimationFrame(() => scrollToSection(id));
              }}
              onClose={() => setDetailsOpen(false)}
            />
          </Drawer>
        </div>
      )}
    </>
  );
}

function ReportHeader({ exp, onOpenDetails }: { exp: Experiment; onOpenDetails: () => void }) {
  const hasReport = exp.reportStatus === 'report' && exp.report;
  const docKind = hasReport ? 'REPORT.md' : 'README.md';
  const path = `${exp.slug}/${docKind}`;

  return (
    <header className="relative border-b border-border-subtle bg-surface px-4 py-4 sm:px-6 lg:px-8">
      <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={exp.outdated ? 'outdated' : exp.reportStatus} />
            {!hasReport && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                {exp.reportStatus === 'missing' ? 'Report missing · README fallback' : 'Exploration · README'}
              </span>
            )}
          </div>
          <h2 className="mt-2.5 pr-12 text-[19px] font-semibold leading-tight text-text sm:pr-36 sm:text-[21px]">
            {exp.title}
          </h2>
          <MonoId muted className="mt-1.5 block break-all text-[10px] sm:text-[11px]">
            {path}
          </MonoId>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-wide text-text-muted">
            <span>{exp.date}</span>
            <span aria-hidden>·</span>
            <span>{exp.relatedFindings.length} findings</span>
            <span aria-hidden>·</span>
            <span>modified {exp.lastModified}</span>
          </div>
      </div>

      <button
        type="button"
        onClick={onOpenDetails}
        aria-label="Report details"
        className="absolute right-4 top-4 flex min-h-10 shrink-0 items-center gap-2 rounded-sm border border-border-strong bg-surface-2 px-3 text-[12px] text-text-secondary outline-none transition-colors hover:border-brand-border hover:text-text focus-visible:ring-2 focus-visible:ring-brand-ring sm:right-6 lg:right-8 xl:hidden"
      >
        <PanelRightOpen className="size-4" />
        <span className="hidden sm:inline">Report details</span>
      </button>

      {exp.outdated && (
        <div className="mt-3 flex items-start gap-2 rounded-sm border border-error/30 bg-error/10 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-error" />
          <span className="text-[12px] leading-relaxed text-error">
            Outdated data — fit before the dedup fix (F-0038). Conclusions may shift on refit.
          </span>
        </div>
      )}
    </header>
  );
}

function ReportDetailsContent({
  exp,
  headings,
  activeSection,
  onSelectSection,
  onClose,
}: {
  exp: Experiment;
  headings: Heading[];
  activeSection: string;
  onSelectSection: (id: string) => void;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const hasReport = exp.reportStatus === 'report' && exp.report;
  const reportPath = hasReport ? `${exp.slug}/REPORT.md` : `${exp.slug}/README.md`;

  const copyPath = async () => {
    try {
      await navigator.clipboard.writeText(reportPath);
    } catch {
      // Fallback: try the old method
      try {
        const textarea = document.createElement('textarea');
        textarea.value = reportPath;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.setAttribute('aria-hidden', 'true');
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      } catch {
        // Feedback still confirms the intended local prototype action.
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className="flex min-h-12 items-center justify-between border-b border-border-subtle px-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Report details</div>
          <div className="mt-0.5 truncate text-[12px] text-text-secondary">{exp.title}</div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-sm px-2 font-mono text-[11px] text-text-muted hover:bg-surface-hover hover:text-text focus-visible:ring-2 focus-visible:ring-brand-ring"
          >
            Close
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4 [scrollbar-gutter:stable]">
        <DetailSection title="On this page">
          <nav aria-label="Report sections" className="flex flex-col gap-0.5">
            {headings.length === 0 && <span className="text-[12px] text-text-muted">No sections</span>}
            {headings.map((heading) => (
              <button
                key={heading.id}
                type="button"
                onClick={() => onSelectSection(heading.id)}
                className={cn(
                  'min-h-11 border-l-2 px-2 text-left text-[12px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-ring',
                  activeSection === heading.id
                    ? 'border-brand bg-brand-muted text-text'
                    : 'border-border-subtle text-text-secondary hover:border-border-strong hover:bg-surface-hover hover:text-text',
                )}
              >
                {heading.text}
              </button>
            ))}
          </nav>
        </DetailSection>

        <DetailSection title="Overview">
          <div className="rounded-sm border border-border-subtle bg-surface-2 px-3">
            <MetaLine k="SOURCE" v={exp.slug} />
            <MetaLine k="DOCUMENT" v={hasReport ? 'REPORT.md' : 'README.md'} />
            <MetaLine k="FIGURES" v={`${exp.figures.length}`} />
            <MetaLine k="INDEXED" v={exp.lastModified} />
          </div>
        </DetailSection>

        <DetailSection title="Data freshness">
          <div className="rounded-sm border border-border-subtle bg-code-surface px-3">
            <MetaLine k="PARQUET" v={exp.freshness.parquetMtime} />
            <MetaLine k="ROWS" v={exp.freshness.rowCounts} />
            <MetaLine k="RANGE" v={exp.freshness.dateRange} />
          </div>
        </DetailSection>

        <DetailSection title="Relationships">
          <div className="flex flex-wrap gap-1.5">
            {exp.relatedFindings.map((finding) => (
              <button
                key={finding}
                type="button"
                onClick={() => navigate(`/findings?focus=${finding}`)}
                className="min-h-11 rounded-sm border border-brand-border bg-brand-muted px-2 font-mono text-[11px] text-brand outline-none hover:bg-brand-surface focus-visible:ring-2 focus-visible:ring-brand-ring"
              >
                {finding}
              </button>
            ))}
            {exp.relatedQuestions?.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => navigate(`/findings?tab=questions&focus=${question}`)}
                className="min-h-11 rounded-sm border border-warning/30 bg-warning/10 px-2 font-mono text-[11px] text-warning outline-none hover:bg-warning/15 focus-visible:ring-2 focus-visible:ring-brand-ring"
              >
                {question}
              </button>
            ))}
          </div>
        </DetailSection>

        {exp.figures.length > 0 && (
          <DetailSection title="Figures">
            <div className="space-y-1.5">
              {exp.figures.map((figure) => (
                <div
                  key={figure}
                  className="flex min-h-11 items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2.5"
                >
                  <ImageIcon className="size-3.5 shrink-0 text-info" />
                  <span className="truncate font-mono text-[11px] text-text-secondary">
                    {figure.replace('outputs/figures/', '')}
                  </span>
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        <DetailSection title="Actions">
          <div className="flex flex-col gap-2">
            <NavActionButton onClick={() => navigate(`/graph?focus=${exp.relatedFindings[0] ?? ''}`)}>
              <Share2 className="size-3.5" /> View in Graph
            </NavActionButton>
            <NavActionButton onClick={() => navigate(`/chat?ctx=${exp.slug}`)}>
              <FolderTree className="size-3.5" /> Open Evidence
            </NavActionButton>
            <NavActionButton onClick={copyPath}>
              {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              {copied ? 'Path copied' : 'Copy Path'}
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
        </DetailSection>
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 last:mb-0">
      <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">{title}</h2>
      {children}
    </section>
  );
}

function MetaLine({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[78px_minmax(0,1fr)] gap-3 border-b border-border-subtle py-2 last:border-0">
      <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted">{k}</span>
      <span className="break-words text-right font-mono text-[10px] leading-relaxed text-text-secondary">{v}</span>
    </div>
  );
}

import { ScreenHeader } from '../common/primitives';
import { repoStatus } from '../../data';

interface StubConfig {
  title: string;
  subtitle: string;
  mvp: string;
  summary: string;
  bullets: string[];
}

const STUBS: Record<string, StubConfig> = {
  '/overview': {
    title: 'Overview / System Map',
    subtitle: 'The analytical knowledge loop and documentation layers.',
    mvp: 'PLANNED',
    summary:
      'A console summary of the loop — Question → Review Knowledge → Create Experiment → Execute → Validation → Convert to Knowledge / Remaining Issues → Shared Report → Promotion (user-confirmed).',
    bullets: [
      'L0 — CLAUDE.md · critical promoted knowledge, manually updated',
      'L1 — doc/*.md · curated workflows, glossary, table knowledge',
      'L2 — knowledge/*.csv + recipes/ · machine-readable fact database',
      'L3 — experiments/<slug>/ · logs, README, REPORT, code, figures',
      `Repository: ${repoStatus.findings} findings · ${repoStatus.openQuestions} open questions · ${repoStatus.edges} edges · ${repoStatus.experiments} experiments`,
    ],
  },
  '/search': {
    title: 'Faceted Search',
    subtitle: 'Search across findings, open questions, and experiments using controlled vocabulary.',
    mvp: 'MVP-2',
    summary:
      'Exposes search_kg.py topic/facet/neighbors/exp modes over 6 controlled-vocabulary dimensions and 40 taxonomy terms.',
    bullets: [
      'Left facet panel · checkbox groups + tag chips + search-within',
      'Modes: Topic · Facet · Neighbors · Experiment',
      'Results grouped by Findings / Open Questions / Experiments',
      'This is the recommended primary search workflow, not a generic bar.',
    ],
  },
  '/graph': {
    title: 'Knowledge Graph',
    subtitle: `${repoStatus.edges} edges · Finding, Open Question, Experiment nodes`,
    mvp: 'MVP-2',
    summary:
      'Global force-directed view plus the primary practical Neighborhood Focus view (search_kg.py neighbors <ID>), with 1/2/3-hop depth.',
    bullets: [
      'Node types: F-NNNN (green) · Q-NNNN (amber) · experiment slug (teal)',
      'Edge types: origin · cite · report-use · supersedes · conflict-suspected · resolve-partial',
      'Dotted-grid canvas, minimap, pan/zoom, no browser scrollbars',
      'Supersedes / conflict-suspected edges rendered visually distinct',
    ],
  },
  '/lineage': {
    title: 'Lineage Trace',
    subtitle: 'Prevent reliance on outdated conclusions.',
    mvp: 'PLANNED',
    summary:
      'A precise technical chain view: F-0012 → superseded_by → F-0048 → latest valid claim, bridging the table viewer and the knowledge graph.',
    bullets: [
      'Obsolete finding → latest valid finding chain',
      'Citation sources and generating experiments',
      'Resolved / partially-resolved open questions',
      'Superseded items grayed: "Historical record. Do not use as latest conclusion."',
    ],
  },
  '/chat': {
    title: 'Chat Workspace',
    subtitle: 'Operator console stream — one interaction mode, not the whole product.',
    mvp: 'MVP-3',
    summary:
      'Three panes: Experiment Explorer · Claude chat stream · Artifact viewer. Each chat session binds to exactly one experiment directory (chat_id ⇄ slug).',
    bullets: [
      'Explorer root: experiments/<slug>/ (README, REPORT, analysis.py, outputs/)',
      'Artifacts: PNG preview · sandboxed HTML iframe · JSON tree',
      'Tool/run events: "analysis.py executed", "figure generated", "REPORT.md updated"',
      'Read-only knowledge: log/resolve happen via chat actions, not CSV edits.',
    ],
  },
  '/status': {
    title: 'System Status',
    subtitle: 'Local backend, repository, file watching, and Claude integration.',
    mvp: 'PLANNED',
    summary: 'An infrastructure console status page for the local stack.',
    bullets: [
      'Backend API: Connected · File delivery: Ready',
      `Knowledge CSV: Indexed · Graph edges: ${repoStatus.edges} loaded`,
      'Repository watcher: Active · Claude relay: Not configured',
      `Last indexed: ${repoStatus.indexedAgo}`,
    ],
  },
};

export function StubScreen({ route }: { route: string }) {
  const cfg = STUBS[route];
  if (!cfg) return null;
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={cfg.title} subtitle={cfg.subtitle} />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl rounded-sm border border-border-subtle bg-surface">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
              Specified · Not yet built
            </span>
            <span className="rounded-sm border border-brand-border bg-brand-muted px-1.5 py-0.5 font-mono text-[11px] uppercase text-brand">
              {cfg.mvp}
            </span>
          </div>
          <div className="px-4 py-4">
            <p className="text-[13px] text-text-secondary">{cfg.summary}</p>
            <ul className="mt-4 space-y-2">
              {cfg.bullets.map((b) => (
                <li key={b} className="flex gap-2 text-[13px] text-text-secondary">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-border-strong" />
                  <span className="font-mono text-[12px]">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

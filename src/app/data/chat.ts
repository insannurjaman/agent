// Chat Workspace data — agent-like local sessions, each bound to exactly
// one experiment directory. Read-only knowledge rule: updates are agent-mediated.
// V2: every session owns a complete bundle so panes never leak across experiments.

export type SessionStatus = 'running' | 'completed' | 'failed';

export interface ChatSession {
  id: string; // chat_YYYY-MM-DD_NNN
  title: string;
  slug: string; // experiments/<slug>
  status: SessionStatus;
  lastUpdated: string;
}

export type ArtifactType = 'png' | 'html' | 'json' | 'markdown' | 'log';

export interface FileNode {
  name: string;
  path: string; // relative to experiment root
  kind: 'dir' | 'file';
  type?: ArtifactType;
  modified?: boolean;
  generated?: boolean; // created during the current chat
  generatedAt?: string;
  children?: FileNode[];
}

export interface Artifact {
  id: string;
  name: string;
  path: string;
  type: ArtifactType;
  caption?: string;
  generatedAt: string;
  sourceCommand: string;
  size: string;
  generatedBy: string;
  json?: unknown;
  html?: string;
  markdown?: string;
  log?: string;
}

export interface TimelineItem {
  label: string;
  time: string;
  artifactId?: string; // opens this artifact when clicked
}

export interface FindingProposal {
  findingId: string;
  title: string;
  summary: string;
  confidence: string;
  evidence: string;
  facets: string[];
  supersedes?: string;
  actionable: boolean;
  targetFile: string;
  gateway: string;
}

export interface QuestionProposal {
  questionId: string;
  title: string;
  priority: string;
  status: string;
  area: string;
  relatedFinding: string;
  targetFile: string;
  gateway: string;
}

// ── Chat stream event union ──
export type ChatEvent =
  | { kind: 'user'; id: string; text: string; time: string }
  | { kind: 'claude'; id: string; text: string; time: string }
  | { kind: 'system'; id: string; label: string; detail?: string; time: string }
  | {
      kind: 'tool';
      id: string;
      action: string;
      command: string;
      status: 'completed' | 'running' | 'failed';
      result?: string;
      resultIds?: string[];
      time: string;
    }
  | {
      kind: 'analysis';
      id: string;
      summary: string;
      relatedFindings: { id: string; text: string }[];
      openQuestions: { id: string; text: string }[];
      time: string;
    }
  | { kind: 'exec'; id: string; command: string; duration: string; exitCode: number; time: string }
  | { kind: 'artifact'; id: string; artifactId: string; path: string; time: string }
  | { kind: 'report'; id: string; path: string; sections: string[]; time: string }
  | { kind: 'finding-proposal'; id: string; proposal: FindingProposal; time: string }
  | { kind: 'question-proposal'; id: string; proposal: QuestionProposal; time: string }
  | { kind: 'error'; id: string; command: string; exitCode: number; reason: string; time: string };

export interface SessionBundle {
  transcript: ChatEvent[];
  tree: FileNode[];
  artifacts: Record<string, Artifact>;
  timeline: TimelineItem[];
  context: string[];
  latestArtifactId: string | null;
}

export const sessions: ChatSession[] = [
  {
    id: 'chat_2026-06-17_001',
    title: 'Residual thickness investigation',
    slug: 'experiments/2026-06-17_roll_gap_variance',
    status: 'running',
    lastUpdated: '2026-06-17 11:42',
  },
  {
    id: 'chat_2026-06-16_004',
    title: 'Feed-rate threshold review',
    slug: 'experiments/2026-05-20_feed_rate_recheck',
    status: 'completed',
    lastUpdated: '2026-06-16 17:08',
  },
  {
    id: 'chat_2026-06-13_002',
    title: 'Shift handover null burst',
    slug: 'experiments/2026-05-13_handover_review',
    status: 'failed',
    lastUpdated: '2026-06-13 09:55',
  },
];

// ── Shared artifact builders ──
const thicknessPng: Artifact = {
  id: 'thickness_by_roll_gap.png',
  name: 'thickness_by_roll_gap.png',
  path: 'experiments/2026-06-17_roll_gap_variance/outputs/figures/thickness_by_roll_gap.png',
  type: 'png',
  caption: 'Thickness spread vs roll-gap setpoint, colored by entry-temperature band.',
  generatedAt: '2026-06-17 11:40',
  sourceCommand: 'python analysis.py --plot thickness_by_roll_gap',
  size: '184 KB',
  generatedBy: 'analysis.py',
};

// ── Session 1: running — roll_gap_variance (rich transcript) ──
const s1: SessionBundle = {
  context: ['F-0050', 'Q-0014', 'experiments/2026-06-08_anomaly_check', 'report:2026-05-20_feed_rate_recheck/REPORT.md'],
  latestArtifactId: 'thickness_by_roll_gap.png',
  transcript: [
    { kind: 'user', id: 'e1', time: '11:30', text: 'Investigate why entry temperature accounts for residual thickness variance after roll-gap adjustment.' },
    { kind: 'claude', id: 'e2', time: '11:30', text: "I'll first search existing findings and open questions, then create a follow-up experiment if the current evidence is insufficient." },
    {
      kind: 'tool',
      id: 'e3',
      time: '11:31',
      action: 'search_kg.py facet',
      command: 'search_kg.py facet process:rolling equipment:roll-gap phenomena:thermal',
      status: 'completed',
      result: '4 findings · 2 open questions',
      resultIds: ['F-0050', 'F-0048', 'Q-0014', 'Q-0011'],
    },
    { kind: 'claude', id: 'e4', time: '11:31', text: 'The strongest prior evidence is F-0050. It suggests entry temperature may explain residual variance after roll-gap correction, but the current report does not isolate coil-width effects.' },
    { kind: 'system', id: 'e5', time: '11:32', label: 'Created experiment directory', detail: 'experiments/2026-06-17_roll_gap_variance' },
    { kind: 'exec', id: 'e6', time: '11:40', command: 'analysis.py', duration: '12.4s', exitCode: 0 },
    { kind: 'artifact', id: 'e7', time: '11:40', artifactId: 'thickness_by_roll_gap.png', path: 'outputs/figures/thickness_by_roll_gap.png' },
    { kind: 'claude', id: 'e8', time: '11:41', text: 'The fresh snapshot supports the previous finding. Entry temperature remains significant after controlling for roll-gap setpoint.' },
    { kind: 'report', id: 'e9', time: '11:42', path: 'REPORT.md', sections: ['Phenomenon', 'Variables', 'Mechanism', 'Countermeasures'] },
    {
      kind: 'finding-proposal',
      id: 'e10',
      time: '11:42',
      proposal: {
        findingId: 'F-0061',
        title: 'Entry temperature moderates residual thickness after roll-gap correction.',
        summary:
          'On a fresh snapshot, entry temperature remains a significant residual factor for thickness spread after controlling for roll-gap setpoint, confirming F-0050. Below ~980 °C the spread widens sharply.',
        confidence: 'medium-high',
        evidence: 'experiments/2026-06-17_roll_gap_variance',
        facets: ['process:rolling', 'phenomena:thermal', 'quality:thickness'],
        supersedes: undefined,
        actionable: true,
        targetFile: 'knowledge/findings.csv',
        gateway: 'knowledge-searcher / log-finding',
      },
    },
    {
      kind: 'question-proposal',
      id: 'e11',
      time: '11:42',
      proposal: {
        questionId: 'Q-0031',
        title: 'Should entry temperature thresholds be segmented by coil width?',
        priority: 'medium',
        status: 'open',
        area: 'thermal',
        relatedFinding: 'F-0061',
        targetFile: 'knowledge/open_questions.csv',
        gateway: 'add-open-question',
      },
    },
  ],
  tree: [
    { name: 'README.md', path: 'README.md', kind: 'file', type: 'markdown', modified: true },
    { name: 'REPORT.md', path: 'REPORT.md', kind: 'file', type: 'markdown', generated: true, generatedAt: '2026-06-17 11:42' },
    { name: 'analysis.py', path: 'analysis.py', kind: 'file' },
    {
      name: 'outputs',
      path: 'outputs',
      kind: 'dir',
      children: [
        {
          name: 'figures',
          path: 'outputs/figures',
          kind: 'dir',
          children: [
            { name: 'thickness_by_roll_gap.png', path: 'outputs/figures/thickness_by_roll_gap.png', kind: 'file', type: 'png', generated: true, generatedAt: '2026-06-17 11:40' },
            { name: 'residual_trend.png', path: 'outputs/figures/residual_trend.png', kind: 'file', type: 'png', generated: true, generatedAt: '2026-06-17 11:41' },
          ],
        },
        { name: 'metrics.json', path: 'outputs/metrics.json', kind: 'file', type: 'json', generated: true, generatedAt: '2026-06-17 11:41' },
      ],
    },
    { name: 'run.log', path: 'run.log', kind: 'file', type: 'log', modified: true },
  ],
  timeline: [
    { label: 'Experiment directory created', time: '11:32' },
    { label: 'search_kg.py completed', time: '11:31' },
    { label: 'analysis.py executed', time: '11:40' },
    { label: 'thickness_by_roll_gap.png generated', time: '11:40', artifactId: 'thickness_by_roll_gap.png' },
    { label: 'metrics.json generated', time: '11:41', artifactId: 'metrics.json' },
    { label: 'REPORT.md updated', time: '11:42', artifactId: 'REPORT.md' },
    { label: 'finding proposal created', time: '11:42' },
    { label: 'open question proposal created', time: '11:42' },
  ],
  artifacts: {
    'thickness_by_roll_gap.png': thicknessPng,
    'residual_trend.png': {
      id: 'residual_trend.png',
      name: 'residual_trend.png',
      path: 'experiments/2026-06-17_roll_gap_variance/outputs/figures/residual_trend.png',
      type: 'png',
      caption: 'Residual thickness variance over entry temperature after roll-gap correction.',
      generatedAt: '2026-06-17 11:41',
      sourceCommand: 'python analysis.py --plot residual_trend',
      size: '156 KB',
      generatedBy: 'analysis.py',
    },
    'metrics.json': {
      id: 'metrics.json',
      name: 'metrics.json',
      path: 'experiments/2026-06-17_roll_gap_variance/outputs/metrics.json',
      type: 'json',
      generatedAt: '2026-06-17 11:41',
      sourceCommand: 'python analysis.py --dump-metrics',
      size: '2.1 KB',
      generatedBy: 'analysis.py',
      json: {
        experiment: '2026-06-17_roll_gap_variance',
        roll_gap_r2: 0.71,
        entry_temp_residual_r2: 0.19,
        entry_temp_floor_c: 980,
        n_runs: 14,
        thickness_sd_range_mm: [0.02, 0.09],
        changepoint: { model: 'rbf', penalty: 12 },
      },
    },
    'REPORT.md': {
      id: 'REPORT.md',
      name: 'REPORT.md',
      path: 'experiments/2026-06-17_roll_gap_variance/REPORT.md',
      type: 'markdown',
      generatedAt: '2026-06-17 11:42',
      sourceCommand: 'claude write-report',
      size: '4.8 KB',
      generatedBy: 'report-writer',
      markdown: `# REPORT — Roll-gap × Entry-temperature

## Phenomenon
Residual thickness variance persists after roll-gap correction and tracks entry
temperature, confirming F-0050 on a fresh snapshot.

## Variables
| Variable | Role | Range |
| --- | --- | --- |
| roll_gap_mm | controlled | 2.1–2.6 mm |
| entry_temp_c | candidate driver | 940–1010 °C |
| thickness_sd | response | 0.02–0.09 mm |

## Mechanism
Cold feedstock raises yield strength, widening elastic recovery at a fixed
roll-gap setpoint.

## Countermeasures
1. Enforce a 980 °C entry-temperature floor on Line 1.
2. Open Q-0031 to test coil-width segmentation.
`,
    },
    'README.md': {
      id: 'README.md',
      name: 'README.md',
      path: 'experiments/2026-06-17_roll_gap_variance/README.md',
      type: 'markdown',
      generatedAt: '2026-06-17 11:30',
      sourceCommand: 'claude create-experiment',
      size: '1.2 KB',
      generatedBy: 'experiment-runner',
      markdown: `# 2026-06-17_roll_gap_variance

Follow-up to 2026-06-08_anomaly_check. Tests whether entry temperature moderates
roll-gap effects on thickness spread (F-0050, Q-0014).

## Conclusions
- Entry-temp residual confirmed on fresh snapshot.
- Proposes F-0061 and Q-0031.
`,
    },
    'run.log': {
      id: 'run.log',
      name: 'run.log',
      path: 'experiments/2026-06-17_roll_gap_variance/run.log',
      type: 'log',
      generatedAt: '2026-06-17 11:41',
      sourceCommand: 'python analysis.py',
      size: '6.0 KB',
      generatedBy: 'analysis.py',
      log: `[11:40:02] INFO  loading parquet snapshot 2026-06-17 ... 1,284,902 rows
[11:40:05] INFO  segmenting runs with PELT (rbf, pen=12)
[11:40:09] INFO  fit roll_gap model: r2=0.71
[11:40:11] INFO  residual model on entry_temp: r2=0.19
[11:40:12] WARN  3 runs missing entry_temp_c — imputed from shift median
[11:40:14] INFO  rendered outputs/figures/thickness_by_roll_gap.png
[11:40:15] INFO  rendered outputs/figures/residual_trend.png
[11:40:16] INFO  wrote outputs/metrics.json
[11:40:16] INFO  exit 0`,
    },
  },
};

// ── Session 2: completed — feed_rate_recheck ──
const s2: SessionBundle = {
  context: ['F-0048', 'F-0001', 'Q-0011', 'Q-0003'],
  latestArtifactId: 'bend_rate_threshold.png',
  transcript: [
    { kind: 'user', id: 'f1', time: '16:40', text: 'Re-check the feed-rate bend-rate threshold on the corrected parquet mtime window.' },
    { kind: 'claude', id: 'f2', time: '16:40', text: "I'll re-run the feed-rate sweep on the corrected window and compare against the original F-0001 estimate." },
    {
      kind: 'tool',
      id: 'f3',
      time: '16:41',
      action: 'search_kg.py neighbors',
      command: 'search_kg.py neighbors F-0001',
      status: 'completed',
      result: '1 finding · 1 open question',
      resultIds: ['F-0001', 'Q-0003'],
    },
    { kind: 'exec', id: 'f4', time: '16:58', command: 'analysis.py', duration: '9.8s', exitCode: 0 },
    { kind: 'artifact', id: 'f5', time: '16:58', artifactId: 'bend_rate_threshold.png', path: 'outputs/figures/bend_rate_threshold.png' },
    { kind: 'claude', id: 'f6', time: '17:02', text: 'The corrected window narrows the actionable threshold to 1.65 m/s for coil width over 1200 mm. This supersedes F-0001.' },
    { kind: 'report', id: 'f7', time: '17:06', path: 'REPORT.md', sections: ['Phenomenon', 'Variables', 'Mechanism', 'Countermeasures'] },
    {
      kind: 'finding-proposal',
      id: 'f8',
      time: '17:07',
      proposal: {
        findingId: 'F-0048',
        title: 'Bend-rate threshold is 1.65 m/s when coil width exceeds 1200 mm.',
        summary: 'Re-analysis on the corrected mtime window narrows the feed-rate threshold to 1.65 m/s for wide coils. Supersedes F-0001.',
        confidence: 'high',
        evidence: 'experiments/2026-05-20_feed_rate_recheck',
        facets: ['process:rolling', 'phenomena:bending', 'equipment:feed-drive'],
        supersedes: 'F-0001',
        actionable: true,
        targetFile: 'knowledge/findings.csv',
        gateway: 'knowledge-searcher / log-finding',
      },
    },
  ],
  tree: [
    { name: 'README.md', path: 'README.md', kind: 'file', type: 'markdown' },
    { name: 'REPORT.md', path: 'REPORT.md', kind: 'file', type: 'markdown', generated: true, generatedAt: '2026-05-20 17:06' },
    { name: 'analysis.py', path: 'analysis.py', kind: 'file' },
    {
      name: 'outputs',
      path: 'outputs',
      kind: 'dir',
      children: [
        {
          name: 'figures',
          path: 'outputs/figures',
          kind: 'dir',
          children: [
            { name: 'bend_rate_threshold.png', path: 'outputs/figures/bend_rate_threshold.png', kind: 'file', type: 'png', generated: true, generatedAt: '2026-05-20 16:58' },
          ],
        },
        { name: 'metrics.json', path: 'outputs/metrics.json', kind: 'file', type: 'json', generated: true, generatedAt: '2026-05-20 16:58' },
      ],
    },
    { name: 'run.log', path: 'run.log', kind: 'file', type: 'log' },
  ],
  timeline: [
    { label: 'Experiment directory created', time: '16:40' },
    { label: 'search_kg.py completed', time: '16:41' },
    { label: 'analysis.py executed', time: '16:58' },
    { label: 'bend_rate_threshold.png generated', time: '16:58', artifactId: 'bend_rate_threshold.png' },
    { label: 'metrics.json generated', time: '16:58', artifactId: 'metrics.json' },
    { label: 'REPORT.md updated', time: '17:06', artifactId: 'REPORT.md' },
    { label: 'finding proposal created', time: '17:07' },
  ],
  artifacts: {
    'bend_rate_threshold.png': {
      id: 'bend_rate_threshold.png',
      name: 'bend_rate_threshold.png',
      path: 'experiments/2026-05-20_feed_rate_recheck/outputs/figures/bend_rate_threshold.png',
      type: 'png',
      caption: 'Bend rate vs feed rate, stratified by coil width; threshold marked at 1.65 m/s.',
      generatedAt: '2026-05-20 16:58',
      sourceCommand: 'python analysis.py --plot bend_rate_threshold',
      size: '172 KB',
      generatedBy: 'analysis.py',
    },
    'metrics.json': {
      id: 'metrics.json',
      name: 'metrics.json',
      path: 'experiments/2026-05-20_feed_rate_recheck/outputs/metrics.json',
      type: 'json',
      generatedAt: '2026-05-20 16:58',
      sourceCommand: 'python analysis.py --dump-metrics',
      size: '1.8 KB',
      generatedBy: 'analysis.py',
      json: { experiment: '2026-05-20_feed_rate_recheck', threshold_ms: 1.65, coil_width_mm: 1200, supersedes: 'F-0001', n_runs: 11 },
    },
    'REPORT.md': {
      id: 'REPORT.md',
      name: 'REPORT.md',
      path: 'experiments/2026-05-20_feed_rate_recheck/REPORT.md',
      type: 'markdown',
      generatedAt: '2026-05-20 17:06',
      sourceCommand: 'claude write-report',
      size: '3.9 KB',
      generatedBy: 'report-writer',
      markdown: `# REPORT — Refined Feed-Rate Threshold

## Phenomenon
Bend rate rises sharply above a feed-rate threshold lower than the original
F-0001 estimate once the contaminated window is removed.

## Countermeasures
1. Cap feed rate at 1.6 m/s for width > 1200 mm.
2. Stratify the next sweep by coil grade (Q-0011).
`,
    },
  },
};

// ── Session 3: failed — handover_review (tool error path) ──
const s3: SessionBundle = {
  context: ['F-0012', 'F-0044', 'Q-0006'],
  latestArtifactId: null,
  transcript: [
    { kind: 'user', id: 'g1', time: '09:48', text: 'Check whether the revised handover procedure eliminates the 06:00 vibration null bursts.' },
    { kind: 'claude', id: 'g2', time: '09:48', text: "I'll load the handover-window snapshot and compare null density before and after the procedure change." },
    {
      kind: 'tool',
      id: 'g3',
      time: '09:49',
      action: 'search_kg.py facet',
      command: 'search_kg.py facet process:handover data-quality:missingness',
      status: 'completed',
      result: '2 findings · 1 open question',
      resultIds: ['F-0012', 'F-0044', 'Q-0006'],
    },
    {
      kind: 'error',
      id: 'g4',
      time: '09:55',
      command: 'analysis.py',
      exitCode: 1,
      reason: 'missing parquet snapshot for 2026-05-13 handover window',
    },
    { kind: 'claude', id: 'g5', time: '09:55', text: 'The analysis could not run — the parquet snapshot for the handover window is missing. Inspect the README for the expected snapshot path, or retry once the backend re-indexes.' },
  ],
  tree: [
    { name: 'README.md', path: 'README.md', kind: 'file', type: 'markdown' },
    { name: 'analysis.py', path: 'analysis.py', kind: 'file' },
    {
      name: 'outputs',
      path: 'outputs',
      kind: 'dir',
      children: [{ name: 'figures', path: 'outputs/figures', kind: 'dir', children: [] }],
    },
    { name: 'run.log', path: 'run.log', kind: 'file', type: 'log', modified: true },
  ],
  timeline: [
    { label: 'Experiment directory created', time: '09:48' },
    { label: 'search_kg.py completed', time: '09:49' },
    { label: 'analysis.py failed (exit 1)', time: '09:55' },
  ],
  artifacts: {
    'run.log': {
      id: 'run.log',
      name: 'run.log',
      path: 'experiments/2026-05-13_handover_review/run.log',
      type: 'log',
      generatedAt: '2026-05-13 09:55',
      sourceCommand: 'python analysis.py',
      size: '1.1 KB',
      generatedBy: 'analysis.py',
      log: `[09:54:58] INFO  resolving parquet snapshot for 2026-05-13 handover window
[09:55:01] ERROR snapshot not found: data/parquet/2026-05-13_handover.parquet
[09:55:01] ERROR analysis aborted
[09:55:01] INFO  exit 1`,
    },
  },
};

export const chatData: Record<string, SessionBundle> = {
  'chat_2026-06-17_001': s1,
  'chat_2026-06-16_004': s2,
  'chat_2026-06-13_002': s3,
};

export function getSessionBundle(sessionId: string): SessionBundle | undefined {
  return chatData[sessionId];
}

export const suggestedActions = [
  'Explain this finding',
  'Trace evidence',
  'Create follow-up experiment',
  'Generate report summary',
  'Check superseded lineage',
  'Add open question through the agent',
  'Resolve open question through the agent',
];

export const composerModes = ['Ask', 'Investigate', 'Create Experiment', 'Write Report', 'Update Knowledge'] as const;
export type ComposerMode = (typeof composerModes)[number];

export const composerModeDescriptions: Record<ComposerMode, string> = {
  Ask: 'The agent will answer using attached context and repository knowledge.',
  Investigate: 'The agent may create a new experiment directory and run analysis.',
  'Create Experiment': 'The agent will create a new experiment workspace and prepare files.',
  'Write Report': 'The agent will update REPORT.md through report-writer.',
  'Update Knowledge': 'The agent will propose knowledge or issue updates through a agent-mediated workflow.',
};

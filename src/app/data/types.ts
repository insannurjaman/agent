// Data model types mirroring knowledge/*.csv columns exactly.

export type FindingCategory =
  | 'factor'
  | 'schema'
  | 'data-quality'
  | 'process'
  | 'hypothesis'
  | 'anomaly-pattern'
  | 'method';

export type Confidence = 'high' | 'medium' | 'low' | 'medium-high' | 'superseded';

export interface Finding {
  id: string; // F-NNNN
  date: string; // ISO date
  category: FindingCategory;
  tags: string[];
  title: string;
  summary: string;
  evidence: string; // experiment path
  confidence: Confidence;
  supersedes?: string; // F-id this replaces
  supersededBy?: string; // F-id that replaced this
  supersedeReason?: string; // why this finding was superseded
  actionable: boolean;
  facets: string[];
  relatedQuestions?: string[]; // Q-ids
}

export type QuestionStatus = 'open' | 'resolved' | 'in-progress' | 'partial-progress';
export type Priority = 'high' | 'medium' | 'low';

export interface OpenQuestion {
  id: string; // Q-NNNN
  raisedDate: string;
  priority: Priority;
  status: QuestionStatus;
  area: string;
  title: string;
  detail: string; // may contain "| Date:" update-history segments
  raisedBy: string;
  related: string[]; // F-ids / experiment slugs
  facets: string[];
}

export type ReportStatus = 'report' | 'exploration-only' | 'missing';

export interface Experiment {
  slug: string; // experiments/YYYY-MM-DD_slug
  title: string;
  date: string;
  conclusions: string[]; // top-3 from README
  reportStatus: ReportStatus;
  outdated?: boolean;
  lastModified: string;
  relatedFindings: string[]; // F-ids
  relatedQuestions?: string[]; // Q-ids
  freshness: {
    parquetMtime: string;
    rowCounts: string;
    dateRange: string;
  };
  figures: string[]; // file names
  readme: string; // markdown
  report?: string; // markdown, present when reportStatus === 'report'
}

export interface FacetDimension {
  id: string;
  label: string;
  terms: string[];
}

export interface RepoStatus {
  findings: number;
  openQuestions: number;
  edges: number;
  experiments: number;
  pngFigures: number;
  htmlArtifacts: number;
  indexedAgo: string;
}

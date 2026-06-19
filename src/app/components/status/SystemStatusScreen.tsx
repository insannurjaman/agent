import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { RefreshCw, BookOpen, Copy, WifiOff, AlertTriangle, X, Loader2, Download, CheckCircle2, ScrollText } from 'lucide-react';
import { repoStatus } from '../../data';
import { ScreenHeader, MonoId } from '../common/primitives';
import { StatusBadge } from '../common/StatusBadge';
import { cn } from '../ui/utils';

type Mode = 'operational' | 'degraded';
type Severity = 'INFO' | 'WARN' | 'ERROR';
type ServiceKey = 'backend' | 'index' | 'graph' | 'watcher' | 'claude' | 'file';

interface HealthItem {
  label: string;
  ok: string;
  okTone: 'green' | 'teal' | 'blue';
  bad: string;
  badTone: 'red' | 'amber';
}

const HEALTH: HealthItem[] = [
  { label: 'Backend API', ok: 'Connected', okTone: 'green', bad: 'Offline', badTone: 'red' },
  { label: 'Repository', ok: 'Synced', okTone: 'green', bad: 'Unavailable', badTone: 'red' },
  { label: 'Knowledge Index', ok: 'Ready', okTone: 'green', bad: 'Stale', badTone: 'amber' },
  { label: 'Graph Index', ok: 'Ready', okTone: 'green', bad: 'Stale', badTone: 'amber' },
  { label: 'Claude Relay', ok: 'Connected', okTone: 'blue', bad: 'Disconnected', badTone: 'red' },
];

interface ServiceRow {
  service: string;
  status: string;
  tone: 'green' | 'teal' | 'blue';
  degradedStatus: string;
  degradedTone: 'red' | 'amber';
  endpoint: string;
  latency: string;
  lastCheck: string;
  recentEvents: string[];
}

const SERVICES: ServiceRow[] = [
  { service: 'Backend API', status: 'Connected', tone: 'green', degradedStatus: 'Offline', degradedTone: 'red', endpoint: '127.0.0.1:8787', latency: '24ms', lastCheck: '2m ago', recentEvents: ['backend.health connected latency=24ms', 'backend.health connected latency=22ms'] },
  { service: 'File Delivery', status: 'Ready', tone: 'green', degradedStatus: 'Cached', degradedTone: 'amber', endpoint: '/files', latency: '18ms', lastCheck: '2m ago', recentEvents: ['file.serve /files 200 18ms', 'file.serve /files 200 21ms'] },
  { service: 'Knowledge Indexer', status: 'Ready', tone: 'green', degradedStatus: 'Stale', degradedTone: 'amber', endpoint: '/index/knowledge', latency: '31ms', lastCheck: '2m ago', recentEvents: ['index.knowledge findings=79 questions=47', 'index.knowledge taxonomy=40'] },
  { service: 'Graph Loader', status: 'Ready', tone: 'green', degradedStatus: 'Cached', degradedTone: 'amber', endpoint: '/graph', latency: '42ms', lastCheck: '2m ago', recentEvents: ['graph.load edges=499 nodes=126'] },
  { service: 'Claude Relay', status: 'Streaming', tone: 'teal', degradedStatus: 'Disconnected', degradedTone: 'red', endpoint: '/ws/claude', latency: 'Streaming', lastCheck: 'Now', recentEvents: ['claude.relay stream-json connected', 'stream event artifact_generated 28s ago'] },
  { service: 'Repository Watcher', status: 'Active', tone: 'teal', degradedStatus: 'Paused', degradedTone: 'amber', endpoint: '~/workspace', latency: 'Watching', lastCheck: 'Now', recentEvents: ['watcher.active paths=5', 'change REPORT.md updated 42s ago'] },
];

const INDEXED = [
  { path: 'knowledge/findings.csv', metric: `Rows: ${repoStatus.findings}` },
  { path: 'knowledge/open_questions.csv', metric: `Rows: ${repoStatus.openQuestions}` },
  { path: 'knowledge/tag_taxonomy.csv', metric: 'Terms: 40' },
  { path: 'knowledge/knowledge_graph_edges.csv', metric: `Edges: ${repoStatus.edges}` },
  { path: 'experiments/', metric: `Experiments: ${repoStatus.experiments}` },
];

const WATCHED = ['knowledge/*.csv', 'experiments/*', 'experiments/*/REPORT.md', 'experiments/*/outputs/', 'doc/*.md'];

const WATCHER_CHANGES = [
  { text: 'output/thickness_by_roll_gap.png generated', time: '28s ago' },
  { text: 'REPORT.md updated', time: '42s ago' },
  { text: 'findings.csv indexed', time: '2m ago' },
  { text: 'graph edges refreshed', time: '2m ago' },
];

interface LogRow {
  time: string;
  sev: Severity;
  service: ServiceKey;
  text: string;
}

const LOG_OK: LogRow[] = [
  { time: '2026-06-17T12:22:01Z', sev: 'INFO', service: 'backend', text: 'backend.health connected latency=24ms' },
  { time: '2026-06-17T12:22:02Z', sev: 'INFO', service: 'index', text: 'index.knowledge findings=79 questions=47' },
  { time: '2026-06-17T12:22:03Z', sev: 'INFO', service: 'graph', text: 'graph.load edges=499 nodes=126' },
  { time: '2026-06-17T12:22:05Z', sev: 'INFO', service: 'watcher', text: 'watcher.active paths=5' },
  { time: '2026-06-17T12:22:10Z', sev: 'INFO', service: 'claude', text: 'claude.relay stream-json connected' },
];

const LOG_BAD: LogRow[] = [
  { time: '2026-06-17T12:24:01Z', sev: 'ERROR', service: 'backend', text: 'backend.health connection refused' },
  { time: '2026-06-17T12:24:01Z', sev: 'WARN', service: 'watcher', text: 'repository unavailable' },
  { time: '2026-06-17T12:24:02Z', sev: 'WARN', service: 'graph', text: 'graph index using cached data' },
  { time: '2026-06-17T12:24:02Z', sev: 'ERROR', service: 'claude', text: 'claude.relay disconnected' },
];

const SERVICE_FILTERS: { label: string; key: ServiceKey | 'all' }[] = [
  { label: 'All', key: 'all' },
  { label: 'Backend', key: 'backend' },
  { label: 'Indexer', key: 'index' },
  { label: 'Graph', key: 'graph' },
  { label: 'Watcher', key: 'watcher' },
  { label: 'Claude Relay', key: 'claude' },
];

interface Toast {
  id: number;
  text: string;
  tone: 'green' | 'teal' | 'amber' | 'red';
}

export function SystemStatusScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('operational');
  const [selectedService, setSelectedService] = useState<ServiceRow | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const toastId = useRef(0);
  const degraded = mode === 'degraded';

  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts((arr) => arr.slice(1)), 2600);
    return () => clearTimeout(t);
  }, [toasts]);

  const pushToast = (text: string, tone: Toast['tone'] = 'teal') =>
    setToasts((arr) => [...arr, { id: ++toastId.current, text, tone }]);

  const runAction = (key: string, startText: string, done: () => void, tone: Toast['tone'] = 'teal') => {
    pushToast(startText, tone);
    setPending(key);
    setTimeout(() => {
      setPending(null);
      done();
    }, 1500);
  };

  const copyDiagnostics = () => {
    const rows = (degraded ? [...LOG_OK.slice(0, 1), ...LOG_BAD] : LOG_OK).map((r) => `${r.time} ${r.sev} ${r.text}`).join('\n');
    navigator.clipboard?.writeText(rows).catch(() => {});
    pushToast('Diagnostics copied', 'green');
  };

  return (
    <div className="relative flex h-full flex-col">
      <ScreenHeader
        title="System Status"
        subtitle="Local backend, repository, file watching, and Claude integration."
        right={
          <div className="flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-2 p-0.5">
            {(['operational', 'degraded'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setSelectedService(null);
                }}
                className={cn(
                  'rounded-sm px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition-colors',
                  mode === m ? 'bg-brand-muted text-brand' : 'text-text-muted hover:text-text-secondary',
                )}
              >
                {m}
              </button>
            ))}
          </div>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto p-5">
        <div className="flex flex-col gap-5">
          <HealthSummary degraded={degraded} />

          {degraded && (
            <div className="flex items-center gap-2 rounded-sm border border-amber/30 bg-amber/[0.06] px-3 py-2">
              <AlertTriangle className="size-4 shrink-0 text-amber" />
              <span className="text-[12px] text-amber">
                Some data is shown from the last successful index. Live repository updates are unavailable until the backend reconnects.
              </span>
            </div>
          )}

          {degraded && (
            <OfflineError
              navigate={navigate}
              pending={pending === 'retry'}
              onRetry={() => runAction('retry', 'Reconnecting to backend…', () => {
                setMode('operational');
                pushToast('Backend connection restored', 'green');
              }, 'amber')}
              onCopy={copyDiagnostics}
            />
          )}

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-5">
              <Services degraded={degraded} onSelect={setSelectedService} selected={selectedService} onCopyEndpoint={(e) => { navigator.clipboard?.writeText(e).catch(() => {}); pushToast('Endpoint copied', 'green'); }} />
              <RepositoryIndexing degraded={degraded} pending={pending} onReindex={() => runAction('reindex', 'Knowledge re-index started', () => pushToast('Knowledge re-index completed', 'green'))} onReload={() => runAction('reload', 'Graph reload started', () => pushToast('Graph reload completed', 'green'))} onCopy={copyDiagnostics} />
            </div>
            <div className="flex flex-col gap-5">
              <ClaudeRelay degraded={degraded} navigate={navigate} />
              <RepositoryWatcher degraded={degraded} />
            </div>
          </div>

          <Diagnostics degraded={degraded} onCopy={copyDiagnostics} onDownload={() => pushToast('Diagnostics downloaded', 'teal')} />
        </div>
      </div>

      {/* Service detail drawer */}
      {selectedService && (
        <ServiceDrawer
          service={selectedService}
          degraded={degraded}
          onClose={() => setSelectedService(null)}
          onCopyEndpoint={(e) => { navigator.clipboard?.writeText(e).catch(() => {}); pushToast('Endpoint copied', 'green'); }}
          onTest={() => runAction('test', `Testing ${selectedService.service}…`, () => pushToast(`${selectedService.service} reachable`, 'green'))}
          pending={pending === 'test'}
        />
      )}

      {/* Toasts */}
      <div className="pointer-events-none absolute right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-2 rounded-sm border bg-surface px-3 py-2 shadow-lg',
              t.tone === 'green' ? 'border-green/40' : t.tone === 'amber' ? 'border-amber/40' : t.tone === 'red' ? 'border-red/40' : 'border-brand-border',
            )}
          >
            <CheckCircle2 className={cn('size-3.5', t.tone === 'green' ? 'text-green' : t.tone === 'amber' ? 'text-amber' : t.tone === 'red' ? 'text-red' : 'text-brand')} />
            <span className="font-mono text-[12px] text-text-secondary">{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-border-subtle bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-2.5">
        <h2 className="text-text" style={{ fontSize: '13px' }}>
          {title}
        </h2>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function ActionBtn({ children, onClick, pending }: { children: React.ReactNode; onClick?: () => void; pending?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="flex items-center gap-1.5 rounded-sm border border-border-strong bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-text-secondary transition-colors hover:text-text disabled:opacity-60"
    >
      {pending && <Loader2 className="size-3 animate-spin" />}
      {children}
    </button>
  );
}

function HealthSummary({ degraded }: { degraded: boolean }) {
  return (
    <section className={cn('rounded-sm border bg-surface', degraded ? 'border-red/30' : 'border-border-subtle')}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn('size-2.5 rounded-full', degraded ? 'bg-red' : 'bg-green')} />
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Overall</span>
          <span className={cn('text-[14px]', degraded ? 'text-red' : 'text-green')}>{degraded ? 'Degraded' : 'Operational'}</span>
          {degraded && <span className="font-mono text-[12px] text-red">· Backend offline · unreachable</span>}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {HEALTH.map((h) => (
            <HealthDot key={h.label} item={h} degraded={degraded} />
          ))}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Last Indexed</span>
            <span className="font-mono text-[12px] text-text-secondary">{degraded ? '2m ago (stale)' : '2m ago'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const DOT: Record<string, string> = { green: 'bg-green', teal: 'bg-teal', blue: 'bg-blue', amber: 'bg-amber', red: 'bg-red' };

function HealthDot({ item, degraded }: { item: HealthItem; degraded: boolean }) {
  const tone = degraded ? item.badTone : item.okTone;
  const val = degraded ? item.bad : item.ok;
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('size-2 rounded-full', DOT[tone])} />
      <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">{item.label}</span>
      <span className="font-mono text-[12px] text-text-secondary">{val}</span>
    </div>
  );
}

function OfflineError({ navigate, pending, onRetry, onCopy }: { navigate: (to: string) => void; pending: boolean; onRetry: () => void; onCopy: () => void }) {
  return (
    <section className="rounded-sm border border-red/30 bg-red/[0.06] px-4 py-3">
      <div className="flex items-start gap-3">
        <WifiOff className="mt-0.5 size-5 shrink-0 text-red" />
        <div className="flex-1">
          <h3 className="text-[14px] text-text">Backend connection failed</h3>
          <p className="mt-1 text-[13px] text-text-secondary">
            Could not reach the local agent service at <span className="font-mono text-text">127.0.0.1:8787</span>. Start the backend service and retry.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRetry}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-sm border border-brand-border bg-brand-muted px-2.5 py-1 font-mono text-[11px] text-brand hover:bg-brand-surface disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Retry connection
            </button>
            <ActionBtn onClick={() => navigate('/chat')}>
              <BookOpen className="size-3.5" /> View setup guide
            </ActionBtn>
            <ActionBtn onClick={onCopy}>
              <Copy className="size-3.5" /> Copy diagnostics
            </ActionBtn>
          </div>
        </div>
      </div>
    </section>
  );
}

function Services({
  degraded,
  onSelect,
  selected,
  onCopyEndpoint,
}: {
  degraded: boolean;
  onSelect: (s: ServiceRow) => void;
  selected: ServiceRow | null;
  onCopyEndpoint: (e: string) => void;
}) {
  return (
    <Panel title="Local Services">
      <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-[13px]">
        <thead>
          <tr>
            {['Service', 'Status', 'Endpoint', 'Latency', 'Last Check', 'Action'].map((c) => (
              <th key={c} className="border-b border-border-strong px-2 py-1.5 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SERVICES.map((s) => {
            const status = degraded ? s.degradedStatus : s.status;
            const tone = degraded ? s.degradedTone : s.tone;
            const dead = degraded && (s.degradedTone === 'red');
            return (
              <tr
                key={s.service}
                onClick={() => onSelect(s)}
                className={cn(
                  'group cursor-pointer border-b border-border-subtle transition-colors last:border-0 hover:bg-surface-2',
                  selected?.service === s.service && 'bg-surface-2',
                )}
              >
                <td className="px-2 py-1.5 text-text">{s.service}</td>
                <td className="px-2 py-1.5">
                  <StatusBadge value={status} tone={tone} />
                </td>
                <td className="px-2 py-1.5">
                  <span className="font-mono text-[12px] text-text-secondary">{s.endpoint}</span>
                </td>
                <td className="px-2 py-1.5">
                  <span className={cn('font-mono text-[12px]', dead ? 'text-red' : 'text-text-secondary')}>{dead ? '—' : degraded ? 'cached' : s.latency}</span>
                </td>
                <td className="px-2 py-1.5">
                  <span className="font-mono text-[12px] text-text-muted">{degraded ? '2m ago' : s.lastCheck}</span>
                </td>
                <td className="px-2 py-1.5">
                  {/* Hover-revealed inline actions */}
                  <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onSelect(s); }} className="font-mono text-[11px] text-brand hover:underline">
                      View details
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onCopyEndpoint(s.endpoint); }} className="font-mono text-[11px] text-text-muted hover:text-text">
                      Copy endpoint
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      <p className="mt-2 font-mono text-[10px] text-text-muted">Hover a row for quick actions · click to open service details.</p>
    </Panel>
  );
}

function RepositoryIndexing({
  degraded,
  pending,
  onReindex,
  onReload,
  onCopy,
}: {
  degraded: boolean;
  pending: string | null;
  onReindex: () => void;
  onReload: () => void;
  onCopy: () => void;
}) {
  return (
    <Panel
      title="Repository & Indexing"
      right={
        <div className="flex flex-wrap gap-1.5">
          <ActionBtn onClick={onReindex} pending={pending === 'reindex'}>Re-index knowledge</ActionBtn>
          <ActionBtn onClick={onReload} pending={pending === 'reload'}>Reload graph</ActionBtn>
          <ActionBtn>Refresh experiments</ActionBtn>
          <ActionBtn onClick={onCopy}>Copy diagnostics</ActionBtn>
        </div>
      }
    >
      <div className="flex flex-col">
        {INDEXED.map((r) => (
          <div key={r.path} className="flex items-center gap-3 border-b border-border-subtle py-2 last:border-0">
            <MonoId className="min-w-0 flex-1 truncate text-info">{r.path}</MonoId>
            <StatusBadge value={degraded ? 'Stale' : 'Indexed'} tone={degraded ? 'amber' : 'green'} />
            <span className="w-28 shrink-0 text-right font-mono text-[11px] text-text-secondary">{r.metric}</span>
            <span className="w-24 shrink-0 text-right font-mono text-[11px] text-text-muted">{degraded ? 'stale' : 'last 2m ago'}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ClaudeRelay({ degraded, navigate }: { degraded: boolean; navigate: (to: string) => void }) {
  if (degraded) {
    return (
      <Panel title="Claude Relay">
        <StatusBadge value="Not Configured" tone="warning" />
        <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
          Chat requires Claude Code stream relay. Configure the local backend to enable chat.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionBtn onClick={() => navigate('/chat')}>View setup guide</ActionBtn>
          <button type="button" className="rounded-sm border border-brand-border bg-brand-muted px-2.5 py-1 font-mono text-[11px] text-brand hover:bg-brand-surface">
            Retry connection
          </button>
          <ActionBtn>
            <ScrollText className="size-3.5" /> Open System Logs
          </ActionBtn>
        </div>
      </Panel>
    );
  }
  const rows: [string, string][] = [
    ['STATUS', 'Connected'],
    ['MODE', 'stream-json'],
    ['TRANSPORT', 'WebSocket'],
    ['SESSION', 'chat_2026-06-17_001'],
    ['EXPERIMENT DIR', 'experiments/2026-06-17_roll_gap_variance'],
    ['WORKING DIR', 'fixed'],
    ['LAST STREAM EVENT', 'artifact_generated'],
    ['LAST EVENT TIME', '28s ago'],
  ];
  return (
    <Panel title="Claude Relay">
      <div className="flex flex-col">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 border-b border-border-subtle py-1.5 last:border-0">
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{k}</span>
            <span className={cn('truncate text-right font-mono text-[12px]', k === 'STATUS' ? 'text-blue' : 'text-text-secondary')}>{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Connection command</div>
        <pre className="mt-1 overflow-auto rounded-sm border border-border-subtle bg-surface-2 px-2.5 py-1.5 font-mono text-[12px] text-text-secondary">
          <span className="text-text-muted">$ </span>claude -p --output-format stream-json
        </pre>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <ActionBtn>Test relay</ActionBtn>
        <ActionBtn>Reconnect</ActionBtn>
        <ActionBtn>View stream log</ActionBtn>
        <ActionBtn onClick={() => navigate('/chat')}>Open Chat Workspace</ActionBtn>
      </div>
    </Panel>
  );
}

function RepositoryWatcher({ degraded }: { degraded: boolean }) {
  return (
    <Panel title="Repository Watcher" right={<StatusBadge value={degraded ? 'Paused' : 'Active'} tone={degraded ? 'amber' : 'teal'} />}>
      {degraded && (
        <p className="mb-3 rounded-sm border border-amber/30 bg-amber/[0.06] px-2.5 py-1.5 text-[12px] text-amber">
          Repository watcher is paused because backend connection is unavailable.
        </p>
      )}
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Watched paths</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {WATCHED.map((p) => (
          <span key={p} className="rounded-sm border border-border-subtle bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-text-secondary">
            {p}
          </span>
        ))}
      </div>
      {!degraded && (
        <>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-text-muted">Recent detected changes</div>
          <div className="mt-1.5 flex flex-col">
            {WATCHER_CHANGES.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-3 border-b border-border-subtle py-1.5 last:border-0">
                <MonoId className="min-w-0 flex-1 truncate text-text-secondary">{c.text}</MonoId>
                <span className="shrink-0 font-mono text-[11px] text-text-muted">{c.time}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <ActionBtn>{degraded ? 'Resume watcher' : 'Pause watcher'}</ActionBtn>
        <ActionBtn>Force scan</ActionBtn>
        <ActionBtn>View watcher log</ActionBtn>
      </div>
    </Panel>
  );
}

const SEV_TONE: Record<Severity, string> = { INFO: 'text-info', WARN: 'text-amber', ERROR: 'text-red' };
const SERVICE_LABEL: Record<ServiceKey, string> = { backend: 'backend', index: 'indexer', graph: 'graph', watcher: 'watcher', claude: 'claude', file: 'file' };

function Diagnostics({ degraded, onCopy, onDownload }: { degraded: boolean; onCopy: () => void; onDownload: () => void }) {
  const [sev, setSev] = useState<'All' | Severity>('All');
  const [svc, setSvc] = useState<ServiceKey | 'all'>('all');
  const base = degraded ? [...LOG_OK.slice(0, 1), ...LOG_BAD] : LOG_OK;
  const rows = base.filter((r) => (sev === 'All' || r.sev === sev) && (svc === 'all' || r.service === svc));
  const sevFilters: ('All' | Severity)[] = ['All', 'INFO', 'WARN', 'ERROR'];

  return (
    <Panel
      title="Diagnostics"
      right={
        <div className="flex flex-wrap items-center gap-2">
          <ActionBtn onClick={onCopy}>
            <Copy className="size-3.5" /> Copy log
          </ActionBtn>
          <ActionBtn onClick={onDownload}>
            <Download className="size-3.5" /> Download
          </ActionBtn>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">Severity</span>
          {sevFilters.map((f) => (
            <FilterChip key={f} active={sev === f} onClick={() => setSev(f)}>
              {f}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">Service</span>
          {SERVICE_FILTERS.map((f) => (
            <FilterChip key={f.key} active={svc === f.key} onClick={() => setSvc(f.key)}>
              {f.label}
            </FilterChip>
          ))}
        </div>
        {(sev !== 'All' || svc !== 'all') && (
          <button type="button" onClick={() => { setSev('All'); setSvc('all'); }} className="font-mono text-[10px] text-text-muted hover:text-text">
            Clear filters
          </button>
        )}
      </div>
      <div className="rounded-sm border border-border-subtle bg-surface-2 p-3 font-mono text-[12px] leading-relaxed">
        {rows.length === 0 ? (
          <div className="flex items-center gap-2 text-text-muted">
            <AlertTriangle className="size-3.5" /> No matching entries.
          </div>
        ) : (
          rows.map((r, i) => (
            <div key={i} className="flex gap-2 whitespace-pre-wrap">
              <span className="text-text-muted">{r.time}</span>
              <span className={cn('w-12 shrink-0', SEV_TONE[r.sev])}>{r.sev}</span>
              <span className="w-16 shrink-0 text-blue">{SERVICE_LABEL[r.service]}</span>
              <span className="text-text-secondary">{r.text}</span>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase transition-colors',
        active ? 'border-brand-border bg-brand-muted text-brand' : 'border-border-subtle bg-surface-2 text-text-muted hover:text-text-secondary',
      )}
    >
      {children}
    </button>
  );
}

function ServiceDrawer({
  service,
  degraded,
  onClose,
  onCopyEndpoint,
  onTest,
  pending,
}: {
  service: ServiceRow;
  degraded: boolean;
  onClose: () => void;
  onCopyEndpoint: (e: string) => void;
  onTest: () => void;
  pending: boolean;
}) {
  const status = degraded ? service.degradedStatus : service.status;
  const tone = degraded ? service.degradedTone : service.tone;
  const Row = ({ k, v, accent }: { k: string; v: string; accent?: boolean }) => (
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-1.5 last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{k}</span>
      <span className={cn('truncate text-right font-mono text-[12px]', accent ? 'text-brand' : 'text-text-secondary')}>{v}</span>
    </div>
  );
  return (
    <aside className="absolute inset-y-0 right-0 z-40 flex w-[360px] flex-col border-l border-border-subtle bg-surface shadow-2xl">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h2 className="text-text" style={{ fontSize: '14px' }}>
          {service.service}
        </h2>
        <button type="button" onClick={onClose} className="flex size-6 items-center justify-center rounded-sm text-text-muted hover:text-text" aria-label="Close">
          <X className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        <div className="mb-3">
          <StatusBadge value={status} tone={tone} />
        </div>
        <div className="rounded-sm border border-border-subtle bg-surface-2 px-3">
          <Row k="Endpoint" v={service.endpoint} accent />
          <Row k="Latency" v={degraded && service.degradedTone === 'red' ? '—' : service.latency} />
          <Row k="Last check" v={degraded ? '2m ago' : service.lastCheck} />
        </div>

        <div className="mt-4 font-mono text-[10px] uppercase tracking-wider text-text-muted">Recent events</div>
        <div className="mt-1.5 rounded-sm border border-border-subtle bg-surface-2 p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
          {service.recentEvents.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>

        <div className="mt-4 font-mono text-[10px] uppercase tracking-wider text-text-muted">Actions</div>
        <div className="mt-1.5 flex flex-col gap-2">
          <ActionBtn onClick={onTest} pending={pending}>Test</ActionBtn>
          <ActionBtn onClick={() => onCopyEndpoint(service.endpoint)}>Copy endpoint</ActionBtn>
          <ActionBtn>View diagnostics</ActionBtn>
        </div>
      </div>
    </aside>
  );
}

import { repoStatus } from '../../data';

export function BackendStatusPill() {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2.5 py-1.5">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-60" aria-hidden="true" />
        <span className="relative inline-flex size-2 rounded-full bg-green" />
      </span>
      <span className="font-mono text-[12px] text-text-secondary whitespace-nowrap">
        Backend connected · indexed {repoStatus.indexedAgo}
      </span>
    </div>
  );
}

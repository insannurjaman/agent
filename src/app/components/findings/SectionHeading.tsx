export function SectionHeading({
  title,
  count,
  hasMore,
  onViewAll,
}: {
  title: string;
  count: number;
  hasMore?: boolean;
  onViewAll?: () => void;
}) {
  return (
    <div
      role="heading"
      aria-level={2}
      className="flex items-center justify-between border-b border-border-subtle bg-surface/80 px-6 py-3"
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[12px] font-semibold uppercase tracking-wider text-text">
          {title}
        </span>
        <span className="font-mono text-[11px] text-text-muted tabular-nums">{count}</span>
      </div>
      {hasMore && onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="font-mono text-[11px] text-brand hover:underline focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          View all {count} {title.toLowerCase()} →
        </button>
      )}
    </div>
  );
}

import type { Finding } from '../../data';
import { cn } from '../ui/utils';

interface Change {
  field: string;
  from: string;
  to: string;
}

function deriveChanges(oldF: Finding, newF: Finding): Change[] {
  const changes: Change[] = [];
  if (oldF.confidence !== newF.confidence)
    changes.push({ field: 'Confidence', from: oldF.confidence, to: newF.confidence });
  if (oldF.evidence !== newF.evidence)
    changes.push({ field: 'Evidence', from: oldF.evidence.replace('experiments/', ''), to: newF.evidence.replace('experiments/', '') });
  if (oldF.date !== newF.date)
    changes.push({ field: 'Date', from: oldF.date, to: newF.date });
  if (oldF.title !== newF.title)
    changes.push({ field: 'Title', from: oldF.title, to: newF.title });
  const addedTags = newF.tags.filter((t) => !oldF.tags.includes(t));
  const removedTags = oldF.tags.filter((t) => !newF.tags.includes(t));
  if (addedTags.length > 0) changes.push({ field: 'Tags added', from: '—', to: addedTags.join(', ') });
  if (removedTags.length > 0) changes.push({ field: 'Tags removed', from: removedTags.join(', '), to: '—' });
  const addedFacets = newF.facets.filter((f) => !oldF.facets.includes(f));
  const removedFacets = oldF.facets.filter((f) => !newF.facets.includes(f));
  if (addedFacets.length > 0) changes.push({ field: 'Facets added', from: '—', to: addedFacets.join(', ') });
  if (removedFacets.length > 0) changes.push({ field: 'Facets removed', from: removedFacets.join(', '), to: '—' });
  const oldActionable = oldF.actionable ? 'Yes' : 'No';
  const newActionable = newF.actionable ? 'Yes' : 'No';
  if (oldActionable !== newActionable) changes.push({ field: 'Actionable', from: oldActionable, to: newActionable });
  if (oldF.supersedeReason) changes.unshift({ field: 'Reason', from: '—', to: oldF.supersedeReason });
  return changes;
}

export function ChangeSummary({ oldF, newF }: { oldF: Finding; newF: Finding }) {
  const changes = deriveChanges(oldF, newF);

  if (changes.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-3">
        <div className="rounded-sm border border-border-subtle bg-surface-2/50 px-4 py-3">
          <h4 className="mb-1 font-mono text-[11px] uppercase tracking-wider text-text-muted">What changed</h4>
          <p className="text-[12px] text-text-muted">No structured change data available for this version pair.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-3">
      <div className="rounded-sm border border-border-subtle bg-surface-2/50 px-4 py-3">
        <h4 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-text-muted">What changed</h4>
        <div className="space-y-1.5">
          {changes.map((c, i) => (
            <div key={i} className="grid grid-cols-[100px_1fr_24px_1fr] gap-2 text-[12px] items-start">
              <span className="font-mono text-text-muted pt-0.5">{c.field}</span>
              <span className="font-mono text-text-secondary bg-surface-2 rounded-sm px-1.5 py-0.5 line-clamp-2">{c.from}</span>
              <span className="text-text-muted text-center pt-0.5">→</span>
              <span className="font-mono text-text bg-surface rounded-sm border border-border-subtle px-1.5 py-0.5 line-clamp-2">{c.to}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

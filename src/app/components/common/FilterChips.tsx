import { X } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router';
import { cn } from '../ui/utils';

interface FilterChipConfig {
  key: string;
  label: string;
  param: string;
  value: string;
}

const FILTER_CONFIGS: FilterChipConfig[] = [
  { key: 'conf', label: 'Confidence', param: 'conf', value: '' },
  { key: 'status', label: 'Status', param: 'status', value: '' },
  { key: 'priority', label: 'Priority', param: 'priority', value: '' },
  { key: 'category', label: 'Category', param: 'category', value: '' },
  { key: 'area', label: 'Area', param: 'area', value: '' },
  { key: 'action', label: 'Action', param: 'action', value: '' },
  { key: 'actionable', label: 'Action', param: 'actionable', value: 'true' },
  { key: 'sort', label: 'Sort', param: 'sort', value: '' },
];

function getFilterLabel(param: string, value: string): string {
  const labels: Record<string, Record<string, string>> = {
    conf: { high: 'High', 'medium-high': 'Med-High', medium: 'Medium', low: 'Low', superseded: 'Superseded' },
    status: { open: 'Open', 'in-progress': 'In Progress', 'partial-progress': 'Partial', resolved: 'Resolved' },
    priority: { high: 'High', medium: 'Medium', low: 'Low' },
    category: { factor: 'Factor', schema: 'Schema', 'data-quality': 'Data Quality', process: 'Process', hypothesis: 'Hypothesis', 'anomaly-pattern': 'Anomaly', method: 'Method' },
    area: { rolling: 'Rolling', 'data-quality': 'Data Quality', 'surface-quality': 'Surface Quality' },
    action: { 'action-required': 'Action Required', 'review-recommended': 'Review', 'no-action': 'No Action', blocked: 'Blocked' },
    actionable: { true: 'Action Required' },
    sort: { date: 'Date', confidence: 'Confidence', priority: 'Priority' },
  };
  return labels[param]?.[value] ?? value;
}

export function FilterChips() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeFilters = FILTER_CONFIGS.filter((cfg) => {
    const val = searchParams.get(cfg.param);
    if (!val) return false;
    if (cfg.value && val !== cfg.value) return false;
    return true;
  });

  if (activeFilters.length === 0) return null;

  const removeFilter = (param: string, value?: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.delete(param);
    } else {
      params.delete(param);
    }
    setSearchParams(params);
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams);
    FILTER_CONFIGS.forEach((cfg) => params.delete(cfg.param));
    setSearchParams(params);
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-6 py-2 border-b border-border-subtle bg-surface/50"
      role="region"
      aria-label="Active filters"
    >
      {activeFilters.map((cfg) => {
        const val = searchParams.get(cfg.param) ?? '';
        const displayValue = cfg.value ? getFilterLabel(cfg.param, cfg.value) : getFilterLabel(cfg.param, val);
        return (
          <span
            key={cfg.key}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1 font-mono text-[11px] text-text-secondary"
          >
            <span className="text-text-muted">{cfg.label}:</span>
            <span className="font-medium">{displayValue}</span>
            <button
              type="button"
              onClick={() => removeFilter(cfg.param, cfg.value)}
              className="ml-1 flex size-5 items-center justify-center rounded-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
              aria-label={`Remove ${cfg.label} filter`}
            >
              <X className="size-3" />
            </button>
          </span>
        );
      })}
      {activeFilters.length > 1 && (
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-1 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1 font-mono text-[11px] text-text-muted hover:text-text hover:border-border-strong transition-colors"
        >
          <X className="size-3" />
          Clear all
        </button>
      )}
    </div>
  );
}
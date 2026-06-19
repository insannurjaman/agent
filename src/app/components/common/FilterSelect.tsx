export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-2 px-2 py-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent text-[12px] text-text-secondary outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-surface-2 text-text">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

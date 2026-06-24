import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { cn } from '../ui/utils';

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Extract headings for the table of contents.
export function extractHeadings(md: string): Heading[] {
  const out: Heading[] = [];
  for (const line of md.split('\n')) {
    const m = line.match(/^(#{1,4})\s+(.*)$/);
    if (m) out.push({ level: m[1].length, text: m[2].trim(), id: slugify(m[2].trim()) });
  }
  return out;
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Inline parser: bold, code, links, and F-/Q-ID auto-links.
function renderInline(text: string, navigate: (to: string) => void, keyBase: string): ReactNode[] {
  // Split on the union of patterns, keeping delimiters.
  const tokenRe = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|F-\d{4}|Q-\d{4})/g;
  const parts = text.split(tokenRe);
  return parts.map((p, i) => {
    const key = `${keyBase}-${i}`;
    if (!p) return null;
    if (p.startsWith('**') && p.endsWith('**'))
      return (
        <strong key={key} className="text-text" style={{ fontWeight: 600 }}>
          {p.slice(2, -2)}
        </strong>
      );
    if (p.startsWith('`') && p.endsWith('`'))
      return (
        <code
          key={key}
          className="rounded-sm border border-border-subtle bg-surface-2 px-1 py-0.5 font-mono text-[12px] text-info"
        >
          {p.slice(1, -1)}
        </code>
      );
    const link = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = link[2];
      const isExternal = /^https?:\/\//.test(href);
      if (isExternal && !isSafeUrl(href)) {
        return <span key={key} className="text-text-muted">{link[1]}</span>;
      }
      return (
        <a
          key={key}
          href={href}
          className="text-brand hover:underline"
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {link[1]}
        </a>
      );
    }
    if (/^F-\d{4}$/.test(p))
      return (
        <button
          key={key}
          type="button"
          onClick={() => navigate(`/findings?focus=${p}`)}
          className="font-mono text-[13px] text-brand hover:underline"
        >
          {p}
        </button>
      );
    if (/^Q-\d{4}$/.test(p))
      return (
        <button
          key={key}
          type="button"
          onClick={() => navigate(`/findings?tab=questions&focus=${p}`)}
          className="font-mono text-[13px] text-amber hover:underline"
        >
          {p}
        </button>
      );
    return <span key={key}>{p}</span>;
  });
}

// A figure frame standing in for a generated PNG artifact.
function Figure({ caption, path }: { caption: string; path: string }) {
  return (
    <figure className="my-5 overflow-hidden rounded-sm border border-border-strong bg-surface-2 shadow-[0_10px_28px_rgba(0,0,0,0.16)]">
      <div className="relative h-48 bg-[radial-gradient(circle,var(--border-subtle)_1px,transparent_1px)] [background-size:16px_16px] sm:h-56">
        <svg viewBox="0 0 320 120" preserveAspectRatio="none" className="absolute inset-0 size-full">
          <polyline
            points="0,96 40,90 80,74 120,80 160,52 200,58 240,30 280,38 320,16"
            fill="none"
            stroke="var(--brand-primary)"
            strokeWidth="1.5"
          />
          <polyline
            points="0,108 40,104 80,100 120,96 160,88 200,84 240,72 280,66 320,58"
            fill="none"
            stroke="var(--blue)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        </svg>
      </div>
      <figcaption className="flex flex-col gap-1 border-t border-border-subtle px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[12px] font-medium text-text-secondary">{caption}</span>
        <span className="break-all font-mono text-[10px] text-text-muted">{path}</span>
      </figcaption>
    </figure>
  );
}

// Block-level renderer for the supported markdown subset.
export function Markdown({ source, suppressTitle = false }: { source: string; suppressTitle?: boolean }) {
  const navigate = useNavigate();
  const lines = source.split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  const nextKey = () => `b${key++}`;

  while (i < lines.length) {
    const line = lines[i];

    // Code fence
    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++;
      blocks.push(
        <div key={nextKey()} className="my-5 overflow-hidden rounded-sm border border-border-strong bg-code-surface">
          {language && (
            <div className="border-b border-border-subtle px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted">
              {language}
            </div>
          )}
          <pre
            tabIndex={0}
            className="overflow-auto p-3.5 font-mono text-[12px] leading-[1.65] text-text-secondary outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-ring"
          >
            <code>{buf.join('\n')}</code>
          </pre>
        </div>,
      );
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      const id = slugify(text);
      if (level === 1 && suppressTitle) {
        i++;
        continue;
      }
      blocks.push(
        <div key={nextKey()} id={id} data-report-heading={id} className="scroll-mt-5">
          {level === 1 ? (
            <h2 className="mb-4 mt-1 text-[21px] font-semibold leading-tight text-text">
              {text}
            </h2>
          ) : level === 2 ? (
            <div className="mb-2.5 mt-7 flex items-center gap-3">
              <span className="h-px w-5 shrink-0 bg-brand" />
              <h3 className="font-semibold leading-tight text-text text-[16px]">
                {text}
              </h3>
              <span className="h-px flex-1 bg-border-subtle" />
            </div>
          ) : (
            <div className="mb-2.5 mt-5 flex items-center gap-3">
              <span className="h-px w-5 shrink-0 bg-brand" />
              <h4 className="font-semibold leading-tight text-text text-[14px]">
                {text}
              </h4>
              <span className="h-px flex-1 bg-border-subtle" />
            </div>
          )}
        </div>,
      );
      i++;
      continue;
    }

    // Image / figure
    const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img) {
      blocks.push(<Figure key={nextKey()} caption={img[1]} path={img[2]} />);
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) buf.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push(
        <blockquote
          key={nextKey()}
          className="my-5 rounded-r-sm border border-border-subtle border-l-2 border-l-brand bg-surface-2 px-3.5 py-3 text-[13px] leading-[1.6] text-text-secondary"
        >
          {renderInline(buf.join(' '), navigate, nextKey())}
        </blockquote>,
      );
      continue;
    }

    // Table
    if (line.includes('|') && lines[i + 1]?.includes('---')) {
      const header = line.split('|').map((c) => c.trim()).filter(Boolean);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').map((c) => c.trim()).filter(Boolean));
        i++;
      }
      blocks.push(
        <div
          key={nextKey()}
          tabIndex={0}
          role="region"
          aria-label="Report data table"
          className="my-5 overflow-x-auto rounded-sm border border-border-strong outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
        >
          <table className="w-full min-w-[560px] border-collapse text-[12px]">
            <thead>
              <tr className="bg-elevated">
                {header.map((c, ci) => (
                  <th
                    key={ci}
                    scope="col"
                    className="border-b border-border-strong px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-b border-border-subtle bg-background transition-colors last:border-0 hover:bg-surface-hover">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-2 text-text-secondary">
                      {renderInline(c, navigate, `${nextKey()}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) buf.push(lines[i++].replace(/^\d+\.\s/, ''));
      blocks.push(
        <ol key={nextKey()} className="my-4 space-y-2">
          {buf.map((item, ii) => (
            <li key={ii} className="grid grid-cols-[24px_1fr] gap-2.5 text-[13px] leading-[1.6] text-text-secondary">
              <span className="flex size-6 items-center justify-center rounded-sm border border-brand-border bg-brand-muted font-mono text-[10px] text-brand">
                {String(ii + 1).padStart(2, '0')}
              </span>
              <span>{renderInline(item, navigate, `${nextKey()}-${ii}`)}</span>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) buf.push(lines[i++].replace(/^[-*]\s/, ''));
      blocks.push(
        <ul key={nextKey()} className="my-3 space-y-1.5">
          {buf.map((item, ii) => (
            <li key={ii} className="flex gap-2.5 text-[13px] leading-[1.6] text-text-secondary">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-border-strong" />
              <span>{renderInline(item, navigate, `${nextKey()}-${ii}`)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('>') &&
      !lines[i].startsWith('```') &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !lines[i].startsWith('![')
    ) {
      buf.push(lines[i++]);
    }
    blocks.push(
      <p key={nextKey()} className="my-3 text-[13px] leading-[1.65] text-text-secondary sm:text-[13.5px]">
        {renderInline(buf.join(' '), navigate, nextKey())}
      </p>,
    );
  }

  return <div className="pb-8">{blocks}</div>;
}

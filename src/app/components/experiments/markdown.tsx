import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

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
          className="rounded-sm border border-border-subtle bg-surface-2 px-1 py-0.5 font-mono text-[12px] text-teal"
        >
          {p.slice(1, -1)}
        </code>
      );
    const link = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link)
      return (
        <a key={key} href={link[2]} className="text-teal hover:underline">
          {link[1]}
        </a>
      );
    if (/^F-\d{4}$/.test(p))
      return (
        <button
          key={key}
          type="button"
          onClick={() => navigate(`/findings?focus=${p}`)}
          className="font-mono text-[13px] text-green hover:underline"
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
    <figure className="my-4 overflow-hidden rounded-sm border border-border-subtle bg-surface-2">
      <div className="relative h-40 bg-[radial-gradient(circle,#252b30_1px,transparent_1px)] [background-size:12px_12px]">
        <svg viewBox="0 0 320 120" preserveAspectRatio="none" className="absolute inset-0 size-full">
          <polyline
            points="0,96 40,90 80,74 120,80 160,52 200,58 240,30 280,38 320,16"
            fill="none"
            stroke="#2dd4bf"
            strokeWidth="1.5"
          />
          <polyline
            points="0,108 40,104 80,100 120,96 160,88 200,84 240,72 280,66 320,58"
            fill="none"
            stroke="#6ba6ff"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        </svg>
      </div>
      <figcaption className="flex items-center justify-between border-t border-border-subtle px-3 py-1.5">
        <span className="text-[12px] text-text-secondary">{caption}</span>
        <span className="font-mono text-[11px] text-text-muted">{path}</span>
      </figcaption>
    </figure>
  );
}

// Block-level renderer for the supported markdown subset.
export function Markdown({ source }: { source: string }) {
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
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++;
      blocks.push(
        <pre
          key={nextKey()}
          className="my-3 overflow-auto rounded-sm border border-border-subtle bg-surface-2 p-3 font-mono text-[12px] leading-relaxed text-text-secondary"
        >
          <code>{buf.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      const id = slugify(text);
      const sizes: Record<number, string> = { 1: '20px', 2: '16px', 3: '14px', 4: '13px' };
      blocks.push(
        <div key={nextKey()} id={id} className="scroll-mt-4">
          {level === 1 ? (
            <h2
              className="mt-1 mb-3 text-text"
              style={{ fontSize: sizes[1], fontWeight: 600 }}
            >
              {text}
            </h2>
          ) : (
            <h3
              className="mt-5 mb-2 flex items-center gap-2 text-text"
              style={{ fontSize: sizes[level] ?? '14px', fontWeight: 600 }}
            >
              <span className="font-mono text-[11px] uppercase tracking-wider text-teal">§</span>
              {text}
            </h3>
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
          className="my-3 border-l-2 border-amber/50 bg-amber/5 px-3 py-2 text-[13px] leading-relaxed text-text-secondary"
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
        <div key={nextKey()} className="my-3 overflow-hidden rounded-sm border border-border-subtle">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-surface-2">
                {header.map((c, ci) => (
                  <th
                    key={ci}
                    className="border-b border-border-subtle px-3 py-1.5 text-left font-mono text-[11px] uppercase tracking-wide text-text-muted"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-b border-border-subtle last:border-0">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-1.5 text-text-secondary">
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
        <ol key={nextKey()} className="my-2 ml-1 space-y-1">
          {buf.map((item, ii) => (
            <li key={ii} className="flex gap-2 text-[13px] leading-relaxed text-text-secondary">
              <span className="font-mono text-[12px] text-teal">{ii + 1}.</span>
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
        <ul key={nextKey()} className="my-2 ml-1 space-y-1">
          {buf.map((item, ii) => (
            <li key={ii} className="flex gap-2 text-[13px] leading-relaxed text-text-secondary">
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
      <p key={nextKey()} className="my-2 text-[13px] leading-relaxed text-text-secondary">
        {renderInline(buf.join(' '), navigate, nextKey())}
      </p>,
    );
  }

  return <div>{blocks}</div>;
}

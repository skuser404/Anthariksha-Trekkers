import { Fragment } from 'react';

/**
 * Tiny safe markdown renderer.
 * Returns a React tree, never inserts raw HTML. XSS-proof by design.
 *
 * Supports:
 *   # H1 / ## H2 / ### H3
 *   **bold**   *italic*   `code`   [text](url)
 *   - bullets, * bullets
 *   1. ordered list
 *   blank lines as paragraph breaks
 *   --- as horizontal rule
 */

const INLINE_RX = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]]+\]\([^)]+\))/g;

function isSafeURL(url) {
  const lower = String(url || '').trim().toLowerCase();
  return (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:') ||
    lower.startsWith('/') ||
    lower.startsWith('#')
  );
}

function renderInline(text) {
  if (!text) return null;
  const tokens = String(text).split(INLINE_RX).filter(Boolean);
  return tokens.map((t, i) => {
    if (t.startsWith('**') && t.endsWith('**'))
      return <strong key={i}>{t.slice(2, -2)}</strong>;
    if (t.startsWith('*') && t.endsWith('*'))
      return <em key={i}>{t.slice(1, -1)}</em>;
    if (t.startsWith('`') && t.endsWith('`'))
      return <code key={i} className="px-1.5 py-0.5 rounded bg-ink/10 text-[0.9em]">{t.slice(1, -1)}</code>;
    const link = t.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, url] = link;
      if (!isSafeURL(url)) return <span key={i}>{label}</span>;
      const external = /^https?:/.test(url);
      return (
        <a
          key={i}
          href={url}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer noopener' : undefined}
          className="text-ember underline underline-offset-4 hover:opacity-80"
        >
          {label}
        </a>
      );
    }
    return <Fragment key={i}>{t}</Fragment>;
  });
}

export function Markdown({ children, className = '' }) {
  const source = String(children || '');
  const lines = source.replace(/\r\n/g, '\n').split('\n');

  const nodes = [];
  let para = [];
  let listType = null; // 'ul' or 'ol'
  let list = [];

  const flushPara = () => {
    if (para.length) {
      nodes.push(
        <p key={nodes.length} className="mb-4 text-[15px] leading-relaxed text-ink/85">
          {renderInline(para.join(' '))}
        </p>
      );
      para = [];
    }
  };

  const flushList = () => {
    if (list.length) {
      const Tag = listType === 'ol' ? 'ol' : 'ul';
      nodes.push(
        <Tag key={nodes.length} className={`mb-4 ${Tag === 'ol' ? 'list-decimal' : 'list-disc'} pl-6 space-y-1.5 text-[15px] leading-relaxed text-ink/85`}>
          {list.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </Tag>
      );
      list = [];
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) { flushPara(); flushList(); continue; }
    if (line === '---' || line === '***') {
      flushPara(); flushList();
      nodes.push(<hr key={nodes.length} className="my-8 border-ink/10" />);
      continue;
    }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushPara(); flushList();
      const lvl = h[1].length;
      const text = h[2];
      if (lvl === 1)
        nodes.push(<h1 key={nodes.length} className="serif text-3xl lg:text-4xl mt-8 mb-4 tracking-tight font-medium">{renderInline(text)}</h1>);
      else if (lvl === 2)
        nodes.push(<h2 key={nodes.length} className="serif text-2xl mt-8 mb-3 tracking-tight font-medium">{renderInline(text)}</h2>);
      else
        nodes.push(<h3 key={nodes.length} className="serif text-xl mt-6 mb-2 tracking-tight font-medium">{renderInline(text)}</h3>);
      continue;
    }

    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      if (listType && listType !== 'ul') flushList();
      flushPara();
      listType = 'ul';
      list.push(ul[1]);
      continue;
    }
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      if (listType && listType !== 'ol') flushList();
      flushPara();
      listType = 'ol';
      list.push(ol[1]);
      continue;
    }

    // regular text — accumulate into paragraph
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();

  return <div className={`markdown ${className}`}>{nodes}</div>;
}

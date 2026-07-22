// Minimal, safe markdown renderer (no external deps).
// Supports: headings, bold, italic, inline code, code blocks, links,
// unordered/ordered lists, blockquotes, images, line breaks.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inline(s: string): string {
  let out = escapeHtml(s);
  // images ![alt](url)
  out = out.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,
    '<img alt="$1" src="$2" />');
  // links [text](url)
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // bold
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  // italic
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  out = out.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
  // inline code
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  return out;
}

export function renderMarkdown(md: string): string {
  if (!md) return '';
  const lines = md.split('\n');
  const html: string[] = [];
  let inCode = false;
  let inUl = false;
  let inOl = false;

  for (const raw of lines) {
    const line = raw;

    // code block fence
    if (/^```/.test(line.trim())) {
      if (inCode) {
        html.push('</code></pre>');
        inCode = false;
      } else {
        if (inUl) { html.push('</ul>'); inUl = false; }
        if (inOl) { html.push('</ol>'); inOl = false; }
        html.push('<pre><code>');
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      html.push(escapeHtml(line));
      html.push('\n');
      continue;
    }

    if (line.trim() === '') {
      if (inUl) { html.push('</ul>'); inUl = false; }
      if (inOl) { html.push('</ol>'); inOl = false; }
      html.push('');
      continue;
    }

    // headings
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      if (inUl) { html.push('</ul>'); inUl = false; }
      if (inOl) { html.push('</ol>'); inOl = false; }
      const level = h[1].length;
      html.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }

    // blockquote
    if (/^>\s?/.test(line)) {
      if (inUl) { html.push('</ul>'); inUl = false; }
      if (inOl) { html.push('</ol>'); inOl = false; }
      html.push(`<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`);
      continue;
    }

    // ordered list
    const ol = /^\d+\.\s+(.*)$/.exec(line);
    if (ol) {
      if (inUl) { html.push('</ul>'); inUl = false; }
      if (!inOl) { html.push('<ol>'); inOl = true; }
      html.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }

    // unordered list
    const ul = /^[-*]\s+(.*)$/.exec(line);
    if (ul) {
      if (inOl) { html.push('</ol>'); inOl = false; }
      if (!inUl) { html.push('<ul>'); inUl = true; }
      html.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }

    if (inUl) { html.push('</ul>'); inUl = false; }
    if (inOl) { html.push('</ol>'); inOl = false; }
    html.push(`<p>${inline(line)}</p>`);
  }
  if (inUl) html.push('</ul>');
  if (inOl) html.push('</ol>');
  if (inCode) html.push('</code></pre>');
  return html.join('\n');
}

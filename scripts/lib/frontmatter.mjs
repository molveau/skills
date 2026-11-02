// Minimal YAML-subset frontmatter parser: `key: value`, `>-`/`>`/`|`/`|-` blocks,
// and one level of nested mapping (e.g. `metadata:`).
export function parseFrontmatter(text) {
  const src = text.replace(/\r\n/g, '\n');
  const m = src.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!m) return { data: {}, body: src };
  const body = src.slice(m[0].length);
  const lines = m[1].split('\n');
  const data = {};
  const unquote = (v) => {
    v = v.trim();
    if ((v.startsWith('"') && v.endsWith('"') && v.length > 1) || (v.startsWith("'") && v.endsWith("'") && v.length > 1)) {
      return v.slice(1, -1);
    }
    return v;
  };
  for (let i = 0; i < lines.length; i++) {
    const km = lines[i].match(/^([A-Za-z0-9_-]+):[ \t]*(.*)$/);
    if (!km) continue;
    const [, key, rest] = km;
    const blockLines = [];
    let j = i + 1;
    while (j < lines.length && (lines[j] === '' || /^\s/.test(lines[j]))) blockLines.push(lines[j++]);
    if (/^[>|][+-]?$/.test(rest.trim())) {
      const parts = blockLines.map((l) => l.trim());
      data[key] = rest.trim().startsWith('>')
        ? parts.join(' ').replace(/\s+/g, ' ').trim()
        : parts.join('\n').trim();
      i = j - 1;
    } else if (rest.trim() === '' && blockLines.some((l) => l.trim())) {
      const nested = {};
      for (const l of blockLines) {
        const nm = l.match(/^\s+([A-Za-z0-9_-]+):[ \t]*(.*)$/);
        if (nm) nested[nm[1]] = unquote(nm[2]);
      }
      data[key] = nested;
      i = j - 1;
    } else {
      data[key] = unquote(rest);
    }
  }
  return { data, body };
}

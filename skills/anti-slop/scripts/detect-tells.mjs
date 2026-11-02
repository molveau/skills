#!/usr/bin/env node
// detect-tells: static scan for the "vibe-coded tells" listed in references/tells.md.
// Zero dependencies. Usage: node detect-tells.mjs [--json] [--include-tests] <paths...>
// Exit: 0 clean, 1 findings, 2 usage error.
import { readFileSync, readdirSync, statSync, existsSync, realpathSync } from 'node:fs';
import { join, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.open-next', 'coverage']);
const EXTS = new Set(['.tsx', '.jsx', '.ts', '.js', '.mjs', '.cjs', '.css', '.html', '.md', '.mdx', '.json']);
const MAX_BYTES = 1_000_000;
const EM = '\u2014';

export const LABELS = {
  1: 'Violet/fuchsia/indigo gradient',
  2: 'Gradient text',
  3: 'Emoji in copy',
  5: 'Colored side-stripe border',
  6: 'Glassmorphism without a scrolling surface',
  10: 'Lucide imported outside the icons module',
  12: 'Fade-in on scroll',
  14: 'Button that fades on hover',
  16: 'Em dash in copy',
  17: 'Buzzword copy',
  19: 'Space Grotesk + Instrument Serif',
};

const kindOf = (path) => {
  const e = extname(path).toLowerCase();
  if (['.tsx', '.jsx', '.ts', '.js', '.mjs', '.cjs'].includes(e)) return 'js';
  if (e === '.css') return 'css';
  if (e === '.html') return 'html';
  if (e === '.md' || e === '.mdx') return 'md';
  if (e === '.json') return 'json';
  return null;
};

// Blank a span but keep newlines so line numbers survive.
const blank = (s) => s.replace(/[^\n]/g, ' ');

// Blank comments and regex literals in JS/TS/JSX; strings and JSX text stay.
export function maskJs(src) {
  let out = '';
  let i = 0;
  let prev = ''; // last significant char emitted in code
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/' && prev !== ':') {
      let j = src.indexOf('\n', i);
      if (j < 0) j = n;
      out += blank(src.slice(i, j));
      i = j;
      continue;
    }
    if (c === '/' && d === '*') {
      let j = src.indexOf('*/', i + 2);
      j = j < 0 ? n : j + 2;
      out += blank(src.slice(i, j));
      i = j;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === c) { j++; break; }
        if (c !== '`' && src[j] === '\n') break;
        j++;
      }
      out += src.slice(i, j);
      prev = c;
      i = j;
      continue;
    }
    if (c === '/' && prev !== '<') {
      const regexStart = prev === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || /(?:^|[^\w$])(?:return|typeof|case)\s*$/.test(out.slice(-12));
      if (regexStart) {
        let j = i + 1;
        let inClass = false;
        let ok = false;
        while (j < n && src[j] !== '\n') {
          if (src[j] === '\\') { j += 2; continue; }
          if (src[j] === '[') inClass = true;
          else if (src[j] === ']') inClass = false;
          else if (src[j] === '/' && !inClass) { ok = true; break; }
          j++;
        }
        if (ok) {
          j++;
          while (j < n && /[a-z]/i.test(src[j])) j++;
          out += blank(src.slice(i, j));
          prev = ')';
          i = j;
          continue;
        }
      }
    }
    out += c;
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return out;
}

// Markdown: blank fenced blocks and inline code spans.
export function maskMd(src) {
  return src
    .replace(/^(```|~~~)[\s\S]*?^\1[^\n]*$/gm, blank)
    .replace(/`[^`\n]*`/g, (m) => ' '.repeat(m.length));
}

const maskHtml = (src) => src.replace(/<!--[\s\S]*?-->/g, blank);
const maskCss = (src) => src.replace(/\/\*[\s\S]*?\*\//g, blank);

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{2604}\u{2607}-\u{27BF}\u{2B50}\u{2B55}]/u;
const EMOJI_OK = /[✓✔✕✖✗✘]/u; // check and cross marks are glyphs, not emoji
const PURPLE_HEX = /#(?:8b5cf6|7c3aed|6d28d9|6366f1|4f46e5|a855f7|9333ea|d946ef|c026d3)\b/i;
const BUZZ = /(?<![\w.$-])(seamless(?:ly)?|unlock(?:s|ed|ing)?|supercharg(?:e|es|ed|ing)|next-level|elevat(?:e|es|ed|ing)|effortless(?:ly)?)(?![\w-])/gi;
const SCROLL_REVEAL = /\bwhileInView\b|\bdata-aos\b|<(?:Reveal|ScrollReveal|FadeIn|FadeInUp|FadeInOnScroll|AnimateOnScroll)\b|\banimate-on-scroll\b/;

function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return starts;
}

function enclosingCssBlock(text, idx) {
  const open = text.lastIndexOf('{', idx);
  const close = text.indexOf('}', idx);
  return text.slice(open < 0 ? 0 : open, close < 0 ? text.length : close);
}

// Text of the class expression around line i: back to a className/class=/cn(/clsx(/cva(/tag line
// (max 8 lines), forward until parentheses and quotes close (max 8 lines).
function classScope(lines, i) {
  let start = i;
  for (let k = i; k >= Math.max(0, i - 8); k--) {
    if (/className|class=|\bcn\(|\bclsx\(|\bcva\(|</.test(lines[k])) { start = k; break; }
  }
  let depth = 0;
  let end = i;
  for (let k = start; k <= Math.min(lines.length - 1, i + 8); k++) {
    const l = lines[k];
    for (const c of l) { if (c === '(' || c === '{') depth++; else if (c === ')' || c === '}') depth--; }
    end = k;
    const win = lines.slice(start, k + 1).join('\n');
    const quotesClosed = (win.match(/"/g) || []).length % 2 === 0 && (win.match(/`/g) || []).length % 2 === 0;
    if (k >= i && depth <= 0 && quotesClosed) break;
  }
  return lines.slice(start, end + 1).join('\n');
}

// Copy-only view of a code line: string literals and JSX text, nothing else.
function copyOnly(kind, line) {
  if (kind !== 'js') return line;
  const parts = [];
  for (const m of line.matchAll(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`[^`]*`/g)) parts.push(m[0]);
  for (const m of line.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)(?=<)/g)) parts.push(m[1]);
  const t = line.trim();
  if (t && !/^(?:const|let|var|function|export|import|return|type|interface|class|async)\b/.test(t) && !/[=;(){}[\]]/.test(t) && /\s/.test(t)) parts.push(t);
  return parts.join(' ');
}

function scanFile({ path, text }) {
  const kind = kindOf(path);
  if (!kind) return [];
  const norm = path.split(sep).join('/');
  let code = text;
  if (kind === 'js') code = maskJs(text);
  else if (kind === 'css') code = maskCss(text);
  else if (kind === 'html') code = maskHtml(text);
  else if (kind === 'md') code = maskMd(text);

  const out = [];
  const lines = code.split('\n');
  const add = (i, tell, match) => out.push({ path, line: i + 1, tell, label: LABELS[tell], match: String(match).trim().slice(0, 80) });
  const hasCode = kind === 'js' || kind === 'html' || kind === 'css';
  const hasCopy = kind !== 'css';
  const iconsModule = /(^|\/)components\/icons(\/|\.[jt]sx?$)/.test(norm);

  lines.forEach((line, i) => {
    let m;
    if (hasCode) {
      // 1 purple gradients
      if ((m = line.match(/\b(?:from|via|to)-(?:violet|fuchsia|indigo|purple)-\d+/))) add(i, 1, m[0]);
      else if (/gradient\(/.test(line) && (m = line.match(PURPLE_HEX))) add(i, 1, m[0]);
      // 2 gradient text
      if (/\bbg-clip-text\b/.test(line) && /gradient|\bfrom-|\bvia-|\bto-/.test(line)) add(i, 2, 'bg-clip-text + gradient');

      // 5 side stripes
      for (const mm of line.matchAll(/\bborder-[ls]-(?:(\d+)\b|\[(\d+)px\])/g)) {
        if (Number(mm[1] ?? mm[2]) > 1) add(i, 5, mm[0]);
      }
      for (const mm of line.matchAll(/border-?left(?:-?width)?["']?\s*:\s*["']?(\d+(?:\.\d+)?)/gi)) {
        if (Number(mm[1]) > 1) add(i, 5, mm[0]);
      }
      // 6 glass without a scrolling surface
      if (kind !== 'css' && (m = line.match(/\bbackdrop-blur(?:-[\w[\]./]+)?/)) && !/\b(?:sticky|fixed)\b/.test(classScope(lines, i))) {
        add(i, 6, m[0]);
      }
      // 10 lucide outside the icons module
      if (!iconsModule && /(?:from\s+|import\s*\(\s*|require\(\s*)["']lucide-react(?:\/[^"']*)?["']/.test(line)) add(i, 10, 'lucide-react');
      // 12 reveal on scroll
      if (kind !== 'css' && (m = line.match(SCROLL_REVEAL))) add(i, 12, m[0]);
      // 14 hover fade
      if ((m = line.match(/(?<![\w-])hover:opacity-[\w[\]./%]+/))) add(i, 14, m[0]);
    }
    if (hasCopy) {
      // 3 emoji
      for (const ch of line) {
        if (EMOJI.test(ch) && !EMOJI_OK.test(ch)) { add(i, 3, ch); break; }
      }
      // 16 em dash, except a lone placeholder
      if (line.includes(EM)) {
        const stripped = line.replace(/(["'`>])\s*\u2014\s*(?=["'`<])/g, '$1');
        if (stripped.includes(EM)) add(i, 16, line.slice(Math.max(0, line.indexOf(EM) - 12), line.indexOf(EM) + 13));
      }
      // 17 buzzwords
      BUZZ.lastIndex = 0;
      const copy = copyOnly(kind, line);
      while ((m = BUZZ.exec(copy))) add(i, 17, m[0]);
    }
  });

  if (kind === 'css') {
    const starts = lineStarts(code);
    const lineOf = (idx) => starts.findIndex((s, k) => s <= idx && (starts[k + 1] ?? Infinity) > idx);
    for (const mm of code.matchAll(/background-clip\s*:\s*text/g)) {
      if (/gradient/.test(enclosingCssBlock(code, mm.index))) add(lineOf(mm.index), 2, 'background-clip: text');
    }
    for (const mm of code.matchAll(/backdrop-filter\s*:[^;}]*blur/g)) {
      const block = enclosingCssBlock(code, mm.index);
      if (!/\b(?:sticky|fixed)\b/.test(block)) add(lineOf(mm.index), 6, 'backdrop-filter: blur');
    }
  }
  return out;
}

export function detectTells(files) {
  const findings = files.flatMap(scanFile);
  // 19: only a tell when both faces are in the scanned set
  const grotesk = /Space[ _-]Grotesk/i;
  const instr = /Instrument[ _-]Serif/i;
  const hasG = files.some((f) => grotesk.test(f.text));
  const hasI = files.some((f) => instr.test(f.text));
  if (hasG && hasI) {
    for (const f of files) {
      f.text.split('\n').forEach((line, i) => {
        const m = line.match(grotesk) || line.match(instr);
        if (m && kindOf(f.path)) findings.push({ path: f.path, line: i + 1, tell: 19, label: LABELS[19], match: m[0] });
      });
    }
  }
  return findings.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : a.line - b.line || a.tell - b.tell));
}

// Whether a file is one the CLI scans: a known kind, at most 1 MB, not minified, a declaration file, a lockfile
// or (unless includeTests) a test file.
export function isScannable(path, size, includeTests) {
  const base = path.split(/[\\/]/).pop();
  if (!kindOf(path) || size > MAX_BYTES) return false;
  if (/\.min\.|\.d\.ts$|^(?:package-lock|pnpm-lock|bun)\./.test(base)) return false;
  return includeTests || !/\.(?:test|spec)\.[^.]+$/.test(base);
}

// The text report: one line per finding, then the summary line.
export function formatFindings(findings, scanned) {
  let out = '';
  for (const f of findings) out += `${f.path}:${f.line}  #${f.tell} ${f.label}  ${f.match}\n`;
  const counts = {};
  for (const f of findings) counts[f.tell] = (counts[f.tell] ?? 0) + 1;
  const summary = Object.keys(counts).map((t) => `#${t} ${counts[t]}`).join(', ');
  return out + `${findings.length} finding(s) in ${new Set(findings.map((f) => f.path)).size} file(s) (${scanned} scanned${summary ? `; ${summary}` : ''})\n`;
}

function collect(target, includeTests, acc) {
  let st;
  try { st = statSync(target); } catch { return; } // broken symlink or vanished file: skip
  if (st.isDirectory()) {
    let names;
    try { names = readdirSync(target).sort(); } catch { return; } // unreadable folder: skip
    for (const name of names) {
      if (SKIP_DIRS.has(name)) continue;
      collect(join(target, name), includeTests, acc);
    }
    return;
  }
  if (!isScannable(target, st.size, includeTests)) return;
  try { acc.push({ path: target, text: readFileSync(target, 'utf8') }); } catch { /* unreadable: skip */ }
}

function main(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const paths = argv.filter((a) => !a.startsWith('--'));
  const known = new Set(['--json', '--include-tests', '--help']);
  const bad = [...flags].filter((f) => !known.has(f));
  if (flags.has('--help')) {
    process.stdout.write('Usage: detect-tells.mjs [--json] [--include-tests] <paths...>\n');
    return 0;
  }
  if (bad.length || !paths.length) {
    process.stderr.write('Usage: detect-tells.mjs [--json] [--include-tests] <paths...>\n');
    return 2;
  }
  const files = [];
  for (const p of paths) {
    if (!existsSync(p)) { process.stderr.write(`No such path: ${p}\n`); return 2; }
    collect(p, flags.has('--include-tests'), files);
  }
  const findings = detectTells(files);
  if (flags.has('--json')) {
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    process.stdout.write(formatFindings(findings, files.length));
  }
  return findings.length ? 1 : 0;
}

// Run as a CLI only when executed directly, never on import. Node resolves import.meta.url through the real
// path while argv[1] keeps a symlinked one (skills are often installed as symlinks), so compare real paths.
function isMainModule() {
  if (!process.argv[1]) return false;
  let resolved;
  try {
    resolved = realpathSync(process.argv[1]);
  } catch {
    resolved = process.argv[1];
  }
  return import.meta.url === pathToFileURL(resolved).href;
}

if (isMainModule()) {
  process.exitCode = main(process.argv.slice(2));
}

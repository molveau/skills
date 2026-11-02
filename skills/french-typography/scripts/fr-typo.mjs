#!/usr/bin/env node
// fr-typo: check or fix French typography spacing in JSON message files and Markdown prose.
// Zero dependencies. Usage: node fr-typo.mjs --check|--fix [--json] <files-or-dirs...>
// Exit: 0 clean (or fixed), 1 findings remain, 2 usage error.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, realpathSync } from 'node:fs';
import { join, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const NBSP = ' ';
const NNBSP = ' ';
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.open-next', 'coverage']);
const EXTS = new Set(['.json', '.md', '.mdx']);
const MAX_BYTES = 2_000_000;

// A grouped number: 1-3 digits then groups of exactly 3. A trailing -digit means a phone number.
const GROUPED = /(?<![\d.,])(\d{1,3}(?:[   ]\d{3})+)(?!\d|-\d)/g;

/**
 * Applies French spacing. Idempotent. Only rewrites spaces that already exist, so URLs,
 * times such as 10:30, ICU placeholders such as {count} and phone numbers are left alone.
 * U+202F between digit groups; U+00A0 between a number and $, before an amount that follows
 * a word, before : ; ! ?, and inside guillemets.
 */
export function frTypo(text) {
  let out = text;
  out = out.replace(GROUPED, (m) => m.replace(/[  ]/g, NNBSP));
  out = out.replace(/(\d) \$/g, `$1${NBSP}$`);
  out = out.replace(/ (?=\d+(?: \d{3})* \$)/g, NBSP);
  // Extension of the original Molveau frTypo, which has no percent rule.
  out = out.replace(/(\d) %/g, `$1${NBSP}%`);
  out = out.replace(/ ([:;!?])/g, `${NBSP}$1`);
  out = out.replace(/« /g, `«${NBSP}`).replace(/ »/g, `${NBSP}»`);
  return out;
}

export const RULES = ['high-punct', 'thousands', 'currency', 'percent', 'guillemets', 'em-dash', 'straight-apostrophe'];

// Straight apostrophe between two letters. URL-like tokens are skipped; an apostrophe next to
// { or } (ICU quoting such as '{') never sits between two letters, so it is never matched.
const APOSTROPHE = /\p{L}'\p{L}/gu;
const URLISH = /(?:https?:\/\/|www\.)\S+/g;
function apostropheHits(text) {
  const urls = [...text.matchAll(URLISH)].map((m) => [m.index, m.index + m[0].length]);
  return [...text.matchAll(APOSTROPHE)].filter((m) => !urls.some(([a, b]) => m.index >= a && m.index < b));
}

/** frTypo plus curly apostrophes: what --fix applies. */
export function fixFr(text) {
  let out = frTypo(text);
  const hits = apostropheHits(out).map((m) => m.index + 1).reverse();
  for (const i of hits) out = out.slice(0, i) + '\u2019' + out.slice(i + 1);
  return out;
}

/** Lists spacing and punctuation problems in one string. `index` is a UTF-16 offset. */
export function checkFr(text) {
  const found = [];
  const add = (rule, re, group = 0) => {
    for (const m of text.matchAll(re)) found.push({ index: m.index, rule, match: m[group] });
  };
  add('high-punct', / [:;!?]/g);
  for (const m of text.matchAll(GROUPED)) {
    if (/[  ]/.test(m[1])) found.push({ index: m.index, rule: 'thousands', match: m[1] });
  }
  add('currency', /\d \$/g);
  add('percent', /\d %/g);
  add('currency', /(?<!\d) \d+(?:[   ]\d{3})*[  ]\$/g);
  add('guillemets', /« | »/g);
  add('em-dash', /—/g);
  for (const m of apostropheHits(text)) found.push({ index: m.index, rule: 'straight-apostrophe', match: m[0] });
  return found.sort((a, b) => a.index - b.index || a.rule.localeCompare(b.rule));
}

/** Names the two invisible no-break spaces so a report shows them. */
export const visible = (s) => s.replace(/\u00a0/g, '<nbsp>').replace(/\u202f/g, '<nnbsp>');

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

// JSON string literals that are values (not keys).
function jsonValueLiterals(text) {
  const out = [];
  for (const m of text.matchAll(/"(?:[^"\\\n]|\\.)*"/g)) {
    if (/^\s*:/.test(text.slice(m.index + m[0].length))) continue;
    let value;
    try { value = JSON.parse(m[0]); } catch { continue; }
    out.push({ index: m.index, literal: m[0], value });
  }
  return out;
}

// One classifier for check and fix. Returns, per line, whether it is prose (not fenced or indented code).
// A fence closes only on the same character with at least the opening length and nothing after it.
function classifyLines(text) {
  let fence = null;
  return text.split('\n').map((line) => {
    const f = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (f && f[1][0] === fence[0] && f[1].length >= fence.length && f[2].trim() === '') fence = null;
      return { line, prose: false };
    }
    if (f) { fence = f[1]; return { line, prose: false }; }
    return { line, prose: !/^(?: {4}|\t)/.test(line) };
  });
}

// Prose parts of one line: everything outside inline code spans.
function* proseParts(line) {
  let last = 0;
  for (const span of line.matchAll(/(`+)[^`]*?\1/g)) {
    yield { column: last, text: line.slice(last, span.index) };
    last = span.index + span[0].length;
  }
  yield { column: last, text: line.slice(last) };
}

function* proseSegments(text) {
  for (const [i, { line, prose }] of classifyLines(text).entries()) {
    if (!prose) continue;
    for (const part of proseParts(line)) yield { line: i + 1, ...part };
  }
}

/** Findings for one file: [{ path, line, column, rule, match }]. */
export function scanText(path, text) {
  const found = [];
  if (extname(path).toLowerCase() === '.json') {
    for (const lit of jsonValueLiterals(text)) {
      for (const f of checkFr(lit.value)) {
        found.push({ path, line: lineOf(text, lit.index), rule: f.rule, match: f.match });
      }
    }
  } else {
    for (const seg of proseSegments(text)) {
      for (const f of checkFr(seg.text)) {
        found.push({ path, line: seg.line, column: seg.column + f.index + 1, rule: f.rule, match: f.match });
      }
    }
  }
  return found;
}

/** Applies fixFr to JSON string values or Markdown prose; everything else is byte-identical. */
export function fixText(path, text) {
  if (extname(path).toLowerCase() === '.json') {
    let out = '';
    let last = 0;
    for (const lit of jsonValueLiterals(text)) {
      const fixed = fixFr(lit.value);
      if (fixed === lit.value) continue;
      out += text.slice(last, lit.index) + JSON.stringify(fixed);
      last = lit.index + lit.literal.length;
    }
    return out + text.slice(last);
  }
  return classifyLines(text)
    .map(({ line, prose }) => {
      if (!prose) return line;
      let res = '';
      let last = 0;
      for (const span of line.matchAll(/(`+)[^`]*?\1/g)) {
        res += fixFr(line.slice(last, span.index)) + span[0];
        last = span.index + span[0].length;
      }
      return res + fixFr(line.slice(last));
    })
    .join('\n');
}

function collectFiles(p, out) {
  let st;
  try { st = statSync(p); } catch { return; } // broken symlink or vanished file: skip
  if (st.isDirectory()) {
    let names;
    try { names = readdirSync(p).sort(); } catch { return; } // unreadable folder: skip
    for (const name of names) {
      if (SKIP_DIRS.has(name)) continue;
      collectFiles(join(p, name), out);
    }
  } else if (st.isFile() && EXTS.has(extname(p).toLowerCase()) && st.size <= MAX_BYTES) {
    out.push(p);
  }
}

const USAGE = 'Usage: fr-typo.mjs --check|--fix [--json] <files-or-dirs...>\n';

function main(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const paths = argv.filter((a) => !a.startsWith('--'));
  const known = new Set(['--check', '--fix', '--json', '--help']);
  const bad = [...flags].some((f) => !known.has(f));
  const modes = ['--check', '--fix'].filter((m) => flags.has(m));
  if (flags.has('--help')) {
    process.stdout.write(USAGE);
    return 0;
  }
  if (bad || modes.length !== 1 || paths.length === 0 || paths.some((p) => !existsSync(p))) {
    process.stderr.write(USAGE);
    return 2;
  }
  const files = [];
  for (const p of paths) collectFiles(p, files);
  const findings = [];
  let fixed = 0;
  for (const file of files) {
    let text = readFileSync(file, 'utf8');
    if (flags.has('--fix')) {
      const next = fixText(file, text);
      if (next !== text) { writeFileSync(file, next); fixed++; }
      text = next;
    }
    findings.push(...scanText(file, text));
  }
  if (flags.has('--json')) {
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    for (const f of findings) {
      const shown = visible(f.match);
      process.stdout.write(`${f.path}:${f.line}${f.column ? ':' + f.column : ''} ${f.rule} ${JSON.stringify(shown)}\n`);
    }
    process.stdout.write(`${files.length} file(s) scanned${flags.has('--fix') ? `, ${fixed} fixed` : ''}, ${findings.length} finding(s)${flags.has('--fix') && findings.length ? ' (em dashes need a manual edit)' : ''}\n`);
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

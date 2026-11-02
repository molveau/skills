#!/usr/bin/env node
// check-motion: static scan for motion that breaks the guardrails in references/guardrails.md.
// Zero dependencies. Usage: node check-motion.mjs [--json] [--include-tests] <paths...>
// Exit: 0 clean, 1 findings, 2 usage error.
import { readFileSync, readdirSync, statSync, existsSync, realpathSync } from 'node:fs';
import { join, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.open-next', 'coverage']);
export const EXTS = new Set(['.tsx', '.jsx', '.ts', '.js', '.mjs', '.cjs', '.css', '.html']);
const MAX_BYTES = 1_000_000;

const blank = (s) => s.replace(/[^\n]/g, ' ');

// Blank comments (keeping newlines) while leaving strings alone.
function maskComments(src, css) {
  if (css) return src.replace(/\/\*[\s\S]*?\*\//g, blank);
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/' && src[i - 1] !== ':') {
      let j = src.indexOf('\n', i);
      if (j < 0) j = n;
      out += blank(src.slice(i, j));
      i = j;
    } else if (c === '/' && d === '*') {
      let j = src.indexOf('*/', i + 2);
      j = j < 0 ? n : j + 2;
      out += blank(src.slice(i, j));
      i = j;
    } else if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === c) { j++; break; }
        if (c !== '`' && src[j] === '\n') break;
        j++;
      }
      out += src.slice(i, j);
      i = j;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

// House rule for marketing sites: no scroll reveals or smooth-scroll libraries.
// Drop the rule (or ignore these findings) when the brief calls for scroll storytelling.
const SCROLL_REVEAL = /from\s+['"](?:@studio-freight\/)?lenis(?:\/[^'"]*)?['"]|from\s+['"](?:locomotive-scroll|smooth-scrollbar|aos)(?:\/[^'"]*)?['"]|\bdata-aos\b/g;
const WHILE_IN_VIEW = /whileInView/g;
const TRANSITION_ALL = /transition-all|transition(?:-property)?:\s*all\b/g;
// Reduced-motion handling must be a call or a query; a bare import does not count.
const REDUCED = /prefers-reduced-motion|useReducedMotion\s*\(|matchMedia\s*\([^)]*reduce/;

export const RULES = ['scroll-reveal', 'while-in-view', 'transition-all', 'transform-in-arbitrary-transition', 'no-reduced-motion'];

// Index of the bracket closing the one at `open`, skipping string literals (-1 if unbalanced).
function balancedEnd(code, open) {
  const pairs = { '(': ')', '{': '}' };
  const stack = [pairs[code[open]]];
  for (let i = open + 1; i < code.length && i < open + 4000; i++) {
    const c = code[i];
    if (c === '"' || c === "'" || c === '`') {
      i++;
      while (i < code.length && code[i] !== c) { if (code[i] === '\\') i++; i++; }
    } else if (pairs[c]) stack.push(pairs[c]);
    else if (c === stack[stack.length - 1]) { stack.pop(); if (!stack.length) return i; }
  }
  return -1;
}

// Index of the first requestAnimationFrame that animates, or -1. One-shot defers
// (a single call whose inline callback does not schedule itself again) are ignored.
function rafLoop(code) {
  const calls = [...code.matchAll(/requestAnimationFrame\s*\(/g)];
  if (!calls.length) return -1;
  if (calls.length >= 2) return calls[0].index;
  const open = calls[0].index + calls[0][0].length - 1;
  const end = balancedEnd(code, open);
  const arg = code.slice(open + 1, end < 0 ? code.length : end).trim();
  if (/^[A-Za-z_$][\w$]*$/.test(arg)) return calls[0].index; // rAF(tick): a named, re-armable callback
  const names = [...code.slice(0, calls[0].index).matchAll(/(?:\b(?:const|let|var|function)\s+|\.)([A-Za-z_$][\w$]*)\s*(?:=|\()/g)];
  const enclosing = names.length ? names[names.length - 1][1] : '';
  if (enclosing && new RegExp(`(?<![\\w$.])${enclosing}\\s*\\(`).test(arg)) return calls[0].index; // callback re-enters its function
  if (/\bwhile\s*\(/.test(code.slice(Math.max(0, calls[0].index - 200), calls[0].index))) return calls[0].index;
  return -1;
}

function scanFile({ path, text }) {
  const ext = extname(path).toLowerCase();
  if (!EXTS.has(ext)) return [];
  const code = maskComments(text, ext === '.css');
  const starts = [0];
  for (let i = 0; i < code.length; i++) if (code[i] === '\n') starts.push(i + 1);
  const lineOf = (idx) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= idx) lo = mid; else hi = mid - 1;
    }
    return lo + 1;
  };
  const out = [];
  const add = (idx, rule, match) => out.push({ path, line: lineOf(idx), rule, match: match.trim() });
  const each = (re, rule) => { re.lastIndex = 0; for (const m of code.matchAll(re)) add(m.index, rule, m[0]); };

  each(SCROLL_REVEAL, 'scroll-reveal');
  each(WHILE_IN_VIEW, 'while-in-view');
  each(TRANSITION_ALL, 'transition-all');

  // Tailwind v4 moves things with the CSS `translate`, `scale` and `rotate` properties:
  // a transition list that names only `transform` makes them snap. The moving class and
  // the transition list may sit in different literals of one className / cn( expression.
  const seen = new Set();
  const flag = (idx, list) => {
    if (seen.has(idx)) return;
    seen.add(idx);
    add(idx, 'transform-in-arbitrary-transition', list);
  };
  const LITERAL = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g;
  const MOVES = /(?:^|[\s"'`:])-?(?:translate|scale|rotate)-/;
  const LIST = /transition-\[[^\]]*\]|\[transition:[^\]]*\]/g;
  const scan = (from, to) => {
    const lits = [...code.slice(from, to).matchAll(LITERAL)].map((m) => ({ text: m[0], index: from + m.index }));
    if (!lits.some((l) => MOVES.test(l.text))) return;
    for (const l of lits) {
      for (const list of l.text.matchAll(LIST)) {
        if (/(?<![a-z-])transform(?![a-z-])/.test(list[0]) && !/translate|scale|rotate/.test(list[0])) flag(l.index + list.index, list[0]);
      }
    }
  };
  for (const lit of code.matchAll(LITERAL)) scan(lit.index, lit.index + lit[0].length);
  for (const op of code.matchAll(/\b(?:className|class)\s*=\s*\{|\b(?:cn|clsx|cva|twMerge|classNames)\s*\(/g)) {
    const open = op.index + op[0].length - 1;
    const end = balancedEnd(code, open);
    if (end > open) scan(open, end);
  }

  // Continuous motion with no reduced-motion handling in this file (the check is file-local).
  if (!REDUCED.test(code)) {
    const kf = /@keyframes\b/.exec(code);
    const raf = rafLoop(code);
    if (kf) add(kf.index, 'no-reduced-motion', '@keyframes');
    else if (raf >= 0) add(raf, 'no-reduced-motion', 'requestAnimationFrame');
  }
  return out;
}

export function checkMotion(files) {
  return files
    .flatMap(scanFile)
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : a.line - b.line || (a.rule < b.rule ? -1 : 1)));
}

// The text report: one line per finding, then the summary line.
export function formatFindings(findings, scanned) {
  let out = '';
  for (const f of findings) out += `${f.path}:${f.line}  ${f.rule}  ${f.match}\n`;
  const counts = {};
  for (const f of findings) counts[f.rule] = (counts[f.rule] ?? 0) + 1;
  const summary = Object.keys(counts).map((r) => `${r} ${counts[r]}`).join(', ');
  return out + `${findings.length} finding(s) in ${new Set(findings.map((f) => f.path)).size} file(s) (${scanned} scanned${summary ? `; ${summary}` : ''})\n`;
}

function collect(target, includeTests, acc) {
  let st;
  try { st = statSync(target); } catch { return; } // broken symlink or vanished file: skip
  if (st.isDirectory()) {
    for (const name of readdirSync(target).sort()) {
      if (SKIP_DIRS.has(name)) continue;
      collect(join(target, name), includeTests, acc);
    }
    return;
  }
  const base = target.split(sep).pop();
  if (!EXTS.has(extname(target).toLowerCase()) || st.size > MAX_BYTES) return;
  if (/\.min\.|\.d\.ts$/.test(base)) return;
  if (!includeTests && /\.(?:test|spec)\.[^.]+$/.test(base)) return;
  try { acc.push({ path: target, text: readFileSync(target, 'utf8') }); } catch { /* unreadable: skip */ }
}

function main(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const paths = argv.filter((a) => !a.startsWith('--'));
  const known = new Set(['--json', '--include-tests', '--help']);
  const bad = [...flags].filter((f) => !known.has(f));
  if (flags.has('--help')) {
    process.stdout.write('Usage: check-motion.mjs [--json] [--include-tests] <paths...>\n');
    return 0;
  }
  if (bad.length || !paths.length) {
    process.stderr.write('Usage: check-motion.mjs [--json] [--include-tests] <paths...>\n');
    return 2;
  }
  const files = [];
  for (const p of paths) {
    if (!existsSync(p)) { process.stderr.write(`No such path: ${p}\n`); return 2; }
    collect(p, flags.has('--include-tests'), files);
  }
  const findings = checkMotion(files);
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

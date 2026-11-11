#!/usr/bin/env node
// check-writing: flag AI-sounding prose tells in English and French (Markdown, MDX, text, JSON string values).
// Zero dependencies. Usage: node check-writing.mjs [--lang en|fr|auto] [--json] <files-or-dirs...>
// Exit: 0 clean, 1 findings, 2 usage error.
import { readFileSync, readdirSync, statSync, existsSync, realpathSync } from 'node:fs';
import { join, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.open-next', 'coverage']);
export const EXTS = new Set(['.md', '.mdx', '.txt', '.json']);
const MAX_BYTES = 2_000_000;

export const RULES = [
  'transition-opener', 'scene-setting', 'hedging', 'inflated', 'listing-words', 'cliche-conclusion',
  'buzzword-verb', 'em-dash', 'not-x-but-y', 'whether-you', 'chat-filler',
];

const AP = '[\'\u2019]';
const SP = '[ \\u00a0\\u202f]+';
const LEFT = '(?<![\\p{L}\\p{N}])';
const RIGHT = '(?![\\p{L}\\p{N}])';

// A phrase becomes a pattern: either apostrophe matches, any run of the three space characters matches.
const ph = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, AP).replace(/ /g, SP);
const words = (list) => new RegExp(`${LEFT}(?:${list.map(ph).join('|')})${RIGHT}`, 'giu');
const raw = (src) => new RegExp(`${LEFT}(?:${src})${RIGHT}`, 'giu');
const GAP = '[^.!?\\n]';

const PHRASES = {
  en: {
    'transition-opener': ["it is important to note", "it's important to note", "it is worth noting", "it's worth noting", 'needless to say', 'it should be noted'],
    'scene-setting': ["in today's fast-paced", "in today's digital age", 'with the advent of', 'in an ever-changing', 'in a world where'],
    hedging: ['research suggests', 'studies show', 'it could be argued', 'some might say', 'arguably'],
    inflated: ['absolutely essential', 'of vital importance', 'of paramount importance', 'plays a pivotal role', 'play a pivotal role', 'playing a pivotal role', 'game-changer', 'game changer', 'cutting-edge', 'cutting edge', 'a testament to', 'rich tapestry'],
    'cliche-conclusion': ['in summary', 'in conclusion', 'to sum up', 'moving forward', 'at the end of the day', 'all in all'],
    'buzzword-verb': ['leverage', 'leverages', 'leveraging', 'operationalize', 'operationalizes', 'operationalizing', 'utilize', 'utilizes', 'utilizing', 'empower', 'empowers', 'empowering', 'unlock', 'unlocks', 'unlocking', 'streamline', 'streamlines', 'streamlining', 'supercharge', 'supercharges', 'supercharging', 'elevate', 'elevates', 'elevating', 'harness', 'harnesses', 'harnessing', 'revolutionize', 'revolutionizes', 'revolutionizing', 'delve', 'delves', 'delving'],
    'chat-filler': ['i hope this helps', 'feel free to', "don't hesitate to", 'great question', "let's dive in"],
  },
  fr: {
    'transition-opener': ['il est important de noter', 'il convient de souligner', 'il est à noter', 'force est de constater'],
    'scene-setting': ['dans un monde en constante évolution', "à l'ère du numérique", "avec l'avènement de", 'de nos jours', "dans le monde d'aujourd'hui"],
    hedging: ['il semblerait que', 'on pourrait dire que', 'certains diront que', 'selon certaines études'],
    inflated: ['absolument essentiel', 'absolument essentielle', 'absolument essentiels', 'absolument essentielles', "d'une importance capitale", 'primordial', 'primordiale', 'primordiaux', 'primordiales', 'incontournable', 'incontournables', 'révolutionnaire', 'révolutionnaires', 'un rôle clé', 'technologie de pointe', 'solution de pointe', 'à la pointe'],
    'cliche-conclusion': ['en résumé', 'en conclusion', 'pour conclure', 'en somme', 'en définitive', 'au final'],
    'buzzword-verb': ['tirer parti', 'tirez parti', 'tirons parti', 'booster', 'boostez', 'boostons', 'impacter', 'impacté', 'impactée', 'impactés', 'impactées', 'dynamiser', 'dynamisez', 'propulser', 'propulsez', 'révolutionner', 'révolutionnez', 'sublimer', 'sublimez'],
    'chat-filler': ["n'hésitez pas à", "j'espère que cela vous aide", 'excellente question', 'plongeons', "au plaisir d'échanger", 'je serais ravi de'],
  },
};

const PATTERNS = {
  en: {
    ...Object.fromEntries(Object.entries(PHRASES.en).map(([r, l]) => [r, [words(l)]])),
    'not-x-but-y': [
      raw(`(?:it|this|that)(?:${AP}s|${SP}is)${SP}not${SP}${GAP}{1,80}?[,;]${SP}(?:it|this|that)(?:${AP}s|${SP}is)`),
      raw(`not${SP}just${SP}${GAP}{1,80}?,${SP}but`),
      raw(`(?:isn${AP}t|is${SP}not)${SP}about${SP}${GAP}{1,80}?[,;]${SP}(?:it|this|that)(?:${AP}s|${SP}is)${SP}about`),
    ],
    'whether-you': [raw(`whether${SP}you(?:${AP}re|${SP}are)${GAP}{1,80}?${SP}or`)],
  },
  fr: {
    ...Object.fromEntries(Object.entries(PHRASES.fr).map(([r, l]) => [r, [words(l)]])),
    'not-x-but-y': [
      raw(`ce${SP}n${AP}est${SP}pas${SP}${GAP}{1,80}?[,;]${SP}c${AP}est`),
      raw(`il${SP}ne${SP}s${AP}agit${SP}pas${SP}${GAP}{1,80}?[,;]${SP}mais${SP}(?:de|d${AP}|du|des)`),
    ],
    'whether-you': [raw(`que${SP}(?:vous${SP}soyez|tu${SP}sois)${GAP}{1,80}?${SP}ou`)],
  },
};

const LISTING = {
  always: { en: ['first and foremost'], fr: ['en premier lieu'] },
  starters: {
    en: ['firstly', 'additionally', 'furthermore', 'moreover'],
    fr: ["tout d'abord", 'de plus', 'en outre', 'par ailleurs'],
  },
};
const SENTENCE_START = '(?<=^|[.!?\u2026][ \\u00a0\\u202f]+|\\n[ \\t>*#-]*)';
const STARTER_RE = {
  en: new RegExp(`${SENTENCE_START}(?:${LISTING.starters.en.map(ph).join('|')})${RIGHT}`, 'giu'),
  fr: new RegExp(`${SENTENCE_START}(?:${LISTING.starters.fr.map(ph).join('|')})${RIGHT}`, 'giu'),
};
const ALWAYS_RE = { en: words(LISTING.always.en), fr: words(LISTING.always.fr) };
const STARTERS_NEEDED = 3;

const STOP = {
  en: new Set(['the', 'and', 'is', 'are', 'was', 'it', 'its', 'of', 'to', 'in', 'that', 'this', 'for', 'with', 'you', 'we', 'i', 'not', 'be', 'can', 'or', 'on', 'as', 'at', 'by', 'from', 'your', 'our', 'will', 'have', 'has', 'they', 'he', 'she', 'but', 'if', 'into', 'than', 'then', 'whether']),
  fr: new Set(['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'est', 'sont', 'en', 'dans', 'que', 'qui', 'pour', 'avec', 'vous', 'nous', 'je', 'il', 'elle', 'ils', 'ne', 'pas', 'ce', 'cette', 'ces', 'se', 'sur', 'au', 'aux', 'ou', 'mais', 'plus', 'par', 'votre', 'notre', 'cela', 'ça', 'tout', 'faut', 'être', 'sont', 'soyez', 'lisez', 'à', 'y', 'on', 'son', 'sa', 'ses', 'leur', 'leurs', 'nos', 'vos', 'mon', 'ma', 'mes', 'me', 'te', 'sans', 'sous', 'comme', 'donc', 'car', 'très', 'avez', 'avons', 'ai', 'suis', 'es']),
};

/** Guesses the language by counting stopwords. French only when it wins with at least two stopwords, so one borrowed word (a place name) does not flip English; otherwise English. */
export function detectLang(text) {
  let en = 0;
  let fr = 0;
  for (const m of text.toLowerCase().matchAll(/\p{L}+/gu)) {
    if (STOP.en.has(m[0])) en++;
    if (STOP.fr.has(m[0])) fr++;
  }
  return fr > en && fr >= 2 ? 'fr' : 'en';
}

function assertLang(lang) {
  if (lang !== undefined && !['auto', 'en', 'fr'].includes(lang)) throw new Error('lang must be auto, en or fr');
}

// Checks one stretch of text in one language. `offset` shifts indexes back to the whole text.
function checkIn(text, lang, offset) {
  const found = [];
  const add = (rule, re) => {
    for (const m of text.matchAll(re)) found.push({ index: offset + m.index, rule, match: m[0], lang });
  };
  for (const [rule, list] of Object.entries(PATTERNS[lang])) for (const re of list) add(rule, re);
  add('listing-words', ALWAYS_RE[lang]);
  const starters = [...text.matchAll(STARTER_RE[lang])];
  if (starters.length >= STARTERS_NEEDED) {
    for (const m of starters) found.push({ index: offset + m.index, rule: 'listing-words', match: m[0], lang });
  }
  for (const m of text.matchAll(/\u2014/g)) {
    // A French dialogue dash opens a line and is followed by a space.
    if (lang === 'fr') {
      const lineStart = text.lastIndexOf('\n', m.index - 1) + 1;
      if (text.slice(lineStart, m.index).trim() === '' && /^[ \u00a0\u202f]/.test(text.slice(m.index + 1))) continue;
    }
    found.push({ index: offset + m.index, rule: 'em-dash', match: m[0], lang });
  }
  return found;
}

/**
 * Lists the tells in one string. `index` is a UTF-16 offset. Sorted by index then rule.
 * With lang 'auto' (default) each paragraph (split on blank lines) is checked in its own detected language;
 * with 'en' or 'fr' the whole text uses that language.
 */
export function checkWriting(text, opts = {}) {
  assertLang(opts.lang);
  let found = [];
  if (opts.lang && opts.lang !== 'auto') {
    found = checkIn(text, opts.lang, 0);
  } else {
    let start = 0;
    const flush = (end) => {
      const part = text.slice(start, end);
      if (part.trim() !== '') found.push(...checkIn(part, detectLang(part), start));
    };
    for (const m of text.matchAll(/\r?\n(?:[ \t\f\v\u00a0]*\r?\n)+/g)) {
      flush(m.index);
      start = m.index + m[0].length;
    }
    flush(text.length);
  }
  return found.sort((a, b) => a.index - b.index || a.rule.localeCompare(b.rule));
}

const blank = (s) => s.replace(/[^\n]/g, ' ');

// Replaces fenced code, indented code and inline code spans with spaces, so indexes and lines hold.
// A fence closes only on the same character with at least the opening length and nothing after it.
function maskMarkdown(text) {
  let fence = null;
  return text
    .split('\n')
    .map((line) => {
      const f = line.replace(/\r$/, '').match(/^\s*(`{3,}|~{3,})(.*)$/);
      if (fence) {
        if (f && f[1][0] === fence[0] && f[1].length >= fence.length && f[2].trim() === '') fence = null;
        return blank(line);
      }
      if (f) { fence = f[1]; return blank(line); }
      if (/^(?: {4}|\t)/.test(line)) return blank(line);
      return line.replace(/(`+)[^`]*?\1/g, (span) => blank(span));
    })
    .join('\n');
}

// JSON string literals that are values (not keys).
function jsonValueLiterals(text) {
  const out = [];
  for (const m of text.matchAll(/"(?:[^"\\\n]|\\.)*"/g)) {
    if (/^\s*:/.test(text.slice(m.index + m[0].length))) continue;
    let value;
    try { value = JSON.parse(m[0]); } catch { continue; }
    out.push({ index: m.index, value });
  }
  return out;
}

const position = (text, index) => {
  const before = text.slice(0, index);
  return { line: before.split('\n').length, column: index - before.lastIndexOf('\n') };
};

/** Findings for one file: [{ path, line, column, rule, match, lang }]. */
export function scanText(text, path, opts = {}) {
  assertLang(opts.lang);
  const found = [];
  const ext = extname(path).toLowerCase();
  if (ext === '.json') {
    const literals = jsonValueLiterals(text);
    const lang = opts.lang && opts.lang !== 'auto' ? opts.lang : detectLang(literals.map((l) => l.value).join('\n'));
    for (const lit of literals) {
      const { line, column } = position(text, lit.index);
      for (const f of checkWriting(lit.value, { lang })) found.push({ path, line, column, rule: f.rule, match: f.match, lang: f.lang });
    }
    return found;
  }
  const body = ext === '.md' || ext === '.mdx' ? maskMarkdown(text) : text;
  for (const f of checkWriting(body, opts)) {
    found.push({ path, ...position(body, f.index), rule: f.rule, match: f.match, lang: f.lang });
  }
  return found;
}

/** Report lines, then a count. */
export function formatFindings(findings, scanned) {
  const lines = findings.map((f) => `${f.path}:${f.line}:${f.column} ${f.rule} ${JSON.stringify(f.match)}`);
  lines.push(`${findings.length} finding(s) in ${scanned} file(s)`);
  return lines.join('\n') + '\n';
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

const USAGE = 'Usage: check-writing.mjs [--lang en|fr|auto] [--json] <files-or-dirs...>\n';

function main(argv) {
  let lang = 'auto';
  let json = false;
  const paths = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help') { process.stdout.write(USAGE); return 0; }
    if (a === '--json') json = true;
    else if (a === '--lang') lang = argv[++i];
    else if (a.startsWith('--lang=')) lang = a.slice(7);
    else if (a.startsWith('--')) { process.stderr.write(USAGE); return 2; }
    else paths.push(a);
  }
  if (!['auto', 'en', 'fr'].includes(lang) || paths.length === 0 || paths.some((p) => !existsSync(p))) {
    process.stderr.write(USAGE);
    return 2;
  }
  const files = [];
  for (const p of paths) collectFiles(p, files);
  const findings = [];
  for (const file of files) {
    let text;
    try { text = readFileSync(file, 'utf8'); } catch {
      process.stderr.write(`check-writing: cannot read ${file}\n`);
      return 2;
    }
    findings.push(...scanText(text, file, { lang }));
  }
  process.stdout.write(json ? JSON.stringify(findings, null, 2) + '\n' : formatFindings(findings, files.length));
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

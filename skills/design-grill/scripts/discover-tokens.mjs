import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { findNearestPackageJson } from './detect-platform.mjs';

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'coverage',
  // Agent-tooling and build-tool directories: these hold worktrees, backups,
  // and caches of the project itself. Reading tokens out of a copy of the
  // project (e.g. `.claude/worktrees/<branch>/...`) is always wrong - it
  // reports stale/duplicate declarations under a misleading `declaredIn`.
  '.claude', '.svelte-kit', '.turbo', '.cache', '.output', '.vercel',
  'out', 'vendor', 'tmp', '__snapshots__',
]);
const CSS_EXT = /\.(css|scss)$/;
// A theme/tokens module. Broadened beyond the literal names theme/tokens/
// design-tokens: real React Native projects often declare their whole
// design system in a file named colors.ts or palette.ts, with no "theme"
// or "tokens" in the filename at all.
const THEME_FILE = /^(theme|tokens|design-tokens|designTokens|colors|palette)\.(js|mjs|ts|jsx|tsx)$/;
const TAILWIND_CONFIG = /^tailwind\.config\.(js|cjs|mjs|ts)$/;

// key -> bucket, checked at both `theme.<key>` and `theme.extend.<key>`.
const TAILWIND_KEYS = [
  ['colors', 'colors'],
  ['borderRadius', 'radii'],
  ['spacing', 'spacing'],
  ['fontSize', 'typography'],
];

// top-level key -> bucket for a theme/tokens module.
const THEME_MODULE_KEYS = [
  ['colors', 'colors'],
  ['spacing', 'spacing'],
  ['radii', 'radii'],
  ['typography', 'typography'],
];

// A hex colour (#abc / #aabbcc[aa]), an rgb()/rgba()/hsl()/hsla()/oklch()
// function, or a bare RGB triplet (three 0-255 integers separated by
// whitespace, e.g. a CSS custom property meant to be composed as
// `rgb(var(--text-muted) / <alpha>)`). Checked case-insensitively.
const HEX_COLOR = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_FUNCTION = /^(rgb|rgba|hsl|hsla|oklch)\(/i;
const RGB_TRIPLET = /^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/;

/** True if every component of a bare "R G B" triplet is a valid 0-255 byte. */
function isRgbTripletValue(value) {
  const m = RGB_TRIPLET.exec(value.trim());
  if (!m) return false;
  return m.slice(1, 4).every((n) => Number(n) <= 255);
}

/** True if `value`'s shape unambiguously identifies it as a colour. */
function isColorShapedValue(value) {
  const v = String(value).trim();
  return HEX_COLOR.test(v) || COLOR_FUNCTION.test(v) || isRgbTripletValue(v);
}

/**
 * Bucket a token into a category. Value shape is checked first - a hex
 * colour, an rgb()/rgba()/hsl()/hsla()/oklch() function, or a bare RGB
 * triplet is always a colour, regardless of what the name looks like (a CSS
 * variable named `--text-muted` whose value is `140 140 140` is a colour,
 * not typography, just because "text" is in its name). Only when the value
 * shape is inconclusive does the existing name-based heuristic decide.
 */
export function categorise(name, value) {
  if (value != null && isColorShapedValue(value)) return 'colors';
  const n = name.toLowerCase();
  if (/color|colour|bg|background|fg|foreground|surface|accent|primary|secondary/.test(n)) return 'colors';
  if (/radius|rounded/.test(n)) return 'radii';
  if (/space|spacing|gap|inset|margin|padding/.test(n)) return 'spacing';
  if (/font|text|leading|tracking|type/.test(n)) return 'typography';
  if (/duration|ease|easing|transition|animate|delay/.test(n)) return 'motion';
  return null;
}

function walk(dir, out = [], depth = 0) {
  if (depth > 6) return out;
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  // Sorted so which file "wins" a duplicate token name is deterministic
  // across platforms/filesystems, rather than an accident of whatever
  // order the OS happens to hand back directory entries in.
  for (const entry of [...entries].sort()) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let s;
    try { s = statSync(full); } catch { continue; }
    if (s.isDirectory()) walk(full, out, depth + 1);
    else out.push(full);
  }
  return out;
}

/** Strip `/* ... *\/` block comments so a `}` or `;` inside a comment can
 * never be mistaken for a real block/declaration boundary. */
function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Parse `:root { --name: value; }` blocks, and Tailwind v4 `@theme { ... }`
 * / `@theme inline { ... }` / `@theme static { ... }` blocks, out of CSS
 * text. A custom property declared in more than one such block (e.g. both
 * `:root` and `@theme`) is reported once - the first-encountered value
 * wins, consistent with how duplicate declarations across files are
 * resolved elsewhere in this module. */
export function parseCssVars(css) {
  const found = [];
  const seen = new Set();
  const clean = stripCssComments(css);
  const blocks = clean.match(/(?::root|@theme(?:\s+(?:inline|static))?)\s*\{[^}]*\}/g) || [];
  for (const block of blocks) {
    // Slice off the enclosing braces first (rather than matching up to a
    // trailing `;`) so a final declaration with no trailing semicolon still
    // parses to a clean value instead of swallowing the closing `}`.
    const body = block.slice(block.indexOf('{') + 1, block.lastIndexOf('}'));
    for (const rawDecl of body.split(';')) {
      const decl = rawDecl.trim();
      if (!decl.startsWith('--')) continue;
      const idx = decl.indexOf(':');
      if (idx === -1) continue;
      const name = decl.slice(0, idx).trim();
      const value = decl.slice(idx + 1).trim();
      if (!name || !value) continue;
      if (seen.has(name)) continue;
      seen.add(name);
      found.push({ name, value });
    }
  }
  return found;
}

/**
 * Returns a copy of `src`, same length, with the interior of string
 * literals and the body of comments replaced by spaces (newlines kept, so
 * later line-oriented reasoning doesn't shift). Every structural scan below
 * (locating a key, counting brace depth) runs against this mask, so a
 * comment or a string value can never be mistaken for real object
 * structure. Actual content is always sliced back out of `src` at the
 * indices the mask locates - the mask itself never supplies content.
 */
function maskNonStructural(src) {
  const mask = new Array(src.length);
  const n = src.length;
  let i = 0;
  while (i < n) {
    const c = src[i];
    const d = i + 1 < n ? src[i + 1] : '';
    if (c === '/' && d === '/') {
      while (i < n && src[i] !== '\n') { mask[i] = ' '; i++; }
      continue;
    }
    if (c === '/' && d === '*') {
      mask[i] = ' '; mask[i + 1] = ' '; i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        mask[i] = src[i] === '\n' ? '\n' : ' ';
        i++;
      }
      if (i < n) { mask[i] = ' '; mask[i + 1] = ' '; i += 2; }
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      mask[i] = ' '; i++;
      while (i < n && src[i] !== quote) {
        if (src[i] === '\\' && i + 1 < n) {
          mask[i] = ' '; mask[i + 1] = ' '; i += 2;
          continue;
        }
        mask[i] = src[i] === '\n' ? '\n' : ' ';
        i++;
      }
      if (i < n) { mask[i] = ' '; i++; }
      continue;
    }
    mask[i] = c;
    i++;
  }
  return mask.join('');
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Find the first occurrence of `key:` anywhere in masked[from, to),
 * regardless of nesting depth, and return its brace block. Used only for
 * the first (outermost) path segment, where there is no enclosing scope
 * to be scoped to yet. */
function findKeyAnywhere(masked, key, from, to) {
  const re = new RegExp(`(?<![\\w$])${escapeRegExp(key)}\\s*:`, 'g');
  re.lastIndex = from;
  let m;
  while ((m = re.exec(masked))) {
    if (m.index >= to) return null;
    const colonIdx = m.index + m[0].length - 1;
    const open = masked.indexOf('{', colonIdx);
    if (open === -1 || open >= to) continue;
    let depth = 0, end = -1;
    for (let i = open; i < to; i++) {
      if (masked[i] === '{') depth++;
      else if (masked[i] === '}' && --depth === 0) { end = i; break; }
    }
    if (end === -1) continue;
    return { open, close: end };
  }
  return null;
}

/** Find `key:` as a direct child of the scope masked[from, to) - i.e. at
 * brace depth 0 relative to that scope - and return its brace block. Depth
 * scoping is what lets `theme.colors` (a direct child of `theme`) and
 * `theme.extend.colors` (nested one level deeper, under `extend`) resolve
 * to different blocks instead of whichever `colors:` text appears first. */
function findChildKeyBlock(masked, key, from, to) {
  const keyRe = new RegExp(`^${escapeRegExp(key)}\\s*:`);
  let depth = 0;
  for (let i = from; i < to; i++) {
    const c = masked[i];
    if (c === '{') { depth++; continue; }
    if (c === '}') { depth--; continue; }
    if (depth === 0 && /[\w$]/.test(c) && (i === from || !/[\w$]/.test(masked[i - 1]))) {
      const m = keyRe.exec(masked.slice(i, to));
      if (m) {
        const colonIdx = i + m[0].length - 1;
        const open = masked.indexOf('{', colonIdx);
        if (open !== -1 && open < to) {
          let d = 0, end = -1;
          for (let j = open; j < to; j++) {
            if (masked[j] === '{') d++;
            else if (masked[j] === '}' && --d === 0) { end = j; break; }
          }
          if (end !== -1) return { open, close: end };
        }
      }
    }
  }
  return null;
}

/** Advance past whitespace, commas, and comments, starting at `i`. Reads
 * `src` directly (not the mask) so it can tell a real comment apart from a
 * quoted key/value that happens to sit at this position - both look like
 * blank runs in the mask, but only one of them should be skipped. */
function skipInsignificant(src, i, to) {
  while (i < to) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === ',') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') {
      while (i < to && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < to && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i = Math.min(i + 2, to);
      continue;
    }
    break;
  }
  return i;
}

/** Read a quoted literal (key or value) starting at `src[start]` (the
 * opening quote). Returns the unquoted content and the index just past the
 * closing quote. Backslash-escaped characters are skipped, not unescaped -
 * same simplicity tradeoff the previous implementation made. */
function readQuoted(src, start) {
  const quote = src[start];
  let i = start + 1;
  while (i < src.length && src[i] !== quote) {
    if (src[i] === '\\' && i + 1 < src.length) i += 2;
    else i++;
  }
  const content = src.slice(start + 1, Math.min(i, src.length));
  const end = i < src.length ? i + 1 : i;
  return { content, end };
}

/** Read a bareword key (identifier, or a numeric Tailwind scale step like
 * `50` or `100`) starting at `start`. Returns null if `start` isn't one. */
function readBareword(src, start, to) {
  const m = /^[\w$-]+/.exec(src.slice(start, to));
  return m ? { content: m[0], end: start + m[0].length } : null;
}

/**
 * Walk a masked object-literal body (already brace-delimited to [from, to))
 * and extract every leaf `key: 'value'` pair, recursing into nested object
 * literals. A nested key is qualified with its parent's name - `chart: { 1:
 * ... }` yields `chart.1`, not the meaningless bare `1` - except a key
 * literally named `DEFAULT`, which takes its parent's name outright
 * (Tailwind's convention: `border: { DEFAULT: ... }` is the `border` token
 * itself, not `border.DEFAULT`). A flat top-level key is left unqualified.
 *
 * Non-string values (arrays, numbers, function calls, template literals)
 * aren't understood as tokens and are skipped, matching the previous
 * implementation's behaviour - only string-literal leaves are collected.
 */
function extractLeafPairs(masked, src, from, to, prefix) {
  const pairs = [];
  let i = skipInsignificant(src, from, to);

  while (i < to) {
    let key;
    if (src[i] === "'" || src[i] === '"' || src[i] === '`') {
      const r = readQuoted(src, i);
      key = r.content;
      i = r.end;
    } else {
      const r = readBareword(src, i, to);
      if (!r) break; // not a key we can parse safely; stop rather than guess
      key = r.content;
      i = r.end;
    }

    i = skipInsignificant(src, i, to);
    if (src[i] !== ':') break; // malformed relative to what we understand
    i = skipInsignificant(src, i + 1, to);

    const qualified = key === 'DEFAULT' ? prefix || key : prefix ? `${prefix}.${key}` : key;

    if (i < to && (src[i] === "'" || src[i] === '"' || src[i] === '`')) {
      const r = readQuoted(src, i);
      pairs.push({ name: qualified, value: r.content });
      i = skipInsignificant(src, r.end, to);
    } else if (i < to && src[i] === '{') {
      let depth = 0, end = -1;
      for (let k = i; k < to; k++) {
        if (masked[k] === '{') depth++;
        else if (masked[k] === '}' && --depth === 0) { end = k; break; }
      }
      if (end === -1) break;
      pairs.push(...extractLeafPairs(masked, src, i + 1, end, qualified));
      i = skipInsignificant(src, end + 1, to);
    } else {
      // Unsupported value shape - skip to the next top-level comma (brace/
      // bracket/paren-depth aware) so one unrecognised entry can't corrupt
      // the rest of the scan.
      let depth = 0, k = i;
      while (k < to) {
        const c = masked[k];
        if (c === '{' || c === '[' || c === '(') depth++;
        else if (c === '}' || c === ']' || c === ')') {
          if (depth === 0) break;
          depth--;
        } else if (c === ',' && depth === 0) break;
        k++;
      }
      i = skipInsignificant(src, k, to);
    }
  }

  return pairs;
}

/**
 * Extract literal `key: 'value'` pairs from a dotted path into a JS object
 * literal, e.g. `parseObjectLiteralAt(src, 'theme.extend.colors')`.
 * Text-based on purpose: the grill must never execute a target's code.
 *
 * Each path segment resolves within the brace block found for the previous
 * segment, so `theme.colors` and `theme.extend.colors` are distinguishable
 * even though both contain the substring "colors:". Comments and string
 * contents are masked out before any structural scan, so neither can be
 * mistaken for real object keys, colons, or braces.
 */
export function parseObjectLiteralAt(src, dottedPath) {
  const masked = maskNonStructural(src);
  const [firstKey, ...rest] = dottedPath.split('.');

  let block = findKeyAnywhere(masked, firstKey, 0, masked.length);
  if (!block) return [];
  let from = block.open + 1;
  let to = block.close;

  for (const key of rest) {
    block = findChildKeyBlock(masked, key, from, to);
    if (!block) return [];
    from = block.open + 1;
    to = block.close;
  }

  return extractLeafPairs(masked, src, from, to, '');
}

const EXPORT_OBJECT_LITERAL = /\bexport\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=;{}]*)?=\s*\{/g;

/** Brace-nesting depth of `masked` immediately before `index`, counting
 * only `{`/`}` (never `[`/`(`) - enough to tell whether a declaration sits
 * at module top level or is nested inside some other block. */
function braceDepthBefore(masked, index) {
  let depth = 0;
  for (let i = 0; i < index; i++) {
    if (masked[i] === '{') depth++;
    else if (masked[i] === '}') depth--;
  }
  return depth;
}

/**
 * Find every top-level `export const NAME = { ... }` (or `let`/`var`)
 * object-literal declaration in a module - never one nested inside a
 * function body or another object literal - and harvest its leaf
 * `key: 'value'` pairs via {@link extractLeafPairs}.
 *
 * Deliberately narrow so a file that "merely mentions" tokens can't
 * produce garbage: the initializer must be a `{` immediately after `=`, so
 * an arrow function (`= () => {`), a function expression/declaration
 * (`= function () {` / `export function colors() {`), or any other
 * non-object-literal export is silently skipped rather than guessed at.
 * Text-only, like the rest of this module - the source is never executed.
 */
export function harvestExportedObjectLiterals(src) {
  const masked = maskNonStructural(src);
  const results = [];
  EXPORT_OBJECT_LITERAL.lastIndex = 0;
  let m;
  while ((m = EXPORT_OBJECT_LITERAL.exec(masked))) {
    if (braceDepthBefore(masked, m.index) !== 0) continue; // not module top level
    const name = m[1];
    const open = m.index + m[0].length - 1; // index of the matched '{'
    let depth = 0, end = -1;
    for (let i = open; i < masked.length; i++) {
      if (masked[i] === '{') depth++;
      else if (masked[i] === '}' && --depth === 0) { end = i; break; }
    }
    if (end === -1) continue;
    results.push({ name, pairs: extractLeafPairs(masked, src, open + 1, end, '') });
  }
  return results;
}

/**
 * Discover the design tokens a project declares about itself.
 * Returns an empty set rather than guessing when nothing is found.
 */
export function discoverTokens(targetPath) {
  const empty = { colors: [], spacing: [], radii: [], typography: [], motion: [], sources: [], empty: true };

  const pkgPath = findNearestPackageJson(targetPath);
  if (!pkgPath) return empty;
  const root = dirname(pkgPath);

  const set = { colors: [], spacing: [], radii: [], typography: [], motion: [], sources: [], empty: true };
  const seen = new Set();

  const add = (bucket, name, value, file) => {
    if (!bucket || value == null) return;
    const fileKey = relative(root, file) || file;
    // Record the source before the dedupe check below: a file whose every
    // token happens to duplicate a name already seen from an earlier file
    // still contributed a real declaration, and must still show up in
    // provenance - only the token *value* is deduplicated, not the file's
    // presence in `sources`.
    // Record the source before the dedupe check below: a file whose every
    // token happens to duplicate a name already seen from an earlier file
    // still contributed a real declaration, and must still show up in
    // provenance - only the token *value* is deduplicated, not the file's
    // presence in `sources`.
    if (!set.sources.includes(fileKey)) set.sources.push(fileKey);
    const dedupeKey = `${bucket}::${name}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    set[bucket].push({ name, value: String(value), declaredIn: fileKey });
  };

  for (const file of walk(root)) {
    const base = file.split('/').pop();

    if (CSS_EXT.test(file)) {
      let css;
      try { css = readFileSync(file, 'utf8'); } catch { continue; }
      for (const { name, value } of parseCssVars(css)) add(categorise(name, value), name, value, file);
      continue;
    }

    if (TAILWIND_CONFIG.test(base)) {
      let src;
      try { src = readFileSync(file, 'utf8'); } catch { continue; }
      for (const [key, bucket] of TAILWIND_KEYS) {
        // Both a full override (`theme.<key>`) and an extension
        // (`theme.extend.<key>`) are real, independent declarations -
        // extend does not replace the base theme, so both are merged.
        for (const { name, value } of parseObjectLiteralAt(src, `theme.${key}`)) add(bucket, name, value, file);
        for (const { name, value } of parseObjectLiteralAt(src, `theme.extend.${key}`)) add(bucket, name, value, file);
      }
      continue;
    }

    if (THEME_FILE.test(base)) {
      let src;
      try { src = readFileSync(file, 'utf8'); } catch { continue; }
      for (const [key, bucket] of THEME_MODULE_KEYS) {
        for (const { name, value } of parseObjectLiteralAt(src, key)) add(bucket, name, value, file);
      }
      // A theme-module file isn't always shaped as `theme.colors = {...}` -
      // a file named colors.ts may equally export `const palette = {...}`
      // or any other identifier. Harvest every top-level exported object
      // literal and let categorise() route each leaf by value shape (a hex
      // value lands in colors regardless of what the object is named).
      for (const { pairs } of harvestExportedObjectLiterals(src)) {
        for (const { name, value } of pairs) add(categorise(name, value), name, value, file);
      }
    }
  }

  set.empty = set.sources.length === 0;
  return set.empty ? empty : set;
}

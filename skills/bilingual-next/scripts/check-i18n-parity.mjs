#!/usr/bin/env node
// check-i18n-parity: compare two message JSON trees (for example messages/fr.json and messages/en.json).
// Zero dependencies. Usage: node check-i18n-parity.mjs <a.json> <b.json> [--json]
// Paths: object keys dotted, array indexes bracketed ("faq.items[2].q"). A key that itself contains a dot
// is ambiguous with nesting. null counts as a leaf (a value), like strings, numbers and booleans.
// Leaves are never compared by type: only object, array and leaf are told apart.
// Exit: 0 same shape, 1 differences, 2 usage error, missing file or invalid JSON.
import { readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const kind = (v) => (Array.isArray(v) ? 'array' : v !== null && typeof v === 'object' ? 'object' : 'leaf');
const childPath = (prefix, key, isIndex) => (isIndex ? `${prefix}[${key}]` : prefix ? `${prefix}.${key}` : String(key));

// Paths are dotted for object keys and bracketed for array indexes: "faq.items[2].q".
export function parity(a, b) {
  const out = { missingInB: [], missingInA: [], typeMismatch: [], emptyInB: [], emptyInA: [] };
  const walk = (x, y, prefix) => {
    const kx = kind(x);
    const ky = kind(y);
    if (kx !== ky) { out.typeMismatch.push(prefix); return; }
    if (kx === 'leaf') {
      const blank = (v) => typeof v === 'string' && !v.trim();
      if (typeof x === 'string' && typeof y === 'string') {
        if (blank(y) && !blank(x)) out.emptyInB.push(prefix);
        if (blank(x) && !blank(y)) out.emptyInA.push(prefix);
      }
      return;
    }
    const isIndex = kx === 'array';
    const keysX = isIndex ? x.map((_, i) => i) : Object.keys(x);
    const keysY = isIndex ? y.map((_, i) => i) : Object.keys(y);
    const inY = new Set(keysY);
    const inX = new Set(keysX);
    for (const k of keysX) {
      if (!inY.has(k)) out.missingInB.push(childPath(prefix, k, isIndex));
      else walk(x[k], y[k], childPath(prefix, k, isIndex));
    }
    for (const k of keysY) if (!inX.has(k)) out.missingInA.push(childPath(prefix, k, isIndex));
  };
  walk(a, b, '');
  return out;
}

const LABELS = {
  missingInB: (a, b) => `in ${a} but missing from ${b}`,
  missingInA: (a, b) => `in ${b} but missing from ${a}`,
  typeMismatch: () => 'object, array and text mixed up',
  emptyInB: (a, b) => `filled in ${a} but empty in ${b}`,
  emptyInA: (a, b) => `filled in ${b} but empty in ${a}`,
};

function load(file) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { throw new Error(`Cannot read ${file}`); }
  let data;
  try { data = JSON.parse(text); } catch (e) { throw new Error(`Invalid JSON in ${file}: ${e.message}`); }
  if (kind(data) === 'leaf') throw new Error(`${file} must hold a JSON object or array`);
  return data;
}

function main(argv) {
  const json = argv.includes('--json');
  const rest = argv.filter((a) => a !== '--json');
  const flag = rest.find((a) => a.startsWith('--'));
  if (flag || rest.length !== 2) {
    console.error(`${flag ? `Unknown option ${flag}. ` : ''}Usage: node check-i18n-parity.mjs <a.json> <b.json> [--json]`);
    return 2;
  }
  let a;
  let b;
  try { a = load(rest[0]); b = load(rest[1]); } catch (e) { console.error(e.message); return 2; }
  let result;
  try { result = parity(a, b); } catch (e) {
    if (e instanceof RangeError) { console.error('JSON nested too deeply to compare.'); return 2; }
    throw e;
  }
  const total = Object.values(result).reduce((n, l) => n + l.length, 0);
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (!total) {
    console.log(`OK ${rest[0]} and ${rest[1]} have identical shape.`);
  } else {
    for (const [key, list] of Object.entries(result)) {
      if (!list.length) continue;
      console.log(`FIX ${list.length} ${LABELS[key](rest[0], rest[1])}:`);
      for (const p of list) console.log(`  ${p || '(root)'}`);
    }
  }
  return total ? 1 : 0;
}

// Compare real paths: skills are often installed as symlinks.
function isMainModule() {
  if (!process.argv[1]) return false;
  let resolved;
  try { resolved = realpathSync(process.argv[1]); } catch { resolved = process.argv[1]; }
  return import.meta.url === pathToFileURL(resolved).href;
}

if (isMainModule()) {
  try { process.exitCode = main(process.argv.slice(2)); } catch (e) { console.error(e instanceof RangeError ? 'JSON nested too deeply to compare.' : e.message); process.exitCode = 2; }
}

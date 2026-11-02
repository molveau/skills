#!/usr/bin/env node
// hook-check: an opt-in Claude Code PostToolUse hook. After an Edit, Write or MultiEdit it checks the one file
// named in tool_input.file_path: UI code with detect-tells, French message files with fr-typo. On findings it
// prints a short report to stderr and exits 2, which Claude Code hands back to the agent; otherwise it exits 0
// in silence. It never blocks on its own errors (bad input, a missing or unreadable file): those exit 0.
// Zero dependencies. Registered by hand in .claude/settings.json; the plugin does not register it.
import { readFileSync, statSync, realpathSync } from 'node:fs';
import { resolve, extname, basename, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { detectTells, isScannable } from './detect-tells.mjs';

const CODE = new Set(['.tsx', '.jsx', '.ts', '.js', '.css', '.html', '.vue', '.svelte']);
const MAX_BYTES = 1_000_000;
const SHOWN = 15;

// French messages: fr.json, *.fr.json, fr/*.json, *.fr.md.
export function isFrench(path) {
  const name = basename(path).toLowerCase();
  if (name === 'fr.json' || name.endsWith('.fr.json') || name.endsWith('.fr.md')) return true;
  return name.endsWith('.json') && basename(dirname(path)).toLowerCase() === 'fr';
}

// fr-typo lives in the french-typography skill, which may not be installed next to this one: load it only
// for a French file, and skip the check when it is absent.
async function loadFrTypo() {
  try {
    return await import('../../french-typography/scripts/fr-typo.mjs');
  } catch {
    return null;
  }
}

// Findings for one file as report lines, or [] when there is nothing to say.
export async function check(path, text) {
  const ext = extname(path).toLowerCase();
  if (CODE.has(ext)) {
    // detect-tells reads .vue and .svelte single-file components as HTML.
    const scanned = ext === '.vue' || ext === '.svelte' ? `${path}.html` : path;
    if (!isScannable(scanned, text.length, false)) return [];
    return detectTells([{ path: scanned, text }]).map((f) => `${path}:${f.line}  #${f.tell} ${f.label}  ${f.match}`);
  }
  if (isFrench(path)) {
    const fr = await loadFrTypo();
    if (!fr) return [];
    return fr.scanText(path, text).map((f) => {
      const where = f.column ? `${f.line}:${f.column}` : `${f.line}`;
      const shown = JSON.stringify(fr.visible(f.match));
      return `${path}:${where}  ${f.rule}  ${shown}`;
    });
  }
  return [];
}

function report(path, lines) {
  const kind = isFrench(path) ? 'French typography (fr-typo)' : 'anti-slop tells (detect-tells)';
  const shown = lines.slice(0, SHOWN);
  const more = lines.length - shown.length;
  return [
    `${lines.length} finding(s), ${kind}:`,
    ...shown,
    ...(more > 0 ? [`... and ${more} more`] : []),
    'Fix them, or say why one is intended. The anti-slop and french-typography skills explain each rule.',
  ].join('\n') + '\n';
}

async function run(input) {
  let filePath;
  try {
    filePath = JSON.parse(input)?.tool_input?.file_path;
  } catch {
    return 0;
  }
  if (typeof filePath !== 'string' || !filePath) return 0;
  const ext = extname(filePath).toLowerCase();
  if (!CODE.has(ext) && !isFrench(filePath)) return 0;
  let text;
  try {
    const p = resolve(filePath);
    const st = statSync(p);
    if (!st.isFile() || st.size > MAX_BYTES) return 0;
    text = readFileSync(p, 'utf8');
  } catch {
    return 0;
  }
  let lines;
  try {
    lines = await check(filePath, text);
  } catch {
    return 0;
  }
  if (!lines.length) return 0;
  process.stderr.write(report(filePath, lines));
  return 2;
}

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
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    run(input).then((code) => { process.exitCode = code; }, () => { process.exitCode = 0; });
  });
  process.stdin.on('error', () => { process.exitCode = 0; });
}

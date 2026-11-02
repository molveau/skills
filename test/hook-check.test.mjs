// The opt-in PostToolUse hook: exit 2 with a short stderr report on findings, exit 0 silently otherwise,
// and never block on its own errors.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HOOK = join(ROOT, 'skills', 'anti-slop', 'scripts', 'hook-check.mjs');
const EM = String.fromCharCode(0x2014);
const GRADIENT = '.hero { background: linear-gradient(90deg, #7c3aed, #ec4899); }\n';

const run = (stdin) => spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8' });
const hookInput = (file_path, tool_name = 'Write') =>
  JSON.stringify({ session_id: 's', hook_event_name: 'PostToolUse', tool_name, tool_input: { file_path, content: 'ignored' }, tool_response: {} });
function file(rel, text) {
  const d = mkdtempSync(join(tmpdir(), 'hook-'));
  const p = join(d, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
  return p;
}

for (const ext of ['tsx', 'jsx', 'ts', 'js', 'css', 'html', 'vue', 'svelte']) {
  test(`a .${ext} file with a tell exits 2 and reports it on stderr`, () => {
    const text = ext === 'css' ? GRADIENT : `<p class="x">Fast ${EM} and seamless</p>\n`;
    const p = file(`src/view.${ext}`, text);
    const r = run(hookInput(p, 'Edit'));
    assert.equal(r.status, 2, r.stderr);
    assert.equal(r.stdout, '');
    assert.ok(r.stderr.includes(p), 'names the file');
    assert.match(r.stderr, ext === 'css' ? /#1 / : /#16 Em dash in copy/);
    assert.match(r.stderr, /finding\(s\)/);
  });
}

test('a clean code file exits 0 silently', () => {
  const r = run(hookInput(file('src/ok.tsx', 'export const A = () => <p>Plain words.</p>;\n')));
  assert.equal(r.status, 0);
  assert.equal(r.stderr, '');
  assert.equal(r.stdout, '');
});

test('test files are skipped, as the detect-tells CLI does', () => {
  const r = run(hookInput(file('src/view.test.tsx', `<p>a ${EM} b</p>\n`)));
  assert.equal(r.status, 0, r.stderr);
});

for (const rel of ['messages/fr.json', 'messages/app.fr.json', 'locales/fr/common.json', 'content/about.fr.md']) {
  test(`French file ${rel} with a spacing problem exits 2 with fr-typo findings`, () => {
    const text = rel.endsWith('.md') ? 'Bonjour : le prix est de 1 900 $.\n' : '{ "title": "Bonjour : le monde" }\n';
    const p = file(rel, text);
    const r = run(hookInput(p));
    assert.equal(r.status, 2, r.stderr);
    assert.ok(r.stderr.includes(p));
    assert.match(r.stderr, /high-punct/);
  });
}

test('a clean French file exits 0 silently', () => {
  const r = run(hookInput(file('messages/fr.json', '{ "title": "Bonjour le monde" }\n')));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stderr, '');
});

test('other JSON and Markdown files are not checked', () => {
  for (const rel of ['messages/en.json', 'docs/notes.md', 'messages/fra.json']) {
    const r = run(hookInput(file(rel, `{ "title": "Hello : world ${EM} yes" }\n`)));
    assert.equal(r.status, 0, `${rel}: ${r.stderr}`);
  }
});

test('other kinds of file are ignored', () => {
  const r = run(hookInput(file('tool.py', `print("a ${EM} b")\n`)));
  assert.equal(r.status, 0);
  assert.equal(r.stderr, '');
});

test('never blocks on its own errors: bad JSON, no file_path, missing or unreadable file, a folder', () => {
  const d = mkdtempSync(join(tmpdir(), 'hook-'));
  const locked = file('src/locked.tsx', `<p>a ${EM} b</p>\n`);
  chmodSync(locked, 0o000);
  for (const input of [
    '{not json',
    '',
    JSON.stringify({ tool_input: {} }),
    JSON.stringify({ tool_input: { file_path: 42 } }),
    JSON.stringify({ file_path: join(d, 'x.tsx') }),
    hookInput(join(d, 'missing.tsx')),
    hookInput(join(d)),
    process.getuid?.() === 0 ? hookInput(join(d, 'missing.tsx')) : hookInput(locked),
  ]) {
    const r = run(input);
    assert.equal(r.status, 0, `${input}: ${r.stderr}`);
    assert.equal(r.stderr, '');
  }
});

test('a long report is cut short', () => {
  const lines = Array.from({ length: 40 }, (_, i) => `<p>line ${i} ${EM} more</p>`).join('\n');
  const r = run(hookInput(file('src/many.tsx', lines)));
  assert.equal(r.status, 2);
  assert.ok(r.stderr.split('\n').length < 30, r.stderr);
  assert.match(r.stderr, /and 2\d more/);
});

test('with anti-slop installed alone, French files are skipped and code is still checked', async () => {
  const { copyFileSync } = await import('node:fs');
  const d = mkdtempSync(join(tmpdir(), 'hook-alone-'));
  mkdirSync(join(d, 'anti-slop', 'scripts'), { recursive: true });
  for (const f of ['hook-check.mjs', 'detect-tells.mjs']) copyFileSync(join(ROOT, 'skills', 'anti-slop', 'scripts', f), join(d, 'anti-slop', 'scripts', f));
  const alone = join(d, 'anti-slop', 'scripts', 'hook-check.mjs');
  const go = (stdin) => spawnSync(process.execPath, [alone], { input: stdin, encoding: 'utf8' });
  const fr = go(hookInput(file('messages/fr.json', '{ "title": "Bonjour : le monde" }\n')));
  assert.equal(fr.status, 0, fr.stderr);
  assert.equal(fr.stderr, '');
  const code = go(hookInput(file('src/a.css', GRADIENT)));
  assert.equal(code.status, 2, code.stderr);
});

// The plugin's userConfig.check_on_edit reaches the hook as CLAUDE_PLUGIN_OPTION_CHECK_ON_EDIT, the value
// turned into a string ("true" or "false"). Only "false" turns the check off.
test('the off switch: check_on_edit false exits 0 at once, other values still check', () => {
  const p = file('src/off.tsx', `<p>a ${EM} b</p>\n`);
  const withOption = (value) => {
    const env = { ...process.env };
    delete env.CLAUDE_PLUGIN_OPTION_CHECK_ON_EDIT;
    if (value !== undefined) env.CLAUDE_PLUGIN_OPTION_CHECK_ON_EDIT = value;
    return spawnSync(process.execPath, [HOOK], { input: hookInput(p), encoding: 'utf8', env });
  };
  const off = withOption('false');
  assert.equal(off.status, 0, off.stderr);
  assert.equal(off.stderr, '');
  assert.equal(off.stdout, '');
  for (const value of [undefined, 'true', '']) {
    const r = withOption(value);
    assert.equal(r.status, 2, `${value}: ${r.stderr}`);
    assert.match(r.stderr, /#16 Em dash in copy/);
  }
});

test('the off switch skips even unreadable input', () => {
  const env = { ...process.env, CLAUDE_PLUGIN_OPTION_CHECK_ON_EDIT: 'false' };
  const r = spawnSync(process.execPath, [HOOK], { input: '{not json', encoding: 'utf8', env });
  assert.equal(r.status, 0);
  assert.equal(r.stderr, '');
});

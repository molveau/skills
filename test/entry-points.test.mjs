// Every CLI must run when reached through a symlink (the skills CLI installs skills as symlinks), and the
// folder scanners must survive a broken symlink while walking.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (script, args, cwd) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', cwd });

const SKILL_SCRIPTS = [
  ['anti-slop', 'detect-tells.mjs'],
  ['motion', 'check-motion.mjs'],
  ['french-typography', 'fr-typo.mjs'],
];

for (const [skill, script] of SKILL_SCRIPTS) {
  test(`${script} runs through a symlinked skill folder and a symlinked file`, () => {
    const d = mkdtempSync(join(tmpdir(), 'entry-'));
    symlinkSync(join(ROOT, 'skills', skill), join(d, skill));
    symlinkSync(join(ROOT, 'skills', skill, 'scripts', script), join(d, script));
    for (const path of [join(d, skill, 'scripts', script), join(d, script)]) {
      const r = run(path, ['--help']);
      assert.equal(r.status, 0, r.stderr);
      assert.match(r.stdout, /Usage/, `no output through ${path}`);
    }
  });
}

test('detect-tells reports a known finding through a symlink, exit 1', () => {
  const d = mkdtempSync(join(tmpdir(), 'entry-'));
  symlinkSync(join(ROOT, 'skills', 'anti-slop'), join(d, 'anti-slop'));
  writeFileSync(join(d, 'hero.css'), '.hero { background: linear-gradient(90deg, #7c3aed, #ec4899); }\n');
  const r = run(join(d, 'anti-slop', 'scripts', 'detect-tells.mjs'), [join(d, 'hero.css')]);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /finding\(s\)/);
});

const REPO_SCRIPTS = [
  ['stats.mjs', ['not a repo!']],
  ['sync-sources.mjs', ['--bogus']],
  ['upstream-issue.mjs', []],
];

for (const [script, args] of REPO_SCRIPTS) {
  test(`scripts/${script} runs through a symlink (usage error, exit 2)`, () => {
    const d = mkdtempSync(join(tmpdir(), 'entry-'));
    symlinkSync(join(ROOT, 'scripts'), join(d, 'scripts'));
    symlinkSync(join(ROOT, 'scripts', script), join(d, script));
    for (const path of [join(d, 'scripts', script), join(d, script)]) {
      const r = run(path, args, d);
      assert.equal(r.status, 2, `${path}: ${r.stdout}${r.stderr}`);
      assert.match(r.stderr, /usage/i);
    }
  });
}

function withBrokenLink(file, text) {
  const d = mkdtempSync(join(tmpdir(), 'broken-'));
  mkdirSync(join(d, 'src'));
  writeFileSync(join(d, 'src', file), text);
  symlinkSync(join(d, 'nowhere' + file.slice(file.lastIndexOf('.'))), join(d, 'src', 'dangling' + file.slice(file.lastIndexOf('.'))));
  return join(d, 'src');
}

test('detect-tells skips a broken symlink inside a folder, exit 0 on clean input', () => {
  const src = withBrokenLink('clean.css', '.card { padding: 16px; }\n');
  const r = run(join(ROOT, 'skills', 'anti-slop', 'scripts', 'detect-tells.mjs'), [src]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /0 finding\(s\)/);
});

test('fr-typo skips a broken symlink inside a folder, exit 0 on clean input', () => {
  const src = withBrokenLink('clean.md', 'Bonjour le monde.\n');
  const r = run(join(ROOT, 'skills', 'french-typography', 'scripts', 'fr-typo.mjs'), ['--check', src]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /1 file\(s\) scanned/);
});

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { symlinkSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { syncSource, checkSource, renderThirdParty, bumpSources, renderSourceMd } from '../scripts/sync-sources.mjs';

const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const put = (base, p, text) => {
  mkdirSync(join(base, p, '..'), { recursive: true });
  writeFileSync(join(base, p), text);
};
function listAll(dir, base = dir) {
  const out = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...listAll(p, base));
    else out.push(relative(base, p).split(sep).join('/'));
  }
  return out.sort();
}

let upstream, commit1;
before(() => {
  upstream = mkdtempSync(join(tmpdir(), 'fixture-upstream-'));
  git(upstream, 'init', '-q', '-b', 'main');
  git(upstream, 'config', 'user.email', 't@example.com');
  git(upstream, 'config', 'user.name', 'T');
  put(upstream, 'LICENSE', 'MIT root license');
  put(upstream, 'NOTICE.md', 'notice text');
  put(upstream, 'skills/foo/SKILL.md', '---\nname: foo\n---\nfoo body');
  put(upstream, 'skills/foo/references/a.md', 'a');
  put(upstream, 'skills/foo/references/refs/big.webp', 'BIGIMAGE');
  put(upstream, 'skills/foo/agents/openai.yaml', 'x: 1');
  put(upstream, 'skills/bar/SKILL.md', 'bar body');
  put(upstream, 'kit/index.ts', 'export {}');
  put(upstream, 'kit/brands/logo.svg', '<svg/>');
  put(upstream, 'assets/app-icons.ts', 'artwork');
  put(upstream, 'sub/LICENSE', 'sub license');
  git(upstream, 'add', '-A');
  git(upstream, 'commit', '-qm', 'one');
  commit1 = git(upstream, 'rev-parse', 'HEAD');
});

function fixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), 'fixture-root-'));
  put(root, 'skills/d/SKILL.md', 'molveau router');
  put(root, 'skills/d/references/tells.md', 'molveau written');
  return root;
}
const baseSource = (over = {}) => ({
  id: 'fx',
  repo: 'owner/fx',
  url: upstream,
  commit: commit1,
  license: 'MIT',
  author: 'Fixture Author',
  goesInto: 'd',
  into: 'skills/d/references/vendor/fx',
  take: [
    { from: 'skills/foo', to: 'foo', skill: true },
    { from: 'kit', to: 'kit' },
  ],
  exclude: ['kit/brands/**', 'assets/app-icons.ts', '**/*.webp', '**/agents/**'],
  ...over,
});

test('copies take paths at the pinned commit and renames SKILL.md to <skill>.md', async () => {
  const root = fixtureRoot();
  await syncSource(baseSource(), { root });
  const files = listAll(join(root, 'skills/d/references/vendor/fx'));
  assert.ok(files.includes('foo.md'));
  assert.ok(files.includes('foo/references/a.md'));
  assert.ok(files.includes('kit/index.ts'));
  assert.ok(!files.some((f) => f.endsWith('SKILL.md')), 'no SKILL.md may remain');
  assert.equal(readFileSync(join(root, 'skills/d/references/vendor/fx/foo.md'), 'utf8'), '---\nname: foo\n---\nfoo body');
});

test('honours exclude globs', async () => {
  const root = fixtureRoot();
  await syncSource(baseSource(), { root });
  const files = listAll(join(root, 'skills/d/references/vendor/fx'));
  assert.ok(!files.some((f) => f.includes('brands')));
  assert.ok(!files.some((f) => f.endsWith('.webp')));
  assert.ok(!files.some((f) => f.includes('agents')));
});

test('writes LICENSE, NOTICE and SOURCE.md', async () => {
  const root = fixtureRoot();
  await syncSource(baseSource(), { root });
  const dir = join(root, 'skills/d/references/vendor/fx');
  assert.equal(readFileSync(join(dir, 'LICENSE'), 'utf8'), 'MIT root license');
  assert.ok(existsSync(join(dir, 'NOTICE.md')));
  const src = readFileSync(join(dir, 'SOURCE.md'), 'utf8');
  assert.ok(src.includes('owner/fx'));
  assert.ok(src.includes(commit1));
  assert.ok(src.includes('MIT'));
  assert.ok(/copied verbatim/i.test(src));
  assert.ok(src.includes('kit/brands/**'), 'SOURCE.md lists exclusions');
});

test('licenseFrom reads the license from a subfolder', async () => {
  const root = fixtureRoot();
  await syncSource(baseSource({ licenseFrom: 'sub' }), { root });
  assert.equal(readFileSync(join(root, 'skills/d/references/vendor/fx/LICENSE'), 'utf8'), 'sub license');
});

test('never writes outside into and leaves sibling Molveau files intact', async () => {
  const root = fixtureRoot();
  const before = listAll(join(root, 'skills/d')).filter((f) => !f.includes('vendor/'));
  const { written } = await syncSource(baseSource(), { root });
  assert.ok(written.every((p) => p.startsWith('skills/d/references/vendor/fx/')), written.join(','));
  const after = listAll(join(root, 'skills/d')).filter((f) => !f.includes('vendor/'));
  assert.deepEqual(after, before);
  assert.equal(readFileSync(join(root, 'skills/d/references/tells.md'), 'utf8'), 'molveau written');
  assert.equal(readFileSync(join(root, 'skills/d/SKILL.md'), 'utf8'), 'molveau router');
});

test('rejects a take destination that escapes into', async () => {
  const root = fixtureRoot();
  await assert.rejects(
    syncSource(baseSource({ take: [{ from: 'kit', to: '../../escape' }] }), { root }),
    /outside/,
  );
});

test('rejects an into folder that is not under references/vendor', async () => {
  const root = fixtureRoot();
  await assert.rejects(syncSource(baseSource({ into: 'skills/d/references' }), { root }), /vendor/);
  assert.equal(readFileSync(join(root, 'skills/d/references/tells.md'), 'utf8'), 'molveau written');
});

test('fails when a take path does not exist upstream', async () => {
  const root = fixtureRoot();
  await assert.rejects(syncSource(baseSource({ take: [{ from: 'nope', to: 'nope' }] }), { root }), /nope/);
});

test('a re-sync drops files that disappeared from the take list', async () => {
  const root = fixtureRoot();
  await syncSource(baseSource(), { root });
  await syncSource(baseSource({ take: [{ from: 'kit', to: 'kit' }] }), { root });
  const files = listAll(join(root, 'skills/d/references/vendor/fx'));
  assert.ok(!files.includes('foo.md'));
});

test('checkSource reports moved when upstream gets a new commit', async () => {
  const same = await checkSource(baseSource());
  assert.equal(same.moved, false);
  put(upstream, 'skills/bar/SKILL.md', 'bar body 2');
  git(upstream, 'add', '-A');
  git(upstream, 'commit', '-qm', 'two');
  const latest = git(upstream, 'rev-parse', 'HEAD');
  const r = await checkSource(baseSource());
  assert.equal(r.moved, true);
  assert.equal(r.pinned, commit1);
  assert.equal(r.latest, latest);
  const injected = await checkSource(baseSource(), { lsRemote: async () => commit1 });
  assert.equal(injected.moved, false);
});

test('checkSource never reports a frozen source as moved', async () => {
  const r = await checkSource(baseSource({ frozen: true }), { lsRemote: async () => 'f'.repeat(40) });
  assert.equal(r.moved, false);
});

test('renderThirdParty lists every source with author, license and short commit', () => {
  const md = renderThirdParty([
    baseSource(),
    baseSource({ id: 'two', repo: 'o/two', license: 'CC-BY-4.0', author: 'Two Author', commit: 'b'.repeat(40) }),
  ]);
  assert.ok(md.includes('Fixture Author'));
  assert.ok(md.includes('https://github.com/owner/fx'));
  assert.ok(md.includes(commit1.slice(0, 7)));
  assert.ok(md.includes('CC-BY-4.0'));
  assert.ok(md.includes('bbbbbbb'));
  assert.ok(!md.includes('—'));
});

test('skips symlinks and records them in SOURCE.md', async () => {
  const up = mkdtempSync(join(tmpdir(), 'fixture-sym-'));
  git(up, 'init', '-q', '-b', 'main');
  git(up, 'config', 'user.email', 't@example.com');
  git(up, 'config', 'user.name', 'T');
  put(up, 'LICENSE', 'lic');
  put(up, 'kit/real.ts', 'real');
  symlinkSync('/etc/hosts', join(up, 'kit/link.ts'));
  git(up, 'add', '-A');
  git(up, 'commit', '-qm', 's');
  const commit = git(up, 'rev-parse', 'HEAD');
  const root = fixtureRoot();
  await syncSource(baseSource({ url: up, commit, take: [{ from: 'kit', to: 'kit' }], exclude: [] }), { root });
  const dir = join(root, 'skills/d/references/vendor/fx');
  assert.deepEqual(listAll(dir).filter((f) => f.startsWith('kit/')), ['kit/real.ts']);
  const src = readFileSync(join(dir, 'SOURCE.md'), 'utf8');
  assert.ok(src.includes('kit/link.ts'));
  assert.ok(/symlink/i.test(src));
});

// An upstream that commits a symlinked folder must not get files from
// outside its clone copied into the vendor tree.
function symlinkedDirFixture() {
  const outside = mkdtempSync(join(tmpdir(), 'fixture-outside-'));
  put(outside, 'secret.txt', 'local secret');
  put(outside, 'LICENSE', 'not upstream license');
  const up = mkdtempSync(join(tmpdir(), 'fixture-symdir-'));
  git(up, 'init', '-q', '-b', 'main');
  git(up, 'config', 'user.email', 't@example.com');
  git(up, 'config', 'user.name', 'T');
  put(up, 'LICENSE', 'lic');
  mkdirSync(join(up, 'kit'), { recursive: true });
  symlinkSync(outside, join(up, 'kit/linked'));
  symlinkSync(outside, join(up, 'licdir'));
  git(up, 'add', '-A');
  git(up, 'commit', '-qm', 's');
  return { up, commit: git(up, 'rev-parse', 'HEAD') };
}

test('rejects a take whose path goes through a symlinked folder', async () => {
  const { up, commit } = symlinkedDirFixture();
  const root = fixtureRoot();
  await assert.rejects(
    syncSource(baseSource({ url: up, commit, take: [{ from: 'kit/linked/secret.txt', to: 'secret.txt' }], exclude: [] }), { root }),
    /outside the upstream checkout/,
  );
  assert.equal(existsSync(join(root, 'skills/d/references/vendor/fx/secret.txt')), false);
});

test('rejects a licenseFrom that resolves outside the checkout', async () => {
  const { up, commit } = symlinkedDirFixture();
  const root = fixtureRoot();
  for (const licenseFrom of ['licdir', '../..', '/etc']) {
    await assert.rejects(
      syncSource(baseSource({ url: up, commit, take: [{ from: 'LICENSE', to: 'x.txt' }], exclude: [], licenseFrom }), { root }),
      /outside the upstream checkout/,
      `licenseFrom ${licenseFrom}`,
    );
  }
});

test('a failed resync leaves the previous vendor folder intact and no temp dir behind', async () => {
  const root = fixtureRoot();
  await syncSource(baseSource(), { root });
  const dir = join(root, 'skills/d/references/vendor/fx');
  const before = listAll(dir);
  // Two takes that collide (file "x" vs folder "x/") make the copy fail midway.
  const bad = baseSource({
    take: [{ from: 'kit/index.ts', to: 'x' }, { from: 'skills/bar/SKILL.md', to: 'x/y.md' }],
    exclude: [],
  });
  await assert.rejects(syncSource(bad, { root }));
  assert.deepEqual(listAll(dir), before);
  assert.deepEqual(readdirSync(join(root, 'skills/d/references/vendor')), ['fx']);
});

test('bumpSources: frozen untouched, failed keeps old pin, successful gets the new commit', async () => {
  const mk = (id, extra = {}) => ({ id, commit: 'old', ...extra });
  const sources = [mk('frozen', { frozen: true }), mk('bad'), mk('good')];
  const synced = [];
  const { sources: out, report } = await bumpSources(sources, {
    lsRemote: async () => 'new',
    sync: async (s) => {
      if (s.id === 'bad') throw new Error('boom');
      synced.push(s.id);
      return { written: ['a'] };
    },
  });
  const by = Object.fromEntries(out.map((s) => [s.id, s.commit]));
  assert.deepEqual(by, { frozen: 'old', bad: 'old', good: 'new' });
  assert.deepEqual(synced, ['good']);
  assert.equal(sources[2].commit, 'old', 'input is not mutated');
  assert.ok(report.find((r) => r.id === 'bad').error);
  assert.equal(report.find((r) => r.id === 'frozen').skipped, 'frozen');
});

test('renderThirdParty prints a credit line from a per-source attribution', () => {
  const md = renderThirdParty([
    baseSource({
      attribution: {
        title: 'unslop',
        author: 'Damir Sokolovsky',
        source: 'https://github.com/heydamir/unslop',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        note: 'vendored copy unmodified; adapted in skills/anti-slop/SKILL.md',
      },
    }),
  ]);
  assert.ok(md.includes('"unslop" by Damir Sokolovsky'));
  assert.ok(md.includes('https://creativecommons.org/licenses/by/4.0/'));
  assert.ok(md.includes('vendored copy unmodified'));
});

test('renderThirdParty lists bundled third-party material from a per-source bundled field', () => {
  const md = renderThirdParty([
    baseSource({
      bundled: [
        { name: 'platform-design-skills', author: 'ehmo', source: 'https://github.com/ehmo/platform-design-skills', license: 'MIT', note: 'ios.md and android.md', notice: 'MIT License, Copyright (c) 2026' },
      ],
    }),
  ]);
  assert.ok(md.includes('## Bundled inside vendored sources'));
  assert.ok(md.includes('platform-design-skills'));
  assert.ok(md.includes('by ehmo'));
  assert.ok(md.includes('https://github.com/ehmo/platform-design-skills'));
  assert.ok(md.includes('MIT'));
  assert.ok(md.includes('ios.md and android.md'));
  assert.ok(md.includes('License notice: MIT License, Copyright (c) 2026'));
  assert.ok(!renderThirdParty([baseSource()]).includes('Bundled inside'));
});

test('renderSourceMd mentions renames and the skill layout only when they happened', () => {
  const skill = renderSourceMd(baseSource(), '2026-01-01T00:00:00Z');
  assert.ok(skill.includes('renamed to `<skill>.md`'));
  assert.ok(skill.includes('For a skill named `<skill>`'));

  const plain = renderSourceMd(baseSource({ take: [{ from: 'kit', to: 'kit' }] }), '2026-01-01T00:00:00Z');
  assert.ok(!plain.includes('<skill>'), 'no skill wording without a skill take');
  assert.ok(plain.includes('Files were only relocated.'));

  const one = renderSourceMd(baseSource({ take: [{ from: 'plugin/SKILL.md', to: 'impeccable.md' }, { from: 'plugin/ref/a.md', to: 'a.md' }] }), '2026-01-01T00:00:00Z');
  assert.ok(one.includes('renamed: `plugin/SKILL.md` to `impeccable.md`'));
  assert.ok(!one.includes('a.md` to'), 'same-name file is not listed as renamed');
});

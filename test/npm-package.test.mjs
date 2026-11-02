// @molveau/skills on npm: the MCP server and only what it reads at run time.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const SKILLS = readdirSync(join(ROOT, 'skills')).filter((n) => !n.startsWith('.') && statSync(join(ROOT, 'skills', n)).isDirectory());

let packed;
function pack() {
  if (packed) return packed;
  const r = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });
  assert.equal(r.status, 0, r.stderr);
  packed = JSON.parse(r.stdout)[0];
  return packed;
}
const paths = () => pack().files.map((f) => f.path);

test('package.json is publishable as @molveau/skills', () => {
  assert.equal(pkg.name, '@molveau/skills');
  assert.equal(pkg.private, undefined);
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.homepage, 'https://www.molveau.ca/skills');
  assert.ok(pkg.description?.length > 20);
  assert.ok(pkg.repository?.url?.includes('github.com/molveau/skills'));
  assert.ok(pkg.keywords.includes('mcp'));
  assert.deepEqual(pkg.bin, { 'molveau-skills-mcp': 'skills/.mcp/server.mjs' });
  assert.equal(pkg.engines.node, '>=20');
  assert.equal(pkg.publishConfig?.access, 'public', 'a scoped package is private on npm unless published public');
  assert.deepEqual(pkg.dependencies, undefined);
});

test('the tarball holds the server, the scripts it imports, every SKILL.md and playbook', () => {
  const got = new Set(paths());
  const must = [
    'package.json', 'README.md', 'LICENSE', 'THIRD_PARTY.md',
    'skills/.mcp/server.mjs', 'skills/.mcp/tools.mjs', 'skills/.claude-plugin/plugin.json',
    'skills/anti-slop/scripts/detect-tells.mjs', 'skills/anti-slop/scripts/story-contrast.mjs',
    'skills/french-typography/scripts/fr-typo.mjs', 'skills/motion/scripts/check-motion.mjs',
    ...SKILLS.map((s) => `skills/${s}/SKILL.md`),
    ...SKILLS.filter((s) => existsSync(join(ROOT, 'skills', s, 'references', 'playbook.md'))).map((s) => `skills/${s}/references/playbook.md`),
  ];
  for (const p of must) assert.ok(got.has(p), `${p} missing from the tarball`);
});

test('every relative import in the tarball resolves inside it', () => {
  const got = new Set(paths());
  for (const p of got) {
    if (!p.endsWith('.mjs')) continue;
    const src = readFileSync(join(ROOT, p), 'utf8');
    for (const m of src.matchAll(/(?:\bfrom\s+|\bimport\s*\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const target = posix.normalize(posix.join(posix.dirname(p), m[1]));
      assert.ok(got.has(target), `${p} imports ${m[1]}, not in the tarball`);
    }
  }
});

test('the tarball leaves out tests, examples, vendored copies and private files, and stays small', () => {
  for (const p of paths()) {
    assert.ok(!/^(test|examples|scripts|stats|\.superpowers|\.github|\.claude)\//.test(p), `${p} should not ship`);
    assert.ok(!p.includes('.banned.local'), p);
    assert.ok(!p.includes('/vendor/'), `${p}: vendored files stay in the repo and the plugin`);
    assert.ok(!/\.(png|jpe?g|mp4|webm|zip|tgz)$/i.test(p), `${p} is a binary`);
  }
  assert.ok(pack().unpackedSize < 1024 * 1024, `unpacked ${pack().unpackedSize} bytes`);
});

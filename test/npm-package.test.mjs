// @molveau/skills on npm: the MCP server and only what it reads at run time.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
// commands/, agents/ and hooks/ are plugin components beside the skills, not skills.
const SKILLS = readdirSync(join(ROOT, 'skills')).filter((n) => !n.startsWith('.') && !['commands', 'agents', 'hooks'].includes(n) && statSync(join(ROOT, 'skills', n)).isDirectory());

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
    'skills/french-typography/scripts/fr-typo.mjs', 'skills/motion/scripts/check-motion.mjs', 'skills/writing/scripts/check-writing.mjs',
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

test('the tarball leaves out the plugin-only commands, agents and hooks', () => {
  for (const p of paths()) assert.ok(!/^skills\/(commands|agents|hooks)\//.test(p), `${p} is for the plugin only`);
});

test('package.json exports the server and a side-effect-free core, and keeps the bin', () => {
  assert.deepEqual(pkg.exports, {
    '.': './skills/.mcp/server.mjs',
    './core': './skills/.mcp/core.mjs',
    './package.json': './package.json',
  });
  for (const target of Object.values(pkg.exports)) assert.ok(existsSync(join(ROOT, target)), `${target} missing`);
  assert.ok(paths().includes('skills/.mcp/core.mjs'), 'core.mjs missing from the tarball');
});

// Packs the real tarball, installs it into an empty project and imports @molveau/skills/core in a separate
// Node process, the way a Next.js route would, without spawning the server.
test('the packed tarball installs and @molveau/skills/core answers every method in remote mode', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'molveau-pack-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const packedRun = spawnSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', dir], { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });
  assert.equal(packedRun.status, 0, packedRun.stderr);
  const tarball = join(dir, JSON.parse(packedRun.stdout)[0].filename);
  const app = join(dir, 'app');
  mkdirSync(app);
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'app', private: true, type: 'module' }));
  const install = spawnSync('npm', ['install', tarball, '--offline', '--no-audit', '--no-fund', '--ignore-scripts'], { cwd: app, encoding: 'utf8', shell: process.platform === 'win32' });
  assert.equal(install.status, 0, install.stderr);

  const script = [
    "import { handleRpc, bundledFiles } from '@molveau/skills/core';",
    "import { existsSync } from 'node:fs';",
    "import { createRequire } from 'node:module';",
    "const o = { remote: true };",
    "const rpc = (id, method, params) => handleRpc({ jsonrpc: '2.0', id, method, params }, o);",
    "const callTool = (id, name, args) => rpc(id, 'tools/call', { name, arguments: args }).result;",
    "const init = rpc(1, 'initialize', { protocolVersion: '2025-06-18' }).result;",
    "const tools = rpc(2, 'tools/list').result.tools;",
    "const root = new URL('./node_modules/@molveau/skills/', import.meta.url);",
    "const out = {",
    "  server: init.serverInfo,",
    "  tools: tools.map((t) => t.name).sort(),",
    "  detectProps: Object.keys(tools.find((t) => t.name === 'detect_tells').inputSchema.properties).sort(),",
    "  detect: callTool(3, 'detect_tells', { code: '<p>a \\u2014 b</p>' }).structuredContent.count,",
    "  contrast: callTool(4, 'check_contrast', { foreground: '#000', background: '#fff' }).structuredContent.ratio,",
    "  fr: callTool(5, 'fr_typo', { text: 'Oui !' }).structuredContent.count,",
    "  motion: callTool(6, 'check_motion', { code: '.a { transition: all 1s; }', filename: 'a.css' }).structuredContent.count,",
    "  writing: callTool(9, 'check_writing', { text: 'In conclusion, it works.' }).structuredContent.count,",
    "  playbook: callTool(7, 'get_playbook', { skill: 'loi-25-website' }).content[0].text.includes('Law 25 audit of'),",
    "  promo: JSON.stringify(callTool(8, 'get_playbook', { skill: 'loi-25-website' })).includes('molveau.ca'),",
    "  notification: handleRpc({ jsonrpc: '2.0', method: 'notifications/initialized' }, o),",
    "  bundled: bundledFiles().every((f) => existsSync(new URL(f, root))),",
    "  exportsPkg: createRequire(import.meta.url)('@molveau/skills/package.json').name,",
    "};",
    "console.log(JSON.stringify(out));",
  ].join('\n');
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: app, encoding: 'utf8', timeout: 20_000 });
  assert.equal(r.status, 0, r.stderr);
  const got = JSON.parse(r.stdout);
  assert.deepEqual(got, {
    server: { name: 'molveau-skills', version: pkg.version },
    tools: ['check_contrast', 'check_motion', 'check_writing', 'detect_tells', 'fr_typo', 'get_playbook'],
    detectProps: ['code', 'filename'],
    detect: 1,
    contrast: '21:1',
    fr: 1,
    motion: 1,
    writing: 1,
    playbook: true,
    promo: false,
    notification: null,
    bundled: true,
    exportsPkg: '@molveau/skills',
  });
  console.log('packed-tarball smoke test: ' + r.stdout.trim());

  // The bin still starts the stdio server from the same install.
  const bin = join(app, 'node_modules', '.bin', 'molveau-skills-mcp');
  const init = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }) + '\n';
  const served = spawnSync(bin, [], { input: init, encoding: 'utf8', timeout: 10_000, shell: process.platform === 'win32' });
  assert.equal(served.status, 0, served.stderr);
  assert.deepEqual(JSON.parse(served.stdout.trim()).result.serverInfo, { name: 'molveau-skills', version: pkg.version });
});

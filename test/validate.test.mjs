import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../scripts/lib/frontmatter.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = join(ROOT, 'skills');
const SELF = join('test', 'validate.test.mjs'); // holds the banned list, so the scan skips it
const SKIP_DIRS = new Set(['.git', 'node_modules']);

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
const rel = (p) => relative(ROOT, p).split(sep).join('/');
const isText = (buf) => !buf.subarray(0, 8000).includes(0);

function skillDirs() {
  if (!existsSync(SKILLS)) return [];
  return readdirSync(SKILLS).filter((n) => !n.startsWith('.') && statSync(join(SKILLS, n)).isDirectory());
}
const readJson = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

test('top-level skills have SKILL.md with name = folder', () => {
  for (const d of skillDirs()) {
    const f = join(SKILLS, d, 'SKILL.md');
    assert.ok(existsSync(f), `skills/${d}/SKILL.md missing`);
    const { data } = parseFrontmatter(readFileSync(f, 'utf8'));
    assert.equal(data.name, d, `skills/${d}: name must equal folder`);
  }
});

test('descriptions 40-1024 chars', () => {
  for (const d of skillDirs()) {
    const { data } = parseFrontmatter(readFileSync(join(SKILLS, d, 'SKILL.md'), 'utf8'));
    const n = String(data.description ?? '').length;
    assert.ok(n >= 40 && n <= 1024, `skills/${d}: description is ${n} chars`);
  }
});

// Installers parse frontmatter with a strict YAML parser: an unquoted value
// containing ": " or " #", or starting with an indicator, is rejected there
// even though our lenient parser accepts it.
test('frontmatter plain values are strict-YAML safe', () => {
  for (const d of skillDirs()) {
    const text = readFileSync(join(SKILLS, d, 'SKILL.md'), 'utf8');
    const head = text.split(/^---$/m)[1] ?? '';
    for (const line of head.split('\n')) {
      const m = line.match(/^\s*[\w-]+:\s+(.+)$/);
      if (!m) continue;
      const v = m[1].trim();
      if (/^["'|>]/.test(v)) continue;
      assert.ok(!/: | #/.test(v), `skills/${d}: unquoted value contains ": " or " #": ${line.slice(0, 60)}`);
      assert.ok(!/^[-?:,\[\]{}&*!%@`]/.test(v), `skills/${d}: unquoted value starts with a YAML indicator`);
    }
  }
});

test('bodies ≤ 500 lines', () => {
  for (const d of skillDirs()) {
    const { body } = parseFrontmatter(readFileSync(join(SKILLS, d, 'SKILL.md'), 'utf8'));
    const n = body.split('\n').length;
    assert.ok(n <= 500, `skills/${d}: body is ${n} lines`);
  }
});

test('no SKILL.md below skills/<name>/', () => {
  const bad = walk(SKILLS)
    .map(rel)
    .filter((p) => /(^|\/)skill\.md$/i.test(p) && !/^skills\/[^/]+\/SKILL\.md$/.test(p));
  assert.deepEqual(bad, [], 'nested SKILL.md would install as extra skills; rename vendored ones to <skill>.md');
});

// Only backticked `references/...` paths count; prose may mention folders loosely.
function citedReferences(text) {
  const out = new Set();
  for (const m of text.matchAll(/`(references\/[^`\s]*[A-Za-z0-9_\/-])`/g)) out.add(m[1]);
  return [...out];
}

test('citedReferences only picks backticked paths', () => {
  const t = 'See the references/ folder and references/vendor/x.md in prose, but `references/a/b.md` and `references/c.md`.';
  assert.deepEqual(citedReferences(t), ['references/a/b.md', 'references/c.md']);
});

test('a missing backticked references/ path is detected', () => {
  const missing = citedReferences('read `references/nope/missing.md`').filter(
    (c) => !existsSync(join(SKILLS, '__no_such_skill__', c)),
  );
  assert.deepEqual(missing, ['references/nope/missing.md']);
});

test('every references/ path cited in a SKILL.md exists', () => {
  for (const d of skillDirs()) {
    const text = readFileSync(join(SKILLS, d, 'SKILL.md'), 'utf8');
    for (const c of citedReferences(text)) {
      assert.ok(existsSync(join(SKILLS, d, c)), `skills/${d}/SKILL.md cites missing ${c}`);
    }
  }
});

// Strip fenced blocks and inline code spans: an em dash inside code is allowed.
function stripCode(md) {
  return md.replace(/^(```|~~~)[\s\S]*?^\1[^\n]*$/gm, '').replace(/`[^`\n]*`/g, '');
}

test('no em dash outside code in non-vendor .md', () => {
  const dash = '—';
  for (const p of walk(ROOT)) {
    const r = rel(p);
    if (!r.endsWith('.md') || r.includes('/vendor/')) continue;
    stripCode(readFileSync(p, 'utf8')).split('\n').forEach((line, i) => {
      assert.ok(!line.includes(dash), `${r}:${i + 1} contains an em dash`);
    });
  }
});

// Generic patterns live here (this one file is excluded from the scan). Private terms (client names,
// personal data) are never committed: put them in a gitignored `.banned.local` (one per line) or in the
// BANNED_TERMS env var (comma-separated).
const GENERIC = [
  /\/Users\//, /\/private\/tmp/, /\bsk-[A-Za-z0-9_-]{20,}/, /\bghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/, /\bAKIA[0-9A-Z]{16}\b/, /-----BEGIN/,
];

function privateTerms() {
  const fromEnv = (process.env.BANNED_TERMS ?? '').split(',');
  const file = join(ROOT, '.banned.local');
  const fromFile = existsSync(file) ? readFileSync(file, 'utf8').split('\n') : [];
  return [...fromEnv, ...fromFile].map((t) => t.trim()).filter(Boolean);
}

function scanTexts() {
  const self = SELF.split(sep).join('/');
  return walk(ROOT).flatMap((p) => {
    const r = rel(p);
    if (r === self || r === '.banned.local') return [];
    const buf = readFileSync(p);
    return isText(buf) ? [[r, buf.toString('utf8')]] : [];
  });
}

test('no paths or secrets in any text file', () => {
  for (const [r, text] of scanTexts()) {
    for (const re of GENERIC) assert.ok(!re.test(text), `${r} matches ${re}`);
  }
});

test('no private term in any text file', (t) => {
  const terms = privateTerms();
  if (!terms.length) {
    t.skip('no private term list (.banned.local or BANNED_TERMS)');
    console.warn('WARNING: private-term scan skipped, no .banned.local or BANNED_TERMS');
    return;
  }
  for (const [r, text] of scanTexts()) {
    const low = text.toLowerCase();
    for (const b of terms) assert.ok(!low.includes(b.toLowerCase()), `${r} contains a private term`);
  }
});

test('every vendor folder has LICENSE and SOURCE.md', () => {
  for (const d of skillDirs()) {
    const vendor = join(SKILLS, d, 'references', 'vendor');
    if (!existsSync(vendor)) continue;
    for (const id of readdirSync(vendor).filter((n) => statSync(join(vendor, n)).isDirectory())) {
      const files = readdirSync(join(vendor, id));
      assert.ok(files.some((f) => /^licen[sc]e(\.|$)/i.test(f)), `vendor/${id}: LICENSE missing`);
      assert.ok(files.includes('SOURCE.md'), `vendor/${id}: SOURCE.md missing`);
    }
  }
});

// One Claude Code plugin with every skill: the Anthropic plugin directory requires .claude-plugin/plugin.json
// and refuses skills declared in a marketplace entry, and a root plugin.json conflicts with inline bundles.
// Bundles exist only as skills CLI commands (-s), listed in the README.
const BUNDLES = {
  design: ['anti-slop', 'ui', 'ux', 'motion', 'design-grill', 'design-inspiration-index'],
  quebec: ['french-typography', 'loi-25-website'],
  playbooks: ['saas', 'vitrine', 'workflow'],
};

// The plugin is the skills/ folder only, so tests, fixtures, the example video and the repo scripts stay
// out of what the Anthropic plugin directory screens (they caused its manual-review holds).
const PLUGIN = join(SKILLS, '.claude-plugin', 'plugin.json');

test('one plugin rooted at skills/: plugin.json, a valid icon, the marketplace points there once', () => {
  assert.ok(!existsSync(join(ROOT, '.claude-plugin', 'plugin.json')), 'the plugin manifest lives in skills/.claude-plugin/');
  const plugin = JSON.parse(readFileSync(PLUGIN, 'utf8'));
  assert.equal(plugin.name, 'molveau-skills');
  assert.equal(plugin.skills, './');
  const icon = join(SKILLS, plugin.icon);
  assert.ok(existsSync(icon), `icon ${plugin.icon} missing`);
  const png = readFileSync(icon);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  const [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)];
  assert.ok(w === h && w >= 512 && w <= 2048 && png.length < 2 * 1024 * 1024, `icon must be a square PNG 512-2048 px under 2 MB, got ${w}x${h}`);
  const plugins = readJson('.claude-plugin/marketplace.json').plugins;
  assert.equal(plugins.length, 1);
  assert.equal(plugins[0].name, 'molveau-skills');
  assert.equal(plugins[0].source, './skills');
  assert.equal(plugins[0].skills, undefined, 'skills belong in plugin.json, not in the marketplace entry');
});

test('the plugin stays small and ships no video or archive', () => {
  const files = walk(SKILLS);
  assert.ok(files.length < 480, `skills/ has ${files.length} files; the directory screens only the first 512`);
  for (const f of files) assert.ok(!/\.(mp4|mov|webm|zip|tgz|gz)$/i.test(f), `${rel(f)} is a binary the directory cannot read`);
  for (const f of files) assert.ok(statSync(f).size < 256 * 1024, `${rel(f)} is over 256 KB, which the directory only reads in part`);
});

test('every skill sits in exactly one bundle', () => {
  assert.deepEqual(Object.values(BUNDLES).flat().sort(), skillDirs().sort());
});

test('README shows the install command of every bundle and the plugin', () => {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  assert.ok(readme.includes('/plugin install molveau-skills@molveau'));
  for (const [name, skills] of Object.entries(BUNDLES)) {
    assert.ok(readme.includes('npx skills add molveau/skills ' + skills.map((d) => `-s ${d}`).join(' ')), `README lacks the skills CLI command for ${name}`);
  }
});

test('one version everywhere, with a changelog entry', () => {
  const version = readJson('package.json').version;
  assert.match(version, /^\d+\.\d+\.\d+$/);
  for (const p of readJson('.claude-plugin/marketplace.json').plugins) assert.equal(p.version, version, `${p.name}: version`);
  assert.equal(JSON.parse(readFileSync(PLUGIN, 'utf8')).version, version, 'plugin.json version');
  const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8');
  assert.match(changelog, new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\] - \\d{4}-\\d{2}-\\d{2}$`, 'm'), `CHANGELOG.md has no "## [${version}] - YYYY-MM-DD" entry`);
});

test('at least one skill', () => {
  assert.ok(skillDirs().length >= 1, 'skills/ has no skill yet');
});

// Each domain skill with vendored sources gets one synthesized references/playbook.md that credits
// every vendored source by its tag. Skills in PLAYBOOK_REQUIRED fail without one; the others are
// reported as todo until their playbook is written.
const PLAYBOOK_REQUIRED = new Set(['anti-slop', 'ui', 'motion', 'ux']);
const SOURCE_TAGS = {
  unslop: '[unslop]', taste: '[taste]', emil: '[Emil]', gsap: '[GSAP]', principles: '[12p]',
  lottie: '[Lottie]', stageshow: '[stageshow]', jakub: '[Jakub]', 'jakub-ux': '[Jakub]',
  feel: '[feel]', impeccable: '[Impeccable]', 'impeccable-ux': '[Impeccable]', a11y: '[ibelick]',
};

test('every source in sources.json has a playbook tag', () => {
  const missing = readJson('sources.json').sources.map((s) => s.id).filter((id) => !SOURCE_TAGS[id]);
  assert.deepEqual(missing, [], 'add a tag for each new source to SOURCE_TAGS');
});

test('skills with vendored sources have a playbook citing each source', async (t) => {
  const bySkill = new Map();
  for (const s of readJson('sources.json').sources) {
    const skill = s.into.split('/')[1];
    if (!existsSync(join(ROOT, s.into))) continue;
    bySkill.set(skill, [...(bySkill.get(skill) ?? []), s.id]);
  }
  for (const [skill, ids] of bySkill) {
    const f = join(SKILLS, skill, 'references', 'playbook.md');
    if (!existsSync(f) && PLAYBOOK_REQUIRED.has(skill)) {
      await t.test(`skills/${skill}/references/playbook.md exists`, () => {
        assert.fail(`skills/${skill} must have references/playbook.md`);
      });
      continue;
    }
    if (!existsSync(f)) {
      await t.test(`skills/${skill}/references/playbook.md`, { todo: 'playbook not written yet' }, () => {
        assert.fail('missing');
      });
      continue;
    }
    await t.test(`skills/${skill} playbook cites ${ids.join(', ')}`, () => {
      const text = readFileSync(f, 'utf8');
      for (const id of ids) assert.ok(text.includes(SOURCE_TAGS[id]), `playbook misses ${SOURCE_TAGS[id]} (${id})`);
    });
  }
});

// The A/B of 1 Nov 2026 loaded only the saas/vitrine router and never opened a reference file, so the
// direction step has to live inline in every skill that starts a build.
test('build skills carry the direction gate inline', () => {
  for (const d of ['ui', 'saas', 'vitrine', 'anti-slop']) {
    const body = readFileSync(join(SKILLS, d, 'SKILL.md'), 'utf8');
    assert.match(body, /^## Direction gate/m, `skills/${d}: no "## Direction gate" section`);
    for (const must of ['Character', 'World', 'Moments', 'Signature', 'Swap test', 'second-order', 'stone', 'drawn with care']) {
      assert.ok(body.includes(must), `skills/${d}: direction gate lacks "${must}"`);
    }
  }
});

test('ui and ux descriptions catch short, vague requests', () => {
  const desc = (d) => parseFrontmatter(readFileSync(join(SKILLS, d, 'SKILL.md'), 'utf8')).data.description;
  for (const w of ['hero', 'navbar', 'cards', 'pop', 'polish']) assert.ok(desc('ui').includes(w), `ui description lacks "${w}"`);
  for (const w of ['onboarding', 'signup']) assert.ok(desc('ux').includes(w), `ux description lacks "${w}"`);
});

test('npm test runs every test file and nothing under test/fixtures', () => {
  const script = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts.test;
  const patterns = script.replace(/^node --test\s*/, '').split(/\s+/).filter(Boolean);
  assert.ok(patterns.length, `"${script}" lets node --test pick files itself, fixtures included`);
  const matched = patterns.flatMap((p) => {
    const dir = dirname(p);
    const suffix = p.slice(dir.length + 2);
    assert.ok(p.startsWith(`${dir}/*`) && !dir.includes('*'), `unsupported pattern ${p}`);
    return readdirSync(join(ROOT, dir)).filter((n) => n.endsWith(suffix)).map((n) => join(dir, n));
  });
  const all = walk(join(ROOT, 'test')).map((p) => relative(ROOT, p)).filter((p) => p.endsWith('.test.mjs') && !p.includes(`fixtures${sep}`));
  assert.deepEqual([...matched].sort(), all.sort());
  assert.ok(!matched.some((p) => p.includes('fixtures')));
});

// The plugin starts the MCP server from skills/.mcp.json; the anti-slop hook stays opt-in, so the plugin
// registers no hooks of its own.
test('the plugin declares the MCP server and no hooks', () => {
  const mcp = JSON.parse(readFileSync(join(SKILLS, '.mcp.json'), 'utf8'));
  const server = mcp.mcpServers['molveau-skills'];
  assert.equal(server.command, 'node');
  assert.deepEqual(server.args, ['${CLAUDE_PLUGIN_ROOT}/.mcp/server.mjs']);
  assert.ok(existsSync(join(SKILLS, server.args[0].replace('${CLAUDE_PLUGIN_ROOT}/', ''))));
  assert.equal(server.env, undefined);
  assert.ok(!existsSync(join(SKILLS, 'hooks')), 'skills/hooks/ would register hooks for every user');
  const plugin = JSON.parse(readFileSync(PLUGIN, 'utf8'));
  assert.equal(plugin.hooks, undefined);
  assert.ok(statSync(join(SKILLS, '.mcp', 'server.mjs')).mode & 0o100, 'server.mjs must be executable for the npm bin');
  assert.match(readFileSync(join(SKILLS, '.mcp', 'server.mjs'), 'utf8'), /^#!\/usr\/bin\/env node\n/);
});

test('README documents the MCP server and the opt-in hook; anti-slop points to both', () => {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  for (const must of ['## MCP server', '## Opt-in hook', 'claude mcp add molveau-skills -- npx -y @molveau/skills', '"args": ["-y", "@molveau/skills"]', '"matcher": "Edit|Write|MultiEdit"', '.claude/skills/anti-slop/scripts/hook-check.mjs']) {
    assert.ok(readme.includes(must), `README lacks ${must}`);
  }
  for (const tool of ['detect_tells', 'check_contrast', 'fr_typo', 'check_motion', 'get_playbook']) assert.ok(readme.includes(`\`${tool}\``), `README lacks ${tool}`);
  const skill = readFileSync(join(SKILLS, 'anti-slop', 'SKILL.md'), 'utf8');
  assert.ok(skill.includes('detect_tells') && skill.includes('scripts/hook-check.mjs'), 'anti-slop SKILL.md should point to the MCP tools and the hook');
});

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

// Plugin component folders sit beside the skills in skills/ (the plugin root); they are not skills.
const COMPONENT_DIRS = new Set(['commands', 'agents', 'hooks']);
function skillDirs() {
  if (!existsSync(SKILLS)) return [];
  return readdirSync(SKILLS).filter((n) => !n.startsWith('.') && !COMPONENT_DIRS.has(n) && statSync(join(SKILLS, n)).isDirectory());
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
  design: ['anti-slop', 'ui', 'ux', 'motion', 'design-grill', 'design-inspiration-index', 'writing'],
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

test('plugin.json carries the directory listing links, each pointing at a real page', () => {
  const plugin = JSON.parse(readFileSync(PLUGIN, 'utf8'));
  const repoFile = (url) => url.replace('https://github.com/molveau/skills/blob/main/', '');
  for (const key of ['documentationUrl', 'supportUrl', 'privacyPolicyUrl', 'termsOfServiceUrl']) {
    assert.match(plugin[key] ?? '', /^https:\/\//, `${key} must be an https URL`);
  }
  for (const key of ['privacyPolicyUrl', 'termsOfServiceUrl']) {
    assert.ok(existsSync(join(ROOT, repoFile(plugin[key]))), `${key} points at a file missing from the repo`);
  }
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

// The plugin starts the MCP server from skills/.mcp.json and registers the anti-slop hook from the default
// skills/hooks/hooks.json, so plugin.json declares neither.
test('the plugin declares the MCP server and no hooks of its own in plugin.json', () => {
  const mcp = JSON.parse(readFileSync(join(SKILLS, '.mcp.json'), 'utf8'));
  const server = mcp.mcpServers['molveau-skills'];
  assert.equal(server.command, 'node');
  assert.deepEqual(server.args, ['${CLAUDE_PLUGIN_ROOT}/.mcp/server.mjs']);
  assert.ok(existsSync(join(SKILLS, server.args[0].replace('${CLAUDE_PLUGIN_ROOT}/', ''))));
  assert.equal(server.env, undefined);
  const plugin = JSON.parse(readFileSync(PLUGIN, 'utf8'));
  assert.equal(plugin.hooks, undefined, 'hooks load from skills/hooks/hooks.json');
  assert.equal(plugin.commands, undefined, 'commands load from skills/commands/');
  assert.equal(plugin.agents, undefined, 'agents load from skills/agents/');
  assert.ok(statSync(join(SKILLS, '.mcp', 'server.mjs')).mode & 0o100, 'server.mjs must be executable for the npm bin');
  assert.match(readFileSync(join(SKILLS, '.mcp', 'server.mjs'), 'utf8'), /^#!\/usr\/bin\/env node\n/);
});

test('README documents the MCP server and the hook; anti-slop points to both', () => {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  for (const must of ['## MCP server', '## Hook', '/config', 'Check edited files', 'claude mcp add molveau-skills -- npx -y @molveau/skills', '"args": ["-y", "@molveau/skills"]', '"matcher": "Edit|Write|MultiEdit"', '.claude/skills/anti-slop/scripts/hook-check.mjs']) {
    assert.ok(readme.includes(must), `README lacks ${must}`);
  }
  assert.ok(!readme.includes('## Opt-in hook'), 'the hook is on by default in the plugin now');
  for (const tool of ['detect_tells', 'check_contrast', 'fr_typo', 'check_motion', 'check_writing', 'get_playbook']) assert.ok(readme.includes(`\`${tool}\``), `README lacks ${tool}`);
  const skill = readFileSync(join(SKILLS, 'anti-slop', 'SKILL.md'), 'utf8');
  assert.ok(skill.includes('detect_tells') && skill.includes('scripts/hook-check.mjs'), 'anti-slop SKILL.md should point to the MCP tools and the hook');
  assert.ok(!skill.includes('opt-in Claude Code'), 'anti-slop SKILL.md still calls the hook opt-in');
});

test('skillDirs leaves out the plugin component folders', () => {
  for (const d of COMPONENT_DIRS) assert.ok(!skillDirs().includes(d), `${d} counted as a skill`);
  assert.equal(skillDirs().length, 12);
});

// Commands and agents: the Anthropic directory's screens read a dollar placeholder as an environment
// variable, so none appears; Claude Code appends the typed arguments when no placeholder takes them.
const COMMANDS = ['fr-check', 'loi-25-audit', 'story-video', 'unslop'];
const AGENTS = {
  'ui-reviewer': { tools: ['Read', 'Grep', 'Glob', 'Bash'], skills: ['ui', 'ux', 'anti-slop'] },
  'loi-25-auditor': { tools: ['Read', 'Grep', 'Glob'], skills: ['loi-25-website'] },
};
const PLACEHOLDER = /\$\{?[A-Za-z_][A-Za-z0-9_]*/;
const frontmatterLines = (text) => (text.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? '').split('\n');

function strictYamlSafe(file, text) {
  for (const line of frontmatterLines(text)) {
    const m = line.match(/^\s*[\w-]+:\s+(.+)$/);
    if (!m) continue;
    const v = m[1].trim();
    if (/^["'|>]/.test(v)) continue;
    assert.ok(!/: | #/.test(v), `${file}: unquoted value contains ": " or " #": ${line.slice(0, 60)}`);
    assert.ok(!/^[-?:,\[\]{}&*!%@`]/.test(v), `${file}: unquoted value starts with a YAML indicator: ${line.slice(0, 60)}`);
  }
}

test('the commands are exactly the four, each with a description, an argument hint and no placeholder', () => {
  const dir = join(SKILLS, 'commands');
  assert.deepEqual(readdirSync(dir).sort(), COMMANDS.map((c) => `${c}.md`));
  for (const c of COMMANDS) {
    const file = `skills/commands/${c}.md`;
    const text = readFileSync(join(dir, `${c}.md`), 'utf8');
    const { data, body } = parseFrontmatter(text);
    assert.ok(String(data.description ?? '').length >= 40, `${file}: description`);
    assert.ok(String(data['argument-hint'] ?? '').length > 0, `${file}: argument-hint`);
    assert.ok(body.trim().length > 200, `${file}: body`);
    assert.ok(!PLACEHOLDER.test(text), `${file} has a dollar placeholder: ${text.match(PLACEHOLDER)?.[0]}`);
    strictYamlSafe(file, text);
  }
});

test('each agent has valid frontmatter, a restricted tool list and preloads its skills', () => {
  const dir = join(SKILLS, 'agents');
  assert.deepEqual(readdirSync(dir).sort(), Object.keys(AGENTS).map((a) => `${a}.md`).sort());
  for (const [name, want] of Object.entries(AGENTS)) {
    const file = `skills/agents/${name}.md`;
    const text = readFileSync(join(dir, `${name}.md`), 'utf8');
    const { data, body } = parseFrontmatter(text);
    assert.equal(data.name, name, `${file}: name`);
    assert.ok(!data.name.includes(':'), `${file}: a colon is reserved for scoped names`);
    assert.ok(String(data.description ?? '').length >= 40, `${file}: description`);
    assert.deepEqual(String(data.tools ?? '').split(',').map((t) => t.trim()), want.tools, `${file}: tools`);
    assert.equal(data.model, 'inherit', `${file}: model`);
    for (const ignored of ['hooks', 'mcpServers', 'permissionMode']) assert.equal(data[ignored], undefined, `${file}: ${ignored} is ignored for plugin agents`);
    const lines = frontmatterLines(text);
    const at = lines.indexOf('skills:');
    assert.ok(at >= 0, `${file}: skills list`);
    const listed = [];
    for (const l of lines.slice(at + 1)) {
      const m = l.match(/^\s+-\s+(\S+)$/);
      if (!m) break;
      listed.push(m[1]);
    }
    assert.deepEqual(listed, want.skills.map((s) => `molveau-skills:${s}`), `${file}: skills`);
    for (const s of want.skills) {
      assert.ok(existsSync(join(SKILLS, s, 'SKILL.md')), `${file}: skill ${s} missing`);
      assert.ok(body.includes(`\`${s}\``), `${file}: body does not name the ${s} skill`);
    }
    assert.match(body, /read-only|do not edit/i, `${file}: says it is read-only`);
    assert.ok(!PLACEHOLDER.test(text), `${file} has a dollar placeholder`);
    strictYamlSafe(file, text);
  }
});

const HOOK_SCRIPT = 'anti-slop/scripts/hook-check.mjs';

test('hooks.json registers hook-check after edits, in exec form', () => {
  const file = join(SKILLS, 'hooks', 'hooks.json');
  const config = JSON.parse(readFileSync(file, 'utf8'));
  assert.deepEqual(Object.keys(config), ['hooks'], 'a plugin hooks file wraps the events in "hooks"');
  assert.deepEqual(Object.keys(config.hooks), ['PostToolUse']);
  const [entry, ...rest] = config.hooks.PostToolUse;
  assert.equal(rest.length, 0);
  assert.equal(entry.matcher, 'Edit|Write|MultiEdit');
  assert.equal(entry.hooks.length, 1);
  const [hook] = entry.hooks;
  assert.equal(hook.type, 'command');
  assert.equal(hook.command, 'node');
  assert.deepEqual(hook.args, ['${CLAUDE_PLUGIN_ROOT}/' + HOOK_SCRIPT]);
  assert.ok(existsSync(join(SKILLS, HOOK_SCRIPT)), `${HOOK_SCRIPT} missing`);
  const text = readFileSync(file, 'utf8');
  assert.deepEqual(text.match(/\$\{?[A-Za-z_]\w*\}?/g), ['${CLAUDE_PLUGIN_ROOT}'], 'hooks.json names no other variable');
});

test('userConfig.check_on_edit is a boolean on by default', () => {
  const plugin = JSON.parse(readFileSync(PLUGIN, 'utf8'));
  assert.deepEqual(Object.keys(plugin.userConfig ?? {}), ['check_on_edit']);
  assert.deepEqual(plugin.userConfig.check_on_edit, {
    type: 'boolean',
    title: 'Check edited files',
    description: 'After each edit, report AI-look tells in UI files and French spacing errors in French message files. Silent when the file is clean.',
    default: true,
  });
});

test('hook-check reads one environment value, the off switch, and no placeholder', () => {
  const src = readFileSync(join(SKILLS, HOOK_SCRIPT), 'utf8');
  assert.deepEqual(src.match(/process\.env\b[.\[]?\s*['"]?\w*/g), ['process.env.CLAUDE_PLUGIN_OPTION_CHECK_ON_EDIT']);
  assert.ok(!PLACEHOLDER.test(src), `hook-check.mjs has a dollar placeholder: ${src.match(PLACEHOLDER)?.[0]}`);
});

// The directory screens: in the component files, plugin.json and the anti-slop SKILL.md, no dollar
// placeholder, no shell words beside a URL, no network call.
test('component files stay clear of what the directory screens flag', () => {
  const files = [
    ...COMMANDS.map((c) => `commands/${c}.md`),
    ...Object.keys(AGENTS).map((a) => `agents/${a}.md`),
    'hooks/hooks.json', HOOK_SCRIPT, '.claude-plugin/plugin.json', 'anti-slop/SKILL.md',
  ];
  for (const f of files) {
    const text = readFileSync(join(SKILLS, f), 'utf8');
    const vars = (text.match(/\$\{?[A-Za-z_]\w*\}?/g) ?? []).filter((v) => !(f === 'hooks/hooks.json' && v === '${CLAUDE_PLUGIN_ROOT}'));
    assert.deepEqual(vars, [], `skills/${f}: dollar placeholders`);
    text.split('\n').forEach((line, i) => {
      if (/https?:\/\//.test(line)) assert.ok(!/\b(set|env|export|printenv)\b/i.test(line), `skills/${f}:${i + 1} has a shell word beside a URL`);
      assert.ok(!/\bpass\b\s*(?:[`'"=]|--|\w+=)/i.test(line), `skills/${f}:${i + 1}: "pass" followed by a value`);
      assert.ok(!/\b(TOKEN|SECRET|API_KEY)\b/.test(line), `skills/${f}:${i + 1} names a credential`);
    });
    if (f.startsWith('commands/') || f.startsWith('agents/')) assert.ok(!/https?:\/\//.test(text), `skills/${f}: no URL needed`);
    assert.ok(!/\bfetch\(|node:https?\b|node:net\b|XMLHttpRequest/.test(text), `skills/${f}: network call`);
  }
});

// One line of attribution per output, never more: the story video credit and the Law 25 report's last line.
test('the story video credit names molveau.ca/skills and keeps the unslop credit', () => {
  const story = readFileSync(join(SKILLS, 'anti-slop', 'scripts', 'story.mjs'), 'utf8');
  assert.match(story, /<div class="credit">molveau\.ca\/skills · unslop method by @heydamir<\/div>/);
});

test('the Law 25 report ends with one line pointing at the fixed-price package', () => {
  const skill = readFileSync(join(SKILLS, 'loi-25-website', 'SKILL.md'), 'utf8');
  const template = skill.slice(skill.indexOf('Law 25 audit of <site or repo>'));
  assert.equal(template.match(/molveau\.ca\/law-25/g)?.length, 1);
  for (const f of ['commands/loi-25-audit.md', 'agents/loi-25-auditor.md']) {
    assert.match(readFileSync(join(SKILLS, f), 'utf8'), /closing line/, `${f} must keep the report's closing line`);
  }
});

// Domain skills point at one playbook section, not the whole 400-line file.
const PLAYBOOK_SKILLS = ['ui', 'ux', 'motion', 'anti-slop'];

test('domain skills point at playbook sections, not the whole file', () => {
  for (const name of PLAYBOOK_SKILLS) {
    const text = readFileSync(join(SKILLS, name, 'SKILL.md'), 'utf8');
    assert.doesNotMatch(text, /Read `references\/playbook\.md` first/, `${name}: reads the whole playbook`);
    assert.match(text, /Do this first/, `${name}: names the "Do this first" block`);
  }
});

test('every playbook § cited in a SKILL.md exists', () => {
  const headings = (name) => {
    const text = readFileSync(join(SKILLS, name, 'references', 'playbook.md'), 'utf8');
    return new Set([...text.matchAll(/^## (\d+)\./gm)].map((m) => m[1]));
  };
  // "playbook §2", "`ui` playbook §3, §5", "playbook §3 to §14"
  // Also "`motion` §9": a skill name in backticks, then the section, with or without "playbook".
  const cited = /(?:`(ui|ux|motion|anti-slop)` (?:playbook )?|(?:`([\w-]+)` )?playbook )((?:§\d+(?:, | and | to )?)+)/g;
  for (const name of PLAYBOOK_SKILLS) {
    const text = readFileSync(join(SKILLS, name, 'SKILL.md'), 'utf8');
    const refs = [];
    for (const line of text.split('\n')) {
      for (const m of line.matchAll(cited)) {
        for (const n of m[3].matchAll(/§(\d+)/g)) refs.push([m[1] || m[2] || name, n[1]]);
      }
      // Rows of the "What to read" table carry a bare §N for this skill's own playbook.
      if (line.startsWith('|')) {
        for (const n of line.replace(cited, '').matchAll(/§(\d+)/g)) refs.push([name, n[1]]);
      }
    }
    assert.ok(refs.length > 0, `${name}: cites no playbook section`);
    for (const [owner, n] of refs) {
      assert.ok(headings(owner).has(n), `${name}: cites ${owner} playbook §${n}, which has no "## ${n}." heading`);
    }
  }
});

// Rows that point at a vendor file with no matching playbook section (matched by exact first cell).
const NO_SECTION_ROWS = new Set([
  'Finished reference screens (images)', // pictures only, no playbook section
  'The dated tells registry by wave', // upstream registry, the playbook has the 20 tells
  "The study behind taste's numbers", // research background
  'The philosophy and the invisible details of polish', // philosophy, not a rule
]);

test('every table row that cites a vendor file also names a playbook section', () => {
  for (const name of PLAYBOOK_SKILLS) {
    const text = readFileSync(join(SKILLS, name, 'SKILL.md'), 'utf8');
    const rows = text.split('\n').filter((l) => l.startsWith('| ') && l.includes('references/vendor/'));
    assert.ok(rows.length > 0, `${name}: no table rows with vendor files`);
    for (const row of rows) {
      const first = row.split('|')[1].trim();
      if (NO_SECTION_ROWS.has(first)) continue;
      assert.match(row, /§\d+/, `${name}: row "${first}" names no playbook section`);
    }
  }
});

test('vendored skills keep credits in references/vendor/README.md', () => {
  for (const name of ['ui', 'ux', 'motion', 'anti-slop']) {
    const dir = join(SKILLS, name);
    const readme = join(dir, 'references', 'vendor', 'README.md');
    assert.ok(existsSync(readme), `${name}: references/vendor/README.md missing`);
    assert.ok(readFileSync(readme, 'utf8').includes('Credits and licenses'), `${name}: README has no "Credits and licenses"`);
    const body = readFileSync(join(dir, 'SKILL.md'), 'utf8');
    assert.ok(body.includes('references/vendor/README.md'), `${name}: SKILL.md does not cite references/vendor/README.md`);
    assert.doesNotMatch(body, /^## (Credits|Notes on the vendored files)/m, `${name}: credits block still in SKILL.md`);
    assert.ok(!body.includes('Keep this credit'), `${name}: "Keep this credit" still in SKILL.md`);
  }
});

test('ui routes the start of a SaaS or a showcase site to saas and vitrine', () => {
  const body = readFileSync(join(SKILLS, 'ui', 'SKILL.md'), 'utf8');
  assert.ok(body.includes('`saas`'), 'ui does not name `saas`');
  assert.ok(body.includes('`vitrine`'), 'ui does not name `vitrine`');
});

test("saas follows ui's mockup-first rule", () => {
  const body = readFileSync(join(SKILLS, 'saas', 'SKILL.md'), 'utf8');
  assert.ok(!body.includes('if the owner wants to judge it'), 'saas still makes the mockup optional');
  assert.ok(body.includes('mockup-first'), 'saas does not cite mockup-first');
});

test('vitrine points to loi-25-website instead of listing its obligations', () => {
  const body = readFileSync(join(SKILLS, 'vitrine', 'SKILL.md'), 'utf8');
  assert.ok(!body.includes('person in charge'), 'vitrine still lists Law 25 obligations');
  assert.ok(body.includes('loi-25-website'), 'vitrine does not name loi-25-website');
});

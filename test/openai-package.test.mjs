// The ChatGPT plugin package: openai/ holds the listing and review data, scripts/openai-package.mjs
// zips it with the version from package.json for upload at https://platform.openai.com/plugins.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildManifest, checkManifest, packageFiles } from '../scripts/openai-package.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, 'scripts', 'openai-package.mjs');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const { TOOLS } = await import('../skills/.mcp/tools.mjs');
const DEMO = 'https://www.molveau.ca/skills/chatgpt-demo';

const openai = (m) => m.extensions['com.openai'];

test('the manifest carries the package version and the demo URL it is given', () => {
  const m = buildManifest({ demoUrl: DEMO });
  assert.equal(m.$schema, 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');
  assert.equal(m.name, 'molveau-skills');
  assert.equal(m.version, pkg.version);
  assert.equal(openai(m).review.demo_recording_url, DEMO);
  assert.deepEqual(checkManifest(m), []);
});

test('the listing fields fit the directory limits and every URL is HTTPS', () => {
  const ui = openai(buildManifest({ demoUrl: DEMO })).interface;
  assert.ok(ui.displayName.length <= 30);
  assert.ok(ui.shortDescription.length <= 30);
  assert.ok(ui.longDescription.length <= 4000);
  assert.ok(ui.developerName.length <= 80);
  for (const key of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) assert.match(ui[key], /^https:\/\//, key);
  assert.ok(ui.defaultPrompt.length <= 3);
  for (const p of ui.defaultPrompt) assert.ok(p.length <= 128, p);
  const fr = openai(buildManifest({ demoUrl: DEMO })).publication.translations['fr-FR'];
  assert.ok(fr.subtitle.length <= 30, fr.subtitle);
});

test('review has exactly 5 positive and 3 negative cases, the positive ones naming real tools', () => {
  const { positive, negative } = openai(buildManifest({ demoUrl: DEMO })).review.test_cases;
  assert.equal(positive.length, 5);
  assert.equal(negative.length, 3);
  const names = new Set(TOOLS.map((t) => t.name));
  for (const c of positive) {
    for (const key of ['description', 'prompt', 'tools_triggered', 'expected_behavior']) assert.ok(c[key], key);
    for (const tool of c.tools_triggered.split(',').map((s) => s.trim())) assert.ok(names.has(tool), tool);
  }
  // Every tool is exercised by at least one positive case (a case may trigger several tools).
  const triggered = new Set(positive.flatMap((c) => c.tools_triggered.split(',').map((s) => s.trim())));
  assert.deepEqual(triggered, names);
  for (const c of negative) for (const key of ['description', 'prompt']) assert.ok(c[key], key);
});

test('checkManifest refuses a missing demo URL, a wrong case count and a tool that does not exist', () => {
  assert.ok(checkManifest(buildManifest({})).some((p) => /demo_recording_url/.test(p)));
  const m = buildManifest({ demoUrl: DEMO });
  openai(m).review.test_cases.negative.pop();
  openai(m).review.test_cases.positive[0].tools_triggered = 'search_web';
  const problems = checkManifest(m);
  assert.ok(problems.some((p) => /3 negative/.test(p)), problems.join('\n'));
  assert.ok(problems.some((p) => /search_web/.test(p)), problems.join('\n'));
});

test('the package holds the manifest, the hosted MCP server, the onboarding skill and the icon, and no hooks', () => {
  const files = packageFiles();
  assert.deepEqual(Object.keys(files).sort(), ['assets/icon.png', 'mcp.json', 'plugin.json', 'skills/get-started/SKILL.md']);
  const mcp = JSON.parse(readFileSync(files['mcp.json'], 'utf8'));
  assert.deepEqual(mcp.mcpServers, { 'molveau-skills': { type: 'streamable-http', url: 'https://www.molveau.ca/api/mcp' } });
  const ui = openai(buildManifest({ demoUrl: DEMO })).interface;
  for (const path of [ui.logo, ui.composerIcon, openai(buildManifest({ demoUrl: DEMO })).onboardingSkill]) {
    assert.ok(Object.hasOwn(files, path.replace(/^\.\//, '')), path);
  }
  const skill = readFileSync(files['skills/get-started/SKILL.md'], 'utf8');
  assert.match(skill, /^---\nname: get-started\ndescription: .+\n---\n/);
});

test('the script writes the zip, and refuses to without a demo URL', () => {
  const out = mkdtempSync(join(tmpdir(), 'openai-pkg-'));
  const refused = spawnSync(process.execPath, [SCRIPT, '--out', out], { encoding: 'utf8' });
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /demo_recording_url/);

  const r = spawnSync(process.execPath, [SCRIPT, '--out', out, '--demo', DEMO], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const zip = join(out, `molveau-skills-openai-${pkg.version}.zip`);
  assert.ok(existsSync(zip));
  const list = spawnSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).stdout.trim().split('\n').sort();
  assert.deepEqual(list, ['assets/icon.png', 'mcp.json', 'plugin.json', 'skills/get-started/SKILL.md']);
  const manifest = JSON.parse(spawnSync('unzip', ['-p', zip, 'plugin.json'], { encoding: 'utf8' }).stdout);
  assert.equal(manifest.version, pkg.version);
  assert.equal(openai(manifest).review.demo_recording_url, DEMO);
});

test('--draft writes a zip with no demo URL, to upload before the demo is recorded', () => {
  const out = mkdtempSync(join(tmpdir(), 'openai-pkg-'));
  const r = spawnSync(process.execPath, [SCRIPT, '--out', out, '--draft'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const zip = join(out, `molveau-skills-openai-${pkg.version}-draft.zip`);
  const manifest = JSON.parse(spawnSync('unzip', ['-p', zip, 'plugin.json'], { encoding: 'utf8' }).stdout);
  assert.equal(openai(manifest).review.demo_recording_url, undefined);
});

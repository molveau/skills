import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { probeSuites, defaultSkillsDirs, OPTIONAL_SUITES } from '../../skills/design-grill/scripts/probe-suites.mjs';

function makeSkillsDir(skillNames) {
  const dir = mkdtempSync(join(tmpdir(), 'grill-probe-'));
  for (const name of skillNames) {
    mkdirSync(join(dir, name), { recursive: true });
    writeFileSync(join(dir, name, 'SKILL.md'), '# stub\n');
  }
  return dir;
}

test('reports a present suite as present', () => {
  const dir = makeSkillsDir(['impeccable']);
  const probes = probeSuites([dir]);
  const p = probes.find((x) => x.suite === 'impeccable');
  assert.equal(p.present, true);
});

test('reports an absent suite as absent with a reason, never omits it', () => {
  const dir = makeSkillsDir([]);
  const probes = probeSuites([dir]);
  assert.equal(probes.length, OPTIONAL_SUITES.length, 'every optional suite is reported');
  for (const p of probes) {
    assert.equal(p.present, false);
    assert.ok(p.reason.length > 0, 'absent suites carry a reason');
  }
});

test('a nonexistent skills dir does not throw', () => {
  const probes = probeSuites(['/nonexistent/path/xyz']);
  assert.equal(probes.length, OPTIONAL_SUITES.length);
  assert.ok(probes.every((p) => p.present === false));
});

test('every probe names the lens it enriches', () => {
  const probes = probeSuites([makeSkillsDir([])]);
  for (const p of probes) assert.ok(p.lens.length > 0);
});

test('probeSuites() with no argument returns every suite reported absent and does not throw', () => {
  const probes = probeSuites();
  assert.equal(probes.length, OPTIONAL_SUITES.length, 'every optional suite is reported');
  assert.ok(probes.every((p) => p.present === false), 'all suites reported absent');
});

test('probeSuites(null) returns every suite reported absent and does not throw', () => {
  const probes = probeSuites(null);
  assert.equal(probes.length, OPTIONAL_SUITES.length, 'every optional suite is reported');
  assert.ok(probes.every((p) => p.present === false), 'all suites reported absent');
});

test('probeSuites(non-array) returns every suite reported absent and does not throw', () => {
  const probes = probeSuites('not-an-array');
  assert.equal(probes.length, OPTIONAL_SUITES.length, 'every optional suite is reported');
  assert.ok(probes.every((p) => p.present === false), 'all suites reported absent');
});

// --- Fix 1: marketplace-installed plugins are invisible ------------------

function makeHomeWithPluginCache({ marketplace, plugin, version, layout, skillName }) {
  const home = mkdtempSync(join(tmpdir(), 'grill-home-'));
  const versionDir = join(home, '.claude', 'plugins', 'cache', marketplace, plugin, version);
  // `layout` mirrors the two real on-disk shapes observed under
  // ~/.claude/plugins/cache on this machine: some plugins put their skills
  // directly at `<version>/skills/<name>`, others nest them one level
  // deeper at `<version>/.claude/skills/<name>` (per that plugin's own
  // plugin.json `"skills"` pointer).
  const skillsRoot = layout === 'nested' ? join(versionDir, '.claude', 'skills') : join(versionDir, 'skills');
  const skillDir = join(skillsRoot, skillName);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, 'SKILL.md'), '# stub\n');
  return home;
}

test('probeSuites reports a suite present when it only exists in a plugin-cache skills dir (flat layout)', () => {
  const home = makeHomeWithPluginCache({
    marketplace: 'ui-ux-pro-max-skill',
    plugin: 'ui-ux-pro-max',
    version: '2.6.2',
    layout: 'flat',
    skillName: 'ui-ux-pro-max',
  });
  const dirs = defaultSkillsDirs(home);
  const probes = probeSuites(dirs);
  const p = probes.find((x) => x.suite === 'ux-guideline-db');
  assert.equal(p.present, true, 'ux-guideline-db should be found via the plugin cache');
  rmSync(home, { recursive: true, force: true });
});

test('probeSuites reports a suite present when it only exists in a plugin-cache skills dir (nested .claude/skills layout)', () => {
  const home = makeHomeWithPluginCache({
    marketplace: 'ui-ux-pro-max-skill',
    plugin: 'ui-ux-pro-max',
    version: '2.6.2',
    layout: 'nested',
    skillName: 'ui-ux-pro-max',
  });
  const dirs = defaultSkillsDirs(home);
  const probes = probeSuites(dirs);
  const p = probes.find((x) => x.suite === 'ux-guideline-db');
  assert.equal(p.present, true, 'ux-guideline-db should be found via the plugin cache');
  rmSync(home, { recursive: true, force: true });
});

test('defaultSkillsDirs includes a plugin-cache skills root when a marketplace plugin is installed', () => {
  const home = makeHomeWithPluginCache({
    marketplace: 'some-marketplace',
    plugin: 'some-plugin',
    version: '1.2.3',
    layout: 'nested',
    skillName: 'some-skill',
  });
  const dirs = defaultSkillsDirs(home);
  const expected = join(home, '.claude', 'plugins', 'cache', 'some-marketplace', 'some-plugin', '1.2.3', '.claude', 'skills');
  assert.ok(dirs.includes(expected), `expected ${expected} to be discovered, got ${JSON.stringify(dirs)}`);
  rmSync(home, { recursive: true, force: true });
});

test('defaultSkillsDirs does not throw when the plugin cache is absent', () => {
  const home = mkdtempSync(join(tmpdir(), 'grill-home-empty-'));
  assert.doesNotThrow(() => defaultSkillsDirs(home));
  const dirs = defaultSkillsDirs(home);
  assert.ok(Array.isArray(dirs));
  assert.ok(dirs.includes(join(home, '.claude', 'skills')));
  assert.ok(dirs.includes(join(home, '.agents', 'skills')));
  rmSync(home, { recursive: true, force: true });
});

test('OPTIONAL_SUITES is frozen and cannot be mutated', () => {
  assert.throws(() => {
    OPTIONAL_SUITES.push({});
  }, 'pushing to OPTIONAL_SUITES throws');
  assert.throws(() => {
    OPTIONAL_SUITES[0].suite = 'modified';
  }, 'mutating an entry throws');
  assert.throws(() => {
    OPTIONAL_SUITES[0].dirNames.push('new-dir');
  }, 'mutating dirNames array throws');
});

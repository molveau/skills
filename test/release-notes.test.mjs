import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { releaseNotes } from '../scripts/release-notes.mjs';

const changelog = `# Changelog

Intro.

## [1.4.0] - 2026-11-11

### Added

- writing.

## [1.3.2] - 2026-11-02

### Fixed

- fr_typo.
`;

test('releaseNotes returns the body of one version, without its heading', () => {
  assert.equal(releaseNotes(changelog, '1.4.0'), '### Added\n\n- writing.');
  assert.equal(releaseNotes(changelog, '1.3.2'), '### Fixed\n\n- fr_typo.');
});

test('releaseNotes throws when the version has no entry', () => {
  assert.throws(() => releaseNotes(changelog, '9.9.9'), /no CHANGELOG entry for 9\.9\.9/);
});

test('releaseNotes does not match a version that only shares a prefix', () => {
  assert.throws(() => releaseNotes(changelog, '1.4'), /no CHANGELOG entry for 1\.4/);
});

test('the current package version has CHANGELOG notes, so the release workflow can publish it', () => {
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const text = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
  assert.ok(releaseNotes(text, version).length > 0);
});

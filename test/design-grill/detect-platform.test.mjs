import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { detectPlatform, findNearestPackageJson } from '../../skills/design-grill/scripts/detect-platform.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '../fixtures/design-grill');

test('expo dependency detects mobile', () => {
  const r = detectPlatform(join(FIXTURES, 'fixture-mobile-expo'));
  assert.equal(r.platform, 'mobile');
  assert.match(r.reason, /expo|react-native/);
});

test('next dependency detects web', () => {
  const r = detectPlatform(join(FIXTURES, 'fixture-web-tailwind'));
  assert.equal(r.platform, 'web');
});

test('mobile wins when both mobile and web deps present', () => {
  // Expo apps commonly carry react-dom for expo-web; still a mobile project.
  const r = detectPlatform(join(FIXTURES, 'fixture-mobile-expo'));
  assert.equal(r.platform, 'mobile');
});

test('no package.json returns ambiguous, does not throw', () => {
  // Copy out of this repo: its own root package.json would otherwise be found by the upward walk.
  const bare = mkdtempSync(join(tmpdir(), 'grill-bare-'));
  const r = detectPlatform(bare);
  assert.equal(r.platform, 'ambiguous');
  assert.equal(r.source, null);
});

test('walks up from a nested file to the nearest package.json', () => {
  const nested = join(FIXTURES, 'fixture-web-tailwind/src/components/thing.tsx');
  const found = findNearestPackageJson(nested);
  assert.ok(found.endsWith('fixture-web-tailwind/package.json'));
});

test('react-dom without a framework detects web', () => {
  const r = detectPlatform(join(FIXTURES, 'fixture-no-tokens'));
  assert.equal(r.platform, 'web'); // react-dom is a web signal
});

test('the walk stops at a repo boundary and ignores ancestors above it', () => {
  // A package.json outside the repo must never be found from inside it.
  const dir = mkdtempSync(join(tmpdir(), 'grill-boundary-'));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: { next: '15.0.0' } }));
  const repo = join(dir, 'repo');
  mkdirSync(join(repo, '.git'), { recursive: true });
  mkdirSync(join(repo, 'src'), { recursive: true });

  assert.equal(findNearestPackageJson(join(repo, 'src')), null, 'must not escape the repo boundary');
  assert.equal(detectPlatform(join(repo, 'src')).platform, 'ambiguous');
});

test('a package.json at the repo root is still found', () => {
  const dir = mkdtempSync(join(tmpdir(), 'grill-root-'));
  mkdirSync(join(dir, '.git'), { recursive: true });
  mkdirSync(join(dir, 'src'), { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: { next: '15.0.0' } }));

  assert.equal(detectPlatform(join(dir, 'src')).platform, 'web', 'boundary stop must not skip the root itself');
});

test('a malformed package.json is reported as ambiguous, not thrown', () => {
  const dir = mkdtempSync(join(tmpdir(), 'grill-malformed-'));
  mkdirSync(join(dir, '.git'), { recursive: true });
  const pkgPath = join(dir, 'package.json');
  writeFileSync(pkgPath, '{ this is not valid JSON ,,, ');

  const r = detectPlatform(dir);
  assert.equal(r.platform, 'ambiguous');
  assert.equal(r.source, pkgPath);
  assert.match(r.reason, /unparseable/);
});

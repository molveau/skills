import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parity } from '../skills/bilingual-next/scripts/check-i18n-parity.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'skills', 'bilingual-next', 'scripts', 'check-i18n-parity.mjs');
const FX = join(HERE, 'fixtures', 'i18n-parity');
const fx = (n) => join(FX, n);
const load = (n) => JSON.parse(readFileSync(fx(n), 'utf8'));
const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });

test('identical shape reports nothing', () => {
  assert.deepEqual(parity(load('fr.json'), load('en-same.json')), { missingInB: [], missingInA: [], typeMismatch: [], emptyInB: [], emptyInA: [] });
});

test('differences are listed by dotted path, arrays by index', () => {
  const r = parity(load('fr.json'), load('en-diff.json'));
  assert.deepEqual(r.missingInB, ['nav.pricing', 'faq.items[1]']);
  assert.deepEqual(r.missingInA, ['nav.about', 'extra']);
  assert.deepEqual(r.typeMismatch, ['title']);
  assert.deepEqual(r.emptyInB, ['faq.items[0].a']);
});

test('a type mismatch is not also reported as missing', () => {
  const r = parity({ a: 'x' }, { a: { b: 'y' } });
  assert.deepEqual(r, { missingInB: [], missingInA: [], typeMismatch: ['a'], emptyInB: [], emptyInA: [] });
  assert.deepEqual(parity({ a: [] }, { a: {} }).typeMismatch, ['a']);
});

test('whitespace-only counts as empty; numbers, booleans and null are leaves', () => {
  assert.deepEqual(parity({ a: 'x', n: 1 }, { a: '  ', n: 2 }).emptyInB, ['a']);
  assert.deepEqual(parity({ a: null }, { a: 1 }).typeMismatch, []);
});

test('an empty string is reported both ways', () => {
  const r = parity({ a: '', b: 'x' }, { a: 'y', b: '' });
  assert.deepEqual(r.emptyInA, ['a']);
  assert.deepEqual(r.emptyInB, ['b']);
  assert.deepEqual(parity({ a: '' }, { a: ' ' }), { missingInB: [], missingInA: [], typeMismatch: [], emptyInB: [], emptyInA: [] });
});

test('CLI exits 0 when shapes match', () => {
  const r = run(fx('fr.json'), fx('en-same.json'));
  assert.equal(r.status, 0);
  assert.match(r.stdout, /identical|ok/i);
});

test('CLI exits 1 on differences and names the paths', () => {
  const r = run(fx('fr.json'), fx('en-diff.json'));
  assert.equal(r.status, 1);
  assert.match(r.stdout, /nav\.pricing/);
  assert.match(r.stdout, /faq\.items\[0\]\.a/);
});

test('CLI --json prints the parity object', () => {
  const r = run(fx('fr.json'), fx('en-diff.json'), '--json');
  assert.equal(r.status, 1);
  assert.deepEqual(JSON.parse(r.stdout).typeMismatch, ['title']);
});

test('CLI exits 2 with a message, no stack, on usage error, missing file or invalid JSON', () => {
  for (const args of [[], [fx('fr.json')], [fx('fr.json'), fx('nope.json')], [fx('fr.json'), fx('invalid.json')], [fx('fr.json'), fx('en-same.json'), '--bogus']]) {
    const r = run(...args);
    assert.equal(r.status, 2, args.join(' '));
    assert.ok(r.stderr.trim().length > 0);
    assert.doesNotMatch(r.stderr, /\n\s+at /);
  }
  assert.match(run().stderr, /Usage/);
  assert.match(run(fx('fr.json'), fx('invalid.json')).stderr, /invalid\.json/);
});

test('CLI rejects a top-level non-object', () => {
  const r = run(fx('fr.json'), fx('scalar.json'));
  assert.equal(r.status, 2);
});

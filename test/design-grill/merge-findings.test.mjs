import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeFindings, rankFindings, normaliseClaim } from '../../skills/design-grill/scripts/merge-findings.mjs';

const base = {
  severity: 'minor', type: 'objective', file: 'src/a.tsx', line: 10,
  claim: 'Hardcoded 6px duplicates --radius-md.', why: '--radius-md declared in globals.css',
  remediation: 'Use var(--radius-md).', source: 'builtin', verdict: null,
};

// Verdict/type reconciliation. Every case is asserted in BOTH input orders:
// the bug these cover was precisely an order dependency, where the surviving
// finding kept whichever verdict happened to arrive first. A test fixing one
// order would have passed against the broken code half the time.
function mergeBothWays(a, b) {
  const forward = mergeFindings([a, b]);
  const reverse = mergeFindings([b, a]);
  assert.equal(forward.length, 1, 'forward order must collapse to one finding');
  assert.equal(reverse.length, 1, 'reverse order must collapse to one finding');
  return { forward: forward[0], reverse: reverse[0] };
}

test('CONFIRMED beats UNVERIFIED, in either order', () => {
  // A verifier read this line and agreed. Reporting the merged finding as
  // unverified would understate what the grill actually established.
  const { forward, reverse } = mergeBothWays(
    { ...base, lens: 'tokens', verdict: 'CONFIRMED' },
    { ...base, lens: 'craft', verdict: 'UNVERIFIED' },
  );
  assert.equal(forward.verdict, 'CONFIRMED');
  assert.equal(reverse.verdict, 'CONFIRMED');
});

test('UNVERIFIED beats null, in either order', () => {
  // An objective finding's "we could not check this" marker must never be
  // erased by merging with a judgment finding.
  const { forward, reverse } = mergeBothWays(
    { ...base, lens: 'tokens', type: 'objective', verdict: 'UNVERIFIED' },
    { ...base, lens: 'heuristics', type: 'judgment', verdict: null },
  );
  assert.equal(forward.verdict, 'UNVERIFIED');
  assert.equal(reverse.verdict, 'UNVERIFIED');
});

test('objective beats judgment on merge, in either order', () => {
  // A finding a verifier confirmed is not a taste call.
  const { forward, reverse } = mergeBothWays(
    { ...base, lens: 'tokens', type: 'objective', verdict: 'CONFIRMED' },
    { ...base, lens: 'heuristics', type: 'judgment', verdict: null },
  );
  assert.equal(forward.type, 'objective');
  assert.equal(reverse.type, 'objective');
});

test('a missing verdict field is treated as null, not as unknown', () => {
  const { without } = { without: { ...base, lens: 'craft' } };
  delete without.verdict;
  const { forward, reverse } = mergeBothWays({ ...base, lens: 'tokens', verdict: 'UNVERIFIED' }, without);
  assert.equal(forward.verdict, 'UNVERIFIED');
  assert.equal(reverse.verdict, 'UNVERIFIED');
});

test('same file:line + same claim collapses to one finding', () => {
  const out = mergeFindings([
    { ...base, lens: 'tokens' },
    { ...base, lens: 'craft' },
  ]);
  assert.equal(out.length, 1);
});

test('merged finding unions the lens names', () => {
  const out = mergeFindings([
    { ...base, lens: 'tokens' },
    { ...base, lens: 'craft' },
  ]);
  assert.deepEqual(out[0].lenses.sort(), ['craft', 'tokens']);
});

test('merged finding keeps the highest severity', () => {
  const out = mergeFindings([
    { ...base, lens: 'tokens', severity: 'minor' },
    { ...base, lens: 'craft', severity: 'blocker' },
  ]);
  assert.equal(out[0].severity, 'blocker');
});

test('different claims at the same line do not collapse', () => {
  const out = mergeFindings([
    { ...base, lens: 'tokens', claim: 'Hardcoded 6px duplicates --radius-md.' },
    { ...base, lens: 'a11y', claim: 'Button has no accessible name.' },
  ]);
  assert.equal(out.length, 2);
});

test('same claim at different lines does not collapse', () => {
  const out = mergeFindings([
    { ...base, lens: 'tokens', line: 10 },
    { ...base, lens: 'tokens', line: 42 },
  ]);
  assert.equal(out.length, 2);
});

test('claim normalisation ignores case, punctuation and whitespace', () => {
  assert.equal(
    normaliseClaim('Hardcoded 6px duplicates --radius-md.'),
    normaliseClaim('hardcoded 6px   duplicates --radius-md'),
  );
});

test('claim normalisation does not collapse a decimal into its integer neighbour', () => {
  assert.notEqual(normaliseClaim('padding is 1.5rem'), normaliseClaim('padding is 15rem'));
});

test('findings differing only by a decimal point at the same file:line do not collapse', () => {
  const out = mergeFindings([
    { ...base, lens: 'tokens', claim: 'padding is 1.5rem' },
    { ...base, lens: 'craft', claim: 'padding is 15rem' },
  ]);
  assert.equal(out.length, 2);
});

// `topic` is a short kebab-case slug naming the code construct/defect class at
// fault (e.g. "transition-all"), independent of claim wording. Two lenses that
// converge on the same flaw in different words should still merge if they
// agree on `topic` - and a missing/empty `topic` must never be treated as
// agreement, since that would collapse unrelated findings sharing a line.

test('same file:line + same topic but DIFFERENT claim text collapses to one finding, and lenses union', () => {
  const { forward, reverse } = mergeBothWays(
    { ...base, lens: 'motion', topic: 'transition-all', claim: 'transition-all animates every property.' },
    { ...base, lens: 'craft', topic: 'transition-all', claim: 'This card uses transition-all, per emil-design-eng.' },
  );
  assert.deepEqual(forward.lenses.sort(), ['craft', 'motion']);
  assert.deepEqual(reverse.lenses.sort(), ['craft', 'motion']);
});

test('same file:line + same topic, different severity: merged keeps the higher severity, either order', () => {
  const { forward, reverse } = mergeBothWays(
    { ...base, lens: 'motion', topic: 'transition-all', claim: 'Objective claim about transition-all.', severity: 'minor' },
    { ...base, lens: 'craft', topic: 'transition-all', claim: 'Judgment claim about transition-all.', severity: 'nit' },
  );
  assert.equal(forward.severity, 'minor');
  assert.equal(reverse.severity, 'minor');
});

test('same file:line, DIFFERENT topic, different claims: do not collapse, either order', () => {
  const a = { ...base, lens: 'motion', topic: 'transition-all', claim: 'Uses transition-all.' };
  const b = { ...base, lens: 'craft', topic: 'missing-focus-visible', claim: 'No focus-visible style.' };
  assert.equal(mergeFindings([a, b]).length, 2);
  assert.equal(mergeFindings([b, a]).length, 2);
});

test('same file:line, BOTH missing topic, different claims: absence is not agreement, do not collapse, either order', () => {
  const a = { ...base, lens: 'motion', claim: 'Uses transition-all.' };
  delete a.topic;
  const b = { ...base, lens: 'craft', claim: 'Shadow is pure black.' };
  delete b.topic;
  assert.equal(mergeFindings([a, b]).length, 2);
  assert.equal(mergeFindings([b, a]).length, 2);
});

test('same file:line, BOTH empty-string topic, different claims: absence is not agreement, do not collapse, either order', () => {
  const a = { ...base, lens: 'motion', topic: '', claim: 'Uses transition-all.' };
  const b = { ...base, lens: 'craft', topic: '', claim: 'Shadow is pure black.' };
  assert.equal(mergeFindings([a, b]).length, 2);
  assert.equal(mergeFindings([b, a]).length, 2);
});

test('back-compat: claim-based merge still works when topic is absent on both, either order', () => {
  const a = { ...base, lens: 'tokens' };
  delete a.topic;
  const b = { ...base, lens: 'craft' };
  delete b.topic;
  const { forward, reverse } = mergeBothWays(a, b);
  assert.deepEqual(forward.lenses.sort(), ['craft', 'tokens']);
  assert.deepEqual(reverse.lenses.sort(), ['craft', 'tokens']);
});

test('ranks blocker before nit', () => {
  const out = rankFindings([
    { ...base, lens: 'a', severity: 'nit' },
    { ...base, lens: 'b', severity: 'blocker' },
  ]);
  assert.equal(out[0].severity, 'blocker');
});

test('at equal severity, objective ranks before judgment', () => {
  const out = rankFindings([
    { ...base, lens: 'a', severity: 'major', type: 'judgment' },
    { ...base, lens: 'b', severity: 'major', type: 'objective' },
  ]);
  assert.equal(out[0].type, 'objective');
});

import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CLI = fileURLToPath(new URL('../../skills/design-grill/scripts/merge-findings.mjs', import.meta.url));

test('CLI merges and ranks findings from stdin', () => {
  const input = JSON.stringify([
    { ...base, lens: 'tokens', severity: 'nit' },
    { ...base, lens: 'craft', severity: 'blocker' },
  ]);
  const out = JSON.parse(execFileSync('node', [CLI], { input, encoding: 'utf8' }));
  assert.equal(out.length, 1, 'identical claims collapse');
  assert.equal(out[0].severity, 'blocker', 'highest severity survives');
  assert.deepEqual(out[0].lenses.sort(), ['craft', 'tokens']);
});

test('CLI returns [] for empty stdin', () => {
  const out = JSON.parse(execFileSync('node', [CLI], { input: '', encoding: 'utf8' }));
  assert.deepEqual(out, []);
});

test('CLI exits non-zero on invalid JSON', () => {
  assert.throws(() => execFileSync('node', [CLI], { input: 'not json', encoding: 'utf8', stdio: 'pipe' }));
});

test('CLI runs correctly when invoked from a path containing a space', () => {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'merge-findings-'));
  const spaceDir = join(tmpRoot, 'with space');
  mkdirSync(spaceDir);
  const dest = join(spaceDir, 'merge-findings.mjs');
  copyFileSync(CLI, dest);

  try {
    const input = JSON.stringify([
      { ...base, lens: 'tokens', severity: 'nit' },
      { ...base, lens: 'craft', severity: 'blocker' },
    ]);
    const out = JSON.parse(execFileSync('node', [dest], { input, encoding: 'utf8' }));
    assert.equal(out.length, 1, 'identical claims collapse');
    assert.equal(out[0].severity, 'blocker', 'highest severity survives');
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('importing the module does not run the CLI', async () => {
  // Spawn a child that only imports the module, with stdin left open as a
  // pipe we deliberately never write to or close. If the "run as CLI" guard
  // ever fails open, the import calls main(), which awaits stdin forever and
  // the child hangs past the deadline below - that's the failure this test
  // must actually catch (a plain `assert.ok(true)` proves nothing).
  //
  // A synchronous spawn (execFileSync/spawnSync) can't be used here: without
  // continuous input to feed, Node closes the child's stdin immediately once
  // the synchronous call returns, so the child always sees EOF right away
  // regardless of whether the guard is correct - defeating the test. An
  // async spawn lets us hold the pipe open and race the child's exit against
  // our own timeout instead.
  const child = spawn('node', ['--input-type=module', '-e', `import ${JSON.stringify(CLI)};`], {
    stdio: ['pipe', 'ignore', 'pipe'],
  });

  const result = await Promise.race([
    new Promise((resolve) => child.once('exit', (code) => resolve({ hung: false, code }))),
    new Promise((resolve) => setTimeout(() => resolve({ hung: true }), 2000)),
  ]);

  if (result.hung) child.kill('SIGKILL');
  assert.equal(result.hung, false, 'module import must not block reading stdin (CLI guard failed open)');
  assert.equal(result.code, 0);
});

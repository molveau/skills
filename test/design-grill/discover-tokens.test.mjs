import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { discoverTokens, parseCssVars, parseObjectLiteralAt, categorise } from '../../skills/design-grill/scripts/discover-tokens.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '../fixtures/design-grill');

test('discovers CSS custom properties with provenance', () => {
  const t = discoverTokens(join(FIXTURES, 'fixture-web-tailwind'));
  const radius = t.radii.find((x) => x.name === '--radius-md');
  assert.ok(radius, 'expected --radius-md to be discovered');
  assert.equal(radius.value, '8px');
  assert.match(radius.declaredIn, /globals\.css$/);
});

test('categorises css vars by name into the right buckets', () => {
  const t = discoverTokens(join(FIXTURES, 'fixture-web-tailwind'));
  assert.ok(t.colors.some((x) => x.name === '--color-primary'));
  assert.ok(t.spacing.some((x) => x.name === '--space-4'));
  assert.ok(t.motion.some((x) => x.name === '--duration-fast'));
});

test('discovers tailwind theme.extend values', () => {
  const t = discoverTokens(join(FIXTURES, 'fixture-web-tailwind'));
  assert.ok(t.colors.some((x) => x.name === 'accent' && x.value === '#f97316'));
  assert.ok(t.radii.some((x) => x.name === 'lg' && x.value === '12px'));
});

test('merges two declaration sites without duplication', () => {
  const t = discoverTokens(join(FIXTURES, 'fixture-web-tailwind'));
  assert.ok(t.sources.length >= 2, 'expected css + tailwind sources');
  const names = t.radii.map((x) => x.name);
  assert.equal(new Set(names).size, names.length, 'no duplicate token names');
});

test('discovers a theme module in a mobile project', () => {
  const t = discoverTokens(join(FIXTURES, 'fixture-mobile-expo'));
  assert.ok(t.colors.some((x) => x.name === 'primary'));
  assert.equal(t.empty, false);
});

test('a project declaring nothing returns an empty set, does not throw', () => {
  const t = discoverTokens(join(FIXTURES, 'fixture-no-tokens'));
  assert.equal(t.empty, true);
  assert.deepEqual(t.colors, []);
  assert.deepEqual(t.sources, []);
});

// --- Finding 1: parseCssVars mis-parses real CSS -------------------------

test('parseCssVars strips comments so a } or ; inside a comment cannot truncate or corrupt the block', () => {
  const css = ':root { --a: 1px; /* was 2px } */ --b: 3px; }';
  const vars = parseCssVars(css);
  const a = vars.find((v) => v.name === '--a');
  const b = vars.find((v) => v.name === '--b');
  assert.ok(a, 'expected --a to be discovered');
  assert.equal(a.value, '1px');
  assert.ok(b, 'expected --b to be discovered (comment must not truncate the block)');
  assert.equal(b.value, '3px');
});

test('parseCssVars parses a final declaration with no trailing semicolon cleanly', () => {
  const css = ':root { --duration-fast: 150ms }';
  const vars = parseCssVars(css);
  const v = vars.find((x) => x.name === '--duration-fast');
  assert.ok(v, 'expected --duration-fast to be discovered');
  assert.equal(v.value, '150ms', 'the closing brace must not be swallowed into the value');
});

// --- Finding 2: parseObjectLiteral is unscoped and string-unaware --------

test('parseObjectLiteralAt disambiguates theme.colors from theme.extend.colors', () => {
  const src = `
    module.exports = {
      theme: {
        colors: { red: '#ff0000' },
        extend: {
          colors: { accent: '#f97316' },
        },
      },
    };
  `;
  const full = parseObjectLiteralAt(src, 'theme.colors');
  const extended = parseObjectLiteralAt(src, 'theme.extend.colors');
  assert.deepEqual(full, [{ name: 'red', value: '#ff0000' }]);
  assert.deepEqual(extended, [{ name: 'accent', value: '#f97316' }]);
});

test('parseObjectLiteralAt is not hijacked by a comment containing the key text', () => {
  // A leading comment containing "colors:" plus a sibling key with a quoted
  // value (`version: '2'`) makes the old bug observable: the unscoped
  // `indexOf` implementation locks onto the comment's "colors:" text, grabs
  // the wrong (outer) brace block, and its flattened extraction wrongly
  // pulls in `version` alongside `red`.
  const src = `
    // colors: old approach, ignore this
    module.exports = {
      version: '2',
      theme: {
        colors: { red: '#ff0000' },
      },
    };
  `;
  const result = parseObjectLiteralAt(src, 'theme.colors');
  assert.deepEqual(result, [{ name: 'red', value: '#ff0000' }]);
});

test('parseObjectLiteralAt does not truncate a block on an unbalanced literal brace inside a quoted value', () => {
  // A single unmatched `}` inside a string value ('a}b') makes the old bug
  // observable: naive depth counting treats it as a real closing brace and
  // ends the block early, before `red` is ever reached.
  const src = `
    module.exports = {
      theme: {
        colors: { weird: 'a}b', red: '#ff0000' },
      },
    };
  `;
  const result = parseObjectLiteralAt(src, 'theme.colors');
  assert.deepEqual(result, [
    { name: 'weird', value: 'a}b' },
    { name: 'red', value: '#ff0000' },
  ]);
});

// --- Fix 3: nested tailwind scales flatten into meaningless names ---------

test('parseObjectLiteralAt qualifies a nested key with its parent key', () => {
  const src = `
    module.exports = {
      theme: {
        extend: {
          colors: { chart: { 1: '#111111', 2: '#222222' } },
        },
      },
    };
  `;
  const result = parseObjectLiteralAt(src, 'theme.extend.colors');
  assert.deepEqual(result, [
    { name: 'chart.1', value: '#111111' },
    { name: 'chart.2', value: '#222222' },
  ]);
});

test('parseObjectLiteralAt gives a DEFAULT nested key its parent name instead of the literal "DEFAULT"', () => {
  const src = `
    module.exports = {
      theme: {
        extend: {
          colors: { border: { DEFAULT: '#d4d4d4' } },
        },
      },
    };
  `;
  const result = parseObjectLiteralAt(src, 'theme.extend.colors');
  assert.deepEqual(result, [{ name: 'border', value: '#d4d4d4' }]);
});

test('parseObjectLiteralAt leaves a flat top-level key unqualified', () => {
  const src = `
    module.exports = {
      theme: {
        extend: {
          colors: { accent: '#f97316' },
        },
      },
    };
  `;
  const result = parseObjectLiteralAt(src, 'theme.extend.colors');
  assert.deepEqual(result, [{ name: 'accent', value: '#f97316' }]);
});

test('discoverTokens qualifies nested tailwind colour scales end to end, and does not flatten DEFAULT', () => {
  const t = discoverTokens(join(FIXTURES, 'fixture-tailwind-nested-scales'));
  assert.ok(t.colors.some((x) => x.name === 'accent' && x.value === '#f97316'), 'flat key stays unqualified');
  assert.ok(t.colors.some((x) => x.name === 'chart.1' && x.value === '#111111'), 'nested chart.1');
  assert.ok(t.colors.some((x) => x.name === 'chart.2' && x.value === '#222222'), 'nested chart.2');
  assert.ok(t.colors.some((x) => x.name === 'neutral.50' && x.value === '#f5f5f5'), 'nested neutral.50');
  assert.ok(t.colors.some((x) => x.name === 'neutral.100' && x.value === '#e5e5e5'), 'nested neutral.100');
  assert.ok(t.colors.some((x) => x.name === 'border' && x.value === '#d4d4d4'), 'border.DEFAULT collapses to border');
  assert.ok(!t.colors.some((x) => x.name === 'DEFAULT'), 'a token literally named DEFAULT must never appear');
  assert.ok(!t.colors.some((x) => x.name === '1' || x.name === '2'), 'bare numeric names must never appear');
});

// --- Fix 2: categorise() files colours as typography by name alone -------

test('categorise buckets a text-named RGB-triplet variable as colors, not typography', () => {
  assert.equal(categorise('--text-muted', '140 140 140'), 'colors');
});

test('categorise buckets another text-named RGB-triplet variable as colors, not typography', () => {
  assert.equal(categorise('--text-disabled', '184 184 184'), 'colors');
});

test('categorise still buckets --radius by name when the value shape is inconclusive', () => {
  assert.equal(categorise('--radius', '0.75rem'), 'radii');
});

test('categorise buckets a name already in the colours regex as colors, and an rgb() value confirms it independently', () => {
  // `surface.page: rgb(var(--surface-page) / <alpha-value>)` - the kind of
  // qualified name Fix 3 produces for a nested `colors.surface.page` entry.
  // Both signals (the rgb() value shape, and "surface" in the name) agree
  // on colors, so this must resolve to colors regardless of which one wins.
  assert.equal(categorise('surface.page', 'rgb(var(--surface-page) / <alpha-value>)'), 'colors');
});

test('categorise still buckets --duration-fast by name when the value shape is inconclusive', () => {
  assert.equal(categorise('--duration-fast', '150ms'), 'motion');
});

test('categorise recognises hex colors regardless of name', () => {
  assert.equal(categorise('--brand', '#abc'), 'colors');
  assert.equal(categorise('--brand-2', '#aabbcc'), 'colors');
});

test('categorise recognises hsl()/oklch() colour functions regardless of name', () => {
  assert.equal(categorise('--tone', 'hsl(210 40% 96%)'), 'colors');
  assert.equal(categorise('--tone-2', 'oklch(0.7 0.15 250)'), 'colors');
});

test('discoverTokens buckets --text-muted / --text-disabled RGB triplets as colors end to end', () => {
  const t = discoverTokens(join(FIXTURES, 'fixture-rgb-triplet-colors'));
  assert.ok(t.colors.some((x) => x.name === '--text-muted'), '--text-muted should land in colors');
  assert.ok(t.colors.some((x) => x.name === '--text-disabled'), '--text-disabled should land in colors');
  assert.ok(!t.typography.some((x) => x.name === '--text-muted'), '--text-muted must not land in typography');
  assert.ok(!t.typography.some((x) => x.name === '--text-disabled'), '--text-disabled must not land in typography');
});

test('discoverTokens still buckets a tailwind fontSize clamp() scale entry as typography end to end', () => {
  // fontSize entries are bucketed as typography by TAILWIND_KEYS directly
  // (never via categorise), so this must be unaffected by the colour-shape
  // detection added in categorise for Fix 2.
  const t = discoverTokens(join(FIXTURES, 'fixture-tailwind-nested-scales'));
  const threeXs = t.typography.find((x) => x.name === '3xs');
  assert.ok(threeXs, 'expected 3xs to be discovered as typography');
  assert.equal(threeXs.value, 'clamp(0.625rem, 0.6vw + 0.5rem, 0.6875rem)');
});

test('discoverTokens still buckets a tailwind colors rgb() entry as colors end to end', () => {
  // colors entries are bucketed as colors by TAILWIND_KEYS directly (never
  // via categorise), so an rgb()-wrapped CSS-variable indirection value
  // must stay colors regardless of the Fix 2 change.
  const t = discoverTokens(join(FIXTURES, 'fixture-tailwind-nested-scales'));
  const page = t.colors.find((x) => x.name === 'page');
  assert.ok(page, 'expected page to be discovered as colors');
  assert.equal(page.value, 'rgb(var(--surface-page) / <alpha-value>)');
});

// --- Finding 3: add() under-reports sources -------------------------------

test('discoverTokens records every contributing file in sources, even one whose tokens are all duplicates', () => {
  const t = discoverTokens(join(FIXTURES, 'fixture-dedupe-tokens'));
  const shared = t.colors.filter((x) => x.name === '--color-shared');
  assert.equal(shared.length, 1, 'a duplicate token name must appear once, not once per declaring file');
  // Decision: the earlier-declared value wins (first one encountered in a
  // deterministic, alphabetically-sorted file walk) - later re-declarations
  // of the same name are recorded as sources but do not override the value.
  assert.equal(shared[0].value, '#111111', 'the earlier-declared value should win');
  assert.equal(shared[0].declaredIn, 'a-first.css');
  assert.ok(t.sources.includes('a-first.css'), 'the winning file must be recorded as a source');
  assert.ok(
    t.sources.includes('z-second.css'),
    'a file whose only token turned out to be a duplicate must still be recorded as a source'
  );
});

// --- Sweep Fix 1: React Native theme modules named colors.ts/palette.ts --

test('discoverTokens harvests a plain "export const colors = {...}" object from a file named colors.ts', () => {
  const t = discoverTokens(join(FIXTURES, 'fixture-rn-colors-object'));
  assert.equal(t.empty, false, 'a project whose only design tokens live in constants/colors.ts must not report empty');
  const primary = t.colors.find((x) => x.name === 'primary');
  assert.ok(primary, 'expected a "primary" token bucketed into colors');
  assert.equal(primary.value, '#E8B4C8');
  assert.match(primary.declaredIn, /constants[/\\]colors\.ts$/);
});

test('discoverTokens does not crash and yields no tokens from a colors.ts that only exports a function', () => {
  const t = discoverTokens(join(FIXTURES, 'fixture-rn-colors-function'));
  assert.equal(t.empty, true, 'a colors.ts exporting only a function must not fabricate tokens');
  assert.deepEqual(t.colors, []);
});

// --- Sweep Fix 2: the walk must never read tokens out of a worktree/tool dir

test('discoverTokens skips a .claude worktree copy and never reports it as a source', () => {
  const t = discoverTokens(join(FIXTURES, 'fixture-worktree-skip'));
  assert.ok(t.colors.some((x) => x.name === '--color-real'), 'the real src/ token must still be discovered');
  assert.ok(!t.colors.some((x) => x.name === '--color-ghost'), 'the worktree-copy token must never surface');
  assert.ok(
    !t.sources.some((s) => s.includes('.claude')),
    'sources must never contain a path through a .claude directory'
  );
});

// --- Sweep Fix 3: Tailwind v4 @theme blocks -------------------------------

test('parseCssVars harvests custom properties from a Tailwind v4 @theme block', () => {
  const css = '@theme { --color-primary: #E8B4C8; --radius-lg: 12px; }';
  const vars = parseCssVars(css);
  const primary = vars.find((v) => v.name === '--color-primary');
  const radius = vars.find((v) => v.name === '--radius-lg');
  assert.ok(primary, 'expected --color-primary to be discovered inside @theme');
  assert.equal(primary.value, '#E8B4C8');
  assert.ok(radius, 'expected --radius-lg to be discovered inside @theme');
  assert.equal(radius.value, '12px');
});

test('parseCssVars harvests custom properties from "@theme inline" and "@theme static" blocks', () => {
  const css = `
    @theme inline { --color-inline: #C4627A; }
    @theme static { --color-muted: #999999; }
  `;
  const vars = parseCssVars(css);
  assert.ok(vars.some((v) => v.name === '--color-inline' && v.value === '#C4627A'));
  assert.ok(vars.some((v) => v.name === '--color-muted' && v.value === '#999999'));
});

test('parseCssVars still parses plain :root blocks alongside @theme (no regression)', () => {
  const css = ':root { --color-root: #111111; } @theme { --color-theme: #222222; }';
  const vars = parseCssVars(css);
  assert.ok(vars.some((v) => v.name === '--color-root' && v.value === '#111111'));
  assert.ok(vars.some((v) => v.name === '--color-theme' && v.value === '#222222'));
});

test('parseCssVars does not duplicate a var declared in both :root and @theme', () => {
  const css = ':root { --color-shared: #111111; } @theme { --color-shared: #222222; }';
  const vars = parseCssVars(css);
  const shared = vars.filter((v) => v.name === '--color-shared');
  assert.equal(shared.length, 1, 'the same custom property declared in :root and @theme must not be duplicated');
  assert.equal(shared[0].value, '#111111', 'the earlier-declared (:root) value should win');
});

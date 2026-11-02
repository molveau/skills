import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { detectTells } from '../skills/anti-slop/scripts/detect-tells.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIX = join(HERE, 'fixtures', 'tells');
const SCRIPT = join(HERE, '..', 'skills', 'anti-slop', 'scripts', 'detect-tells.mjs');
const fx = (name, path = `src/${name}`) => ({ path, text: readFileSync(join(FIX, name), 'utf8') });
const tells = (files) => [...new Set(detectTells(files).map((f) => f.tell))].sort((a, b) => a - b);
const EM = String.fromCharCode(0x2014);

const PAIRS = [
  [1, 't01'], [2, 't02'], [3, 't03'], [5, 't05'], [6, 't06'],
  [12, 't12'], [14, 't14'], [16, 't16'], [17, 't17'],
];
for (const [n, id] of PAIRS) {
  test(`tell ${n}: positive fixture is flagged`, () => {
    assert.ok(tells([fx(`${id}.pos.tsx`)]).includes(n));
  });
  test(`tell ${n}: negative fixture is clean`, () => {
    assert.ok(!tells([fx(`${id}.neg.tsx`)]).includes(n), JSON.stringify(detectTells([fx(`${id}.neg.tsx`)])));
  });
}

test('tell 2 needs a gradient next to bg-clip-text', () => {
  assert.ok(!tells([{ path: 'a.tsx', text: '<h1 className="bg-clip-text">x</h1>' }]).includes(2));
});

test('tell 5: classes and inline styles, only widths above 1px', () => {
  const f = detectTells([fx('t05.pos.tsx')]).filter((x) => x.tell === 5);
  assert.equal(f.length, 2);
  assert.ok(tells([{ path: 'a.css', text: '.a { border-left: 3px solid red; }' }]).includes(5));
  assert.ok(!tells([{ path: 'a.css', text: '.a { border-left: 1px solid red; }' }]).includes(5));
});

test('tell 6 in css: backdrop-filter without sticky or fixed in the rule', () => {
  assert.ok(tells([{ path: 'a.css', text: '.card { backdrop-filter: blur(8px); }' }]).includes(6));
  assert.ok(!tells([{ path: 'a.css', text: '.bar { position: sticky; backdrop-filter: blur(8px); }' }]).includes(6));
});

test('tell 10: lucide-react outside components/icons only', () => {
  assert.ok(tells([fx('t10.tsx', 'app/page.tsx')]).includes(10));
  assert.ok(!tells([fx('t10.tsx', 'components/icons/index.tsx')]).includes(10));
  assert.ok(!tells([fx('t10.tsx', 'components/icons.tsx')]).includes(10));
});

test('tell 19 needs both fonts in the scanned set', () => {
  assert.ok(tells([fx('t19.a.tsx'), fx('t19.b.tsx')]).includes(19));
  assert.ok(!tells([fx('t19.a.tsx')]).includes(19));
  assert.ok(!tells([fx('t19.b.tsx')]).includes(19));
});

test('tell 16: JSX text, string and JSON value are flagged; code is not', () => {
  const f = detectTells([fx('t16.pos.tsx')]).filter((x) => x.tell === 16);
  assert.deepEqual(f.map((x) => x.line), [1, 2]);
  assert.ok(tells([{ path: 'm.json', text: `{ "title": "A ${EM} B" }` }]).includes(16));
  assert.equal(detectTells([fx('t16.neg.tsx')]).filter((x) => x.tell === 16).length, 0);
});

test('tell 16 in markdown: prose yes, code span and fence no', () => {
  const md = ['Prose A ' + EM + ' B', 'Code `a ' + EM + ' b` here', '```js', 'x ' + EM + ' y', '```'].join('\n');
  const f = detectTells([{ path: 'a.md', text: md }]).filter((x) => x.tell === 16);
  assert.deepEqual(f.map((x) => x.line), [1]);
});

test('findings carry path, line, tell, label, match', () => {
  const [f] = detectTells([fx('t14.pos.tsx')]);
  assert.deepEqual(Object.keys(f).sort(), ['label', 'line', 'match', 'path', 'tell']);
  assert.equal(f.line, 1);
  assert.equal(f.tell, 14);
});

function cli(args, cwd) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', cwd });
}

test('CLI exit codes: 0 clean, 1 findings, 2 usage', () => {
  assert.equal(cli([join(FIX, 't01.neg.tsx')]).status, 0);
  assert.equal(cli([join(FIX, 't01.pos.tsx')]).status, 1);
  assert.equal(cli([]).status, 2);
  assert.equal(cli(['--nope', FIX]).status, 2);
  assert.equal(cli([join(FIX, 'does-not-exist')]).status, 2);
});

test('CLI --json prints findings array', () => {
  const r = cli(['--json', join(FIX, 't14.pos.tsx')]);
  const data = JSON.parse(r.stdout);
  assert.ok(Array.isArray(data) && data[0].tell === 14);
});

test('CLI skips build folders and test files by default', () => {
  const d = mkdtempSync(join(tmpdir(), 'tells-'));
  const bad = '<div className="hover:opacity-80" />';
  for (const dir of ['node_modules/x', '.next', 'dist', 'build', '.open-next', 'coverage', '.git', 'src']) {
    mkdirSync(join(d, dir), { recursive: true });
    writeFileSync(join(d, dir, 'a.tsx'), bad);
  }
  writeFileSync(join(d, 'src', 'a.test.tsx'), bad);
  const r = cli(['--json', d]);
  const paths = JSON.parse(r.stdout).map((f) => f.path.replace(/\\/g, '/'));
  assert.deepEqual([...new Set(paths)], [join(d, 'src', 'a.tsx').replace(/\\/g, '/')]);
  const r2 = cli(['--json', '--include-tests', d]);
  assert.equal(new Set(JSON.parse(r2.stdout).map((f) => f.path)).size, 2);
});

const tsx = (text) => ({ path: 'a.tsx', text });

test('tell 6: multi-line cn(...) with sticky is clean, without it is flagged', () => {
  const ok = 'const a = cn(\n  "rounded",\n  "backdrop-blur-md",\n  "sticky top-0",\n);';
  const bad = 'const a = cn(\n  "rounded",\n  "backdrop-blur-md",\n  "p-4",\n);';
  assert.ok(!tells([tsx(ok)]).includes(6));
  assert.ok(tells([tsx(bad)]).includes(6));
  const jsx = '<div\n  className="rounded\n    backdrop-blur-md\n    fixed top-0"\n/>';
  assert.ok(!tells([tsx(jsx)]).includes(6));
});

test('tell 5: JS style objects', () => {
  assert.ok(tells([tsx('const s = { borderLeftWidth: 4 };')]).includes(5));
  assert.ok(tells([tsx("const s = { borderLeft: '4px solid red' };")]).includes(5));
  assert.ok(!tells([tsx('const s = { borderLeftWidth: 1 };')]).includes(5));
});

test('tell 2 in css: gradient must be in the same rule', () => {
  const apart = '.a { background-clip: text; }\n.b { background: linear-gradient(red, blue); }';
  const same = '.a { background: linear-gradient(red, blue); -webkit-background-clip: text; background-clip: text; }';
  assert.ok(!tells([{ path: 'a.css', text: apart }]).includes(2));
  assert.ok(tells([{ path: 'a.css', text: same }]).includes(2));
});

test('tell 17: copy only, not identifiers', () => {
  assert.ok(!tells([tsx('const elevate = () => {};\nexport default elevate;')]).includes(17));
  assert.ok(!tells([tsx('elevate(card);\nconst unlock = 1;')]).includes(17));
  assert.ok(tells([tsx('const t = "Unlock your data";')]).includes(17));
  assert.ok(tells([tsx('<p>Effortless setup</p>')]).includes(17));
  assert.ok(tells([{ path: 'a.md', text: 'We make it seamless.' }]).includes(17));
});

// Shared with the MCP server and the hook, so they scan and report exactly like the CLI.
test('isScannable and SKIP_DIRS match what the CLI walks', async () => {
  const { isScannable, SKIP_DIRS } = await import('../skills/anti-slop/scripts/detect-tells.mjs');
  assert.ok(isScannable('src/app.tsx', 10, false));
  assert.ok(!isScannable('src/app.test.tsx', 10, false));
  assert.ok(isScannable('src/app.test.tsx', 10, true));
  assert.ok(!isScannable('src/types.d.ts', 10, false));
  assert.ok(!isScannable('src/app.min.js', 10, false));
  assert.ok(!isScannable('package-lock.json', 10, false));
  assert.ok(!isScannable('src/app.py', 10, false));
  assert.ok(!isScannable('src/big.css', 1_000_001, false));
  for (const d of ['node_modules', '.git', '.next', 'dist', 'build', 'coverage']) assert.ok(SKIP_DIRS.has(d));
});

test('formatFindings prints the CLI lines and summary', async () => {
  const { formatFindings } = await import('../skills/anti-slop/scripts/detect-tells.mjs');
  const findings = detectTells([{ path: 'a.tsx', text: `<p>Fast ${EM} simple</p>\n` }]);
  const text = formatFindings(findings, 1);
  assert.match(text, /^a\.tsx:1 {2}#16 Em dash in copy {2}/m);
  assert.match(text, /^1 finding\(s\) in 1 file\(s\) \(1 scanned; #16 1\)$/m);
  assert.equal(formatFindings([], 3), '0 finding(s) in 0 file(s) (3 scanned)\n');
});

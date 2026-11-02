import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { frTypo, fixFr, checkFr, scanText, fixText } from '../skills/french-typography/scripts/fr-typo.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'skills', 'french-typography', 'scripts', 'fr-typo.mjs');
const NB = ' ';
const NN = ' ';

test('frTypo: thousands, currency and punctuation spacing', () => {
  assert.equal(frTypo('Dès 1 900 $ : prix'), `Dès${NB}1${NN}900${NB}$${NB}: prix`);
});
test('frTypo: idempotent', () => {
  const x = 'Dès 1 900 $ : prix ; « oui » ! vraiment ? 12 345 678 $';
  assert.equal(frTypo(frTypo(x)), frTypo(x));
});
test('frTypo: lone ?, multiple groups, guillemets', () => {
  assert.equal(frTypo('?'), '?');
  assert.equal(frTypo('12 345 678 $'), `12${NN}345${NN}678${NB}$`);
  assert.equal(frTypo('« oui »'), `«${NB}oui${NB}»`);
});
test('frTypo: leaves URLs, times and ICU placeholders alone (Review Focus 4)', () => {
  for (const s of ['https://molveau.ca/fr', 'Rendez-vous à 10:30', '{count} projets, {amount}']) assert.equal(frTypo(s), s);
});
test('frTypo: does not merge unrelated numbers', () => {
  assert.equal(frTypo('2 pages'), '2 pages');
  assert.equal(frTypo('1 2345'), '1 2345');
});
test('frTypo: leaves phone numbers alone, still groups prices', () => {
  for (const s of ['514 555-1234', '(514) 555-1234', '1-514 555-1234']) assert.equal(frTypo(s), s);
  assert.equal(frTypo('1 900 $'), `1${NN}900${NB}$`);
  assert.equal(frTypo('12 500 000'), `12${NN}500${NN}000`);
});
test('frTypo: never inserts a missing space', () => {
  assert.equal(frTypo('Prix: 5'), 'Prix: 5');
  assert.equal(frTypo('1900 $'), '1900 $'.replace(' ', NB));
});

// Port of the molveau-studio copy guard walker.
function collect(value, path, out = []) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => collect(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) collect(v, `${path}.${k}`, out);
  return out;
}
function copyViolations(messages, namespaces, locale) {
  const problems = [];
  for (const ns of namespaces) {
    const node = ns.split('.').reduce((n, k) => n?.[k], messages);
    if (node === undefined) { problems.push(`${ns}: namespace missing`); continue; }
    for (const [path, s] of collect(node, ns)) {
      const rules = checkFr(s).map((f) => f.rule);
      if (rules.includes('em-dash')) problems.push(`${path}: em dash`);
      if (locale === 'fr' && s !== frTypo(s)) problems.push(`${path}: French typography`);
    }
  }
  return problems;
}
test('copy guard: compliant French passes', () => {
  assert.deepEqual(copyViolations({ a: { title: `Dès${NB}1${NN}900${NB}$${NB}: prix` } }, ['a'], 'fr'), []);
});
test('copy guard: em dash, plain-space prices, nesting, namespaces', () => {
  assert.equal(copyViolations({ a: { t: 'un — deux' } }, ['a'], 'fr').length, 1);
  assert.equal(copyViolations({ a: { t: 'one — two' } }, ['a'], 'en').length, 1);
  assert.equal(copyViolations({ a: { t: '1 900 $' } }, ['a'], 'fr').length, 1);
  assert.deepEqual(copyViolations({ a: { t: '1 900 $' } }, ['a'], 'en'), []);
  assert.deepEqual(copyViolations({ a: { b: { items: ['ok', { q: 'mal — dit' }] } } }, ['a.b'], 'fr'), ['a.b.items[1].q: em dash']);
  assert.deepEqual(copyViolations({ a: { t: 'x — y' }, b: { t: 'ok' } }, ['b'], 'fr'), []);
  assert.deepEqual(copyViolations({}, ['z'], 'fr'), ['z: namespace missing']);
});

const rulesOf = (s) => checkFr(s).map((f) => f.rule);
test('checkFr: each rule fires on plain-space text', () => {
  assert.ok(rulesOf('Prix : 5').includes('high-punct'));
  assert.ok(rulesOf('Vraiment ?').includes('high-punct'));
  assert.ok(rulesOf('1 900').includes('thousands'));
  assert.ok(rulesOf('5 $').includes('currency'));
  assert.ok(rulesOf('« oui »').includes('guillemets'));
  assert.ok(rulesOf('un — deux').includes('em-dash'));
  assert.ok(rulesOf("l'analyse").includes('straight-apostrophe'));
});
test('checkFr: correct text and Review Focus 4 cases are clean', () => {
  for (const s of [
    `Prix${NB}: 5`, `1${NN}900${NB}$`, `«${NB}oui${NB}»`, 'l’analyse', 'https://molveau.ca/fr',
    'Rendez-vous à 10:30', '{count} projets', '514 555-1234', '(514) 555-1234', '1-514 555-1234', '2 pages', '',
  ]) assert.deepEqual(checkFr(s), [], s);
});
test('checkFr: reports index and match', () => {
  const f = checkFr("a l'b");
  assert.deepEqual(f, [{ index: 2, rule: 'straight-apostrophe', match: "l'b" }]);
});
test('checkFr: findings vanish after frTypo except em dash and apostrophe', () => {
  const s = 'Dès 1 900 $ : prix ; « oui » ! — l\'ami';
  const left = checkFr(frTypo(s)).map((f) => f.rule).sort();
  assert.deepEqual(left, ['em-dash', 'straight-apostrophe']);
  assert.deepEqual(checkFr(fixFr(s)).map((f) => f.rule), ['em-dash']);
});

test('scanText: markdown skips code, JSON checks values not keys', () => {
  const md = 'Texte : oui\n\n`a : b` et\n\n```\nc : d\n```\n';
  const f = scanText('a.md', md);
  assert.deepEqual(f.map((x) => [x.line, x.rule]), [[1, 'high-punct']]);
  const json = '{\n  "a : b": "ok",\n  "t": "Vraiment ?"\n}\n';
  assert.deepEqual(scanText('m.json', json).map((x) => [x.line, x.rule]), [[3, 'high-punct']]);
});
test('fixText: json values only, formatting preserved, idempotent', () => {
  const json = '{\n  "a : b": "Dès 1 900 $",\n  "n": 12\n}\n';
  const out = fixText('m.json', json);
  assert.equal(out, `{\n  "a : b": "Dès${NB}1${NN}900${NB}$",\n  "n": 12\n}\n`);
  assert.equal(fixText('m.json', out), out);
});
test('fixText: markdown prose only', () => {
  const md = 'Vraiment ? `x ?`\n\n```\ny ?\n```\n[l](https://a.b/c?d) 10:30\n';
  const out = fixText('a.md', md);
  assert.equal(out, `Vraiment${NB}? \`x ?\`\n\n\`\`\`\ny ?\n\`\`\`\n[l](https://a.b/c?d) 10:30\n`);
  assert.equal(fixText('a.md', out), out);
});

function run(args) {
  const r = spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
test('CLI: exit codes, --json, --fix, skip dirs', () => {
  const dir = mkdtempSync(join(tmpdir(), 'frt-'));
  mkdirSync(join(dir, 'node_modules'));
  writeFileSync(join(dir, 'node_modules', 'x.md'), 'Vraiment ?\n');
  writeFileSync(join(dir, 'ok.md'), `Vraiment${NB}?\n`);
  assert.equal(run(['--check', dir]).code, 0);
  writeFileSync(join(dir, 'bad.md'), 'Vraiment ?\n');
  const r = run(['--check', '--json', dir]);
  assert.equal(r.code, 1);
  const j = JSON.parse(r.out);
  assert.equal(j.length, 1);
  assert.equal(j[0].rule, 'high-punct');
  assert.match(j[0].path, /bad\.md$/);
  assert.equal(run(['--fix', join(dir, 'bad.md')]).code, 0);
  assert.equal(readFileSync(join(dir, 'bad.md'), 'utf8'), `Vraiment${NB}?\n`);
  assert.equal(run([]).code, 2);
  assert.equal(run(['--check', '--fix', dir]).code, 2);
  assert.equal(run(['--check', join(dir, 'missing.md')]).code, 2);
  writeFileSync(join(dir, 'dash.md'), 'un — deux\n');
  assert.equal(run(['--fix', join(dir, 'dash.md')]).code, 1);
});

test('apostrophes: fixFr curls letter-letter only, leaves ICU, URLs and code alone', () => {
  assert.equal(fixFr("l'analyse"), 'l’analyse');
  assert.equal(fixFr("{n, plural, one {l'ami} other {d'amis}}"), '{n, plural, one {l’ami} other {d’amis}}');
  for (const s of ["'{'", "Une accolade '{' ouverte", "'{count}'", "d'{count}", 'https://o\'reilly.com/x', "rock 'n' roll"]) assert.equal(fixFr(s), s, s);
  assert.deepEqual(checkFr("'{'"), []);
  assert.deepEqual(checkFr('https://o\'reilly.com'), []);
});
test('apostrophes: --fix on markdown and JSON, code span untouched', () => {
  assert.equal(fixText('a.md', "L'ami `l'x` et l'autre\n"), 'L’ami `l\'x` et l’autre\n');
  assert.equal(fixText('m.json', '{"l\'k": "l\'analyse \'{\'"}'), '{"l\'k": "l’analyse \'{\'"}');
});
test('percent: nbsp before % after a number', () => {
  assert.equal(frTypo('3,5 %'), `3,5${NB}%`);
  assert.equal(frTypo(frTypo('50 %')), `50${NB}%`);
  assert.equal(frTypo('100%'), '100%');
  assert.ok(rulesOf('3,5 %').includes('percent'));
  assert.deepEqual(checkFr(`3,5${NB}%`), []);
});
test('fences: a longer opener is not closed by a shorter fence line (check and fix agree)', () => {
  const md = '````md\n```\nVraiment ?\n```\nencore ?\n````\nVraiment ?\n';
  assert.deepEqual(scanText('a.md', md).map((f) => f.line), [7]);
  assert.equal(fixText('a.md', md), '````md\n```\nVraiment ?\n```\nencore ?\n````\nVraiment' + NB + '?\n');
});

test('visible shows the two no-break spaces by name', async () => {
  const { visible } = await import('../skills/french-typography/scripts/fr-typo.mjs');
  assert.equal(visible(`a${NB}b${NN}c d`), 'a<nbsp>b<nnbsp>c d');
});

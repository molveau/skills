import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, mkdtempSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { RULES, EXTS, detectLang, checkWriting, scanText, formatFindings } from '../skills/writing/scripts/check-writing.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'skills', 'writing', 'scripts', 'check-writing.mjs');
const FIX = join(HERE, 'fixtures', 'writing');
const DASH = '—';
const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
const rulesOf = (text, opts) => checkWriting(text, opts).map((f) => f.rule);

test('RULES lists the eleven rule ids in order', () => {
  assert.deepEqual(RULES, [
    'transition-opener', 'scene-setting', 'hedging', 'inflated', 'listing-words', 'cliche-conclusion',
    'buzzword-verb', 'em-dash', 'not-x-but-y', 'whether-you', 'chat-filler',
  ]);
  assert.ok(EXTS.has('.md') && EXTS.has('.json') && EXTS.has('.txt') && EXTS.has('.mdx'));
});

test('detectLang tells English from French', () => {
  assert.equal(detectLang('The report is ready and the team can review it.'), 'en');
  assert.equal(detectLang('Le rapport est prêt et l’équipe peut le relire.'), 'fr');
});

const EN = {
  'transition-opener': 'It is important to note that the API is slow.',
  'scene-setting': "In today's fast-paced world, teams ship daily.",
  hedging: 'Research suggests this works.',
  inflated: 'This step is absolutely essential.',
  'listing-words': 'First and foremost, install it.',
  'cliche-conclusion': 'In conclusion, it works.',
  'buzzword-verb': 'We leverage the cache.',
  'em-dash': `Speed${DASH}the main goal.`,
  'not-x-but-y': "It's not a tool, it's a habit.",
  'whether-you': "Whether you're a designer or a developer, read on.",
  'chat-filler': 'I hope this helps.',
};
const FR = {
  'transition-opener': 'Il est important de noter que l’API est lente.',
  'scene-setting': 'Dans un monde en constante évolution, tout change.',
  hedging: 'Il semblerait que cela fonctionne.',
  inflated: 'Cette étape est incontournable.',
  'listing-words': 'En premier lieu, installez-le.',
  'cliche-conclusion': 'En conclusion, ça marche.',
  'buzzword-verb': 'Il faut booster les ventes.',
  'em-dash': `La vitesse${DASH}le but.`,
  'not-x-but-y': 'Ce n’est pas un outil, c’est une habitude.',
  'whether-you': 'Que vous soyez designer ou développeur, lisez la suite.',
  'chat-filler': 'N’hésitez pas à m’écrire.',
};

for (const [lang, table] of [['en', EN], ['fr', FR]]) {
  for (const rule of RULES) {
    test(`${lang}: ${rule} gives exactly one finding`, () => {
      for (const opts of [undefined, { lang }]) {
        const found = checkWriting(table[rule], opts);
        assert.equal(found.length, 1, JSON.stringify(found));
        assert.equal(found[0].rule, rule);
        assert.equal(found[0].lang, lang);
      }
    });
  }
}

test('both apostrophes match', () => {
  assert.deepEqual(rulesOf('It’s not a tool, it’s a habit.'), ['not-x-but-y']);
  assert.deepEqual(rulesOf("It's not a tool, it's a habit."), ['not-x-but-y']);
  assert.deepEqual(rulesOf("N'hésitez pas à m'écrire."), ['chat-filler']);
  assert.deepEqual(rulesOf('N’hésitez pas à m’écrire.'), ['chat-filler']);
});

test('findings are sorted and carry index and match', () => {
  const text = 'I hope this helps. In conclusion, it works.';
  const found = checkWriting(text);
  assert.deepEqual(found.map((f) => f.rule), ['chat-filler', 'cliche-conclusion']);
  for (const f of found) assert.equal(text.slice(f.index, f.index + f.match.length).toLowerCase(), f.match.toLowerCase());
});

test('listing-words counts connectors only from three at sentence starts', () => {
  assert.equal(rulesOf('Additionally, it is fast.').length, 0);
  const en = 'Additionally, it is fast. Furthermore, it is small. Moreover, it is free.';
  assert.deepEqual(rulesOf(en), ['listing-words', 'listing-words', 'listing-words']);
  assert.equal(rulesOf('De plus, c’est rapide.').length, 0);
  const fr = 'De plus, c’est rapide. En outre, c’est léger.\nPar ailleurs, c’est libre.';
  assert.deepEqual(rulesOf(fr), ['listing-words', 'listing-words', 'listing-words']);
  assert.equal(rulesOf('It is fast, additionally it is small, furthermore free, moreover safe.').length, 0);
});

test('matching is by whole word', () => {
  assert.equal(rulesOf('He delved into it.').filter((r) => r === 'buzzword-verb').length, 0);
  assert.ok(checkWriting("Let's delve into it.").length >= 1);
  assert.equal(rulesOf('The harnessed cable is fine.').length, 0);
});

test('French dialogue dash at the start of a line is allowed', () => {
  assert.equal(rulesOf(`${DASH} Bonjour, dit-elle.`, { lang: 'fr' }).filter((r) => r === 'em-dash').length, 0);
  assert.equal(rulesOf(`Elle entre dans la salle.\n${DASH} Bonjour, dit-elle.\n${DASH} Salut, dit-il.`).filter((r) => r === 'em-dash').length, 0);
  assert.equal(rulesOf(`La vitesse ${DASH} le but.`, { lang: 'fr' }).filter((r) => r === 'em-dash').length, 1);
  assert.equal(rulesOf(`${DASH} The point.`, { lang: 'en' }).filter((r) => r === 'em-dash').length, 1);
});

test('scanText skips Markdown code and reads only JSON values', () => {
  const md = [
    'Plain prose here.', '', '```', 'In conclusion, done.', '```', '', '    In conclusion, done.', '',
    'Inline `In conclusion, done.` span.', '',
  ].join('\n');
  assert.deepEqual(scanText(md, 'a.md'), []);
  assert.equal(scanText('In conclusion, done.', 'a.txt').length, 1);
  const json = '{"a": "In conclusion, done.", "In conclusion": "x"}';
  const found = scanText(json, 'a.json');
  assert.equal(found.length, 1);
  assert.equal(found[0].rule, 'cliche-conclusion');
  assert.equal(found[0].path, 'a.json');
});

test('scanText gives line and column', () => {
  const [f] = scanText('First line.\n  I hope this helps.\n', 'a.md');
  assert.deepEqual([f.line, f.column, f.rule, f.match], [2, 3, 'chat-filler', 'I hope this helps']);
});

test('formatFindings prints lines then a count', () => {
  const out = formatFindings(scanText('I hope this helps.\n', 'a.md'), 1);
  assert.match(out, /^a\.md:1:1 chat-filler "I hope this helps"$/m);
  assert.match(out, /1 finding\(s\) in 1 file\(s\)\n$/);
});

test('fixtures: clean prose gives zero, tells cover every rule', () => {
  for (const name of ['clean.en.md', 'clean.fr.md']) {
    assert.deepEqual(scanText(readFileSync(join(FIX, name), 'utf8'), name), [], name);
  }
  // The em dash is covered by the in-test strings above: validate.test.mjs bans it in every .md file.
  for (const name of ['tells.en.md', 'tells.fr.md']) {
    const rules = new Set(scanText(readFileSync(join(FIX, name), 'utf8'), name).map((f) => f.rule));
    for (const rule of RULES.filter((r) => r !== 'em-dash')) assert.ok(rules.has(rule), `${name} lacks ${rule}`);
  }
});

test('CLI: usage and exit codes', () => {
  const help = run('--help');
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage/);
  assert.equal(run().status, 2);
  assert.equal(run('--nope', join(FIX, 'clean.en.md')).status, 2);
  assert.equal(run('--lang', 'de', join(FIX, 'clean.en.md')).status, 2);
  assert.equal(run(join(FIX, 'missing.md')).status, 2);
  const clean = run(join(FIX, 'clean.en.md'));
  assert.equal(clean.status, 0, clean.stdout);
  assert.match(clean.stdout, /0 finding\(s\) in 1 file\(s\)/);
  const tells = run(join(FIX, 'tells.en.md'));
  assert.equal(tells.status, 1);
  assert.match(tells.stdout, /chat-filler/);
});

test('CLI: --json prints a parseable array, --lang forces a language', () => {
  const r = run('--json', join(FIX, 'tells.fr.md'));
  assert.equal(r.status, 1);
  const items = JSON.parse(r.stdout);
  assert.ok(Array.isArray(items) && items.length >= 10);
  for (const it of items) for (const k of ['path', 'line', 'column', 'rule', 'match', 'lang']) assert.ok(k in it, k);
  const forced = JSON.parse(run('--lang=en', '--json', join(FIX, 'tells.fr.md')).stdout);
  assert.ok(forced.every((i) => i.lang === 'en'));
});

test('CRLF Markdown masks fenced code, indented code and inline spans like LF', () => {
  const crlf = 'Intro.\r\n\r\n```\r\nIn conclusion\r\n```\r\n\r\n    In conclusion\r\n\r\nInline `In conclusion` span.\r\n\r\nIn conclusion, done.\r\n';
  const found = scanText(crlf, 'a.md');
  assert.equal(found.length, 1);
  assert.equal(found[0].line, 11);
  assert.equal(found[0].column, 1);
  assert.deepEqual(scanText(crlf.replace(/\r\n/g, '\n'), 'a.md').map((f) => f.line), [11]);
});

test('language detection uses stopwords only, so accents do not flip English', () => {
  const a = checkWriting('Feel free to email Hélène.');
  assert.deepEqual(a.map((f) => [f.rule, f.lang]), [['chat-filler', 'en']]);
  const b = checkWriting("Leverage Québec's Société des alcools data.");
  assert.deepEqual(b.map((f) => [f.rule, f.lang]), [['buzzword-verb', 'en']]);
});

test('auto language is detected per paragraph', () => {
  const text = 'Le rapport est prêt.\n\nIn conclusion, it works.';
  const found = checkWriting(text);
  assert.equal(found.length, 1);
  assert.equal(found[0].rule, 'cliche-conclusion');
  assert.equal(found[0].lang, 'en');
  assert.equal(found[0].index, text.indexOf('In conclusion'));
  const both = 'En conclusion, le rapport est prêt pour les clients.\r\n \r\nIn conclusion, it is ready for the team.';
  const f2 = checkWriting(both);
  assert.deepEqual(f2.map((f) => [f.rule, f.lang]), [['cliche-conclusion', 'fr'], ['cliche-conclusion', 'en']]);
  assert.equal(f2[1].index, both.indexOf('In conclusion'));
  const forced = checkWriting(text, { lang: 'fr' });
  assert.ok(forced.every((f) => f.lang === 'fr'));
});

test('listing-words threshold is counted per paragraph', () => {
  const split = 'Additionally, it is fast. Furthermore, it is small.\n\nMoreover, it is free.';
  assert.equal(rulesOf(split).length, 0);
  const one = 'Additionally, it is fast.\n\nFurthermore, it is small.\n\nMoreover, it is free.';
  assert.equal(rulesOf(one).length, 0);
});

test('lang option is validated', () => {
  assert.throws(() => checkWriting('Hello.', { lang: 'de' }), /lang must be auto, en or fr/);
  assert.throws(() => scanText('Hello.', 'a.md', { lang: 'de' }), /lang must be auto, en or fr/);
});

test('French inflated: "de pointe" needs a technology word, not rush hour', () => {
  assert.equal(rulesOf('On évite les heures de pointe.', { lang: 'fr' }).filter((r) => r === 'inflated').length, 0);
  assert.equal(rulesOf('Une solution de pointe.', { lang: 'fr' }).filter((r) => r === 'inflated').length, 1);
});

test('whole-word matching: listed forms only, accented boundaries respected', () => {
  assert.equal(rulesOf('We leveraged it.', { lang: 'en' }).length, 0);
  assert.equal(rulesOf('We leverage it.', { lang: 'en' }).length, 1);
  assert.equal(rulesOf('Il le fait primordialement.', { lang: 'fr' }).filter((r) => r === 'inflated').length, 0);
  assert.equal(rulesOf('C’est primordial.', { lang: 'fr' }).filter((r) => r === 'inflated').length, 1);
});

test('CLI exits 2 when a file cannot be read', { skip: process.getuid?.() === 0 }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'cw-'));
  const file = join(dir, 'locked.md');
  writeFileSync(file, 'Hello.\n');
  chmodSync(file, 0o000);
  try {
    const r = run(file);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /check-writing: cannot read /);
  } finally {
    chmodSync(file, 0o600);
    rmSync(dir, { recursive: true, force: true });
  }
});

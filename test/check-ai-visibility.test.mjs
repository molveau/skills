import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { checkSite, AI_CRAWLERS, botAllowed } from '../skills/local-ai-visibility/scripts/check-ai-visibility.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'skills', 'local-ai-visibility', 'scripts', 'check-ai-visibility.mjs');
const fx = (n) => readFileSync(join(HERE, 'fixtures', 'ai-visibility', n), 'utf8');
const failed = (findings) => findings.filter((f) => !f.ok).map((f) => f.rule);
const by = (findings, rule) => findings.filter((f) => f.rule === rule);

test('a good site has no finding', () => {
  const f = checkSite({ robotsTxt: fx('good-robots.txt'), llmsTxt: fx('llms.txt'), html: fx('good.html'), url: 'https://example.com/' });
  assert.deepEqual(failed(f), []);
  for (const b of AI_CRAWLERS) assert.ok(f.some((x) => x.rule === `robots:${b}` && x.ok), b);
});

test('the crawler list names the nine bots', () => {
  assert.deepEqual(AI_CRAWLERS, ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Google-Extended', 'ClaudeBot', 'Claude-SearchBot', 'Applebot-Extended', 'Bingbot']);
});

test('a GPTBot group with Disallow: / blocks GPTBot only', () => {
  const f = checkSite({ robotsTxt: fx('blocks-gptbot-robots.txt'), llmsTxt: 'x', html: fx('good.html') });
  assert.deepEqual(failed(f), ['robots:GPTBot']);
});

test('User-agent: * with Disallow: / blocks every crawler', () => {
  const f = checkSite({ robotsTxt: fx('blocks-all-robots.txt'), llmsTxt: 'x', html: fx('good.html') });
  assert.equal(failed(f).filter((r) => r.startsWith('robots:')).length, AI_CRAWLERS.length);
});

test('a specific group overrides the star group, and an empty Disallow allows', () => {
  assert.equal(botAllowed('User-agent: *\nDisallow: /\n\nUser-agent: gptbot\nAllow: /\n', 'GPTBot'), true);
  assert.equal(botAllowed('User-agent: GPTBot\nDisallow:\n', 'GPTBot'), true);
  assert.equal(botAllowed('User-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /\n', 'ClaudeBot'), false);
  assert.equal(botAllowed('User-agent: *\nDisallow: /private\n', 'GPTBot'), true);
  assert.equal(botAllowed('# nothing\n', 'GPTBot'), true);
});

test('a missing robots.txt is a finding', () => {
  const f = checkSite({ robotsTxt: null, llmsTxt: 'x', html: fx('good.html') });
  assert.deepEqual(failed(f), ['robots.txt']);
});

test('llms.txt missing or empty is a finding', () => {
  assert.deepEqual(failed(checkSite({ robotsTxt: fx('good-robots.txt'), llmsTxt: null, html: fx('good.html') })), ['llms.txt']);
  assert.deepEqual(failed(checkSite({ robotsTxt: fx('good-robots.txt'), llmsTxt: '  \n', html: fx('good.html') })), ['llms.txt']);
});

test('each missing JSON-LD field is reported', () => {
  const f = checkSite({ robotsTxt: fx('good-robots.txt'), llmsTxt: 'x', html: fx('missing-fields.html') });
  assert.deepEqual(failed(f), ['jsonld:address', 'jsonld:telephone', 'jsonld:hours', 'jsonld:price', 'jsonld:sameAs']);
});

test('invalid JSON-LD is one finding, not a crash', () => {
  const f = checkSite({ robotsTxt: fx('good-robots.txt'), llmsTxt: 'x', html: fx('invalid-jsonld.html') });
  assert.deepEqual(failed(f), ['jsonld']);
  assert.match(by(f, 'jsonld')[0].detail, /parse|JSON/i);
});

test('no JSON-LD at all is one finding', () => {
  const f = checkSite({ robotsTxt: fx('good-robots.txt'), llmsTxt: 'x', html: fx('bare.html') });
  assert.ok(failed(f).includes('jsonld'));
  assert.ok(failed(f).includes('title'));
  assert.ok(failed(f).includes('meta-description'));
});

test('a wrong @type is reported, a family type and @graph are accepted', () => {
  const wrap = (j) => `<html lang="en"><head><title>t</title><meta name="description" content="d"><script type="application/ld+json">${JSON.stringify(j)}</script></head></html>`;
  const f1 = checkSite({ robotsTxt: '', llmsTxt: 'x', html: wrap({ '@type': 'Organization', name: 'a' }) });
  assert.ok(failed(f1).includes('jsonld'));
  const full = { '@type': ['Dentist'], name: 'a', url: 'u', telephone: '1', address: 'x', openingHours: 'Mo 9-5', offers: {}, sameAs: ['y'] };
  const f2 = checkSite({ robotsTxt: '', llmsTxt: 'x', html: wrap({ '@graph': [{ '@type': 'WebSite' }, full] }) });
  assert.deepEqual(failed(f2), []);
});

test('hreflang: single language is ok, a second-language site without alternates is not', () => {
  const single = checkSite({ robotsTxt: '', llmsTxt: 'x', html: fx('missing-fields.html') });
  const h = by(single, 'hreflang')[0];
  assert.equal(h.ok, true);
  assert.equal(h.detail, 'single language');
  const noLang = checkSite({ robotsTxt: '', llmsTxt: 'x', html: fx('bare.html') });
  assert.equal(by(noLang, 'hreflang')[0].ok, true);
  const alt = '<html lang="fr"><head></head><body><a hreflang="en" href="/en">English</a></body></html>';
  assert.equal(by(checkSite({ robotsTxt: '', llmsTxt: 'x', html: alt }), 'hreflang')[0].ok, false);
});

test('CLI exits 2 on usage error and on an unreachable page, with a message', () => {
  const none = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' });
  assert.equal(none.status, 2);
  assert.match(none.stderr, /Usage/);
  const bad = spawnSync(process.execPath, [SCRIPT, 'http://127.0.0.1:1/'], { encoding: 'utf8' });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /Cannot fetch/);
  const notUrl = spawnSync(process.execPath, [SCRIPT, 'not a url'], { encoding: 'utf8' });
  assert.equal(notUrl.status, 2);
});

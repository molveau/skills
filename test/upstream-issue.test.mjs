import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderIssue, TITLE } from '../scripts/upstream-issue.mjs';

const sources = [
  { id: 'emil', repo: 'emilkowalski/skills' },
  { id: 'gsap', repo: 'greensock/gsap-skills' },
];
const A = 'a'.repeat(40);
const B = 'b'.repeat(40);

test('returns null only when nothing moved and nothing failed', () => {
  assert.equal(renderIssue([{ id: 'emil', pinned: A, latest: A, moved: false }], sources), null);
  assert.equal(renderIssue([], sources), null);
});

test('lists moved sources with short SHAs, repo and compare links', () => {
  const body = renderIssue(
    [{ id: 'emil', pinned: A, latest: B, moved: true }, { id: 'gsap', pinned: A, latest: A, moved: false }],
    sources,
  );
  assert.ok(body.includes('`emil`'));
  assert.ok(body.includes('`aaaaaaa` → `bbbbbbb`'));
  assert.ok(body.includes('https://github.com/emilkowalski/skills'));
  assert.ok(body.includes(`https://github.com/emilkowalski/skills/compare/${A}...${B}`));
  assert.ok(!body.includes('gsap-skills'));
  assert.ok(body.includes('--bump'));
});

test('an error alone keeps an issue open and lists the failure', () => {
  const body = renderIssue([{ id: 'emil', error: 'network down' }, { id: 'gsap', pinned: A, latest: A, moved: false }], sources);
  assert.ok(body.includes('`emil`: network down'));
  assert.ok(!body.includes('compare'));
});

test('mentions sources whose check failed, without a compare link', () => {
  const body = renderIssue([{ id: 'emil', error: 'boom' }, { id: 'gsap', pinned: A, latest: B, moved: true }], sources);
  assert.ok(body.includes('boom'));
  assert.ok(body.includes('gsap'));
});

test('title is stable', () => {
  assert.equal(TITLE, 'Upstream skills moved');
});

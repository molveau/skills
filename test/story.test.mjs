import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { tmpdir } from 'node:os';
import { join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import vm from 'node:vm';
import * as contrast from '../skills/anti-slop/scripts/story-contrast.mjs';
import { storyTarget, storyHandler } from '../skills/anti-slop/scripts/story-server.mjs';

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), '..', 'skills', 'anti-slop', 'scripts');
const STORY = join(SCRIPTS, 'story.mjs');

test('story.mjs exits 2 with the usage line when arguments are missing', () => {
  for (const args of [[], ['story.html']]) {
    const r = spawnSync(process.execPath, [STORY, ...args], { encoding: 'utf8' });
    assert.equal(r.status, 2, r.stderr);
    assert.match(r.stderr, /usage: node story\.mjs/);
  }
});

const hasFfmpeg = (() => {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; }
})();
const hasPlaywright = await import('playwright').then(() => true, () => false);

test('story.mjs leaves no .story-frames folder when the render cannot start', { skip: !hasFfmpeg || hasPlaywright ? 'needs ffmpeg and no Playwright' : false }, () => {
  const d = mkdtempSync(join(tmpdir(), 'story-'));
  writeFileSync(join(d, 'package.json'), '{}');
  writeFileSync(join(d, 'story.html'), '<meta name="unslop-steps" content="Spacing"><p>hi</p>');
  const r = spawnSync(process.execPath, [STORY, join(d, 'story.html'), join(d, 'out.mp4')], { encoding: 'utf8', cwd: d });
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /Playwright is not installed/);
  assert.equal(existsSync(join(d, '.story-frames')), false);
});

test('the injected page runtime is valid JavaScript', () => {
  const src = readFileSync(STORY, 'utf8');
  const start = src.indexOf('const runtime = `') + 'const runtime = `'.length;
  const body = src.slice(start, src.indexOf('\n`;', start));
  const contrastSource = Object.values(contrast).map((fn) => fn.toString()).join('\n');
  const runtime = new Function('steps', 'contrastSource', `return \`${body}\`;`)(['Spacing'], contrastSource);
  assert.doesNotThrow(() => new vm.Script(runtime));
});

test('storyTarget keeps requests inside the story folder', () => {
  const root = join(tmpdir(), 'site');
  assert.equal(storyTarget(root, '/__story/story.html'), join(root, 'story.html'));
  assert.equal(storyTarget(root, '/img/a.png'), join(root, 'img', 'a.png'));
  assert.equal(storyTarget(root, '/__story/a/../b.css'), join(root, 'b.css'));
  assert.equal(storyTarget(root, '/__story/../secret.txt'), null);
  assert.equal(storyTarget(root, '/../../etc/passwd'), null);
  // A sibling folder sharing the prefix passed the old startsWith(root) check.
  assert.equal(storyTarget(root, '/../site-secret/key.txt'), null);
  assert.equal(storyTarget(root, '/a\0.html'), null);
  assert.equal(storyTarget(root, `/..${sep}x`), null);
});

function serve(handler) {
  const server = createServer(handler);
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done(server)));
}

function get(server, path) {
  return new Promise((done, fail) => {
    const req = request({ host: '127.0.0.1', port: server.address().port, path }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => done({ status: res.statusCode, type: res.headers['content-type'], body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', fail);
    req.end();
  });
}

test('storyHandler serves the stage and regular files only, 400 on a malformed URL', async () => {
  const base = mkdtempSync(join(tmpdir(), 'story-srv-'));
  const root = join(base, 'site');
  mkdirSync(join(root, 'sub'), { recursive: true });
  mkdirSync(join(base, 'site-secret'));
  writeFileSync(join(root, 'story.html'), '<p>story</p>');
  writeFileSync(join(base, 'site-secret', 'key.txt'), 'secret');
  const server = await serve(storyHandler(root, '<p>stage</p>'));
  try {
    assert.deepEqual(await get(server, '/__stage.html'), { status: 200, type: 'text/html', body: '<p>stage</p>' });
    const page = await get(server, '/__story/story.html');
    assert.equal(page.status, 200);
    assert.equal(page.body, '<p>story</p>');
    assert.equal((await get(server, '/__story/sub')).status, 404);
    assert.equal((await get(server, '/__story/missing.css')).status, 404);
    assert.equal((await get(server, '/__story/..%2Fsite-secret%2Fkey.txt')).status, 404);
    assert.equal((await get(server, '/__story/%E0%A4%A')).status, 400);
    // The process is still up after the bad request.
    assert.equal((await get(server, '/__story/story.html')).status, 200);
  } finally {
    server.close();
  }
});

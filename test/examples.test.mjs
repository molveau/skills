import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectTells } from '../skills/anti-slop/scripts/detect-tells.mjs';

const EXAMPLES = join(dirname(fileURLToPath(import.meta.url)), '..', 'examples');
const dirs = existsSync(EXAMPLES) ? readdirSync(EXAMPLES).filter((d) => statSync(join(EXAMPLES, d)).isDirectory()) : [];
const tells = (dir, file) => detectTells([{ path: file, text: readFileSync(join(EXAMPLES, dir, file), 'utf8') }]).length;

test('there is at least one example', () => assert.ok(dirs.length >= 1));

for (const dir of dirs) {
  test(`${dir}: has every file a reader needs to check the run`, () => {
    for (const f of ['run.md', 'before.html', 'after.html', 'story.html', 'video.mp4', 'poster.jpg']) {
      assert.ok(existsSync(join(EXAMPLES, dir, f)), `${dir}/${f} missing`);
    }
    assert.ok(statSync(join(EXAMPLES, dir, 'video.mp4')).size < 3 * 1024 * 1024, `${dir}/video.mp4 is 3 MB or more`);
  });

  test(`${dir}: run.md states models, cost and every hand edit`, () => {
    const run = readFileSync(join(EXAMPLES, dir, 'run.md'), 'utf8');
    for (const heading of ['## Before', '## After', '## Hand edits', '## Reproduce']) assert.ok(run.includes(heading), `${dir}/run.md lacks ${heading}`);
    assert.match(run, /Model: `claude-[a-z0-9-]+`/);
    assert.match(run, /Cost: \$\d+\.\d\d/);
  });

  test(`${dir}: the after is clean and the before is not`, () => {
    assert.equal(tells(dir, 'after.html'), 0);
    assert.ok(tells(dir, 'before.html') >= 10, 'the before should be visibly slop');
  });
}

# Ratchet test in a project

A ratchet pins today's count and fails when it goes up, so the tells can only shrink. Sketch for
`node:test` (adapt the paths and the baseline):

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, globSync } from 'node:fs'; // globSync needs Node 22; on 20 walk the folders yourself
import { detectTells } from './.agents/skills/anti-slop/scripts/detect-tells.mjs';

const BASELINE = { 10: 8, 5: 1 }; // tell number -> allowed findings today
test('no new vibe-coded tells', () => {
  const files = globSync('{app,components}/**/*.{ts,tsx,css}').map((path) => ({ path, text: readFileSync(path, 'utf8') }));
  const now = {};
  for (const f of detectTells(files)) now[f.tell] = (now[f.tell] ?? 0) + 1;
  for (const [tell, n] of Object.entries(now)) assert.ok(n <= (BASELINE[tell] ?? 0), 'tell ' + tell + ': ' + n + ' findings, baseline ' + (BASELINE[tell] ?? 0));
});
```

Lower the baseline whenever you fix one; never raise it.

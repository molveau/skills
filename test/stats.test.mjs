import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeDaily, summarize } from '../scripts/stats.mjs';

const day = (d, count, uniques) => ({ timestamp: `2026-11-${d}T00:00:00Z`, count, uniques });

test('mergeDaily keeps one row per day and lets the newer fetch win', () => {
  const archive = [day('01', 5, 2), day('02', 1, 1)];
  const fetched = [day('02', 9, 4), day('03', 3, 3)];
  assert.deepEqual(mergeDaily(archive, fetched), [day('01', 5, 2), day('02', 9, 4), day('03', 3, 3)]);
});

test('mergeDaily sorts by day and tolerates an empty archive', () => {
  assert.deepEqual(mergeDaily([], [day('03', 1, 1), day('01', 2, 2)]), [day('01', 2, 2), day('03', 1, 1)]);
});

test('summarize totals views and clones over the archive', () => {
  const s = summarize({ views: [day('01', 5, 2), day('02', 9, 4)], clones: [day('02', 3, 1)], referrers: [{ referrer: 'x.com', count: 7, uniques: 5 }] });
  assert.deepEqual(s, { days: 2, views: 14, clones: 3, topReferrers: ['x.com 7'] });
});

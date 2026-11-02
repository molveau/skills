#!/usr/bin/env node
// Archive the repo's GitHub traffic, which GitHub keeps for 14 days only. Needs the GitHub CLI logged in
// with push access to the repo. Install counts per skill are public at https://skills.sh/molveau/skills.
//   node scripts/stats.mjs [owner/repo]     default molveau/skills, archive in stats/ (git-ignored)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMain } from './lib/is-main.mjs';

export function mergeDaily(archive, fetched) {
  const byDay = new Map(archive.map((row) => [row.timestamp, row]));
  for (const row of fetched) byDay.set(row.timestamp, row);
  return [...byDay.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function summarize({ views, clones, referrers }) {
  const total = (rows) => rows.reduce((sum, row) => sum + row.count, 0);
  return {
    days: new Set([...views, ...clones].map((row) => row.timestamp)).size,
    views: total(views),
    clones: total(clones),
    topReferrers: referrers.slice(0, 5).map((r) => `${r.referrer} ${r.count}`),
  };
}

function main() {
  const repo = process.argv[2] ?? 'molveau/skills';
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    console.error('usage: node scripts/stats.mjs [owner/repo]');
    process.exit(2);
  }
  const api = (path) => JSON.parse(execFileSync('gh', ['api', `repos/${repo}/traffic/${path}`], { encoding: 'utf8' }));
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'stats');
  const file = join(dir, `${repo.replace('/', '-')}.json`);
  const archive = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { views: [], clones: [], referrers: [] };
  const next = {
    views: mergeDaily(archive.views, api('views').views),
    clones: mergeDaily(archive.clones, api('clones').clones),
    referrers: api('popular/referrers'),
    fetchedAt: new Date().toISOString(),
  };
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
  console.log(JSON.stringify(summarize(next), null, 2));
  console.log(`archive: ${file}\ninstalls per skill: https://skills.sh/${repo}`);
}

if (isMain(import.meta.url)) main();

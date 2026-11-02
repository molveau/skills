#!/usr/bin/env node
// Opens, updates or closes the single "Upstream skills moved" issue from a `sync-sources --check --json` report.
// Usage: node scripts/upstream-issue.mjs <report.json>   (needs `gh` and GH_TOKEN; reads sources.json for repo names)
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMain } from './lib/is-main.mjs';

export const TITLE = 'Upstream skills moved';
const short = (sha) => String(sha).slice(0, 7);

// results: array from `--check --json`; sources: sources.json `sources` (for repo names).
// Returns the issue body, or null when every source is up to date with no error (the issue should be closed).
export function renderIssue(results, sources) {
  const moved = results.filter((r) => r.moved);
  const failed = results.filter((r) => r.error);
  if (!moved.length && !failed.length) return null;
  const repoOf = new Map(sources.map((s) => [s.id, s.repo]));
  const lines = [];
  if (moved.length) {
    lines.push(
      'These pinned sources have new commits upstream. Nothing was changed; review each diff, then bump.',
      '',
      '| id | pinned → latest | repo | changes |',
      '|---|---|---|---|',
      ...moved.map((r) => {
        const repo = repoOf.get(r.id);
        const url = `https://github.com/${repo}`;
        return `| \`${r.id}\` | \`${short(r.pinned)}\` → \`${short(r.latest)}\` | [${repo}](${url}) | [compare](${url}/compare/${r.pinned}...${r.latest}) |`;
      }),
      '',
      'To update after reviewing: `node scripts/sync-sources.mjs --bump --only <id>`, run `npm test`, read the diff, commit.',
    );
  }
  if (failed.length) {
    if (lines.length) lines.push('');
    lines.push('Checks that failed this run:', ...failed.map((r) => `- \`${r.id}\`: ${r.error}`));
  }
  return lines.join('\n') + '\n';
}

function gh(...args) {
  return execFileSync('gh', args, { encoding: 'utf8' }).trim();
}

function main(reportPath) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const results = JSON.parse(readFileSync(reportPath, 'utf8'));
  const { sources } = JSON.parse(readFileSync(join(root, 'sources.json'), 'utf8'));
  const body = renderIssue(results, sources);
  const found = JSON.parse(
    gh('issue', 'list', '--search', `in:title "${TITLE}"`, '--state', 'open', '--json', 'number,title'),
  ).filter((i) => i.title === TITLE);
  const number = found[0]?.number;
  if (body === null) {
    if (number) gh('issue', 'close', String(number), '--comment', 'All pinned sources are up to date.');
    console.log(number ? `closed #${number}` : 'nothing moved, no open issue');
  } else if (number) {
    gh('issue', 'edit', String(number), '--body', body);
    console.log(`updated #${number}`);
  } else {
    console.log(gh('issue', 'create', '--title', TITLE, '--body', body));
  }
  if (results.some((r) => r.error)) process.exitCode = 1;
}

if (isMain(import.meta.url)) {
  if (!process.argv[2]) { console.error('Usage: node scripts/upstream-issue.mjs <report.json>'); process.exit(2); }
  main(process.argv[2]);
}

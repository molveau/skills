#!/usr/bin/env node
// Print the CHANGELOG entry of one version, for the GitHub release the release workflow creates.
//   node scripts/release-notes.mjs <version>     default: the version in package.json
import { readFileSync } from 'node:fs';
import { isMain } from './lib/is-main.mjs';

export function releaseNotes(changelog, version) {
  const lines = changelog.split('\n');
  const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));
  if (start === -1) throw new Error(`no CHANGELOG entry for ${version}`);
  const end = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  return lines.slice(start + 1, end === -1 ? undefined : end).join('\n').trim();
}

function main() {
  const root = new URL('../', import.meta.url);
  const version = process.argv[2] ?? JSON.parse(readFileSync(new URL('package.json', root), 'utf8')).version;
  try {
    console.log(releaseNotes(readFileSync(new URL('CHANGELOG.md', root), 'utf8'), version));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (isMain(import.meta.url)) main();

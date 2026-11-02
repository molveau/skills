#!/usr/bin/env node
// Build the ChatGPT plugin package for upload at https://platform.openai.com/plugins ("Upload new or existing
// plugin"). openai/ holds the listing and the review cases; the version comes from package.json, the demo
// recording URL from --demo. The tools themselves are the hosted endpoint, https://www.molveau.ca/api/mcp.
//   node scripts/openai-package.mjs --demo <https url> [--out dir]     default dir: dist/
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMain } from './lib/is-main.mjs';
import { TOOLS } from '../skills/.mcp/tools.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'openai');

// Path inside the zip -> file on disk.
export function packageFiles() {
  return {
    'plugin.json': join(SOURCE, 'plugin.json'),
    'mcp.json': join(SOURCE, 'mcp.json'),
    'skills/get-started/SKILL.md': join(SOURCE, 'skills', 'get-started', 'SKILL.md'),
    'assets/icon.png': join(ROOT, 'skills', '.claude-plugin', 'icon.png'),
  };
}

export function buildManifest({ demoUrl = '' } = {}) {
  const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const { $schema, name, ...rest } = JSON.parse(readFileSync(join(SOURCE, 'plugin.json'), 'utf8'));
  const manifest = { $schema, name, version, ...rest };
  manifest.extensions['com.openai'].review.demo_recording_url = demoUrl;
  return manifest;
}

// The directory's own checks that a mistake here would fail, as messages; empty when the manifest is ready.
export function checkManifest(manifest) {
  const problems = [];
  const openai = manifest.extensions?.['com.openai'] ?? {};
  const ui = openai.interface ?? {};
  const max = (value, limit, label) => {
    if (typeof value !== 'string' || !value) problems.push(`${label} is required`);
    else if (value.length > limit) problems.push(`${label} is ${value.length} characters, over ${limit}`);
  };
  if (!/^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(manifest.name ?? '')) problems.push(`name "${manifest.name}" is not a valid plugin name`);
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? '')) problems.push(`version "${manifest.version}" is not semver`);
  max(ui.displayName, 30, 'displayName');
  max(ui.shortDescription, 30, 'shortDescription');
  max(ui.longDescription, 4000, 'longDescription');
  max(ui.developerName, 80, 'developerName');
  max(ui.category, 80, 'category');
  for (const key of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
    if (!/^https:\/\/\S+$/.test(ui[key] ?? '') || ui[key].length > 1024) problems.push(`${key} must be an HTTPS URL`);
  }
  const prompts = ui.defaultPrompt ?? [];
  if (prompts.length > 3 || new Set(prompts).size !== prompts.length || prompts.some((p) => p.length > 128)) {
    problems.push('defaultPrompt takes up to 3 unique prompts of 128 characters at most');
  }
  const files = packageFiles();
  for (const [label, path] of [['logo', ui.logo], ['composerIcon', ui.composerIcon], ['onboardingSkill', openai.onboardingSkill]]) {
    if (!path?.startsWith('./') || !Object.hasOwn(files, path.slice(2))) problems.push(`${label} ${path} is not in the package`);
  }
  const review = openai.review ?? {};
  const { positive = [], negative = [] } = review.test_cases ?? {};
  if (positive.length !== 5) problems.push(`review needs exactly 5 positive test cases, not ${positive.length}`);
  if (negative.length !== 3) problems.push(`review needs exactly 3 negative test cases, not ${negative.length}`);
  const tools = new Set(TOOLS.map((t) => t.name));
  positive.forEach((c, i) => {
    for (const key of ['description', 'prompt', 'tools_triggered', 'expected_behavior']) if (!c[key]) problems.push(`positive case ${i + 1} has no ${key}`);
    for (const tool of String(c.tools_triggered ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
      if (!tools.has(tool)) problems.push(`positive case ${i + 1} names ${tool}, which is not a tool`);
    }
  });
  negative.forEach((c, i) => {
    for (const key of ['description', 'prompt']) if (!c[key]) problems.push(`negative case ${i + 1} has no ${key}`);
  });
  if (!/^https:\/\/\S+$/.test(review.demo_recording_url ?? '')) problems.push('review.demo_recording_url must be an HTTPS URL (pass --demo)');
  for (const [locale, t] of Object.entries(openai.publication?.translations ?? {})) {
    if (t.subtitle != null) max(t.subtitle, 30, `${locale} subtitle`);
    if (t.description != null) max(t.description, 4000, `${locale} description`);
  }
  return problems;
}

function main() {
  const args = process.argv.slice(2);
  const option = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const manifest = buildManifest({ demoUrl: option('--demo') });
  const problems = checkManifest(manifest);
  if (problems.length) {
    console.error(problems.map((p) => `- ${p}`).join('\n'));
    process.exit(1);
  }
  const out = resolve(option('--out') ?? join(ROOT, 'dist'));
  const stage = mkdtempSync(join(tmpdir(), 'molveau-openai-'));
  try {
    for (const [inside, from] of Object.entries(packageFiles())) {
      mkdirSync(dirname(join(stage, inside)), { recursive: true });
      if (inside === 'plugin.json') writeFileSync(join(stage, inside), JSON.stringify(manifest, null, 2) + '\n');
      else cpSync(from, join(stage, inside));
    }
    mkdirSync(out, { recursive: true });
    const zip = join(out, `molveau-skills-openai-${manifest.version}.zip`);
    rmSync(zip, { force: true });
    // -D: no directory entries, -X: no extra file attributes, so the zip holds only the files.
    execFileSync('zip', ['-q', '-r', '-D', '-X', zip, '.'], { cwd: stage });
    console.log(zip);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

if (isMain(import.meta.url)) main();

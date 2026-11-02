#!/usr/bin/env node
// Vendors pinned upstream skill folders under skills/<domain>/references/vendor/<id>/.
// Usage: node scripts/sync-sources.mjs [--only id,id] [--check] [--bump] [--json]
// Exit: 0 clean, 1 failures or moved upstreams (--check), 2 usage.
// A failing source never aborts the others: its error is reported, the run exits 1 at the end,
// and THIRD_PARTY.md is regenerated regardless. --bump skips `frozen` sources and persists a new
// pin to sources.json only for sources whose sync succeeded; failed sources keep their old pin.
// Symlinks in upstream are never copied (listed in SOURCE.md). A resync is atomic per source:
// files are staged in a sibling temp folder and swapped in only after every copy succeeded.
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync, mkdirSync, rmSync, cpSync, renameSync, readFileSync, writeFileSync, readdirSync, statSync, lstatSync, existsSync, realpathSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, relative, sep, posix, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMain } from './lib/is-main.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const git = (cwd, ...args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).trim();

const repoUrl = (s) => s.url ?? `https://github.com/${s.repo}`;
const toPosix = (p) => p.split(sep).join('/');

// Glob on upstream-relative posix paths: `**` any depth, `*` within a segment, `?` one char.
export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++;
        if (glob[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*';
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

// Regular files only; symlinks are collected in `skipped` instead of followed.
function walk(dir, skipped = []) {
  const out = [];
  for (const n of readdirSync(dir)) {
    if (n === '.git') continue;
    const p = join(dir, n);
    const st = lstatSync(p);
    if (st.isSymbolicLink()) skipped.push(p);
    else if (st.isDirectory()) out.push(...walk(p, skipped));
    else out.push(p);
  }
  return out;
}

export async function syncSource(source, { root = ROOT, cloneDir } = {}) {
  const intoRel = toPosix(source.into).replace(/\/+$/, '');
  if (!/^skills\/[^/]+\/references\/vendor\/[^/]+$/.test(intoRel)) {
    throw new Error(`${source.id}: "into" must be skills/<name>/references/vendor/<id>, got ${source.into}`);
  }
  const intoAbs = resolve(root, intoRel);
  const inside = (abs) => abs === intoAbs || abs.startsWith(intoAbs + sep);

  const tmp = cloneDir ?? mkdtempSync(join(tmpdir(), `sync-${source.id}-`));
  const repoDir = join(tmp, 'repo');
  try {
    git(tmp, 'clone', '-q', '--filter=blob:none', '--no-checkout', repoUrl(source), 'repo');
    git(repoDir, 'checkout', '-q', '--detach', source.commit);
    const commitDate = git(repoDir, 'show', '-s', '--format=%cI', source.commit);

    const excludes = (source.exclude ?? []).map(globToRegExp);
    const isExcluded = (up) => excludes.some((r) => r.test(up));
    const planned = new Map(); // absolute dest -> absolute source file
    const skippedLinks = [];

    // Real paths, so a symlinked folder committed upstream cannot point a
    // take, licenseFrom or any copied file at something outside the clone.
    const realRepo = realpathSync(repoDir);
    const assertInRepo = (abs, what) => {
      const real = realpathSync(abs);
      if (real !== realRepo && !real.startsWith(realRepo + sep)) {
        throw new Error(`${source.id}: ${what} resolves outside the upstream checkout`);
      }
    };

    const plan = (srcAbs, destAbs) => {
      if (!inside(destAbs)) throw new Error(`${source.id}: destination ${destAbs} is outside ${intoRel}`);
      assertInRepo(srcAbs, toPosix(relative(repoDir, srcAbs)));
      planned.set(destAbs, srcAbs);
    };

    for (const t of source.take) {
      const fromAbs = resolve(repoDir, t.from);
      if (!fromAbs.startsWith(repoDir + sep) || !existsSync(fromAbs)) {
        throw new Error(`${source.id}: take path not found upstream: ${t.from}`);
      }
      if (!lstatSync(fromAbs).isSymbolicLink()) assertInRepo(fromAbs, `take ${t.from}`);
      const toAbs = resolve(intoAbs, t.to);
      if (!inside(toAbs)) throw new Error(`${source.id}: destination ${t.to} is outside ${intoRel}`);
      if (lstatSync(fromAbs).isSymbolicLink()) { skippedLinks.push(fromAbs); continue; }
      if (statSync(fromAbs).isFile()) {
        if (!isExcluded(toPosix(relative(repoDir, fromAbs)))) plan(fromAbs, toAbs);
        continue;
      }
      for (const f of walk(fromAbs, skippedLinks)) {
        const up = toPosix(relative(repoDir, f));
        if (isExcluded(up)) continue;
        const inner = toPosix(relative(fromAbs, f));
        if (t.skill && inner === 'SKILL.md') {
          plan(f, resolve(dirname(toAbs), `${basename(toAbs)}.md`));
        } else {
          plan(f, resolve(toAbs, inner));
        }
      }
    }

    // License and notice files: from the repo root, or from `licenseFrom`.
    const licDir = resolve(repoDir, source.licenseFrom ?? '.');
    if (!existsSync(licDir)) throw new Error(`${source.id}: licenseFrom ${source.licenseFrom} resolves outside the upstream checkout`);
    assertInRepo(licDir, `licenseFrom ${source.licenseFrom ?? '.'}`);
    const licFiles = readdirSync(licDir).filter(
      (n) => lstatSync(join(licDir, n)).isFile() && /^(licen[sc]e|notice)(\.|$)/i.test(n),
    );
    if (!licFiles.some((n) => /^licen[sc]e/i.test(n))) {
      throw new Error(`${source.id}: no LICENSE found in ${source.licenseFrom ?? 'repo root'}`);
    }
    for (const n of licFiles) plan(join(licDir, n), join(intoAbs, n));

    // Stage next to the target, then swap: a failed copy leaves the previous folder untouched.
    const stageAbs = `${intoAbs}.tmp-${process.pid}`;
    rmSync(stageAbs, { recursive: true, force: true });
    try {
      for (const [dest, src] of planned) {
        const to = join(stageAbs, relative(intoAbs, dest));
        mkdirSync(dirname(to), { recursive: true });
        cpSync(src, to);
      }
      const skippedRel = skippedLinks.map((p) => toPosix(relative(repoDir, p))).sort();
      writeFileSync(join(stageAbs, 'SOURCE.md'), renderSourceMd(source, commitDate, skippedRel));
      mkdirSync(dirname(intoAbs), { recursive: true });
      rmSync(intoAbs, { recursive: true, force: true });
      renameSync(stageAbs, intoAbs);
    } catch (e) {
      rmSync(stageAbs, { recursive: true, force: true });
      throw e;
    }

    const written = [...planned.keys(), join(intoAbs, 'SOURCE.md')]
      .map((p) => toPosix(relative(root, p)))
      .sort();
    return { id: source.id, written };
  } finally {
    if (!cloneDir) rmSync(tmp, { recursive: true, force: true });
  }
}

export function renderSourceMd(s, commitDate, skippedLinks = []) {
  const hasSkill = s.take.some((t) => t.skill);
  // A single file taken under another name (e.g. SKILL.md -> impeccable.md).
  const renamed = s.take.filter((t) => !t.skill && extname(t.from) && basename(t.from) !== basename(t.to));
  const changes = ['none, copied verbatim. Files were only relocated'];
  if (hasSkill) changes.push(' and each upstream `SKILL.md` was renamed to `<skill>.md`');
  if (renamed.length) changes.push(`; renamed: ${renamed.map((t) => `\`${t.from}\` to \`${t.to}\``).join(', ')}`);
  const lines = [
    `# Source: ${s.id}`,
    '',
    `- Repo: https://github.com/${s.repo}`,
    `- Commit: ${s.commit}`,
    `- Commit date: ${commitDate}`,
    `- License: ${s.license}`,
    ...(s.author ? [`- Author: ${s.author}`] : []),
    `- Changes: ${changes.join('')}.`,
    '',
    '## Layout',
    '',
    ...(hasSkill ? ['For a skill named `<skill>`: its `SKILL.md` is `<skill>.md` next to this file, and its other files are under `<skill>/`.'] : []),
    'Relative links inside vendored files point to the upstream layout, so some may not resolve here. Files are not edited.',
    '',
    '## Excluded',
    '',
    ...((s.exclude ?? []).length ? s.exclude.map((e) => `- \`${e}\``) : ['- nothing']),
  ];
  if (skippedLinks.length) {
    lines.push('', '## Skipped symlinks', '', 'Symlinks are never copied:', ...skippedLinks.map((l) => `- \`${l}\``));
  }
  if (s.notes) lines.push('', '## Notes', '', s.notes);
  return lines.join('\n') + '\n';
}

export async function checkSource(source, { lsRemote } = {}) {
  const latest = lsRemote
    ? await lsRemote(source)
    : git(process.cwd(), 'ls-remote', repoUrl(source), 'HEAD').split(/\s/)[0];
  // `frozen` sources are pinned to a commit that upstream later removed content from: never reported as moved.
  return { id: source.id, pinned: source.commit, latest, moved: !source.frozen && latest !== source.commit };
}

// Returns new source objects (input untouched). Frozen sources are skipped; a source's new pin is
// kept only if its sync succeeded.
export async function bumpSources(sources, { lsRemote, sync = (s) => syncSource(s) } = {}) {
  const out = [];
  const report = [];
  for (const s of sources) {
    if (s.frozen) { out.push({ ...s }); report.push({ id: s.id, skipped: 'frozen' }); continue; }
    try {
      const latest = (await checkSource(s, { lsRemote })).latest;
      const next = { ...s, commit: latest };
      const { written } = await sync(next);
      out.push(next);
      report.push({ id: s.id, commit: latest, files: written.length });
    } catch (e) {
      out.push({ ...s });
      report.push({ id: s.id, error: e.message });
    }
  }
  return { sources: out, report };
}

export function renderThirdParty(sources) {
  const rows = sources.map((s) => {
    const into = s.goesInto ?? s.into.split('/')[1];
    return `| ${s.id} | [${s.repo}](https://github.com/${s.repo}) | ${s.author ?? ''} | ${s.license} | \`${s.commit.slice(0, 7)}\` | ${into} |`;
  });
  return [
    '# Third-party sources',
    '',
    'Generated by `scripts/sync-sources.mjs` from `sources.json`. Each source is vendored verbatim under',
    '`skills/<skill>/references/vendor/<id>/` with its own LICENSE and a `SOURCE.md` (repo, commit, license, exclusions).',
    'Molveau-written files are MIT, 2026 Stanislas Molveau.',
    '',
    '| id | repo | author | license | commit | skill |',
    '|---|---|---|---|---|---|',
    ...rows,
    '',
    ...renderAttributions(sources),
    ...renderBundled(sources),
  ].join('\n');
}

function renderAttributions(sources) {
  const withAttr = sources.filter((s) => s.attribution);
  if (!withAttr.length) return [];
  return [
    '## Attribution',
    '',
    ...withAttr.map((s) => {
      const a = s.attribution;
      return `- "${a.title}" by ${a.author}, ${a.source}, licensed under ${s.license} (${a.licenseUrl}). ${a.note}.`;
    }),
    '',
  ];
}

function renderBundled(sources) {
  const items = sources.flatMap((s) => (s.bundled ?? []).map((b) => ({ ...b, via: s.id })));
  if (!items.length) return [];
  return [
    '## Bundled inside vendored sources',
    '',
    'Some vendored sources say in their own NOTICE that they include third-party material. It is kept as shipped.',
    '',
    ...items.map((b) => `- ${b.name} by ${b.author}, ${b.source}, ${b.license}. Inside \`${b.via}\`: ${b.note}.${b.notice ? ` License notice: ${b.notice}.` : ''}`),
    '',
  ];
}

function usage(msg) {
  if (msg) console.error(msg);
  console.error('Usage: node scripts/sync-sources.mjs [--only id,id] [--check] [--bump] [--json]');
  process.exit(2);
}

async function main(argv) {
  const flags = new Set();
  let only = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--only') { only = (argv[++i] ?? '').split(',').filter(Boolean); if (!only.length) usage('--only needs ids'); }
    else if (['--check', '--bump', '--json'].includes(a)) flags.add(a);
    else usage(`Unknown argument: ${a}`);
  }
  const file = join(ROOT, 'sources.json');
  const config = JSON.parse(readFileSync(file, 'utf8'));
  const known = new Set(config.sources.map((s) => s.id));
  for (const id of only ?? []) if (!known.has(id)) usage(`Unknown source id: ${id}`);
  const chosen = config.sources.filter((s) => !only || only.includes(s.id));
  const json = flags.has('--json');
  const report = [];
  let failed = false;

  if (flags.has('--check')) {
    for (const s of chosen) {
      try { report.push(await checkSource(s)); }
      catch (e) { failed = true; report.push({ id: s.id, error: e.message }); }
    }
    if (report.some((r) => r.moved)) failed = true;
  } else {
    if (flags.has('--bump')) {
      const { sources: bumped, report: r } = await bumpSources(chosen);
      report.push(...r);
      if (r.some((x) => x.error)) failed = true;
      const byId = new Map(bumped.map((x) => [x.id, x]));
      config.sources = config.sources.map((x) => byId.get(x.id) ?? x);
      writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
    } else {
      for (const s of chosen) {
        try {
          const { written } = await syncSource(s);
          report.push({ id: s.id, commit: s.commit, files: written.length });
        } catch (e) { failed = true; report.push({ id: s.id, error: e.message }); }
      }
    }
    writeFileSync(join(ROOT, 'THIRD_PARTY.md'), renderThirdParty(config.sources));
  }

  if (json) console.log(JSON.stringify(report, null, 2));
  else for (const r of report) {
    if (r.skipped) { console.log(`skip  ${r.id} (${r.skipped})`); continue; }
    console.log(r.error ? `FAIL ${r.id}: ${r.error}` : r.moved !== undefined
      ? `${r.moved ? 'MOVED' : 'ok   '} ${r.id} ${r.pinned.slice(0, 7)} -> ${r.latest.slice(0, 7)}`
      : `synced ${r.id} @ ${r.commit.slice(0, 7)} (${r.files} files)`);
  }
  process.exit(failed ? 1 : 0);
}

if (isMain(import.meta.url)) {
  main(process.argv.slice(2));
}

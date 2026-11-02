import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const SEVERITY_ORDER = ['blocker', 'major', 'minor', 'nit'];
const TYPE_ORDER = ['objective', 'judgment'];

/**
 * Verdict precedence, strongest first.
 *
 * CONFIRMED beats UNVERIFIED: if one lens's finding was confirmed by a verifier
 * and an identical finding from another lens went unverified, a verifier did
 * read that line and agree - the claim is confirmed, and reporting it as
 * unverified would understate what the grill established.
 *
 * UNVERIFIED beats null so that an objective finding's "we could not check
 * this" marker is never erased by merging with a judgment finding.
 */
export const VERDICT_ORDER = ['CONFIRMED', 'UNVERIFIED', null];

/**
 * Lowercase, replace punctuation with a space, collapse whitespace - so trivial
 * rewordings dedupe. Punctuation is replaced rather than deleted so that
 * numbers differing only by punctuation (e.g. "1.5" vs "15") don't collide.
 */
export function normaliseClaim(claim) {
  return String(claim).toLowerCase().replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function severityRank(s) {
  const i = SEVERITY_ORDER.indexOf(s);
  return i === -1 ? SEVERITY_ORDER.length : i;
}

function typeRank(t) {
  const i = TYPE_ORDER.indexOf(t);
  return i === -1 ? TYPE_ORDER.length : i;
}

function verdictRank(v) {
  const i = VERDICT_ORDER.indexOf(v ?? null);
  return i === -1 ? VERDICT_ORDER.length : i;
}

/**
 * Collapse findings sharing `file:line` where EITHER the normalised claim
 * matches OR both findings carry the same non-empty `topic` - a short
 * kebab-case slug naming the code construct or defect class at fault (e.g.
 * "transition-all"), independent of how each lens phrased its claim. This is
 * the structural safety net for two lenses that legitimately converge on the
 * same flaw in different words (different severity, different citation) but
 * never happen to reuse each other's claim text.
 *
 * A missing or empty `topic` never matches another missing or empty `topic`:
 * absence is not agreement, and merging on it would silently collapse two
 * unrelated findings that merely happen to share a line.
 *
 * Highest severity wins, lenses union, strongest verdict wins, and objective
 * beats judgment - a finding a verifier confirmed is not a taste call. Every
 * reconciliation here is order-independent: which of two identical findings
 * arrives first must never change the merged result.
 */
export function mergeFindings(findings) {
  // Group by file:line first (cheap partition), then decide within each group
  // whether two findings merge - by claim OR by shared non-empty topic. This
  // makes topic-matching pairs join a claim-matching pair's bucket even when
  // neither text nor topic makes ALL three findings agree pairwise; a bucket
  // is really a union of the merge relation across finding pairs.
  const byLine = new Map();
  for (const f of findings) {
    const lineKey = `${f.file}::${f.line}`;
    if (!byLine.has(lineKey)) byLine.set(lineKey, []);
    byLine.get(lineKey).push(f);
  }

  const merged = [];

  for (const group of byLine.values()) {
    // Union-find over indices within this file:line group, so that A merging
    // with B (matching topic) and B merging with C (matching claim) puts all
    // three in one bucket, regardless of arrival order.
    const parent = group.map((_, i) => i);
    const find = (i) => {
      while (parent[i] !== i) {
        parent[i] = parent[parent[i]];
        i = parent[i];
      }
      return i;
    };
    const union = (a, b) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent[ra] = rb;
    };

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        const sameClaim = normaliseClaim(a.claim) === normaliseClaim(b.claim);
        const sameTopic = Boolean(a.topic) && Boolean(b.topic) && a.topic === b.topic;
        if (sameClaim || sameTopic) union(i, j);
      }
    }

    const buckets = new Map();
    group.forEach((f, i) => {
      const root = find(i);
      if (!buckets.has(root)) buckets.set(root, []);
      buckets.get(root).push(f);
    });

    for (const bucket of buckets.values()) {
      let combined = null;
      for (const f of bucket) {
        if (!combined) {
          combined = { ...f, lenses: [f.lens] };
          continue;
        }
        if (!combined.lenses.includes(f.lens)) combined.lenses.push(f.lens);
        if (severityRank(f.severity) < severityRank(combined.severity)) combined.severity = f.severity;
        if (verdictRank(f.verdict) < verdictRank(combined.verdict)) combined.verdict = f.verdict ?? null;
        if (typeRank(f.type) < typeRank(combined.type)) combined.type = f.type;
        if (combined.source === 'builtin' && f.source !== 'builtin') combined.source = f.source;
      }
      merged.push(combined);
    }
  }

  return merged;
}

/** Severity first, then objective before judgment at equal severity. */
export function rankFindings(findings) {
  return [...findings].sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity) || typeRank(a.type) - typeRank(b.type),
  );
}

/**
 * CLI: read a JSON array of findings on stdin, write the merged and ranked
 * array to stdout. This is how SKILL.md merges the Workflow's raw output
 * without the Workflow having to reimplement any of the above.
 *
 * Usage: node merge-findings.mjs < raw.json > merged.json
 */
async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const input = chunks.join('').trim();
  if (!input) {
    process.stdout.write('[]');
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch (err) {
    process.stderr.write(`merge-findings: invalid JSON on stdin: ${err.message}\n`);
    process.exit(1);
  }
  if (!Array.isArray(parsed)) {
    process.stderr.write('merge-findings: expected a JSON array of findings\n');
    process.exit(1);
  }
  process.stdout.write(JSON.stringify(rankFindings(mergeFindings(parsed)), null, 2));
}

// Only run as a CLI when executed directly, never on import. Node's ESM loader
// resolves import.meta.url through the real (symlink-free) path, so argv[1]
// must be realpath'd too before comparing - otherwise a symlinked tmp dir
// (e.g. a symlinked temp dir) would make this compare unequal even
// though it's the same file.
function isMainModule() {
  if (!process.argv[1]) return false;
  let resolved;
  try {
    resolved = realpathSync(process.argv[1]);
  } catch {
    resolved = process.argv[1];
  }
  return import.meta.url === pathToFileURL(resolved).href;
}

if (isMainModule()) {
  await main();
}

export const meta = {
  name: 'design-grill',
  description: 'Fan seven design lenses over a target, verify objective findings, return a ranked list',
  phases: [
    { title: 'Grill', detail: 'seven lenses read the target in parallel' },
    { title: 'Verify', detail: 'objective findings only, confirmed against file:line' },
  ],
};

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['lens', 'severity', 'type', 'file', 'line', 'claim', 'why', 'remediation', 'source', 'topic'],
        properties: {
          lens: { type: 'string' },
          severity: { enum: ['blocker', 'major', 'minor', 'nit'] },
          type: { enum: ['objective', 'judgment'] },
          file: { type: 'string' },
          line: { type: 'integer' },
          claim: { type: 'string' },
          why: { type: 'string' },
          remediation: { type: 'string' },
          source: { type: 'string' },
          topic: { type: 'string' },
        },
      },
    },
  },
};

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['confirmed', 'note'],
  properties: {
    confirmed: { type: 'boolean' },
    note: { type: 'string' },
  },
};

// `args` may arrive as an object or as a JSON string depending on how the host
// serialises it. Destructuring a string silently yields undefined for every
// field, and the first symptom is an unrelated-looking "lensNames.map is not a
// function" - so normalise before touching it, and fail with a message that
// names the real cause.
const input = typeof args === 'string' ? JSON.parse(args) : args;

if (!input || typeof input !== 'object') {
  throw new Error('design-grill: args missing or unparseable - expected an object or a JSON string.');
}

// briefPaths maps a lens name to the absolute path of its brief. Paths, not
// contents: the seven briefs total ~114KB, and hauling all of them through args
// on every run costs ~29k tokens to hand each agent six briefs it will not read.
// Each lens agent reads its own - they already read the target from disk.
const { targetPath, platform, tokenSet, probes, briefPaths, lensNames, projectRoot } = input;

for (const [name, value] of [
  ['targetPath', targetPath],
  ['platform', platform],
  ['tokenSet', tokenSet],
  ['probes', probes],
  ['briefPaths', briefPaths],
  ['lensNames', lensNames],
  ['projectRoot', projectRoot],
]) {
  if (value == null) throw new Error(`design-grill: args.${name} is required but was not provided.`);
}

const enrichmentFor = (lens) =>
  probes.filter((p) => p.lens === lens && p.present).map((p) => p.suite);

function lensPrompt(lens) {
  const present = enrichmentFor(lens);
  return [
    `You are the "${lens}" lens of a design grill. You are READ-ONLY: never edit any file.`,
    ``,
    `Target: ${targetPath}`,
    `Platform: ${platform}`,
    ``,
    `## Your brief - read this file first, it is your complete instructions`,
    briefPaths[lens],
    `Read it before looking at the target. It defines your rules, what you own,`,
    `and what you must leave to the other six lenses. If you cannot read it, stop`,
    `and report that rather than grilling from memory.`,
    ``,
    `## Tokens this project declares about itself`,
    tokenSet.empty
      ? `This project declares no design tokens. Follow your brief's guidance for that case.`
      : JSON.stringify(tokenSet, null, 2),
    ``,
    `## Optional enrichment available`,
    present.length
      ? `Present: ${present.join(', ')}. Consult them per your brief and stamp "source" accordingly.`
      : `None installed. Use your built-in rules only; this is expected and sufficient.`,
    ``,
    `## The file path contract - follow it exactly`,
    `Report every finding's "file" as a path RELATIVE TO THIS PROJECT ROOT:`,
    `  ${projectRoot}`,
    `So a file at ${projectRoot}/src/components/thing.tsx is reported as exactly:`,
    `  src/components/thing.tsx`,
    `Not absolute. Not relative to your working directory. Not prefixed with "./".`,
    ``,
    `This is not cosmetic. Findings are deduplicated on file + line + (claim or`,
    `topic), so if you and another lens describe the same flaw using different`,
    `spellings of the same path, neither key can match - the report shows it`,
    `twice and every count is wrong.`,
    ``,
    `## Rules`,
    `- Read the target and report findings against your brief.`,
    `- Every finding needs a real file:line you actually read. Never guess a line number.`,
    `- "why" is REQUIRED and must name a declared token, a numbered rule from your brief, or a named principle. Emit nothing you cannot anchor.`,
    `- "topic" is REQUIRED: a short kebab-case slug naming the code construct or defect class at fault - not your judgment of it. Name the thing in the code, chosen so that another lens looking at the same flaw would independently choose the same slug. Examples: "transition-all", "missing-focus-visible", "hardcoded-color", "missing-alt".`,
    `- A finding contradicting a token this project declares is wrong: the project wins. Drop it.`,
    `- Stay in your lane. Your brief says what you leave to other lenses.`,
    `- Return findings only. No prose.`,
  ].join('\n');
}

phase('Grill');

const perLens = await parallel(
  lensNames.map((lens) => () =>
    agent(lensPrompt(lens), { label: `grill:${lens}`, phase: 'Grill', schema: FINDINGS_SCHEMA })
      .then((r) => ({ lens, findings: r?.findings ?? null }))
  )
);

// A lens that died (agent() returned null) or whose thunk itself resolved to
// null must not be indistinguishable from a lens that legitimately found
// nothing. Track failures by name so the report can say so.
const lensesFailed = [];
const raw = [];
perLens.forEach((result, i) => {
  const lens = result?.lens ?? lensNames[i]; // recover the name even if the thunk itself died
  const findings = result?.findings ?? null;
  if (findings === null) {
    lensesFailed.push(lens);
  } else {
    findings.forEach((f) => raw.push({ ...f, lens }));
  }
});

log(`${raw.length} raw findings from ${lensNames.length - lensesFailed.length} of ${lensNames.length} lenses`);
if (lensesFailed.length) log(`lenses failed (crashed or skipped): ${lensesFailed.join(', ')}`);

// Structural enforcement of the verification asymmetry: judgment findings are
// never routed to a verifier, so a skeptic can never delete a taste finding.
// Anything whose type is not exactly 'objective' ships as judgment - a finding
// we cannot classify is still a finding, and shipping it unverified is the
// safe direction. Nothing falls through a gap between the two filters.
const objective = raw.filter((f) => f.type === 'objective');
const judgment = raw.filter((f) => f.type !== 'objective').map((f) => ({ ...f, verdict: null }));
const unrecognizedTypeCount = raw.filter((f) => f.type !== 'objective' && f.type !== 'judgment').length;

log(`${objective.length} objective to verify, ${judgment.length} judgment shipping unverified`);
if (unrecognizedTypeCount) {
  log(`${unrecognizedTypeCount} findings had an unrecognised type; shipped as judgment rather than dropped`);
}

phase('Verify');

const verdicts = await parallel(
  objective.map((f) => () =>
    agent(
      [
        `Verify one design finding. Be skeptical but fair.`,
        ``,
        `File: ${f.file}  (relative to the project root ${projectRoot} - resolve it against that root to read it)`,
        `Line: ${f.line}`,
        `Claim: ${f.claim}`,
        `Stated reason: ${f.why}`,
        ``,
        `Read the file at that line. Confirm ONLY if:`,
        `1. The cited file:line exists and contains what the claim describes.`,
        `2. The stated reason is real - the named token or rule actually applies here.`,
        ``,
        `Set confirmed=false if the line does not say what is claimed, the token does not exist,`,
        `or the code already does the right thing. Do not confirm on plausibility alone.`,
      ].join('\n'),
      { label: `verify:${f.file}:${f.line}`, phase: 'Verify', schema: VERDICT_SCHEMA }
    ).then((v) => ({ finding: f, verdict: v }))
  )
);

// A verifier that crashed (agent() -> null) or was skipped (thunk -> null) is
// NOT the same outcome as a verifier that ran and returned confirmed: false.
// The former is "we never checked", the latter is "we checked and it's not
// real". Collapsing them would either lie to the user ("refuted" for a
// finding never examined) or silently destroy a real finding. Keep all three
// outcomes - confirmed, refuted, unverified - distinct all the way to output.
const confirmed = [];
const unverified = [];
let refutedCount = 0;

verdicts.forEach((r, i) => {
  const finding = r?.finding ?? objective[i]; // recover if the thunk itself died
  const v = r?.verdict ?? null;
  if (v === null) {
    unverified.push({ ...finding, verdict: 'UNVERIFIED' });
  } else if (v.confirmed) {
    confirmed.push({ ...finding, verdict: 'CONFIRMED' });
  } else {
    refutedCount++;
  }
});

log(`${confirmed.length} objective confirmed, ${refutedCount} refuted, ${unverified.length} unverified`);

// Return RAW findings. Merging and ranking belong to merge-findings.mjs, which
// SKILL.md pipes this through. Workflow scripts cannot import from disk, and
// reimplementing merge here would duplicate a tested logic block verbatim.
return {
  rawFindings: [...confirmed, ...unverified, ...judgment],
  refutedCount,
  unverifiedCount: unverified.length,
  header: {
    target: targetPath,
    platform,
    tokensDeclared: tokenSet.empty ? 'none' : tokenSet.sources,
    lensesRun: lensNames,
    lensesFailed,
    enrichment: probes.filter((p) => p.present).map((p) => p.suite),
  },
};

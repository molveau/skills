# The delivery loop in detail

Seven steps: inspect, clarify, plan, implement test-first, review, verify, report. This file gives the rules
for each and the reason behind them. Git is in `git.md`, reports in `communication.md`, UI specifics in
`ui-work.md`.

## 1. Inspect

- Read before you write: the files the change touches, their tests, their callers, and one or two sibling
  features that solve a similar problem. Match what is there before inventing a new pattern.
- Read the project's own notes: the agent notes file (`AGENTS.md`, `CLAUDE.md` or equivalent),
  `PRODUCT.md`, `DESIGN.md`, `CONTEXT.md` and ADRs. Project rules override this skill.
- Find the commands: how to run tests, type check, lint and build. You will need them for every task and
  for verification.
- Note the current branch and working tree. Uncommitted changes that are not yours stay untouched.

## 2. Clarify

Do not plan or implement until these six are clear enough to write down:

| Item | The question |
|---|---|
| Outcome | What changes for the user or the business when this ships? |
| Workflow | Who does what, in what order, on which screen or command? |
| Rules | Which business rules, limits, permissions and invariants apply? |
| Scope | What is in, and what is explicitly out of this change? |
| States | Empty, loading, error, partial, offline, permission denied, first use, very large data |
| Success criteria | How will we know it works? Ideally phrased as tests. |

How to ask:

- One question at a time, each with your recommended answer and why. The decision owner can then accept
  quickly or correct you.
- Answer from the code what the code can answer. Ask people only about intent, priorities and rules.
- Use the project's vocabulary. When terms are fuzzy or two words mean the same thing, agree on one and
  record it (a glossary in `CONTEXT.md`, a decision in an ADR).
- Stop when the six items are written down and confirmed, not when you run out of questions.

## 3. Plan

- **User flow and stories first** for anything a person sees or touches: the path through the screens or
  commands, then short stories ("As a returning customer, I can reorder from my history in two taps").
  States come from the flow, not from the happy path.
- **Bite-sized tasks.** Each task is one coherent change an implementer can finish and test in one go:
  the files it creates or modifies, the test that proves it, the command that verifies it, and its done
  condition. If a task needs "and then" twice, split it.
- **Order by dependency.** Data and contracts before the code that uses them; shared modules before their
  callers. Mark which tasks are independent (read-only or non-overlapping files) and could run in parallel.
- **Module boundaries before code.** Decide where new logic lives and what its interface is. Prefer a
  small interface over a wide one; keep a module's internals out of its callers.
- **One planning system per feature.** Do not run a spec-and-tickets flow and a separate full plan on the
  same feature.
- For substantial features, write the plan to a file in the repository so implementers and reviewers read
  the same text.

## 4. Implement test-first

### TDD, red then green

1. Write one failing test for the next behaviour.
2. Run it and watch it fail for the expected reason (not a typo, not a missing import).
3. Write the least code that makes it pass.
4. Run the suite; everything green.
5. Refactor with the tests green.
6. Repeat for the next behaviour.

Applies to every feature and every bugfix. Test behaviour through public interfaces, not implementation
details, so refactors do not break tests. Code written before its test is deleted and redone test-first,
not "tested afterwards".

### One fresh implementer per bounded task

- Hand each task to a fresh implementer (a new agent session or subagent) with exactly what it needs: the
  task text, the relevant files, the commands and the constraints. A fresh context does not carry the
  previous task's assumptions or clutter.
- One task at a time per implementer. It finishes, tests and reports before the next one starts.
- **A reviewer per task**, in two passes:
  1. *Spec compliance*: does the change do what the task asked, all of it and nothing more?
  2. *Quality*: naming, structure, tests that test behaviour, no dead code, project conventions.
  Fix what the reviewer finds, then have it check again before moving on.
- **Parallel only when safe.** Run tasks side by side only when they are read-only (research, search,
  audits) or touch files that do not overlap. Two implementers editing the same file produce conflicts and
  wasted work.
- **Serialise on a small machine.** Several agents plus test runners and dev servers can exhaust memory
  on a laptop. When memory is tight, run one implementer at a time.
- When no subagents are available, run the same loop yourself: one task, its test, its review checklist,
  then the next.

### Debugging

1. **Reproduce** the bug reliably, ideally as a failing test or a single command.
2. **Find the root cause.** Trace the bad value or state back to where it starts. Form one hypothesis,
   test it, keep or discard it. No fix by guesswork, no stacking of speculative changes.
3. **Write a regression test** that fails because of the bug.
4. **Fix** the cause, not the symptom. The regression test passes; the suite stays green.
5. If three attempted fixes fail, stop and question the design or your understanding before a fourth.

## 5. Review

- After substantive implementation (a feature, a refactor, anything beyond a trivial edit), review the
  whole change against the plan and the repository's standards, ideally by a reviewer that did not write
  it.
- Run the deterministic checks first (types, lint, tests, build, static accessibility checks, any
  project detector). An AI reviewer should spend its attention on design and correctness, not on what a
  linter catches.
- **Resolve every confident, material finding.** Fix it, or answer it with evidence (a test, a spec line,
  a measurement) if it is wrong. Do not silently skip findings, and do not accept a finding you cannot
  verify just because a reviewer said it.
- **Review again after fixes.** Fixes introduce new problems often enough to make the second pass worth it.
- Use one review process. Running two overlapping reviewers on the same diff doubles the noise, not the
  signal.
- UI and UX are judged by the decision owner on a mockup, not by an automated visual pass: see
  `ui-work.md`.

## 6. Verify

Before saying "done", "fixed", "passing" or "ready":

1. Name the command that proves the claim (test suite, type check, build, the reproduction of the bug).
2. Run it fresh, now, on the final state of the code.
3. Read the full output: exit code, failure count, warnings.
4. Only then state the result, with the evidence ("193 tests, 0 failures").

Rules:

- No "should work", "looks right" or "probably passes". Either you ran it or you say you did not.
- An implementer's or reviewer's report is a claim, not evidence. Check the diff and rerun the checks.
- For a final check on a large change, a clean checkout or a separate worktree catches files you forgot to
  commit and state that only exists on your machine.
- If a check cannot run (no network, missing credentials), say so in the report as a risk.

## 7. Report

Use the STATUS block during long work and the RESULT block at the end: `communication.md`. Always separate what
is implemented, tested, reviewed, committed, pushed, merged and deployed; each is a different promise.

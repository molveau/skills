---
name: workflow
description: Delivery workflow for building software with a coding agent, from a rough idea to a verified, committed change. Use when starting a feature or a bugfix, when asked to plan this or break work into tasks, when deciding how we should work or setting up an agent or team workflow (clarify, plan, TDD, one implementer and one reviewer per task, git hygiene, status reports), before committing or merging, and when asking whether something is done. Covers debugging, code review, verification and progress reports. Hands UI, UX and motion detail to the ui, ux and motion skills.
---

# Workflow

How to take a piece of work from "someone asked for it" to "verified, committed and reported". It works
with any coding agent and any stack. It sets the order of work and the gates between steps; the domain
skills (`ui`, `ux`, `motion` and the others listed below) hold the craft.

In this skill, **the decision owner** is the person who owns the product decision: the one who says what
"right" looks like, approves directions and authorises anything that leaves the machine (push, PR, merge,
deploy). On a solo project that is you; on a team it is whoever the team names.

## The loop

Every non-trivial task goes through these steps in order. A one-line fix can skip planning, never
verification.

1. **Inspect.** Read the repository and the existing implementation before proposing anything: the code
   around the change, its tests, the project's agent notes (`AGENTS.md`, `CLAUDE.md` or equivalent),
   `PRODUCT.md`, `DESIGN.md`, `CONTEXT.md` and ADRs when they exist.
2. **Clarify.** Ask until the outcome, the workflow, the rules, the scope, the states and the success
   criteria are clear. Do not plan or implement on a guess. One question at a time, with your recommended
   answer, works best.
3. **Plan.** Break the work into bite-sized tasks, each with its files, its test and its done condition.
   For anything user-facing, write the user flow and the user stories first: good UX is planned, not
   patched.
4. **Implement test-first.** Red, then green, then refactor, for every feature and every bugfix. One fresh
   implementer per bounded task; a reviewer per task (spec compliance first, then quality).
5. **Review.** After substantive work, run a code review on the whole change. Resolve every confident,
   material finding, then review again. UI is reviewed by the decision owner on a mockup, not by an
   automated visual pass.
6. **Verify.** Run the checks and read their output before saying anything works. Evidence before claims.
7. **Report.** Say what is done and what remains, in the RESULT format, and separate implemented, tested,
   reviewed, committed, pushed, merged and deployed.

Details, rules and the reasons behind them: `references/delivery-loop.md`.

## Always on

1. **Clarify before building.** If any of outcome, workflow, rules, scope, states or success criteria is
   unclear, ask. A wrong build costs more than a question.
2. **Tests first.** No production code without a failing test that it makes pass. A bug gets a regression
   test before its fix.
3. **One bounded task per implementer, a reviewer per task.** Parallelise only read-only work or tasks
   whose files do not overlap. On a machine with little memory, run them one at a time.
4. **Deterministic checks before AI review.** Types, lint, tests, build and static accessibility checks
   run first; an AI reviewer reads code that already passes them.
5. **No claim without evidence.** "Done", "fixed" and "passing" follow a command you ran and output you
   read in this session.
6. **Nothing leaves the machine without a go.** No push, PR, merge or deploy until the decision owner
   says so for this change.
7. **Use what is installed.** When a skill or tool already covers the job, use it; do not rebuild it as an
   ad hoc prompt or a custom agent. Use one planning system per feature and one design authority at a
   time.

## What to read for which task

All paths are relative to this skill folder.

| Task | Read |
|---|---|
| Clarify a request, plan, TDD, implementer and reviewer per task, debugging, code review, verification | `references/delivery-loop.md` |
| Anything with a UI: inspect first, component source order, mockup-first, checks before "done" | `references/ui-work.md` |
| Branches, staging, commits, what needs authorisation | `references/git.md` |
| STATUS and RESULT blocks, the delivery states, drafting emails and messages | `references/communication.md` |

## Which sibling skill takes over

This skill decides when and in what order; these skills decide how. Load the one that matches the step.

| Step or need | Skill |
|---|---|
| Building, restyling, polishing or critiquing a screen; the mockup-first loop and its states checklist | `ui` |
| Interface copy, errors, empty states, edge cases, accessibility | `ux` |
| Any animation or motion | `motion` |
| Before calling any UI done: the 20 tells and the detector | `anti-slop` |
| A deep, multi-lens design audit of a file, component or route | `design-grill` |
| Visual references before designing | `design-inspiration-index` |
| Prose, articles, docs, README and email copy, in English or French | `writing` |
| French copy (Québec or France) | `french-typography` |
| A site that collects personal information in Québec | `loi-25-website` |
| Starting a SaaS, dashboard or web app | `saas` |
| Starting a showcase site for a local business | `vitrine` |

The project-type playbooks (`saas`, `vitrine`) give the order of design work for that kind of product;
this skill wraps them with the clarify, plan, test, review, verify and report gates.

## Gates

A step does not start until the gate before it is met.

| Before | The gate |
|---|---|
| Planning | Outcome, workflow, rules, scope, states and success criteria written down and confirmed |
| Implementing UI | User flow and stories written; for new or restyled screens, the mockup approved by the decision owner |
| Each task's code | A failing test that fails for the expected reason |
| Moving to the next task | The task's reviewer passed it on spec, then on quality |
| Committing | Repository checks green; only the task's files staged |
| Saying "done" | Fresh verification output read; RESULT block written |
| Push, PR, merge, deploy | Explicit authorisation from the decision owner for this change |

## Deeper process, optional

This skill is self-contained. If you want a fuller, opinionated version of a step, these open collections
go deeper. They are recommendations, not requirements, and nothing here depends on them.

- [Matt Pocock's skills](https://github.com/mattpocock/skills): `grilling` and `grill-me` (clarify),
  `grill-with-docs` and `domain-modeling` (repository-aware interviews, shared vocabulary, ADRs), `to-spec`
  and `to-tickets` (spec then tickets), `tdd`, `diagnosing-bugs`, `codebase-design` (module boundaries),
  `code-review`.
- [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent: `brainstorming`, `writing-plans`,
  `subagent-driven-development`, `test-driven-development`, `systematic-debugging`,
  `requesting-code-review`, `verification-before-completion`, `using-git-worktrees`,
  `finishing-a-development-branch`.

Pick one planning system per feature. A spec-and-tickets flow from one collection and a full plan from the
other, run on the same feature, produce two sources of truth.

## Keep project facts in the project

Project-specific rules (stack, commands, tokens, terminology, decisions) belong in the repository: its
agent notes file, `PRODUCT.md`, `DESIGN.md`, `CONTEXT.md` and ADRs. This skill stays generic. One-time
setup steps (installing a design context, configuring a skill for the repo) run once per repository, not on
every task.

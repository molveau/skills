# Git

Small, honest history; nothing leaves the machine without a go.

## Branches

- **Branch from an up-to-date `main`.** Fetch first. If you are on the default branch when work starts,
  create a feature branch before the first edit.
- **Gitflow when the repository has a `dev` branch:** feature branch, PR into `dev`, then promote `dev`
  into `main` so the two stay level. Without `dev`, PR straight into `main`.
- **One coherent feature per branch.** An unrelated fix found on the way gets its own branch, or at least
  its own commit and a line in the report.
- For risky or parallel work, a separate worktree keeps the main checkout clean and gives a clean place for
  final verification.

## Staging and commits

- **Stage exact files**, by path: `git add src/cart/total.ts src/cart/total.test.ts`. Never `git add .` or
  `git add -A`: they sweep in secrets, generated files and other people's work in progress.
- Before each commit, read `git status` and `git diff --staged`. Only the task's files are in it.
- **Scoped commits**: one logical change per commit, with a conventional message when the repository uses
  them (`feat(cart): apply volume discounts`, `fix(auth): keep session on refresh`).
- **Run the repository's checks before committing**: tests, type check, lint, whatever its hooks or CI
  run. A commit that breaks the build is not a checkpoint.
- **Never skip hooks** (`--no-verify`). If a hook fails, fix the cause.
- **Verify the final SHA** after committing (`git log -1 --oneline`) and put it in the report.
- Leave files you did not change alone, including someone's uncommitted edits in the same tree.

## Destructive operations

- No `git reset --hard`, `git checkout -- .`, `git clean -fd`, force pushes or history rewrites by default.
  If one seems necessary, say why and get a go first.
- Prefer a new commit that reverts over rewriting shared history.
- Before anything that discards work, list exactly what will be lost.

## What needs explicit authorisation

The decision owner says yes for this change before any of:

- pushing a branch,
- opening a pull request,
- merging,
- deploying, publishing or releasing.

Authorisation for one change does not carry to the next. "Commit it" does not mean "push it".

## Finishing a branch

1. All tasks done, reviewed, and their checks green.
2. Full verification on the final state (see `delivery-loop.md`, Verify).
3. Report with the RESULT block, including the SHA and whether anything is pushed.
4. Offer the next step (push, PR, merge, keep the branch, discard it) and wait for the decision owner.

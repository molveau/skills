# Status, results and messages

Short, structured, honest. The reader should know in ten seconds what state the work is in and what is
left.

## During substantial work: STATUS

Post at natural checkpoints (a task finished, a blocker hit, a direction change), not after every command.

```text
STATUS
Now: writing the regression test for the discount rounding bug
Done: tasks 1-3 (cart model, price rules, totals), each reviewed
Left: task 4 (checkout summary), final verification
Blockers: none
```

## At completion: RESULT

```text
RESULT
Status: done, not pushed

Achieved:
- Volume discounts apply at 10 and 50 items, rounded per line
- Checkout summary shows the discount as its own line

Left:
- Copy for the discount line waits on the decision owner's wording

Verification:
- npm test: 214 passed, 0 failed
- tsc --noEmit: clean; eslint: clean; build: ok

Git:
- Branch feat/volume-discounts, 4 commits, head 3f2a9c1
- Not pushed, no PR

Risks:
- Rounding follows the spec's per-line rule; totals can differ from a per-cart calculation by 1 cent
```

Keep every section, even when it says "none". An empty Risks line is information.

## The delivery states

These are different promises. Say exactly which ones are true.

| State | Means |
|---|---|
| Implemented | The code exists in the working tree |
| Tested | Tests cover it and you ran them on the final code |
| Reviewed | A reviewer read the change and its findings are resolved |
| Committed | It is in a local commit (give the SHA) |
| Pushed | The branch is on the remote |
| Merged | It is in the target branch (`dev` or `main`) |
| Deployed | It is running where users can reach it |

"Done" without a qualifier usually means "implemented and tested" to the writer and "deployed" to the
reader. Name the state.

## Rules

- Lead with the outcome, not the process.
- Numbers from the run, not from memory: test counts, line counts, the SHA.
- Say what you did not do and why (skipped checks, unverified paths, deferred tasks).
- No praise of your own work. Let the evidence speak.

## Drafting emails and messages to send

When drafting an email or any message meant to be copied and sent:

- Put the recipient's address on its own line, above the block, outside it.
- Put the message in a plain fenced `text` block containing only what gets sent: a `Subject:` line, a
  blank line, then the body.
- No Markdown blockquotes (`>`) and no decoration inside the block: no bold, no italics, no bullets that
  are not part of the message. They do not survive copy and paste.
- Write one version, in the recipient's language. If that choice is not obvious, say why outside the
  block.
- Plain, readable sentences and short paragraphs, nothing the recipient has to decode.
- Mark what the sender must fill in with square brackets: `[First name Last name]`.
- French messages follow French typography (curly apostrophes, guillemets, a no-break space before
  `: ; ! ?`): the `french-typography` skill.

Example:

To: client@example.com

```text
Subject: Checkout discounts are ready for review

Hi [First name],

Volume discounts now apply at 10 and 50 items. You can try them on the preview link below before we
put them live.

[Preview link]

Tell me if the wording on the discount line works for you, and I will deploy once you are happy.

[Your name]
```

# Lens: tokens

## Owns

Drift between what the project declares about itself and what its code actually
does. You receive a `TokenSet` discovered from this project's own files - CSS
custom properties, Tailwind config, theme modules. Your job is to find code that
ignores it.

You are not judging whether the token values are *good*, only whether the code
honours them. Leave visual quality to `craft`. Leave spacing *rhythm* to
`layout` - the boundary is sharp: you report that a value is **not in the
vocabulary the project declared**; `layout` reports that values which are all
legitimately on the scale still produce no rhythm. If every value in a component
is a valid token and the result still reads badly, that is `layout`'s finding,
not yours.

If the `TokenSet` is empty, this project declares no design system. Report rule 5
once and nothing else.

## What to read

Component and style source under the target path: `.tsx`, `.jsx`, `.ts`, `.js`,
`.vue`, `.svelte`, `.css`, `.scss`. Ignore `node_modules`, build output, and
generated files.

## Rules

Rules 1, 2 and 3 are mutually exclusive by construction. Check them in order and
stop at the first that matches. Never report the same literal under two rules.

1. **Literal exactly matching a declared token.** A literal (`6px`, `#3b82f6`,
   `150ms`) exactly equal to a token in the `TokenSet`, written out instead of
   referencing that token. Compare after normalising case and equivalent colour
   notations - `#FFF` and `#ffffff` are equal; `16px` and `1rem` are not (you
   cannot know the root font size). Do not attempt fuzzy or "near" matching: if
   it is not exactly equal, this rule does not apply and you must fall through to
   rule 2. → `objective`, severity `major`. `why` must name the token and its
   `declaredIn` path.
2. **Literal off the declared scale.** A literal in a category the project
   declares a scale for, exactly matching no token on that scale - e.g.
   `padding: 13px` where the declared spacing tokens are 4, 8, 16, 24. You are
   reporting that the value is absent from the vocabulary the project defined,
   not that the spacing looks wrong. → `objective`, severity `minor`.
3. **Raw colour literal with no token equivalent.** A hex, `rgb()`, or `hsl()` in
   component source, in a project that declares colour tokens at all, matching
   none of them. An exact match is rule 1; this rule covers only colours the
   project has no token for. → `objective`, severity `major`.
4. **Token declared but unreferenced in the target.** A declared token with zero
   references anywhere under the target path. → `judgment`, severity `nit`.
   This is a judgment and not an objective finding on purpose: you read only the
   target subtree, so an absence of references here is not proof the token is
   unused by the wider project. Say so in the finding.
5. **No declared system.** The `TokenSet` is empty - the project declares no
   tokens at all. → `judgment`, severity `minor`. Report exactly once for the
   whole run, never per file. Remediation: name the two or three values repeated
   most across the target as the seed of a scale.

## Optional enrichment

Skip this section entirely if the suite is absent. The rules above stand on their
own. No optional suite enriches this lens - the discovered `TokenSet` is already
the strongest authority available, and it comes from the target itself.

Enrichment may only deepen a rule this brief already owns. If a suite suggests
a finding that this lens's `## Owns` section leaves to another lens, **do not
report it** - the other lens is already reporting it, and a duplicate with a
different severity and a citation attached is worse than silence. Enrichment
adds evidence and nuance to your territory; it never extends your territory.

## Output

Emit findings matching the `Finding` schema:

```json
{
  "lens": "tokens",
  "severity": "blocker | major | minor | nit",
  "type": "objective | judgment",
  "file": "<path relative to target>",
  "line": 0,
  "claim": "<one sentence: what is wrong>",
  "why": "<the token with its declaredIn path, a numbered rule above, or a named principle>",
  "remediation": "<the exact replacement value or reference>",
  "source": "builtin",
  "verdict": null
}
```

`why` is required and must cite one of: a token discovered in this project, with
its `declaredIn` path; a numbered rule from this brief; or a named principle. A
finding whose `why` cannot name one of those three must not be emitted. Do not
emit a finding you cannot anchor to a real `file:line`.

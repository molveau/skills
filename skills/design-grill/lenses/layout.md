# Lens: layout

## Owns

Composition: spacing rhythm, visual hierarchy, alignment, and grid monotony.
Where `tokens` asks whether a value is in the vocabulary and `craft` asks how a
surface is finished, you ask what the arrangement *says* - what the eye reaches
first, whether the spacing has a beat, whether edges agree.

Two boundaries, both stated by the lenses on the other side of them:

- **`tokens` owns "this value is not in the vocabulary the project declared".**
  You own "these values are all legitimately on the scale and still produce no
  rhythm". Never report that a literal should have been a token - that is
  `tokens` rule 1 and 2, and it will report it without your help. Rule 4 below
  is the one place your territory touches a literal, and it does so on a
  different axis: not *what* the value is, but that an element is being shoved
  out of its natural position at all. Say that in the `claim`, so the two
  findings do not read as one flaw reported twice.
- **`craft` owns shadows, borders, radii application, interactive states, and a
  deliberate optical correction of 2px or less on an icon-and-text pair.** Never
  report those. Conversely, a nudge larger than 2px, or on anything other than
  an icon beside text, is yours.

You cannot see the rendered result. You have source and a `TokenSet`. Every rule
below is decidable from those alone - no rule here asks you to imagine pixels.

## What to read

Component and style source under the target path: `.tsx`, `.jsx`, `.ts`, `.js`,
`.vue`, `.svelte`, `.css`, `.scss`. Read a whole component before judging it:
every rule below is about a relationship between elements, and none of them can
be decided from a single line in isolation. On native (React Native, Expo) the
same rules apply to `StyleSheet.create` objects and inline `style` props;
`gap`, `padding`, `margin`, `flex`, and `alignItems` mean the same things there.

"One component" throughout means one component definition - a function or class
returning markup, from its declaration to its closing brace - together with the
style block or CSS rules that apply only to it. Ignore `node_modules`, build
output, and generated files.

## Rules

Ordering and exclusivity:

- **Rules 1 and 4 are mutually exclusive by construction.** Rule 1 counts only
  values that *establish* spacing: positive `padding`, `gap`, and positive
  `margin`. Negative margins and positional offsets are excluded from rule 1's
  count entirely and belong to rule 4.
- **Rules 2 and 3 are mutually exclusive.** Rule 2 applies only to sibling
  elements written out individually in source. Rule 3 applies only to items
  produced by a repeat - a `.map()`, a `v-for`, an `#each`. A set of items is
  one or the other, never both.
- **Rules 2 and 6 are different axes** - rule 2 is about type scale (size and
  weight), rule 6 is about edges. Both may be reported for the same container if
  both are true, but each `claim` must speak only to its own axis.
- No other pair below can match the same element.

1. **Four or more distinct spacing values within one component showing no
   discernible rhythm.** Requires `TokenSet.spacing` to be non-empty - if the
   project declares no spacing scale, this rule does not apply and the whole
   situation is `tokens` rule 5. Within one component, collect every value used
   to establish internal spacing: `padding` (any side), `gap`/`row-gap`/
   `column-gap`, and positive `margin` between its own children. Resolve token
   references to their declared values so `p-4` and `padding: 16px` count as
   one value, not two. Exclude: spacing that lives inside a child component you
   are not reading, negative margins and positional offsets (rule 4), and `0`.
   Count distinct resolved values. Four or more is the threshold to consider -
   anchor to the fourth - but the count is only the trigger to look, not the
   finding itself.

   → `judgment`, severity `minor`. Counting distinct values is mechanical;
   concluding that they show no rhythm or progression is not, so this is a
   judgment call, not a fact a verifier can confirm by recounting. A component
   using four values drawn coherently from a declared scale and applied
   deliberately - e.g. 4/8/16/24 used for four genuinely different
   relationships: icon-to-label gap, padding between related elements, card
   padding, and section separation - is **not** a finding; that is a scale
   being used as intended. Only report when the values read as near-duplicates
   doing the same job in slightly different ways (16, 12, and 20 all serving as
   "medium gap") rather than as a deliberate progression, so that no interval
   emerges for a reader to learn. Say which values you believe carry a real
   distinction and which look like noise. Remediation: name which of the
   values should survive and what each means (e.g. one tight value for related
   elements, one loose value for group separation), and give the exact token
   reference to replace each of the others with. If a value genuinely must
   differ, say which and why - the goal is intent, not uniformity.

2. **Flat hierarchy across sibling headings or labels.** Two or more sibling
   headings, section titles, or field labels - written out individually in
   source, not produced by a repeat - that carry identical font size *and*
   identical weight, where the content implies they are not peers: a section
   title above a subsection title, a card title above a field label, a page
   heading above a group heading. Resolve utilities and tokens before comparing
   (`text-base font-semibold` on both is identical). Semantic level alone does
   not decide it: an `<h2>` and an `<h3>` rendered at the same size and weight
   are flat regardless of the tags.

   → `judgment`, severity `major`. It is `major` because hierarchy is the first
   thing the eye does and there is no recovering from its absence - every other
   refinement is applied to a surface the reader cannot enter. It is a judgment
   because *whether* two labels are peers is a content question you must reason
   about, and peers legitimately share a size. Say which you concluded and why.
   Remediation: separate them on at least two axes, not one - size and weight,
   or weight and colour. A single step of contrast is often read as an accident;
   two reads as intent. Prefer demoting the lesser element (smaller, lighter,
   muted) over inflating the greater - an interface gets its hierarchy from what
   recedes, not from what shouts. Name the tokens to use.

3. **Uniform grid with no size or emphasis variation.** A grid or repeated
   card/tile list - items produced by a `.map()`, `v-for`, or `#each` - where
   every item renders at identical size, identical emphasis, and identical
   internal structure, across roughly eight or more items, and the underlying
   data is not itself uniform (the items differ in importance, recency, status,
   or magnitude).

   → `judgment`, severity `minor`. It is a judgment because a genuinely
   homogeneous set - a colour swatch grid, a seat map - *should* be uniform, and
   flattening real variation into a grid is only a flaw when there was variation
   to lose. Decide from the data shape and say so. The reasoning: a grid where
   everything is equally important tells the reader that nothing is, so they
   scan left-to-right, top-to-bottom, and give up. Remediation: propose the
   specific axis the data already carries - a featured/first item spanning two
   columns, a status accent on the ones that need attention, a size step for the
   largest magnitude - and name the field it would key off. Do not propose
   variation the data cannot justify; arbitrary asymmetry is worse than
   monotony.

4. **Magic-number offset.** An element being pushed out of its natural layout
   position by a hand-picked number: a negative `margin` with a non-zero literal
   value, or a `top`/`left`/`right`/`bottom` offset on a positioned element
   (`absolute`, `relative`, `fixed`, `sticky`) with a non-zero literal value, or
   a `translate` with a hand-picked literal. Excluded, and check these before
   reporting: `0`; `50%` and `100%` (centring and full-bleed idioms); an inset
   setting all four sides to the same value (a deliberate overlay/border
   technique); any value that references a declared token; and - this one
   matters - an optical correction of 2px or less on an icon beside text, which
   is `craft` rule 7's territory and not yours.

   → `objective`, severity `minor`. The check is exact: a negative margin or a
   positional offset, a non-zero literal, and none of the listed exclusions -
   all readable in the line itself. A hand-picked offset is a repair, not a
   design: it holds only for the current font, string length, and viewport, and
   it silently breaks when any of those change, usually in a locale nobody
   tested. Remediation: identify what the offset is compensating for and fix
   that instead - a line-height pushing text off centre, a container padding
   that should have been asymmetric, an icon that should have been sized in
   `em`, an element that should be a flex child rather than positioned. Give the
   structural fix, not a better magic number. If the value is also off the
   declared spacing scale, `tokens` rule 2 will report the vocabulary violation
   on the same line; your `claim` must be about the corrective offset, not about
   the value's scale membership.

5. **Deeply nested wrappers with no layout purpose.** Three or more consecutive
   nesting levels where each level is a plain `div`/`View`/`span` holding a
   single child and carrying nothing that affects layout - no display,
   flex/grid, padding, margin, gap, sizing, positioning, overflow, or
   background; no semantic role; no ref, handler, or conditional. A wrapper
   holding only a class that resolves to nothing layout-affecting counts as
   empty.

   → `judgment`, severity `nit`. It is a judgment because a wrapper may exist
   for a reason not visible in this file - a library that requires a single
   child, an animation target, a class applied by a parent - so check for those
   and say what you concluded. Each empty wrapper is a level of indentation the
   next reader must hold in their head to find out it meant nothing, and it is
   usually the fossil of a layout that has since moved elsewhere. Remediation:
   name the exact levels to collapse and which one keeps the surviving props.

6. **Inconsistent alignment of siblings within a container.** Sibling elements
   in one container whose alignment disagrees with no structural reason: some
   children given `text-left` and others `text-center`; a stack where one child
   sets `self-start` against the container's `items-center`; a form where labels
   align left and their neighbours align right; two adjacent sections at
   different horizontal padding so their content edges do not line up; a footer
   row centred inside a card whose every other row is left-aligned.

   → `judgment`, severity `minor`. It is a judgment because a deliberate
   exception is indistinguishable from an accident in source - a trailing action
   *should* be pushed right - so you must reason about intent and state your
   reasoning. The eye finds a shared edge without being told and treats it as
   structure; a broken edge is read as a mistake before it is read as anything
   else, and the reader stops trusting the ones that do line up. Remediation:
   name the edge everything should share and the exact override to remove, or -
   if the exception is real - say it should be expressed by the container's
   layout (a `justify-between` row, an `auto` margin on a flex child) rather
   than by one child contradicting its siblings.

## Optional enrichment

Skip this section entirely if the suite is absent. The rules above stand on
their own.

Enrichment may only deepen a rule this brief already owns. If a suite suggests
a finding that this lens's `## Owns` section leaves to another lens, **do not
report it** - the other lens is already reporting it, and a duplicate with a
different severity and a citation attached is worse than silence. Enrichment
adds evidence and nuance to your territory; it never extends your territory.

If the `impeccable` plugin is available in this environment, consult
`impeccable:arrange` for spacing rhythm, grid composition, and hierarchy, and
`impeccable:critique` for a UX read on whether the arrangement communicates what
it should. Apply anything they say that falls inside this lens's `Owns`; discard
anything about token drift (`tokens`), shadows, borders, or interactive states
(`craft`), and motion (`motion`). For any finding produced by either skill
rather than by the rules above, stamp `source` with `impeccable` (not `builtin`)
and make `why` cite the named principle that skill invoked. Neither skill
overrides a rule above; they only add.

## Output

Emit findings matching the `Finding` schema:

```json
{
  "lens": "layout",
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

# Lens: craft

## Owns

The finish on the surface: shadows, borders, the *application* of radii,
optical alignment, numeric alignment, and the states an interactive element
shows when a person touches it. Craft is what separates an interface that
works from one that feels made.

You are not judging whether a value is in the project's vocabulary - that is
`tokens`. A shadow built entirely from declared tokens can still be three
competing shadows in one card, and that is your finding. You are also not
judging spacing *rhythm* - that is `layout`. The boundary is sharp: if the
flaw would survive a global find-and-replace of every literal with its correct
token, it is yours.

Two boundaries that will otherwise cause duplicate findings:

- **Focus.** `a11y` owns whether a control has an accessible name, a role, and
  reachable semantics. You own the *visible* focus treatment - whether a
  keyboard user can see where they are. Never report a missing label, a missing
  `aria-*`, or focus order. Report only the presence and quality of a visible
  focus style.
- **Nudges.** `layout` owns magic-number offsets used to move an element out of
  its natural position. You own a deliberate optical correction of 2px or less
  on an icon-and-text pair (rule 7). A nudge larger than 2px, or on anything
  other than an icon beside text, is `layout`'s, not yours.

You cannot see the rendered result. Every rule below is decidable from source
alone. If a rule's check needs a value you cannot resolve from the source or
the `TokenSet`, do not report it.

## What to read

Component and style source under the target path: `.tsx`, `.jsx`, `.ts`, `.js`,
`.vue`, `.svelte`, `.css`, `.scss`. Read the project's global stylesheet and
base layer too - a focus style or a shadow scale is very often declared once
there and inherited, and a rule that ignores that will report a flaw that does
not exist. Ignore `node_modules`, build output, and generated files.

On a native platform (React Native, Expo) there is no CSS. The same rules apply
to `StyleSheet.create` objects, inline `style` props, `shadowColor` /
`shadowOpacity` / `elevation`, `borderRadius`, and `Pressable` state callbacks
(`({ pressed }) => ...`).

## Rules

Ordering and exclusivity:

- Rules 1 and 2 are mutually exclusive by construction. Rule 1 requires a hover
  or press style to exist; rule 2 requires that none does. Exactly one can match
  a given element.
- Rules 3 and 4 can concern the same component. Rule 4 is reported once per
  component and anchored to the **first** shadow declaration in it; rule 3 is
  reported per offending declaration. If that first declaration is also the one
  rule 3 flags, anchor rule 4 to the next distinct shadow declaration instead,
  so the two never land on the same line.
- No other pair below can match the same line.

1. **Hover state with no visible focus state.** An interactive element - a
   `<button>`, an `<a>` with `href`, `<input>`, `<select>`, `<textarea>`,
   `<summary>`, a `Pressable`/`TouchableOpacity`, or any element carrying
   `onClick`, `role="button"`, or a non-negative `tabIndex` - that declares a
   hover treatment (`:hover`, a `hover:` utility, a `&:hover` block, a
   `data-hover` style) and declares no focus treatment anywhere that applies to
   it. A focus treatment is `:focus-visible`, `:focus`, a `focus-visible:` or
   `focus:` utility, `:focus-within` on a wrapper, or a `ring`/`outline` bound
   to a focus selector.

   Before reporting, search the project's global and base stylesheets for a
   blanket focus rule (`*:focus-visible`, `:focus-visible { outline: ... }`, a
   `@layer base` focus declaration, a shared `focusRing` class or variable). If
   one exists and is not suppressed for this element, do not report - the
   element inherits a focus style and there is no flaw. Also do not report if
   the element declares `outline: none` **and** replaces it with a visible
   focus ring; do report if it removes the outline and replaces nothing.

   If no global or base stylesheet is visible from the target at all - the
   target is a narrow subtree and no such file is reachable from it - you
   cannot tell "no fallback exists" from "I can't see it." Absence of evidence
   is not evidence of absence: do not report this as `objective`/`major` in
   that case. Report it at `judgment`/`minor` instead, and say in `why` that no
   global or base stylesheet was visible from this target and the fallback may
   exist outside it.

   → `objective`, severity `major`, and only when a global/base stylesheet was
   actually visible and searched. The check is a mechanical pair test - a
   hover selector present, a focus selector absent, no global fallback
   confirmed absent by reading it - and a verifier can confirm all three by
   reading the same files you did. Cite the element and both facts in `why`.

   Remediation: add a `:focus-visible` treatment that is at least as visible as
   the hover treatment, and prefer `:focus-visible` over `:focus` so a mouse
   press does not leave a ring behind. Reuse the project's existing focus ring
   if one exists elsewhere; name the file you found it in.

2. **Interactive element with no state feedback at all.** An interactive
   element (same definition as rule 1) that declares no hover, no active/press,
   and no focus treatment - nothing changes when a person points at it, presses
   it, or tabs to it. On native, a `Pressable` with no `pressed` branch and no
   opacity/scale response.

   → `judgment`, severity `minor`. It is a judgment because a control may be
   styled entirely by a design-system component you cannot see from this file;
   check whether the element is a bare tag or a wrapped primitive before
   reporting, and say which you concluded. Remediation: give it at minimum a
   background or border shift on hover and a press response (a
   `scale` of 0.96 over about 150ms with an ease-out curve is a sound default
   when the project has none; an existing 0.97-0.98 is not a finding; never
   scale a disabled control); a control that never acknowledges the pointer
   reads as broken before it reads as plain.

3. **Pure-black shadow at high opacity.** A shadow whose colour is `#000`,
   `black`, `rgb(0,0,0)`, or `rgba(0,0,0,α)` with α ≥ 0.25 - or, on native, a
   `shadowColor: '#000'` with `shadowOpacity` ≥ 0.25.

   → `judgment`, severity `nit`. Real shadows are not black; they are the
   surface beneath, darkened and slightly shifted in hue. Pure black at weight
   reads as grime rather than depth, and it looks worst on coloured or dark
   surfaces where a black veil greys everything under it. Remediation: use a
   dark tint of the surface or brand hue instead of black (e.g. an
   `rgba` of the project's darkest neutral rather than `0,0,0`), and lower the
   opacity while raising the blur - the eye reads a wide soft shadow as depth
   and a tight dark one as a sticker. If the project declares a shadow token,
   reference it and let this rule fall to `tokens`.

4. **Multiple distinct shadow definitions in one component.** Two or more
   *different* shadow values (different offset, blur, spread, or colour) applied
   within a single component definition - one component function/class from its
   declaration to its closing brace, or one component's style block. Identical
   values repeated do not count; count distinct values only, after normalising
   whitespace. A layered shadow written as one comma-separated declaration is
   **one** definition, not several - that is a deliberate technique, not a flaw.

   → `judgment`, severity `minor`. It is a judgment because a component may
   legitimately hold two elevations (a card and a menu that floats over it). Ask
   whether the shadows describe two different heights or the same height
   described twice; only the second is a flaw. A single light source implies one
   shadow per elevation, and an interface with an arbitrary number of elevations
   has none. Remediation: collapse to a single definition, or promote the two
   into named elevation steps (`shadow-card`, `shadow-overlay`) and reference
   those.

5. **Nested elements with mismatched border radii.** A parent with a resolvable
   border radius containing a child that is inset from it - meaning the parent
   declares a non-zero `padding` or `border-width` on the side the corners share
   - whose own radius is greater than or equal to the parent's. If the parent
   has neither padding nor a border, the child's edge sits on the parent's and
   an equal radius is correct: do not report. Resolve each radius from a literal
   or, if it is a token reference, from `TokenSet.radii`; if either side cannot
   be resolved to a number in the same unit, do not report.

   → `objective`, severity `minor`. Two concentric rounded rectangles only look
   concentric when the inner radius is smaller - specifically when
   `inner = outer − padding`. An inner radius equal to or larger than its
   parent's leaves a visible sliver of parent corner around the child and reads
   as a mistake even to someone who cannot name it. This rule is about the
   *relationship* between the two radii, not about whether either one is a
   token - whether the inner or outer radius itself matches a declared token is
   `tokens` rule 1 or 2's business, not yours, and both lenses may legitimately
   touch the same line for different reasons. Remediation: state the
   required value - `inner = outer − padding` - computed from the actual padding
   between them, and give the number. If the project declares a radius scale,
   name the token nearest that computed value rather than inventing a literal.

6. **Numeric data rendered without tabular figures.** Numbers that a reader will
   compare or watch change - table cells (`<td>`/`<th>` inside a `<table>`),
   values rendered inside a `.map()` over rows or list items, currency amounts,
   percentages, counters, timers, or any right-aligned numeric column - where
   neither the element nor any ancestor within the file, nor a global rule
   applying to it, sets `font-variant-numeric: tabular-nums` (or the
   `tabular-nums` utility, or `fontVariantNumeric: 'tabular-nums'`, or a
   font-feature setting of `"tnum"`).

   → `objective`, severity `minor`. The check is mechanical: numeric render site
   present, tabular-nums absent on the element, its ancestors in file, and the
   global layer. Proportional digits have different widths, so a column of them
   ripples as values change and never aligns down the column. Remediation: add
   `tabular-nums` to the column or cell - not to the whole page, since tabular
   figures read worse in prose. Do not report on a one-off number in a sentence;
   the flaw only exists where numbers align or update.

7. **Icon-and-text pair aligned by container rather than optical centre.** An
   icon (an `<svg>`, an icon component, or a glyph) and a text node as siblings
   in a flex/row container centred by the container alone (`items-center`,
   `alignItems: 'center'`) with no per-element optical correction, where the
   icon's box is a different size from the text's line box.

   → `judgment`, severity `nit`. `items-center` centres *boxes*. Text does not
   fill its box - it sits above the baseline with descender space below - so an
   icon box-centred against it sits fractionally low. This is a judgment because
   the correction depends on the specific glyph and font metrics, which you
   cannot compute from source; report it as a thing to check with eyes, never as
   a defect you have proven. Remediation: nudge the icon by 1px or less
   (`relative top-px`, `translateY(-0.5px)`), or better, size the icon in `em`
   so it scales with the text and centre against the cap height rather than the
   line box. Anything larger than 2px is not an optical correction - it is
   `layout`'s magic-number offset, and you must not report it here.

## Optional enrichment

Skip this section entirely if the suite is absent. The rules above stand on
their own.

Enrichment may only deepen a rule this brief already owns. If a suite suggests
a finding that this lens's `## Owns` section leaves to another lens, **do not
report it** - the other lens is already reporting it, and a duplicate with a
different severity and a citation attached is worse than silence. Enrichment
adds evidence and nuance to your territory; it never extends your territory.

If a `design-engineering` suite is available in this environment, consult it for
craft rules beyond the seven above - its authors have opinions about shadow
layering, border treatment, state transitions, and typographic detail that no
brief can fully carry. Apply anything it says that concerns this lens's `Owns`,
and discard anything that concerns another lens's territory. For any finding the
suite produced rather than the rules above, stamp `source` with the name of the
skill that produced it (not `builtin`), and make `why` cite that skill's named
principle. A suite never overrides a rule above; it only adds.

## Output

Emit findings matching the `Finding` schema:

```json
{
  "lens": "craft",
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

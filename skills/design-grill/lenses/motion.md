# Lens: motion

## Owns

How the interface moves, and where it fails to: durations, easing, missing
motion, animation performance, and reduced-motion. Motion is not decoration -
it is the explanation of what just happened to the layout. A change with no
motion asks the user to diff two frames from memory; a change with the wrong
motion lies about what happened.

You are not judging what moves *looks* like - a shadow, a border, a colour is
`craft`'s. You are judging duration, curve, the property being animated, and
whether motion exists at all where it should.

The boundary with `tokens` is sharp and you must respect it. Leave duration
*vocabulary* to `tokens` - whether a duration appears in the project's declared
motion scale is its rule 2, not yours. You own whether a duration is *right for
what it animates*, which is true or false independently of any scale. A
perfectly tokenised `--duration-slow: 900ms` on a dropdown is still your
finding.

You cannot see the rendered result and you cannot measure a frame. Every rule
below is decidable from source alone.

## What to read

Component and style source under the target path: `.tsx`, `.jsx`, `.ts`, `.js`,
`.vue`, `.svelte`, `.css`, `.scss`. Motion hides in more places than most
lenses:

- CSS `transition`, `transition-property`, `transition-duration`,
  `animation`, and `@keyframes` blocks.
- Tailwind `transition-*`, `duration-*`, `ease-*`, `animate-*` utilities, and
  any `keyframes`/`animation` entries in the Tailwind config.
- Animation libraries: `animate`/`initial`/`exit`/`transition` props,
  `useSpring`, `keyframes`, timeline calls.
- Native: `Animated.timing`, `withTiming`, `withSpring`, `LayoutAnimation`,
  `Easing.*`, and `useNativeDriver`.
- The `TokenSet.motion` array - the project's declared duration/easing
  vocabulary, bucketed from token names containing `duration`, `ease`,
  `easing`, `transition`, `animate`, or `delay`. This bucket mixes durations and
  easing curves because the categoriser buckets by name, not by value; filter
  it to entries whose *value* parses as a time (`ms` or `s`) before treating
  any of it as a duration.

Ignore `node_modules`, build output, and generated files.

## Rules

Ordering and exclusivity:

- **Rules 3 and 6 are mutually exclusive.** Rule 3 requires the animated
  property to be *named*. `transition: all` names nothing and is rule 6 only.
- **Rule 2 is a different axis** from rule 1 and may be reported for the
  same declaration: `transition: opacity 500ms linear` has both a duration
  problem and a curve problem, and they have different remediations. Emit at
  most one duration finding and at most one easing finding per declaration, and
  each `claim` must speak only to its own axis.
- Rule 4 is reported at most once for the entire run.

1. **Over 300ms on a UI state transition.** A duration greater than 300ms on a
   transition or animation that communicates a state change - a hover, a press,
   a disclosure, an open/close, an enter/exit, a value update. Excluded, and you
   must check for these before reporting: decorative or ambient animation, and
   anything looping (`animation-iteration-count: infinite`, `repeat: Infinity`,
   `Animated.loop`) - a 3s pulsing skeleton or a 20s gradient drift is not a
   state transition and this rule says nothing about it. Also excluded: a
   deliberate staggered sequence whose *total* exceeds 300ms while each step
   does not, and a crossfade between whole views or routes (350-450ms is
   normal there).

   → `judgment`, severity `minor`. It is a judgment because 300ms is a strong
   default, not a law: a large surface travelling a long distance (a full-screen
   sheet) earns more time than a 32px chip, and you cannot measure distance from
   source. State which case you think it is. The reasoning is that a UI
   transition is a courtesy to comprehension, and past roughly a third of a
   second a courtesy becomes a queue - the user has already decided and is now
   waiting for the interface to catch up. Remediation: propose a specific value
   (100-150ms for press and hover feedback, 150-250ms for routine changes,
   up to 300ms for overlays and large surfaces; nothing frequent over 300ms),
   and note that exits should take roughly 65-75% of the entrance, because the
   user has already moved on.

2. **`linear` easing on an enter or exit transition.** An explicit `linear`
   easing (`transition-timing-function: linear`, the `ease-linear` utility,
   `Easing.linear`, `ease: 'linear'`) on a transition that brings an element in
   or takes it out, or on any transform/opacity state change. Loops and
   continuous motion are excluded - a spinner, a marquee, a progress bar, or a
   scroll-linked animation *should* be linear, and reporting those is a false
   positive.

   → `judgment`, severity `minor`. Nothing physical starts and stops at a
   constant speed; linear motion reads mechanical because it has no mass. It is
   a judgment because you must decide from context whether the animation is a
   discrete transition or continuous motion. Remediation: name a curve and say
   why - an ease-out for enters and exits alike (fast start, settled landing: the
   element arrives and is done; exits use a shorter ease-out). Never propose
   `ease-in` on UI: it delays the moment the user is watching. Moving between
   two on-screen positions takes an ease-in-out. If the
   project declares an easing token, reference it instead of inventing a
   `cubic-bezier`.

3. **Animating a layout-triggering property.** A transition or animation whose
   *named* property is one of `width`, `height`, `top`, `left`, `right`,
   `bottom`, `margin` (or any `margin-*`), `padding` (or any `padding-*`), or a
   flex/grid sizing property, rather than `transform` or `opacity`. The property
   must be explicitly named: in a `transition`/`transition-property`
   declaration, as a Tailwind property utility, as a key in an animation config
   object, or as a property changed between `@keyframes` steps. On native, an
   `Animated`/Reanimated value driving one of these properties - which
   additionally cannot use `useNativeDriver: true`, so it is pinned to the JS
   thread.

   → `objective`, severity `major`. Mechanically confirmable: the property name
   is written in the source. These properties invalidate layout, so every frame
   forces the browser to recompute geometry for the subtree and repaint it -
   work that cannot be handed to the compositor and that gets worse the deeper
   the tree. `transform` and `opacity` are composited and cost nothing per
   frame. Remediation: give the exact rewrite - `height` → `transform:
   scaleY()` or a grid-rows/max-height technique; `top`/`left` →
   `transform: translate()`; a size change on a shared element → a FLIP
   transform. If the property genuinely cannot be expressed as a transform, say
   so and propose animating it only on a small, isolated, `contain`-ed subtree. A short accordion height is the one tolerated case: report it as `minor`, not `major`, and only when the panel is large.

4. **No reduced-motion guard anywhere in the project.** At least one animation
   or transition exists under the target, and a search of the *whole project*
   finds no reduced-motion handling at all: no `@media (prefers-reduced-motion`,
   no `matchMedia('(prefers-reduced-motion`, no `useReducedMotion`, no
   `reducedMotion` config on an animation provider, and on native no
   `AccessibilityInfo.isReduceMotionEnabled` / `isReduceMotionEnabled()`.

   → `objective`, severity `major`. It is a presence/absence grep over the
   project and a verifier can rerun it. **Report exactly once for the whole
   run**, anchored to the first animation you found - never per file, never per
   animation. If any guard exists anywhere, do not report at all; auditing
   whether the existing guard has full coverage is beyond what source reading
   can establish. Remediation: propose a single project-wide guard rather than a
   per-component one - a base-layer `@media (prefers-reduced-motion: reduce)`
   block that collapses durations to near-zero, or the animation library's
   global reduced-motion setting - and name the file it belongs in. Note that
   the goal is to reduce motion, not delete feedback: cross-fade instead of
   translate; keep the state change visible.

5. **A state change with no motion where motion would aid comprehension.** A
   conditional render or class toggle that swaps content instantly in a case
   where the user must reconcile before and after: an accordion or disclosure
   expanding, a modal/dialog/sheet/popover appearing or dismissing, a list
   reordering or filtering, an item being added or removed from a list, a tab
   panel swapping. The source signal is a `{open && ...}`-style conditional
   mount, or a class/style toggle, with no transition, no exit animation, and no
   presence wrapper around it.

   Excluded, and you must check before reporting: surfaces that are opened
   very often or by keyboard - context menus, dropdown menus, command
   palettes, tooltips after the first - which should open instantly, and
   data being read or acted on (a table, a chart, a live counter), which
   should not move for style. "No animation" is often the right answer; say
   so rather than inventing a finding.

   → `judgment`, severity `minor`. It is a judgment because you cannot always
   tell from source whether the swap is perceptible or whether motion is
   suppressed deliberately. The reasoning: an instant swap makes the user
   re-find their place, because nothing connected the old frame to the new one.
   Motion here is not polish - it is the sentence explaining what happened.
   Remediation: name the specific technique and value - an exit animation
   requires a presence/unmount wrapper, since an unmounted element cannot
   transition; an accordion needs an interpolated height or a grid-rows
   technique; a reorder needs a FLIP. Give a duration and a curve, and prefer
   the project's declared tokens if it has them. Never remediate with a
   scroll-triggered reveal (`whileInView`, an intersection-observer fade-in):
   content should be present on load, and motion belongs to state changes the
   user caused.

6. **`transition: all`.** A `transition` shorthand or `transition-property` set
   to `all`, or the `transition-all` utility.

   → `objective`, severity `minor`. The token `all` is literally present in the
   source. It transitions every animatable property, including ones you did not
   intend and ones added later by a class you have not written yet, which makes
   any future style change a potential animation bug. It also silently animates
   layout properties - see rule 3, which you must not additionally report here,
   since `all` names no property. Remediation: enumerate the properties actually
   changing at that call site (`transition: opacity 150ms ease-out, transform
   150ms ease-out`, or `transition-[opacity,transform]`). If more than three
   properties genuinely change, that is a signal the state change is doing too
   much, and worth saying.

## Optional enrichment

Skip this section entirely if the suite is absent. The rules above stand on
their own.

Enrichment may only deepen a rule this brief already owns. If a suite suggests
a finding that this lens's `## Owns` section leaves to another lens, **do not
report it** - the other lens is already reporting it, and a duplicate with a
different severity and a citation attached is worse than silence. Enrichment
adds evidence and nuance to your territory; it never extends your territory.

If an animation-audit skill is available in this environment - a motion review,
an animation-principles audit, an animation-opportunity finder - consult it and
apply anything it says that falls inside this lens's `Owns`. Discard anything
about visual treatment (`craft`) or layout. For any finding such a skill
produced rather than the rules above, stamp `source` with that skill's name (not
`builtin`), and make `why` cite the named principle it invoked. A skill never
overrides a rule above; it only adds.

## Output

Emit findings matching the `Finding` schema:

```json
{
  "lens": "motion",
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

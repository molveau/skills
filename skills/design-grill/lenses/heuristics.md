# Lens: heuristics

## Owns

Named violations of established UX principles. This lens exists for one purpose:
to turn "this feels off" into a citation. Every other lens reports a defect you
can point at - a literal off the scale, a missing `alt`, a 900ms dropdown. You
report the ones that are only visible when you know the name of the thing you
are looking at, and the name is the whole value you add. A reviewer who is told
"this menu has too many options" argues. A reviewer who is told "this is Hick's
Law: 14 undifferentiated options in one flat menu, and the decision time grows
with the log of the count" already knows what to do.

**Every rule in this brief is `judgment`.**
**This lens produces no objective findings, and nothing it emits is sent to the
verifier.** That is not a
limitation to work around - it is the point. A principle is a lens for reading a
design, not a test that passes or fails, and there is no mechanical check that
confirms a choice set is "large enough to stall a decision". Because nothing you
emit will be checked by anyone but a human reader, your reasoning in `why` is
the only thing standing between this lens and noise. Set `"type": "judgment"` on
every finding you emit; a finding from this lens with `"type": "objective"` is
malformed regardless of how certain you feel.

Two consequences you must accept:

- **The bar is higher, not lower.** An unverifiable finding that is wrong costs
  more than an objective one that is wrong, because nobody catches it. Report
  only what you can argue. If you cannot name the principle and say
  *specifically* how this code violates it, you have a feeling, not a finding,
  and it must not be emitted.
- **Never restate another lens's finding in principled language.** Citing a
  principle over a flaw another lens already owns does not make it yours - it
  makes it the same flaw reported twice, once with a footnote. `layout` owns
  hierarchy, rhythm, and grid monotony. `craft` owns visible treatment and
  interactive states. `motion` owns duration, easing, and whether motion exists.
  `copy` owns error messages, empty states, and loading states. `a11y` owns
  names, roles, and target size. `tokens` owns vocabulary drift. If a finding
  would be true without its principle attached, it belongs to whichever lens
  already owns it.

You cannot see the rendered result, click anything, or time an operation. Every
principle below must be grounded in something readable in source, and each rule
says what that is.

## What to read

Component and route source under the target path: `.tsx`, `.jsx`, `.ts`, `.js`,
`.vue`, `.svelte`. Read whole components and, where you can, whole flows - a
multi-step form's steps, a wizard's stages, a modal's open-to-dismiss path.
Several principles below are about a *sequence*, and cannot be seen in one file.
Ignore `node_modules`, build output, and generated files.

Read for structure rather than for style: the number of options in a set, the
size and grouping of a list, what a handler does before it renders anything, and
what the last screen of a flow offers. Ignore `.css`/`.scss` unless a rule sends
you there.

## Rules

Every rule below is `judgment`. Report at most one principle per element or
flow: if two seem to apply, the more specific one wins, and pick the one whose
remediation you would actually make. Name the principle in `why` - that is a
hard requirement of this lens, and the `## Output` template's third anchor ("or
a named principle") exists for exactly this.

1. **Hick's Law** - decision time grows with the logarithm of the number of
   equally-weighted choices. Not "many options are bad"; *undifferentiated*
   options are, because the reader must consider each one to eliminate it.

   In source: a flat set of peer choices rendered with no grouping, no default,
   no ordering by likelihood, and no progressive disclosure - a `<select>` or
   menu with a long literal option list; a settings panel with a dozen sibling
   toggles under one heading; a nav with fifteen flat links; a `.map()` over a
   long, un-sectioned options constant. The signal is the *flatness*: no
   `<optgroup>`, no section headings, no separators, no "common" set surfaced
   above the rest, no search.

   → `judgment`, severity `minor`. It is a judgment, and the reason matters: no
   count is a threshold. Twenty US states in a `<select>` is fine - the set is
   familiar, alphabetical, and typeahead-searchable, so the user never reads it.
   Six export formats with no default is worse than fifty countries. Decide from
   *differentiation and familiarity*, not from the number, and say in `why` what
   made you conclude the set stalls a decision. If your only evidence is the
   count, do not report.

   Remediation: name the specific structure. Group the options under headings
   that mean something to the user (not to the schema); pick and mark a default,
   which converts a decision into a confirmation; put the two or three real
   choices in front and the rest behind "More"; add a filter if the set is
   genuinely long and genuinely flat. Say which of those this set needs and
   name the groups.

2. **Fitts's Law** - the time to hit a target grows with distance and shrinks
   with size. The corollary that matters for review: a target's size should
   track how often it is used and how badly a miss hurts.

   In source: a frequent or destructive action rendered small or crowded - a
   destructive action (`onDelete`, `onRemove`, `onCancel`, `onDiscard`) rendered
   as a bare icon in a dense row; a primary action sharing an edge with a
   destructive one with no separation between them; a small close/dismiss target
   in the corner of a mobile sheet; the confirm and cancel of a dialog rendered
   as adjacent same-size buttons.

   → `judgment`, severity `major`. It is a judgment because you cannot measure
   the rendered geometry from source and you cannot know the action's frequency
   - you are inferring both from structure and naming, and you must say so. It
   is `major` because when it is real, the failure mode is not slowness: it is
   the wrong action, taken irreversibly, by a user who was aiming at the right
   one.

   **Boundary with `a11y`:** `a11y` owns the mobile 44×44 rule and reports it as
   an objective finding wherever the size is a declared number. Never report a
   too-small touch target here - that is `a11y`'s, it is mechanically checkable,
   and it will be reported without you. Yours is the *relationship*: this target
   is small or crowded **relative to how consequential the action is**, which is
   true regardless of whether it clears 44. A 44×44 delete button pressed
   against a 44×44 confirm button passes `a11y` and is still your finding.

   Remediation: propose the specific change and prefer separation over size.
   Move the destructive action out of the primary path - into an overflow menu,
   behind a confirmation, or to the opposite side of the dialog with real space
   between; the cheapest fix for a misfire risk is usually distance, not
   pixels. Where the action is frequent rather than destructive, name the
   padding or `hitSlop` to add and say what it becomes. Note that screen edges
   and corners are effectively infinite targets on desktop - a thing worth
   spending on the actions that earn it.

3. **Jakob's Law** - users spend most of their time on other products, so they
   expect yours to work like the ones they already know. Every convention you
   break is a thing the user must learn in exchange for something.

   In source: a conventional control reimplemented unconventionally - a
   hand-built `<div>` dropdown where a `<select>` or the project's existing
   select primitive would do; a custom checkbox or radio built from divs and
   state; a date picker with a bespoke interaction; a modal that dismisses on
   scroll rather than on `Escape` or a backdrop click; a link that is a `div`
   with a router `push` in an `onClick`; a "Cancel" on the right and "OK" on the
   left of a dialog against the platform's own ordering; a swipe gesture bound
   to an action the platform binds to another.

   → `judgment`, severity `minor`. It is a judgment because breaking a
   convention is sometimes exactly right - the native control genuinely cannot
   do what the feature needs, and the whole product's identity is sometimes
   built on one deliberate departure. Ask what the departure *buys*, say what you
   concluded, and report only when you cannot find the purchase. It is `minor`
   because the user does usually learn it; the cost is that they had to.

   **Boundary with `a11y`:** a hand-built control almost always *also* has a
   missing role, a missing name, or no keyboard handling, and every one of those
   is `a11y`'s objective finding - do not report them here in principled dress.
   Yours is narrower and different: the control diverges from what the user
   already knows, which remains true even when the reimplementation is perfectly
   accessible.

   Remediation: name the native element or the existing project primitive to use
   instead, and say which file you found the primitive in - a project that has
   already built a `Select` and then hand-rolls a second one has a consistency
   problem as well as a convention problem. If the departure is justified, say
   what it must therefore honour to stay learnable: the platform's keyboard
   contract, its dismiss gesture, its button ordering.

4. **Miller's Law** - working memory holds roughly seven items, give or take
   two, and chunking is what buys you past it. The number is not a law of
   interfaces; the fragility of unchunked memory is.

   In source: content the user must *hold in mind* to act, presented in one
   undifferentiated run past about seven items - a form with fifteen fields in
   one flat block with no fieldsets or steps; a comparison table with a dozen
   unsectioned rows; a confirmation dialog listing every consequence in one
   paragraph; a code or reference number rendered as one unbroken string.

   → `judgment`, severity `minor`. It is a judgment, and this is the sharpest
   distinction in the rule: the constraint applies only to items held in memory,
   not to items on screen. A list of 200 emails does not violate Miller's Law -
   the reader scans it, they do not memorise it, and the screen *is* their
   memory. A four-field form whose fields must be reconciled against a document
   the user is holding taxes memory harder than that list ever will. Report only
   where the user must carry something from one part of the interface to
   another, and say in `why` what you believe they must carry. If everything is
   visible and nothing must be retained, do not report.

   Remediation: name the chunks and the boundaries. Group the form's fields into
   labelled fieldsets by what they are about, or split into steps where the
   steps are real stages and not arbitrary thirds; section the table by category;
   break the reference number into groups of three or four the way every card
   number and postcode already is. Say what each chunk is called - an unnamed
   group is a visual gap, not a chunk, and buys nothing.

5. **Doherty Threshold** - a system that responds within about 400ms keeps the
   user in the interaction; past that, their attention leaves and must be paid
   for again to come back. Under 400ms the user and the machine are in a
   conversation. Over it, they are queuing.

   In source: an operation the user initiated that acknowledges nothing before
   it completes - a handler that awaits a chain of calls, does work, and only
   then renders anything; a navigation that swaps route content with no
   transition or pending indication; a heavy synchronous computation on the
   interaction thread (a large sort, filter, or parse inside a click handler or
   a render path); a form submit whose button neither disables nor changes while
   the request is in flight; an optimistically-safe action (a like, a toggle, a
   local edit) that waits for a server round trip before showing any change.

   → `judgment`, severity `major`. It is a judgment because you cannot time
   anything from source: you are inferring that the operation is slow enough to
   cross the threshold from its shape - a network round trip, a chained await, a
   loop over a large set - and you must state that inference as an inference,
   naming what made you think it is slow. It is `major` because past the
   threshold the user does not merely wait; they tap again, they doubt the tap
   registered, and they attribute the whole product's speed to this moment.

   **Boundaries - read these before reporting; this rule sits between two
   others' territory and duplicates them if left unscoped:**

   - **`copy` rule 4 owns the missing loading state for an async fetch in a
     component.** If the operation is a data read with no `isLoading` branch, no
     skeleton, and no spinner, that is `copy`'s finding and **you must not report
     it here** - the same flaw with a principle cited is still the same flaw.
   - **`motion` owns whether a duration is right for what it animates.** If
     feedback exists and is merely slow or badly eased, that is `motion` rules 1
     and 2. **You must not report it here.**

   What is left for you, and it is a real and distinct thing: cases where the
   *operation* crosses the threshold and there is no fetch for `copy` to hang a
   loading state on and no animation for `motion` to time. Synchronous work
   blocking the thread inside a handler. A route transition with no pending
   state. An action that could have been optimistic and instead waits for the
   network. These three are legitimately distinct from `copy` rule 4: none of
   them is an async fetch with a missing `isLoading` branch. A submit whose own
   control gives no pending response is *not* a fourth instance - `copy` rule 4
   already tests exactly that fact (its own trigger list names "no
   disabled/pending state on the control that triggered it"), so reporting it
   here would be the same finding restated with a principle attached. If your
   finding would survive `copy` and `motion` both being applied first, it is
   yours; if either of them would report it, it is not.

   Remediation: propose the mechanism, not "make it faster". For blocking
   synchronous work: move it off the interaction path - memoise it, do it on a
   worker, virtualise the list, or do it once at load rather than per keystroke;
   name the specific work. For a safe action: make it optimistic, render the new
   state immediately and reconcile on response, and say what the rollback is
   when it fails. For a navigation: name the pending state or the transition
   API. The general form of the fix is that something must change within
   400ms, and if it cannot be the result, it must be an acknowledgement.

6. **Aesthetic-Usability Effect** - users perceive a beautiful interface as
   easier to use, and will forgive real usability problems in one that looks
   good. **This is a caution, not a rule, and it must never be a finding on its
   own.** Do not emit a finding citing it.

   It cuts in two directions and you must hold both. Outward: a polished surface
   hides real problems from the people testing it, so an interface's beauty is
   *evidence about nothing* when you are looking for defects - do not let a
   well-crafted component buy leniency it has not earned, and do not conclude
   that a rough-looking one is broken. Inward, at yourself, and this is why it is
   here: it is the standing temptation of this lens to report polish as function
   - to file a finding that is really an aesthetic preference wearing a
   principle's name, because a citation makes a preference feel like a fact.
   Before you emit anything from this brief, ask whether the finding would
   survive the interface being ugly and whether it would survive it being
   beautiful. If the answer changes, you are reporting taste, and taste from this
   lens is noise. `craft` owns visible treatment and is entitled to its opinions
   about it; you are not.

7. **Peak-End Rule** - people judge an experience by its most intense moment and
   by how it ended, not by its average. The last screen is disproportionately
   what the flow *was*.

   In source: a flow whose final step is a dead end - a submit handler that
   succeeds and renders nothing; a wizard's last step with no confirmation of
   what was created and no route onward; a modal that closes on success leaving
   the user on an unchanged screen with no evidence anything happened; a payment
   or destructive action confirmed only by a toast that expires; a form that
   clears itself on success, which is indistinguishable from a form that failed
   and reset. The signal is a terminal step with no confirmation of the outcome
   and no next action offered.

   → `judgment`, severity `minor`. It is a judgment because you often cannot see
   the whole flow from the target subtree - a redirect may land somewhere you
   cannot read, and a parent may render the confirmation. Say what you could and
   could not see, and do not assert a dead end you have not followed to its end.
   It is `minor` because the work did complete; what is lost is the user's
   confidence that it did, which they pay for by checking.

   **Boundary with `copy`:** `copy` owns error messages, empty states, and
   loading states - the words, and the states that need words. Yours is the
   *shape of the ending*: that the flow terminates without confirming its
   outcome or offering the next step. If your finding is that a message is badly
   worded, it is `copy`'s. If it is that there is no ending at all, it is yours.

   Remediation: name what the ending should confirm and where it should go. It
   needs the outcome stated in the user's terms ("Invoice 1042 sent to
   ana@example.com"), durable evidence rather than an expiring toast, and the
   next action - which is usually *not* "back to dashboard" but the thing they
   are most likely to do next, and often the same thing again. Also look at the
   peak: if the flow has one moment of real anxiety - the irreversible confirm,
   the payment - say that it is the other half of what will be remembered, and
   that it is worth more care than the steps around it.

## Optional enrichment

Skip this section entirely if the suite is absent. The rules above stand on
their own.

Enrichment may only deepen a rule this brief already owns. If a suite suggests
a finding that this lens's `## Owns` section leaves to another lens, **do not
report it** - the other lens is already reporting it, and a duplicate with a
different severity and a citation attached is worse than silence. Enrichment
adds evidence and nuance to your territory; it never extends your territory.

If a `ux-guideline-db` suite is available in this environment - a queryable
database of UX guidelines and heuristics - query it for additional
guideline-level checks beyond the principles above, and apply anything it
returns that falls inside this lens's `Owns`. Discard anything it returns about
token drift (`tokens`), visual treatment or interactive states (`craft`),
spacing and hierarchy (`layout`), motion (`motion`), copy and states (`copy`),
or names, roles and target size (`a11y`) - a guideline database will return
plenty of all six, and they are not yours no matter how well-cited they are. For
any finding produced by the suite rather than by the principles above, stamp
`source` with `ui-ux-pro-max` (not `builtin`) and make `why` cite the named
guideline it returned - the naming requirement is absolute in this lens and
applies to enriched findings exactly as it does to your own. A suite never
overrides a principle above; it only adds. Every finding it contributes is still
`judgment`: this lens emits no objective findings regardless of their source.

## Output

Emit findings matching the `Finding` schema:

```json
{
  "lens": "heuristics",
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

The `type` field above lists both values because the schema is shared across all
seven lenses. **For this lens it is always `"judgment"`** - the `"objective"`
option in that template does not apply to you, and no finding you emit may use
it. Likewise `verdict` stays `null` and stays null: nothing from this lens is
routed to a verifier, so no verdict is ever written back.

`why` is required. The three anchors it may cite are shared across all seven
lenses, but for this lens only the third is available in practice: **every
finding must name its principle** - "Hick's Law", "Fitts's Law", "Jakob's Law",
"Miller's Law", "the Doherty Threshold", "the Peak-End Rule", or a named
guideline returned by an optional suite - and then say specifically how this
code violates it. Naming the principle without the specific violation is not a
`why`; it is a label. A finding whose `why` cannot name a principle must not be
emitted. Do not emit a finding you cannot anchor to a real `file:line`.

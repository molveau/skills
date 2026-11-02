# Lens: copy

## Owns

The words, and the states that need words: microcopy, button and action labels,
error messages, empty states, loading states, text overflow, and i18n readiness.
Copy is not a layer applied over the interface after it works - for most of the
moments that matter, the copy *is* the interface. A user who hits an error sees
one sentence, and that sentence is either the product doing its job or the
product failing in public.

Two of your rules are about states that do not exist rather than words that are
wrong. That is deliberate: an empty list with no empty state and a fetch with no
loading state are both copy problems wearing a code costume - in each case the
interface has nothing to say at the exact moment the user is asking it a
question.

Boundaries:

- **`motion` owns whether a loading *animation* is right** - its duration, its
  curve, whether a state change animates at all. You own whether a loading state
  *exists* and what it says. A spinner that exists and spins for 900ms with the
  wrong easing is `motion`'s finding, not yours; a fetch with nothing rendered
  during it is yours.
- **`a11y` owns the accessible name of a control.** You own the quality of its
  visible label. A button with no name at all is `a11y` rule 1 - do not report
  it. A button clearly named `Submit` is yours (rule 7): it has a name, and the
  name is about the mechanism.
- **`layout` owns hierarchy and composition.** Never report that an empty state
  is badly arranged; report that it is absent or that it says nothing useful.

You cannot see the rendered result. You cannot know how long a string is in
Finnish, or whether a container clipped it. Every rule below is decidable from
source alone, and the two rules that touch on rendering (5, 6) are scoped
accordingly.

## What to read

Component source under the target path: `.tsx`, `.jsx`, `.ts`, `.js`, `.vue`,
`.svelte`, plus `.css`/`.scss` for the overflow rule. Also read, from the
project root reachable above the target: `package.json` (for the i18n rule's
dependency check) and any `locales/`, `i18n/`, `lang/`, `translations/`, or
`messages/` directory, and any `.json`/`.po`/`.yml` message catalogue. Ignore
`node_modules`, build output, and generated files.

Read a whole component before judging it. Every rule below is about a
relationship - a fetch and what renders during it, a list and what renders when
it is empty, a catch and what it shows - and none can be decided from a single
line.

## Rules

Ordering and exclusivity:

- **Rules 1 and 2 are mutually exclusive by construction.** Rule 1 requires a
  human-written sentence that names no next action. Rule 2 requires a raw
  machine artefact - an error object, a status code, a stack - reaching the
  screen. A string is one or the other, never both: `"Something went wrong"` is
  rule 1; `{error.message}` is rule 2.
- **Rules 3 and 4 are different axes and may both match one component.** Rule 3
  is the zero-results state, rule 4 is the in-flight state. A fetch that renders
  neither has both, and they have different remediations. Each `claim` must
  speak only to its own axis.
- **Rule 6 may co-occur with rules 1, 3, and 7** on the same string, because it
  is about a different property of it: rule 6 says the string is not
  translatable, the others say the string is wrong. Where both are true, report
  both and make each `claim` speak only to its own axis, so they do not read as
  one flaw counted twice.
- No other pair below can match the same line.

1. **Error message that states failure without a next action.** A user-facing
   error string that reports that something failed and stops there:
   `"Something went wrong"`, `"An error occurred"`, `"Failed"`, `"Oops!"`,
   `"Unable to complete request"`, `"Error"`. The test is not the wording - it
   is whether the string tells the reader **any** of: what specifically failed,
   why, or what to do next. A string that supplies at least one of the three is
   not a finding, even if it is plain.

   Look in: error boundaries, `catch` blocks that set a message into state,
   toast/alert/snackbar calls, form-level and field-level error rendering, and
   default props named `errorMessage`, `fallback`, or similar.

   → `judgment`, severity `major`. It is a judgment because deciding whether a
   sentence names an action is a reading of meaning, not a pattern match - and
   because sometimes the code genuinely does not know what went wrong, and a
   vague message is the honest floor rather than laziness. Say which you
   concluded and why: a `catch (e)` around a single known fetch knows a great
   deal more than a top-level error boundary does. It is `major` because this
   string is the entire product at the only moment the user is definitely paying
   attention, and a dead end here converts a recoverable problem into an
   abandoned session.

   Remediation: write the replacement string, do not describe it. Give the
   reader a specific cause and a way forward: `"Couldn't save your changes -
   check your connection and try again"` with a retry control beside it beats
   `"Something went wrong"` in every case where the code knows it was a save. If
   the failure is genuinely unknown, say so honestly and still offer the exit -
   a retry, a way back, or a route to support with the correlation id - and
   name the control to add. Do not apologise at length; the user wants the door,
   not the condolence.

2. **Raw error object, status code, or stack surfaced to the user.** A machine
   artefact rendered into user-facing UI: `{error.message}`, `{err.toString()}`,
   `{String(error)}`, `{JSON.stringify(error)}`, `{error.stack}`,
   `{error.code}`, a bare `{response.status}` or `{res.statusText}`, a rendered
   `error.response.data`, or a template literal splicing any of those into a
   displayed string (`` `Error: ${e}` ``). The finding is the *render* - the
   value reaching JSX, a toast body, an `alert()`, or a text node. Logging the
   same value to the console is not a finding and must not be reported; the
   console is for you and the screen is for the user.

   Do not report inside a component gated to development
   (`process.env.NODE_ENV !== 'production'`, a `__DEV__` branch, a debug panel),
   where a raw error is exactly right.

   → `objective`, severity `major`. The check is mechanical: a known error-shaped
   expression appears in a render position, and no dev-only guard encloses it -
   a verifier can confirm both by reading the same lines. It is `major` for two
   reasons that compound. The first is that the string was written for you, not
   for them: `"TypeError: Cannot read properties of undefined (reading 'id')"`
   tells a user only that the product is broken and that nobody thought about
   this moment. The second is that raw errors leak - internal paths, table
   names, service topology, and occasionally the contents of a failed request
   have all reached production screens this way.

   Remediation: give the mapping. Catch the error, log the raw value to the
   console or the error reporter, and render a written sentence chosen by the
   failure class - say exactly which classes this call site can produce (network,
   validation, auth, not-found, unknown) and the string for each. Where support
   needs to identify the incident, show a correlation id, not the exception.

3. **List or collection render with no empty state.** A render of a collection -
   a `.map()` over an array, a `v-for`, an `#each`, a `<FlatList>`/`<SectionList>`
   with a `data` prop - where the source can be empty and nothing renders when it
   is: no length check (`items.length === 0 ? ... : ...`,
   `{items.length > 0 && ...}` with an `else`), no `ListEmptyComponent`, no
   `emptyState`-style prop, no early return for the empty case.

   Apply this rule only when both hold: the mapped collection is sourced from a
   prop, a hook, or fetched/async state - not a statically declared array
   literal in the same file; and the collection's render sits directly in the
   component's own returned tree, not nested inside another collection's
   render (another `.map()`, `v-for`, or `#each`). A collection rendered inside
   another collection's render is a cell of the outer row, not this render
   site's own concern - its parent owns the empty state for the whole list,
   not this render site.

   Do not report when the first clause fails: a hardcoded array literal in the
   same file, a fixed set of tabs, a static nav - the collection cannot be
   empty, so there is nothing to report. Do not report when the empty case is
   plainly handled by an ancestor you can see, even where both clauses of the
   applicability test hold. Do not report when the second clause fails: a row
   of badges rendered inside a row's `.map()` shows nothing when there are
   none, but the render site is a cell of the outer row - the outer list
   already owns the empty state, and reporting the inner render duplicates that
   finding rather than adding a new one.

   When both clauses hold, one more mechanical fact decides severity and
   type: whether the collection render stands alone in the returned tree or
   sits beside other content.

   - **The collection render is the sole content region of the returned
     tree** - the only rendered child of the root element, ignoring pure
     layout wrappers (an element with no text, no other collection render,
     and no sibling content of its own). An empty source here leaves the
     screen blank: nothing else on it tells the user anything went right.
     → `objective`, severity `major`.
   - **The collection render has sibling content** - the returned tree
     renders anything else of substance beside it: text, a field, another
     region. A row of badges rendered beside a name and an avatar in a
     profile card has sibling content; an empty badge row still leaves a
     complete card, not a broken one, so its emptiness may be entirely
     correct. → `judgment`, severity `minor`, and `why` must say that the
     collection renders alongside other content, so an empty render may be
     intentional, and name what the lens could not determine - typically,
     whether an empty result here is a valid end state or a fetch that
     silently returned nothing.

   → The check is mechanical and a verifier can rerun it in full, for either
   branch: a collection render exists; it is sourced from a prop, hook, or
   fetched state rather than a literal declared in the file; it renders
   directly in the component's own returned tree rather than nested inside
   another collection's render; no empty branch, `ListEmptyComponent`, or
   early return exists in the component; and the render is either the sole
   rendered child of the returned tree (ignoring pure layout wrappers) or has
   sibling content of its own - a verifier confirms every one of those facts,
   and the severity and type that follow from them, by reading the same
   lines. The sole-region branch is `major` because a blank region there is
   indistinguishable from a bug - the user cannot tell "you have no invoices
   yet" from "the invoices failed to load" from "this feature is broken".
   They are three completely different situations rendering as the same
   nothing, and the first is the most common moment in any product's life:
   the first run.

   Remediation: for the sole-region case, write the empty state, do not just
   name it. It needs three things and you should supply all three: a sentence
   saying what would be here, a sentence saying why it is not, and the action
   that fills it - `"No invoices yet"`, `"Invoices appear here once you send
   your first one"`, and the button that sends one. Distinguish the
   empty-because-new case from the empty-because-filtered case: they need
   different words ("no results for 'foo'" plus a clear-filters action) and
   conflating them is a separate flaw worth naming. For the sibling-content
   case, phrase it as a question to settle, not a defect to fix: ask whether
   an empty result should say something next to the surrounding content, or
   whether rendering nothing there is correct, and say that only someone who
   knows the domain can decide which.

4. **Async fetch with no loading state.** An async data read in a component - a
   `useEffect` calling `fetch`/an API client, a `useQuery`/`useSWR`, an async
   handler that sets state - where nothing renders to say it is in flight: no
   `isLoading`/`isPending`/`loading` branch, no skeleton, no spinner, no
   disabled/pending state on the control that triggered it, no `<Suspense>`
   boundary you can see around it.

   Do not report when a loading state exists and you merely dislike it - the
   presence of any in-flight affordance closes this rule. Do not report on a
   background refetch of already-rendered data (a poll, a
   `refetchOnWindowFocus`), where showing a spinner over content the user is
   reading is the worse choice. Do not report when a visible ancestor supplies a
   `<Suspense>` fallback.

   → `objective`, severity `minor`. Mechanical: an async read is present, and
   every listed in-flight affordance is absent from the component - a verifier
   confirms by reading the same file. It is `minor` and not higher because,
   unlike a missing empty state, the situation resolves itself: the data
   arrives and the screen becomes correct. The cost is confined to the gap,
   where the user cannot tell whether their tap registered, and so taps again.

   Remediation: name the affordance and where it goes. Prefer a skeleton in the
   shape of the content over a centred spinner - it holds the layout, so nothing
   jumps when data lands, and it tells the user what is coming. For an action
   the user initiated, put the pending state on the control they pressed and
   disable it, which answers "did that work?" at the place they are already
   looking. Say which of the two this call site needs.

5. **Single-line container holding user-supplied text with no overflow
   handling.** An element rendering a value that comes from data rather than
   from source - a name, a title, a filename, an email, a description - inside a
   container constrained to one line (`whitespace-nowrap`, `white-space: nowrap`,
   a fixed `height` that fits one line, a `<Text>` with `numberOfLines={1}`
   absent but a fixed-height parent, a flex row with no `min-w-0`) with no
   handling: no `text-overflow: ellipsis`/`truncate`, no `overflow: hidden`, no
   `line-clamp`, no `numberOfLines`, no wrap.

   → `judgment`, severity `minor`. It is a judgment - and this is the reason -
   because you cannot know from source how long the string will be. A `title`
   field may be capped at 20 characters by a schema you cannot see, or it may be
   a paste of a whole paragraph; the flaw exists only for the strings that are
   long, and you are guessing at their distribution. Report it as a thing to
   check with real data, not as a proven defect, and say what makes you think
   the value is user-supplied and unbounded. On web there is a second reason for
   the judgment: overflow behaviour depends on the whole ancestor chain - a flex
   child needs `min-w-0` before `truncate` does anything - and you may not be
   able to see every ancestor from here.

   Remediation: name the exact fix and the trade-off. `truncate` (or
   `numberOfLines={1}`) is right for a name in a row; a `line-clamp-2` is right
   for a description; letting it wrap is right when the container can grow. If
   you propose truncation, say that the full value must remain reachable - a
   `title` attribute, a tooltip, a detail view - because a truncated string with
   no way to see the rest is data loss, not a layout fix. On a flex row, name
   the `min-w-0` that has to go on the parent, since truncation silently does
   nothing without it.

6. **Hardcoded user-facing string in an i18n project.** A literal, human-readable
   string rendered to the user - JSX text, a `title`/`placeholder`/`label`/
   `aria-label` value, a toast or alert body, a button label - written inline
   rather than passed through the project's translation mechanism.

   **This rule applies only if the project has an i18n setup.** Establish that
   first, before reporting anything under this rule. The evidence is either: a
   translation library in the nearest `package.json`'s dependencies (`i18next`,
   `react-i18next`, `next-intl`, `next-i18next`, `react-intl`/`formatjs`,
   `vue-i18n`, `svelte-i18n`, `lingui`, `expo-localization` with a message
   catalogue, `i18n-js`, `@formatjs/*`); or a locales/translations/messages
   directory containing message catalogues.

   **If the project has no i18n setup, do not report this rule at all** - not at
   a lower severity, not as a judgment, not as a suggestion, not once for the
   run. A project that has made no localisation commitment is not violating one,
   and telling its authors that their English strings are in English is noise
   that costs you their trust in every other finding you filed. Skip the rule
   and say nothing.

   When the setup does exist, exclude before reporting: strings inside dev-only
   or debug branches; `console.*` arguments; test files; strings that are not
   prose (a CSS class, a key, a URL, an id, a data-test attribute, an icon name,
   a format string like `YYYY-MM-DD`); proper nouns and brand names, which are
   normally not translated; and any string already wrapped by the project's own
   mechanism (`t('...')`, `<Trans>`, `<FormattedMessage>`, `$t(...)`, `i18n.t`).

   → `objective`, severity `major`. It is objective because both halves are
   mechanically confirmable and a verifier can rerun both: the i18n setup is a
   named dependency in a named `package.json` or a real directory on disk, and
   the string is a literal in a render position with no `t()` around it - cite
   both facts in `why`, the evidence for the setup and the location of the
   string. It is `major` because it is a broken promise with a delay fuse: the
   project has told its users it speaks their language, and this string will
   silently render in the wrong one, for the users least able to report it. It
   is also the class of defect that is cheap now and expensive later - every
   sprint adds more of them, and they are found by users, not by tests.

   Remediation: give the exact key and the exact call. Follow the project's
   existing key convention - read a neighbouring translated component and match
   it rather than inventing a scheme - and name the catalogue file the entry
   goes in. Where the string interpolates a value, say that it must be an
   interpolation parameter and not a concatenation
   (`t('greeting', { name })`, never `t('hello') + name`), because word order is
   not universal and concatenation hardcodes English grammar into every locale.

7. **Button label describing the mechanism rather than the outcome.** An action
   label naming what the software does instead of what the user gets: `Submit`,
   `Send Request`, `Execute`, `Process`, `OK` on a destructive confirmation,
   `Yes`/`No` answering a question the dialog asked in prose. The test: read the
   label alone, with the surrounding UI covered. If it does not say what will
   happen, it is naming the mechanism.

   → `judgment`, severity `nit`. It is a judgment because the label may be
   correct in its context - a generic `Save` on a settings form is fine, `OK` on
   a purely informational alert is fine, and a form whose heading already says
   "Request a demo" carries some of the meaning for its button. Reason about
   what the surrounding context supplies before reporting, and say what you
   concluded. It is a `nit` and not more because the user usually does work it
   out; the cost is a beat of hesitation, paid by every user, every time.

   Remediation: give the exact replacement string - the verb the user would use
   for what they are doing. `Submit` on a booking is `Book appointment`;
   `Submit` on a form that emails a team is `Send message`; `OK` on a delete
   confirmation is `Delete 3 files`. An outcome-named label also lets a person
   confirm a destructive action by reading one word instead of reconstructing
   the question, which is the case where this stops being a nit and starts being
   a deleted file.

## Optional enrichment

Skip this section entirely if the suite is absent. The rules above stand on
their own.

Enrichment may only deepen a rule this brief already owns. If a suite suggests
a finding that this lens's `## Owns` section leaves to another lens, **do not
report it** - the other lens is already reporting it, and a duplicate with a
different severity and a citation attached is worse than silence. Enrichment
adds evidence and nuance to your territory; it never extends your territory.

If the `impeccable-verbs` suite is available in this environment, consult
`impeccable:clarify` for microcopy, labels, and error wording, and
`impeccable:harden` for resilience - error handling, edge cases, text overflow,
and i18n readiness. Apply anything they say that falls inside this lens's
`Owns`; discard anything about token drift (`tokens`), shadows, borders or
interactive states (`craft`), spacing and hierarchy (`layout`), motion
(`motion`), or accessible names and roles (`a11y`). For any finding produced by
either skill rather than by the rules above, stamp `source` with `impeccable`
(not `builtin`) and make `why` cite the named principle that skill invoked.
Neither skill overrides a rule above; they only add. In particular, neither may
talk you into reporting rule 6 in a project with no i18n setup.

## Output

Emit findings matching the `Finding` schema:

```json
{
  "lens": "copy",
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

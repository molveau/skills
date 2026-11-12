# UX playbook

## Do this first

1. **Read the path and the strings**: the flow around the change, who arrives in what state, the locale files (§1).
2. **Hold the values**: targets 44 touch, 40 dense, 48dp, 24px the WCAG floor; errors beside the field; submit stays enabled.
3. **Native first**: real `button`, `a`, `label`, `input`, `dialog`; ARIA only fills gaps; focus always visible (§11, §12).
4. **Owners elsewhere**: contrast and color `ui` §5; hype, filler and the em dash `writing`; reduced motion `motion` §10.
5. **Check**: the §17 grep list, a keyboard-only and a screen-reader walk, an automated audit; unseen is `Not verified`.

One doctrine for how an interface reads, holds up and works for everyone, from every source in this skill;
vendor files only for depth or worked examples (index: "What to read for which task" in `SKILL.md`). Tags
and credits are at the end.

## 1. Before writing or fixing

- Read the path, not the string: the whole flow around the change, the states before and after, and who
  arrives in what state (rushed, anxious, expert, first time). Infer audience and task from the product;
  ask before changing a factual claim, a legal meaning or a term that may be the domain's own. [Impeccable]
- Inventory the strings first: the translation call (`t(`, `<FormattedMessage`) and its locale files
  (`messages/*.json`, `locales/**`, `*.po`; or a CMS or the API), the noun per object, the verb per action,
  the case per element type and any style guide. New copy uses those terms. [Jakub]
- The product's existing voice is the voice. A deliberate brand voice is not a defect; a departure from
  plain language is a finding only when it creates inconsistency, ambiguity, translation risk or a tone
  the stakes do not support. Rewording to suit your taste is not a finding. [Jakub] [Impeccable]
- Fix small and targeted: no refactor of unrelated code, no UI library migration unless asked, no ARIA
  where native semantics already solve it; for menus, dialogs and comboboxes take an established accessible
  primitive over custom behavior. [ibelick] [Jakub]

## 2. Voice and words

- Plain words that name the user's task, chosen for a tired reader on the first pass; delete every word
  that does no work. No idioms, colloquialisms or humor that will not translate, no greetings, no jargon
  the user did not choose. Hype: `writing` (playbook, "Buzzword verbing"); stock CTAs: `anti-slop` §4. [Molveau] [Jakub] [Impeccable]
- One voice, tone by stakes: success, onboarding and empty states warm; routine actions and settings
  neutral and minimal; errors and destructive confirmations calm and plain; data loss, privacy, payment
  and security serious and explicit, warm but never joking. [Jakub] [Impeccable]
- One vocabulary: the same noun and verb for the same concept everywhere ("Archive" in the menu is
  "archived" in the toast, never "Move to storage"). Keep a short glossary when drift spans the product;
  never vary words for literary effect. A synonym is a finding only where one thing has two names. [Jakub] [Impeccable]
- Address the reader as "you"; in errors "we" reads as deflection ("Unable to load content"). Few
  possessives, never mixed in one flow ("My account" beside "Your settings"). Skip needless gender; "tap"
  on touch, "click" with a pointer, "select" for both. [Jakub]
- One capitalization policy per element type, sentence case by default ("Save Changes" beside "Discard
  changes" reads as sloppiness). [Jakub]
- Message hierarchy per state: the one fact the user needs now, the next action, only the context that
  changes the decision, the tone for the moment. Say each idea once; an intro that repeats its heading
  goes. The final copy is as short as it can be without losing meaning or recovery. [Impeccable]
- Cut the filler words: "successfully" ("Changes saved"), "please" in routine instructions. [Jakub]

## 3. Actions, links and settings

- Buttons start with a verb and name what happens: "Send invoice", "Save draft", "Delete project"; never
  "Submit", "OK" or "Let's go". Describe the outcome, not the gesture. [Molveau] [Jakub] [Impeccable]
- A multi-step flow keeps one vocabulary: one entry verb, either "Continue" or "Next" to advance (never
  both), "Done" to finish. [Jakub]
- Link text makes sense out of context, since screen-reader users browse a list of links: "Read the
  billing docs", never "Click here" or a bare "here"; two "Learn more" on a page each get their object
  ("Learn more about exports"). [Jakub] [ibelick] [Impeccable]
- Icon-only controls carry an accessible name that names the action ("Delete project", "Close dialog"),
  never the glyph ("Trash icon", "X"). [Jakub] [ibelick] [Impeccable]
- A toggle describes its ON state ("Send read receipts"), never a negative; link straight to a referenced
  setting ("Notification settings") instead of spelling its path. [Jakub]
- Help text answers the question the control raises instead of restating it; rare detail goes behind
  progressive disclosure. [Impeccable]

## 4. Errors

- An error is an instruction beside the field or block that failed: what failed, why when known and
  useful, and how to recover or what alternative remains. "Unable to save. Check your connection and try
  again." Never "Something went wrong" or "Oops" alone, no blame, no exclamation marks. [Molveau] [Jakub] [Impeccable]
- Phrase the fix positively ("Use at least 8 characters", not "Don't use fewer than 8"); "Enter a date as
  DD/MM/YYYY", not "Invalid date". A requirement known in advance shows as helper text before input, not
  only in the error. [Jakub] [Impeccable]
- Internal codes and raw exception text are never the primary message (a code may follow as a detail for
  support); never promise a cause or a fix the system cannot know. [Impeccable]
- Keep everything the user typed through every error, retry and re-render. [Molveau] [Impeccable] [Jakub]
- Map failures to states: 400 inline per field; 401 back to sign-in, then to the same place with input
  kept; 403 says why and who grants access; 404 a real not-found state; 429 says when to retry; 500 a plain
  message, Retry and a support path. An error stays in its component, never blanking the screen. [Impeccable] [Molveau]
- When the same error keeps firing, redesign the interaction so it cannot happen. [Jakub]

## 5. Destructive actions: undo or confirm

- Undo beats confirmation when the action is reversible and frequent (archive, move, delete to trash): act
  at once and offer it in the result, "Project archived" with an `Undo` action. [Jakub] [Impeccable]
- Confirm first only when the action cannot be undone, affects other people or destroys many items. The
  dialog reads from its title and buttons alone: the title names action and object ("Delete 'Q3 report'?",
  never "Are you sure?"); the body states what is lost, with counts, and who is affected; buttons are verb
  plus object (`Delete report`, `Cancel`), never `Yes` and `No`. [Jakub] [Impeccable]
- Accounts, workspaces and repositories: type the object's name to confirm, the button disabled until it
  matches (the one allowed disable-until-valid case, conflict 1). Focus opens on the least destructive
  action. [Jakub]
- The undo toast stays on screen until dismissed (§16); its color treatment is `ui`'s. [Jakub]

## 6. States: loading, empty, success, partial, offline

- Empty, loading, error, success and offline each have designed copy and a next step; a data view also
  covers first use, no results, filtered, no permission and failed to load, each told apart. [Molveau] [Impeccable]
- Status copy runs in parallel pairs: in progress an `-ing` verb plus the object ("Saving changes…"), done
  object plus past tense ("Changes saved"), failed what did not happen plus the next step ("Changes not
  saved. Check your connection and try again."), unavailable says what enables it ("Add a payment method
  to publish"), partial counts both outcomes ("9 of 12 files uploaded. Retry 3 failed files"). [Jakub]
- Loading names the real operation ("Loading your projects…") and sets an honest expectation when the
  wait is meaningful; determinate progress when available, never invented progress; a time estimate for
  long jobs. The visual (skeleton in the final layout, no shimmer) is `ui` §9's. [Impeccable]
- An empty state says what this place is and how to fill it, with one action: "No projects yet", one
  sentence of why, `Create a project`, optionally a template. A filtered empty state names the query and
  offers the exit ("No results for 'quarterly'. Clear filters"). Never park lasting information there: it
  vanishes once content exists. [Jakub] [Impeccable]
- No permission explains why and how to get access; read-only mode says so before the user tries to edit. [Impeccable]
- Success confirms the outcome briefly and names the next consequence only when it changes what the user
  should do. [Impeccable]
- Offline and slow: say what still works, queue or block honestly, offer Retry; optimistic updates roll
  back visibly on failure; stale data carries a freshness stamp. [Impeccable] [Molveau]

## 7. Onboarding and first run

- Onboarding's job is to reach the moment that proves the product is worth the time, not to teach the
  product. Define that moment and the one key action (first project, first invite) before designing. [Impeccable]
- Show, don't tell: real functionality with sample data or a template, not a separate tutorial mode; teach
  the 20% that delivers 80% of the value, 1-3 core concepts, one at a time. [Impeccable]
- Optional and skippable: experienced users skip with a visible "Skip" or "I'll explore on my own"; the
  product is never locked behind it; a returning user never sees first-run onboarding again. [Impeccable]
- Ask for the minimum at sign-up, explain any field whose purpose is not obvious, smart defaults, collect
  the rest later (what a Québec form must disclose: `loi-25-website`). [Impeccable]
- Teach in context: empty states as the first lesson, a hint at the point of use the first time a feature
  appears, dismissible with "Don't show again", and a dismissal is respected (track seen states). [Impeccable]
- Tours only for dense interfaces, big changes or domain-heavy tools: 3-7 steps, interactive on the real
  UI ("Create a project", not "This is the project button"), skippable, replayable from help, never
  blocking the whole UI. A multi-step flow shows its progress ("Step 2 of 3"). [Impeccable]
- First success is real work and is confirmed in one calm line with the next step; no exclamation marks
  (celebration motion: `motion`'s rare tier). [Impeccable] [Jakub]
- Measure it: time to value, completion, skip rate, and whether people take the next step. A high skip
  rate means too long or not useful. [Impeccable]

## 8. Forms and validation

- Every control has a persistent programmatic label (`<label for>` or a wrapping `<label>`, so label and
  control share one hit target); a placeholder is never the label. Required fields use native `required`
  plus a visible marker explained once per form; required and optional treatment stays consistent. [Jakub] [ibelick] [Impeccable]
- A placeholder shows a realistic example in the accepted format (`name@example.com`, `DD/MM/YYYY`), never
  an instruction; its contrast is `ui` §5's 4.5:1 (conflict 14). [Jakub] [Impeccable]
- Helper text and limits are tied to the field with `aria-describedby`; a remaining-character count stays
  visible. [ibelick] [Impeccable]
- **Keyboard and autofill**: a valid `autocomplete` token on fields about the user (WCAG 1.3.5:
  `name`, `email`, `tel`, `street-address`, `postal-code`, `cc-number`, `username`, `current-password`,
  `new-password`, `one-time-code`, section prefixes like `shipping street-address`), a descriptive `name`,
  a real `<form>`. `type="email|url|tel"`; codes, PINs and card numbers `type="text" inputmode="numeric"`;
  money `inputmode="decimal"`; `type="number"` only for true quantities; `spellcheck="false"` on emails,
  codes and usernames. Never block paste. [Jakub]
- **Accept, then validate**: never filter characters or block typing, trim before validating (autofill adds
  trailing spaces). Validate on submit, never by disabling submit until valid (type-to-confirm in §5 is the
  one exception); the server validates everything again. [Jakub] [Impeccable]
- **On failure**: `aria-invalid="true"` on each failing field (removed once fixed), `aria-describedby` to its
  inline error with text or an icon (never a red border alone), focus moved to the first invalid field. [Jakub] [ibelick]
- **Submit** stays enabled until the request starts; while it runs, a spinner beside the kept label ("Save"
  plus spinner), the button `aria-disabled="true"` and repeat clicks ignored in the handler (native
  `disabled` on the focused button drops focus to `<body>`). Success announces politely. [Jakub]
- An action that is genuinely unavailable says why in visible text beside it. [ibelick] [Jakub]
- Warn before navigating away from unsaved changes; a re-render or hydration never resets a typed value or
  steals focus. [Jakub]

## 9. Strings, i18n and formatting

- Build sentences whole: one message with placeholders the translator can move (`{name} invited you to
  {project}`), never `"You have " + n + " messages"`; plurals through ICU MessageFormat (`=0`, `one`,
  `other`, plus `few` and `many` where a language needs them) or `Intl.PluralRules`, never `n === 1 ? "" :
  "s"`. [Jakub] [Impeccable]
- Format through `Intl` with the user's locale: `NumberFormat` (currency, units, Eastern Arabic digits),
  `DateTimeFormat` (calendars such as Jalali or Hijri), `RelativeTimeFormat`, `ListFormat`; never
  `toLocaleDateString()` without a locale or dates from `getMonth()`. [Jakub] [Impeccable]
- Room to grow: allow expansion instead of abbreviating early; no fixed widths on text (a `w-24` button
  breaks in German). Budget and the CSS: `ui` §3. [Impeccable] [Molveau]
- RTL: logical properties; mirror only direction-bearing icons (`ui` §8). Arabic-script text keeps
  the zero-width non-joiner (U+200C), stores Persian and Arabic Yeh and Kaf as typed and treats them as
  equal in search and validation. UTF-8 everywhere; test CJK and emoji (2-4 bytes). [Impeccable]
- French: `french-typography` for spacing, quotes and the fixer script. [Molveau]

## 10. Resilience: real data, network, concurrency

- Test the extremes: names of 100+ characters, a single character, empty values, emoji, RTL and CJK,
  accents, numbers in the millions and billions, lists of 1000+ items and 50+ options. Text truncates
  with a way back to the full value or wraps (`ui` §3, §4). [Impeccable] [Molveau]
- Large data: paginate or virtualize, with search and filters; never load 10,000 items at once. [Impeccable]
- Concurrency: no double submission (§8), race conditions handled, optimistic updates with rollback,
  conflicts resolved visibly. [Impeccable]
- Clean up after yourself: listeners, subscriptions, timers removed and pending requests aborted on
  unmount; debounce search input (about 300ms), throttle scroll handlers (about 100ms). [Impeccable]
- Interrupted gestures on custom sliders and drag surfaces: a second pointer never hijacks the drag;
  `pointercancel`, `lostpointercapture`, release outside and window `blur` clear the state and release
  capture; the next drag works without a reload. [Impeccable]
- Progressive enhancement: core tasks work without JavaScript where the stack allows; feature detection,
  not browser detection; fallbacks for unsupported CSS. [Impeccable]
- The server validates and sanitizes every input, guards against injection and rate-limits; client checks
  are a courtesy, never the defense. [Impeccable]

## 11. Semantics and ARIA

- Native first: `<button>` for actions, `<a href>` for anything that goes somewhere (Cmd/Ctrl/middle-click
  must work), real `label`, `input`, `dialog`; never `<div onClick>`. A navigating "button" is a styled
  link, an acting "link" a styled button. [Molveau] [Jakub] [ibelick]
- ARIA only fills gaps: no ARIA beats bad ARIA; a role promises its full keyboard model and states;
  required attributes come with it; never `role="menu"` on site navigation, never a redundant role. [Jakub] [ibelick]
- Accessible names: every control exposes a name, role and state (4.1.2); visible text or
  `aria-labelledby` over `aria-label`; the name starts with the visible label (2.5.3); `aria-label` on a plain `div` or
  `span` is ignored; a `describedby` pointing at a missing id silently fails. [Jakub] [ibelick] [Molveau]
- Disabled: native `disabled` when truly unavailable; `aria-disabled="true"` when it must stay focusable
  or show a tooltip, then block pointer, keyboard and submission in code and style it (forced colors
  included); never both on one element. A tooltip on a natively disabled control never opens: put the
  reason in text beside it. Disabled must not rely on color alone. [Jakub] [ibelick]
- Structure is navigation: headings describe their sections in a coherent outline, styled by CSS not
  chosen by size; one visible `<main>`; same-type landmarks labeled (`<nav aria-label="Breadcrumbs">`);
  lists in `ul`/`ol`, table headers in `th`; `<title>` most specific first ("Billing · Settings · {product}"). [Jakub] [ibelick]
- Expandable controls set `aria-expanded` (and `aria-controls`); `aria-hidden` never on or above anything
  focusable. [ibelick] [Jakub]

## 12. Keyboard and focus

- Everything reachable by pointer is reachable by keyboard (2.1.1), in a logical order equal to the DOM
  order; hover-only interactions get a keyboard path. Only `tabindex="0"` (custom controls) and `-1` (programmatic
  focus); never positive. [Molveau] [Jakub] [ibelick] [Impeccable]
- Trap focus inside modals only; elsewhere Tab moves freely in reading order. [Molveau]
- **Focus always visible** (2.4.7): style `:focus-visible` and keep the browser ring, adding only
  `outline-offset: 2px`, unless the project defines a focus token; a themed ring is at least 2px and 3:1
  against every adjacent color (1.4.11; 2.4.13 AAA is the target); never `outline: none` without a verified
  replacement; forced-colors mode keeps system colors (conflict 13). [Molveau] [Jakub] [ibelick]
- Focus is never fully hidden under sticky chrome (2.4.11): pad the scroller (`ui` §3). [Jakub]
- APG key maps: dialog cycles Tab inside and closes on Escape; tabs move with arrows (wrapping), Home/End,
  Tab exits to the panel, automatic activation when panels are instant, manual when switching is costly;
  menu button opens on Enter, Space or ArrowDown to the first item, ArrowUp to the last, Escape refocuses
  the button; disclosure is a `<button aria-expanded>`; combobox keeps focus in the input with
  `aria-activedescendant`; listbox and radio group are one Tab stop with arrows inside (roving tabindex).
  Escape closes whatever opened last. [Jakub] [ibelick]
- Dialogs: `<dialog>` with `showModal()` (background inert, Escape free); a custom overlay sets `inert`
  on the background, `role="dialog"`, `aria-modal="true"` and a name. Focus moves in on open (first
  focusable, or the least destructive action), returns to the trigger on close (or the nearest container
  if it is gone); opening never scrolls the page. [Jakub] [ibelick] [Impeccable]
- Client-side routes: update `document.title`, move focus to the new `<h1>` (`tabindex="-1"`) or `<main>`,
  restore scroll on back and forward, top of page on new navigation. [Jakub]
- A "Skip to content" link is the first focusable element when repeated chrome precedes `<main>`; anchor
  targets get `scroll-margin-block-start` (about 80px under a sticky header). [Jakub] [Impeccable]
- Enter submits a single-line input's form; in a textarea it is a newline, Cmd/Ctrl+Enter submits only if
  built. Show shortcut hints where they help (a Cmd/Ctrl+K keycap on search). [Jakub] [Impeccable]

## 13. Screen readers and announcements

- Pick the channel, stopping at the first match: focus moves there anyway (opened dialog, first invalid
  field) and nothing else is needed; tied to one control (field error, character count) uses
  `aria-describedby`; non-urgent and untied (toast, "Saved", result count, loading) uses a polite
  `role="status"`; urgent and untied (form-level failure, session expiry) uses `role="alert"`. [Jakub] [ibelick]
- Live regions render empty before their text changes (a region mounted with its message is announced
  unreliably); default polite, never `assertive` for success; short, self-contained messages; never move
  focus to a toast. Loading: `aria-busy="true"` on the region, "Loading…" then the outcome ("Loaded, 12
  results"). Test inserted alerts on the screen readers you target. [Jakub] [ibelick]
- Toasts are never the only carrier of critical information. [ibelick] [Jakub]
- Visually hidden text uses the `sr-only` pattern (1px box, clip, `nowrap`), never `display: none`, for
  context sighted users get from layout ("Opens in new tab"). [Jakub]
- Alt by purpose: decorative or redundant `alt=""` (present, empty: a missing alt reads the file name);
  informative states the meaning; functional names the action ("Search", not "magnifying glass"); an
  image of text repeats the text (better, use real text); a chart gets a short alt plus the data as a
  table or text nearby. SVG: decorative `aria-hidden="true"`, meaningful `role="img"` plus a label. [Jakub] [ibelick] [Impeccable]

## 14. Targets, pointer and gestures

- Build to 44px touch, 40px dense pointer, 48dp Android (this section owns them), extended with a
  pseudo-element on the wrapper or button (never on the `<input>`), shrunk where it would overlap a
  neighbor. [Molveau] [Jakub]
- The WCAG floor is 24x24 CSS px (2.5.8 AA), or the spacing exception: a 24px circle centered on the
  target's bounding box intersects no other target and no other undersized target's circle (20px targets
  4px apart pass); inline, equivalent-control, user-agent and essential exceptions also apply. [Jakub]
- Anything that looks clickable is clickable across its whole visual extent; decorative layers (scrims,
  glows, full-bleed `::after`) take `pointer-events: none`, and `aria-hidden` when they are elements. A
  dismissing modal scrim is a control and keeps its events. [Jakub]
- Every drag has a single-pointer alternative (2.5.7: move up and down buttons, a menu on a kanban card);
  every pinch or swipe has one too (2.5.1). `touch-action: none` only on the surface that runs its own
  gesture, never page-wide. [Jakub]

## 15. Contrast, color, zoom and motion

- Contrast values, measuring and fixing are `ui` §5's. The WCAG criteria to cite: 1.4.3 (text) and 1.4.11
  (non-text). [Molveau] [Jakub] [ibelick]
- Nothing by color alone (1.4.1): status pairs color with an icon, text or underline; errors with text. [Molveau] [Jakub] [ibelick] [Impeccable]
- Zoom and reflow: text survives 200% resize (1.4.4); the page reflows at 320px (400% of 1280) with
  vertical scrolling only, real 2D content (tables, maps, code) scrolling in its own box (1.4.10); text
  boxes take `min-height`, not `height`; media queries in `rem` or `em` so a larger default font switches
  layout; never `maximum-scale=1` or `user-scalable=no`. Windows high contrast is tested. [Molveau] [Jakub] [Impeccable]
- Motion follows the `motion` skill's reduced-motion rule (playbook §10); nothing the user needs disappears
  on a timer. [Molveau] [Jakub] [ibelick]

## 16. Timed UI and media

- Anything that moves, blinks or updates on its own for more than 5 seconds has a visible pause or stop
  (2.2.2), muted looping hero video included; carousels start paused under reduced motion. [Jakub]
- Auto-dismiss only low-stakes confirmations, after at least 5 seconds, paused on hover, on focus and on
  a hidden tab (`document.hidden`); this section owns those timers. A toast with an action, an error or
  information the user may need stays until dismissed. [Jakub] [ibelick] [Molveau]
- Content shown on hover or focus (tooltips, previews) is dismissible without moving the pointer (Escape),
  hoverable (the pointer can move onto it) and persistent until dismissed or no longer relevant (1.4.13). [Molveau]
- Captions on prerecorded video with speech (1.2.2), a transcript for audio (1.2.1), controls always
  rendered. Audio playing over 3 s gets a pause, stop or volume control (1.4.2); never autoplaying with
  sound is the house rule on top. [Jakub] [ibelick] [Molveau]

## 17. Reviewing and reporting

- Order of a pass: copy first, then states and edge cases, then accessibility, then a keyboard-only walk
  and a screen-reader walk (every control announces name, role and state). [Molveau] [Jakub]
- Critical first: names, keyboard, focus and dialogs before semantics and forms, then announcements, then
  contrast and states, then media and motion. Quote the exact snippet, say why in one sentence, propose
  the smallest fix. [ibelick]
- A HIGH accessibility finding cites a WCAG 2.2 A or AA criterion by number or a task an assistive-tech
  user cannot complete; AAA (2.4.13 included), APG conventions, the heading outline and the 44px and 40px
  targets are recommendations, never HIGH. [Jakub]
- Severity: HIGH blocks a task, misleads, hides content from assistive tech or has no recovery (an error
  with no way forward and a destructive action with neither undo nor confirmation are always HIGH, as are
  a missing name (4.1.2) or focus indicator (2.4.7), a pointer-only path (2.1.1), motion ignoring reduced
  motion, loss at 320px or 200% (1.4.10, 1.4.4), and color-only meaning (1.4.1)); MEDIUM makes an
  interaction harder or breaks voice, terms or case; LOW is isolated polish. [Jakub] [Molveau]
- Report one table (Severity, Location `path:line`, Before, After, Why naming the principle or criterion
  and the impact), one row per root cause with all its locations, ordered by severity, ending `Block`
  while any HIGH remains, else `Approve`. Never approve coverage you did not inspect; server or CMS strings
  you could not see and checks you could not run are `Not verified`. With nothing found, say so and list
  what was verified. [Jakub]
- Grep checks before finishing: `Click here`, duplicate `Learn more`, `Oops`, `Something went wrong`, `!`
  in errors, `Are you sure`, `successfully`, `>OK<`, `>Yes<`, sentence fragments around variables, `=== 1 ?
  "" : "s"`, `Don't` toggles, glyph-named `aria-label`, unlocalized dates; `outline: none` without
  `focus-visible`, `<div onClick`, roles without `onKeyDown`, positive `tabIndex`, `disabled={!isValid}`,
  status regions mounted with text, `assertive` toasts, `<img` without `alt`, `aria-hidden` over
  focusables, `user-scalable=no`, drag without a button path. [Jakub]

## 18. Verify before calling it done

- Without a browser: names on every interactive element, handlers on non-native controls, focus styles,
  reduced-motion guards, labels bound to inputs, a stated fix in every error, terms against the inventory,
  locale files read as well as components. [Jakub]
- With one: tab every flow, read names and roles from the accessibility tree, see a ring at every stop,
  run an automated audit (axe or WAVE), test at 320px and 200% zoom, offline and throttled (slow 3G),
  forced API errors, an emptied account, a long locale, submit clicked 10 times fast, and gestures
  interrupted (second finger, scroll across, release outside, switch windows). [Jakub] [Impeccable]
- Regression tests for edge cases, error paths and each confirmed gesture fix where the runner can drive
  input; say what produced the evidence (emulation, synthesized touch, which engine, a real device) and
  what stayed untested. [Impeccable]

## Where sources disagree

1. **Disabling submit.** Impeccable prevents double submission by disabling the button; ibelick says a
   disabled submit must explain why; Jakub never disables submit, for validation or while pending. Choice:
   enabled until the request starts, then `aria-disabled` with repeat clicks ignored and a spinner beside
   the label; native `disabled` only for an action that is truly unavailable, with the reason beside it;
   type-to-confirm (§5) is the one disable-until-valid exception. Why: native `disabled` drops focus to
   `<body>` and gating on validity hides the errors.
2. **Hard limits.** Impeccable's constraint example uses `maxlength` and `pattern`; Jakub never blocks
   typing. Choice: the limit as helper text with a live count tied by `aria-describedby`, validated on
   submit; no silent truncation of pasted text. Why: blocked input gives no feedback.
3. **Target sizes.** The old router said 24px on dense desktop; Jakub calls 44 and 40 heuristics with 24 as
   the AA floor. Choice: build to §14's 44, 40 and 48dp; report under 24px (with no exception) as a 2.5.8
   failure, between 24 and the target as a recommendation.
4. **Heading levels.** ibelick: never skip a level; Jakub: the outline is a recommendation. Choice: build
   without skipped levels; in a review a skipped level is LOW unless it breaks navigation.
5. **Translation room.** The old router said French runs about 20% longer; Impeccable budgets 30-40%.
   Choice: 30-40% (`ui` §3), tested on the longest locale the product ships.
6. **Empty-state anatomy.** Impeccable wants five parts (what, why, how, a visual, help); `anti-slop`
   keeps frame, header and one sentence; Jakub shows a title, a sentence and one action. Choice: title,
   one sentence, one action, optionally a template or help link; a visual only if it is a real preview.
7. **Celebration.** Impeccable's onboarding celebrates completion; Jakub and `anti-slop` ban exclamation
   marks. Choice: one calm confirmation with the next step, celebration motion only in `motion` §1's rare tier.
8. **Step labels.** Impeccable shows "step 1 of 3" progress; `anti-slop` lists "Step 1" as furniture text.
   Choice: progress in a real multi-step flow ("Step 2 of 3" with the step's name) is functional; numbered
   steps decorating marketing sections stay banned.
9. **Raw errors.** Impeccable's harden example prints `error.message`; its clarify forbids internal codes
   as the message. Choice: a written message per failure, the code or raw text only as a support detail.
10. **Fluid type.** Impeccable's harden suggests `clamp()` for text; `ui` keeps product UI on a fixed rem
    scale. Choice: `ui` §4; harden's minimums (16px body, 200% zoom) stand.
11. **Contrast fixes.** Jakub reports a failing pair; Impeccable fixes. Choice: `ui` conflict 11.
12. **Reduced motion.** Jakub replaces movement with opacity cross-fades and keeps spinners and press
    feedback; `motion` shows the final state. Choice: `motion` §10, which keeps both.
13. **Focus ring.** Impeccable (in `ui`) themes focus rings from the palette; Jakub prefers the browser ring
    plus `outline-offset: 2px`. Choice: §12, the browser ring unless the project defines a focus token; a
    themed ring 2px and 3:1. Why: the default adapts to platforms and forced colors.
14. **Placeholder contrast.** Jakub treats placeholders as exempt (aim Lc 30); Impeccable asks 4.5:1.
    Choice: 4.5:1 (`ui` conflict 22). Why: WCAG 1.4.3 does not exempt placeholder text.

## Sources and tags

- `[Jakub]` Jakub Krehel's better-writing and better-accessibility (with their `patterns.md`, focus, forms,
  hit-area, motion, screen-reader and ARIA references), https://github.com/jakubkrehel/skills, MIT, in
  `references/vendor/jakub/`.
- `[Impeccable]` Impeccable's clarify, onboard and harden commands by Paul Bakaus,
  https://github.com/pbakaus/impeccable, Apache-2.0, in `references/vendor/impeccable/` with its LICENSE and
  NOTICE. **Changed here**: paraphrased, condensed and merged with the other sources.
- `[ibelick]` fixing-accessibility from ui-skills by Julien Thibeaut, https://github.com/ibelick/ui-skills,
  MIT, in `references/vendor/a11y/`.
- `[Molveau]` the always-on rules in `SKILL.md`, the house calls and WCAG citations added here, MIT.

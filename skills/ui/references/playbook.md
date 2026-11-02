# UI playbook

## Do this first

1. **Read the project's truth**: `DESIGN.md`, `PRODUCT.md`, tokens, components, sibling screens; match them (§1).
2. **Name the job**: refinement or redesign, and the surface's mode: Persuade, Operate, Read or Experience (§1).
3. **Hold the values**: 4px spacing, body 16/1.5, text 4.5:1 and controls 3:1, press 0.96, feedback 100-150ms, overlays to 300ms.
4. **Owners elsewhere**: tells `anti-slop`; curves, springs, scroll `motion`; forms, focus, targets, ARIA, WCAG `ux`.
5. **Check**: type check, lint, tests, the `anti-slop` detector, `check-motion.mjs` if motion changed; mockup first (§15).

One doctrine from every source in this skill; vendor files only for depth or worked examples (index: "What to
read for which task" in `SKILL.md`). Tags and credits are at the end.

## 1. Before touching pixels

- Read `DESIGN.md`, `PRODUCT.md`, tokens, the component library, `AGENTS.md` or `CLAUDE.md` and sibling
  screens that solve the pattern; match them, in the project's styling system. [Molveau] [Jakub] [feel] [Impeccable]
- Tokens before values. A deliberate, consistent convention (no shadows, a dense grid) is a preference,
  not a finding; the same detail done two ways in one project is a finding. [Molveau/Emil] [Jakub]
- Existing components, then the installed library, bespoke last; never a parallel system. Interactive
  pieces sit on an accessible primitive (Radix-style): focus trap, escape, scroll lock, ARIA. [Molveau/Emil] [Molveau]
- **Refinement preserves, redesign replaces.** A refinement keeps identity, behavior, copy and everything
  outside scope; a redesign keeps product truth, content and function and treats the old look as evidence.
  A section or state inside a surface inherits it. Ask before changing factual copy or adding claims. [Impeccable]
- Name the surface's **mode** by what success looks like: **Persuade** (landing, pricing: decide and act),
  **Operate** (app, dashboard, settings: finish a task), **Read** (docs, guides: understand), **Experience**
  (portfolio, gallery: the work leads). By surface, not product: a tool's landing page is Persuade. Persuade
  and Experience commit to one bold move (a Committed palette, a display face, one signature); Operate and
  Read show ambition as precision (exact alignment, tuned type, restrained color). [Impeccable]
- **Read** surfaces: the world owns the frame (masthead, rail, section openers, how code and tables are
  set); the reading column stays calm (a reading face, real contrast, 60-75 characters near 16px), the
  navigation stays standard, monospace only for code and parameters. [Impeccable]
- One design authority and one pass at a time; for anything user-facing, the flow and stories first. [Molveau]

## 2. Shaping a new surface

- Discovery before code, two or three questions a round, usually one round: the problem, who arrives and
  in what state, the one thing they must do, what only this product can claim, real content with min,
  typical and max ranges, the states that matter, what stays untouched. Never ask for CSS values or style
  lanes; assert the likely answer and invite correction. The brief: three to five bullets when settled. [Impeccable]
- A new visual world comes from the audience's culture, not the category: seven artifacts, places or rituals
  across three material families or more. On a working screen it lends only type, palette, density and one
  signature move; navigation and controls stay standard. [Impeccable]
- Pick a color strategy before colors: **Restrained** (tinted neutrals plus one accent, the Operate floor;
  `anti-slop`'s accent under 5% is its measure), **Committed** (one saturated color owns 30-60%), **Full
  palette** (3-4 named roles), **Drenched** (the surface is the color); Committed and Drenched only as whole
  fields on Persuade and Experience (`anti-slop` conflict 15). Light or dark comes from one sentence of
  physical scene (who, where, under what light), never the category. [Impeccable] [Molveau]
- Prove, don't claim: the first viewport shows the product doing its job. Demonstration data may be
  authored and labeled synthetic; prices, customers and benchmarks are never invented. [Impeccable]
- Refuse the category defaults unless the brief earns them: the hero-metric template (big number, small
  label, supporting stats, accent), identical icon-heading-text cards as the structure, 01/02/03 section
  numbers that carry nothing; an eyebrow above a heading is always refused. Typefaces: conflict 12. [Impeccable]

## 3. Layout and spacing

- Group with space first, background shapes second, separator lines last (dense tables, long settings). The
  gap between groups is at least 2x the gap inside one (8 inside, 16 or more between); a heading has more
  space above than below. [Jakub] [Impeccable]
- One spacing scale on a 4px base (8-only misses the useful middle steps); house steps 4, 8, 12, 16, 20, 24,
  32, 40, 48, 64, 80, 96, 128; one step per nesting level (16px a sound default), `gap` for sibling rhythm;
  rhythm comes from tight against generous, not one repeated value. [Impeccable] [Jakub] [Molveau]
- Few shared edges, everything on them (table numbers `end`, text `start`). The fact the user came for
  leads; in a row identity first, metadata and actions trail; visual order equals DOM order. [Jakub]
- One focal point and one primary action per view; more than 3 secondary actions go in a menu; at a
  decision point 4 visible options or fewer (5-7 needs grouping, 8+ overloads); top-level nav 5 or fewer.
  Squint test: blurred, the primary, the secondary and the groups still read in order. [Molveau/Emil] [Jakub] [Impeccable]
- Controls look like controls (fill, border, underline or toolbar zone). Clearance without a density
  system: 12px between bordered controls, 24px between borderless buttons and between unrelated groups. [Jakub]
- Cards are the lazy container: spacing and alignment do basic layout and cards never nest. [Impeccable]
- Hidden content gets a cue: the next item peeks 16-32px past a scroll edge, a disclosure names what it
  hides ("Show 12 more results"), a truncated value has a keyboard-reachable way to the full text. [Jakub]
- Content bleeds, controls float: media to the edges, text and controls in the margins and safe areas
  (the safe-area insets need `viewport-fit=cover`); sticky headers set `scroll-padding-block-start`. [Jakub]
- Logical properties for anything that mirrors (`margin-inline-start`, `text-align: start`); progressions
  (stars, steps) mirror in RTL, digits never reverse. [Jakub] [Impeccable]
- Plan for growth: `max-width` and `min-height`, never fixed text boxes; budget 30-40% for translation;
  test German. Overflow: `minmax(0, 1fr)`, `min-width: 0` flex children, `width: 100%` not `100vw`,
  `100dvh` panes, modals with a scrolling body and actions outside it. [Jakub] [Impeccable]
- Overlays escape `overflow: hidden` (`<dialog>`, popover API, a portal); a modal is the last resort. [Impeccable]

## 4. Typography

- Two families at most, each with one job; one well-tuned sans is often right on Operate, where a system
  stack is allowed (conflict 16). Pair for contrast (serif headline, sans body), never two near-identical
  sans. Monospace for code, data and measurement, never as a "technical" costume. [Molveau] [Jakub] [Impeccable]
- Weights 400 or heavier under 18px; 100-300 only from 28px. Properties over raw tags (`font-weight: 650`,
  `font-variant-numeric`), raw tags only for custom axes and `"ss01"`; synthesis off per longhand only. [Jakub]
- A small role scale, each role one decision. Product start: caption 13/1.4/400, body 16/1.5/400, heading
  18/1.3/600, title 24/1.2/600, display 36/1.1/600; a fixed rem scale at a 1.125-1.2 ratio, no fluid
  `clamp()` headings (marketing display may respond to space); headings never below body. [Jakub] [Impeccable]
- Line-height, unitless: product display 1.1 (marketing display 0.9-1.05: `anti-slop` §8), headings
  1.2-1.3, body 1.5-1.6, 3+ lines at least 1.4; a wider measure and light-on-dark text want more. **On
  dark** body keeps its weight, weights under 400 step up one, never lighter (conflict 21). Paragraph
  spacing or first-line indent, not both. [Jakub] [Impeccable] [Molveau]
- Letter-spacing in `em`: headings from 24px -0.01 to -0.02em, never tighter than -0.04em in product UI;
  caps labels (apps only; pages ban them, `anti-slop` §8) 11-12px at +0.04 to +0.06em; body 0;
  `font-kerning: none` is never a fix. [Jakub] [Impeccable] [Molveau]
- Measure: long-form capped at 65ch (60-75 is healthy, about 560-680px at 16px); data and dense tools may
  run wider; display tops out near 6rem. [Molveau/Emil] [Jakub] [Impeccable]
- Wrapping: `balance` on headings and short blocks, `pretty` on paragraphs, `overflow-wrap: break-word`
  where a URL could escape, `nowrap` on labels; start-aligned, never justified. [Jakub] [feel] [Impeccable]
- Tabular figures on anything that changes while visible (timers, prices, numeric columns), proportional in
  prose; check the face. Truncate with a way back (`truncate`, `line-clamp-3`). [Jakub] [feel] [Molveau/Emil]
- A heavier weight (one step, often 600), never italic, for UI emphasis; underline only for links, from the
  font's metrics. Store natural case, set it with `text-transform`. Curly quotes, en dash ranges, the `…`
  character, a non-breaking space in `10 km`; code keeps straight quotes. [Molveau/Emil] [Jakub]
- Size floors, in `rem`: long-form body 16px (move only for a reason you can name), inputs and menus 14px,
  captions 13px, small text 12px (11px only for dense app metadata such as table timestamps). Inputs
  render at 16px on iOS or Safari zooms: `text-base sm:text-sm`, or keep 16px and scale the field. [Jakub] [Impeccable] [Molveau]
- Root-only `antialiased`; `lang` and `dir` wherever they change, mixed-direction values in `<bdi>`; text
  stays selectable. Fonts: `woff2`, used weights only, subset, critical face preloaded, `font-display: swap`
  with a metric-matched fallback. [Jakub] [feel] [Impeccable]

## 5. Color

- Match the project's notation; a new system defaults to `oklch()`; bulk conversion is a migration. [Jakub] [Impeccable]
- A system is ramps: one neutral carrying 80-90% of the interface, one accent, only the status ramps the
  product renders (0-4). Every step serves a role (backgrounds, hover, active, borders, focus ring, solid
  fill, low- and high-contrast text); Radix's 12 steps for a new system, Tailwind's 50-950 where it exists. [Jakub] [Impeccable]
- Two token tiers: primitives by hue and step (`--blue-600`), never in components; semantics by role
  (`--color-text-secondary`, `--color-accent-solid-hover`), the only tier components touch; `accent` for the
  brand so `primary` means one thing; a missing role gets a token. [Jakub] [Impeccable]
- Ramps come from a library (culori, colorjs.io), never the eye: constant hue, vividness peaking mid-ramp,
  the light end stepping 0.04-0.05 OKLCH L and mid-ramp 0.07-0.10, ends short of black and white. [Jakub] [Impeccable]
- Neutrals tint slightly toward the brand hue (chroma 0.005-0.02, held across the ramp) by default; pure
  gray when the brand has no hue (conflict 24). On a colored surface, secondary text is tinted from that
  hue, never gray. [Jakub] [Impeccable] [Molveau]
- The brand color sits on the solid-fill step (Tailwind 600, Radix 9); if white text on it fails, fills use
  a darker step, never a quietly darkened brand (white on most Tailwind 500 fills fails 4.5:1). [Jakub]
- One color, one meaning (hues within 15 degrees count as one), never color alone; status hues 15 degrees
  or more from the accent; exactly one filled action per view. [Jakub] [Molveau/Emil] [Impeccable]
- **Contrast**, on the background the element renders on: text 4.5:1, large text (24px, or 18.67px bold)
  3:1; input borders, control boundaries, icons and focus indicators 3:1 (WCAG 1.4.11); decorative dividers
  in apps and tables may sit near 1.1-1.3:1. [Jakub] [Impeccable] [Molveau] Placeholder text 4.5:1
  (conflict 22). [Impeccable] APCA when asked: body Lc 75 (90 preferred), labels 60, large text (36px
  regular or 24px bold) 45, solid UI 30, dividers 15. [Jakub]
- Fixing contrast: lightness first, hue held; near OKLCH L 0.75 move the background instead. Text on alpha,
  `color-mix()` or images is measured as rendered or given a scrim; remeasure every fix. [Jakub]
- Gradients `anti-slop` allows interpolate `in oklab`; text stays off them or is measured at the worst
  region. Vivid values under `@media (color-gamut: p3)`; gain and loss colors are per-locale. [Jakub]

## 6. Dark mode and theming

- Dark is not light reversed: swap the semantic roles, then drop the accent's vividness a step or two,
  widen separation at the dark end and remeasure every pair (mirrored pairs score differently). [Jakub] [Impeccable]
- One switching mechanism (`prefers-color-scheme`, or a `.dark` class once users can override);
  `prefers-contrast: more` widens each gap by 0.15 OKLCH L or more, per appearance. [Jakub]
- Depth in dark: one white ring (`0 0 0 1px oklch(1 0 0 / 0.08)`, hover 0.13), lighter surface steps. [Jakub] [feel] [Impeccable]
- Suppress transitions during a theme switch (`next-themes`: `disableTransitionOnChange`); theme the parts
  nobody draws: selection, caret, scrollbars, focus rings, underline offset. [Jakub] [Impeccable]

## 7. Surfaces and polish details

- Concentric radius: outer = inner + padding + border (12 inner, 8 padding, 20 outer); past 24px of padding
  or with uneven padding, treat the layers as separate surfaces. [Jakub] [feel]
- Optical over geometric: 2px less padding on an icon button's icon side (16 and 14), a play triangle about
  2px toward its point, asymmetric glyphs fixed in the SVG. [Jakub] [feel]
- **One edge at rest**: a resting surface gets a border or the ring `0 0 0 1px oklch(0 0 0 / 0.06)` (hover
  0.08) over `border: 1px solid transparent` for forced-colors mode, never a drop shadow too. Layered
  shadows only on what floats (menus, popovers, dialogs, dragged items), such as `0 0 0 1px oklch(0 0 0 /
  0.06), 0 1px 2px -1px oklch(0 0 0 / 0.06), 0 2px 4px 0 oklch(0 0 0 / 0.04)` and deeper. Real borders stay
  on dividers, table cells, selected states and inputs. Real depth has an offset and a soft blur; a
  zero-offset colored halo is decoration, a hard offset shadow belongs to neobrutalism. [Jakub] [feel] [Impeccable] [Molveau]
- Content images: a 1px inset outline in pure black or white at 10% (`outline-black/10`,
  `dark:outline-white/10`, `-outline-offset-1`), never a tinted neutral or the accent; not on transparent art. [Jakub] [feel]
- Hit areas follow `ux` §14 (44 touch, 40 dense pointer), extended by a pseudo-element and shrunk where it
  would overlap a neighbor; concentric targets stay sibling buttons, never nested. [feel] [Molveau/Emil]
- Hover styling behind `@media (hover: hover) and (pointer: fine)` (Tailwind 4's `hover:` covers only the
  first condition, Tailwind 3's neither: add a variant); self-drawn pressed states set
  `-webkit-tap-highlight-color: transparent`; scrollable overlays get `overscroll-behavior: contain`. [Jakub] [Molveau]
- Focus rings follow `ux` §12 (the browser ring with `outline-offset: 2px`, or the project's focus token);
  on a red error field an inset white ring can replace the outset ring. Decorative text (drop caps,
  outlines) stays CSS so it stays selectable. [Molveau/Emil] [Jakub]

## 8. Icons

- One library and one stroke family per surface; a stray filled icon among outlines reads as a bug. The set
  is chosen per project behind one module (`anti-slop` owns the default-set and emoji rules). [Jakub] [feel] [Molveau/Emil]
- Rendered stroke tracks the text beside it: 1.5px at 400 (14-16px), 2px at 500-600, 2.5px at 700 or for an
  emphasized standalone icon; 16px icons beside body text, 18px beside 20px text. Use the library's
  absolute-stroke option or `vector-effect: non-scaling-stroke`, since a 24px-grid icon at 16px thins.
  Inline icons 1em-1.25em. [Jakub] [feel] [Molveau/Emil]
- One SVG in `currentColor`, states from CSS (muted, hover strong, pressed accent, disabled opacity 0.4);
  strip hard-coded fills on import. Outline by default, fill marks the active state. [Jakub] [feel]
- Design at render size: test at the smallest size (often 16px), use the set's per-size grid (16, 20, 24),
  prefer a simpler glyph to shrunken detail, always SVG. [Jakub] [feel]
- RTL flips only reading-direction icons (back/forward, chevrons, list and indent, send, speaker waves),
  never logos, checkmarks, objects or media controls. Icon-only controls carry an accessible name. [Jakub] [feel]

## 9. Components and states

- Every interactive component ships default, hover, focus-visible, active, disabled, loading and error; data
  views also empty and success; disabled stays legible. A new variant exists in all of them, and in the
  siblings that carry its peers. [Molveau] [Impeccable] [Jakub]
- Loading is skeletons in the final layout, not a central spinner; an empty state teaches the next action.
  The words and anatomy of every state are `ux` §6's. [Impeccable]
- One affordance vocabulary: one button shape, one form-control set, one icon style; if Save looks different
  in two places, one is wrong. No reinvented scrollbars or controls for flavor. [Impeccable]
- **Interactive checklist** (`references/components.md`): transitions, not keyframes, so rapid actions
  retarget; `transform` set on the element itself (inherited CSS variables lag past about 20 items); an
  `::after` bridges gaps so hover stays continuous across stacked items; decorative and duplicate layers
  `aria-hidden`; gestures tested on a real device. [Molveau/Emil]
- Sheets drag to dismiss only from scroll top with about a 100ms guard; keyboard height from the Visual
  Viewport API. Flick thresholds, springs and drag building: `motion` §6; interrupted gestures and cleanup:
  `ux` §10; auto-dismiss timers: `ux` §16. Name elements by their real term (scrubber, disclosure,
  segmented control) in specs. [Molveau/Emil]

## 10. Feedback motion (the UI values; everything else is `motion`'s)

- Animate only for feedback, a state change, spatial continuity or a rare moment (`motion` §1's tiers);
  often the best animation is none. [Molveau/Emil] [Impeccable]
- High-frequency and keyboard actions get instant feedback or a 100-150ms `opacity` or `background-color`
  change: row hovers, keystrokes, tab switches; a command menu's arrow-key highlight and tooltips after the
  first get none. Expressive motion is for first load, success, empty states. [Molveau/Emil] [Jakub] [feel]
- Every animated state change leaves a static cue (color, icon, label); motion is never the only channel. [Jakub] [feel]
- Interactive state uses transitions or springs, which retarget; keyframes only for one-shot sequences. Name
  the properties (`transition-property: scale, opacity`), never `all`. [Jakub] [feel] [Molveau/Emil]
- **Press**: `scale: 0.96` over 150ms on the ease-out token, not when disabled (`enabled:active:`), never
  below 0.95, with a `static` opt-out where it distracts. [Jakub] [feel]
- **Durations**: feedback 100-150ms, routine UI 150-250ms, dropdowns about 180ms, modals and sheets up to
  300ms, nothing frequent over 300ms. **Exits** take 65-75% of their entrance (about 200 against 300).
  The project's ease-out token, else `motion` §5's `cubic-bezier(0.23, 1, 0.32, 1)`; `ease` for plain
  color hovers; `linear` only for constant progress. [Molveau/Emil] [Impeccable] [Jakub] [Molveau]
- **Popovers and menus** scale from 0.95-0.97 (never 0) with opacity, from their trigger
  (`var(--radix-popover-content-transform-origin)`), rising 6-12px when they move, and exit by reversing
  their scale and fading toward the trigger. Jakub's fixed exit (-12px, 4px blur, 150ms) is for staged
  content only; a full-height exit only when the destination means something (a drawer). [Molveau/Emil] [Jakub] [feel] [Molveau]
- **Stagger**: list items 30-60ms apart, the whole under 400ms; a staged focal entrance (first run,
  success, an empty state) runs 100ms per semantic chunk (title, body, actions), each 12px, 4px blur,
  300ms; never on routine interactions, never on scroll (`motion` §9). [Jakub] [feel] [Molveau]
- Entrances start from an already-visible default on an exponential ease-out: the content is there without
  the animation, which only enhances it. [Impeccable]
- `transform` and `opacity` by default; blur up to 4px and `clip-path` for bounded reveals; never width,
  height, top, left or margins; percent translates for variable-size elements. [Molveau/Emil] [Jakub] [Impeccable]
- Icon swaps on infrequent changes (copy to copied): scale 0.25 to 1, opacity 0 to 1, blur 4px to 0, spring
  `{ duration: 0.3, bounce: 0 }`, or both icons in one grid cell with a 300ms `cubic-bezier(0.2, 0, 0, 1)`
  cross-fade. Tab icons and row hover actions swap instantly. [Jakub] [feel]
- State swaps skip their first render (`AnimatePresence initial={false}`), never around a real entrance.
  From `display: none`, use `@starting-style` with `transition-behavior: allow-discrete`; a CSS entrance
  keeps the hidden state in the `from` keyframe (`fill-mode: both`), never a base `opacity: 0`. [Jakub] [feel]
- Reduced motion is `motion` §10's: spinners, progress and brief press feedback stay; movement, scale-in,
  parallax and loops go (Motion: `MotionConfig reducedMotion="user"`). [Jakub] [Molveau/Emil]
- Review motion at 10% speed; motion you could not watch is `Not verified`: flag it and ask the decision
  owner. `will-change`: `motion` §4. [feel] [Molveau]

## 11. Responsive and platforms

- Mobile first with `min-width` queries; break where the content breaks, with 640, 768 and 1024px as the
  defaults (conflict 23), holding the expanded layout until it stops fitting; container queries for
  components (the container needs a definite width). Test 320px and 200% zoom first, then the widest
  size. [Impeccable] [Jakub] [Molveau/Emil]
- Adapt by rethinking, not scaling: phone one column, bottom nav or a full-screen menu sheet, bottom sheets
  for dropdowns, actions in the thumb zone; tablet two columns or master-detail; desktop more up front within
  a max-width. Same information architecture everywhere, nothing core hidden on mobile. [Impeccable]
- Detect input, not size: `(pointer: coarse)` widens targets, `(hover: none)` drops hover-only behavior.
  Images: `srcset` and `sizes`, `<picture>` for art direction, fixed dimensions, lazy below the fold only. [Impeccable]
- On the phone: native gestures, safe-area insets, the keyboard through the Visual Viewport API; verify on
  real devices (emulation misses touch, performance and browser chrome). [Molveau/Emil] [Impeccable]
- Native apps follow the platform, brand in the layer it leaves open. iOS: 44pt, Dynamic Type (17pt body,
  11pt floor), a 2-5 section tab bar, edge-swipe back. Android: 48dp 8dp apart, type in sp, a 3-5 item
  navigation bar, predictive Back (`references/vendor/impeccable/ios.md`, `android.md`). [Impeccable]

## 12. Reviewing a screen or a change

- Evidence, not taste: each finding cites `path:line` (or screen and component), shows the current code and
  names the principle and user impact. A visual claim needs a rendered look; a check you could not run is
  `Not verified`, never a pass. Reviews are read-only unless asked to fix. [Jakub] [feel]
- Recon first (stack, tokens, components, viewports, written conventions; a convention settles taste but
  never excuses a trigger). State the scope; too big, narrow to one flow and say what was left out. Review
  accessibility, layout, writing, typography, color, then polish (accessibility and writing via `ux`). [Jakub]
- Severity: HIGH blocks a task, misleads, hides content or risks data; MEDIUM harms comprehension or
  consistency; LOW is isolated polish. HIGH on sight: no accessible name or visible focus, pointer-only
  paths, motion ignoring reduced motion, clipping at 320px or 200% zoom, failing text contrast, color-only
  meaning, an unguarded destructive action, truncation or hidden content with no way back, an error with no
  recovery, a semantic color against its meaning, a state change carried by motion alone. [Jakub]
- Cheapest fix first: delete, use the platform, reuse a project token or component, correct the value, add
  last. One root cause is one row with all its locations; at most 15 findings, never padded. One table
  (Severity, Location, Before, After, Why), ending `Block` while any HIGH remains, else `Approve`. [Jakub] [feel]
- Then a **Considered but rejected** table (Location, Candidate, Rejected because): 1-3 real candidates in a
  quick pass, 2-5 in a full one, fewer if fewer exist, never filler. [feel]
- A change review tags each finding `Introduced`, `Regression` or `Pre-existing` (three at most), reads
  removed lines for lost signals (`aria-*`, `alt`, focus styles, `prefers-*`, `tabular-nums`), expands five
  consumers at most and never touches the author's checkout. [Jakub]
- A design critique: the specificity verdict (could an unrelated product use this unchanged?), Nielsen's
  10 heuristics scored 0-4 (real interfaces land 20-32), the cognitive-load checklist, 2-3 strengths, 3-5
  issues tagged P0-P3 with a fix, red flags for 2-3 personas. An audit scores accessibility, performance,
  theming, responsive and integrity 0-4 and fixes nothing. [Impeccable]
- Judge by comparison: put two or three options side by side, pick one, and write one sentence per pick
  naming the cause ("the 13px label sits 3px off the icon's edge"); below your own bar, iterate. [Molveau/Emil]

## 13. Refinement passes

- **Polish** refines, never hides a redesign: fix each drift at the narrowest level, in order: broken
  paths, missing states, flow and responsive drift, visual and motion inconsistency, cleanup. [Impeccable]
- **Distill**: one goal, one next action, 1-2 colors plus neutrals, one family at 3-4 sizes and 2-3 weights.
  **Quieter**: saturation to about 70-85%, weights down a step, motion distances 10-20px, never bounce.
  **Bolder**: only the named target, no new color or face without asking, one move. [Impeccable]
- **Colorize**: give color to roles (status, selection, one region or the primary action), never to
  decoration. **Delight**: one moment in `motion` §1's rare tier, under a second, never delaying the task.
  **Overdrive**: propose 2-3 directions with costs and wait for a pick; progressive enhancement; 60fps,
  simplify below 50. [Impeccable] [Molveau]
- **Extract** only what repeats 3+ times; **document** `DESIGN.md` with exact values, never overwritten unasked. [Impeccable]

## 14. Performance a UI owns

- Measure before and after, biggest bottleneck first: LCP under 2.5s, INP under 200ms, CLS under 0.1. No
  layout shift: media sized or `aspect-ratio`, nothing injected above content, tabular live numbers; images
  in modern formats at 80-85% quality, sized to display. [Impeccable] [feel]
- Long lists: `content-visibility: auto` or virtualization; batch DOM reads before writes. CSS and WAAPI keep
  running on a busy main thread while rAF libraries degrade, so critical feedback stays CSS. [Impeccable] [Molveau/Emil]

## 15. Mockup first, then verify

- New or restyled screens (not a tiny tweak) go through a mockup first when the project works mockup-first,
  Molveau's house default: one self-contained page in the real tokens, type and icons, covering desktop and
  390px, light and dark when both ship, empty, populated and error (loading, long text and extreme data when
  they change the layout) and interactive states. The owner roasts it once complete; iterate, then
  implement; no automated visual roasts or screenshot loops (conflict 14). [Molveau]
- Before calling UI done: type check and lint pass (a file write is not success), tests stay green, the
  states exist, the `anti-slop` detector runs, and every check that did not run is named. [Molveau] [Molveau/Emil]

## 16. Prompts and public sites

- Give an AI tool your taste as constraints: the taste contract (prompt 1) opens a session, anti-generic
  and polish (2, 3) run after each chunk, teardown, palette and motion spec (4-6) as needed
  (`references/prompts.md`). Public marketing sites that should be cited: `references/discoverability.md`. [Molveau]

## Where sources disagree

1. **Press scale.** Jakub and feel 0.96, never below 0.95; Emil 0.97; unslop 0.97-0.98. Choice: 0.96 when
   the project has none; an existing 0.97-0.98 is not a finding.
2. **Entrances.** Jakub and feel stagger infrequent entrances; Impeccable: one authored moment, no load
   choreography on Operate; Molveau: content on load. Choice: `motion` §9 and `motion` §1's rare tier; a
   staged entrance (§10) only for first run, success, an empty state or an owner-asked Persuade hero.
3. **Motion palette.** Molveau/Emil: transform and opacity; Impeccable adds blur, masks and shadow. Choice:
   transform and opacity for feedback, 4px blur and clip-path for bounded reveals, the rest via `motion`.
4. **Durations.** Molveau/Emil under 300ms (`references/animation.md` still cites a 500ms sheet and
   Sonner's 400ms); Impeccable 300-500ms overlays, 500-800ms focal entrances. Choice: 150-250ms, overlays
   to 300ms, longer only through `motion`. Why: long feedback reads as latency.
5. **Measure.** Jakub 60-75 characters, Impeccable 45-75, Molveau/Emil about 65. Choice: cap 65ch, accept 60-75.
6. **Font count.** Jakub rarely over three, Molveau two, Impeccable one on Operate. Choice: two at most.
7. **Em dash.** Jakub offers it for asides; Molveau bans it in copy. Choice: none in copy (`anti-slop` tell 16).
8. **Filled icons in dark.** Molveau/Emil (after Rauno) fill icons in dark; Jakub's fill means active.
   Choice: fill means active in both themes.
9. **Shadows at rest.** Jakub and feel ring cards with layered shadows; `anti-slop` keeps shadows for what
   floats. Choice: one edge at rest (border or `0 0 0 1px` ring), layered shadows only on what floats (§7).
10. **Touch targets.** Molveau/Emil 44px; feel 44 touch, 40 dense; Impeccable's audit WCAG's 24px; Android
    48dp. Choice: `ux` §14 (24 is the legal floor, not a target).
11. **Contrast fixes.** Jakub reports a failing pair; Impeccable fixes it. Choice: fix in work you build;
    in a review of someone else's work, report the measured pair and propose the lightness change.
12. **Typefaces.** Jakub and feel never propose a face unless asked; Impeccable rejects training-data
    defaults on Persuade. Choice: keep the project's faces; on a type change avoid `anti-slop` tells 4, 19.
13. **Verdicts.** Jakub Block or Approve, feel adds Needs changes, Impeccable P0-P3. Choice: Jakub's for
    reviews and audits, Impeccable's scores only inside a design critique.
14. **Visual verification**, the one entry for all four skills. Impeccable requires screenshots, sub-agents
    and live mode; taste loops on screenshots; stageshow films demos; Molveau is mockup-first. Choice: the
    project's rule; mockup-first means code, the owner's roast of the mockup and the deterministic checks,
    with visual checks reported `Not verified`.
15. **Ambition.** Impeccable: when torn, commit; Molveau/Emil: restraint. Choice: by mode (§1).
16. **System fonts.** Impeccable permits system fonts on Operate; `anti-slop` swaps defaults nobody chose.
    Choice: a system stack on Operate when `DESIGN.md` or the owner chose it; by accident it is a tell.
17. **Exits.** Jakub: fixed -12px, 4px blur, 150ms; Lottie and `motion` 65-75%; Molveau/Emil about 80%.
    Choice: 65-75% of the entrance; Jakub's exit for staged content; popovers reverse toward the trigger.
18. **Popover scale and rise.** Molveau/Emil 0.9-0.95, unslop 0.95-0.98, Jakub 12px. Choice: 0.95-0.97,
    rise 6-12px in UI, illustration 20-30px (`motion` §8).
19. **Stagger.** Jakub 100ms per chunk; `motion` 30-60ms under 400ms; Lottie 500ms total. Choice: items
    30-60ms under 400ms, staged chunks 100ms, illustration to 500ms.
20. **Focus ring.** Impeccable themes rings from the palette; Jakub keeps the browser ring plus
    `outline-offset: 2px`. Choice: `ux` §12 (browser ring unless a focus token; themed: 2px, 3:1).
21. **Dark-mode weight.** Impeccable adds a step on dark, taste drops one. Choice: body keeps its weight,
    under 400 steps up one, never lighter on dark.
22. **Placeholder contrast.** Impeccable 4.5:1; Jakub: not covered, aim Lc 30. Choice: 4.5:1, since WCAG
    1.4.3 does not exempt placeholder text.
23. **Breakpoints.** Impeccable: content-driven, and three usually suffice (640, 768, 1024). Choice:
    content-driven, those three as defaults.
24. **Neutrals.** Jakub and Impeccable: pure gray is a good default; `anti-slop` tints. Choice: tint
    slightly toward the brand hue, pure gray when it has none.
25. **Type floors.** Jakub caps +0.05em at 14px or less; taste caps 0 to +0.03em; unslop -0.05em display,
    11px app text. Choice: product tracking floor -0.04em; app caps labels 11-12px at +0.04 to +0.06em;
    small text 12px (11px for dense metadata); marketing display is `anti-slop` §8's.
26. **Hover gate.** Jakub `(hover: hover)`; Emil adds `(pointer: fine)`. Choice: both, everywhere.

## Sources and tags

- `[Jakub]` Jakub Krehel's skills (better-ui, -interface, -layout, -typography, -colors, interface-review),
  https://github.com/jakubkrehel/skills, MIT, in `references/vendor/jakub/`.
- `[feel]` make-interfaces-feel-better by Jakub Krehel, https://github.com/jakubkrehel/make-interfaces-feel-better,
  MIT, in `references/vendor/feel/`.
- `[Impeccable]` Impeccable by Paul Bakaus, https://github.com/pbakaus/impeccable, Apache-2.0, in
  `references/vendor/impeccable/` with its LICENSE and NOTICE. **Changed here**: paraphrased, condensed and
  merged with the other sources; its scripts, live mode and comp pipeline are not reproduced.
- `[Molveau/Emil]` Molveau's distillation of Emil Kowalski's work (https://emilkowal.ski), with details from
  Rauno Freiberg's devouringdetails.com: `references/taste.md`, `animation.md`, `components.md`, `quotes.md`.
- `[Molveau]` Molveau's house rules and reconciliation calls, `prompts.md`, `mockup-first.md` and
  `discoverability.md` (distilled from Suganthan Mohanadasan's research), MIT.

Pointed to, not owned: the vibe-coded tells, de-AI passes and detector (`anti-slop`); curves, springs,
gestures, scroll, timelines and reduced-motion detail (`motion`); copy, forms, states' words, focus,
targets, ARIA and WCAG (`ux`).

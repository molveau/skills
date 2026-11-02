# Animation and motion

Distilled from Emil Kowalski's animation essays. Read before any motion work. Credit: Emil Kowalski (https://emilkowal.ski).

## When to animate (and when NOT to)
Animate ONLY when it serves a clear purpose:
- Explain functionality or a state change
- Give tactile feedback
- Maintain spatial consistency (where did this come from / go to)
- Delight on **rare** interactions

NEVER animate:
- Keyboard-initiated or high-frequency actions (used many times daily): animation
  makes them feel slow.
- Hover effects in frequent-use, goal-oriented tools: instant feels faster.
- Functional/utility flows (banking, power tools): prefer instant feedback.
- Subsequent tooltips: after the first opens, show the rest with zero delay/animation.

> "The best animation is no animation." (Emil Kowalski)

## Concrete defaults
- **Duration:** keep UI animations **under 300ms** (crossfades and other deliberate transitions may run 350 to 450ms; see the `motion` skill guardrails). Micro-interactions 100 to 150ms;
  standard UI 150 to 250ms; modals/drawers/sheets 200 to 300ms. A 180ms select feels more
  responsive than 400ms.
- **Larger elements animate slower.** Match duration to distance traveled. Exits run
  ~20% faster than entrances.
- **Easing** (the most important part):
  - `ease-out` → entering AND exiting UI elements (fast start, slow settle).
  - `ease-in-out` → movement of on-screen elements.
  - `ease` → only basic hover (e.g. background color).
  - `linear` → only constant motion (spinners, progress, hold-to-confirm fills).
  - Avoid plain `ease-in` for UI.
  - Built-in curves are usually too weak: hand-tune custom curves. Sources:
    easings.co, easing.dev. Reliable reveal curve: `cubic-bezier(0.77, 0, 0.175, 1)`
    (ease-in-out-quart). iOS-like sheet curve: `cubic-bezier(0.32, 0.72, 0, 1)` ~500ms.
- **Properties:** animate ONLY `transform` and `opacity` for 60fps (no layout/paint).
- **Scale:** never from `scale(0)`: start at `0.9` to `0.95` paired with opacity.
  Button press → `scale(0.96)` on `:active` (the playbook's value; 0.97 is not a finding).
- **Origin-aware:** scale popovers/dropdowns from their trigger via `transform-origin`
  (e.g. `transform-origin: bottom center`, or `var(--radix-popover-content-transform-origin)`),
  never the default center: else they appear "out of nowhere."
- **Interruptible:** prefer CSS transitions (or the Web Animations API) over keyframes
  and `requestAnimationFrame`, so motion can retarget mid-flight and stay GPU-accelerated.
- **Springs** for mouse-tied / interactive values: "nothing in the real world
  changes instantly."
- **Blur as a bridge:** `filter: blur(~2px)` can smooth a transition when duration +
  easing alone aren't enough.
- **Accessibility:** honor `@media (prefers-reduced-motion: reduce)`: reduce/shorten.

## Transform techniques
- **Percentage translates for variable-size elements:** `translateY(-100%)` always
  moves an element by exactly its own height regardless of content. Hardcoded pixel
  translates break when size changes. `translateY(100%)` fully hides a variable-height
  drawer below its container.
- **Scale (not width/height)** when children must scale together (icon + text on press).
- **3D:** `transform-style: preserve-3d` on the parent; `rotateX()`/`rotateY()` for
  coin/card flips.

## clip-path techniques
- **Prefer `clip-path` over animating height/width for reveals**: hardware-accelerated,
  zero layout shift, no extra DOM nodes (vs `overflow:hidden` + width tricks).
- **`inset(top right bottom left)`** is the workhorse: `inset(100%)` hides; `inset(0)`
  reveals. Animate between them for reveals/wipes.
- **Rounded clipped edges:** `inset(0 75% 0 0 round 17px)`: clean pill/tab shapes.
- **Clean active-state / tab transitions:** duplicate the list as an active-styled
  overlay and animate `inset` across it (keeps text color + indicator in sync: a
  plain color transition never lines up).
- **Comparison sliders:** overlay two images, drive `inset(0 50% 0 0)` from drag.
- **Scroll-linked reveals** (only when the brief calls for scroll storytelling; see the `motion` skill guardrails): map scroll progress to the inset value, or WAAPI
  `el.animate([{clipPath:"inset(0 0 100% 0)"},{clipPath:"inset(0 0 0 0)"}], {duration:1000, fill:"forwards", easing:"cubic-bezier(0.77,0,0.175,1)"})`.
- **Theme-switch reveal:** modern approach is the **View Transitions API** (the
  duplicate-page + clip-path wipe is the legacy hack).

## What makes an animation GREAT (not just good)
- Origin-aware, custom-eased, interruptible, spring-driven where interactive.
- Synchronized properties (use one mechanism like `clip-path` to keep multiple
  visual changes aligned).
- Reviewed in slow-motion and again the next day for off-sync details.

## Common mistakes
- Animating layout-triggering properties (drops below 60fps).
- Popovers scaling from center instead of origin.
- Animating from `scale(0)`.
- Relying on default CSS easing for non-trivial motion.
- Delay/animation on subsequent tooltips.
- Animating high-frequency or keyboard interactions.
- Instant (non-spring) updates on mouse-tied values.
- Animations longer than 300ms, or multiple properties left unsynced.

## Production patterns (Vaul, Sonner, Rauno)
Distilled from emilkowal.ski and Rauno Freiberg's devouringdetails.com.

### Sharper "when not to animate" thresholds
- **A 400ms dropdown feels noticeably less responsive than 180ms**: use ~180ms as the
  snappy-dropdown target.
- Command-menu / list arrow-key highlight must be **instant** (zero transition) or it
  "feels delayed compared to the keys you press" (Raycast ships none here).
- Deciding factor is **frequency of exposure**: morphing/delight is fine if the user
  rarely hits it; daily-repeated actions stay instant.
- **High-frequency skip guard:** measure `deltaMs` between renders and skip the animation
  if `deltaMs <= animationDurationMs`: stops rapid animations piling up.

### Engine choice under load
- CSS animations / WAAPI keep running when the main thread is busy; **rAF-based libs
  (e.g. Framer Motion) degrade under heavy CPU load.** Prefer CSS/WAAPI for critical motion.
- Counterpoint to "always ease-out": Sonner uses plain **`ease` at 400ms** deliberately
  for a softer, more elegant cohesive feel.

### Drag → swipe momentum (no library)
- Projection to pick a flick's snap target:
  `projection = (velocity / 1000) * rate / (1 - rate)` with **`rate = 0.998`** (iOS
  `UIScrollView` deceleration). Turns a drag into a swipe.

### Drawer / sheet gestures (Vaul)
- **Drag the transform directly** (`translateY(${px}px)`), not via a CSS var (vars degrade
  with large content).
- **Rubber-band over-drag:** the more you drag past the edge, the less it moves.
- **Scroll/drag arbitration:** only drag when inner content is scrolled to top, with a
  ~100ms timeout guard so a fast scroll-to-top doesn't dismiss.
- **Keyboard:** Visual Viewport API for keyboard height; height = `viewport - OFFSET`.
- **Synced browser chrome:** animate `<meta theme-color>` via a 50-step color array
  stepped every 10ms on the *same* easing curve as the sheet.

### Toast stacking (Sonner)
- Stack offsets: front `Y(0) scale(1)`, then `Y(-14px) scale(0.95)`, `Y(-28px) scale(0.9)`
 : **gap × index for Y, `1 - 0.05 × index` for scale**, via CSS custom props.
- Enter from `translateY(100%)` → `0`.
- **Swipe-dismiss dual threshold:** dismiss if
  `abs(swipe) >= THRESHOLD || abs(swipe)/timeTaken > 0.11`: the 0.11 velocity cutoff lets
  a fast short flick dismiss below the distance threshold.

### Hold-to-confirm (asymmetric timing)
- Reveal on `:active` = **`clip-path 2s linear`** (slow, deliberate-intent, constant
  progress); release/reset = **`200ms ease-out`** (snappy). Add `:active { scale(0.96) }`
  with a separate ~160ms ease-out for instant press feedback.
- Make the progress overlay `aria-hidden="true"`.

### clip-path extras
- `inset()` takes a `round` keyword: `inset(0 75% 0 0 round 17px)` for a rounded tab
  highlight. Two-layer text mask: dashed `inset(0 0 50% 0)` over solid `inset(50% 0 0 0)`,
  split following the mouse.

### Craft micro-details
- **Concentric hit targets** look better AND use space better: enlarge with CSS, keep
  buttons siblings (not nested) to avoid invalid HTML.
- **Focus-ring contrast by state:** inset white ring on error/red, outset blue ring on
  default.
- **Scroll-fade:** sticky overlay, `opacity = clamp(scrollTop / 15, 0, 1)`.
- **Icon baseline alignment:** 16×16 @1.5pt stroke default; 18×18 @1.75pt when inline with
  20pt text. Dark mode = icon variant switch (stroked → filled), not just recolor.
- **Icon-style consistency:** one filled icon among outlines reads as a bug: unify the family.

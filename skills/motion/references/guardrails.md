# Motion guardrails

Rules that hold for every animation, whatever the tool, with a short code pattern each. The merged doctrine and the calls between sources are in `playbook.md`; `scripts/check-motion.mjs` catches the mechanical rules.

## 1. Animate only when it explains something

Motion earns its place by giving feedback (a press, a result), continuity (where this came from) or hierarchy (look here first). Everything else is delay. Skip motion for actions people repeat all day (keyboard shortcuts, command menus, list navigation). If you cannot say what the motion tells the user, remove it.

**House rule for marketing and business sites:** no scroll reveals, no smooth-scroll libraries, no magnetic buttons, no looping decoration. Drop this rule when the brief calls for scroll storytelling (scroll-linked motion is fine when the motion is the content: a product explained step by step, a timeline, a data story) or the owner asks for a motion layer; either way the page is complete without JavaScript and under reduced motion. A demo that plays once at 40% in view is not a reveal. This is the playbook's §9 rule. The checker's `scroll-reveal` and `while-in-view` findings enforce only the house rule; ignore them for such a brief.

## 2. Animate transform and opacity

Compositor-friendly properties (`transform`, `opacity`, and `filter` sparingly) are the cheapest to animate. Do not animate `width`, `height`, `top`, `left`, `margin` or `box-shadow` on large surfaces.

Tailwind v4 moves things with the CSS `translate`, `scale` and `rotate` properties, not `transform`. A transition list that names only `transform` makes them snap:

```html
<!-- wrong: translate and scale are not in the list, they jump -->
<button class="hover:-translate-y-0.5 active:scale-95 transition-[transform,opacity]">

<!-- right -->
<button class="hover:-translate-y-0.5 active:scale-95 transition-[translate,scale,opacity]">
```

Never `transition-all`, `transition: all` or `transition-property: all`: it animates properties you did not mean to (colors on theme switch, layout on resize) and hides which ones are intended.

## 3. One easing, in a token

Define the curve once and reuse it, with the playbook's tokens (§5). Ease-out (starts fast, lands soft) for things entering or responding to the user; ease-in-out for things moving between two on-screen positions; never `ease-in` on UI. A project's existing near twin (an older `--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)`, say) maps to `--ease-in-out` rather than living beside it.

```css
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);     /* entering, exiting, responding */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1); /* moving between two on-screen positions */
}
.btn { transition: translate 150ms var(--ease-out), scale 150ms var(--ease-out); }
```

## 4. Durations

| What | Duration |
|---|---|
| Press, hover, toggle, tooltip | 100-150 ms |
| Menu, popover, dropdown, small enter or exit | 150-250 ms |
| Modal, drawer, sheet | 200-300 ms |
| Crossfade between two views, hero-level change | 350-450 ms |

Exits take 65-75% of their entrance. Anything over 300 ms on a frequent action feels slow. List stagger gaps are 30-60 ms and the whole sequence stays under about 400 ms. These UI values are `ui` playbook §10's; the table restates them.

## 5. Reduced motion means the final state

Under `prefers-reduced-motion`, do not just slow things down: show the end state (or one chosen static frame) and drop the movement. Keep spinners, progress indicators, brief press feedback and opacity changes that carry meaning; remove translation, scale-in, parallax, loops and autoplay.

Global CSS safety net:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

JS animation needs its own branch, because the CSS rule does not stop a `requestAnimationFrame` loop:

```ts
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
draw(reduced ? STATIC_FRAME : now);   // a frozen frame, not an empty canvas
if (!reduced) frame = requestAnimationFrame(tick);
```

Read the preference reactively (a hook that listens to the media query) so toggling the OS setting takes effect without a reload.

## 6. Run only while it can be seen

A loop that nobody sees still costs battery. Pause when the element is off screen or the tab is hidden, and resume when it returns:

```ts
let inView = true;
const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); });
io.observe(el);
document.addEventListener('visibilitychange', sync);

function sync() {
  const run = !reduced && inView && !document.hidden;
  if (run && !frame) frame = requestAnimationFrame(tick);
  else if (!run && frame) { cancelAnimationFrame(frame); frame = 0; }
}
// cleanup: io.disconnect(); removeEventListener; cancelAnimationFrame
```

## 7. Start when it is actually in view

A scripted demo or intro that begins when its first pixel enters the viewport is over before the reader arrives. Start at about 40% visible (`threshold: 0.4`), restart or resume when it returns, and stop when it leaves.

## 8. Cap canvas resolution

On canvas and WebGL, cap the device pixel ratio (2 is enough) and resize on container changes, not on every frame:

```ts
const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = Math.round(w * dpr);
canvas.height = Math.round(h * dpr);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
```

## 9. Interruptible and cleaned up

Gestures and toggles can reverse mid-flight. Prefer CSS transitions (they retarget from the current value) or springs over keyframes that restart from zero. Every timer, observer, listener, GSAP context and animation frame started in an effect is cancelled in its cleanup.

## 10. Touch and focus

Hover effects are an enhancement: gate them with `@media (hover: hover) and (pointer: fine)` and never hide information behind them. Buttons feel pressed with `:active { scale: 0.96 }` (the `ui` skill's value; an existing 0.97-0.98 is fine). Focus-visible styles are not animated away.

## Check it

```bash
node <skill folder>/scripts/check-motion.mjs src components app
```

Reports `scroll-reveal` (smooth-scroll and scroll-animation libraries), `while-in-view`, `transition-all`, `transform-in-arbitrary-transition` (`transform` alone in a transition list next to `translate-`, `scale-` or `rotate-` classes) and `no-reduced-motion` (a `requestAnimationFrame` that animates, meaning two or more calls, a callback that re-schedules itself, or `@keyframes`, in a file with no reduced-motion handling; one-shot defers such as `requestAnimationFrame(() => setState(x))` are ignored). Exit 1 on findings, `--json` for machines, tests and build folders skipped unless `--include-tests`.

The reduced-motion check is file-local: it accepts a `useReducedMotion(` call, a `matchMedia(` query containing `reduce`, or `prefers-reduced-motion` in code, CSS or a string. A bare import or a comment does not count, and a global rule in another file is not seen. If your setup handles it elsewhere (a site-wide CSS rule, a shared hook), treat the finding as a prompt to confirm that, not as a bug.

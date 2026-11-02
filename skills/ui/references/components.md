# Component craft

Distilled from Emil Kowalski's component case studies (Sonner toast, Vaul drawer,
hold-to-delete). Run this before calling any non-trivial interactive component "done."

## Polish checklist
- [ ] **Interruptible animation**: CSS transitions, not keyframes, so rapid actions
      (e.g. stacking toasts) retarget smoothly instead of jumping.
- [ ] **Animate `transform` directly on the element**, NOT via inherited CSS variables
     : variable transforms cascade style recalc to all children and lag past ~20 items.
- [ ] **Pause time-based UI when the tab is hidden**: gate auto-dismiss timers on
      `document.hidden` + `visibilitychange`, so notifications aren't silently consumed.
- [ ] **Fill visual gaps** in interactive containers with an `::after` pseudo-element
      so hover/pointer state stays continuous across stacked items.
- [ ] **Capture the pointer on drag start** (`setPointerCapture()`) so dragging
      continues when the pointer leaves the element bounds.
- [ ] **Ignore touches after the first** until release (no multi-touch jump).
- [ ] **Convey depth in stacks** via translate + scale; equalize stacked item heights
      to the frontmost item.
- [ ] **`prefers-reduced-motion` support** (Emil's articles omit it: treat as required).
- [ ] **`aria-hidden="true"`** on decorative/duplicate layers (no double announcement).

## Interaction design (how it should feel)
- **Dismiss by flick, not just distance.** `velocity = |swipeAmount| / timeTaken`;
  dismiss when `swipeAmount ≥ threshold` OR velocity exceeds an empirical cutoff
  (~0.11 in Sonner).
- **Rubber-band resistance at limits**: dragging past an edge slows progressively.
- **Drag-to-dismiss only when scrolled to top**, with a ~100ms cooldown after reaching
  top so scroll momentum can't trigger accidental dismissal.
- **Match native physics + easing**: e.g. `cubic-bezier(0.32, 0.72, 0, 1)` ~500ms
  for sheets. The right easing/duration is most of how the component feels.
- **Asymmetric timing for hold-to-confirm:** slow `linear` fill (~2s) to confirm
  intent; snappy `ease-out` (~200ms) to cancel; press feedback `scale(0.97)` ~160ms.
- **Momentum-aware snap points:** snap to nearest checkpoint on release; a hard flick
  skips intermediate points and can dismiss entirely.

## Accessibility & robustness
- **Build on an accessible primitive** (e.g. Vaul wraps Radix Dialog) to inherit focus
  trap, focus restoration, scroll lock, escape-to-dismiss, and ARIA.
- **Virtual keyboard via Visual Viewport API**, not browser auto-scroll:
  `keyboardHeight = innerHeight − visualViewport.height`; set the drawer height/bottom
  so content stays scrollable above the keyboard.
- **Pre-compute states browsers can't transition**: e.g. Safari `theme-color`: flatten
  the semi-transparent overlay onto the background and step through an interpolated
  color array on the same bezier curve.
- **Test gesture components on a real device**, not a resized desktop window.

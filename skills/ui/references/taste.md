# Taste and conventions

The taste layer is distilled from Emil Kowalski's design-engineering work (his essays, Sonner, Vaul), credit to him (https://emilkowal.ski). The throughline: everyone's software is functional now, so taste, feel and invisible detail are the leverage that makes work stand out.

Read this before any UI work. Project tokens and the product's own design system override these defaults when they conflict.

## First principles

- **Taste is logical, not magical.** Almost every taste decision has a reason if you look closely. Never settle for "this feels off": say why, then fix the cause.
- **Beauty is leverage.** It is underused in software; use it to stand out.
- **Invisible details compound.** Polish that no single user notices is what makes an interface feel stunning. Sweat it even when it goes unseen.
- **Make it feel natural.** The best details match what users already expect. Align with real-world physics and intuition.
- **Restraint is the skill.** The hardest, most valuable decision is what not to build, animate or add. Default to less.

## Visual craft defaults

- **Typography:** cap body text near 65 characters per line. Use `tabular-nums` for numbers and prices that update. Bold, never italic, for UI emphasis. Underline only for links. Use a real ellipsis for truncation.
- **Hierarchy:** one clear focal point per screen; everything else supports it.
- **Spacing:** a consistent, intentional rhythm beats cramming. Whitespace is structure, not waste.
- **Press feedback:** interactive elements respond to `:active` with `scale: 0.96` (the playbook's value, §10; an existing 0.97 or 0.98 is not a finding). Touch targets are at least 44px.
- **Color and contrast:** meet WCAG AA at minimum; never rely on color alone to convey state.

## Motion stance

How expressive a product is stays a per-project decision. When you do animate, these are not negotiable (detail in `animation.md`):

- The best animation is often none. Never animate high-frequency or keyboard-driven actions; instant feels faster.
- Animate only `transform` and `opacity`. Never animate layout properties (width, height, top, left, margin, padding).
- Keep UI animations under 300ms (crossfades may take 350 to 450ms; the `motion` skill guardrails decide) and default to `ease-out` for enter and exit.
- Easing is the most important part: a good curve makes a bad animation feel great.
- Make animations interruptible (CSS transitions, not keyframes).
- Popovers and menus scale from 0.95 to 0.97, never from 0, and anchor `transform-origin` to the trigger.
- Always honor `@media (prefers-reduced-motion: reduce)`.

## How to judge UI

- Compare options side by side, pick the winner, then justify the pick in words.
- Review motion in slow motion; what you could not watch is `Not verified`: flag it and ask the decision owner.
- Expect a taste gap: if your output looks worse than your own standard, iterate instead of shipping.
- Vibe-coded tells (violet gradients, gradient text, emoji labels, glassmorphism, eyebrow pills, fade-in on scroll, em dashes in copy and the rest) are covered by the `anti-slop` skill, with a detector script. Run it before calling UI done.

## Mobile and naming

- Mobile: use native gestures, respect safe-area insets, and handle the on-screen keyboard (Visual Viewport API on the web).
- To name a UI element by its real term (scrubber, disclosure triangle, segmented control), look it up on namethatui.com before writing specs or issue titles.

## Component construction

- Build on an accessible primitive instead of reimplementing interaction logic (focus trap, escape to close, scroll lock and ARIA come free with Radix-style primitives).
- Extend, do not duplicate: find the existing component, token or variant and extend it. No parallel component systems.
- Tokens over hardcoded values: colors, spacing, radii and durations come from the design system, never magic numbers inline.
- Mobile first; scale up. Compare with sibling pages and match the pattern they already use.
- For any non-trivial interactive component, run the checklist in `components.md` before calling it done.

## Accessibility baseline

- Keyboard navigable, visible focus states, semantic HTML and roles.
- `prefers-reduced-motion` respected.
- `aria-hidden` on decorative or duplicate layers.
- Gesture components tested on a real device, not a resized desktop window.

## Verify before done

Type check and lint pass (a file write is not success), the existing tests stay green, and the states from `mockup-first.md` exist.

## More in this folder

- `animation.md`: durations, easings, transform and clip-path techniques, common mistakes.
- `components.md`: the polish checklist and interaction physics.
- `discoverability.md`: for public marketing sites only (what gets a page cited by LLMs).
- `quotes.md`: the source quotes behind the rules.

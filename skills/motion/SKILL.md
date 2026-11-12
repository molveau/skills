---
name: motion
description: Designs, builds and reviews web animation. Use when animating anything (transitions, enter and exit, gestures, springs, scroll-linked motion, reduced motion, GSAP, Lottie), when an animation feels janky, when auditing animation code or finding places that should (or should not) animate, when naming an effect, or when building an animated product demo.
---

# Motion

One skill for animation. It merges Emil Kowalski's skills, the official GSAP skills, the 12 principles of
animation, LottieFiles' motion-design skill, stageshow and Molveau's guardrails into one playbook.

## Start here

Open `references/playbook.md` and read two parts: the "Do this first" block at the top, then the section(s) its row in the table below names. Stop there. Open vendor files only for depth or worked examples.

## Always on

1. **Gate first.** Frequency and a named purpose decide whether anything animates; often the answer is no.
2. **`transform` and `opacity`, named, on one ease-out token.** Never `transition-all`; in Tailwind v4 list
   `transition-[translate,scale,opacity]`.
3. **Reduced motion shows the final state**, and every loop pauses off screen and on a hidden tab.
4. **No reveal-on-scroll by default** on marketing sites; scroll-linked motion only for scroll storytelling or
   a motion layer the owner asked for (playbook §9).
5. **Before calling motion done**: run the checker below, then type check, lint and tests.

Neighbors: the `ui` skill owns UI feedback values (press scale, hover, popovers, UI stagger, feedback durations: `ui` playbook §10), which
this skill follows; `anti-slop` owns the tells (meaningless loops, bounce, reveal-on-scroll); `ux` owns
accessibility depth and the words of every state.

## What to read for which task

All paths are relative to this skill folder.

| Task | Read (§ = this skill's playbook) |
|---|---|
| Rules and values for any task | "Do this first" in `references/playbook.md`, then the § from the rows below |
| Code patterns for the guardrails (tokens, reduced motion, pausing, canvas) | §4, §10, §11; `references/guardrails.md` |
| Build an animation from scratch, with recipes | §1 to §5; `references/vendor/emil/animate.md`, `references/vendor/emil/animate/RECIPES.md` (its 500ms drawer and 400ms toast exceed the playbook's 300ms overlay cap in UI: `ui` playbook §10 wins) |
| Enter, exit, layout and shared-element transitions | §8; `references/vendor/emil/animate.md` |
| Review animation code in a diff | §14; `references/vendor/emil/review-animations.md`, values in `references/vendor/emil/review-animations/STANDARDS.md` |
| Audit a whole codebase's motion, get a prioritized plan | §14; `references/vendor/emil/improve-animations.md`, `references/vendor/emil/improve-animations/AUDIT.md` and `PLAN-TEMPLATE.md` |
| Find places that should animate (and reject the rest) | §1; `references/vendor/emil/find-animation-opportunities.md` |
| Name an effect you can only describe | §15; `references/vendor/emil/animation-vocabulary.md` |
| Gestures, springs, drag, sheets, momentum, interruptible transitions | §6, §7; `references/vendor/emil/apple-design.md` |
| The philosophy and the invisible details of polish | `references/vendor/emil/emil-design-eng.md` |
| Audit code against the 12 principles of animation | §14; `references/vendor/principles/12-principles-of-animation.md` |
| GSAP basics: tweens, easing, stagger, `matchMedia` | §3, §5; `references/vendor/gsap/gsap-core.md` |
| GSAP in React or Next.js (`useGSAP`, cleanup) | §3; `references/vendor/gsap/gsap-react.md` |
| GSAP timelines and sequencing | §9; `references/vendor/gsap/gsap-timeline.md` |
| Scroll-linked animation, pinning, scrubbing | §9; `references/vendor/gsap/gsap-scrolltrigger.md` |
| GSAP performance | §4; `references/vendor/gsap/gsap-performance.md` |
| Motion design: personality, choreography, timing tables, patterns | §13; `references/vendor/lottie/motion-design.md`, then its `references/vendor/lottie/motion-design/` folders |
| Faux product UI, animated demo, cursor walkthrough, hero illustration | §12; `references/vendor/stageshow/stageshow.md`, `references/vendor/stageshow/stageshow/examples/` (partial), then `references/vendor/stageshow/stageshow/references/motion.md`, `references/vendor/stageshow/stageshow/references/craft.md` and `references/vendor/stageshow/stageshow/references/framing.md` |
| Bento grids of demos | §12; `references/vendor/stageshow/stageshow/references/bento.md` |
| The stageshow kit's parts and `Act` API | §12; `references/vendor/stageshow/stageshow/references/kit.md` |
| A UI that looks generic or vibe-coded | the `anti-slop` skill |
| Layout, type, color around the motion | the `ui` skill |

Run the checker before calling motion done:

```bash
node <skill folder>/scripts/check-motion.mjs src components app
```

It flags scroll-animation libraries and `whileInView` (the house rule), `transition-all`, `transform` in
arbitrary transition lists that move things, and any animating `requestAnimationFrame` (loops; one-shot defers
are ignored) or `@keyframes` in a file with no reduced-motion handling. That last check is file-local: a
site-wide rule or shared hook elsewhere is not seen, so confirm it instead of assuming a bug. Exit 0 clean, 1
findings, 2 usage; `--json` for machine output. Run on this skill folder itself, it reports the vendored
stageshow files (their reduced-motion handling lives in the kit's stage and hook) and the checker's own
patterns; those are expected.

Vendor files are unmodified upstream copies: take the guidance, skip pointers to missing tools. Credits and licences: `references/vendor/README.md`. Stageshow is vendored without some upstream material, so some of its examples and kit imports do not exist here; adapt any scene to your own product.

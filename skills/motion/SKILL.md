---
name: motion
description: Designs, builds, reviews and audits web animation and motion. Use when animating anything (transitions, hover and press feedback, enter and exit, gestures, springs, scroll-linked or timeline motion), when an animation feels off or janky, when reviewing or auditing animation code, when looking for places that should or should not animate, when naming an effect, when using GSAP or Lottie, or when building a faux product UI or animated demo. Includes guardrails (reduced motion, pausing off screen) and a zero-dependency checker script.
---

# Motion

One skill for animation. It merges Emil Kowalski's skills, the official GSAP skills, the 12 principles of
animation, LottieFiles' motion-design skill, stageshow and Molveau's guardrails into one playbook.

## Start here

**Read `references/playbook.md` first, starting with its "Do this first" block; open vendor files only for depth or worked examples.** The playbook is
the merged doctrine (should it animate, purpose, tool, properties and performance, easing and duration,
springs and gestures, interruption and exit, enter and exit, scroll and timelines, reduced motion, off-screen
and canvas, product demos, Lottie and handoff, reviews and audits, naming) with source tags and the calls made
where the sources disagree. The table below is the depth index.

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

| Task | Read |
|---|---|
| The merged rules, values and conflict calls | `references/playbook.md` |
| Code patterns for the guardrails (tokens, reduced motion, pausing, canvas) | `references/guardrails.md` |
| Build an animation from scratch, with recipes | `references/vendor/emil/animate.md`, `references/vendor/emil/animate/RECIPES.md` (its 500ms drawer and 400ms toast exceed the playbook's 300ms overlay cap in UI: `ui` playbook §10 wins) |
| Review animation code in a diff | `references/vendor/emil/review-animations.md`, values in `references/vendor/emil/review-animations/STANDARDS.md` |
| Audit a whole codebase's motion, get a prioritized plan | `references/vendor/emil/improve-animations.md`, `references/vendor/emil/improve-animations/AUDIT.md` and `PLAN-TEMPLATE.md` |
| Find places that should animate (and reject the rest) | `references/vendor/emil/find-animation-opportunities.md` |
| Name an effect you can only describe | `references/vendor/emil/animation-vocabulary.md` |
| Gestures, springs, drag, sheets, momentum, interruptible transitions | `references/vendor/emil/apple-design.md` |
| The philosophy and the invisible details of polish | `references/vendor/emil/emil-design-eng.md` |
| Audit code against the 12 principles of animation | `references/vendor/principles/12-principles-of-animation.md` |
| GSAP basics: tweens, easing, stagger, `matchMedia` | `references/vendor/gsap/gsap-core.md` |
| GSAP in React or Next.js (`useGSAP`, cleanup) | `references/vendor/gsap/gsap-react.md` |
| GSAP timelines and sequencing | `references/vendor/gsap/gsap-timeline.md` |
| Scroll-linked animation, pinning, scrubbing | `references/vendor/gsap/gsap-scrolltrigger.md` |
| GSAP performance | `references/vendor/gsap/gsap-performance.md` |
| Motion design: personality, choreography, timing tables, patterns | `references/vendor/lottie/motion-design.md`, then its `references/vendor/lottie/motion-design/` folders |
| Faux product UI, animated demo, cursor walkthrough, hero illustration | `references/vendor/stageshow/stageshow.md`, `references/vendor/stageshow/stageshow/examples/` (partial), then `references/vendor/stageshow/stageshow/references/motion.md`, `references/vendor/stageshow/stageshow/references/craft.md` and `references/vendor/stageshow/stageshow/references/framing.md` |
| Bento grids of demos | `references/vendor/stageshow/stageshow/references/bento.md` |
| The stageshow kit's parts and `Act` API | `references/vendor/stageshow/stageshow/references/kit.md` |
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

## Notes on the vendored files

The files under `references/vendor/` are copied unmodified from their authors, so relative links and command
names inside them (slash commands, scripts, setup files) may not exist in this install. Take the guidance;
skip what points at missing tools. Licenses and exact sources are in each vendor folder (`LICENSE`,
`SOURCE.md`).

Stageshow is vendored without some upstream material: its third-party artwork (app icons, brand marks, not
MIT), its `scripts/` (including `film.mjs`), `teaching/` and the example scenes that depict real products.
Some examples and kit imports named in `references/vendor/stageshow/stageshow.md` therefore do not exist
here; its `SOURCE.md` lists what was excluded, and the full set is at https://github.com/benjitaylor/skills.
Adapt any scene to your own product; do not copy third-party marks.

## Credits and licenses

- `references/vendor/emil/` is **Emil Kowalski**'s skills (https://github.com/emilkowalski/skills), MIT.
- `references/vendor/gsap/` is the official **GreenSock** GSAP skills (https://github.com/greensock/gsap-skills), MIT.
- `references/vendor/principles/` is **12-principles-of-animation** by Raphael Salaja (https://github.com/raphaelsalaja/skill), MIT. It is pinned to the last version before the author removed it from the repository.
- `references/vendor/lottie/` is **motion-design-skill** by LottieFiles (https://github.com/LottieFiles/motion-design-skill), MIT.
- `references/vendor/stageshow/` is **stageshow** by Benji Taylor (https://github.com/benjitaylor/skills), MIT for the code. Its `NOTICE.md` explains that product names, marks and artwork in the examples remain with their owners and are not covered by the license.
- `references/playbook.md`, `references/guardrails.md` and `scripts/check-motion.mjs` are Molveau's own (MIT). The playbook paraphrases and condenses the sources above, with credit by tag.

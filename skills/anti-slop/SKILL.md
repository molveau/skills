---
name: anti-slop
description: Removes the AI-generated look from a UI and gives it a direction of its own. Use when a screen, landing page or dashboard looks vibe-coded or generic (purple gradients, gradient text, emoji labels, glow, eyebrow pills, Inter everywhere, buzzword copy, uneven spacing), when the user asks to unslop, de-AI or make a page stop looking generated, and before shipping any UI to check the 20 tells. Includes a zero-dependency detector script and a ratchet-test recipe.
---

# Anti-slop

Vibe-coded UI fails in the same predictable ways. This skill merges three things into one workflow:
the pass-by-pass method from unslop, the art-direction machinery from taste-skill, and a list of 20
dated tells with a script that catches the mechanical ones.

Vendor files are unmodified upstream copies: take the guidance, skip pointers to missing tools. Credits and licences: `references/vendor/README.md`. taste-skill's `scripts/` and `library/` are not vendored: use the direction gate below.

## Start here

Open `references/playbook.md` and read two parts: the "Do this first" block at the top, then the one numbered section the task needs, from the table below. Stop there. Open vendor files only for depth or worked examples.

Overlap: this is the AI-look pass. Review depth (light, deep, AI-look) is set out in the `ui` skill's Neighbors; for a deep audit, suggest `/design-grill` to the user (costly, their call).

## Direction gate

Do this before any code for a new page or screen and as step 3 of every heavy-slop run, even when the
request is one line or says to just do it. The rest of
this skill removes mistakes; it does not give a screen character. Skipped, the result is the median page
every model makes: right in the details, owned by nobody.

1. **Five lines.** **Product**: what it does, for whom. **Character**: two or three concrete words (`calm,
   exact, a little warm`), never clean, modern, sleek, minimal or premium. **World**: the place or material
   the product belongs to; it tints the neutrals and sets the accent. **Moments**: the one or two places that
   get rich colour and detail. **Signature**: one small detail only this product has, used
   consistently.
   A moment is drawn with care, not just cleaned: a chart redrawn for what it must say (smooth lines,
   a mirrored comparison, a real scale), or the product's own object rendered with weight and light.
2. **Inventory, then the idea.** List 8 to 12 things no competitor shares (name, street, numbers in the
   brief, materials, tools, rituals, documents the trade prints). Write: "On this screen, [one item]
   becomes [the device]". That device is the moment.
3. **Refuse the second-order defaults** unless the brand already owns them. They are what a model reaches
   for once the obvious tells are banned:
   - a cream, stone or warm off-white page with a burnt orange, terracotta, sage or forest accent, with or
     without a serif headline (the "paper and ink" look is the new default, not a direction);
   - Fraunces, Instrument Serif, Playfair or Georgia as the headline face by reflex; system-ui as the only face;
   - Inter or Geist on white with one indigo or blue accent;
   - hero, three features, testimonials, call to action, in that order, with no argument for it; on an app screen, four equal stat cards over a bar chart;
   - a centred eyebrow, headline and two buttons as the whole first screen.
4. **Swap test.** Replace the name and the trade with a competitor's. If the screen still fits, change the
   claim, the moment and the signature, and test again.
5. **Show and wait.** Show the five lines and the idea, and wait for the owner. If you cannot ask (the user
   said to just build it, or you run without a person), write them as a comment at the top of the main file
   and build exactly that.

Depth: `anti-slop` playbook §2 (direction) and §12 (app screens); the `design-inspiration-index` skill for
real references.

## The core idea

Slop spreads color and effects over the chrome: backgrounds, buttons, borders, labels. Craft keeps the
chrome quiet and puts the richness into one or two moments of content that people remember. Removing
slop is half the job; a clean screen that could belong to any product is the next template. Every run
ends with a screen only this product could have.

## Order of work

0. **Page from scratch or deep redesign?** Follow taste-skill's run (`references/vendor/taste/taste-skill.md`)
   with the playbook's overrides. App screens: playbook §12.
1. **Look at the screen**, rendered if you can, not only the code.
2. **Audit** against the signs list (`references/vendor/unslop/unslop/references/signs.md`) and the
   20 tells (`references/tells.md`). One line per sign, with where it lives.
3. **Size the job** (heavy, light, no slop) and **write the direction**, then wait for the owner
   (playbook §1 and §2).
4. **Fix in nine passes**, each across the whole screen: spacing, color, icons, copy, type, layout,
   details, visuals, motion (playbook §3 to §14).
5. **Check** with the playbook checklist, run the detector, compare with the audit (playbook §15).
6. **Report** the direction, a few lines per pass, and every claim you removed or could not verify.

## The 20 tells

Full table with replacements: `references/tells.md`. Summary, with what the script catches:

| # | Tell | Script |
|---|---|---|
| 1 | Violet/fuchsia/indigo gradient | yes |
| 2 | Gradient text | yes |
| 3 | Emoji in copy | yes |
| 4 | Inter or Space Grotesk everywhere | no |
| 5 | Colored side-stripe border | yes |
| 6 | Decorative glassmorphism | yes |
| 7 | Low-contrast dark mode | no |
| 8 | Three icon boxes in a row | no |
| 9 | Eyebrow pill above the headline | no |
| 10 | Lucide by default | yes |
| 11 | Untouched shadcn/ui | no |
| 12 | Fade-in on scroll | yes |
| 13 | Cursor-following glow | no |
| 14 | Hover fade on buttons | yes |
| 15 | Inconsistent spacing | no |
| 16 | Em dashes in copy (wording: the `writing` skill) | yes |
| 17 | Buzzword copy (word list: the `writing` skill) | yes |
| 18 | Serif italic accent words | no |
| 19 | Space Grotesk with its usual display-serif partner (pair in `references/tells.md`) | yes |
| 20 | Grain over a gradient | no |

## The detector

```bash
node <skill folder>/scripts/detect-tells.mjs [--json] [--include-tests] <paths...>
```

Zero dependencies, Node 20 or newer, no imports outside this skill folder, so it works when the skill
is installed alone. Exit 0 clean, 1 findings, 2 usage. It skips `node_modules .git .next dist build
.open-next coverage` and test files. It reports `path:line  #tell label  match`. Limits are listed at
the end of `references/tells.md`; treat a hit as "look here".

The same checks run without a shell through the plugin's MCP server: `detect_tells` (a snippet or project
paths), `check_contrast` (any colour pair the screen ships), `fr_typo`, `check_motion`, `check_writing`, and `get_playbook`
to read this playbook by section. `scripts/hook-check.mjs` is a Claude Code PostToolUse hook that runs this
detector on each edited UI file and hands the findings back to the agent. The plugin registers it, on by
default; "Check edited files" in `/config` turns it off. With the skills CLI, register it in the project's
settings (snippet in the repository README).

## Ratchet test in a project

A ratchet pins today's count and fails when it goes up, so the tells can only shrink. Sketch for
`node:test` (adapt the paths and the baseline):

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, globSync } from 'node:fs'; // globSync needs Node 22; on 20 walk the folders yourself
import { detectTells } from './.agents/skills/anti-slop/scripts/detect-tells.mjs';

const BASELINE = { 10: 8, 5: 1 }; // tell number -> allowed findings today
test('no new vibe-coded tells', () => {
  const files = globSync('{app,components}/**/*.{ts,tsx,css}').map((path) => ({ path, text: readFileSync(path, 'utf8') }));
  const now = {};
  for (const f of detectTells(files)) now[f.tell] = (now[f.tell] ?? 0) + 1;
  for (const [tell, n] of Object.entries(now)) assert.ok(n <= (BASELINE[tell] ?? 0), 'tell ' + tell + ': ' + n + ' findings, baseline ' + (BASELINE[tell] ?? 0));
});
```

Lower the baseline whenever you fix one; never raise it.

## Story video

A square clip, about 10 seconds, where the screen unslops itself step by step with redlines. Make it only
when asked. Build the story file exactly as unslop's "Story video" section says
(`references/vendor/unslop/unslop.md`; its reference frames are upstream, not vendored:
https://github.com/heydamir/unslop/blob/main/skills/unslop/references/refs/story-dashboard-frames.webp; one `story.html`, `.s1` to `.s5` CSS on top, `data-gap`,
`data-radius`, `data-slop`, swaps), then render it with this skill's adapted renderer:

```bash
node <skill folder>/scripts/story.mjs unslop-story/story.html unslop-story.mp4   # --wide for 16:9, --play to watch
```

What it adds to unslop's renderer:

- **An Accessibility step.** A step whose name contains Accessibility shows live measurements. Put
  `data-contrast` on two to four text elements whose contrast changes; each shows its WCAG ratio, red
  under 4.5:1 (3:1 for large text), white with `AA` once it passes, grey `?` when a colour cannot be
  read (such as `lab()` or `color(display-p3 ...)`): use sRGB, hex or `oklch()` colours on those elements. Put `data-target` on one or two
  controls; each shows its size, red under 24 by 24 px. Choose elements that fail in the before; never
  mark an element that still fails in the after.
- **A caption**, `<meta name="story-caption" content="...">`, bottom left. State only what is true of
  the run, such as the model and that the screen was not edited by hand.
- **The credit** `molveau.ca/skills · unslop method by @heydamir` is drawn on every frame, as the CC BY 4.0
  licence of unslop asks. Do not remove it.

The story is a presentation of real files: step 0 is the before as it was, and the last step equals the
clean file you ship. Do not polish the story beyond the shipped screen.

## When to read what

| Need | Read (§ = this skill's playbook) |
|---|---|
| Rules and values for any task | "Do this first" in `references/playbook.md`, then the § from the rows below |
| The 20 tells with replacements and the detector's limits | `references/tells.md` |
| unslop's full method, direction, nine passes, checklist, story video | §3; `references/vendor/unslop/unslop.md` |
| Exact values (spacing, type scale, ramps, motion curves) | §5, §7, §8; `references/vendor/unslop/unslop/references/tokens.md` (its motion values are superseded: `ui` playbook §10 and `motion` §5 win, playbook conflict 19) |
| The audit list of signs | §15; `references/vendor/unslop/unslop/references/signs.md` |
| Hero visuals, image prompts, which styles work | §13; `references/vendor/unslop/unslop/references/visuals.md` |
| Glyph, halftone, dither and duotone code | §13; `references/vendor/unslop/unslop/references/effects.md` |
| Finished reference screens (images) | `references/vendor/unslop/unslop/references/refs.md` |
| Snapshot a live URL to work on a copy | §15; `references/vendor/unslop/unslop/scripts/snapshot.mjs` |
| A page from scratch or a deep redesign: inventory, idea, house rules (its dealt direction and gate scripts are not vendored; use the direction gate) | §2; `references/vendor/taste/taste-skill.md` |
| Dashboards, admin and settings screens in depth | playbook §12; the long original is upstream: https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/references/app-screens.md |
| Copy deck, two-line arithmetic, proof without inventing it | §4; `references/vendor/taste/taste-skill/references/copy.md` |
| Type scale, display setting, font loading | §8; `references/vendor/taste/taste-skill/references/type.md` |
| Palette roles, fields, dark pages, contrast | §7; `references/vendor/taste/taste-skill/references/colour.md` |
| Margins, empty space, the frame, sections, the phone | §6; `references/vendor/taste/taste-skill/references/layout.md` |
| Finding, crediting, placing and treating pictures and video | playbook §13; the long original is upstream: https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/references/imagery.md |
| Motion recipes (opt-in: `motion` playbook §9) and scroll scenes | §14; `references/vendor/taste/taste-skill/references/motion.md`, `references/vendor/taste/taste-skill/references/scenes.md` |
| Judging a result with a rubric | §15; `references/vendor/taste/taste-skill/references/critique.md` |
| The dated tells registry by wave | `references/vendor/taste/taste-skill/references/tells.md` |
| The study behind taste's numbers | `references/vendor/taste/taste-skill/references/research.md` |

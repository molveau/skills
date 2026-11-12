---
name: ui
description: Builds, restyles, polishes and reviews user interfaces with taste. Use when building, restyling or improving a UI, page, screen or component, including a hero, navbar, header, cards, a form or a section ("make it better", "make it pop", "add polish"); working on layout, spacing, typography, color, dark mode or design tokens; polishing hover and focus states or details when something "feels off"; responsive or mobile layout; critiquing, auditing or redesigning an interface; doing a design review or UI roast; simplifying or making a design bolder; or writing prompts that get production-grade UI out of an AI tool.
---

# UI

One skill for building and restyling interfaces. It merges Jakub Krehel's skills, make-interfaces-feel-better,
Impeccable and Molveau's own references (including a taste guide distilled from Emil Kowalski's work) into
one playbook.

## Start here

Open `references/playbook.md` and read two parts: the "Do this first" block at the top, then the one numbered section the task needs, from the table below. Stop there. Open vendor files only for depth or worked examples.

## Direction gate

Do this before any code for a new page, screen or restyle, even when the request is one line. The rest of
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

## Always on

1. **Project first.** Its tokens, components, `DESIGN.md` and sibling screens decide before any default here.
2. **One design authority at a time.** Finish one pass before layering another.
3. **One focal point and one primary action per screen**, every state designed (playbook §3, §9).
4. **Mockup before implementation** for new or restyled screens when the project works mockup-first, Molveau's
   house default (`references/mockup-first.md`); otherwise the project's own review process.
5. **Before calling UI done**: the `anti-slop` skill and its detector, then type check, lint and tests.

Neighbors: the `anti-slop` skill owns the vibe-coded tells and de-AI passes; `motion` owns animation beyond
UI feedback; `ux` owns copy, forms, focus, targets, accessibility depth, errors, edge cases and onboarding.
Depth of review: `design-grill` is the deep audit (seven lenses, ranked report), the critique rows below are the
lighter single pass, and `anti-slop` is the AI-look pass.

## What to read for which task

All paths are relative to this skill folder.

| Task | Read (§ = this skill's playbook) |
|---|---|
| Rules and values for any task | "Do this first" in `references/playbook.md`, then the § from the rows below |
| New or restyled screen that needs feedback (not a tiny tweak) | §15; `references/mockup-first.md` |
| Taste defaults when a project has no tokens yet | §1; `references/taste.md` |
| Layout, grouping, alignment, spacing | §3; `references/vendor/jakub/better-layout.md`, then `references/vendor/impeccable/layout.md` |
| Typography: fonts, scale, line length, OpenType | §4; `references/vendor/jakub/better-typography.md` and `references/vendor/impeccable/typeset.md` |
| Color: palette, contrast, dark mode, tokens | §5, §6; `references/vendor/jakub/better-colors.md`, plus `references/vendor/impeccable/colorize.md` to add color |
| Final polish: radii, shadows, optical alignment, icon states | §7, §8; `references/vendor/feel/make-interfaces-feel-better.md` and `references/vendor/impeccable/polish.md`; `references/vendor/jakub/better-ui.md` for exact values |
| Whole-screen ranked review (accessibility and writing live in the `ux` skill) | §12; `references/vendor/jakub/better-interface.md`, the umbrella |
| Review a branch or PR for UI regressions | §12; `references/vendor/jakub/interface-review.md` |
| Full multi-lens design audit of a file, component or route (heavy: several agents) | the `design-grill` skill |
| Visual references or inspiration for a hero, CTA, navbar, motion, icons | the `design-inspiration-index` skill |
| Critique or design review of a screen | §12; `references/vendor/impeccable/critique.md` (heuristics, cognitive load, personas); quick teardown: prompt 4 in `references/prompts.md` |
| Audit: performance, theming, responsive (for accessibility, use the `ux` skill) | §14, §6, §11; `references/vendor/impeccable/audit.md`, `references/vendor/impeccable/optimize.md` |
| Too busy or heavy | §13; `references/vendor/impeccable/distill.md`, `references/vendor/impeccable/quieter.md` |
| Too bland or timid | §13; `references/vendor/impeccable/bolder.md`, `references/vendor/impeccable/colorize.md`, `references/vendor/impeccable/delight.md` |
| Technically ambitious effects | §13; `references/vendor/impeccable/overdrive.md` |
| Plan a new design from scratch | §2; `references/vendor/impeccable/shape.md`; `references/vendor/impeccable/new-work.md` and the mode files (`references/vendor/impeccable/mode-operate.md`, `mode-persuade.md`, `mode-read.md`) for a new visual identity |
| App, dashboard and settings depth | §9; `references/vendor/impeccable/operate.md` |
| Small screens, touch, other platforms | §11; `references/vendor/impeccable/adapt.md`; native: `references/vendor/impeccable/ios.md`, `references/vendor/impeccable/android.md`, `references/vendor/impeccable/adapt.native.md` |
| Write or refresh `DESIGN.md`, extract tokens and components | §1; `references/vendor/impeccable/document.md`, `references/vendor/impeccable/extract.md` |
| Feedback motion recipes (press, enter and exit, icon swaps, theme switch) | §10; `references/vendor/jakub/better-ui/animations.md`, `references/vendor/jakub/better-ui/enter-exit.md`, `references/vendor/jakub/better-ui/icon-transitions.md`; Emil's numbers in `references/animation.md` (full workflow: the `motion` skill). Some recipes there run longer (a ~500ms sheet, Sonner's 400ms): in UI the playbook caps overlays at 300ms (§10) |
| Interactive component done-checklist (toasts, drawers, menus) | §9; `references/components.md` |
| Public marketing site that should be cited by LLMs | §16; `references/discoverability.md` |
| Prompts that force taste into AI-generated UI | §16; `references/prompts.md` |
| The philosophy behind the rules | `references/quotes.md` |
| UI looks vibe-coded or generic | the `anti-slop` skill |
| Copy, errors, empty states, accessibility depth | the `ux` skill |

The Impeccable entry point `references/vendor/impeccable/impeccable.md` describes a full command set with its
own setup files and scripts; read it when you want that whole workflow rather than a single pass. Its
clarify, harden and onboard commands are vendored once, in the `ux` skill.

## Notes on the vendored files

The files under `references/vendor/` are copied unmodified from their authors, so relative links and command
names inside them (Impeccable's slash commands, `scripts/impeccable`, live mode, comp gates) may not exist in
this install. Take the guidance; skip what points at missing tools. Where a vendored file asks for browser
screenshots, sub-agents or automated visual passes, follow the project's own rule (playbook conflict 14). Licenses and exact sources are in each vendor folder (`LICENSE`, `SOURCE.md`).

## Credits and licenses

- `references/vendor/jakub/` is **Jakub Krehel**'s skills (https://github.com/jakubkrehel/skills), MIT.
- `references/vendor/feel/` is **make-interfaces-feel-better** by Jakub Krehel (https://github.com/jakubkrehel/make-interfaces-feel-better), MIT.
- `references/vendor/impeccable/` is **Impeccable** by Paul Bakaus (https://github.com/pbakaus/impeccable), Apache-2.0, with its LICENSE and NOTICE kept. Files relocated, SKILL.md renamed, `scripts/` not included; see its `SOURCE.md`. The playbook paraphrases and condenses Impeccable's guidance; that adaptation is a change to the original.
- The taste guide (`references/taste.md`, `animation.md`, `components.md`, `quotes.md`) is distilled from **Emil Kowalski**'s design-engineering work (https://emilkowal.ski), tagged `[Molveau/Emil]` in the playbook. The words and structure are Molveau's (MIT); the ideas and numbers are his. `references/quotes.md` attributes each quote. `references/animation.md` also draws on Rauno Freiberg's devouringdetails.com.
- `references/discoverability.md` is distilled from Suganthan Mohanadasan's research (suganthan.com).
- `references/playbook.md`, `references/prompts.md` and `references/mockup-first.md` are Molveau's own (MIT), crediting each source by tag.

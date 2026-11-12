---
name: ux
description: Improves how an interface talks to people and holds up in real use. Use when writing or reviewing interface copy (button labels, error messages, empty states, confirmations, onboarding, microcopy), when improving an onboarding or signup flow or making any flow clearer, when handling errors, edge cases, long text, i18n or overflow, or when checking accessibility (keyboard, focus, ARIA, screen readers, forms, contrast, touch targets, WCAG). Merges Jakub Krehel's, Paul Bakaus's and ibelick's skills with Molveau's always-on UX rules.
---

# UX

One skill for how an interface reads and behaves: words, states, resilience and accessibility. It merges
Jakub Krehel's better-writing and better-accessibility, Impeccable's clarify, onboard and harden, ibelick's
fixing-accessibility and Molveau's always-on rules into one playbook.

## Start here

Open `references/playbook.md` and read two parts: the "Do this first" block at the top, then the one numbered section the task needs, from the table below. Stop there. Open vendor files only for depth or worked examples.

## Always on

1. **Plain words that name the user's task.** Buttons say what happens ("Send invoice", not "Submit").
2. **Specific errors** beside what failed: what, why if known, what to do next. Keep what the user typed.
3. **Real states.** Empty, loading, error, success and offline each have designed copy and a next step.
4. **Keyboard, focus, targets.** Everything reachable by pointer works by keyboard, focus always visible,
   44px touch targets.
5. **Native first.** Real `button`, `a`, `label`, `input`, `dialog`; ARIA only fills gaps.
6. **Nothing by color alone**, text readable at 200% zoom and reflowing at 320px.
7. **Text survives reality.** Long names, other locales, empty values and huge numbers do not break layout.
8. **Motion respects `prefers-reduced-motion`**, and nothing the user needs disappears on a timer.

Neighbors: `ui` owns contrast values and fixes, color and layout CSS (`ui` playbook §3, §5); `anti-slop`
owns buzzwords, stock CTAs and the em dash rule; `motion` owns reduced-motion detail; `french-typography`
owns French copy; `loi-25-website` owns what a Québec form must disclose.

## What to read for which task

All paths are relative to this skill folder.

| Task | Read (§ = this skill's playbook) |
|---|---|
| Rules and values for any task | "Do this first" in `references/playbook.md`, then the § from the rows below |
| Write or review any interface copy: labels, errors, empty states, confirmations | §2, §3, §4; `references/vendor/jakub/better-writing.md` |
| Rewrite unclear UX copy and instructions | §2; `references/vendor/impeccable/clarify.md` |
| Onboarding, first run, empty states, teaching a feature | §7; `references/vendor/impeccable/onboard.md` |
| Error handling, edge cases, i18n, text overflow, production resilience | §4, §9, §10; `references/vendor/impeccable/harden.md` |
| Accessibility engineering: focus, keyboard, ARIA, forms and validation, screen readers | §8, §11, §12, §13; `references/vendor/jakub/better-accessibility.md` |
| Audit and fix HTML accessibility issues against WCAG | §15, §17; `references/vendor/a11y/fixing-accessibility.md` |
| Layout, type, color, polish | the `ui` skill |
| Animation, reduced motion | the `motion` skill |
| A UI that looks generic or vibe-coded | the `anti-slop` skill |
| French copy, Québec privacy for forms | the `french-typography` and `loi-25-website` skills |

For a full pass on an existing screen, follow playbook §17: copy, then states and edge cases, then
accessibility, then a keyboard-only and a screen-reader walk.

## Notes on the vendored files

The files under `references/vendor/` are copied unmodified from their authors, so relative links and command names inside them (for example Impeccable's slash commands or setup files) may not exist in this install. Take the guidance; skip what points at missing tools (where Impeccable hands off to `/impeccable polish`, use the `ui` skill's polish pass). Licenses and exact sources are in each vendor folder (`LICENSE`, `SOURCE.md`).

## Credits and licenses

- `references/vendor/jakub/` is **Jakub Krehel**'s skills (https://github.com/jakubkrehel/skills), MIT.
- `references/vendor/impeccable/` is **Impeccable** by Paul Bakaus (https://github.com/pbakaus/impeccable), Apache-2.0, with its LICENSE and NOTICE kept. Changes: relocation only (the three command files `clarify.md`, `onboard.md` and `harden.md` were moved, none renamed), no edits to the content.
- `references/vendor/a11y/` is **fixing-accessibility** from **ui-skills** by ibelick (Julien Thibeaut) (https://github.com/ibelick/ui-skills), MIT.
- `references/playbook.md` and the always-on rules above are Molveau's own (MIT), crediting each source by tag. The playbook paraphrases and condenses Impeccable's guidance; that adaptation is a change to the original.

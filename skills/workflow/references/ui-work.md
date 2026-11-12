# UI work inside the loop

The loop is the same for UI; a few steps change. Craft (layout, type, color, states, motion) lives in the
`ui`, `ux` and `motion` skills. This file says when to use them and which gates apply.

## Before designing

1. **Read the project's design context**: `PRODUCT.md`, `DESIGN.md`, the token files (CSS variables,
   theme config), the component library and comparable screens.
2. **Check sibling pages.** Before building a pattern, find how the project already does it on another
   screen (a form, a table, an empty state) and match it. A new pattern needs a reason.
3. **Write the user flow and stories** (see `delivery-loop.md`, Plan). States come from the flow.
4. **Pick one design authority** for the pass (the `ui` skill, or the project's own design rules). Do not
   run several broad design guides at once; they disagree and you average them into nothing.
5. Need references first? The `design-inspiration-index` skill routes a need to the right gallery. For a
   SaaS or a local business site, the `saas` or `vitrine` playbook gives the order of design work.

## Component source order

Use the first source that fits:

1. The project's existing components.
2. Installed shadcn/ui components (or the project's installed base library).
3. A component registry (shadcn-compatible registries and block collections).
4. A bespoke implementation.

Registries are implementation resources, not design authorities: the project's tokens and rules still
decide. Adapt anything imported to the project's tokens, semantics, accessibility, responsive behaviour and
code conventions before it ships.

## Mockup first, then the decision owner's roast

For any new or restyled screen that needs feedback, follow the mockup-first reference in the `ui` skill
(its references/mockup-first.md). In short:

- Build a self-contained mockup with the project's real tokens, colours, type and icons.
- Cover the states that matter: desktop and 390 px; light and dark when the product ships both; empty,
  populated and error when relevant; interactive states on the pieces that have them.
- Show it complete. The decision owner roasts it and gives feedback; iterate on the mockup; implement only
  an approved direction.
- Do not replace this with automated visual roasts or browser screenshot passes. They cost time and tokens
  and tell you less than the person who owns the decision. Deterministic checks still run.

A tiny tweak (a colour token, a spacing fix on one element) does not need a mockup; a new screen, a new
flow or a restyle does.

## Checks before "done"

In this order, before any AI review and before calling a UI change done:

1. Type check, lint, tests and build.
2. Static accessibility checks the project has configured (lint rules, axe in unit tests and the like).
3. Any design detectors the project runs.
4. The `anti-slop` skill: its 20 tells and its detector script over the changed files. A detector catches
   part of the tells; check the rest by reading against the list.
5. Then the review: code review on the diff, the decision owner on the visuals. For a deep audit of a
   screen, suggest `/design-grill` to the user (costly, their call).

## Motion

Use the `motion` skill for any animation. Motion must improve feedback, continuity, hierarchy or
storytelling; remove decorative motion that adds latency or distraction. Look for where motion is missing
before adding it broadly, use one implementation approach per need, and review the result against the
skill's guardrails (reduced motion, interruption, frequency of use).

## Mobile and native apps

For iOS, Android or cross-platform apps (Expo, React Native and the like):

- Handle safe areas, keyboard avoidance, dynamic type, reduced motion, offline states, errors and
  permission denial as states in the plan, not as late fixes.
- Keep each platform's conventions: Android back navigation, permission prompts, keyboards and system UI
  are not iOS with a different icon set.
- Use the app's existing primitives before adding a library.
- For important or unfamiliar flows, look at how shipped apps solve them before designing your own.

## Copy and language

- Interface copy, errors, empty states and accessibility depth: the `ux` skill.
- French copy: the `french-typography` skill and its check.
- A site that collects personal information in Québec: the `loi-25-website` skill, as part of the build.

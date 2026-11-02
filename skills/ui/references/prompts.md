# UI prompt pack

Six copy-paste prompts that push an AI tool toward production-grade UI instead of the default look. Use them as is, then tune the numbers to your brand.

Source and context: https://www.molveau.ca/guides/ui-prompt-pack (the guide page; French version at https://www.molveau.ca/fr/guides/ui-prompt-pack).

When to use which:

| Prompt | When |
|---|---|
| 1 Taste contract | at the start of every UI session |
| 2 Anti-generic pass, 3 Polish pass | after every meaningful chunk of UI |
| 4 Teardown, 5 Palette builder, 6 Motion spec | when the situation calls for them |

Do not ask the AI for taste. Give it yours as constraints, and keep the last line of prompt 1 so it enforces them against your own requests too.

## 1. The taste contract

Paste this once at the start of any UI session. On its own, it removes most of the generic look.

```text
You are building UI under these non-negotiable constraints:
- Direction: before any code for a new screen, write five lines and
  wait for my approval. Product (what, for whom), character (two or
  three concrete words, never clean, modern, sleek, minimal or premium),
  world (the place or material it belongs to), moments (the one or two
  places that get rich color and detail), signature (one detail only
  this product has).
- Typography: max 65 characters per line of body text. Two font families
  maximum. Bold for emphasis, never italic. Underline only for links.
- Color: one background family, one ink color, at most one accent.
  Text contrast must meet WCAG AA. Never convey state with color alone.
- Motion: animate only transform and opacity. Everything under 300ms,
  ease-out on entry. Frequent actions get no animation at all.
  Honor prefers-reduced-motion.
- Layout: one focal point per screen. Spacing in multiples of 4px.
- Interactive elements: press feedback (scale 0.96 on active),
  44px minimum touch targets, visible keyboard focus.
Reject any of my requests that would violate these rules, and say why.
```

## 2. The anti-generic pass

Run it after a first draft. Each of its five rules targets one AI default.

```text
Review the interface you just built and remove the "AI default" look:
1. Replace any gradient used as decoration with a flat surface.
2. Replace the accent color if it is violet, indigo, or teal, and do not
   swap it for the next default: a cream page with a terracotta, burnt
   orange or sage accent, or a single blue accent on white.
3. Remove every card border-plus-shadow combo; pick one, not both.
4. Remove any icon that merely repeats the label next to it.
5. Rework any section that is a 3-column grid of icon-title-text cards,
   and any first screen that is only a centred eyebrow, a headline and
   two buttons.
Explain each change in one line. Then apply them.
```

## 3. The polish pass

Run it on each component before it ships, for the last 10 percent a first build skips.

```text
Do a polish pass on this component. Check and fix:
- Alignment: every element sits on the spacing grid, no off-by-2px gaps.
- Truncation: long text truncates with a real ellipsis, nothing overflows.
- States: hover, focus-visible, active, disabled and loading are all styled.
- Empty and error states exist and are written in plain language.
- Numbers use tabular figures if they can change while visible.
List what you fixed. Do not add features.
```

## 4. The teardown

Point it at a site you admire, or at your own.

```text
Tear down this interface like a senior design engineer. Grade it on:
typography (line length, scale, families), hierarchy (focal points,
spacing rhythm), color (palette size, contrast), motion (duration,
properties animated, reduced-motion), and trust (contact path, legal,
dead links). For each: pass or fail, one sentence of evidence, and the
single cheapest fix. End with the three fixes with the highest
impact-to-effort ratio.
```

## 5. The palette builder

Use it when the brand has one color and you need a full system.

```text
Build a UI palette from this brand color: [hex]. Produce:
- A near-neutral background pair (light surface + card surface),
  tinted toward the brand's world rather than a default cream.
- An ink color for text that is not pure black.
- Muted text, border, and disabled variants of the ink.
- The brand color reserved for primary actions and focus only.
Give every color as a CSS custom property, verify AA contrast for
each text/background pair, and show the failing pairs if any.
```

## 6. The motion spec

Asking for "some animation" is how interfaces get worse. This prompt makes each animation justify itself first.

```text
Propose motion for this component with this constraint: the best
animation is often none. For each candidate animation state which user
question it answers (where did this come from? what just changed?).
If it answers none, cut it. For the survivors: property animated
(transform/opacity only), duration under 300ms, easing, and the
reduced-motion fallback. Output as a table.
```

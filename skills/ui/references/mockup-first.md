# Mockup first, then the owner's roast

This is Molveau's house default. It applies to a project that adopts it (its `CLAUDE.md` or design notes say so); in any other project, follow that project's own review process and use this file as a suggestion.

For any UI or UX change that needs feedback, the person who owns the product decision judges the visuals. Automated visual review costs a lot of time and tokens and tells you little the owner will not tell you better. So the loop is: mockup, roast, iterate, implement.

## The flow

1. **Plan the user flow first.** For anything user-facing, write the flow and a few user stories before drawing. Good UX is planned, not patched.
2. **Build a mockup** as a self-contained page (a Claude artifact, a standalone HTML file or a design-tool frame) using the project's real tokens, colors, type and icons. Not placeholder styling: the owner judges the real look.
3. **Cover the states that matter** (checklist below).
4. **The owner roasts it** once it is complete and gives feedback. Do not ask for feedback on a half-built mockup.
5. **Iterate on the mockup** until the owner is happy, then implement. Do not start implementation on an unapproved direction.

## States checklist

- Desktop and 390 px wide (phone).
- Light and dark, when the product ships both.
- Empty, populated and error, when relevant to the screen. Add loading, long text and a very small and very large dataset when they change the layout.
- Hover, focus-visible, active and disabled on the interactive pieces.
- The primary action is obvious and there is only one per screen.

## What not to do

- Do not run automated visual roasts (design-critique skills that grade screenshots) or browser screenshot passes to verify UI. The owner judges visuals.
- Do not skip the deterministic checks: type check, lint, tests and the `anti-slop` detector still run before the work is called done.

## Before implementing

- Look at sibling pages and match the pattern they already use.
- Use the project's existing components and tokens first; a new component only when nothing fits.
- Compare against the `anti-slop` tells list before showing the mockup, so the owner does not spend the roast on generic-looking defaults.

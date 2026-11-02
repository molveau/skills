---
name: saas
description: Playbook for starting a SaaS product UI or web app. Use at the start of a SaaS, dashboard, admin panel, internal tool, web app or app-shell project, or when adding tables, onboarding, settings, a billing page or a pricing page to one. Says what an app needs that a marketing site does not, in which order to apply the ui, ux, anti-slop and motion skills, and gives a done checklist.
---

# SaaS playbook

A product UI is used daily by people who already decided to be there. It is judged on speed, clarity and trust, not on first impressions. This playbook lists what a SaaS needs that a site does not, then the order in which to apply the domain skills. It does not repeat their rules; it points to them.

## Direction gate

Do this before any code for a new page, screen or restyle, even when the request is one line. The rest of
this skill removes mistakes; it does not give a screen character. Skipped, the result is the median page
every model makes: right in the details, owned by nobody.

1. **Five lines.** **Product**: what it does, for whom. **Character**: two or three concrete words (`calm,
   exact, a little warm`), never clean, modern, sleek, minimal or premium. **World**: the place or material
   the product belongs to; it tints the neutrals and sets the accent. **Moments**: the one or two places that
   get rich colour and detail: on an app screen they come from the product itself (one chart drawn with care, a real object like the document or ticket the product handles), never a generated image. **Signature**: one small detail only this product has, used
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
   - four equal stat cards over a bar chart, then a table, as the whole home screen;
   - a centred eyebrow, headline and two buttons as the whole first screen.
4. **Swap test.** Replace the name and the trade with a competitor's. If the screen still fits, change the
   claim, the moment and the signature, and test again.
5. **Show and wait.** Show the five lines and the idea, and wait for the owner. If you cannot ask (the user
   said to just build it, or you run without a person), write them as a comment at the top of the main file
   and build exactly that.

Depth: `anti-slop` playbook §2 (direction) and §12 (app screens); the `design-inspiration-index` skill for
real references.

## What an app needs that a site does not

1. **App shell and navigation.** One persistent frame: sidebar or top bar, current location marked, account menu, a clear way back. Group destinations by the user's jobs, not by your database tables. Seven top-level items or fewer. On mobile the shell collapses to a bottom bar or a drawer, never a shrunken desktop sidebar.
2. **Dense data.** Tables are the main surface. Left-align text, right-align numbers with tabular figures, sticky header, sortable and filterable columns, row actions in a fixed place, bulk selection, pagination or virtualisation past a few hundred rows. Compact row height on desktop, but 44 px touch targets on touch devices.
3. **Four states per view.** Every list, chart and detail view has designed loading (skeleton shaped like the content), empty (says why and offers the next step), error (what failed, retry, keeps user input) and populated. Add offline and permission-denied where they can happen. Write all of it before the happy path is called done.
4. **Onboarding to first value.** Define the one action that proves the product works, and take the shortest path to it. Pre-fill with sample data or a template, defer profile and billing questions, show progress. Empty states double as onboarding.
5. **Settings.** Split account, workspace and billing. Autosave or one clear Save, never both. Destructive actions are separated, named plainly and confirmed with the item's name. Explain every toggle in one line.
6. **Billing and pricing.** Show the current plan, usage against limits, next invoice date and amount, and how to cancel, inside the app. The public pricing page leads with who each plan is for, names the limit that separates plans, and states the monthly and yearly price in the same unit. Failed payments get a calm, specific banner with the fix, not a lockout.
7. **Dark mode.** Decide at the start: semantic tokens (surface, text, border, accent) with a light and a dark value each, never raw hex in components. Check contrast, charts, shadows (replace with borders or lighter surfaces) and images in both.
8. **Keyboard and focus.** Power users live here. Visible focus everywhere, logical tab order, a command palette or shortcuts for frequent actions, Escape closes layers and returns focus to its trigger, no focus trap outside modals.
9. **Motion only as feedback.** Press states, toggles, menu and dialog enter and exit, row insert and remove, toast arrival. Nothing on frequent or keyboard-driven actions beyond a state change. No scroll reveals or looping ornaments inside the app.

## Order of work

1. **Flow first.** List the user's three main jobs and the first-value path. Write the screens each needs and the states of each (item 3). Use the `ux` skill for the words as you go.
2. **Direction, then tokens.** Run the direction gate above first. Then set colors (light and dark), type scale, spacing, radii and one ease-out token. If the project has none, use the `ui` skill and its taste defaults, then write them down.
3. **Shell and one real screen.** Build the app shell and the densest table with real-looking data, not lorem ipsum or five perfect rows. Use the `ui` skill (new screen order; mockup first if the owner wants to judge it).
4. **States.** Add loading, empty, error and permission states to every view. Use the `ux` skill (copy, then resilience with long names and other locales, then accessibility).
5. **Onboarding, settings, billing.** In that order, each with its states.
6. **Motion.** Add feedback only, using the `motion` skill and its guardrails. Reduced motion shows the final state.
7. **Slop pass last.** Run the `anti-slop` skill, including its detector, before calling any screen done. Dashboards attract identical stat-card rows, gradient charts and icon-in-a-circle tiles; replace them with the numbers that matter, labeled plainly.

## Common mistakes

- A marketing-style hero on the app's home screen. The home is the user's work, not your pitch.
- Spinners over blank space, and empty states that say "No data".
- Charts without units, a date range or a way to read exact values.
- Color alone for status. Pair it with text or an icon.
- A pricing page with four tiers and a feature matrix nobody can compare. Fewer plans, one limit that differs.
- Settings that scatter one concern across three pages.

## Done checklist

- [ ] Every view has loading, empty, error and populated states, with specific copy and a next step.
- [ ] A new user reaches first value without leaving the guided path or filling optional forms.
- [ ] The densest table works with 0, 1, 200 and very long rows, sorting and keyboard.
- [ ] Whole app usable by keyboard alone; focus visible; Escape and focus return verified.
- [ ] Light and dark both pass AA contrast, including charts and badges.
- [ ] Billing shows plan, usage, next charge and cancellation in the app.
- [ ] Destructive actions name what will be lost and can be undone or confirmed.
- [ ] Mobile layout checked at 390 px; touch targets 44 px.
- [ ] Motion limited to feedback; reduced motion honored.
- [ ] `anti-slop` detector run clean; tsc, lint and tests green.

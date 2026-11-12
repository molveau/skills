---
name: vitrine
description: Playbook for a vitrine, a business showcase / brochure site for a local business. Use at the start of a small business website, brochure site, landing page for a local business, service-business site, or when adding pricing, booking, city pages, local SEO, bilingual FR/EN or a Québec privacy setup to one. Says what such a site needs, in which order to apply the ui, ux, anti-slop, motion, french-typography and loi-25-website skills, and gives a done checklist.
---

# Vitrine playbook

A vitrine is a business showcase (brochure) site for a local business: a few pages that answer "what do you do, for whom, how much, can I trust you, how do I reach you". Visitors arrive from Google or a referral, decide in seconds, and leave if they must hunt. This playbook says what to build and in which order; the domain skills hold the detailed rules.

## Direction gate

Do this before any code for a new page, screen or restyle, even when the request is one line. The rest of
this skill removes mistakes; it does not give a screen character. Skipped, the result is the median page
every model makes: right in the details, owned by nobody.

1. **Five lines.** **Product**: what it does, for whom. **Character**: two or three concrete words (`calm,
   exact, a little warm`), never clean, modern, sleek, minimal or premium. **World**: the place or material
   the product belongs to; it tints the neutrals and sets the accent. **Moments**: the one or two places that
   get rich colour and detail: for a local business, usually a real photo of the work or the people, or a price list set like the printed document the trade uses. **Signature**: one small detail only this product has, used
   consistently.
   A moment is drawn with care, not just cleaned: a chart redrawn for what it must say (smooth lines,
   a mirrored comparison, a real scale), or the product's own object rendered with weight and light.
2. **Inventory, then the idea.** List 8 to 12 things no competitor shares (name, street, numbers in the
   brief, materials, tools, rituals, documents the trade prints). Write: "On this page, [one item]
   becomes [the device]". That device is the moment.
3. **Refuse the second-order defaults** unless the brand already owns them. They are what a model reaches
   for once the obvious tells are banned:
   - a cream, stone or warm off-white page with a burnt orange, terracotta, sage or forest accent, with or
     without a serif headline (the "paper and ink" look is the new default, not a direction);
   - Fraunces, Instrument Serif, Playfair or Georgia as the headline face by reflex; system-ui as the only face;
   - Inter or Geist on white with one indigo or blue accent;
   - hero, services, reviews, service area, contact, in that order, with no argument for it;
   - a centred eyebrow, headline and two buttons as the whole first screen.
4. **Swap test.** Replace the name and the trade with a competitor's. If the page still fits, change the
   claim, the moment and the signature, and test again.
5. **Show and wait.** Show the five lines and the idea, and wait for the owner. If you cannot ask (the user
   said to just build it, or you run without a person), write them as a comment at the top of the main file
   and build exactly that.

Depth: `anti-slop` playbook §2 (direction); the `design-inspiration-index` skill for
real references.

## What a vitrine needs

1. **One clear offer per page.** The first screen says what is sold, to whom and where, in plain words, with one primary action. A reader who skips everything else still knows. Separate pages for separate services beat one page that sells everything.
2. **Prices, or a "from" price.** Buyers compare. A starting price and what it includes filters out bad leads and builds trust; "contact us for a quote" alone loses people to competitors who post a number. State what changes the price. Keep amounts in one data file so every page and the structured data agree.
3. **Booking or contact in one step.** A visible phone link and one short form or booking link on every page. Ask only for what you need to reply (name, contact, what they want). Say when they will hear back. Confirm clearly after sending. Tap-to-call on mobile.
4. **Proof.** Real projects with a result, real reviews with names and dates (or links to them), logos only if permitted. A few specific proofs beat many vague ones. Only real people, real reviews.
5. **Local SEO basics.**
   - A page per service area worth ranking in, each with genuinely local content (not the same text with the city swapped).
   - `LocalBusiness` (or a more specific subtype) JSON-LD with name, address or service area, phone, hours, and price range that matches the posted prices. Add `FAQPage` only on one canonical page.
   - A complete Google Business Profile: same name, address and phone as the site, categories, hours, photos, a link to the right page, and a habit of answering reviews.
   - One `h1` per page, descriptive titles and meta descriptions, `hreflang` for both languages, a sitemap, readable URLs.
6. **A speed budget.** Local visitors are on phones with average connections. Preload the LCP image and size it correctly (modern format, explicit width and height); fonts self-hosted, one or two families, `font-display` set, subset; no heavy 3D, video backgrounds or large JS libraries for decoration; third-party scripts only when they earn their place. Content is present on load. Target LCP under 2.5 s on mobile and test with real throttling.
7. **Bilingual FR/EN when the market is.** Same content in both languages, a language switch that keeps the current page, localized URLs and `hreflang`. Apply `french-typography` to every French string, guard included. Layouts take French at +20 percent length.
8. **Québec: Law 25.** A contact form is enough to trigger it. Run `loi-25-website` as part of the build; pick analytics and form tools with it in mind.
9. **Motion: one signature moment at most.** One memorable, purposeful interaction (a project switcher with a crossfade, a before/after) plus plain press and hover feedback. Use the `motion` skill.

## Suggested pages

Home, Services (or one page per service), Projects with case studies, Pricing, Contact. Add area pages and a few guides only if you will keep them honest and updated. Skip an "About" page unless it carries proof; fold a short human introduction into home or contact.

## Order of work

1. **Offer and proof.** Write the one-sentence offer, the price lines, three proofs and the contact path before any design. Use the `ux` skill for plain copy.
2. **Direction and tokens.** Run the direction gate above, then palette, one or two self-hosted fonts, spacing, radii, with the `ui` skill (taste defaults if the project has none).
3. **Mockup, desktop and 390 px.** Home first, then one inner page. The owner judges it; iterate before building (`ui` skill, mockup-first).
4. **Build pages with real content.** Real photos and text, not lorem ipsum. Check long French strings.
5. **SEO and schema.** Titles, meta, JSON-LD, sitemap, `hreflang`, area pages, Google Business Profile aligned to the site.
6. **Language and law.** Run `french-typography` on all French copy, then `loi-25-website` for the audit report.
7. **Speed pass.** Measure LCP, CLS and total transfer on a throttled mobile profile; repeat on the biggest item until LCP is under 2.5 s.
8. **Motion, then slop pass.** Add the one signature moment, then run `anti-slop` and its detector.

## Done when

- Needs 1 to 9 hold on a 390 px and a desktop view; the first screen states offer, audience, place and one primary action.
- A starting price and its scope appear on the pricing page and match the JSON-LD; `LocalBusiness` JSON-LD is valid and Google Business Profile matches name, address, phone.
- Phone and contact form work in one step on mobile, and the confirmation tells what happens next; at least three real, specific proofs.
- `fr-typo.mjs --check` exits 0 on the French files (English copy goes through the `writing` skill's em-dash rule), and FR and EN have the same content and structure; the `loi-25-website` report has no open fix item (Québec sites).
- LCP is under 2.5 s on throttled mobile; the checklists of `ui`, `ux`, `motion` and `anti-slop` pass; tsc, lint and tests are green.

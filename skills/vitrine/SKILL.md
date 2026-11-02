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

Depth: `anti-slop` playbook §2 (direction) and §12 (app screens); the `design-inspiration-index` skill for
real references.

## What a vitrine needs

1. **One clear offer per page.** The first screen says what is sold, to whom and where, in plain words, with one primary action. A reader who skips everything else still knows. Separate pages for separate services beat one page that sells everything.
2. **Prices, or a "from" price.** Buyers compare. A starting price and what it includes filters out bad leads and builds trust; "contact us for a quote" alone loses people to competitors who post a number. State what changes the price. Keep amounts in one data file so every page and the structured data agree.
3. **Booking or contact in one step.** A visible phone link and one short form or booking link on every page. Ask only for what you need to reply (name, contact, what they want). Say when they will hear back. Confirm clearly after sending. Tap-to-call on mobile.
4. **Proof.** Real projects with a result, real reviews with names and dates (or links to them), logos only if permitted. A few specific proofs beat many vague ones. No stock-photo team, no invented testimonials.
5. **Local SEO basics.**
   - A page per service area worth ranking in, each with genuinely local content (not the same text with the city swapped).
   - `LocalBusiness` (or a more specific subtype) JSON-LD with name, address or service area, phone, hours, and price range that matches the posted prices. Add `FAQPage` only on one canonical page.
   - A complete Google Business Profile: same name, address and phone as the site, categories, hours, photos, a link to the right page, and a habit of answering reviews.
   - One `h1` per page, descriptive titles and meta descriptions, `hreflang` for both languages, a sitemap, readable URLs.
6. **A speed budget.** Local visitors are on phones with average connections. Preload the LCP image and size it correctly (modern format, explicit width and height); fonts self-hosted, one or two families, `font-display` set, subset; no heavy 3D, video backgrounds or large JS libraries for decoration; third-party scripts only when they earn their place. Content is present on load. Target LCP under 2.5 s on mobile and test with real throttling.
7. **Bilingual FR/EN when the market is.** One message source per language with the same structure and parity of content, a visible language switch that keeps the current page, localized URLs and `hreflang`. French copy runs about 20% longer, so layouts must not break. Apply the `french-typography` skill to every French string and add its CI guard.
8. **Québec: Law 25.** A site that collects any personal information in Québec (a contact form is enough) runs the `loi-25-website` skill: privacy policy, person in charge shown, notice at collection, off-by-default tracking, review of outside-Québec tools. Treat it as part of the build, not an afterthought; choose analytics and form tools with it in mind.
9. **Motion: one signature moment at most.** One memorable, purposeful interaction (a project switcher with a crossfade, a before/after) plus plain press and hover feedback. No scroll reveals, smooth-scroll libraries or looping ornaments. Use the `motion` skill; reduced motion shows the final state.

## Suggested pages

Home, Services (or one page per service), Projects with case studies, Pricing, Contact. Add area pages and a few guides only if you will keep them honest and updated. Skip an "About" page unless it carries proof; fold a short human introduction into home or contact.

## Order of work

1. **Offer and proof.** Write the one-sentence offer, the price lines, three proofs and the contact path before any design. Use the `ux` skill for plain copy.
2. **Direction and tokens.** Run the direction gate above, then palette, one or two self-hosted fonts, spacing, radii, with the `ui` skill (taste defaults if the project has none).
3. **Mockup, desktop and 390 px.** Home first, then one inner page. The owner judges it; iterate before building (`ui` skill, mockup-first).
4. **Build pages with real content.** Real photos and text, not lorem ipsum. Check long French strings.
5. **SEO and schema.** Titles, meta, JSON-LD, sitemap, `hreflang`, area pages, Google Business Profile aligned to the site.
6. **Language and law.** Run `french-typography` on all French copy, then `loi-25-website` for the audit report.
7. **Speed pass.** Measure LCP, CLS and total transfer on a throttled mobile profile and fix the biggest item first.
8. **Motion, then slop pass.** Add the one signature moment, then run `anti-slop` and its detector.

## Common mistakes

- A hero that says "Welcome" or a slogan instead of the offer.
- Prices hidden behind a form, or old prices left in schema and city pages after a change.
- Five contact methods with no obvious primary one.
- City pages that are the same page with the town name swapped.
- Cookie banners added for decoration while tracking still loads by default.
- A language switch that sends visitors back to the home page.

## Done checklist

- [ ] First screen states offer, audience, place and one primary action.
- [ ] A starting price and its scope appear on the pricing page and match JSON-LD.
- [ ] Phone and contact form work in one step on mobile; the confirmation tells what happens next.
- [ ] At least three real, specific proofs.
- [ ] `LocalBusiness` JSON-LD valid; Google Business Profile matches name, address, phone.
- [ ] Area pages have distinct local content; sitemap and `hreflang` correct.
- [ ] LCP image preloaded; fonts self-hosted; LCP under 2.5 s on throttled mobile; no heavy 3D.
- [ ] FR and EN have the same content; `french-typography` check passes.
- [ ] `loi-25-website` report has no open fix item (Québec sites).
- [ ] At most one signature motion; reduced motion honored.
- [ ] `anti-slop` detector clean; 390 px and desktop checked; tsc, lint and tests green.

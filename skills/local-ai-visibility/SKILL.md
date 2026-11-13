---
name: local-ai-visibility
description: Local AI visibility playbook for a small business site. Use when the owner asks "why does ChatGPT not recommend my business", how to be found by ChatGPT, Perplexity, Claude or Copilot, how to appear in Google AI Overviews and AI Mode, or about GEO and AI search for a local business. Covers crawler access, llms.txt, LocalBusiness structured data, the buying facts as page text, directory listings, reviews and measurement, with a site checker.
---

# Local AI visibility

AI assistants answer "who is a good plumber near me" from the open web, from directories and from reviews. A small business gets named when its facts are easy to read, agree everywhere and are backed by third parties. Nobody can promise a recommendation; this playbook removes the reasons to be left out. Dated facts, the directory list, the JSON-LD example and the prompt-panel template are in `references/playbook.md`.

## Steps

1. **Run the checker on the live site.** `node scripts/check-ai-visibility.mjs https://example.com` (add `--json` for a machine-readable list). It tests nine AI crawlers against `robots.txt`, `llms.txt`, the JSON-LD, the title, the meta description and `hreflang`. Done when the output is saved and every line marked FIX has an owner in the list below.
2. **Fix access and machine-readable data.** Allow the crawlers in `robots.txt` unless the owner chooses to block one on purpose and says so. Add `llms.txt` at the site root. Add one JSON-LD block of type `LocalBusiness` or `ProfessionalService` (or a subtype) with name, address, telephone, url, hours, `priceRange` or `offers`, and `sameAs` linking to the directory profiles. Example: `references/playbook.md`, section "JSON-LD example". Done when the checker run reports no FIX for `robots:`, `llms.txt` and `jsonld`.
3. **Put the buying facts on the page as text.** Prices or ranges, services, areas served, hours, languages, how to book, in plain HTML text (not in an image, a PDF or a widget). Done when a person who reads only the page text can answer "what does it cost, where, when, in which language, how do I book" in under a minute. Order of work and page structure for a showcase site: run `vitrine`.
4. **Claim and align the directory listings.** Google Business Profile, Bing Places, Apple Business Connect, Yelp and Pages Jaunes (list and reasons: `references/playbook.md`, section "Directories for Québec"). Use the same name, address and phone everywhere. Done when each listing is claimed, matches the site character for character, and its URL is in `sameAs`.
5. **Earn reviews and answer them.** Ask each happy client for a review on the one or two platforms that matter for the trade; reply to every review in a calm, factual tone. For a regulated profession (law, health, notary, accounting), the order's advertising rules limit testimonials and ratings: run `ordre-pro-advertising` first. Done when the review ask is part of the client routine and every existing review has a reply.
6. **Measure, then repeat monthly.** Four signals: referral sources in the analytics (ChatGPT adds `utm_source=chatgpt.com` to links), the Bing Webmaster Tools AI Performance report, the Search Console generative AI report, and a "how did you find us" question on the contact form and at booking. Then a monthly prompt panel (template: `references/playbook.md`, section "Prompt panel"). Done when the four signals are set up and the first panel is logged with a date.

## Rules of thumb

- Good SEO is good GEO: the same index and the same signals feed both. Do not buy a "GEO package" before steps 1 to 4 are done.
- Tracking and consent: analytics and the contact form fall under Québec's Law 25; run `loi-25-website`.
- Words on the page come from `writing`; French strings follow `french-typography`.
- Report outcomes as "cited in 3 of 10 prompts this month", never as a promise.

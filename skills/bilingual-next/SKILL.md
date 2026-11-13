---
name: bilingual-next
description: Bilingual next-intl setup for a French and English Next.js site in Québec. Use when setting up or fixing a bilingual FR/EN Next.js site, localized URLs, hreflang and x-default, or a language switcher that keeps the page, or when French messages and English messages drift apart.
---

# Bilingual Next.js (FR/EN, Québec)

A bilingual site is two sites that must stay level: same pages, same keys, same facts, each one findable in its own language. This skill covers the wiring with `next-intl`. Code sketches, with the version they were checked against, are in `references/next-intl.md`. Next.js moves fast: read the docs of the installed `next` and `next-intl` versions before copying a sketch.

## Steps

1. **Route with localized pathnames and a default locale.** `defineRouting` with `locales: ['fr', 'en']`, a `defaultLocale`, `localePrefix: 'as-needed'` and a `pathnames` map listing every route, translating only the paths that carry a search keyword. For a Québec business the default is `fr`. The Charte de la langue française (changed by Loi 96) sets rules for commercial websites and advertising; this skill does not summarise them. Check the OQLF page for businesses (https://www.oqlf.gouv.qc.ca/francisation/entreprises/, opened 2026-11-13) and the current text of the Charte, or ask a lawyer. Not legal advice. Order of work for the whole site: `vitrine`. Sketch: `references/next-intl.md`, section "Routing". Done when `/` serves French, `/en` serves English, a translated route answers on its own path in each language, and a route missing from `pathnames` fails the type check.
2. **Keep one message file per locale and check parity.** `messages/fr.json` and `messages/en.json`, same keys, same nesting. Run `node scripts/check-i18n-parity.mjs messages/fr.json messages/en.json` (add `--json` for a machine-readable list); wire it as a test so a missing key fails the build. The script reports a key present in one file only, a text/object/array mismatch, and a value filled in one file and empty in the other (both ways). Done when the script exits 0 and a test runs the same comparison.
3. **Declare canonical and alternates on every page.** One helper builds `alternates.canonical` and `alternates.languages` (`fr`, `en` and `x-default`) from `getPathname`, so localized paths have one source. `x-default` points to the default-locale URL. Done when every page's `<head>` shows a self-referencing canonical, one `hreflang` link per locale and `x-default`, and each alternate URL answers 200. Sketch: "Metadata alternates".
4. **List both versions in the sitemap.** One entry per locale, each carrying the full `alternates.languages`. Done when `sitemap.xml` has twice as many URLs as there are routes and each entry lists all alternates. Sketch: "Sitemap".
5. **Make the language switcher keep the page.** Replace the locale on the current route with its params, never link to the home page. Label it in the other language ("English" on the French page, "Français" on the English page), and set `lang` on the target link. Done when, on every route including dynamic ones, the switch lands on that page's twin and keeps the query string. Controls and focus rules: `ux`. Sketch: "Language switcher".
6. **Keep long-form content level.** Guides and case studies live as `slug.fr.md` and `slug.en.md`. Add a test that every file has its twin and that both carry the same frontmatter fields. Done when the test fails after you delete one file and passes after you restore it. Sketch: "Content twins".
7. **Set French typography.** Every French string, message files included, goes through `french-typography` (spacing before `: ; ! ?`, guillemets, apostrophes). Prose in either language goes through `writing`. Done when the French check exits 0 on `messages/fr.json` and the French content files.
8. **Verify the live pair.** Run the parity script, then `node scripts/check-ai-visibility.mjs https://example.com` from the `local-ai-visibility` skill folder, on one French and one English page and read its `hreflang` lines. Done when the parity script exits 0 and the checker reports no FIX for `hreflang` on both pages.

## Rules of thumb

- Translate the meaning, not the words. French runs about 20 percent longer than English, so test the layout with the French strings first.
- A locale in the path (`/fr/...`) is a URL; a cookie or `Accept-Language` redirect is not. Crawlers see URLs only, so each language needs its own.
- Keep one rule per place: French prose and spacing in `french-typography`, Law 25 text and consent in `loi-25-website`, regulator language rules in `ordre-pro-advertising`.
- Legal pages and the cookie banner exist in both languages, with the same content.

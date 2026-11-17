# Query map, plan, page anatomy, checklist

## Query map

One row per query, with its source beside it. With no data at all, the source reads "judgement" and the plan says so at the top.

| Query | Language | Source | Intent | URL that answers it | Service page it feeds |
| --- | --- | --- | --- | --- | --- |
| hypothèque travailleur autonome | fr | Search Console, 210 impressions, position 14 | learn | `/guides/hypotheque-travailleur-autonome` (new) | `/services/travailleurs-autonomes` |
| self-employed mortgage quebec | en | "People also ask", typed 17 Nov 2026 | learn | `/en/guides/self-employed-mortgage-quebec` (new) | `/en/services/self-employed` |

Sources, in order of weight: Search Console export; a client's question (date, channel); autocomplete or "People also ask" (date typed); a competitor page that ranks (URL). Intent is one of learn, compare, buy, local. A "local" query ("courtier hypothécaire Laval") is answered by the service or area page and the Google Business Profile, not by a guide: see `vitrine`.

## Month plan

| Date | Query | Page | New or adapt | First-hand material needed from the owner | State |
| --- | --- | --- | --- | --- | --- |
| 24 Nov | hypothèque travailleur autonome | guide, fr and en | new | one anonymised file that was refused by a bank and accepted elsewhere; the documents the owner asks for on the first call | waiting on material |

A row whose material column is empty is a commodity page: fill the column or drop the row.

## Page anatomy

In this order:

1. **Title (`h1`).** The query, in the reader's words, with the place when the answer depends on it. No brand name, no year unless the content is tied to it.
2. **The answer.** Two sentences that a reader who stops there can act on.
3. **Key points.** Three to five lines, each a full sentence that stands alone, or a table when the page compares options. In French: « À retenir ».
4. **The follow-up questions as `h2`.** The ones autocomplete, "People also ask" and the owner's inbox show. Each section opens with its answer.
5. **First-hand material.** The case, the number, the photo or the position from the plan. It sits in the middle, not in a box at the end.
6. **Sources.** A link at each figure, rate, rule and date, to the page it was read on.
7. **One action.** What to do next and what happens after: the contact path of the matching service page.
8. **Author and dates.** A named person, their role or licence, the date published and the date changed.

Internal links: at least one to the service page the query feeds and, once one exists, one to a sibling guide, with link text that names the target ("mortgage renewal checklist", not "click here"). The service page links back.

## Article JSON-LD

Mark up only what the page shows: drop `image` when the page has none.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[The h1]",
  "image": ["https://[domain]/[image-16x9].jpg"],
  "datePublished": "2026-11-24",
  "dateModified": "2026-11-24",
  "inLanguage": "fr-CA",
  "author": { "@type": "Person", "name": "[First name Last name]", "jobTitle": "[Role]", "url": "https://[domain]/[about-or-contact]" },
  "publisher": { "@type": "Organization", "name": "[Business name]", "url": "https://[domain]/" }
}
</script>
```

## Checklist before a page is called ready

- The title is a query from the map, and no other page on the site targets it.
- A reader who stops after two sentences has the answer.
- The page holds first-hand material that no competitor could have written.
- Every figure, rate, deadline, date and legal or regulatory rule links to a source opened on the day of writing; the "confirm before publishing" list is empty.
- A named person signs it, with a role; the published and changed dates are on the page and in the JSON-LD, and they agree.
- The URLs of every internal link were read from the site's routes, and each answers 200.
- The twin exists in the other language with its own researched title and slug, and `hreflang` links the two both ways.
- Title, meta description and canonical are unique to this page; the page is in the sitemap.
- `writing` passes; on the French page `french-typography` exits 0.
- A profession listed in `ordre-pro-advertising`: no open fix for this page.

# Local AI visibility: facts, directories, JSON-LD, prompt panel

Facts below come from the Molveau research of November 2026 and were last reviewed on 13 November 2026. Figures are from the named reports and were not re-measured; re-check before quoting one to a client.

## Facts (dated)

- **Consumers use AI for local picks.** BrightLocal, 2026: 45% of consumers used AI tools for local recommendations (source: BrightLocal, 2026, not linked).
- **Yelp feeds ChatGPT.** BrightLocal, 2026: Yelp is cited in about 80% of ChatGPT local answers in the US. The figure is US data; no Canadian figure is known (source: BrightLocal, 2026, not linked).
- **Google Business Profile.** BrightLocal, 2026: it matters for Google AI Overviews and AI Mode, and little for ChatGPT (source: BrightLocal, 2026, not linked).
- **Structured, verified data wins citations.** Yext, 2026: structured, verified data is the most cited source type across ChatGPT, Gemini, Perplexity and Claude (source: Yext, 2026, not linked).
- **Bing Webmaster Tools, AI Performance report.** Public preview since February 2026: Copilot citations and grounding queries ([Bing Webmaster Tools](https://www.bing.com/webmasters), 13 November 2026).
- **Search Console, generative AI report.** June 2026: impressions in AI Overviews and AI Mode, no click data ([Google Search Console](https://search.google.com/search-console), 13 November 2026).
- **ChatGPT referral tag.** Visits from ChatGPT often arrive tagged `utm_source=chatgpt.com`, so they show as a source in analytics (seen in analytics tools in 2026, not linked; check your own data).
- **One index.** For Google's AI features, Google says SEO best practices apply unchanged ([Google Search essentials](https://developers.google.com/search/docs/essentials), 13 November 2026).
- **Local business structured data.** Google documents the properties for `LocalBusiness` ([Google, local business structured data](https://developers.google.com/search/docs/appearance/structured-data/local-business), 13 November 2026). Types: [schema.org/LocalBusiness](https://schema.org/LocalBusiness).

## AI crawlers the checker tests

| Bot | Operator | Kind | Used for |
| --- | --- | --- | --- |
| GPTBot | OpenAI | training | model training |
| OAI-SearchBot | OpenAI | search | ChatGPT search results |
| ChatGPT-User | OpenAI | user | a page opened for a user's question |
| PerplexityBot | Perplexity | search | search index |
| Google-Extended | Google | training | a control token for Gemini training; Google says it does not affect inclusion in Google Search or AI Overviews |
| ClaudeBot | Anthropic | training | model training |
| Claude-SearchBot | Anthropic | search | search results in Claude |
| Applebot-Extended | Apple | training | a control token for Apple's AI training |
| Bingbot | Microsoft | search | Bing index, which feeds Copilot |

Blocking a training bot (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended) is a legitimate choice, and the checker reports it as ok; blocking the search and user bots removes the business from answers and stays a FIX. State the choice in writing with the owner.

## Directories for Québec

| Directory | Why | Done when |
| --- | --- | --- |
| Google Business Profile | AI Overviews, AI Mode, Maps | verified, categories, hours, services, photos |
| Bing Places | Bing and Copilot | claimed (it can import from Google) |
| Apple Business Connect | Apple Maps, Siri | claimed, hours and phone match |
| Yelp | cited in about 80% of US ChatGPT local answers | claimed, categories, photos |
| Pages Jaunes (pagesjaunes.ca) | Canadian directory, widely copied by aggregators | claimed, free listing checked |

Add trade directories where they exist (for a regulated profession, the order's public register). Keep name, address and phone identical on every one.

## JSON-LD example

Place one block in the page `<head>`. Replace every value; remove no field the checker lists.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "[Business name]",
  "url": "https://[domain]/",
  "telephone": "+1-514-555-0100",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[Street]",
    "addressLocality": "Montréal",
    "addressRegion": "QC",
    "postalCode": "[A1A 1A1]",
    "addressCountry": "CA"
  },
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "09:00", "closes": "17:00" }
  ],
  "priceRange": "$$",
  "areaServed": "Montréal",
  "availableLanguage": ["fr", "en"],
  "sameAs": [
    "https://www.yelp.ca/biz/[slug]",
    "https://www.pagesjaunes.ca/[profile]",
    "https://[google-business-profile-link]"
  ]
}
</script>
```

Use `offers` instead of `priceRange` when you list priced services. Mark up only what the page shows.

## llms.txt

A Markdown file at `/llms.txt`: a title, a one-line summary, then links to the pages that hold the prices, services, contact and booking. Keep it short and true. No assistant is known to guarantee that it reads the file; it costs ten minutes.

## Prompt panel

Run monthly, from a signed-out browser, in the same city. Ten prompts per trade, half in French and half in English, in four assistants (ChatGPT, Perplexity, Gemini or Google AI Mode, Copilot). Write the prompts the way a client would.

| # | Prompt (example for a plumber) |
| --- | --- |
| 1 | Meilleur plombier à [ville] |
| 2 | Plombier d'urgence ouvert le dimanche à [quartier] |
| 3 | Combien coûte un remplacement de chauffe-eau à [ville] |
| 4 | Plombier recommandé près de [adresse] avec de bons avis |
| 5 | Qui répare une fuite d'eau à [ville] cette semaine |
| 6 | Best plumber in [city] |
| 7 | Emergency plumber open Sunday in [neighbourhood] |
| 8 | How much does a water heater replacement cost in [city] |
| 9 | Recommended English-speaking plumber near [address] |
| 10 | Who fixes a leak in [city] this week |

Log table (one row per prompt and assistant):

| Date | Assistant | Prompt # | Business named? (yes/no) | Position | Cited URL | Competitors named | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |

Read the log as a trend over three months, not as a verdict on one run: answers change between runs.

## What not to expect

- No promise of being recommended. Nobody controls what an assistant says.
- Answers vary by run, by account, by city and by day; a single run proves nothing.
- Results from directories and reviews take weeks to show.
- Search Console's generative AI report counts impressions and no clicks, so it cannot show visits from AI answers.
- Do not pay for a service that guarantees a place in ChatGPT answers.

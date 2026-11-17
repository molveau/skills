# Prompt panel, log, JSON-LD, outreach

## Prompt panel

Twenty prompts, written the way a buyer types them, split between the languages the product sells in. Four kinds:

| Kind | Share | Example (invoicing software for Québec contractors) |
| --- | --- | --- |
| Category | 6 | Quel logiciel de facturation pour un entrepreneur en rénovation au Québec ? |
| Problem | 6 | How do I prepare my GST and QST report as a self-employed contractor? |
| Comparison | 5 | [Competitor A] ou [Competitor B] pour un travailleur autonome au Québec ? |
| Brand | 3 | C'est quoi [Brand] et combien ça coûte ? |

How to run it:

- Assistants: ChatGPT with search, Perplexity, Gemini or Google AI Mode, Copilot. With little time, keep two and keep the same two every month.
- A fresh conversation for each prompt, signed out or with memory and personalisation off. Otherwise the assistant already knows who is asking.
- Each prompt twice. The prompts stay the same from month to month; a prompt added later starts its own trend.
- The brand is typed only in the brand prompts. Competitor names in the comparison prompts come from the owner; with none, run the category prompts once, take the names the answers give, then freeze the panel.
- A different product with the same name counts as not named; note it.
- Short first panel, when the owner has an hour: the first ten prompts, one run, two assistants. Order the twenty so the first ten hold three category, three problem, two comparison and two brand prompts. Write "short panel" in the log; the next month runs all twenty, and the trend is read on those ten until the full panel has its own history.

## Log

One row per answer.

| Date | Assistant | Prompt # | Run | Brand named | Rank among brands | Accurate (yes, partly, no) | Competitors named | URLs cited |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

Three numbers come out of it:

- **Mention rate**: answers that name the brand, over answers. Per assistant and per kind of prompt.
- **Accuracy**: mentions where price, audience and features are right, over mentions. A wrong fact points to the page to fix in step 3.
- **Sources**: third-party pages cited, and on how many the brand appears.

Molveau's reading, with no vendor source: the sources number tends to move before the mention rate, and two mentions out of forty is noise. Read the trend over three months.

## Secondary signals

- Referral sources in the analytics: `chatgpt.com`, `perplexity.ai`, `copilot.microsoft.com`, `gemini.google.com`. They undercount: many readers see the answer, then type the name into Google.
- Search Console: the generative AI performance report, and impressions on the brand name.
- Server logs: requests from `ChatGPT-User`, `Perplexity-User` and `Claude-User` mean an assistant opened a page while answering someone.
- A "how did you hear about us" question at signup, with "ChatGPT or another AI assistant" among the choices. On a Québec site, run `loi-25-website` on the form.

## JSON-LD for a product site

Mark up only what the page shows. Leave `aggregateRating` and `review` out until real reviews are displayed on the page.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://[domain]/#org",
      "name": "[Brand]",
      "url": "https://[domain]/",
      "logo": "https://[domain]/[logo].png",
      "sameAs": ["https://www.linkedin.com/company/[slug]", "https://[directory-listing]"]
    },
    {
      "@type": "SoftwareApplication",
      "name": "[Brand]",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "inLanguage": ["fr-CA", "en-CA"],
      "publisher": { "@id": "https://[domain]/#org" },
      "offers": [
        { "@type": "Offer", "name": "[Plan name]", "price": "19.00", "priceCurrency": "CAD" },
        { "@type": "Offer", "name": "[Plan name]", "price": "39.00", "priceCurrency": "CAD" }
      ]
    }
  ]
}
</script>
```

A shop uses `Product` with `offers` on each product page in place of `SoftwareApplication`.

## Outreach messages

Each message is sent by a named person at the company, from the company's address, in the recipient's language. One follow-up, ten days later, then stop.

To the author of a comparison that the answers cite:

```text
Subject: [Brand], missing from your comparison of [category]

Hello [First name],

I read your article "[Title]". I work at [Brand], which is not in it: [one sentence, what it does and for whom]. It costs [price] and runs in [languages].

If you update the article, I can open a trial account for you and answer your questions. What you write about it is up to you.

Thank you for your time.

[First name Last name]
[Role], [Brand]
```

To a customer, for a review on the platform the answers cite:

```text
Subject: A small favour

Hello [First name],

You have used [Brand] for [duration]. Would you write a short review on [platform]? It takes about five minutes: [link]

Say what work you do, what you use [Brand] for, and what could be better. An honest review helps us more than a perfect one.

Thank you.

[First name Last name]
[Brand]
```

Before quoting a review on the site, get the customer's written consent for the name, trade and city shown.

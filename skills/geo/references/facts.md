# AI search: what the vendors say, dated

Every line below was read on the vendor's own page on 17 November 2026, except where a line says otherwise. Quotes are the vendor's words. Open the page again before quoting one to a client. With no web access, quote it with the date above.

## Google: AI Overviews and AI Mode

Sources: [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) and the [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

- **It is SEO.** "Optimizing for generative AI search is optimizing for the search experience, and thus still SEO."
- **No extra requirement.** "There are no additional requirements to appear in AI Overviews or AI Mode, nor other special optimizations necessary." The page must be indexed and "eligible to be shown in Google Search with a snippet".
- **No special file or markup.** "You don't need to create new machine readable files, AI text files, markup, or Markdown to appear in Google Search." Google Search ignores `llms.txt`. "There's no special schema.org markup you need to add."
- **No chunking, no writing for AI.** "There's no requirement to break your content into tiny pieces for AI to better understand it." "You don't need to write in a specific way just for generative AI search."
- **No page per variation.** Separate content for each wording, made "primarily to manipulate rankings or generative AI responses", falls under the scaled content abuse policy. "A high quantity of pages doesn't make a website higher quality."
- **What does help.** Content written "based on what you know about the topic"; crawlable pages; headings that give "a clear structure"; text supported by images and video; for a shop or a local business, Merchant Center feeds and a Google Business Profile.
- **Tools that promise.** "Be wary of third-party tools that promise ranking success or claim to use 'internal' Google metrics."
- **Measure.** The generative AI performance report in Search Console; AI features also count in the Performance report "within the 'Web' search type". Serving is not guaranteed even when every requirement is met.
- **Controls.** `nosnippet`, `data-nosnippet`, `max-snippet` and `noindex` limit what Google shows. `Google-Extended` limits "AI training and grounding in some of Google's other systems"; it is not the control for Search.

## The crawlers

| Bot | Operator | Kind | The operator's words |
| --- | --- | --- | --- |
| OAI-SearchBot | OpenAI | search | "Sites that are opted out of OAI-SearchBot will not be shown in ChatGPT search answers" |
| ChatGPT-User | OpenAI | user | "ChatGPT-User is not used to determine whether content may appear in Search" |
| GPTBot | OpenAI | training | "Disallowing GPTBot indicates a site's content should not be used in training generative AI foundation models" |
| PerplexityBot | Perplexity | search | "It is not used to crawl content for AI foundation models" |
| Perplexity-User | Perplexity | user | "This fetcher generally ignores robots.txt rules" |
| Claude-SearchBot | Anthropic | search | "navigates the web to improve search result quality for users" |
| Claude-User | Anthropic | user | "Claude-User supports Claude AI users" |
| ClaudeBot | Anthropic | training | collects "web content that could potentially contribute to their training" |
| Googlebot | Google | search | the crawl control for Search and its AI features |
| Google-Extended | Google | training | see Controls above |
| Bingbot | Microsoft | search | not read: Bing's guidelines did not load on 17 November 2026 |

Sources: [OpenAI](https://developers.openai.com/api/docs/bots), [Perplexity](https://docs.perplexity.ai/guides/bots), [Anthropic](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-prevent-crawling).

Blocking a training bot keeps pages out of model training and leaves the answers alone; blocking a search bot removes the site from that assistant's search answers. Which training bots to allow is a licensing choice that belongs to the owner. The `local-ai-visibility` checker tests nine of these bots; add `Perplexity-User`, `Claude-User` and `Googlebot` by reading `robots.txt` by hand.

## llms.txt

A Markdown file at the site root; the only required part is an `h1` with the project name, usually followed by a one-line summary in a blockquote and `h2` lists of links ([llmstxt.org](https://llmstxt.org/), page dated 10 August 2026). The page names no AI company that commits to reading it. Google: "these files aren't needed for Google Search".

## What Google and the law say about mentions

- **Inauthentic mentions.** Google: "seeking inauthentic 'mentions' across the web isn't as helpful as it might seem" (AI optimization guide).
- **Link exchanges and paid links.** Google's spam policies list "Excessive link exchanges ("Link to me and I'll link to you")" as link spam; a paid link is fine "as long as" it is qualified with `rel="nofollow"` or `rel="sponsored"` ([Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)). A network of sites that cite each other is a link exchange.
- **Testimonials and endorsements in Canada.** The Competition Bureau treats an endorsement as a representation; the Competition Act covers false or misleading representations (section 52 and paragraph 74.01(1)(a)), and section 74.02 "prohibits the unauthorized use or the distortion of test and testimonials" ([Competition Bureau](https://competition-bureau.canada.ca/en/deceptive-marketing-practices/types-deceptive-marketing-practices/misleading-representations-and-deceptive-marketing-practices)). This is general information, not legal advice.
- **Reddit and Quora.** Their rules on self-promotion were not read: both sites refused automated access on 17 November 2026. Read the rules of the community in a browser before the first post, and state the affiliation in every post that names the brand.

## What not to expect

Molveau's reading of the above, not vendor statements.

- No promise of being named. Answers change by run, by account, by language and by day; one run proves nothing.
- A model that answers from memory, without searching, cannot be moved in a month.
- Structured data, `llms.txt` and crawler rules make a site readable. They do not make an assistant recommend it.
- A service that guarantees a place in ChatGPT answers is selling something nobody has.

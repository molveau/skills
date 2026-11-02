# Discoverability (GEO / agent-readiness)

**Scope:** public-facing marketing and portfolio sites. **Skip for internal app UI**: agents do not cite a logged-in dashboard.

Distilled from Suganthan Mohanadasan's primary research: he read ~1,240 of ChatGPT's
raw source records from network traffic rather than repeating SEO-guru advice
(`suganthan.com/blog/how-chatgpt-picks-sources`, `.../how-to-make-website-agent-ready`).
Kept only what's verified and durable; the bleeding-edge protocol zoo is parked at the
bottom on purpose.

## The honest ROI frame (read this first)

Shipping llms.txt / structured data / agent protocols **does not buy citations or
referral traffic**. An Ahrefs study of 1,885 pages found *no* significant 30-day
citation uplift from schema: the most-studied signal. ChatGPT can be ~40% of crawl
volume yet send ~3 human visits a week. What these things demonstrably do:
1. **Cut fetch/parse cost** for crawlers already visiting (~5× smaller payload via markdown).
2. **Make you legible** to the system deciding whether to cite you.

So: do the cheap, durable basics; don't burn a sprint on speculative protocols.
**Small/personal sites (<5k visits/mo) can skip nearly all of it.**

## How LLMs actually pick sources (the *why*)

ChatGPT tags every web result with a `result_source` (never shown in the answer),
one of four pipelines: `serp` (open-web baseline, mostly news), `labrador` (licensed
publisher allowlist: Reuters, WSJ, Wikipedia, arXiv), `bright`/`oxylabs` (commercial
scrapers: shopping, finance, local). Consequences that matter to us:

- **The query wording picks the bucket, not the topic.** Some queries never hit the
  web (answered from training data): you can't optimize your way into those short of
  long-term brand authority.
- **Citations bind to specific sentences, not whole pages.** Topical relevance alone
  isn't enough: the sentence has to stand on its own.
- **Results dedupe by domain.** One strong page per claim beats a pile of weak ones.
- **You can't cite yourself.** Recommendations *about* you come from third-party
  coverage; your own page is cited only for your own specs/pricing.
- **Text gets cited; video metadata doesn't** (YouTube fetched 201×, cited 0×).
  Reddit and listicles/review sites dominated real citations.

## Content rules that actually move the needle

- **Put every fact, number, and price in plain HTML text**: never behind JS toggles,
  inside a PDF, or baked into an image. Models grep for `$`, `€`, `99`; a JS-rendered
  pricing table is invisible and they'll cite a competitor instead.
- **Make each factual claim a self-contained sentence** (citations bind per-sentence).
  "Acme builds bilingual sites for local businesses from $X" beats the same fact
  split across a hero and a footer.
- **One authoritative page per claim.** Don't dilute across near-duplicate pages.
- **Survive the `site:yourdomain.com` probe**: clean, crawlable, no ghost overlays
  or layout shift that breaks DOM parsing.
- **Earn third-party mentions** for anything you want *recommended* (vs. merely quoted).
  A clean pricing page gets your facts read; someone else's coverage gets you picked.

## Minimum viable agent-ready stack (priority order)

1. **robots.txt AI rules** (~5 min): explicitly allow the crawlers you want:
   ```
   User-agent: GPTBot
   Allow: /
   User-agent: ClaudeBot
   Allow: /
   User-agent: PerplexityBot
   Allow: /
   ```
2. **llms.txt** (~30 min): root, human-readable markdown, `llmstxt.org` format. Real
   observed use is narrow (mostly coding agents with hardcoded URLs), not broad chatbot
   grounding: ship it, don't expect magic.
3. **Semantic HTML + a11y**: real `<button>`/`<a>`/`<nav>`/`<main>`, `<label for>`,
   ≥24px tap targets, `cursor: pointer`, stable layout. This is the same work as the
   accessibility baseline: GEO and accessibility are the same lever here.
4. **Sitemap + HTTP `Link` headers** (~15 min): table stakes for discovery:
   ```
   Link: </sitemap.xml>; rel="sitemap"
   Link: </llms.txt>; rel="describedby"; type="text/markdown"
   ```
5. **Markdown negotiation** (optional, nice ROI): when a request sends
   `Accept: text/markdown` on a content route, serve markdown (~5× smaller than HTML).


## Park, don't build (per the author's own caveats: June 2026)

A2A agent cards, WebMCP / `navigator.modelContext`, MCP server cards, Agent Skills
(`/.well-known/skills.json`), Open Knowledge Format, Agentic Resource Discovery,
commerce protocols (x402/MPP/UCP/ACP). All bleeding-edge with no demonstrated citation
ROI. Relevant only to tool/API-rich products or sites that *are* agents: not to a
marketing or portfolio site. Revisit when one becomes table stakes, not before.

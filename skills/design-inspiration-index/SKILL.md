---
name: design-inspiration-index
description: Routing index for design inspiration. Use when you need visual references or ideas for a UI (a hero, landing page, SaaS page, navbar, CTA, motion or micro-interaction, brand or rebrand, component, icon) and want to know which curated gallery to pull from. Maps a need to the best source among galleries, component registries and optional MCP servers. Use it before hunting blindly for inspiration.
---

# Design inspiration index

A retrieval map: "I need inspiration for X, so go to source Y." It is an index of public galleries and registries, not a design authority; once you have references, build with the `ui` skill and check the result with `anti-slop`. Per-site detail (access, format, filters, retrieval tips) is in `references/galleries.md`.

Nothing here is required. Every source is a public website; the two that have MCP servers (Mobbin, Refero) are optional and only worth wiring up if you use them often.

## When you need X, go to Y

| You need | Go to | Notes |
|---|---|---|
| A complete website to admire (broad taste input) | collected.li (shuffle), siteofsites.co (filterable), unmatchedstyle.com (editorial), recent.design (daily) | collected shows 8 random sites; siteofsites filters by platform; unmatchedstyle has trend articles |
| A hero or full-page layout | landing.love (motion), craftwork.design/inspiration/websites (broad) | landing.love records full-page video |
| A landing page in motion | landing.love | filter by the GSAP, WebGL or ThreeJS collections |
| A SaaS marketing site or one SaaS page type | saaspo.com | filter by page type (pricing, features) and industry |
| A pricing page | saaspo.com (page type) and cta.gallery (the CTA block) | |
| A navbar, header or mega menu | navbar.gallery | filter by sticky, mega menu, sidebar, full-screen |
| A call to action, signup or newsletter block | cta.gallery | filter by industry and by button, form, newsletter, modal |
| A motion or micro-interaction idea | 60fps.design (the motion), designspells.com (the idea and why) | designspells explains one delightful detail, mobile and desktop |
| A delightful detail, easter egg or "magic" touch | designspells.com | tags: easter egg, confetti, transition, 404 |
| Real product UI: page types, flows, UX patterns (web) | refero.design | filter by page type, flow, pattern, element or font; has an optional MCP server |
| OG images, App Store screenshots, app icons | recent.design | dedicated tabs few others have |
| A logo, brand identity or rebrand | rebrand.gallery | the only branding source here |
| How to build or name a UI component | component.gallery | cross-system reference with name aliases (Accordion = Collapse = Disclosure) |
| Component code to drop in (React) | shadcn/ui, mapcn (maps) | start with what the project already uses |
| Pre-built app blocks (forms, auth, sidebars, tables) | blocks.so | free, copy and paste |
| Pre-built marketing and landing blocks | tailark.com (curated), shadcnblocks.com (large, freemium), shadcnspace.com | freemium |
| A complex composite widget (Gantt, Kanban, editor, table) | kibo-ui.com | free, shadcn CLI registry |
| Animated component or micro-interaction code | smoothui.dev, ui-layouts.com | Motion or GSAP based |
| Theme generation for shadcn | shadcnstudio.com | free community tier |
| A retro or pixel-art look | 8bitcn.com | shadcn restyle, niche by design |
| Accessible components on React Aria (not Radix) | intentui.com | does not mix cleanly with Radix-based shadcn |
| An icon or SVG | lucide.dev (default), react-icons, reicon.dev, hugeicons.com | Lucide is the shadcn default, stroke style; react-icons bundles many sets including brand logos; Reicon has outline and filled; Hugeicons is large and freemium |
| Mobile app flows and screens | Mobbin | login required; use its MCP server if you have it, otherwise the site |
| A famous brand's design system written out | the awesome-design-md repo (github.com/VoltAgent/awesome-design-md) | read two or three before defining a design language |
| A named UX principle for a review finding | lawsofux.com | cite the law by name: Fitts, Hick, Jakob, Peak-End |
| Component search or generated UI variants | 21st.dev | search before hand-writing novel UI |

Free component libraries that ship their own registry are worth checking before you write a block by hand. Adapt anything you import to the project's tokens and accessibility rules.

## Design engineers to study

High-signal people whose sites and open-source work are worth studying and following.

| Person | Site | Known for |
|---|---|---|
| Emil Kowalski | emilkowal.ski | Sonner, Vaul; web animation craft |
| shadcn | shadcn.com | shadcn/ui; copy-in components and registries |
| Paco Coursey | paco.me | cmdk, next-themes; keyboard-first minimal UI |
| Rauno Freiberg | rauno.me | interface invariants and the why behind polish |
| Raphael Salaja | raphaelsalaja.com | motion-rich portfolio, playful interaction craft |
| Gavin Nelson | nelson.co | product and icon design |
| floguo | floguo.com | expressive micro-interactions, personality |
| Syed Subhan | syedsubhan.in | micro-transitions; built Amicro (amicro.vercel.app), a collection of reusable micro-transition patterns |

## Mobbin and Refero: optional MCP servers

Both need a login and are best queried through an MCP server if you have one connected. Mobbin exposes screen, flow and section search; Refero's server is at `https://api.refero.design/mcp` (docs: https://doc.refero.design/mcp/getting-started) and returns real product screens. If you have neither, browse the sites by hand. Do not scrape.

## Access cheat sheet

Verify before relying; sites change.

- Open and free, no login: landing.love, navbar.gallery, cta.gallery, 60fps.design, collected.li, siteofsites.co, unmatchedstyle.com, recent.design, designspells.com, lucide.dev, reicon.dev, component.gallery, saaspo.com.
- Freemium (browse free, pay for assets or the full library): craftwork.design, rebrand.gallery, hugeicons.com, refero.design.
- Login or MCP: Mobbin, refero.design.

Several of these (saaspo.com, component.gallery, landing.love, designspells.com) block automated fetches with a 403 or 429 but open fine in a normal browser. godly.website now redirects to recent.design. To pull from a blocked site programmatically, drive a real browser (for example with a Playwright MCP, if installed) rather than a plain HTTP fetch.

## How to extend this index

Add a new gallery to `references/galleries.md` with the same fields (name, URL, category, best for, access, format, retrieval tip), then add a routing row to the table above.

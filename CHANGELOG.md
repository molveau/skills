# Changelog

All notable changes to this project are written here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

## [1.6.0] - 2026-11-13

### Added

- `ordre-pro-advertising` skill: advertising rules for the site of a Québec regulated professional, with a pass, fix or n.a. report per rule.
- `paid-booking` skill: deposits, full payment, no-show fees, refunds and receipts for a booking site, with a Stripe test-mode check.
- `local-ai-visibility` skill: how a small local business gets found and cited by AI search.
- `bilingual-next` skill: `next-intl` setup for a French and English Next.js site.
- `check-ai-visibility` script: checks a page for the signals AI crawlers and search read.
- `check-i18n-parity` script: lists the keys that differ between the French and English message files.
- `get_playbook` serves the four new skills.

## [1.5.0] - 2026-11-12

### Changed

- Skills read only the playbook section a task needs, not the whole playbook.
- Credits and vendor notes moved to `references/vendor/README.md` in each skill.
- Each rule has one owner skill. The others point to it.
- Descriptions are shorter, with one trigger per kind of request.
- `design-grill` runs only when you type `/design-grill`. Other skills suggest it instead of running it.
- `workflow` reads the section of `references/delivery-loop.md` for the step it is on.
- Every numbered playbook section of `ui`, `ux`, `motion` and `anti-slop` is routed from its `SKILL.md`, and a test checks it.

### Fixed

- Rules that had drifted between skills: mockup first in `saas`, and the French-only `fr-typo` check in `vitrine`.

## [1.4.0] - 2026-11-11

### Added

- `writing`, a twelfth skill that finds AI-sounding prose in English and French: transition openers, scene-setting intros, hedging, inflated wording, mechanical listing words, cliché conclusions, buzzword verbs, em dashes, and three house tells: "it's not X, it's Y", "whether you're X or Y", and chat filler. Its playbook is served by `get_playbook`.
- `check-writing`, the zero-dependency script for the `writing` skill. `node skills/writing/scripts/check-writing.mjs [--lang en|fr|auto] [--json] <paths...>` reports each finding with its line. In `auto` mode it detects the language per paragraph.
- `check_writing`, a sixth MCP tool on the stdio server and the hosted endpoint.

### Changed

- The catalogue says twelve skills and six tools. `writing` joins the Design bundle.
- The ChatGPT package lists six tools.

## [1.3.2] - 2026-11-02

### Added

- `openai/` and `scripts/openai-package.mjs`: the ChatGPT plugin package for the hosted endpoint (manifest, `mcp.json`, an onboarding skill, the icon, five positive and three negative review cases). `node scripts/openai-package.mjs --demo <url>` checks the directory's limits and writes `dist/molveau-skills-openai-<version>.zip`.

### Fixed

- `detect_tells` reported each buzzword twice on a line of JSX text, once for the whole line and once for the text between its tags.

### Changed

- `PRIVACY.md` says how the hosted endpoint's rate limit uses the IP address.

## [1.3.1] - 2026-11-02

### Fixed

- `fr_typo` placed each finding by reading the text from the start again, so a long text with many findings took quadratic time: 57 seconds for 200,000 characters with a finding on every line. Line starts are now found once and searched, and the same text takes about 40 ms. This matters most on the hosted endpoint, where one request could hold a worker for seconds.

## [1.3.0] - 2026-11-02

### Added

- `@molveau/skills/core`, the MCP server's transport-agnostic core: `handleRpc(message, options)` answers one parsed JSON-RPC message or a batch, and returns null for a notification. The stdio server uses it, so a hosted Streamable HTTP route answers exactly as the local server does. `bundledFiles()` lists the skill files it reads at run time. `package.json` now has an `exports` map (`.`, `./core`, `./package.json`); the bin is unchanged.
- Remote mode (`handleRpc(message, { remote: true })`) for a hosted endpoint: `detect_tells` takes only `code` and `filename` (no `paths`, so no file outside the skills' own is read), string arguments over 200,000 characters are a tool error, and `get_playbook` leaves out the lines that point at Molveau Studio, the Law 25 report's closing line among them, from its text and its structured data. `options.remote` must be a boolean: any other value throws rather than falling back to local mode.
- Tool annotations tested on all five tools in both modes: `title`, `readOnlyHint: true`, `destructiveHint: false`, `openWorldHint: false`, `idempotentHint: true`.

### Changed

- `PRIVACY.md` covers the hosted endpoint at `https://www.molveau.ca/api/mcp`: what it receives, that it stores none of it, and the hosting provider's request logs.

## [1.2.1] - 2026-11-01

### Changed

- The story video credit reads `molveau.ca/skills · unslop method by @heydamir`.
- The Law 25 report ends with one line about Molveau Studio's fixed-price Law 25 package, in the report's language. Nothing else in any output promotes anything.

## [1.2.0] - 2026-11-01

### Added

- Four plugin commands in `skills/commands/`: `unslop` (the full `anti-slop` run without waiting for approval, keeping the original as the before), `story-video` (the before and after story video, Accessibility step included), `fr-check` (the `fr-typo` checker on given paths or the project's French files, fixing only when asked) and `loi-25-audit` (the Law 25 report; not legal advice).
- Two read-only plugin agents in `skills/agents/`: `ui-reviewer` (the `ui`, `ux` and `anti-slop` skills and the tells detector; ranked findings with `file:line` and exact fixes) and `loi-25-auditor` (the `loi-25-website` report).
- A plugin option, `check_on_edit` ("Check edited files" in `/config`), on by default.

### Changed

- The plugin now registers the `hook-check` PostToolUse hook from `skills/hooks/hooks.json`, on by default. Turning `check_on_edit` off makes the hook exit at once. Installs made with the skills CLI still register it by hand, as the README shows.
- `hook-check.mjs` builds its report lines by concatenation instead of template literals; the output is unchanged.

## [1.1.1] - 2026-11-01

### Added

- Directory listing fields in `plugin.json`: display name, documentation, support, privacy policy and terms of service links, with `PRIVACY.md` and `TERMS.md` in the repository.

## [1.1.0] - 2026-11-01

### Added

- An MCP server with five read-only tools: `detect_tells` (the anti-slop tells in a snippet or in files inside the working directory), `check_contrast` (WCAG ratio, AA and AAA), `fr_typo` (French spacing and punctuation, check or fix), `check_motion` (the motion guardrails) and `get_playbook` (a skill's direction gate or the playbook sections that match a query). Zero dependencies; the Claude Code plugin starts it through `skills/.mcp.json`.
- An opt-in Claude Code hook, `skills/anti-slop/scripts/hook-check.mjs`: after an edit it runs `detect-tells` on UI code and `fr-typo` on French message files, and reports findings back to the agent. The plugin does not register it; see the README.
- The npm package `@molveau/skills`, so other MCP clients can run the server with `npx -y @molveau/skills`.

### Changed

- `detect-tells`, `check-motion` and `fr-typo` export the helpers the server and the hook share with their CLIs (`isScannable`, `sfcAsHtml`, `formatFindings`, `visible`); the CLIs behave as before.

## [1.0.4] - 2026-11-01

### Changed

- Wording only: the `ui` playbook no longer uses "set" as a verb, and taste-skill's SOURCE.md note no longer quotes the phrases the plugin directory's screens misread as credential handling.

## [1.0.3] - 2026-11-01

### Changed

- taste-skill's `references/imagery.md`, `references/app-screens.md` and `assets/` are no longer vendored; the anti-slop playbook (§12, §13) condenses them and `SKILL.md` links the originals. Wording in the `ui` playbook and a `design-grill` comment no longer reads as shell or credential use to the plugin directory's screens.

## [1.0.2] - 2026-11-01

### Changed

- The Claude Code plugin is now the `skills/` folder only (`skills/.claude-plugin/plugin.json`), so tests, fixtures, the example video and the repo scripts are no longer part of it.
- Fewer vendored files: unslop's reference images, Stageshow's two Wikipedia photos, and taste-skill's `scripts/` and `library/` are no longer copied (links to upstream instead). The direction gate replaces taste-skill's dealt direction.

## [1.0.1] - 2026-11-01

### Changed

- One Claude Code plugin, `molveau-skills@molveau`, with every skill, declared in `.claude-plugin/plugin.json` with an icon, as the Anthropic plugin directory requires. The Design, Québec and Playbooks bundles remain available with the skills CLI (`-s`); their separate Claude Code plugins are gone.

## [1.0.0] - 2026-11-01

First public release.

### Added

- Eleven skills: `anti-slop`, `ui`, `ux`, `motion`, `design-grill`, `design-inspiration-index`, `french-typography`, `loi-25-website`, `saas`, `vitrine`, `workflow`.
- A direction gate in every skill that starts a build: five lines, an inventory, the second-order defaults to refuse and a swap test.
- Story video renderer for `anti-slop`, adapted from unslop, with a live accessibility step (WCAG contrast and target size).
- Zero-dependency scripts: `detect-tells`, `check-motion`, `fr-typo`, and the `design-grill` helpers.
- Four Claude Code plugins in one marketplace: everything, design, Québec, playbooks.
- Pinned, unedited copies of the upstream skills each domain skill routes to, with a weekly upstream check.

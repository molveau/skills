# Changelog

All notable changes to this project are written here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

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

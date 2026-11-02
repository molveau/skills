# Changelog

All notable changes to this project are written here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

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

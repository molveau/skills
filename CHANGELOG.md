# Changelog

All notable changes to this project are written here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

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

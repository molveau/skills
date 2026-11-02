# Source: taste

- Repo: https://github.com/Leonxlnx/taste-skill
- Commit: 12af471f627f866411b4bd785b19646d3672784c
- Commit date: 2026-10-25T01:42:19+02:00
- License: MIT
- Author: Leonxlnx
- Changes: none, copied verbatim. Files were only relocated and each upstream `SKILL.md` was renamed to `<skill>.md`.

## Layout

For a skill named `<skill>`: its `SKILL.md` is `<skill>.md` next to this file, and its other files are under `<skill>/`.
Relative links inside vendored files point to the upstream layout, so some may not resolve here. Files are not edited.

## Excluded

- `**/agents/**`
- `skills/taste-skill/evals/**`

## Notes

`evals/` (six test briefs the upstream author uses to benchmark the skill against a no-skill baseline) is not vendored: nothing in the skill reads it during an agent run. `library/` (1.6 MB) and `scripts/` (332 KB) are kept on purpose: `scripts/draw.mjs` loads every `library/*.json` file at start (directions, heroes, sections, type, palettes, photos, sites, motions) and `scripts/lib/app-draw.mjs` loads `library/app.json`, so dealing a direction, the core of the page and app-screen runs, fails without them; `lint.mjs`, `inspect.mjs` (with `scripts/lib/`), `scenes.mjs` and `assets.mjs` are the gate and the image search the run calls by name.

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
- `skills/taste-skill/scripts/**`
- `skills/taste-skill/library/**`

## Notes

`evals/`, `scripts/` and `library/` are not vendored. The scripts read keys from the environment and fetch from the network, and two library files are over 256 KB, which holds a plugin for manual review in the Anthropic directory. Without them taste-skill's dealt direction and gate scripts do not run; the direction gate in `skills/anti-slop/SKILL.md` takes their place, and the references (type, colour, layout, imagery, app screens, copy, critique, tells) are kept. Use the upstream repo for the scripts.

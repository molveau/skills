# Source: unslop

- Repo: https://github.com/heydamir/unslop
- Commit: a6f121eee5f29c2f74976b75456feae8b66afb3a
- Commit date: 2026-11-01T19:46:09+03:00
- License: CC-BY-4.0
- Author: Damir Sokolovsky
- Changes: none, copied verbatim. Files were only relocated and each upstream `SKILL.md` was renamed to `<skill>.md`.

## Layout

For a skill named `<skill>`: its `SKILL.md` is `<skill>.md` next to this file, and its other files are under `<skill>/`.
Relative links inside vendored files point to the upstream layout, so some may not resolve here. Files are not edited.

## Excluded

- `**/agents/**`
- `skills/unslop/references/refs/**`
- `examples/**`

## Notes

The reference images in `references/refs/` are not vendored, so the plugin ships no unread binary; view them upstream at https://github.com/heydamir/unslop/tree/main/skills/unslop/references/refs (story-dashboard-frames.webp shows the story video frame by frame). The upstream `examples/` folder is not vendored. Attribution required (CC BY 4.0): see `skills/anti-slop/SKILL.md`.

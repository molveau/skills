# Source: impeccable

- Repo: https://github.com/pbakaus/impeccable
- Commit: e89e3ada3e875a89ac2c5d33d11e65ebef6fe285
- Commit date: 2026-11-01T14:26:36+00:00
- License: Apache-2.0
- Author: Paul Bakaus
- Changes: none, copied verbatim. Files were only relocated; renamed: `plugin/skills/impeccable/SKILL.md` to `impeccable.md`.

## Layout

Relative links inside vendored files point to the upstream layout, so some may not resolve here. Files are not edited.

## Excluded

- `plugin/skills/impeccable/scripts/**`
- `plugin/skills/impeccable/reference/clarify.md`
- `plugin/skills/impeccable/reference/harden.md`
- `plugin/skills/impeccable/reference/onboard.md`

## Notes

Taken from the built `plugin/skills/impeccable/` output (not the `SKILL.src.md` template). `reference/*.md` is flattened next to `impeccable.md`. The `scripts/` folder (font index, live browser bundle) is not vendored. `reference/clarify.md`, `harden.md` and `onboard.md` are not vendored here: they live once in the `ux` skill (source `impeccable-ux`), which owns copy, resilience and onboarding; the ui router and playbook cite none of them. Apache-2.0: LICENSE and NOTICE.md kept; changes are limited to relocation and renaming.

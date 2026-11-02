# Source: stageshow

- Repo: https://github.com/benjitaylor/skills
- Commit: 802057409787133703c56001080169e347305572
- Commit date: 2026-10-31T11:07:17-07:00
- License: MIT (code)
- Author: Benji Taylor
- Changes: none, copied verbatim. Files were only relocated and each upstream `SKILL.md` was renamed to `<skill>.md`.

## Layout

For a skill named `<skill>`: its `SKILL.md` is `<skill>.md` next to this file, and its other files are under `<skill>/`.
Relative links inside vendored files point to the upstream layout, so some may not resolve here. Files are not edited.

## Excluded

- `stageshow/assets/app-icons.ts`
- `stageshow/kit/brands/**`
- `stageshow/package-lock.json`
- `stageshow/package.json`
- `stageshow/playground/**`
- `stageshow/teaching/**`
- `stageshow/scripts/**`
- `stageshow/examples/phones/**`
- `stageshow/examples/bento/**`
- `stageshow/examples/parts/**`
- `stageshow/examples/google-docs/**`
- `stageshow/examples/google-calendar/**`
- `stageshow/examples/kit-extras/**`
- `stageshow/examples/figma/**`
- `stageshow/examples/brand-marks/**`
- `stageshow/examples/gmail/**`
- `stageshow/examples/linear/**`
- `stageshow/examples/excel/**`
- `stageshow/examples/hero-demo/**`
- `stageshow/examples/wikipedia/index.tsx`
- `stageshow/examples/wikipedia/wiki.css`
- `stageshow/examples/finder/**`
- `stageshow/examples/finder-glass/**`
- `stageshow/examples/imessage/**`
- `stageshow/examples/notion/**`
- `stageshow/examples/powerpoint/**`
- `stageshow/examples/raycast/**`
- `stageshow/examples/slack/**`
- `stageshow/examples/spotify/**`
- `stageshow/examples/telegram/**`
- `stageshow/examples/dynamic-island/**`

## Notes

Third-party artwork is not vendored: `assets/app-icons.ts` and `kit/brands/**` (not MIT, see NOTICE.md), so imports of them in `kit/` and `examples/` do not resolve. Also not vendored: `package*.json`, `playground/`, `teaching/` and `scripts/` (tooling, not needed to read the skill). Example scenes that embed or import third-party marks are not vendored: phones, bento, parts (import `assets/app-icons.ts`); google-docs, google-calendar, gmail, figma, kit-extras, brand-marks (import `kit/brands` marks of Google, Figma, Slack, Notion, Linear, Gmail and others); linear and excel (replicas of Linear and Microsoft Excel product marks and glyphs); hero-demo (icons copied from a real product toolbar); wikipedia `index.tsx` and `wiki.css` (draw the Wikipedia globe and wordmark). The CC0 photographs and `examples/wikipedia/PHOTOS.md` are kept. `kit/BrandMark` code is kept but its artwork is not, so brand names do not resolve. Also excluded, to keep the public repo clear of real-product replicas: finder, finder-glass, imessage, dynamic-island (Apple), notion, powerpoint, raycast, slack, spotify, telegram. Kept, but not all of it is the author's own artwork: `kit/phone.tsx` glyphs are adapted from Apple's iOS UI kit, `kit/cursors.tsx` has traced macOS cursors and `kit/parts/Icon.tsx` is SF Symbols-style. Check the upstream NOTICE.md before reusing these in a product.

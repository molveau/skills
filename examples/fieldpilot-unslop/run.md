# FieldPilot: a vibecoded dashboard, unslopped in one run

`before.html` was written by Claude without any skill. `after.html`, `story.html` and `video.mp4` were written and rendered by Claude Opus with the `anti-slop` skill in one headless run. The data in both files is invented.

## Before

- Model: `claude-sonnet-5-5`, Claude Code headless (`claude -p`), no skills installed.
- Cost: $0.29, 6 turns.
- Prompt, verbatim:

```text
Build a stunning dashboard for FieldPilot AI, an AI-powered field service platform for plumbing and HVAC companies. One self-contained HTML file, dashboard.html, all CSS inline in a <style> tag, no frameworks, no external JS. I want that futuristic AI startup look: deep purple to indigo gradient background with glowing blobs, glassmorphism cards with backdrop blur, neon glow on the active nav item and buttons, gradient text on the big numbers and the greeting, emojis in the nav and card titles, a "PRO" badge next to the logo and a "New ✨" badge on a nav item, uppercase tracked section labels, a pulsing "AI Live" pill, and a colorful bar chart where every bar has its own gradient. Include: a sidebar with the logo, a search, the main navigation and a "Teams" group, a welcome header for the dispatcher ("Welcome back, Sarah! 👋"), four KPI cards (jobs today, revenue this week, technicians on the road, overdue invoices) each with an emoji icon in a glowing circle, a weekly jobs chart, today's schedule, and a technicians list with their status. Make it pop!!
```

## After

- Model: `claude-opus-5-5`, Claude Code headless (`claude -p`), only this repo's skills installed in `.claude/skills/` (the run loaded `anti-slop`).
- Cost: $4.82, 84 turns, about 19 minutes, including the video render.
- Prompt, verbatim:

```text
dashboard.html is a vibecoded dashboard for FieldPilot and it looks AI-generated. Unslop it. Don't wait for my approval on the direction, just do it, and put the direction at the top of your report. Keep original.html untouched as the before. Then record the story video of the transformation with an Accessibility step: build unslop-story/story.html and render it to unslop-story.mp4.
```

- The direction the skill wrote is the comment at the top of `after.html`.
- `video.mp4` is `story.html` rendered at 3840 x 2160 and re-encoded to 1920 x 1080 to keep the repo small; `poster.jpg` is its last frame. After the run, the renderer's contrast tag was fixed (two colours tweening past each other showed a false 1:1 for a few frames), and the same, unchanged `story.html` was rendered again with `skills/anti-slop/scripts/story.mjs`.

## Hand edits

One, to the before, and none to anything the skill produced. Sonnet's file hid the four KPI figures: a later `background` shorthand on `.kpi-num.a` to `.kpi-num.d` reset `background-clip: text`, so each figure rendered as a solid gradient bar. Line 152 of `before.html` was changed from `.kpi-num {` to `.kpi-num[class] {` so the before shows its numbers, as its author intended. Files were renamed (`original.html` to `before.html`, `dashboard.html` to `after.html`).

## Reproduce

```sh
mkdir run && cd run && git init
npx skills add molveau/skills -s anti-slop      # or copy skills/ into .claude/skills/
cp ../examples/fieldpilot-unslop/before.html dashboard.html && cp dashboard.html original.html
claude -p "<the After prompt above>" --model opus
```

The video needs Playwright and ffmpeg. A new run will choose its own direction, so expect a different result.

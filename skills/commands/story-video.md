---
description: Build and render the anti-slop story video for a before and after pair, with the Accessibility step, as the anti-slop skill's Story video section describes.
argument-hint: "<before file> <after file>"
---

Make the story video for the before and after files the user named after the command. Claude Code adds what they typed at the end of this prompt, after `ARGUMENTS:`. If only the after is named, use its copy in `unslop-before/` (the `unslop` command keeps the before there). If there is no pair, ask for one and stop.

1. **Load the skill.** Use the `anti-slop` skill (`molveau-skills:anti-slop` in the plugin), read its "Story video" section, then the "Story video" section of unslop's method that it points to.
2. **Build `unslop-story/story.html`** exactly as those sections say: one file, the `.s1` to `.s5` CSS on top, `data-gap`, `data-radius`, `data-slop` and the swaps. Step 0 is the before as it was; the last step equals the after you ship. Do not polish the story beyond the shipped screen.
3. **Include the Accessibility step.** Give one step a name that contains Accessibility. Put `data-contrast` on two to four text elements whose contrast changes, and `data-target` on one or two controls. Choose elements that fail in the before; never mark one that still fails in the after. Write those elements' colours in sRGB, hex or `oklch()` so each tag shows a ratio rather than `?`.
4. **Caption.** Add `<meta name="story-caption" content="...">` stating only what is true of the run, such as the model and that the screen was not edited by hand. Leave the credit line the renderer draws on every frame; the unslop licence asks for it.
5. **Render** with the skill's renderer, from the project root: `node <anti-slop skill folder>/scripts/story.mjs unslop-story/story.html unslop-story.mp4`. Add `--wide` for 16:9 when asked. It needs Playwright with Chromium and ffmpeg in the project; if one is missing, show the renderer's message and stop rather than installing anything unasked.
6. **Watch the result** (or a few frames of it) and fix any step that does not match the shipped files.

Report: the video's path and format, the steps in order, and for each `data-contrast` and `data-target` element its value in the before and in the after.

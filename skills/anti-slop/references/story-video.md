# Story video

A square clip, about 10 seconds, where the screen unslops itself step by step with redlines. Make it only
when asked. Build the story file exactly as unslop's "Story video" section says
(`references/vendor/unslop/unslop.md`; its reference frames are upstream, not vendored:
https://github.com/heydamir/unslop/blob/main/skills/unslop/references/refs/story-dashboard-frames.webp; one `story.html`, `.s1` to `.s5` CSS on top, `data-gap`,
`data-radius`, `data-slop`, swaps), then render it with this skill's adapted renderer:

```bash
node <skill folder>/scripts/story.mjs unslop-story/story.html unslop-story.mp4   # --wide for 16:9, --play to watch
```

What it adds to unslop's renderer:

- **An Accessibility step.** A step whose name contains Accessibility shows live measurements. Put
  `data-contrast` on two to four text elements whose contrast changes; each shows its WCAG ratio, red
  under 4.5:1 (3:1 for large text), white with `AA` once it passes, grey `?` when a colour cannot be
  read (such as `lab()` or `color(display-p3 ...)`): use sRGB, hex or `oklch()` colours on those elements. Put `data-target` on one or two
  controls; each shows its size, red under 24 by 24 px. Choose elements that fail in the before; never
  mark an element that still fails in the after.
- **A caption**, `<meta name="story-caption" content="...">`, bottom left. State only what is true of
  the run, such as the model and that the screen was not edited by hand.
- **The credit** `molveau.ca/skills · unslop method by @heydamir` is drawn on every frame, as the CC BY 4.0
  licence of unslop asks. Do not remove it.

The story is a presentation of real files: step 0 is the before as it was, and the last step equals the
clean file you ship. Do not polish the story beyond the shipped screen.

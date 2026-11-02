# The 20 vibe-coded tells

An interface that shows these reads as "generated, not designed". Each one is a ban, with the
replacement to reach for. The last column says whether `scripts/detect-tells.mjs` catches it; the
rest are on you, so grep for them before shipping and keep a ratchet test green (see SKILL.md).

| # | Tell | Do instead | Script |
|---|---|---|---|
| 1 | Purple-to-blue (violet, fuchsia, indigo) gradient | One brand hue, solid. A gradient only when it encodes something | yes |
| 2 | Gradient text (`bg-clip-text` + gradient) | Solid color; emphasis by weight or size | yes |
| 3 | Emojis in headings, labels, toasts or copy | An icon from the project set, or nothing | yes |
| 4 | Inter (or Roboto, Geist, Space Grotesk) everywhere | The project's chosen face; pick one with character | no |
| 5 | Colored side-stripe border on cards and alerts (`border-l-4`, `border-left` wider than 1px) | A full 1px border, a tinted background, or a leading icon | yes |
| 6 | Glassmorphism as decoration (`backdrop-blur` on cards) | Opaque surface. Blur only where content truly scrolls beneath (sticky bar, overlay) | yes |
| 7 | Low-contrast dark mode | A relational surface scale, AA text, tested in dark | no |
| 8 | Three icon boxes in a row (icon tile, heading, text, times three) | A content-shaped layout with real data, not feature tiles | no |
| 9 | Pill or badge above the headline (eyebrow chip) | Let the heading stand; context goes in the body | no |
| 10 | Lucide icons by default (the shadcn default) | An icon set chosen per project, imported through ONE local module (for example `@/components/icons`) so the provider is swappable | yes |
| 11 | Untouched shadcn/ui | Components re-tokenised to the project: surfaces, radii, inputs, buttons | no |
| 12 | Fade-in on scroll (`whileInView`, reveal-on-scroll) | Content present on load; motion only as feedback | yes |
| 13 | Cursor-following beam, spotlight or glow | Nothing; hover states on the thing itself | no |
| 14 | Buttons that fade on hover (`hover:opacity-*`) | A real hover state: a background or ink token shift | yes |
| 15 | Inconsistent spacing | One spacing scale; siblings share a gap; compare with sibling pages | no |
| 16 | Em dashes everywhere in copy | Two sentences, a colon, parentheses or a middle dot. A lone `—` stays legal only as the empty-value placeholder in a cell | yes |
| 17 | Generic buzzword copy ("seamless", "unlock", "supercharge", "next-level", "elevate", "effortless"; "elevate" and "effortless" are a Molveau extension) | Plain words that name the user's task | yes |
| 18 | Serif italic accent words in headings | Weight or color for emphasis, never italic | no |
| 19 | Space Grotesk + Instrument Serif pairing | The project's type tokens | yes |
| 20 | Grain or noise texture over a gradient | Flat, tokenised surfaces | no |

## What the script does and does not do

- Line-based regexes on `.tsx .jsx .ts .js .mjs .cjs .css .html .md .mdx .json`. It is a ratchet,
  not a judge: a hit means "look here", and a clean run does not mean the design is good.
- Copy checks (3, 16, 17) ignore code comments, regex literals, Markdown code spans and fences. A
  lone `—` in a string or a table cell is accepted as the empty-value placeholder.
- Tell 6 looks for `sticky` or `fixed` on the same line (Tailwind) or in the same rule (CSS).
- Tell 10 allows imports inside a `components/icons` module.
- Tell 19 only fires when both faces appear in the scanned set.
- The JS masker treats a `/` as a regex literal when it follows `(,=:[!&|?{};+-*%<>~^`. In JSX
  text a `/` right after `>` (for example `<b>a</b> /x/ y`) can be misread as a regex and blank part
  of the line, so a tell on that line may be missed.
- Tell 17 in code only looks at string literals and JSX text on the line, so multi-line JSX text that
  starts with a code keyword is skipped.
- Test files (`*.test.*`, `*.spec.*`) are skipped unless you pass `--include-tests`, because a
  ratchet test legitimately lists the banned words.

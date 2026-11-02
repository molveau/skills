# Anti-slop playbook

## Do this first

1. **Read the project's truth**: `DESIGN.md`, `PRODUCT.md`, tokens, sibling screens; a real brand stays (§2).
2. **Size the job**: page or app screen; heavy, light or no slop (§1). Write the direction and wait (§2).
3. **Hold the values**: 4px grid, one accent under 5% of product chrome, no hue gradients, glow, emoji or em dash.
4. **Owners elsewhere**: product type, colour, spacing, UI motion `ui`; curves, scroll `motion`; forms, focus `ux`.
5. **Check**: `scripts/detect-tells.mjs <paths>`, the 20 tells, the §15 checklist; name every check that did not run.

One doctrine from every source in this skill; vendor files only for depth or worked examples (index: "When to
read what" in `SKILL.md`). Tags and credits are at the end.

## 1. Size the job and pick the run

- Judge the rendered screen, not only the code. Only a URL: snapshot it (`snapshot.mjs`, `--dark` or
  `--light`) and work on the copy. Only a screenshot: rebuild it as one static HTML file first. [unslop]
- A **page** is read and scrolled (landing, marketing, portfolio, event). An **app screen** is worked in
  (dashboard, admin, settings, inbox, wallet, builder, detail view) and follows §12. A product site that
  shows its app is a page whose interface fragments follow app rules inside. [taste]
- Audit first, one line per sign (signs list plus the 20 tells) with where it lives [unslop] [Molveau], then
  size it. **Heavy slop**: full direction and every pass. **Light slop**: fix only what the audit found,
  keep brand, palette, type, layout and visual, bigger ideas in the report. **No slop**: say so, offer two
  or three refinements with exact values, apply only on agreement. [unslop]
- A page from scratch or a deep redesign uses taste-skill's run (inventory, argument, dealt direction,
  idea, copy deck, build still, gate, look, move); a component or section skips the draw and matches its
  surroundings; a review stops at findings plus the three changes that would move it most. A redesign
  keeps stack, content, routes, forms and behaviour; check the dependency file before adding. [taste]

## 2. Direction: what only this product has

- Before editing, write five lines, show them with the audit and wait for the owner (unless told to just
  do it). **Product**: what it does for whom. **Character**: two or three concrete words (`calm, exact, a
  little warm`); never clean, modern, sleek, minimal or premium. **World**: the place or material it
  belongs to; it sets the neutral tint, accent and visual. **Moments**: one or two places that get rich
  colour and detail. **Signature**: one small detail only this product has, used consistently. [unslop]
- **One bright element** per screen carries the colour and the craft (a rendered object, a painted scene,
  a rich chart); the chrome around it stays quiet so it reads at once. [unslop]
- For a new page, inventory 8-12 things no competitor shares (name and meaning, street, numbers in the
  brief, constraint, materials, rituals, hours, printed artefacts; each also an image query), then write
  the idea: "On this page, [an inventory item] becomes [the device the direction calls for]". [taste]
- **Competitor test**: put the nearest competitor in the sentence, or swap the name on the finished
  screen. If it still fits, rewrite the headline's claim, change the main visual and the signature, and
  swap again until it no longer fits. [unslop] [taste]
- One live thing per page: something the visitor can do or that differs per visit, from real content,
  thumb-usable, with a no-script fallback, never blocking reading. One, not a playground. [taste]
- Keep a real brand (logo, colour, face that is not slop); a violet-to-blue gradient, sparkles or glow
  are slop even in the logo unless the user says they are the brand: keep them and report it. [unslop] [taste]
- Removing ornament is half the job: a page stripped of tells reads thin and loses blind tests to richer
  pages. Fill space with scale, full content, real pictures or flat fields, never new ornament. [unslop] [taste]

## 3. Order of work

- Nine passes, each across the whole screen: spacing, colour, icons, copy, type, layout, details,
  visuals, motion. Spacing first, copy before type and layout (headline length decides size and place),
  visuals and motion last. When nearly every line changes, plan all passes then write once. Render at
  most three times; start image generation once the direction is confirmed and keep working. [unslop]
- A page from scratch builds tokens, the hero at desktop and phone, sections, imagery, the live thing,
  fullness, the frame, states; motion after the gate. Needing animation to look finished is unfinished. [taste]
- Fixing an existing page, biggest effect for least risk: type, colour, frame, states, then stock
  components. Fixing after a critique: idea, hierarchy, composition, type, imagery, colour, detail,
  motion; a later item cannot rescue an earlier one. [taste]

## 4. Copy

- Write the page as plain text first: one claim per section with its proof; a section without a claim is
  cut. The argument's order replaces hero, logos, three features, testimonial, pricing, CTA. [taste]
- Headlines say what the product does for whom with facts already on the page. Shapes: the name, what it
  is, a claim a competitor could not sign, a short instruction, the place or moment. [unslop] [taste]
- Two lines or fewer at every width: about 32 characters (4-6 words) survives everywhere, about 42 if
  the phone size drops to the mid-30s. Chars per line = width / (size x k), k 0.40 condensed, 0.50 most
  faces, 0.58 wide or caps. Section headings 2-5 words. Author the break, `text-wrap: balance`. [taste]
- One supporting sentence (at most 22 words, 32-48px under the headline) says plainly what it is. A big
  statement or quote is a `<p>` or `<blockquote>`, about 25 words, at most 36px desktop, 24px phone. [taste]
- Avoid the mad-lib ("the AI-powered platform for..."), tricolons, "not just X, it's Y", "reimagined",
  "Welcome to", unasked questions, name-plus-colon, greeting headlines (title the page or period). [unslop] [taste]
- No hype (`seamless`, `unlock`, `supercharge`, `elevate`, `effortless`, `magic`, `empower`, `streamline`,
  `cutting-edge`, `all-in-one`, "AI-powered" on everything): plain words for the user's task. [unslop] [taste] [Molveau]
- No exclamation marks; headlines, labels, buttons and captions take no final period; sentence case. [unslop] [taste]
- No em dashes in copy (two sentences, a colon, parentheses or a middle dot); a lone dash only as an empty cell. [Molveau]
- Short labels (`Search`, not `Search anything...`). Buttons name the action in 1-3 words; the primary
  keeps one name everywhere; "Get started" and "Learn more" are stock; one arrow at most. [unslop] [taste]
  A change names its baseline (`+12% vs last month`). [unslop]
- No furniture text: time strips, "Est. 2024", coordinates, version stamps, "Scroll", decorative status
  dots, middle-dot strings, performative labels ("Field notes"), captions narrating the design, "Step 1".
  Use the number of items the content has, not three. [taste]
- Never invent proof (customers, quotes, logos, counts, ratings, benchmarks); unverifiable claims are
  asked about, then made quiet and specific or removed, and reported. Sample details for gaps (dish names,
  rates) are plausible, never `[X]`, lorem, Acme or John Doe, and listed for confirmation. [unslop] [taste]
- Micro-typography: curly quotes, real ellipsis, en dash for ranges, non-breaking space between number
  and unit, `text-wrap: pretty`, caps only for three words or fewer (tracking: `ui` §4), no justified
  text, no centred paragraph over three lines. [taste]

## 5. Spacing and rhythm

- One 4px grid for margins, paddings, gaps and fixed heights (2px only inside small controls), on the
  steps in `ui` §3; replace one-offs like `mt-[13px]`; grouping by space follows `ui` §3. [unslop] [taste]
- Equal things equal: one row height and gap per list, one padding per card row, one gutter both ways;
  compare with sibling pages. [unslop] [taste] [Molveau]
- Things line up: icons in one column, labels on one line, numbers right-aligned in one column; two or
  three text left edges per page, reused. [unslop] [taste]

## 6. Layout and the frame (pages)

- Equal outer margins at every width (16-32px, never under 16), nav on the same margins; large things
  run full width; cap only the text measure in `ch` and very wide screens near 1760-1920px; never draw the grid. [taste]
- Asymmetry inside the grid, never in the frame: when text takes one half, the other holds its picture,
  a column, a list or a figure. [unslop] [taste]
- Empty space is placed: a void is a rest only when something closes it; nothing taller than half a
  screen holds nothing; one rest per page; an empty-looking section enlarges its main element or goes. [taste]
- Hero: one primary and at most one secondary action (log in is a text link); long headlines align left.
  A centred stack over a screenshot is the weak-site layout; prefer a scene (full-bleed image, headline on
  its calm part), an asymmetric split with the visual at half the width or more, or text over a large
  product view. [unslop] [taste]
- The first screen is one composition: an `h1` saying what this is (name with what it does, event with
  date and place), readable on first paint, a real button, no dead band. [unslop] [taste]
- Sections: each opens with a heading that names it; neighbours never share a layout; the idea reaches
  pricing, FAQ and footer; dense and empty sections alternate; exactly one section breaks the grid or the
  field on purpose (a full-bleed image, an inverted field), never two. [taste]
- Navigation: wordmark, 3-5 plain links, one action; no bar chrome or floating pill; on the phone the
  links go in a full-screen sheet. A fixed nav never covers content. [unslop] [taste]
- Footer is a designed close (the name at full width, the hero inverted, one contact fact as a headline,
  one quiet line), not a sitemap. [taste]
- The phone is its own composition: re-authored breaks, portrait crops, margins 16-20, body 16-18,
  targets per `ux` §14, visual after the actions; a dense preview loses rows instead of zooming, nothing
  under 12px. [unslop] [taste]

## 7. Colour

- One neutral ramp tinted slightly toward the brand hue or the world (graphite, warm or ink), pure grey
  only when the brand has no hue, for ground, surfaces, borders and text. Tokens for every colour; a raw
  hex in a component starts a second palette (ramp structure: `ui` §5). Apps keep chrome neutral and let
  accent, charts and moments carry the world. [unslop] [taste]
- Three text roles: primary, secondary, muted (meta only, still passing `ui` §5). Running text on pages
  is full ink at 16px or more; a page in soft grey reads unfinished. [unslop] [taste]
- **One accent under 5%** of an app screen or product chrome: the primary action, selection, one key
  figure; not headings, icons or borders. A real brand colour becomes the accent and leaves the
  surfaces; otherwise take it from the world (amber or coral warm, cobalt or teal cool, moss natural).
  A persuade page may give a whole field to a committed colour (conflict 15). [unslop] [taste]
- Page proportions: ground 70-90%, ink, accent under 5%; a section may switch the whole field edge to edge,
  its own ink, neighbours differing in lightness. Contrast: `ui` §5, checked before lowering opacity. [unslop] [taste]
- Dark: a deep slightly tinted ground (not navy or slate), soft light ink not `#fff` on `#000`,
  `color-scheme: dark`, depth from lighter steps not glows (the rest: `ui` §6). [unslop] [taste] [Molveau]
- Semantic colours mean something and are toned down (positive `#4cc38a` dark, `#16a34a` light;
  negative `#e5484d` dark, `#dc2626` light; green text on white needs about `#247b50`). [unslop] [taste]
- Banned in chrome: hue-to-hue gradients (violet, fuchsia, indigo first), gradient text, coloured glows
  and shadows, washes and blobs, neon borders, grain over a gradient, cream with terracotta, violet or
  indigo accents unless the brand owns them. Warmth: a stone ground under about 15% saturation, a deep
  green, brown or oxblood ink, photographs, or a flat warm field. [unslop] [taste] [Molveau]
- Allowed gradients: a tone shift inside one neutral (an active row `#2b2b2b` to `#1f1f1f`), a neutral
  scrim under text on a photo, a 14% fill under one line chart. [unslop] [taste]

## 8. Type (tells and marketing display; product type is `ui` §4)

- Choose the face for the character; keep a real brand's. A default nobody chose (Inter, Roboto, Geist,
  Space Grotesk everywhere) is swapped. One family is normal, two the limit; a display serif sets whole
  headlines, never labels or one accent word; never tell 19's pairing. [unslop] [taste] [Molveau]
- Pages: few sizes, far apart, five at most, display at least 4x body (study median 4.3); weights 400
  and 500, 600 for rare emphasis, hierarchy from size and colour, no italic for emphasis. [unslop] [taste]
- **Marketing display**: leading 0.9-1.05; tracking -0.02em from 40px, -0.03em from 56px, to -0.05em
  from 64px for faces drawn tight (product floor: `ui` §4); a display line set in caps 0 to +0.03em;
  pull round first letters left about 0.05em; no shadow, stroke or gradient. [unslop] [taste]
- Text on pages: 16-20px, leading 1.45-1.6, nothing under 13px, tracking 0 under 16px and never
  negative; measure and product sizes: `ui` §4. [unslop] [taste]
- Sentence case: `NAVIGATION` becomes `Navigation`; no tiny tracked uppercase labels on pages (an app's
  caps labels: `ui` §4). [unslop] [taste]
- One number format per screen (not `$48,210` beside `$124,860.40`); no weight change on hover;
  screenshots in a fallback face prove nothing; tabular figures and loading: `ui` §4. [unslop] [taste]
- Polishing a hero: headline 56-72 desktop, 36-44 mobile, leading 1.0-1.05; subhead 18-20, at most
  36rem; page title 28-36; card figures 28-32. A page from scratch takes its display size from the dealt
  blueprint. [unslop] [taste]

## 9. Icons (tells; sizes and stroke are `ui` §8)

- Emoji used as icon, bullet, status or decoration goes: a line icon or nothing. [unslop] [taste] [Molveau]
- One set, one size, one stroke, the colour of their text role, a fixed-width box, 8-10px to the label.
  Never their own colours, never in tinted squares or circles. [unslop] [taste]
- The set is chosen per project and imported through ONE local module (for example `@/components/icons`)
  so it is swappable; Lucide is not the default because shadcn ships it. [Molveau]
- Drop icons that add nothing; a category that needs colour gets a functional status dot (unlike §4's
  decorative ones); the AI sparkle goes. [unslop]

## 10. Components and details

- **Radius**: one family per product (conflict 6), nested by `ui` §7's math (never under 4); not
  everything a pill. [unslop] [taste]
- **Buttons**: flat, one fill, named for the action. Hero 44-48 tall, nav 32-36, 16-20 side padding.
  Primary on light: the primary text colour or the accent; on dark: an off-white or the accent;
  secondary: raised surface plus hairline. On dark, `inset 0 1px 0 rgba(255,255,255,0.12)` adds depth
  without glow. [unslop] [taste]
- **Hover** on buttons and links is a background or ink token shift, never `hover:opacity-*` (tell 14),
  behind `@media (hover: hover) and (pointer: fine)`; focus rings: `ux` §12. [unslop] [taste] [Molveau]
- Counts and meta are quiet text, shortcuts small keycaps; `PRO`, `New`, `Beta` badges go or become
  quiet text; no eyebrow chip above a headline. [unslop] [taste] [Molveau]
- Active state: a small surface step with a hairline highlight. The logo is the name in the main family
  plus a flat mark; a slop logo (emoji, sparkle tile, glossy orb, gradient wordmark) is redrawn flat in
  one colour; never rename the product. [unslop]
- **Depth**: a resting surface gets one edge, a hairline border or a `0 0 0 1px` ring, never a shadow
  too; dark separates by steps; shadows are small, neutral and only on what floats (menus, dialogs,
  dragged items: `0 8px 24px rgba(0,0,0,0.06)`). Hairline values: conflict 1. [unslop] [taste]
- **Glass** only where content truly scrolls beneath (sticky bar, overlay); never on cards or a floating
  pill nav (conflict 17). [Molveau]
- No coloured side-stripe (`border-l-4`, a left border over 1px): a full 1px border, a tint or a leading
  icon. shadcn/ui is re-tokenised (surfaces, radii, inputs, buttons), never shipped untouched. [Molveau]
- **Forms** behave per `ux` §8; the look: label above at 14px/500 with an 8-10px gap, inputs 38-40px,
  one control height per context. [taste]
- **No backend, no fake**: without a checkout or form backend the primary action opens a `mailto:` with a
  written subject and body, or a shop points at `#checkout` and the report says to wire it before
  launch. Never fake a payment form. [taste]

## 11. Data: KPIs, charts, tables

- KPIs are type: label, figure, change with its window. No icon circle, sparkline, mini bars or tallies;
  one container split by 1px dividers beats a tile each; columns match the item count; values 24-30,
  nothing at 48. A card may hold a real-looking object when it is what the number counts. The
  hero-metric template (big number, small label, stats, accent) is refused in `ui` §2 too. [unslop] [taste]
- The answer figure is 30-36px and at least 1.3x its siblings; nothing else is larger. [taste]
- Deltas 10-15px, never above the label. Colour means good or bad, not up or down (rising errors are
  negative); zero or undefined is grey; from zero write "+4 (new)". [unslop] [taste]
- One main chart clearly biggest (two thirds of the width or more, 280-360 tall when polishing); others
  smaller and of another kind (ranked list, short table); vary card widths. [unslop]
- Form for the question: trend line, comparison bars, share as one stacked bar or a thin ring of five
  parts at most, goal as a progress bar labelled at both ends; a few numbers need no chart. [unslop] [taste]
- One hue per chart, on the thing that matters; the rest in neutral steps; one subject keeps one hue;
  four hues per screen at most; no rainbow, glowing or pill bars. [unslop] [taste]
- Chrome: 3-5 faint horizontal gridlines, no y-axis line, round ticks topping the maximum, axis text no
  louder than the data, 4-8 flat x labels, no legend for one series, 2px straight segments, square bars
  (4px top radius at most), a 1px marker and 12px label on the event that matters, dashed forecasts. [unslop] [taste]
- Tables: no zebra or header band; 12px grey sentence-case headers; rows 36-53 (56-92 with media); numbers
  right-aligned, tabular, fixed decimals (money 2, percent 1-2, counts 0), a sign on every change; missing
  is a grey dash, a real zero is printed; identity column a third to a half of the width; one status mark
  per row (pale tint, dark text of its hue); overviews cap rows with "View all", no pagination. [taste]

## 12. App screens

- Inventory objects and fields with units, realistic magnitudes (new accounts stay small), who opens
  the screen and how often, the most frequent job, the product's own things. Render from a data file;
  totals computed from the rows as displayed and asserted; a fact shown twice is one variable. [taste]
- Name the screen's one question and one finding. The biggest block answers the question; the finding
  sits under the title beside the action it drives; the main job is one click away; every block the
  brief names shows its header and first rows at 1440x900 (lists capped at 4-6). [taste]
- Give it a face: mark and name at the top of the shell, scope as switcher or breadcrumb, one element
  only this product has, the hue on the main data element, words of the trade in labels. A tidy kit
  (stock face, `#f8f8f8` ground, white 12px cards, no data hue) is the next tell. [taste]
- Shell: labelled sidebar 224-280 on the page ground, never dark or saturated on a light canvas; rows
  32-36 with 2-4 between; section labels 24 above, 8 below, grey sentence case; active item a neutral pill.
  Top bar 44-64 only if it holds search, switcher or object name. Content fluid, 24-32 padding, capped
  about 1440-1600, never a narrow centred column; one h1, a noun at 18-32px. [unslop] [taste]
- Grid arithmetic closes and is written down; cards in a row share a bottom edge; a card stretches only
  with content to fill; narrow blocks pair up instead of spanning the canvas. [taste]
- **Relaxed here**: 1px borders and dividers at about 1.1-1.3:1 (input and control boundaries still 3:1,
  `ui` §5), row rules 3-7% darker, dashes only in chart grids and empty slots, small grey labels (one
  tracked uppercase label at most), equal peer cards without icons, mono for IDs and code, pills inside
  rows, shadows on what floats, a second face with one job. Still banned: gradients, glow, glass, icon
  chips, sparklines, rainbow charts, emoji, placeholder people, vanity totals, accent on chrome, zebra
  tables, landing-page titles. [taste]
- **States** (words `ux` §6, skeleton `ui` §9): empty keeps frame and header plus one sentence; first
  run puts the first action where data will be; loading bars sit at real size, flat, no shimmer; errors
  stay inside the failed block (what, when last good, Retry); stale data shows a freshness stamp. [taste]
- **Density** moves row pitch, padding and type size together: compact panels about 16 padding, cards
  20-24, page edges 24-32; rows 32 compact, 36 default, 40-44 touch; sparse padding 20-24 with rows
  56-92, medium rows 44-56, dense a 13px body and 28px rows. [unslop] [taste]
- Phone: sidebar becomes a 48px top bar with a menu sheet or a 4-5 item bottom bar; tables two-line rows
  under about 640px; KPIs a 2-column grid; one control row above a chart; no sideways scroll. [taste]
- **Heavy slop is not done when it is clean.** The main data element is rebuilt as the moment (the
  chart redrawn for what it must say, or the product's own object), so the after has one thing the
  before lacked. A clean copy of the old layout is the light-slop result. [unslop] [Molveau]
- No entrances on app screens; motion is feedback, except `motion` §1's rare tier (first run, success). [taste] [Molveau]

## 13. Imagery and visuals

- Filler goes: blobs, orbs, nebulas, chrome liquid, cubes, glowing grids, holographic brains, robots,
  rockets, isometric clip art, people at laptops, grey-bar dashboards as the visual, labelled
  placeholders (a demo's edge placeholder bars are `motion` §12's). One visual where it helps, not one
  per section. [unslop] [taste]
- Source order: the project's own; generated; real pictures of the subject's world from open collections
  (`assets.mjs`, commercial licences, credited); drawn in code; generic photos only where generic is
  honest; type and colour alone. A found picture is never presented as the client's own. [taste]
- Dashboards rarely need images: their moments are a chart drawn with care, figures set well, a live
  status; a physical thing is built in code; generate only for empty states, onboarding, marketing. [unslop]
- A landing hero shows something true: a scene from the world with calm space for text, or a coded
  preview of what the page promises with plausible data and one moment inside. Software shows a real
  fragment at true size marked `data-ui`, never in a laptop or browser frame. [unslop] [taste]
- A page from scratch carries at least four real pictures, usually six to twelve (SVG drawings do not
  count), and one moving picture per screen at most. [taste]
- Before generating, write the scene in one sentence. Prompt: subject, setting, light and palette (name
  the page colour), one style, room for text (16:9 or wider, lower fifth calm), no text, logos, UI or
  watermark, twice display size. Ask before a paid run, run once, edit rather than reroll; no tool: an
  empty slot of exact size and radius, prompt in the report. [unslop]
- Styles that work, one per page: painted background art, a cinematic single object, soft stylised 3D,
  a product object render, light and optics, engraving only when the whole brand lives in it. Grain in
  prompts bakes a checker pattern; busy collages and purple glossy abstractions fail. [unslop]
- Placement: one dominant image over six small; two ratios for 75% of pictures; one radius for all;
  full-bleed or off one edge; no frames, shadows or device mock-ups (a demo's cropped kit phone: `motion`
  §12); edges matched or masked. WebP or AVIF at twice display size (2400 max), fixed dimensions,
  `fetchpriority="high"` on the hero, a real `alt`. [unslop] [taste]
- On a picture: display text, one line and one action, over a calm area or a 40-55% neutral scrim;
  contrast checked where the text sits, across the whole loop for video. [taste]
- Code treatments (glyphs, halftone, dither, duotone) fit the character or stay out, main visual only:
  read pixels once, no `getImageData` in the loop, 8-12 steps per second, pause off screen, DPR cap 2. [unslop]

## 14. Motion (tells; values are `ui` §10, curves `motion` §5)

- Remove meaningless loops (`animate-pulse`, `animate-ping` on things not live, shimmer, breathing
  glow, floating elements, parallax), `transition-all`, bounce and overshoot, `hover:scale` on cards,
  cursor glows, custom cursors, preloaders, gates, scroll hijacking, scramble text. [unslop] [taste] [Molveau]
- Content is present on load; no reveal-on-scroll by default (the one rule: `motion` §9). [Molveau]
- Keep motion that explains: a colour or surface change on hover, a press, a menu that grows from its
  trigger (never `scale(0)`), a changed number that tweens; no `ease-in` on anything awaited; named
  properties (`transition-colors`), never width, height, top, left or margins (`motion` §4). [unslop] [taste]
- Hidden states live inside `prefers-reduced-motion: no-preference` and an `html.js` gate, so the reduced
  or no-script page is the finished page (detail: `motion` §10). [taste]

## 15. Checking and reporting

- Run the detector (`scripts/detect-tells.mjs`) under a ratchet test that only lets counts fall, and
  taste's `lint.mjs` when building with its run. A hit means "look here"; a clean run proves only that
  nothing banned was found. [Molveau] [taste]
- **A redesign proves itself**: record the before, compare before and after at every width, click every
  link, form and menu that worked before, report both measurements side by side (under mockup-first the
  owner compares on the mockup: conflict 14). [taste]
- Before done: direction followed; 4px scale; aligned columns; one ramp, three text roles, one accent
  with contrast; no gradients, glows or blobs; no emoji; one icon set; weights 400-600, sentence case,
  no italic; no exclamation, trailing periods, greetings or unverified claims; tabular figures in one
  format; nested radii add up; a real hero visual; first screen composed; no looping motion; the
  template test. [unslop] [taste]
- Judging a render: taste's fourteen passes (glance, squint, cover the logo, edges, frame, type, colour,
  images, sameness, phone, fullness, substance, collisions, competitor and live thing) and weighted score
  (design 40, usability 30, creativity 20, content 10); fix the top three, three rounds, flag under 7.5. [taste]
- Report the direction, a few lines per pass, claims removed or unverifiable, sample details to
  confirm, image prompts, found pictures with licence and credit place, and checks that did not run.
  Never claim a check you did not run. [unslop] [taste]
- A story video only on request: `scripts/story.mjs` (unslop's, adapted; `SKILL.md` "Story video"). It
  morphs the real before into the shipped after, nothing the clean file lacks. [unslop] [Molveau]

## 16. Do not

- Rename the product, invent features, claims or data, or change what it is or its section order. [unslop] [taste]
- Replace decoration with the next trend: glass, grain, neon, bento, broadsheet hairlines, mono labels,
  01/02/03 numbering. [unslop] [taste] [Molveau]
- Give every product the same look; ship three icon tiles in a row or a centred stack under a pill. [unslop] [taste] [Molveau]

## Where sources disagree

1. **Hairlines.** unslop draws 6-10% hairlines; taste bans thin rules on pages. Choice: page sections part
   by space and tone; apps, tables and `data-ui` keep 1px dividers at about 1.1-1.3:1; input borders and
   control or focus boundaries meet 3:1 (WCAG 1.4.11, `ui` §5). Why: a working screen needs edges.
2. **Monospace.** unslop likes mono for figures and meta; taste bans it outside code. Choice: no mono
   labels on pages; in apps mono for IDs and code, else tabular figures in the text face. Why: mono
   micro-labels are the first costume generators copy.
3. **Entrance motion.** taste's page run demands a motion layer (eight or more movers, section
   entrances); unslop allows one entrance; Molveau bans reveal-on-scroll. Choice: `motion` §9's one rule;
   taste's layer only on a marketing page built with its full run when the owner asks. Why: failed
   reveals leave blank bands.
4. **Icon set.** unslop falls back to Lucide; Molveau bans it by default. Choice: the project's set or one
   chosen for the product, behind one module. Why: the default set is the shadcn look.
5. **Default faces.** unslop suggests Geist, Inter or Space Grotesk by character; Molveau and taste call
   them the kit look. Choice: only when the brand chose them; never tell 19's pairing. System fonts on
   Operate screens: `ui` conflict 16.
6. **Radius.** unslop's ladder (keycap 4-6, row or input 8-10, card 12-16, panel 14-20); taste finds
   9-16px the weak-site default (app radii 4-8 or 16-24). Choice: one family per product (tight 0-8 or
   soft 16-24 with pills) with nested math; unslop's ladder when polishing a screen built on it.
7. **Shadows.** unslop allows small neutral shadows; taste bans shadows at rest. Choice: one edge at rest
   (border or `0 0 0 1px` ring), layered shadows only on what floats, as in `ui` conflict 9. Why: resting
   shadows are twice as common on weak sites.
8. **Weights.** unslop caps at 600; taste lets 700 do one job on app screens. Choice: pages 400-500 with
   600 for emphasis; app titles 600, 700 for one job per app screen at most, inside `ui` §4's roles.
9. **Code treatments.** unslop offers duotone and glyphs; taste rejects duotone as a filter. Choice: only
   when the whole direction lives in it, on the main visual.
10. **Grain.** unslop allows texture in code; taste and Molveau ban grain. Choice: none, it is the wave.
11. **Section gaps.** unslop 80-128 on landings; taste 120-240. Choice: keep an existing rhythm in that
    range when polishing; 120-240 for a page from scratch.
12. **Asking first.** unslop waits for the owner on the direction; taste decides a vague brief. Choice:
    stop for a direction or redesign; decide small gaps and state them.
13. **Em dashes.** taste tolerates one or two a page; Molveau none in copy. Choice: none.
14. **Visual checks.** taste loops on screenshots at 1440, 768 and 390; unslop renders up to three times.
    Choice: `ui` conflict 14 decides for all four skills.
15. **Accent share.** unslop and taste: one accent under 5%; Impeccable (`ui` §2): Committed 30-60% and
    Drenched. Choice: under 5% on product and app chrome; Committed and Drenched only as whole fields on
    persuade surfaces; neutrals tint toward the brand hue, pure grey when it has none.
16. **Display type.** unslop and taste reach -0.05em and leading 0.85-1.08; `ui` holds -0.04em and 1.1.
    Choice: marketing display from 64px may reach -0.05em for tight faces, leading 0.9-1.05; product UI
    follows `ui` §4 (small text 12px, 11px only for dense app metadata).
17. **Glass.** taste bans glass and backdrop-blur panels entirely; Molveau allows them only where content
    scrolls beneath. Choice: Molveau's (§10), never as decoration (tell 6).
18. **Dark-mode weight.** taste drops a weight step for light text on dark; Impeccable (in `ui`) adds one.
    Choice: `ui` §4: body keeps its weight, under 400 steps up one, never lighter on dark.
19. **Motion values.** unslop's tokens: ease `(0.22, 1, 0.36, 1)`, press 0.97-0.98, hover 120-180ms,
    sheets 300-500ms. Choice: `ui` §10 and `motion` §5 (ease `(0.23, 1, 0.32, 1)`, press 0.96, feedback
    100-150ms, overlays to 300ms); a near twin already in a project is not a finding.
20. **Device frames and placeholder bars.** This skill bans frames, mock-ups and grey-bar visuals;
    stageshow composes the kit's phone and placeholder bars. Choice: `motion` §12, scoped to demos.

## Sources and tags

- `[unslop]` unslop by Damir Sokolovsky, https://github.com/heydamir/unslop, CC BY 4.0
  (https://creativecommons.org/licenses/by/4.0/). **Adapted**: condensed, reworded, merged with the
  sources below, some values reconciled ("Where sources disagree"). Original in `references/vendor/unslop/`.
- `[taste]` taste-skill by Leonxlnx, https://github.com/Leonxlnx/taste-skill, MIT, in `references/vendor/taste/`.
- `[Molveau]` the 20 tells (`references/tells.md`), the detector and this skill's house choices, MIT.

Pointed to, not owned: product type, colour, contrast, spacing scale, radius math, icon stroke, UI motion
(`ui`); curves, scroll, reduced motion (`motion`); forms, states, focus, targets, WCAG (`ux`).

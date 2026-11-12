---
name: writing
description: Removes the AI-written sound from prose, in English and French (README, docs, copy, email, UI strings). Use when a text sounds generated, generic or AI-written, or on "relis ce texte" or "ça sonne IA". Includes a checker for 11 tells and a rewrite method.
---

# Writing

AI-written prose fails in the same predictable ways: it clears its throat before the point, praises
everything, hedges, lists with stock connectors and closes with a summary nobody asked for. This skill
lists eleven of those tells, in English and in French, with a script that finds them and a method to
rewrite them.

## What it covers

- Prose in Markdown, MDX, plain text and JSON string values: READMEs, docs, landing copy, articles,
  emails, UI strings, release notes.
- English and French. The script detects the language, or you pass `--lang`.
- It does not cover the look of a UI (use `anti-slop`) or French spacing, guillemets and apostrophes
  (use `french-typography`). Run those on the same text after the rewrite.

## The tells

| Rule id | Family | English | French | Write instead |
|---|---|---|---|---|
| `transition-opener` | Transition words | "It is important to note that" | « Il est important de noter que » | Say the point. |
| `scene-setting` | Intro excess | "In today's fast-paced world" | « Dans un monde en constante évolution » | Start with the reader's problem or the fact. |
| `hedging` | Iffy assertions | "Research suggests", "arguably" | « Il semblerait que », « selon certaines études » | Commit, or cite the source. |
| `inflated` | Extra verbiage | "Plays a pivotal role", "game-changer" | « Un rôle clé », « incontournable » | A number or a fact instead of the adjective. |
| `listing-words` | Listing language | "Firstly… Furthermore… Moreover" | « En premier lieu… En outre… Par ailleurs » | A list, or sentences that follow from each other. |
| `cliche-conclusion` | Clichéd conclusions | "In conclusion", "at the end of the day" | « En conclusion », « au final » | Stop when the point is made, or end on the next step. |
| `buzzword-verb` | Buzzword verbing | "Leverage", "unlock", "streamline" | « Booster », « impacter », « dynamiser » | The plain verb: use, run, help, cut. |
| `em-dash` | Em dash madness | The em dash (U+2014) in prose | The em dash in prose (a dialogue dash at the start of a line is fine) | A colon, a comma, parentheses or two sentences. |
| `not-x-but-y` | House | "It's not X, it's Y" | « Ce n’est pas X, c’est Y » | State Y. |
| `whether-you` | House | "Whether you're a X or a Y" | « Que vous soyez X ou Y » | Name who it is for. |
| `chat-filler` | House | "I hope this helps", "feel free to" | « N’hésitez pas à », « j’espère que cela vous aide » | Cut it. |

Matching ignores case, needs whole words, and accepts both apostrophes and the French spaces. In
`listing-words`, "first and foremost" and "en premier lieu" always count; the other connectors count only
at the start of a sentence, and only when the text has three or more of them. Code spans and fenced code
are skipped.

## Order of work

1. **Check.** Run the script on the text (or call the `check_writing` MCP tool with the text).
2. **Judge each finding.** The script flags phrases to look at, not verdicts. Literal uses are expected
   collisions: "unlock the door", "harness" as a noun, "leverage ratio" in finance, a quoted sentence.
   The agent or a person decides; keep the phrase when it is meant literally.
3. **Rewrite by family**, starting with openers and conclusions: delete the throat-clearing first, because
   the point usually sits in the next sentence. Then swap adjectives for facts, hedges for a commitment or a
   source, buzzword verbs for plain ones.
4. **Read it aloud.** If you would not say it to a colleague, change it. Check that no sentence now
   starts with the same word three times, and that the cuts left no hole.
5. **Run the check again.** Zero findings is not proof the text is good; it only means the mechanical
   tells are gone. Then run `french-typography` on French text.

Read `references/playbook.md` first, starting with its "Do this first" block, then the section for the
family you are fixing: each has a before and after in English and in French.

## Script

```sh
node <skill folder>/scripts/check-writing.mjs [--lang en|fr|auto] [--json] <files-or-dirs...>
```

Reads `.md`, `.mdx`, `.txt` and `.json` files, folders included (it skips `node_modules`, `.git` and build
folders). Each finding prints as `path:line:col rule "match"`, followed by a count. Exit 0 when clean,
1 when there are findings, 2 on a usage error. There is no `--fix`: rewriting is a judgement call.

The same check is available as the `check_writing` tool of the `@molveau/skills` MCP server, which takes
the text directly.

## Credits and licenses

- The eight families come from the infographic "Can You Identify AI Authors?" by YourNerdyBestFriend.com
  (March 2025). Only the family names are taken; no text or image is copied.
- The English and French phrase lists, the three house tells, the rewrite method and
  `scripts/check-writing.mjs` are Molveau's own (MIT).

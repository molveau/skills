---
name: get-started
description: How to use the six Molveau checks on UI code, colours and copy. Use when the user pastes a component, a stylesheet, animation code, two colours, French text or prose that may sound AI-written and asks whether it is right, or asks for design guidance from a Molveau playbook.
---

# Molveau design checks

Six read-only tools. Each one works on what the user pastes into the conversation: none of them can open
files, folders or web pages, so ask for the code or the text when it is not in the message.

| The user wants | Tool | Pass |
| --- | --- | --- |
| To know if UI code looks generated | `detect_tells` | `code`, and `filename` with the right extension (`Hero.tsx`, `styles.css`, `index.html`) |
| To know if a text colour is readable on a background | `check_contrast` | `foreground`, `background`, and `fontSizePx` and `bold` when the size is known |
| French copy checked or fixed | `fr_typo` | `text`, and `fix: true` when they want the corrected text |
| Animation code reviewed | `check_motion` | `code` and `filename` |
| Prose (English or French) checked for AI-sounding writing | `check_writing` | `text`, and `lang` (`auto`, `en` or `fr`) when the language is known |
| Design guidance | `get_playbook` | `skill` (such as `ui`, `ux`, `motion`, `saas`, `vitrine`, `french-typography`, `loi-25-website`), and `query` for one topic |

## Answering

- Give each finding with its line and say in one sentence why it matters and what to do instead.
- For contrast, give the ratio and the verdict for the level that applies (AA 4.5:1 for body text, 3:1 for
  large text). When it fails, offer a darker or lighter shade and check it with `check_contrast` again.
- For prose, give each finding with its line and column and a plainer rewrite of that phrase. Do not rewrite
  text that has no findings.
- For French text, give the corrected text when the user asked for a fix. The no-break spaces are invisible:
  say which rules changed rather than pointing at characters.
- An empty result is an answer too: say the code passed these checks, not that it is perfect.
- For a design question, answer from the returned playbook sections, in the user's words, without quoting them
  at length.

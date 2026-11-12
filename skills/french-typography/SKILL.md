---
name: french-typography
description: Fixes and checks French (Québec and France) typography in UI copy, JSON message files and Markdown, including non-breaking spaces before colons, semicolons, exclamation and question marks, guillemets, thousands and currency spacing, curly apostrophes and the no-em-dash rule. Use when writing or reviewing French copy, translating a site, editing fr.json or i18n messages, or adding a CI guard test for French typography in next-intl or i18next. Includes a zero-dependency check and fix script.
---

# French typography

Spacing in French is part of the text, not decoration. A price that wraps as `1` / `900 $`, or a `?` alone at the start of a line, reads as a mistake. This skill gives the exact code points, the Québec and France conventions, and a script that checks or fixes files.

## The rules

| Case | Rule | Code point |
|---|---|---|
| Before `:` | non-breaking space | U+00A0 |
| Before `;` `!` `?` | non-breaking space (house default, see below) | U+00A0 |
| Inside French quotes | `«`, nbsp, text, nbsp, `»` | U+00A0 |
| Digit groups | narrow no-break space between groups of three | U+202F |
| Number and `$` | non-breaking space (`1 900 $`) | U+00A0 |
| Word before a price | non-breaking space, so the amount never starts a line | U+00A0 |
| Percent | non-breaking space between number and `%` (`3,5 %`); an extension, Molveau's original `frTypo` has no percent rule | U+00A0 |
| Apostrophe | curly `’`, never `'`; `--fix` converts letter-apostrophe-letter only | U+2019 |
| Em dash | rewrite as a colon, comma or full stop (rule wording: the `writing` skill) | U+2014 |

Left alone on purpose: URLs, times (`10:30`), ICU placeholders (`{count}`), phone numbers (`514 555-1234`, `1-514 555-1234`) and numbers that are not groups of three (`1 2345`, or a lone digit such as `2 pages`).

The fixer only normalizes spaces that already exist. It never inserts a missing one: `Prix: 5` needs a human, and `1900 $` only gets its non-breaking space before `$`, not digit grouping.

## Québec versus France before `; ! ?`

The two conventions differ, and sources should be read, not guessed.

- **OQLF (Québec), Banque de dépannage linguistique**, table of spacing: before `;` `!` `?` the entry is "Pas d’espace ou une espace fine", and the page says the Office omits it because, in its words, "certains logiciels ne permettent pas d’insérer l’espace fine (espace insécable réduite) de façon conviviale". Before `:` the entry is a non-breaking space. French quotes take a non-breaking space inside. Page: https://vitrinelinguistique.oqlf.gouv.qc.ca/22039/la-typographie/espacement/espacement-avant-et-apres-les-signes-de-ponctuation-et-les-symboles
- **Imprimerie nationale (France)**, *Lexique des règles typographiques*: a thin non-breaking space before `;` `!` `?`, and a full non-breaking space before `:`. The Lexique itself was not available to read when this was written; the rule is quoted from a Unicode CLDR list post that reports it ("adopts an "espace fine insécable" before ; ! and ?"): https://corp.unicode.org/pipermail/cldr-users/2014-December/000192.html . Check the book before citing it to a client.

So Québec allows either no space or a thin space before `; ! ?`, and France prescribes a thin non-breaking space. Neither prescribes a full-width space.

**House default: a full non-breaking space (U+00A0) before `: ; ! ?`.** Reasons: it renders the same in every font and on every platform (the thin space U+202F is missing or ugly in some fonts), it keeps the mark on the line of its word, and one rule is easy to test. If a client or a style guide asks for the strict Québec form (no space) or the strict France form (U+202F), change the rule in the project and in `scripts/fr-typo.mjs`; do not mix forms in one site.

## The script

```
node <skill folder>/scripts/fr-typo.mjs --check [--json] <files-or-dirs...>
node <skill folder>/scripts/fr-typo.mjs --fix <files-or-dirs...>
```

- Reads `.json`, `.md` and `.mdx`. In JSON it only touches string values (never keys, formatting is kept). In Markdown it only touches prose: fenced code, indented code and inline code spans are skipped.
- Rules reported: `high-punct`, `thousands`, `currency`, `guillemets`, `em-dash`, `straight-apostrophe`.
- `--fix` repairs spacing, percent and apostrophes (straight to `’` between two letters only; never in code, URLs, or next to ICU braces and quoting such as `'{'`). Em dashes need a manual edit, so they keep the exit code at 1.
- Exit 0 clean (or fixed), 1 findings, 2 usage error. Skips `node_modules .git .next dist build .open-next coverage`.
- Run it on French files only. English copy follows the em dash rule of the `writing` skill.

## Add a guard test (next-intl, i18next)

Make the rule a test, so a regression fails CI instead of reaching production.

1. Pick the namespaces that have been cleaned (a list, so legacy keys do not block the first commit) and grow the list over time.
2. Walk the French messages tree, collect every string leaf with its dotted path, and fail when `s !== frTypo(s)` or when the string contains `—`, in both locales.
3. Copy `frTypo` and `checkFr` from `scripts/fr-typo.mjs` into the project (the file is dependency-free ESM), or call the script with `--check --json` and assert an empty array. The script route is stricter than step 2: it also reports straight apostrophes and `%` spacing, which `frTypo` alone does not.
4. A missing namespace is a failure, not a pass, so a rename cannot silently disable the guard.

Tests worth keeping: compliant text passes; an em dash fails in both locales; plain-space prices fail in French only; nested objects and arrays report the full path; only listed namespaces are checked.

## Review checklist

- Every `: ; ! ?` preceded by U+00A0, none by a plain space.
- Prices as `1 900 $` with U+202F and U+00A0, and the word before them tied with U+00A0.
- Quotes as `«`, nbsp, text, nbsp, `»`; curly apostrophes everywhere.
- No phone number, time or placeholder altered by the fixer.
- Re-running `--fix` changes nothing (idempotent).

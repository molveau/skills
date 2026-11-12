---
description: Check French copy with the french-typography skill's checker, fix it when asked, and report what changed.
argument-hint: "[paths] [fix]"
---

Check French typography with the `french-typography` skill (`molveau-skills:french-typography` in the plugin). The user's paths and options come after the command; Claude Code adds them at the end of this prompt, after `ARGUMENTS:`.

1. **Load the skill** and read its rules and "The script" section.
2. **Pick the files.** Use the paths the user gave. With none, find the project's French message files: `fr.json`, `*.fr.json`, JSON files in a `fr/` folder, and `*.fr.md`, leaving out `node_modules`, `.git` and build output. List what you found before running anything. Run the checker on French files only.
3. **Check.** Run `node <french-typography skill folder>/scripts/fr-typo.mjs --check <files>`.
4. **Fix only when asked.** If the user wrote fix or `--fix`, run the same script with `--fix` on the same files, then `--check` again. Hand edits are listed in the skill's "The script" section. Without that word, change no file.
5. **Look over the fixes.** Read the diff and undo anything the fixer should not have touched, such as a phone number, a time, a URL or an ICU placeholder, then tell the user.

Report: the files checked; per file, each rule hit with its count and a few `file:line` examples; when fixing, what changed per file and what still needs a hand edit.

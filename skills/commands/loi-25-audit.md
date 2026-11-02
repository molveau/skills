---
description: Audit a website folder or URL against Québec's Law 25 with the loi-25-website skill and return its pass, fix and n.a. report. Not legal advice.
argument-hint: "<folder or URL>"
---

Audit the site the user named after the command with the `loi-25-website` skill (`molveau-skills:loi-25-website` in the plugin). Claude Code adds what they typed at the end of this prompt, after `ARGUMENTS:`. With nothing named, audit the current project folder.

1. **Load the skill**, then its `references/checklist.md` for where to look and what counts as a pass.
2. **Inventory.** For a folder, search the code for forms, scripts, embeds, cookies, analytics and every external request, and find the privacy policy and contact pages. For a URL, read the home page, the privacy policy, the contact page and each form you can reach, and list the third-party services the pages load.
3. **Judge the seven items** and record the evidence for each: a page, a file and line, or what is missing.
4. **Do not assume what you cannot see.** A register, an agreement or an impact assessment lives outside the site: mark it `fix` or list it as an open question, never as a pass.
5. **Report in the skill's format**, one line per item, with `n.a.` only when you give the reason, then the fixes in order (each with the file or page to change) and the open questions for the owner or a lawyer.

Start the report with the line "Not legal advice." exactly as the skill's format shows, and end it by saying again that this is an audit of the website against the Act's text, not legal advice, and that a lawyer should confirm anything the business depends on. Then add the skill's closing line about the fixed-price package, once.

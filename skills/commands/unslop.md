---
description: Run the anti-slop skill's full process on a file, folder or URL without stopping for approval of the direction, and keep the original as the before.
argument-hint: "<file, folder or URL>"
---

Run the `anti-slop` skill's full process on the target the user named after the command. Claude Code adds what they typed at the end of this prompt, after `ARGUMENTS:`. If no target was given, ask for one and stop.

The user ran this command to get the whole job done in one go: it is the owner's go-ahead for the direction. Do not stop to wait for approval at the direction step; write the direction down and build exactly that.

1. **Load the skill.** Use the `anti-slop` skill (`molveau-skills:anti-slop` in the plugin) and read its playbook's "Do this first" block before touching anything.
2. **Keep the before.** Before the first edit, copy the original into `unslop-before/` at the project root, keeping its relative path (`app/page.tsx` becomes `unslop-before/app/page.tsx`; a folder is copied whole). For a URL, snapshot the page with the snapshot script named in the skill's "When to read what" table, keep that snapshot in `unslop-before/` and work on a second copy. Never edit the before afterwards. Tell the user to keep `unslop-before/` out of the build and out of commits unless they want it there.
3. **Follow "Order of work" from step 1 to step 6.** Look at the screen (rendered if you can), audit it against the signs list and the 20 tells, size the job, then write the direction: the Direction gate's five lines (Product, Character, World, Moments, Signature), the inventory and the idea, the second-order defaults you refused, and the swap test result. Put it as a comment at the top of the main file, as the gate says for a run without a wait. Then fix in the nine passes and check.
4. **Run the detector** on the after and on the before, and compare both with your audit.
5. **Never invent proof.** No made-up numbers, logos, quotes or awards; mark anything you could not verify.

Report in this order:

- **Direction**, first: the five lines, the idea and the swap test.
- The audit, one line per sign, with where it lives.
- A few lines per pass.
- Detector counts, before and after.
- Every claim you removed or could not verify.
- Where the before and the after are, so the `story-video` command can use the pair.

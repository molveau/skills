# Credits and vendored files

## Notes on the vendored files

The files under `references/vendor/` are copied unmodified from their authors, so relative links and command
names inside them (slash commands, scripts, setup files) may not exist in this install. Take the guidance;
skip what points at missing tools. Licenses and exact sources are in each vendor folder (`LICENSE`,
`SOURCE.md`).

Stageshow is vendored without some upstream material: its third-party artwork (app icons, brand marks, not
MIT), its `scripts/` (including `film.mjs`), `teaching/` and the example scenes that depict real products.
Some examples and kit imports named in `references/vendor/stageshow/stageshow.md` therefore do not exist
here; its `SOURCE.md` lists what was excluded, and the full set is at https://github.com/benjitaylor/skills.
Adapt any scene to your own product; do not copy third-party marks.

## Credits and licenses

- `references/vendor/emil/` is **Emil Kowalski**'s skills (https://github.com/emilkowalski/skills), MIT.
- `references/vendor/gsap/` is the official **GreenSock** GSAP skills (https://github.com/greensock/gsap-skills), MIT.
- `references/vendor/principles/` is **12-principles-of-animation** by Raphael Salaja (https://github.com/raphaelsalaja/skill), MIT. It is pinned to the last version before the author removed it from the repository.
- `references/vendor/lottie/` is **motion-design-skill** by LottieFiles (https://github.com/LottieFiles/motion-design-skill), MIT.
- `references/vendor/stageshow/` is **stageshow** by Benji Taylor (https://github.com/benjitaylor/skills), MIT for the code. Its `NOTICE.md` explains that product names, marks and artwork in the examples remain with their owners and are not covered by the license.
- `references/playbook.md`, `references/guardrails.md` and `scripts/check-motion.mjs` are Molveau's own (MIT). The playbook paraphrases and condenses the sources above, with credit by tag.

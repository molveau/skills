# Credits and vendored files

## Credits and licenses

- The method is adapted from **unslop** by Damir Sokolovsky (https://github.com/heydamir/unslop),
  licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Adapted: condensed and merged with
  taste-skill by Leonxlnx and Molveau's tells in `references/playbook.md`. Keep this credit in any copy or adaptation. The original is
  vendored unmodified in `references/vendor/unslop/`.
- The art-direction run, house rules and inspector come from **taste-skill** by Leonxlnx
  (https://github.com/Leonxlnx/taste-skill), MIT, vendored unmodified in `references/vendor/taste/`.
- The 20-tells list and `scripts/detect-tells.mjs` are Molveau's own (MIT).
- `scripts/story.mjs` is adapted from unslop's renderer (CC BY 4.0, changes listed in its header); it
  stays CC BY 4.0, as does `scripts/story-server.mjs`, its local server. `scripts/story-contrast.mjs` is
  Molveau's own (MIT).

## Notes on the vendored files

The vendored files keep their upstream layout, so a few relative links inside them may not resolve
here. taste-skill's `scripts/` and `library/` are not vendored (they read keys and the network, and the
library is too large for the plugin directory's review): its dealt direction is replaced by the direction
gate above; get the scripts from the upstream repo if you want them. Which visual checks to run is
decided in the `ui` playbook, conflict 14 (this playbook's conflict 14 points there).

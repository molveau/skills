import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Optional enrichment only. Every lens works without every one of these.
 * Suites are matched by skill-directory name across the given skills dirs.
 */
export const OPTIONAL_SUITES = Object.freeze([
  Object.freeze({ suite: 'impeccable', dirNames: Object.freeze(['impeccable']), lens: 'layout' }),
  Object.freeze({ suite: 'impeccable-verbs', dirNames: Object.freeze(['clarify', 'harden', 'arrange', 'critique']), lens: 'copy' }),
  Object.freeze({ suite: 'ux-guideline-db', dirNames: Object.freeze(['ui-ux-pro-max']), lens: 'heuristics' }),
  Object.freeze({ suite: 'design-engineering', dirNames: Object.freeze(['emil-design-eng', 'make-interfaces-feel-better', 'apple-design']), lens: 'craft' }),
  Object.freeze({ suite: 'animation-audit', dirNames: Object.freeze(['12-principles-of-animation', 'improve-animations', 'find-animation-opportunities']), lens: 'motion' }),
  Object.freeze({ suite: 'accessibility', dirNames: Object.freeze(['fixing-accessibility']), lens: 'a11y' }),
]);

/** Probe which optional suites are installed. Absence is reported, never fatal. */
export function probeSuites(skillsDirs = []) {
  // Coerce non-array arguments to empty array so every suite is reported absent.
  const dirs = Array.isArray(skillsDirs) ? skillsDirs : [];
  return OPTIONAL_SUITES.map(({ suite, dirNames, lens }) => {
    const hits = [];
    for (const base of dirs) {
      for (const name of dirNames) {
        if (existsSync(join(base, name))) hits.push(name);
      }
    }
    return hits.length > 0
      ? { suite, present: true, reason: `found ${[...new Set(hits)].join(', ')}`, lens }
      : { suite, present: false, reason: `none of ${dirNames.join(', ')} found; lens runs on its built-in brief`, lens };
  });
}

/** List subdirectory names of `dir`, or [] if it doesn't exist / isn't readable. */
function subdirNames(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

/**
 * Marketplace-installed plugins live at
 * `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/skills/<skill-name>/`.
 * The version directory is unpredictable (semver, or literally "unknown"),
 * so it must be discovered rather than assumed. Observed on-disk layouts
 * differ by plugin: some put skills directly at `<version>/skills`, others
 * nest them one level deeper at `<version>/.claude/skills` (matching that
 * plugin's own manifest `"skills"` pointer) - both are checked.
 */
function pluginCacheSkillsDirs(homeDir) {
  const cacheDir = join(homeDir, '.claude', 'plugins', 'cache');
  const roots = [];
  for (const marketplace of subdirNames(cacheDir)) {
    const marketplaceDir = join(cacheDir, marketplace);
    for (const plugin of subdirNames(marketplaceDir)) {
      const pluginDir = join(marketplaceDir, plugin);
      for (const version of subdirNames(pluginDir)) {
        const versionDir = join(pluginDir, version);
        for (const candidate of [join(versionDir, 'skills'), join(versionDir, '.claude', 'skills')]) {
          try {
            if (statSync(candidate).isDirectory()) roots.push(candidate);
          } catch {
            // candidate layout doesn't apply to this plugin; try the other one
          }
        }
      }
    }
  }
  return roots;
}

/** Default skills locations to probe. Callers may override. */
export function defaultSkillsDirs(homeDir) {
  return [
    join(homeDir, '.claude', 'skills'),
    join(homeDir, '.agents', 'skills'),
    ...pluginCacheSkillsDirs(homeDir),
  ];
}

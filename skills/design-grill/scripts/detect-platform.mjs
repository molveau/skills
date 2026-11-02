import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';

const MOBILE_DEPS = ['expo', 'react-native'];
const WEB_DEPS = ['next', 'react-dom', 'vite', '@remix-run/react'];

/**
 * Walk up from startPath to the nearest package.json. Returns path or null.
 *
 * The walk stops at a repository boundary: a project's package.json never
 * lives above its own git root. Without that stop, an unrelated package.json
 * in any ancestor directory (a home directory, a parent workspace) silently
 * hijacks detection for every project nested beneath it.
 */
export function findNearestPackageJson(startPath) {
  let dir = startPath;
  if (existsSync(dir) && !statSync(dir).isDirectory()) dir = dirname(dir);
  else if (!existsSync(dir)) dir = dirname(dir);

  const { root } = parse(dir);
  for (;;) {
    const candidate = join(dir, 'package.json');
    if (existsSync(candidate)) return candidate;
    if (existsSync(join(dir, '.git'))) return null; // repo boundary
    if (dir === root) return null;
    dir = dirname(dir);
  }
}

/**
 * Detect the platform of the project containing startPath.
 * Mobile takes precedence: an Expo app carrying react-dom for expo-web
 * is still a mobile project.
 */
export function detectPlatform(startPath) {
  const pkgPath = findNearestPackageJson(startPath);
  if (!pkgPath) {
    return { platform: 'ambiguous', reason: 'no package.json found above target', source: null };
  }

  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  } catch (err) {
    return { platform: 'ambiguous', reason: `unparseable package.json: ${err.message}`, source: pkgPath };
  }

  const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  const mobile = MOBILE_DEPS.filter((d) => names.includes(d));
  const web = WEB_DEPS.filter((d) => names.includes(d));

  if (mobile.length) return { platform: 'mobile', reason: `found ${mobile.join(', ')}`, source: pkgPath };
  if (web.length) return { platform: 'web', reason: `found ${web.join(', ')}`, source: pkgPath };
  return { platform: 'ambiguous', reason: 'no known web or mobile framework in dependencies', source: pkgPath };
}

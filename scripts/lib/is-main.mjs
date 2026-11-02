import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// True when the module whose import.meta.url is given was executed directly, not imported. Node resolves
// import.meta.url through the real path while argv[1] keeps a symlinked one, so compare real paths.
export function isMain(metaUrl, argv1 = process.argv[1]) {
  if (!argv1) return false;
  let resolved;
  try {
    resolved = realpathSync(argv1);
  } catch {
    resolved = argv1;
  }
  return metaUrl === pathToFileURL(resolved).href;
}

// Local server for story.mjs. Adapted from the request handler in unslop's story.mjs by Damir Sokolovsky
// (https://github.com/heydamir/unslop), CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); this file
// stays under CC BY 4.0. Changes by Molveau: the path check uses path.relative instead of a prefix match, only
// regular files are served, and a malformed URL gets a 400 instead of crashing the render.
import { readFileSync, statSync } from "node:fs";
import { extname, isAbsolute, join, normalize, relative, sep } from "node:path";

const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".mp4": "video/mp4" };

// The file a decoded request path points to under root, or null when it would leave root.
export function storyTarget(root, path) {
  if (path.includes("\0")) return null;
  const target = normalize(join(root, path.replace(/^\/__story\//, "/")));
  const rel = relative(root, target);
  if (rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel)) return null;
  return target;
}

// Request handler: the stage page at /__stage.html, regular files under root, 404 for anything else.
export function storyHandler(root, stage) {
  return (request, response) => {
    try {
      const path = decodeURIComponent(new URL(request.url, "http://local").pathname);
      if (path === "/__stage.html") {
        response.writeHead(200, { "content-type": "text/html" });
        return response.end(stage);
      }
      const target = storyTarget(root, path);
      let file = false;
      try {
        file = target !== null && statSync(target).isFile();
      } catch {}
      if (!file) {
        response.writeHead(404);
        return response.end();
      }
      const body = readFileSync(target);
      response.writeHead(200, { "content-type": types[extname(target).toLowerCase()] ?? "application/octet-stream" });
      response.end(body);
    } catch (error) {
      if (!response.headersSent) response.writeHead(error instanceof URIError ? 400 : 500);
      response.end();
    }
  };
}

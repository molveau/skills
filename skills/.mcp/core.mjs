// molveau-skills MCP core: answers one parsed JSON-RPC 2.0 message, whatever carries it. The stdio server
// (server.mjs) and a hosted Streamable HTTP route both call handleRpc, so the two share one code path.
// Importing this module has no side effect: it reads no stdin, opens nothing and starts nothing.
import { existsSync } from 'node:fs';
import { TOOLS, REMOTE_TOOLS, PLAYBOOK_FILES, checkArgs } from './tools.mjs';

// Kept equal to package.json by test/mcp-core.test.mjs, so no file is read to name the server.
export const VERSION = '1.3.1';
export const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
// In remote mode, a string argument longer than this is refused with a tool error.
export const MAX_INPUT = 200_000;

const INSTRUCTIONS =
  'Design checks from the Molveau skills: detect_tells (AI-look tells in UI code), check_contrast (WCAG ratio), fr_typo (French spacing and punctuation), check_motion (animation guardrails), and get_playbook to read a skill before building.';

const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
const fail = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });
const toolError = (message) => ({ content: [{ type: 'text', text: message }], isError: true });

function tooLong(args) {
  if (!args || typeof args !== 'object') return null;
  for (const [key, value] of Object.entries(args)) {
    const values = Array.isArray(value) ? value : [value];
    if (values.some((v) => typeof v === 'string' && v.length > MAX_INPUT)) {
      return '"' + key + '" is over ' + MAX_INPUT.toLocaleString('en-US') + ' characters: send a smaller piece.';
    }
  }
  return null;
}

function callTool(params, tools, ctx) {
  const tool = tools.find((t) => t.name === params?.name);
  if (!tool) return { error: 'Unknown tool: ' + params?.name };
  const args = params.arguments ?? {};
  const problem = (ctx.remote && tooLong(args)) || checkArgs(tool.inputSchema, args);
  if (problem) return { result: toolError(problem) };
  try {
    const out = tool.run(args, ctx);
    const content = [{ type: 'text', text: out.text }];
    if (out.footer) content.push({ type: 'text', text: out.footer });
    return { result: { content, ...(out.data ? { structuredContent: out.data } : {}) } };
  } catch (e) {
    return { result: toolError(e instanceof Error ? e.message : String(e)) };
  }
}

/**
 * Answers one parsed JSON-RPC message, or a batch (an array of them).
 *
 * options.remote   false (default): the stdio tools; detect_tells may read `paths` inside options.cwd.
 *                  true: the hosted tools; detect_tells takes only `code`, string arguments are capped at
 *                  MAX_INPUT characters, get_playbook leaves out the lines that point at the studio, and no
 *                  file outside the skills' own is read.
 * options.cwd      working directory for detect_tells `paths` (stdio only). Default process.cwd().
 * options.readFile optional (relPath) => string | null, serving the files bundledFiles() lists, for a runtime
 *                  without a file system. By default they are read beside this module.
 * options.tools    replaces the tool list (tests).
 *
 * Throws a TypeError when options.remote is neither true, false nor left out.
 *
 * Returns the reply object (an array for a batch), or null when nothing is owed: a notification, or a reply
 * the client sends.
 */
export function handleRpc(message, options = {}) {
  // A hosted route that misspells the option must not fall back to local mode and its working directory.
  if (options.remote !== undefined && typeof options.remote !== 'boolean') {
    throw new TypeError('handleRpc: options.remote must be true or false.');
  }
  const remote = options.remote === true;
  const tools = options.tools ?? (remote ? REMOTE_TOOLS : TOOLS);
  const ctx = remote ? { remote, readFile: options.readFile } : { remote, cwd: options.cwd ?? process.cwd(), readFile: options.readFile };
  return answer(message, tools, ctx);
}

function answer(msg, tools, ctx) {
  if (Array.isArray(msg)) {
    if (!msg.length) return fail(null, -32600, 'Invalid Request: empty batch');
    const replies = msg.map((m) => answer(m, tools, ctx)).filter(Boolean);
    return replies.length ? replies : null;
  }
  if (!msg || typeof msg !== 'object') return fail(null, -32600, 'Invalid Request');
  const hasId = typeof msg.id === 'string' || typeof msg.id === 'number';
  if (typeof msg.method !== 'string') {
    if ('result' in msg || 'error' in msg) return null; // a reply to a request we never send
    return fail(hasId ? msg.id : null, -32600, 'Invalid Request');
  }
  if ('id' in msg && !hasId) return fail(null, -32600, 'Invalid Request: id must be a string or a number');
  if (!hasId) return null; // notification: notifications/initialized, cancelled and the rest

  const { id, method, params } = msg;
  try {
    switch (method) {
      case 'initialize': {
        const asked = params?.protocolVersion;
        return ok(id, {
          protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
          capabilities: { tools: {} },
          serverInfo: { name: 'molveau-skills', version: VERSION },
          instructions: INSTRUCTIONS,
        });
      }
      case 'ping':
        return ok(id, {});
      case 'tools/list':
        return ok(id, {
          tools: tools.map(({ name, title, description, inputSchema, annotations }) => ({ name, title, description, inputSchema, annotations })),
        });
      case 'tools/call': {
        const r = callTool(params, tools, ctx);
        return r.error ? fail(id, -32602, r.error) : ok(id, r.result);
      }
      default:
        return fail(id, -32601, 'Method not found: ' + method);
    }
  } catch (e) {
    console.error('molveau-skills: ' + (e?.stack ?? e));
    return fail(id, -32603, 'Internal error');
  }
}

/**
 * The files the core reads at run time, relative to the package root (such as skills/ui/SKILL.md). A bundler
 * that copies only imported modules misses them: include node_modules/@molveau/skills/skills/** in the
 * output file tracing, or serve them through options.readFile.
 */
export function bundledFiles() {
  return PLAYBOOK_FILES.filter((f) => existsSync(new URL('../../' + f, import.meta.url)));
}

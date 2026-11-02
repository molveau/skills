#!/usr/bin/env node
// molveau-skills MCP server: the skills' checks and playbooks as five tools for any MCP client.
// Zero dependencies. Speaks newline-delimited JSON-RPC 2.0 on stdin and stdout; stdout carries protocol
// messages only, diagnostics go to stderr. Read-only: no network, no writes.
import { readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { TOOLS, checkArgs } from './tools.mjs';

const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const MAX_LINE = 32 * 1024 * 1024;

function readVersion() {
  try {
    return JSON.parse(readFileSync(new URL('../.claude-plugin/plugin.json', import.meta.url), 'utf8')).version;
  } catch {
    return '0.0.0';
  }
}
const VERSION = readVersion();

const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
const fail = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });
const toolError = (message) => ({ content: [{ type: 'text', text: message }], isError: true });

function callTool(params, tools, ctx) {
  const tool = tools.find((t) => t.name === params?.name);
  if (!tool) return { error: `Unknown tool: ${params?.name}` };
  const args = params.arguments ?? {};
  const problem = checkArgs(tool.inputSchema, args);
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
 * Answers one parsed JSON-RPC message (or a batch). Returns the reply, or null for notifications and for
 * replies the client sends us.
 */
export function handle(msg, tools = TOOLS, ctx = { cwd: process.cwd() }) {
  if (Array.isArray(msg)) {
    if (!msg.length) return fail(null, -32600, 'Invalid Request: empty batch');
    const replies = msg.map((m) => handle(m, tools, ctx)).filter(Boolean);
    return replies.length ? replies : null;
  }
  if (!msg || typeof msg !== 'object') return fail(null, -32600, 'Invalid Request');
  const hasId = typeof msg.id === 'string' || typeof msg.id === 'number';
  if (typeof msg.method !== 'string') {
    if ('result' in msg || 'error' in msg) return null; // a reply to a request we never send
    return fail(hasId ? msg.id : null, -32600, 'Invalid Request');
  }
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
          instructions:
            'Design checks from the Molveau skills: detect_tells (AI-look tells in UI code), check_contrast (WCAG ratio), fr_typo (French spacing and punctuation), check_motion (animation guardrails), and get_playbook to read a skill before building.',
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
        return fail(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    process.stderr.write(`molveau-skills: ${e?.stack ?? e}\n`);
    return fail(id, -32603, 'Internal error');
  }
}

function serve() {
  const send = (reply) => process.stdout.write(JSON.stringify(reply) + '\n');
  const onLine = (raw) => {
    const text = raw.replace(/\r$/, '');
    if (!text.trim()) return;
    let msg;
    try {
      msg = JSON.parse(text);
    } catch {
      send(fail(null, -32700, 'Parse error'));
      return;
    }
    const reply = handle(msg);
    if (reply) send(reply);
  };
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    buf += chunk;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const lineText = buf.slice(0, i);
      buf = buf.slice(i + 1);
      onLine(lineText);
    }
    if (buf.length > MAX_LINE) {
      buf = '';
      send(fail(null, -32700, 'Parse error: message too large'));
    }
  });
  process.stdin.on('end', () => {
    if (buf.trim()) onLine(buf);
    buf = '';
  });
  process.stdout.on('error', () => process.exit(0)); // client went away
  process.on('uncaughtException', (e) => process.stderr.write(`molveau-skills: ${e?.stack ?? e}\n`));
}

// Serve only when run directly (or through the npm bin symlink), never on import.
function isMainModule() {
  if (!process.argv[1]) return false;
  let resolved;
  try {
    resolved = realpathSync(process.argv[1]);
  } catch {
    resolved = process.argv[1];
  }
  return import.meta.url === pathToFileURL(resolved).href;
}

if (isMainModule()) serve();

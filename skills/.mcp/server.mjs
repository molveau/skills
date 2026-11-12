#!/usr/bin/env node
// molveau-skills MCP server: the skills' checks and playbooks as six tools for any MCP client.
// Zero dependencies. Speaks newline-delimited JSON-RPC 2.0 on stdin and stdout; stdout carries protocol
// messages only, diagnostics go to stderr. Read-only: no network, no writes. The answers come from core.mjs,
// which a hosted endpoint calls too.
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { TOOLS } from './tools.mjs';
import { handleRpc } from './core.mjs';

const MAX_LINE = 32 * 1024 * 1024;

const fail = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

/**
 * Answers one parsed JSON-RPC message (or a batch) with the stdio tools, through the shared core. Returns the
 * reply, or null for notifications and for replies the client sends us.
 */
export function handle(msg, tools = TOOLS, ctx = { cwd: process.cwd() }) {
  return handleRpc(msg, { tools, cwd: ctx.cwd });
}

/**
 * Splits a stream of text chunks into lines. A line longer than `max` characters is dropped whole, up to its
 * newline, with one call to onOverflow. Returns the function to feed chunks to.
 */
export function lineSplitter(onLine, onOverflow, max = MAX_LINE) {
  let buf = '';
  let skipping = false;
  return (chunk) => {
    buf += chunk;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const lineText = buf.slice(0, i);
      buf = buf.slice(i + 1);
      if (skipping) skipping = false;
      else onLine(lineText);
    }
    if (!skipping && buf.length > max) {
      skipping = true;
      onOverflow();
    }
    if (skipping) buf = '';
  };
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
    const reply = handleRpc(msg);
    if (reply) send(reply);
  };
  const push = lineSplitter(onLine, () => send(fail(null, -32700, 'Parse error: message too large')));
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', push);
  process.stdin.on('end', () => push('\n')); // a last message with no newline
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

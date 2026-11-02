// The MCP server in skills/.mcp/: newline-delimited JSON-RPC 2.0 over stdio, five read-only tools.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, symlinkSync, realpathSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SERVER = join(ROOT, 'skills', '.mcp', 'server.mjs');
const VERSION = JSON.parse(readFileSync(join(ROOT, 'skills', '.claude-plugin', 'plugin.json'), 'utf8')).version;
const EM = String.fromCharCode(0x2014);
const NB = String.fromCharCode(0xa0);

// Starts the server in `cwd`, writes each chunk as given (no newline added), waits for `expect` replies and
// for the process to exit once stdin closes. Returns the parsed stdout lines, raw stdout and stderr.
function talk(chunks, { expect, cwd = mkdtempSync(join(tmpdir(), 'mcp-')) } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SERVER], { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error(`timeout; stdout: ${out}; stderr: ${err}`)); }, 10_000);
    const lines = () => out.split('\n').filter(Boolean);
    child.stdout.on('data', (d) => {
      out += d;
      if (lines().length >= expect) child.stdin.end();
    });
    child.stderr.on('data', (d) => { err += d; });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, raw: out, stderr: err, replies: lines().map((l) => JSON.parse(l)) });
    });
    (async () => {
      for (const c of chunks) {
        child.stdin.write(c);
        await new Promise((r) => setTimeout(r, 20));
      }
      if (expect === 0) child.stdin.end();
    })();
  });
}
const line = (msg) => JSON.stringify(msg) + '\n';
const req = (id, method, params) => line({ jsonrpc: '2.0', id, method, ...(params ? { params } : {}) });
const call = (id, name, args) => req(id, 'tools/call', { name, arguments: args });
async function callOne(name, args, opts) {
  const { replies } = await talk([call(1, name, args)], { expect: 1, ...opts });
  return replies[0].result;
}
const textOf = (result) => result.content.map((c) => c.text).join('\n');

test('initialize echoes a supported protocol version and names the server', async () => {
  for (const v of ['2025-06-18', '2025-03-26', '2024-11-05']) {
    const { replies } = await talk([req(1, 'initialize', { protocolVersion: v, capabilities: {}, clientInfo: { name: 't', version: '0' } })], { expect: 1 });
    const r = replies[0];
    assert.equal(r.jsonrpc, '2.0');
    assert.equal(r.id, 1);
    assert.equal(r.result.protocolVersion, v);
    assert.deepEqual(r.result.capabilities, { tools: {} });
    assert.deepEqual(r.result.serverInfo, { name: 'molveau-skills', version: VERSION });
  }
});

test('initialize answers 2025-06-18 to an unknown protocol version', async () => {
  const { replies } = await talk([req('a', 'initialize', { protocolVersion: '1999-01-01' })], { expect: 1 });
  assert.equal(replies[0].id, 'a');
  assert.equal(replies[0].result.protocolVersion, '2025-06-18');
});

test('notifications get no reply; ping answers {}', async () => {
  const { replies } = await talk([
    line({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    line({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 9 } }),
    req(2, 'ping'),
  ], { expect: 1 });
  assert.equal(replies.length, 1);
  assert.deepEqual(replies[0], { jsonrpc: '2.0', id: 2, result: {} });
});

test('unknown method is -32601, malformed JSON is -32700 with id null, and the server keeps going', async () => {
  const { replies, code } = await talk([req(3, 'resources/list'), '{not json\n', req(4, 'ping')], { expect: 3 });
  assert.equal(replies[0].id, 3);
  assert.equal(replies[0].error.code, -32601);
  assert.equal(replies[1].id, null);
  assert.equal(replies[1].error.code, -32700);
  assert.deepEqual(replies[2].result, {});
  assert.equal(code, 0);
});

test('several messages in one chunk and one message split across chunks', async () => {
  const two = req(1, 'ping') + req(2, 'ping');
  const split = req(3, 'tools/list');
  const { replies } = await talk([two, split.slice(0, 10), split.slice(10, 25), split.slice(25)], { expect: 3 });
  assert.deepEqual(replies.map((r) => r.id), [1, 2, 3]);
  assert.ok(Array.isArray(replies[2].result.tools));
});

test('stdout carries only protocol messages', async () => {
  const { raw } = await talk([req(1, 'initialize', { protocolVersion: '2025-06-18' }), call(2, 'detect_tells', { code: `<p>a ${EM} b</p>` })], { expect: 2 });
  for (const l of raw.split('\n').filter(Boolean)) assert.equal(JSON.parse(l).jsonrpc, '2.0');
});

test('tools/list: five tools with descriptions and closed object schemas', async () => {
  const { replies } = await talk([req(1, 'tools/list')], { expect: 1 });
  const tools = replies[0].result.tools;
  assert.deepEqual(tools.map((t) => t.name).sort(), ['check_contrast', 'check_motion', 'detect_tells', 'fr_typo', 'get_playbook']);
  for (const t of tools) {
    assert.ok(t.description.length > 40, `${t.name}: description too short`);
    assert.equal(t.inputSchema.type, 'object');
    assert.equal(t.inputSchema.additionalProperties, false, `${t.name}: additionalProperties`);
    assert.equal(t.annotations?.readOnlyHint, true, `${t.name}: readOnlyHint`);
    assert.deepEqual(t.annotations, { title: t.title, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }, `${t.name}: annotations`);
  }
});

test('get_playbook offers exactly the skills in skills/', async () => {
  const { replies } = await talk([req(1, 'tools/list')], { expect: 1 });
  const schema = replies[0].result.tools.find((t) => t.name === 'get_playbook').inputSchema;
  const dirs = readdirSync(join(ROOT, 'skills')).filter((n) => !n.startsWith('.') && !['commands', 'agents', 'hooks'].includes(n) && statSync(join(ROOT, 'skills', n)).isDirectory());
  assert.deepEqual([...schema.properties.skill.enum].sort(), dirs.sort());
  assert.equal(dirs.length, 11);
});

test('unknown tool is -32602; bad arguments are a tool error, not a crash', async () => {
  const { replies } = await talk([
    call(1, 'nope', {}),
    call(2, 'check_contrast', { foreground: '#000' }),
    call(3, 'fr_typo', { text: 'x', extra: 1 }),
    call(4, 'fr_typo', { text: 42 }),
    req(5, 'ping'),
  ], { expect: 5 });
  assert.equal(replies[0].error.code, -32602);
  for (const r of replies.slice(1, 4)) {
    assert.equal(r.result.isError, true, JSON.stringify(r));
    assert.ok(textOf(r.result).length > 0);
  }
  assert.match(textOf(replies[1].result), /background/);
  assert.match(textOf(replies[2].result), /extra/);
  assert.deepEqual(replies[4].result, {});
});

test('a tool that throws becomes isError with its message', async () => {
  const { handle } = await import('../skills/.mcp/server.mjs');
  const tools = [{ name: 'boom', description: 'x', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, run: () => { throw new Error('kaput'); } }];
  const r = handle({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'boom', arguments: {} } }, tools);
  assert.equal(r.id, 7);
  assert.equal(r.result.isError, true);
  assert.match(r.result.content[0].text, /kaput/);
});

test('detect_tells on code: findings as CLI lines, summary and count', async () => {
  const r = await callOne('detect_tells', { code: `export const A = () => <p>Fast ${EM} and seamless</p>;\n` });
  assert.ok(!r.isError);
  const text = textOf(r);
  assert.match(text, /^snippet\.tsx:1 {2}#16 Em dash in copy/m);
  assert.match(text, /^snippet\.tsx:1 {2}#17 Buzzword copy {2}seamless$/m);
  assert.match(text, /^2 finding\(s\) in 1 file\(s\) \(1 scanned; #16 1, #17 1\)$/m);
  assert.equal(r.structuredContent.count, 2);
});

test('detect_tells on code honours filename for the file kind', async () => {
  const css = '.hero { background: linear-gradient(90deg, #7c3aed, #ec4899); }\n';
  assert.equal((await callOne('detect_tells', { code: css, filename: 'hero.css' })).structuredContent.count, 1);
  assert.match(textOf(await callOne('detect_tells', { code: css, filename: 'hero.css' })), /^hero\.css:1 {2}#1 /m);
});

test('detect_tells needs code or paths', async () => {
  const r = await callOne('detect_tells', {});
  assert.equal(r.isError, true);
  assert.match(textOf(r), /code|paths/);
});

function project() {
  const d = realpathSync(mkdtempSync(join(tmpdir(), 'mcp-proj-')));
  mkdirSync(join(d, 'src'));
  mkdirSync(join(d, 'node_modules', 'pkg'), { recursive: true });
  writeFileSync(join(d, 'src', 'hero.css'), '.hero { background: linear-gradient(90deg, #7c3aed, #ec4899); }\n');
  writeFileSync(join(d, 'src', 'clean.tsx'), 'export const B = () => <p>Plain words.</p>;\n');
  writeFileSync(join(d, 'node_modules', 'pkg', 'x.css'), '.x { background: linear-gradient(#7c3aed, #000); }\n');
  const outside = realpathSync(mkdtempSync(join(tmpdir(), 'mcp-out-')));
  writeFileSync(join(outside, 'secret.css'), '.s { background: linear-gradient(#7c3aed, #000); }\n');
  return { d, outside };
}

test('detect_tells on paths: reads folders inside the working directory, skips node_modules', async () => {
  const { d } = project();
  const r = await callOne('detect_tells', { paths: ['src'] }, { cwd: d });
  assert.ok(!r.isError, textOf(r));
  assert.equal(r.structuredContent.count, 1);
  assert.match(textOf(r), /^src\/hero\.css:1 {2}#1 /m);
  assert.match(textOf(r), /\(2 scanned; #1 1\)/);
  const all = await callOne('detect_tells', { paths: ['.'] }, { cwd: d });
  assert.equal(all.structuredContent.count, 1, 'node_modules must be skipped');
});

test('detect_tells refuses paths outside the working directory, including through symlinks', async () => {
  const { d, outside } = project();
  symlinkSync(outside, join(d, 'link-out'));
  symlinkSync(join(outside, 'secret.css'), join(d, 'src', 'secret-link.css'));
  for (const p of ['..', join(outside, 'secret.css'), 'link-out', 'link-out/secret.css', 'src/secret-link.css']) {
    const r = await callOne('detect_tells', { paths: [p] }, { cwd: d });
    assert.equal(r.isError, true, `${p} should be refused: ${textOf(r)}`);
    assert.match(textOf(r), /outside/);
  }
  // Walking a folder never follows a link out of it.
  const r = await callOne('detect_tells', { paths: ['src'] }, { cwd: d });
  assert.equal(r.structuredContent.count, 1);
  assert.ok(!textOf(r).includes('secret'));
});

test('detect_tells on a missing path is a tool error', async () => {
  const { d } = project();
  const r = await callOne('detect_tells', { paths: ['nope'] }, { cwd: d });
  assert.equal(r.isError, true);
  assert.match(textOf(r), /nope/);
});

test('collectInside caps the file count and skips files over 1 MB', async () => {
  const { collectInside } = await import('../skills/.mcp/tools.mjs');
  const d = realpathSync(mkdtempSync(join(tmpdir(), 'mcp-cap-')));
  for (let i = 0; i < 5; i++) writeFileSync(join(d, `f${i}.css`), '.a{}\n');
  writeFileSync(join(d, 'big.css'), 'a'.repeat(1_000_001));
  const capped = collectInside(d, ['.'], { maxFiles: 3 });
  assert.equal(capped.files.length, 3);
  assert.equal(capped.truncated, true);
  const all = collectInside(d, ['.']);
  assert.equal(all.files.length, 5);
  assert.ok(!all.files.some((f) => f.path.includes('big')));
});

test('check_contrast: ratio, the threshold that applies, AA and AAA', async () => {
  const black = await callOne('check_contrast', { foreground: '#000', background: '#fff' });
  assert.ok(!black.isError);
  assert.match(textOf(black), /21:1/);
  assert.deepEqual(black.structuredContent, { ratio: '21:1', large: false, aa: { required: 4.5, ok: true }, aaa: { required: 7, ok: true } });
  const grey = await callOne('check_contrast', { foreground: '#777777', background: '#ffffff' });
  assert.equal(grey.structuredContent.ratio, '4.4:1');
  assert.equal(grey.structuredContent.aa.ok, false);
  assert.match(textOf(grey), /AA.*fails/);
  assert.match(textOf(grey), /1\.4\.3/);
  const large = await callOne('check_contrast', { foreground: '#777777', background: '#ffffff', fontSizePx: 24 });
  assert.deepEqual(large.structuredContent.aa, { required: 3, ok: true });
  assert.deepEqual(large.structuredContent.aaa, { required: 4.5, ok: false });
  const bold = await callOne('check_contrast', { foreground: '#777', background: '#fff', fontSizePx: 19, bold: true });
  assert.equal(bold.structuredContent.large, true);
  const notBold = await callOne('check_contrast', { foreground: '#777', background: '#fff', fontSizePx: 19 });
  assert.equal(notBold.structuredContent.large, false);
});

test('check_contrast reads oklch and rgb, and names the formats when it cannot read one', async () => {
  const ok = await callOne('check_contrast', { foreground: 'oklch(0.2 0.02 250)', background: 'rgb(250 250 250)' });
  assert.ok(!ok.isError);
  assert.equal(ok.structuredContent.aa.ok, true);
  const bad = await callOne('check_contrast', { foreground: 'hsl(0 0% 0%)', background: '#fff' });
  assert.equal(bad.isError, true);
  assert.match(textOf(bad), /hsl\(0 0% 0%\)/);
  assert.match(textOf(bad), /oklch/);
  assert.match(textOf(bad), /#rrggbb/);
});

test('fr_typo checks, and with fix returns the fixed text and the change count', async () => {
  const text = "Prix : 1 900 $ l'an";
  const check = await callOne('fr_typo', { text });
  assert.ok(!check.isError);
  assert.equal(check.structuredContent.count, 5);
  assert.match(textOf(check), /^1:5 high-punct /m);
  assert.match(textOf(check), /straight-apostrophe/);
  const fix = await callOne('fr_typo', { text, fix: true });
  assert.equal(fix.structuredContent.text, `Prix${NB}:${NB}1\u202f900${NB}$ l\u2019an`);
  assert.equal(fix.structuredContent.changes, 5);
  assert.equal(fix.structuredContent.count, 0);
  assert.match(textOf(fix), /5 change\(s\)/);
});

test('fr_typo fix leaves em dashes to a person', async () => {
  const fix = await callOne('fr_typo', { text: `Oui ${EM} non`, fix: true });
  assert.equal(fix.structuredContent.changes, 0);
  assert.equal(fix.structuredContent.count, 1);
  assert.match(textOf(fix), /em-dash/);
});

test('check_motion reports the check-motion findings', async () => {
  const r = await callOne('check_motion', { code: '.a { transition: all 200ms; }\n', filename: 'a.css' });
  assert.ok(!r.isError);
  assert.match(textOf(r), /^a\.css:1 {2}transition-all {2}/m);
  assert.equal(r.structuredContent.count, 1);
  const clean = await callOne('check_motion', { code: 'export const x = 1;\n' });
  assert.equal(clean.structuredContent.count, 0);
  assert.match(textOf(clean), /^0 finding\(s\)/m);
});

test('get_playbook without a query: direction gate, else "Do this first", else the top of SKILL.md', async () => {
  // The first content item is the doctrine; the second names the source and lists the other sections.
  const gateResult = await callOne('get_playbook', { skill: 'anti-slop' });
  const gate = gateResult.content[0].text;
  assert.match(gateResult.content[1].text, /^From skills\/anti-slop\/SKILL\.md\./);
  assert.match(gateResult.content[1].text, /^## 1\. Size the job/m, 'lists the playbook sections');
  assert.match(gate, /^## Direction gate/);
  assert.match(gate, /Swap test/);
  assert.ok(!gate.includes('## The core idea'), 'only the one section');
  const first = (await callOne('get_playbook', { skill: 'ux' })).content[0].text;
  assert.match(first, /^## Do this first/);
  assert.ok(!first.includes('## 1. '));
  const top = (await callOne('get_playbook', { skill: 'loi-25-website' })).content[0].text;
  assert.match(top, /name: loi-25-website/);
  assert.ok(top.split('\n').length <= 80);
});

test('get_playbook with a query: matching sections, best first, at most 3 and 12,000 characters', async () => {
  const r = await callOne('get_playbook', { skill: 'motion', query: 'reduced motion' });
  assert.ok(!r.isError);
  const text = r.content[0].text;
  assert.match(text, /^## 10\. Reduced motion/);
  assert.equal(r.structuredContent.matched[0], '## 10. Reduced motion');
  assert.ok((text.match(/^## /gm) ?? []).length <= 3);
  assert.ok(text.length <= 12_000, `${text.length} chars`);
  const wf = textOf(await callOne('get_playbook', { skill: 'workflow', query: 'git' }));
  assert.match(wf, /^## /m);
  assert.match(wf, /git/i);
});

test('get_playbook with a query that matches nothing lists the headings', async () => {
  const r = await callOne('get_playbook', { skill: 'ui', query: 'zzqx' });
  assert.ok(!r.isError);
  assert.match(textOf(r), /No section/);
  assert.match(textOf(r), /## 4\. Typography/);
});

test('get_playbook refuses a skill outside the list', async () => {
  const r = await callOne('get_playbook', { skill: '../../etc' });
  assert.equal(r.isError, true);
});

test('collectInside works when the working directory is the filesystem root', async () => {
  const { collectInside } = await import('../skills/.mcp/tools.mjs');
  const d = realpathSync(mkdtempSync(join(tmpdir(), 'mcp-root-')));
  writeFileSync(join(d, 'a.css'), '.a{}\n');
  const { files } = collectInside('/', [d.slice(1)]);
  assert.equal(files.length, 1);
});

test('a request id that is neither a string nor a number is an invalid request', async () => {
  const { handle } = await import('../skills/.mcp/server.mjs');
  for (const id of [{}, [], true, null]) {
    const r = handle({ jsonrpc: '2.0', id, method: 'ping' });
    assert.equal(r?.error?.code, -32600, JSON.stringify(id));
    assert.equal(r.id, null);
  }
});

test('an oversized line gives one parse error and the next message still works', async () => {
  const { lineSplitter } = await import('../skills/.mcp/server.mjs');
  const lines = [];
  let overflows = 0;
  const push = lineSplitter((l) => lines.push(l), () => overflows++, 10);
  push('x'.repeat(8));
  push('y'.repeat(8));
  push('zzz\n{"a":1}\n');
  push('{"b"');
  push(':2}\n');
  assert.equal(overflows, 1);
  assert.deepEqual(lines, ['{"a":1}', '{"b":2}']);
});

test('get_playbook with a query stays within 12,000 characters in total', async () => {
  for (const [skill, query] of [['ui', 'color dark mode typography spacing'], ['anti-slop', 'copy colour type icons']]) {
    const r = await callOne('get_playbook', { skill, query });
    const total = r.content.reduce((n, c) => n + c.text.length, 0);
    assert.ok(total <= 12_000, `${skill}: ${total} chars`);
  }
});

test('detect_tells reads .vue and .svelte snippets as HTML, like the hook', async () => {
  for (const filename of ['Card.vue', 'Card.svelte']) {
    const r = await callOne('detect_tells', { code: `<template><p>Fast ${EM} simple</p></template>\n`, filename });
    assert.ok(!r.isError, textOf(r));
    assert.match(textOf(r), new RegExp(`^${filename.replace('.', '\\.')}:1 {2}#16 `, 'm'));
  }
});

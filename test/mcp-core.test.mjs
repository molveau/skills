// The transport-agnostic core in skills/.mcp/core.mjs: one JSON-RPC message in, the reply out. The stdio
// server and a hosted Streamable HTTP route both call handleRpc; remote mode is what the hosted route serves.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CORE = join(ROOT, 'skills', '.mcp', 'core.mjs');
const PKG_VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
const { handleRpc, bundledFiles, VERSION, MAX_INPUT } = await import('../skills/.mcp/core.mjs');
const { SKILLS } = await import('../skills/.mcp/tools.mjs');

const EM = String.fromCharCode(0x2014);
const rpc = (id, method, params) => ({ jsonrpc: '2.0', id, method, ...(params ? { params } : {}) });
const call = (name, args, options) => handleRpc(rpc(1, 'tools/call', { name, arguments: args }), options);
const remote = { remote: true };
const textOf = (result) => result.content.map((c) => c.text).join('\n');
const listTools = (options) => handleRpc(rpc(1, 'tools/list'), options).result.tools;

test('handleRpc answers initialize with molveau-skills and the package version, in both modes', () => {
  assert.equal(VERSION, PKG_VERSION);
  for (const options of [undefined, {}, remote]) {
    const r = handleRpc(rpc(1, 'initialize', { protocolVersion: '2025-06-18' }), options);
    assert.equal(r.id, 1);
    assert.equal(r.result.protocolVersion, '2025-06-18');
    assert.deepEqual(r.result.serverInfo, { name: 'molveau-skills', version: PKG_VERSION });
    assert.deepEqual(r.result.capabilities, { tools: {} });
  }
});

test('handleRpc returns null for notifications and an array for a batch', () => {
  assert.equal(handleRpc({ jsonrpc: '2.0', method: 'notifications/initialized' }, remote), null);
  const replies = handleRpc([rpc(1, 'ping'), { jsonrpc: '2.0', method: 'notifications/initialized' }, rpc(2, 'ping')], remote);
  assert.deepEqual(replies.map((r) => r.id), [1, 2]);
  assert.equal(handleRpc([{ jsonrpc: '2.0', method: 'notifications/initialized' }], remote), null);
});

test('the stdio server goes through handleRpc', () => {
  const src = readFileSync(join(ROOT, 'skills', '.mcp', 'server.mjs'), 'utf8');
  assert.match(src, /from '\.\/core\.mjs'/);
  assert.match(src, /handleRpc\(/);
  assert.ok(!/case 'tools\/call'/.test(src), 'the method switch lives in core.mjs only');
});

test('every tool carries a title and the four boolean hints, read-only and closed-world, in both modes', () => {
  for (const options of [{}, remote]) {
    const tools = listTools(options);
    assert.equal(tools.length, 5);
    for (const t of tools) {
      const a = t.annotations;
      assert.equal(typeof a?.title, 'string', `${t.name}: annotations.title`);
      assert.ok(a.title.length > 3);
      for (const k of ['readOnlyHint', 'destructiveHint', 'openWorldHint', 'idempotentHint']) {
        assert.equal(typeof a[k], 'boolean', `${t.name}: ${k} must be a boolean`);
      }
      assert.equal(a.readOnlyHint, true);
      assert.equal(a.destructiveHint, false);
      assert.equal(a.openWorldHint, false);
      assert.equal(a.idempotentHint, true);
    }
  }
});

test('remote detect_tells takes only code and filename; paths is not offered and is refused', () => {
  const schema = listTools(remote).find((t) => t.name === 'detect_tells');
  assert.deepEqual(Object.keys(schema.inputSchema.properties).sort(), ['code', 'filename']);
  assert.deepEqual(schema.inputSchema.required, ['code']);
  assert.ok(!/\bpaths\b|working directory/.test(schema.description), schema.description);
  const local = listTools({}).find((t) => t.name === 'detect_tells');
  assert.ok('paths' in local.inputSchema.properties, 'the stdio server keeps paths');

  for (const args of [{ paths: ['.'] }, { code: 'x', paths: ['.'] }, {}]) {
    const r = call('detect_tells', args, remote).result;
    assert.equal(r.isError, true, JSON.stringify(args));
  }
  assert.match(textOf(call('detect_tells', { paths: ['.'] }, remote).result), /paths/);
  const ok = call('detect_tells', { code: `<p>a ${EM} b</p>` }, remote).result;
  assert.ok(!ok.isError, textOf(ok));
  assert.equal(ok.structuredContent.count, 1);
});

test('remote mode never reads the working directory, even when given one', () => {
  const r = call('detect_tells', { paths: ['.'] }, { remote: true, cwd: ROOT }).result;
  assert.equal(r.isError, true);
  assert.ok(!/finding\(s\)/.test(textOf(r)));
});

test('remote inputs over 200,000 characters are a tool error, not a crash; stdio keeps no such cap', () => {
  assert.equal(MAX_INPUT, 200_000);
  const big = 'a'.repeat(MAX_INPUT + 1);
  for (const [name, args] of [
    ['detect_tells', { code: big }],
    ['detect_tells', { code: 'x', filename: big }],
    ['check_contrast', { foreground: big, background: '#fff' }],
    ['fr_typo', { text: big }],
    ['check_motion', { code: big }],
    ['get_playbook', { skill: 'ui', query: big }],
  ]) {
    const r = call(name, args, remote);
    assert.equal(r.error, undefined, name);
    assert.equal(r.result.isError, true, name);
    assert.match(textOf(r.result), /200,000/);
  }
  const atCap = call('fr_typo', { text: 'a'.repeat(MAX_INPUT) }, remote).result;
  assert.ok(!atCap.isError, 'exactly 200,000 characters is accepted');
  assert.ok(!call('fr_typo', { text: big }, {}).result.isError, 'stdio is unchanged');
});

// Every text the remote tools can return: each tool, and get_playbook for every skill with no query and with
// each of its section headings as the query, which surfaces every section the tool can serve.
function remoteOutputs() {
  const outs = [handleRpc(rpc(1, 'initialize', {}), remote), handleRpc(rpc(2, 'tools/list'), remote)];
  outs.push(call('detect_tells', { code: `<p>Fast ${EM} seamless</p>` }, remote));
  outs.push(call('check_contrast', { foreground: '#777', background: '#fff' }, remote));
  outs.push(call('fr_typo', { text: "Prix : 1 900 $ l'an", fix: true }, remote));
  outs.push(call('check_motion', { code: '.a { transition: all 200ms; }', filename: 'a.css' }, remote));
  for (const skill of SKILLS) {
    const first = call('get_playbook', { skill }, remote);
    outs.push(first);
    const queries = new Set([...first.result.structuredContent.sections, 'law 25 report closing line fixes', 'credit licence', 'further reading']);
    for (const query of queries) outs.push(call('get_playbook', { skill, query }, remote));
  }
  return outs;
}

test('no remote output promotes the studio: no molveau.ca and no Molveau Studio line', () => {
  const outs = remoteOutputs();
  assert.ok(outs.length > 100, `only ${outs.length} outputs checked`);
  for (const o of outs) {
    const s = JSON.stringify(o);
    assert.ok(!/molveau\.ca/i.test(s), `molveau.ca in ${s.slice(0, 200)}`);
    assert.ok(!/Molveau Studio/.test(s), `Molveau Studio in ${s.slice(0, 200)}`);
  }
});

test('remote get_playbook keeps the Law 25 report template, minus its closing line', () => {
  const r = call('get_playbook', { skill: 'loi-25-website' }, remote).result;
  const text = textOf(r);
  assert.match(text, /Law 25 audit of <site or repo>/);
  assert.match(text, /Open questions for the owner or a lawyer: <list>\n```/, 'the fence closes right after the template');
  assert.ok(!/\n{3,}/.test(r.content[0].text), 'no run of blank lines where a line was taken out');
  assert.match(text, /LégisQuébec/);
  // The local server and the skill itself are unchanged.
  assert.match(textOf(call('get_playbook', { skill: 'loi-25-website' }, {}).result), /molveau\.ca\/law-25/);
});

test('bundledFiles lists every file the core reads at run time, relative to the package root, all present', () => {
  const files = bundledFiles();
  for (const s of SKILLS) assert.ok(files.includes(`skills/${s}/SKILL.md`), s);
  for (const f of files) {
    assert.ok(!f.startsWith('/') && !f.includes('..'), f);
    assert.ok(existsSync(join(ROOT, f)), `${f} listed but missing`);
  }
  assert.ok(files.includes('skills/ui/references/playbook.md'));
});

test('importing the core reads no stdin and starts nothing', async () => {
  // stdin stays open: a module that listened on it would keep the process alive until the timer kills it.
  const child = spawn(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(CORE)}); console.log('imported');`], { stdio: ['pipe', 'pipe', 'pipe'] });
  let out = '';
  let err = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { err += d; });
  const timer = setTimeout(() => child.kill(), 5000);
  const [code, signal] = await new Promise((r) => child.on('close', (c, s) => r([c, s])));
  clearTimeout(timer);
  assert.equal(signal, null, 'the process had to be killed: something kept it alive');
  assert.equal(code, 0, err);
  assert.equal(out, 'imported\n');
  assert.equal(err, '');
});

test('PRIVACY.md describes the hosted endpoint: what it receives, that it stores none of it, the host logs', () => {
  const privacy = readFileSync(join(ROOT, 'PRIVACY.md'), 'utf8');
  const at = privacy.indexOf('## Hosted MCP endpoint');
  assert.ok(at >= 0, 'no "## Hosted MCP endpoint" section');
  const section = privacy.slice(at).split(/\n## /)[0];
  for (const must of ['https://www.molveau.ca/api/mcp', 'in memory', 'stores none', 'no account', 'cookie', 'https://vercel.com/legal/privacy-policy', 'IP address', 'general audiences']) {
    assert.ok(section.includes(must), `the section lacks "${must}"`);
  }
});

test('options.remote must be a boolean: anything else is refused, never read as local mode', () => {
  for (const remoteValue of ['yes', 1, 'true', {}, null]) {
    assert.throws(() => handleRpc(rpc(1, 'tools/list'), { remote: remoteValue }), TypeError, String(remoteValue));
  }
  assert.ok(handleRpc(rpc(1, 'tools/list'), { remote: false }).result);
  assert.ok(handleRpc(rpc(1, 'tools/list'), { remote: undefined }).result);
});

test('withoutPromotion takes out studio lines without leaving stray blank lines', async () => {
  const { withoutPromotion } = await import('../skills/.mcp/tools.mjs');
  assert.equal(withoutPromotion('See molveau.ca\n\nb'), 'b');
  assert.equal(withoutPromotion('a\n\nMolveau Studio does it\n\nb'), 'a\n\nb');
  assert.equal(withoutPromotion('a\n  \nmolveau.ca/law-25\n  \nb'), 'a\n  \nb');
  assert.equal(withoutPromotion('x\n\nmolveau.ca\n```'), 'x\n```');
  assert.equal(withoutPromotion('- a\n- molveau.ca/guides\n'), '- a\n');
  assert.equal(withoutPromotion('plain\ntext'), 'plain\ntext');
});

test('remote get_playbook filters its structured data too', () => {
  // The real remote get_playbook, fed a skill file that names the studio in a heading and in the body.
  const readFile = (p) => (p.endsWith('SKILL.md') ? '# T\n\n## Work with Molveau Studio\n\nmolveau.ca\n\n## Plain\n\nbody\n' : null);
  const r = handleRpc(rpc(1, 'tools/call', { name: 'get_playbook', arguments: { skill: 'saas', query: 'studio plain' } }), { remote: true, readFile });
  assert.ok(!/molveau/i.test(JSON.stringify(r)), JSON.stringify(r));
  const first = handleRpc(rpc(2, 'tools/call', { name: 'get_playbook', arguments: { skill: 'saas' } }), { remote: true, readFile });
  assert.ok(!/molveau/i.test(JSON.stringify(first)), JSON.stringify(first));
  assert.deepEqual(first.result.structuredContent.sections, ['# T', '## Plain']);
});

test('fr_typo stays linear: a cap-sized text full of findings is checked in well under a second', () => {
  const text = ' :\n'.repeat(Math.floor(MAX_INPUT / 3));
  const start = performance.now();
  const { result } = call('fr_typo', { text }, remote);
  const elapsed = performance.now() - start;
  const lines = Math.floor(MAX_INPUT / 3);
  assert.equal(result.structuredContent.count, lines);
  assert.ok(elapsed < 1000, `took ${Math.round(elapsed)} ms`);
  // Positions are still exact on the last line.
  assert.deepEqual(result.structuredContent.findings.at(-1), { line: lines, column: 1, rule: 'high-punct', match: ' :' });
});

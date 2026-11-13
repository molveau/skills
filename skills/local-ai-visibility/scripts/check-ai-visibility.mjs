#!/usr/bin/env node
// check-ai-visibility: check that a local business site can be found and cited by AI assistants.
// Zero dependencies. Usage: node check-ai-visibility.mjs <url> [--json]
// Exit: 0 all ok, 1 findings, 2 usage error or the page itself cannot be fetched.
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const AI_CRAWLERS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Google-Extended',
  'ClaudeBot', 'Claude-SearchBot', 'Applebot-Extended', 'Bingbot',
];

const LOCAL_TYPES = new Set([
  'localbusiness', 'professionalservice', 'legalservice', 'attorney', 'notary', 'accountingservice',
  'dentist', 'physician', 'medicalbusiness', 'medicalclinic', 'optician', 'physiotherapy', 'healthandbeautybusiness',
  'homeandconstructionbusiness', 'plumber', 'electrician', 'hvacbusiness', 'roofingcontractor', 'generalcontractor',
  'locksmith', 'movingcompany', 'housepainter', 'autorepair', 'autodealer', 'realestateagent', 'financialservice',
  'insuranceagency', 'restaurant', 'foodestablishment', 'cafeorcoffeeshop', 'bakery', 'store', 'hairsalon',
  'beautysalon', 'childcare', 'veterinarycare', 'travelagency', 'selfstorage',
]);

// RFC 9309: merge every group that names the bot; use the "*" groups (merged) only when none does.
// For the path "/", the longest matching rule wins ("*" and "$" supported) and Allow wins a tie.
function ruleMatches(pattern, path) {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const re = new RegExp(`^${body.split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}${anchored ? '$' : ''}`);
  return re.test(path);
}

export function botAllowed(robotsTxt, bot) {
  const groups = [];
  let cur = null;
  let lastWasAgent = false;
  for (const raw of String(robotsTxt || '').split(/\r\n|\r|\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'user-agent') {
      if (!lastWasAgent || !cur) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (cur && (key === 'disallow' || key === 'allow') && value) cur.rules.push({ allow: key === 'allow', value });
    }
  }
  const name = bot.toLowerCase();
  let chosen = groups.filter((g) => g.agents.includes(name));
  if (!chosen.length) chosen = groups.filter((g) => g.agents.includes('*'));
  let best = null;
  for (const r of chosen.flatMap((g) => g.rules)) {
    if (!ruleMatches(r.value, '/')) continue;
    if (!best || r.value.length > best.value.length || (r.value.length === best.value.length && r.allow && !best.allow)) best = r;
  }
  return !best || best.allow;
}

const tags = (html, name) => String(html || '').match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || [];
const attr = (tag, name) => {
  const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  return m ? (m[2] ?? m[3] ?? m[4]) : undefined;
};

function flatten(node, out = []) {
  if (Array.isArray(node)) node.forEach((n) => flatten(n, out));
  else if (node && typeof node === 'object') {
    out.push(node);
    if (node['@graph']) flatten(node['@graph'], out);
  }
  return out;
}
const typesOf = (n) => [].concat(n['@type'] || []).map((t) => String(t).replace(/^(?:https?:\/\/schema\.org\/|schema:)/i, '').toLowerCase());
const has = (v) => v !== undefined && v !== null && !(typeof v === 'string' && !v.trim()) && !(Array.isArray(v) && !v.length);

export function checkSite({ robotsTxt, llmsTxt, html, url } = {}) {
  const out = [];
  const add = (rule, ok, detail) => out.push({ rule, ok, detail });

  if (robotsTxt === null || robotsTxt === undefined) {
    add('robots.txt', false, 'robots.txt not found');
  } else {
    for (const bot of AI_CRAWLERS) {
      const ok = botAllowed(robotsTxt, bot);
      add(`robots:${bot}`, ok, ok ? 'allowed' : 'blocked by robots.txt');
    }
  }

  add('llms.txt', has(llmsTxt) && String(llmsTxt).trim().length > 0, has(llmsTxt) ? 'present' : 'llms.txt missing or empty');

  const page = String(html || '');
  const blocks = [...page.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  if (!blocks.length) {
    add('jsonld', false, 'no JSON-LD block found');
  } else {
    const nodes = [];
    let bad = 0;
    for (const b of blocks) {
      try { flatten(JSON.parse(b), nodes); } catch (e) { bad += 1; add('jsonld:parse', false, `JSON-LD block does not parse: ${e.message}`); }
    }
    let biz = nodes.find((n) => typesOf(n).some((t) => LOCAL_TYPES.has(t)));
    let unknown = null;
    if (!biz) {
      unknown = nodes.find((n) => n['@type'] && (has(n.address) || has(n.telephone)));
      biz = unknown;
    }
    if (!biz) {
      if (!bad) add('jsonld', false, 'no LocalBusiness or ProfessionalService type in the JSON-LD');
    } else {
      if (unknown) add('jsonld:type', false, `type ${[].concat(biz['@type']).join(', ')} not recognised as a LocalBusiness subtype, check it`);
      else add('jsonld', true, `type ${[].concat(biz['@type']).join(', ')}`);
      const need = [
        ['name', ['name']], ['url', ['url']], ['address', ['address']], ['telephone', ['telephone']],
        ['hours', ['openingHoursSpecification', 'openingHours']], ['price', ['priceRange', 'offers']], ['sameAs', ['sameAs']],
      ];
      for (const [label, keys] of need) {
        const ok = keys.some((k) => has(biz[k]));
        add(`jsonld:${label}`, ok, ok ? 'present' : `missing ${keys.join(' or ')}`);
      }
    }
  }

  const title = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(page);
  add('title', !!(title && title[1].trim()), title && title[1].trim() ? 'present' : '<title> missing or empty');
  const desc = tags(page, 'meta').find((t) => (attr(t, 'name') || '').toLowerCase() === 'description');
  const descOk = !!(desc && (attr(desc, 'content') || '').trim());
  add('meta-description', descOk, descOk ? 'present' : 'meta description missing or empty');

  const alternates = tags(page, 'link').filter((t) => /alternate/i.test(attr(t, 'rel') || '') && attr(t, 'hreflang'));
  // A page with a lang that links to another language version must declare hreflang alternates in the head.
  const htmlTag = tags(page, 'html')[0];
  const lang = ((htmlTag && attr(htmlTag, 'lang')) || '').toLowerCase().slice(0, 2);
  let host = '';
  try { host = new URL(url).host; } catch { /* no url given */ }
  const pathLang = (href) => {
    let h = href || '';
    const full = /^https?:\/\/([^/]+)(\/.*)?$/i.exec(h);
    if (full) { if (!host || full[1].toLowerCase() !== host.toLowerCase()) return null; h = full[2] || '/'; }
    const m = /^\/(en|fr)(?:[/?#]|$)/i.exec(h);
    return m ? m[1].toLowerCase() : null;
  };
  const linksOther = tags(page, 'a').some((t) => attr(t, 'hreflang') || (lang && pathLang(attr(t, 'href')) && pathLang(attr(t, 'href')) !== lang));
  if (alternates.length) add('hreflang', true, `${alternates.length} alternates`);
  else if (linksOther) add('hreflang', false, 'links to another language but declares no hreflang alternates');
  else add('hreflang', true, 'single language');
  return out;
}

export async function get(url, fetchImpl = fetch, ms = 10_000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetchImpl(url, { signal: ctl.signal, redirect: 'follow', headers: { 'user-agent': 'molveau-check-ai-visibility/1' } });
    return { ok: res.ok, status: res.status, text: res.ok ? await res.text() : '' };
  } finally {
    clearTimeout(timer);
  }
}

async function main(argv) {
  const json = argv.includes('--json');
  const args = argv.filter((a) => a !== '--json');
  if (args.length !== 1) {
    process.stderr.write('Usage: node check-ai-visibility.mjs <url> [--json]\n');
    return 2;
  }
  let base;
  try {
    base = new URL(/^https?:\/\//i.test(args[0]) ? args[0] : `https://${args[0]}`);
  } catch {
    process.stderr.write(`Usage: not a valid URL: ${args[0]}\n`);
    return 2;
  }
  let page;
  try {
    page = await get(base.href);
  } catch (e) {
    process.stderr.write(`Cannot fetch ${base.href}: ${e.name === 'AbortError' ? 'timeout after 10 s' : (e.cause?.code || e.message)}\n`);
    return 2;
  }
  if (!page.ok) {
    process.stderr.write(`Cannot fetch ${base.href}: HTTP ${page.status}\n`);
    return 2;
  }
  const side = async (path) => {
    try {
      const r = await get(new URL(path, base.origin).href);
      return r.ok ? r.text : null;
    } catch {
      return null;
    }
  };
  const [robotsTxt, llmsTxt] = await Promise.all([side('/robots.txt'), side('/llms.txt')]);
  const findings = checkSite({ robotsTxt, llmsTxt, html: page.text, url: base.href });
  const bad = findings.filter((f) => !f.ok);
  if (json) process.stdout.write(`${JSON.stringify(findings, null, 2)}\n`);
  else {
    for (const f of findings) process.stdout.write(`${f.ok ? 'ok  ' : 'FIX '} ${f.rule}: ${f.detail}\n`);
    process.stdout.write(`${bad.length ? `${bad.length} to fix` : 'All checks pass'}\n`);
  }
  return bad.length ? 1 : 0;
}

// Run as a CLI only when executed directly. Compare real paths: skills are often installed as symlinks.
function isMainModule() {
  if (!process.argv[1]) return false;
  let resolved;
  try { resolved = realpathSync(process.argv[1]); } catch { resolved = process.argv[1]; }
  return import.meta.url === pathToFileURL(resolved).href;
}

if (isMainModule()) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}

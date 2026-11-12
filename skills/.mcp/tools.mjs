// The six tools of the molveau-skills MCP server. Each one wraps a skill script, so the server and the CLIs
// always agree. All of them are read-only: they read the skills' own files and, for detect_tells with paths,
// files inside the server's working directory, and nothing else. No network, no writes. REMOTE_TOOLS are the
// same six for a hosted endpoint: no paths, so only the skills' own files are read, and no studio line.
import { readFileSync, readdirSync, statSync, realpathSync, existsSync } from 'node:fs';
import { join, resolve, relative, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectTells, isScannable, sfcAsHtml, formatFindings as formatTells, SKIP_DIRS } from '../anti-slop/scripts/detect-tells.mjs';
import { parseColor, composite, contrastRatio, threshold, formatRatio } from '../anti-slop/scripts/story-contrast.mjs';
import { checkFr, fixFr, visible } from '../french-typography/scripts/fr-typo.mjs';
import { checkWriting, detectLang } from '../writing/scripts/check-writing.mjs';
import { checkMotion, formatFindings as formatMotion, EXTS as MOTION_EXTS } from '../motion/scripts/check-motion.mjs';

const SKILLS_DIR = fileURLToPath(new URL('..', import.meta.url));

export const SKILLS = [
  'anti-slop', 'design-grill', 'design-inspiration-index', 'french-typography', 'loi-25-website',
  'motion', 'saas', 'ui', 'ux', 'vitrine', 'workflow', 'writing',
];

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

// ---------- arguments ----------

// Checks arguments against the small JSON Schema subset the tools use. Returns an error message or null.
export function checkArgs(schema, args) {
  if (args === undefined || args === null) args = {};
  if (typeof args !== 'object' || Array.isArray(args)) return 'Arguments must be an object.';
  const props = schema.properties ?? {};
  for (const key of Object.keys(args)) {
    const accepted = Object.keys(props).join(', ');
    if (!(key in props)) return `Unknown argument "${key}". Accepted: ${accepted}.`;
  }
  for (const key of schema.required ?? []) {
    if (args[key] === undefined) return `Missing required argument "${key}".`;
  }
  for (const [key, value] of Object.entries(args)) {
    const p = props[key];
    if (value === undefined) continue;
    if (p.type === 'string' && typeof value !== 'string') return `"${key}" must be a string.`;
    if (p.type === 'boolean' && typeof value !== 'boolean') return `"${key}" must be true or false.`;
    if (p.type === 'number') {
      if (typeof value !== 'number' || !Number.isFinite(value)) return `"${key}" must be a number.`;
      if (p.exclusiveMinimum !== undefined && value <= p.exclusiveMinimum) return `"${key}" must be above ${p.exclusiveMinimum}.`;
    }
    if (p.type === 'array') {
      if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) return `"${key}" must be a list of strings.`;
      if (p.minItems !== undefined && value.length < p.minItems) return `"${key}" needs at least ${p.minItems} item(s).`;
    }
    if (p.enum && !p.enum.includes(value)) return `"${key}" must be one of: ${p.enum.join(', ')}.`;
  }
  return null;
}

// ---------- files inside the working directory ----------

// Reads the files and folders named in `paths`, resolved against `root`, the way the detect-tells CLI walks
// them (same skipped folders and files). Every path, and every entry met while walking, is resolved to its
// real path and refused or skipped when it leaves `root`, so a symlink cannot reach outside.
export function collectInside(root, paths, { maxFiles = 2000, maxBytes = 1_000_000 } = {}) {
  const base = realpathSync(root);
  const prefix = base.endsWith(sep) ? base : base + sep; // the filesystem root already ends with one
  const inside = (p) => p === base || p.startsWith(prefix);
  const files = [];
  const seen = new Set();
  let truncated = false;

  const walk = (real) => {
    if (truncated) return;
    let st;
    try { st = statSync(real); } catch { return; }
    if (seen.has(real)) return;
    seen.add(real);
    if (st.isDirectory()) {
      let names;
      try { names = readdirSync(real).sort(); } catch { return; }
      for (const name of names) {
        if (SKIP_DIRS.has(name)) continue;
        let child;
        try { child = realpathSync(join(real, name)); } catch { continue; } // broken link
        if (inside(child)) walk(child);
        if (truncated) return;
      }
      return;
    }
    if (!st.isFile() || st.size > maxBytes || !isScannable(real, st.size, false)) return;
    if (files.length >= maxFiles) { truncated = true; return; }
    try {
      files.push({ path: relative(base, real).split(sep).join('/'), text: readFileSync(real, 'utf8') });
    } catch { /* unreadable: skip */ }
  };

  for (const p of paths) {
    let real;
    try { real = realpathSync(resolve(base, p)); } catch { throw new Error(`No such file or folder: ${p}`); }
    if (!inside(real)) throw new Error(`Refused "${p}": it is outside the working directory (${base}).`);
    walk(real);
  }
  return { files, truncated };
}

// ---------- playbooks ----------

// Every file get_playbook can read, relative to the package root.
export const PLAYBOOK_FILES = SKILLS.flatMap((s) => ['skills/' + s + '/SKILL.md', 'skills/' + s + '/references/playbook.md']);

// ctx.readFile, when given, serves those files by their package-relative path (for a runtime without a file
// system); otherwise they are read beside this module.
const readSkillFile = (skill, file, ctx) => {
  if (typeof ctx?.readFile === 'function') return ctx.readFile('skills/' + skill + '/' + file) ?? null;
  const p = join(SKILLS_DIR, skill, file);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
};

// Splits Markdown into "## " sections (headings inside fenced code do not count). Text before the first one
// is a section too, headed by the "# " title when there is one.
export function sections(md) {
  const out = [];
  let cur = { heading: '', lines: [] };
  let fence = null;
  for (const line of md.split('\n')) {
    const f = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      if (f && f[1][0] === fence[0] && f[1].length >= fence.length) fence = null;
    } else if (f) {
      fence = f[1];
    } else if (/^## /.test(line)) {
      out.push(cur);
      cur = { heading: line.trim(), lines: [] };
    }
    cur.lines.push(line);
  }
  out.push(cur);
  return out
    .map((s) => {
      const text = s.lines.join('\n').trim();
      const title = s.heading || (text.match(/^# .*$/m)?.[0] ?? '');
      return { heading: title, text };
    })
    .filter((s) => s.text);
}

const STOP = new Set(['the', 'and', 'for', 'with', 'how', 'what', 'when', 'where', 'which', 'do', 'to', 'of', 'in', 'on', 'a', 'an', 'is', 'it', 'or', 'my', 'i']);
const occurrences = (hay, needle) => {
  let n = 0;
  for (let i = hay.indexOf(needle); i >= 0; i = hay.indexOf(needle, i + needle.length)) n++;
  return n;
};

function score(section, words, phrase) {
  const head = section.heading.toLowerCase();
  const body = section.text.toLowerCase();
  let s = 0;
  let hit = 0;
  for (const w of words) {
    const h = occurrences(head, w);
    const b = Math.min(occurrences(body, w), 20);
    if (h || b) hit++;
    s += h * 10 + b;
  }
  if (hit === 0) return 0;
  if (words.length > 1) {
    s += occurrences(head, phrase) * 50 + Math.min(occurrences(body, phrase), 10) * 5;
    s *= hit / words.length;
  }
  return s;
}

const LIMIT = 12_000;

function fitSections(picked) {
  let out = '';
  for (const s of picked) {
    const sepText = out ? '\n\n' : '';
    const room = LIMIT - out.length - sepText.length;
    if (s.text.length <= room) { out += sepText + s.text; continue; }
    const cut = '\n\n[cut at 12,000 characters; ask a narrower query]';
    if (room > 600 || !out) out += sepText + s.text.slice(0, room - cut.length) + cut;
    break;
  }
  return out;
}

function getPlaybook({ skill, query }, ctx) {
  const skillMd = readSkillFile(skill, 'SKILL.md', ctx);
  if (skillMd === null) throw new Error(`skills/${skill}/SKILL.md is missing from this install.`);
  const playbook = readSkillFile(skill, 'references/playbook.md', ctx);
  const searched = playbook ?? skillMd;
  const source = playbook ? `skills/${skill}/references/playbook.md` : `skills/${skill}/SKILL.md`;
  const all = sections(searched);
  const headings = all.map((s) => s.heading).filter(Boolean);
  const footerFor = (from) => `From ${from}. Ask again with a query to read other sections:\n${headings.join('\n')}`;

  const words = [...new Set(String(query ?? '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1 && !STOP.has(w)))];
  if (!words.length) {
    const gate = sections(skillMd).find((s) => /^## Direction gate\b/.test(s.heading));
    const first = playbook && sections(playbook).find((s) => /^## Do this first\b/.test(s.heading));
    const text = gate ? gate.text : first ? first.text : skillMd.split('\n').slice(0, 80).join('\n');
    const from = gate ? `skills/${skill}/SKILL.md` : first ? source : `skills/${skill}/SKILL.md (first 80 lines)`;
    return { text, footer: footerFor(from), data: { skill, source: from, sections: headings } };
  }

  const phrase = words.join(' ');
  const ranked = all
    .map((s, i) => ({ ...s, i, score: score(s, words, phrase) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, 3);
  if (!ranked.length) {
    return { text: `No section of ${source} matches "${query}". Sections:\n${headings.join('\n')}`, data: { skill, source, matched: [], sections: headings } };
  }
  // No footer here: the reply holds at most 12,000 characters in all.
  return { text: fitSections(ranked), data: { skill, source, matched: ranked.map((s) => s.heading) } };
}

// ---------- the tools ----------

// Line and column (both from 1) of each index in text. The line starts are found once and searched,
// so a text with a finding on every line costs n log n, not n squared.
const lineCols = (text) => {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return (index) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= index) lo = mid; else hi = mid - 1;
    }
    return { line: lo + 1, column: index - starts[lo] + 1 };
  };
};

const supportedColours = '#rgb, #rgba, #rrggbb, #rrggbbaa, rgb(), rgba(), oklch(), oklab(), color(srgb r g b) and transparent (hsl() and colour names are not read)';
const WHITE = { r: 255, g: 255, b: 255, a: 1 };

export const TOOLS = [
  {
    name: 'detect_tells',
    title: 'Detect AI-look tells',
    description:
      'Scan UI code for the mechanical "vibe-coded" tells of the anti-slop skill: purple gradients, gradient text, emoji in copy, side-stripe borders, glass without a scrolling surface, Lucide outside the icons module, fade-in on scroll, buttons that fade on hover, em dashes and buzzwords in copy, Space Grotesk with Instrument Serif. Give `code` (scanned as `filename`, default snippet.tsx) or `paths` (files or folders inside the working directory; node_modules, .git and build folders are skipped, as are tests). Returns one line per finding (path:line  #N label  match) and a summary.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Source to scan, such as a component or a stylesheet.' },
        filename: { type: 'string', description: 'Name that sets the file kind for `code` (.tsx, .jsx, .ts, .js, .css, .html, .vue, .svelte, .md, .mdx, .json). Default snippet.tsx.' },
        paths: { type: 'array', items: { type: 'string' }, minItems: 1, description: 'Files or folders to scan, relative to the working directory. At most 2,000 files, 1 MB each.' },
      },
      additionalProperties: false,
    },
    annotations: { title: 'Detect AI-look tells', ...READ_ONLY },
    run({ code, filename, paths }, ctx) {
      if (code !== undefined && paths !== undefined) throw new Error('Give either code or paths, not both.');
      let files;
      let truncated = false;
      if (code !== undefined) {
        const name = filename || 'snippet.tsx';
        const scanned = sfcAsHtml(name);
        if (!isScannable(scanned, 0, true)) throw new Error(`"${name}" is not a kind detect_tells reads: use .tsx, .jsx, .ts, .js, .css, .html, .vue, .svelte, .md, .mdx or .json.`);
        files = [{ path: scanned, text: code }];
      } else if (paths) {
        ({ files, truncated } = collectInside(ctx.cwd, paths));
      } else {
        throw new Error('Give code (a snippet) or paths (files or folders inside the working directory).');
      }
      const findings = detectTells(files).map((f) => (code !== undefined ? { ...f, path: filename || 'snippet.tsx' } : f));
      let text = formatTells(findings, files.length);
      if (truncated) text += 'Stopped at 2,000 files: scan a narrower folder for the rest.\n';
      return { text, data: { count: findings.length, scanned: files.length, truncated, findings } };
    },
  },
  {
    name: 'check_contrast',
    title: 'Check colour contrast',
    description:
      'WCAG contrast ratio of a text colour on a background, with the threshold that applies (WCAG 1.4.3 AA: 4.5:1, or 3:1 for large text, 24px and up or 18.66px bold and up; 1.4.6 AAA: 7:1 or 4.5:1), and for each level whether the pair meets it (a success) or fails it. Reads #hex, rgb(), rgba(), oklch(), oklab() and color(srgb). A translucent text colour is laid over the background, a translucent background over white.',
    inputSchema: {
      type: 'object',
      properties: {
        foreground: { type: 'string', description: 'Text colour, such as #4b5563 or oklch(0.45 0.02 260).' },
        background: { type: 'string', description: 'Background colour behind the text.' },
        fontSizePx: { type: 'number', exclusiveMinimum: 0, description: 'Font size in CSS pixels. Default 16.' },
        bold: { type: 'boolean', description: 'True for a weight of 700 or more. Default false.' },
      },
      required: ['foreground', 'background'],
      additionalProperties: false,
    },
    annotations: { title: 'Check colour contrast', ...READ_ONLY },
    run({ foreground, background, fontSizePx = 16, bold = false }) {
      const fg = parseColor(foreground);
      const bgRaw = parseColor(background);
      for (const [value, parsed] of [[foreground, fg], [background, bgRaw]]) {
        if (!parsed) throw new Error(`Cannot read the colour "${value}". Supported: ${supportedColours}.`);
      }
      const bg = bgRaw.a < 1 ? composite(bgRaw, WHITE) : bgRaw;
      const ratio = contrastRatio(fg, bg);
      const aaNeeded = threshold(fontSizePx, bold ? 700 : 400);
      const large = aaNeeded === 3;
      const aaaNeeded = large ? 4.5 : 7;
      const aa = { required: aaNeeded, ok: ratio >= aaNeeded };
      const aaa = { required: aaaNeeded, ok: ratio >= aaaNeeded };
      const word = (ok) => (ok ? 'meets' : 'fails');
      const lines = [
        `Contrast ${formatRatio(ratio)} (${foreground} on ${background}, ${fontSizePx}px ${bold ? 'bold' : 'regular'}, ${large ? 'large' : 'normal'} text)`,
        `AA, WCAG 1.4.3 (needs ${aaNeeded}:1): ${word(aa.ok)}`,
        `AAA, WCAG 1.4.6 (needs ${aaaNeeded}:1): ${word(aaa.ok)}`,
      ];
      if (bgRaw.a < 1) lines.push('The background is translucent: measured over white.');
      if (fg.a < 1) lines.push('The text colour is translucent: laid over the background first.');
      return { text: lines.join('\n') + '\n', data: { ratio: formatRatio(ratio), large, aa, aaa } };
    },
  },
  {
    name: 'fr_typo',
    title: 'French typography',
    description:
      'Check French (Québec and France) typography in a piece of text: the no-break space before : ; ! ? and inside « », the narrow no-break space between digit groups, the space before $ and %, em dashes and straight apostrophes. With fix: true, returns the corrected text and how many characters changed (em dashes are left for a person to rewrite).',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'French text, such as a UI string or a paragraph.' },
        fix: { type: 'boolean', description: 'Return the corrected text instead of only the findings. Default false.' },
      },
      required: ['text'],
      additionalProperties: false,
    },
    annotations: { title: 'French typography', ...READ_ONLY },
    run({ text, fix = false }) {
      const list = (src) => {
        const at = lineCols(src);
        return checkFr(src).map((f) => ({ ...at(f.index), rule: f.rule, match: f.match }));
      };
      const quoted = (match) => JSON.stringify(visible(match));
      const lines = (found) => found.map((f) => `${f.line}:${f.column} ${f.rule} ${quoted(f.match)}\n`).join('');
      if (!fix) {
        const found = list(text);
        return { text: lines(found) + `${found.length} finding(s)\n`, data: { count: found.length, findings: found } };
      }
      const fixed = fixFr(text);
      let changes = 0;
      if (fixed.length === text.length) {
        for (let i = 0; i < text.length; i++) if (text[i] !== fixed[i]) changes++;
      } else {
        changes = Math.max(0, checkFr(text).length - checkFr(fixed).length);
      }
      const left = list(fixed);
      const note = left.some((f) => f.rule === 'em-dash') ? ' (em dashes need a rewrite by hand)' : '';
      const out = `${changes} change(s), ${left.length} finding(s) left${note}\n${lines(left)}\nFixed text:\n${fixed}\n`;
      return { text: out, data: { text: fixed, changes, count: left.length, findings: left } };
    },
  },
  {
    name: 'check_writing',
    title: 'Check writing',
    description:
      'Scan English or French prose for the patterns that read as AI-written: stock openers and closers, filler transitions, hedging, inflated vocabulary, em dashes and the like. Returns one line per finding (line:column, rule, match) and the detected language. A hit means "look here", not "wrong".',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The prose to check, such as a paragraph, an email or a README.' },
        lang: { type: 'string', enum: ['auto', 'en', 'fr'], description: 'Language of the text. Default auto: detected from the text.' },
      },
      required: ['text'],
      additionalProperties: false,
    },
    annotations: { title: 'Check writing', ...READ_ONLY },
    run({ text, lang = 'auto' }) {
      const resolved = lang === 'auto' ? detectLang(text) : lang;
      const at = lineCols(text);
      const findings = checkWriting(text, { lang }).map((f) => ({ ...at(f.index), rule: f.rule, match: f.match }));
      const lines = findings.map((f) => `${f.line}:${f.column} ${f.rule} ${JSON.stringify(f.match)}\n`).join('');
      return { text: lines + `${findings.length} finding(s) (${resolved})\n`, data: { count: findings.length, lang: resolved, findings } };
    },
  },
  {
    name: 'check_motion',
    title: 'Check motion',
    description:
      'Scan animation code against the motion skill guardrails: scroll-reveal and smooth-scroll libraries, whileInView, transition-all, a transition list naming only transform while Tailwind v4 moves with translate, scale or rotate, and motion with no reduced-motion handling. Give the code and a filename that sets its kind (.tsx, .jsx, .ts, .js, .mjs, .cjs, .css, .html; default snippet.tsx).',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Source to scan.' },
        filename: { type: 'string', description: 'Name that sets the file kind. Default snippet.tsx.' },
      },
      required: ['code'],
      additionalProperties: false,
    },
    annotations: { title: 'Check motion', ...READ_ONLY },
    run({ code, filename }) {
      const name = filename || 'snippet.tsx';
      if (!MOTION_EXTS.has(extname(name).toLowerCase())) {
        throw new Error(`"${name}" is not a kind check_motion reads: use ${[...MOTION_EXTS].join(', ')}.`);
      }
      const findings = checkMotion([{ path: name, text: code }]);
      return { text: formatMotion(findings, 1), data: { count: findings.length, findings } };
    },
  },
  {
    name: 'get_playbook',
    title: 'Read a skill playbook',
    description:
      'Read the doctrine of one Molveau skill. Without a query: its direction gate (the five lines to write before building a screen), else its playbook "Do this first" block, else the top of its SKILL.md. With a query (such as "empty states", "reduced motion", "dark mode"): the up to three playbook sections that match best, at most 12,000 characters.',
    inputSchema: {
      type: 'object',
      properties: {
        skill: { type: 'string', enum: SKILLS, description: 'Which skill.' },
        query: { type: 'string', description: 'Words to look for in the section headings and bodies.' },
      },
      required: ['skill'],
      additionalProperties: false,
    },
    annotations: { title: 'Read a skill playbook', ...READ_ONLY },
    run: getPlaybook,
  },
];

// ---------- remote mode ----------

// A line that points at the studio: the Law 25 report's closing line in either language, the further-reading
// link to the studio's guides, and any line like them added later.
const STUDIO_LINE = /molveau\.ca|Molveau Studio/i;

// Takes out every studio line. A blank line left doubled, at the top, or just before a closing fence goes too.
export function withoutPromotion(text) {
  const lines = text.split('\n');
  const blank = (line) => line !== undefined && line.trim() === '';
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!STUDIO_LINE.test(lines[i])) { out.push(lines[i]); continue; }
    const next = lines[i + 1];
    const prevBlank = out.length > 0 && blank(out[out.length - 1]);
    if ((!out.length || prevBlank) && blank(next)) i++;
    else if (prevBlank && (next === undefined || /^\s*(`{3,}|~{3,})\s*$/.test(next))) out.pop();
  }
  return out.join('\n');
}

// The same filter over structured data: strings are filtered, list items naming the studio are dropped.
function dataWithoutPromotion(value) {
  if (typeof value === 'string') return withoutPromotion(value);
  if (Array.isArray(value)) return value.filter((v) => !(typeof v === 'string' && STUDIO_LINE.test(v))).map(dataWithoutPromotion);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, dataWithoutPromotion(v)]));
  return value;
}

const byName = (name) => TOOLS.find((t) => t.name === name);

function remoteDetectTells() {
  const local = byName('detect_tells');
  const { paths, ...properties } = local.inputSchema.properties;
  return {
    ...local,
    description: local.description.replace(/ Give `code` .*? Returns /, ' Give `code` (scanned as `filename`, default snippet.tsx). Returns '),
    inputSchema: { ...local.inputSchema, properties, required: ['code'] },
    run(args) {
      if (args.paths !== undefined) throw new Error('This server scans only the code you send: paths is not accepted.');
      return local.run(args, {});
    },
  };
}

function remoteGetPlaybook() {
  const local = byName('get_playbook');
  return {
    ...local,
    run(args, ctx) {
      const out = local.run(args, ctx);
      return {
        text: withoutPromotion(out.text),
        ...(out.footer ? { footer: withoutPromotion(out.footer) } : {}),
        ...(out.data ? { data: dataWithoutPromotion(out.data) } : {}),
      };
    },
  };
}

export const REMOTE_TOOLS = TOOLS.map((t) => (t.name === 'detect_tells' ? remoteDetectTells() : t.name === 'get_playbook' ? remoteGetPlaybook() : t));

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { checkMotion } from '../skills/motion/scripts/check-motion.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'skills', 'motion', 'scripts', 'check-motion.mjs');
const rules = (path, text) => checkMotion([{ path, text }]).map((f) => f.rule);

test('scroll-reveal: smooth-scroll and scroll-animation libraries', () => {
  for (const src of [
    `import Lenis from 'lenis';`,
    `import Lenis from "lenis/react";`,
    `import Lenis from '@studio-freight/lenis';`,
    `import AOS from 'aos';`,
    `<div data-aos="fade-up" />`,
  ]) assert.ok(rules('a.tsx', src).includes('scroll-reveal'), src);
  assert.ok(!rules('a.tsx', `import { Reveal } from '@/components/reveal';`).includes('scroll-reveal'), 'project component names are not generic');
  assert.ok(!rules('a.tsx', `// import Lenis from 'lenis';`).includes('scroll-reveal'));
});

test('while-in-view', () => {
  assert.ok(rules('a.tsx', '<motion.div whileInView={{ opacity: 1 }} />').includes('while-in-view'));
  assert.ok(!rules('a.tsx', '/* whileInView was removed */').includes('while-in-view'));
});

test('transition-all: Tailwind class and CSS declaration', () => {
  assert.ok(rules('a.tsx', '<div className="transition-all duration-200" />').includes('transition-all'));
  assert.ok(rules('a.css', '.a { transition: all .2s; }').includes('transition-all'));
  assert.ok(rules('a.css', '.a { transition:all .2s; }').includes('transition-all'));
  assert.ok(rules('a.css', '.a { transition-property: all; }').includes('transition-all'));
  assert.ok(!rules('a.css', '.a { transition: opacity .2s; }').includes('transition-all'));
});

test('transform-in-arbitrary-transition: only when the literal moves things', () => {
  const bad = `<div className="hover:-translate-y-1 transition-[transform,opacity]" />`;
  assert.ok(rules('a.tsx', bad).includes('transform-in-arbitrary-transition'));
  assert.ok(rules('a.tsx', `"active:scale-95 [transition:transform_150ms]"`).includes('transform-in-arbitrary-transition'));
  assert.ok(!rules('a.tsx', `<div className="hover:-translate-y-1 transition-[translate,opacity]" />`).includes('transform-in-arbitrary-transition'));
  assert.ok(!rules('a.tsx', `<div className="hover:-translate-y-1 transition-[transform,translate]" />`).includes('transform-in-arbitrary-transition'));
  assert.ok(rules('a.tsx', `<div className="hover:rotate-3 transition-[transform]" />`).includes('transform-in-arbitrary-transition'), 'rotate');
  const split = `<div className={cn(\n  'hover:-translate-y-1',\n  open && 'scale-100',\n  'transition-[transform,opacity] duration-200',\n)} />`;
  assert.ok(rules('a.tsx', split).includes('transform-in-arbitrary-transition'), 'moving class and list in different literals');
  assert.ok(!rules('a.tsx', `<div className={cn('bg-red', 'transition-[transform,opacity]')} /><p className="scale-95" />`).includes('transform-in-arbitrary-transition'), 'separate expressions');
  assert.ok(!rules('a.tsx', `<div className="bg-red transition-[transform,opacity]" />`).includes('transform-in-arbitrary-transition'));
});

test('no-reduced-motion: any rAF or @keyframes without a reduced-motion call or query', () => {
  const tick = `function tick(now) { frame = requestAnimationFrame(tick); draw(now); }\nframe = requestAnimationFrame(tick);`;
  assert.ok(rules('a.tsx', tick).includes('no-reduced-motion'), 'self-scheduling loop');
  assert.ok(!rules('a.tsx', `useEffect(() => {\n  const id = requestAnimationFrame(() => { if (x) setState(x); });\n  return () => cancelAnimationFrame(id);\n}, []);`).includes('no-reduced-motion'), 'one-shot defer is ignored');
  assert.ok(!rules('a.tsx', `requestAnimationFrame(() => el.focus());`).includes('no-reduced-motion'));
  assert.ok(rules('a.tsx', `const tick = () => { draw(); requestAnimationFrame(tick); };`).includes('no-reduced-motion'), 'single self-scheduling call');
  assert.ok(rules('a.tsx', `const loop = () => { draw(); requestAnimationFrame(() => loop()); };`).includes('no-reduced-motion'), 'inline arrow re-enters named const');
  assert.ok(rules('a.tsx', `function step() { requestAnimationFrame(() => { draw(); step(); }); }`).includes('no-reduced-motion'), 'inline arrow re-enters named function');
  assert.ok(!rules('a.tsx', `const reduced = useReducedMotion();\n${tick}`).includes('no-reduced-motion'));
  assert.ok(!rules('a.tsx', `const m = window.matchMedia('(prefers-reduced-motion: reduce)');\n${tick}`).includes('no-reduced-motion'));
  assert.ok(!rules('a.tsx', `const m = matchMedia("(prefers-reduced-motion: reduce)").matches;\n${tick}`).includes('no-reduced-motion'));
  assert.ok(rules('a.tsx', `import { useReducedMotion } from 'x';\n${tick}`).includes('no-reduced-motion'), 'unused import does not count');
  assert.ok(rules('a.tsx', `// respects prefers-reduced-motion\n${tick}`).includes('no-reduced-motion'), 'comment does not count');
  assert.ok(rules('a.css', '@keyframes spin { to { rotate: 1turn } }').includes('no-reduced-motion'));
  assert.ok(!rules('a.css', '@keyframes spin { to { rotate: 1turn } }\n@media (prefers-reduced-motion: reduce) { * { animation: none } }').includes('no-reduced-motion'));
  assert.ok(!rules('a.css', '.a { color: red }').includes('no-reduced-motion'));
});

test('findings carry path, line, rule, match', () => {
  const [f] = checkMotion([{ path: 'a.tsx', text: 'x\n<div className="transition-all" />' }]);
  assert.deepEqual(Object.keys(f).sort(), ['line', 'match', 'path', 'rule']);
  assert.equal(f.line, 2);
  assert.equal(f.rule, 'transition-all');
});

function project() {
  const d = mkdtempSync(join(tmpdir(), 'motion-'));
  mkdirSync(join(d, 'src'));
  mkdirSync(join(d, 'node_modules'));
  writeFileSync(join(d, 'src', 'a.tsx'), '<div className="transition-all" />');
  writeFileSync(join(d, 'src', 'a.test.tsx'), '<div className="transition-all" />');
  writeFileSync(join(d, 'node_modules', 'b.tsx'), '<div className="transition-all" />');
  writeFileSync(join(d, 'clean.css'), '.a { color: red }');
  return d;
}
const cli = (args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });

test('CLI exit codes: 0 clean, 1 findings, 2 usage', () => {
  const d = project();
  assert.equal(cli([join(d, 'clean.css')]).status, 0);
  assert.equal(cli([join(d, 'src')]).status, 1);
  assert.equal(cli([]).status, 2);
  assert.equal(cli(['--nope', d]).status, 2);
  assert.equal(cli([join(d, 'missing')]).status, 2);
});

test('CLI --json prints findings array', () => {
  const d = project();
  const r = cli(['--json', join(d, 'src')]);
  const out = JSON.parse(r.stdout);
  assert.equal(out.length, 1);
  assert.equal(out[0].rule, 'transition-all');
});

test('CLI skips build folders and tests by default, --include-tests adds them', () => {
  const d = project();
  assert.equal(JSON.parse(cli(['--json', d]).stdout).length, 1);
  assert.equal(JSON.parse(cli(['--json', '--include-tests', d]).stdout).length, 2);
});

test('CLI skips a broken symlink inside a folder without crashing', () => {
  const d = project();
  symlinkSync(join(d, 'nowhere.tsx'), join(d, 'src', 'dangling.tsx'));
  const r = cli(['--json', join(d, 'src')]);
  assert.equal(r.status, 1);
  assert.equal(JSON.parse(r.stdout).length, 1);
  assert.equal(cli([join(d, 'src', 'dangling.tsx')]).status, 2);
});

test('formatFindings prints the CLI lines and summary', async () => {
  const { formatFindings } = await import('../skills/motion/scripts/check-motion.mjs');
  const findings = checkMotion([{ path: 'a.css', text: '.a { transition: all 200ms; }\n' }]);
  const text = formatFindings(findings, 1);
  assert.match(text, /^a\.css:1 {2}transition-all {2}/m);
  assert.match(text, /^1 finding\(s\) in 1 file\(s\) \(1 scanned; transition-all 1\)$/m);
});

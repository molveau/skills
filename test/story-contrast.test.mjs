import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as contrast from '../skills/anti-slop/scripts/story-contrast.mjs';

const { parseColor, composite, gradientAverage, contrastRatio, threshold, formatRatio, textColor, backdropColor, contrastTag } = contrast;

const near = (actual, expected, eps = 0.02) => assert.ok(Math.abs(actual - expected) <= eps, `${actual} not within ${eps} of ${expected}`);

test('parseColor reads the formats getComputedStyle returns', () => {
  assert.deepEqual(parseColor('rgb(255, 0, 10)'), { r: 255, g: 0, b: 10, a: 1 });
  assert.deepEqual(parseColor('rgba(0, 0, 0, 0.5)'), { r: 0, g: 0, b: 0, a: 0.5 });
  assert.deepEqual(parseColor('rgb(0 0 0 / 0.25)'), { r: 0, g: 0, b: 0, a: 0.25 });
  assert.deepEqual(parseColor('#fff'), { r: 255, g: 255, b: 255, a: 1 });
  assert.deepEqual(parseColor('#7c5cff'), { r: 124, g: 92, b: 255, a: 1 });
  assert.deepEqual(parseColor('transparent'), { r: 0, g: 0, b: 0, a: 0 });
  assert.equal(parseColor('currentcolor'), null);
});

test('parseColor converts oklch, oklab and color(srgb) to sRGB', () => {
  const white = parseColor('oklch(1 0 0)');
  near(white.r, 255, 1); near(white.g, 255, 1); near(white.b, 255, 1);
  const black = parseColor('oklab(0 0 0 / 0.5)');
  assert.equal(black.a, 0.5); near(black.r, 0, 1);
  const red = parseColor('oklch(0.628 0.2577 29.23)'); // #ff0000
  near(red.r, 255, 2); near(red.g, 0, 2); near(red.b, 0, 2);
  assert.deepEqual(parseColor('color(srgb 1 0.5 0 / 0.8)'), { r: 255, g: 128, b: 0, a: 0.8 });
});

test('composite lays a translucent colour over an opaque one', () => {
  assert.deepEqual(composite({ r: 255, g: 255, b: 255, a: 0.5 }, { r: 0, g: 0, b: 0, a: 1 }), { r: 128, g: 128, b: 128, a: 1 });
  assert.deepEqual(composite({ r: 10, g: 20, b: 30, a: 1 }, { r: 0, g: 0, b: 0, a: 1 }), { r: 10, g: 20, b: 30, a: 1 });
});

test('gradientAverage averages the stops of a gradient, null when there are none', () => {
  assert.deepEqual(gradientAverage('linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(255, 255, 255) 100%)'), { r: 128, g: 128, b: 128, a: 1 });
  assert.equal(gradientAverage('none'), null);
  assert.equal(gradientAverage('url("x.png")'), null);
});

test('contrastRatio matches WCAG 2 reference values', () => {
  near(contrastRatio({ r: 0, g: 0, b: 0, a: 1 }, { r: 255, g: 255, b: 255, a: 1 }), 21);
  near(contrastRatio({ r: 119, g: 119, b: 119, a: 1 }, { r: 255, g: 255, b: 255, a: 1 }), 4.48);
  near(contrastRatio({ r: 255, g: 255, b: 255, a: 1 }, { r: 119, g: 119, b: 119, a: 1 }), 4.48);
});

test('contrastRatio composites a translucent foreground over the background', () => {
  near(contrastRatio({ r: 255, g: 255, b: 255, a: 0.5 }, { r: 0, g: 0, b: 0, a: 1 }), 5.32, 0.05);
});

test('threshold is 3 for large text and 4.5 otherwise (WCAG 1.4.3)', () => {
  assert.equal(threshold(16, 400), 4.5);
  assert.equal(threshold(24, 400), 3);
  assert.equal(threshold(18.67, 700), 3);
  assert.equal(threshold(18.67, 600), 4.5);
});

test('formatRatio rounds down to one decimal so a pass is never overstated', () => {
  assert.equal(formatRatio(4.499), '4.4:1');
  assert.equal(formatRatio(7.46), '7.4:1');
  assert.equal(formatRatio(21), '21:1');
});

test('parseColor returns null, never throws, on malformed or unsupported input', () => {
  for (const bad of ['oklch(0.5 0.1)', 'oklab()', 'rgb(1 2)', 'rgb(a b c)', 'color(srgb 1 0)', '#12345', 'lab(50 20 30)', 'lch(50 30 120)', 'color(display-p3 1 0 0)', '', 'none']) {
    assert.equal(parseColor(bad), null, bad);
  }
});

test('gradientAverage is null when any stop cannot be read, so no colour is invented', () => {
  assert.equal(gradientAverage('linear-gradient(lab(50 20 30), rgb(0, 0, 0))'), null);
  assert.equal(gradientAverage('linear-gradient(color(display-p3 1 0 0) 0%, rgb(255, 255, 255) 100%)'), null);
  assert.equal(gradientAverage('linear-gradient(oklch(0.5 0.1), #fff)'), null);
});

const style = (over) => ({ color: 'rgb(0, 0, 0)', webkitTextFillColor: 'rgb(0, 0, 0)', backgroundColor: 'rgba(0, 0, 0, 0)', backgroundImage: 'none', ...over });

test('textColor reads the drawn text colour, null when it cannot be read', () => {
  assert.deepEqual(textColor(style({ color: 'rgb(1, 2, 3)', webkitTextFillColor: 'rgb(1, 2, 3)' }), false), { r: 1, g: 2, b: 3, a: 1 });
  assert.deepEqual(textColor(style({ color: 'rgb(1, 2, 3)', webkitTextFillColor: 'rgba(0, 0, 0, 0)' }), false), { r: 1, g: 2, b: 3, a: 1 });
  assert.equal(textColor(style({ color: 'lab(50 20 30)', webkitTextFillColor: 'lab(50 20 30)' }), false), null);
  assert.equal(textColor(style({ webkitTextFillColor: 'color(display-p3 1 0 0)' }), false), null);
  assert.deepEqual(textColor(style({ backgroundImage: 'linear-gradient(rgb(0, 0, 0), rgb(255, 255, 255))' }), true), { r: 128, g: 128, b: 128, a: 1 });
  assert.equal(textColor(style({ backgroundImage: 'linear-gradient(lch(50 30 120), rgb(255, 255, 255))' }), true), null);
});

test('backdropColor flattens layers over white, null when any visible layer cannot be read', () => {
  assert.deepEqual(backdropColor([style({}), style({ backgroundColor: 'rgb(10, 20, 30)' })]), { r: 10, g: 20, b: 30, a: 1 });
  assert.deepEqual(backdropColor([style({})]), { r: 255, g: 255, b: 255, a: 1 });
  assert.equal(backdropColor([style({ backgroundColor: 'lab(50 20 30)' }), style({ backgroundColor: 'rgb(0, 0, 0)' })]), null);
  assert.equal(backdropColor([style({ backgroundImage: 'linear-gradient(color(display-p3 1 0 0), #fff)' })]), null);
  // A layer hidden under an opaque one is never read, so it cannot spoil the measurement.
  assert.deepEqual(backdropColor([style({ backgroundColor: 'rgb(0, 0, 0)' }), style({ backgroundColor: 'lab(50 20 30)' })]), { r: 0, g: 0, b: 0, a: 1 });
});

test('contrastTag shows ? with no verdict when a colour is unknown, a ratio otherwise', () => {
  const black = { r: 0, g: 0, b: 0, a: 1 };
  const white = { r: 255, g: 255, b: 255, a: 1 };
  assert.deepEqual(contrastTag(null, white, 16, 400), { text: '?', ok: null, live: null });
  assert.deepEqual(contrastTag(black, null, 16, 400), { text: '?', ok: null, live: null });
  const pass = contrastTag(black, white, 16, 400);
  assert.equal(pass.text, '21:1 AA');
  assert.equal(pass.ok, true);
  near(pass.live, 21);
  const grey = { r: 200, g: 200, b: 200, a: 1 };
  assert.equal(contrastTag(grey, white, 16, 400).ok, false);
  // Until the step settles a floor holds the starting value, so a tween crossing 1:1 never shows the dip.
  const held = contrastTag(grey, white, 16, 400, 21);
  assert.equal(held.text, '21:1 AA');
  near(held.live, 1.67, 0.05);
});

test('every export is a function that still works when injected into a page on its own', () => {
  const sources = Object.entries(contrast).map(([name, fn]) => {
    assert.equal(typeof fn, 'function', `${name} is not a function`);
    return fn.toString();
  });
  const context = vm.createContext({});
  vm.runInContext(sources.join('\n'), context);
  for (const name of Object.keys(contrast)) assert.equal(vm.runInContext(`typeof ${name}`, context), 'function', name);
  near(vm.runInContext("contrastRatio(parseColor('#000'), parseColor('#fff'))", context), 21);
  assert.equal(vm.runInContext("contrastTag(textColor({ color: 'lab(1 2 3)', webkitTextFillColor: 'lab(1 2 3)' }, false), backdropColor([]), 16, 400).text", context), '?');
});

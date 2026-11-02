// Contrast maths for the story video's Accessibility step. Every function is self-contained or calls only
// the others by name, because story.mjs injects their source into the page to measure live while colours tween.
// A colour that cannot be read is null all the way up: the tag then says "?" instead of a ratio nobody measured.

export function parseColor(text) {
  const s = String(text ?? '').trim().toLowerCase();
  const valid = (c) => ([c.r, c.g, c.b, c.a].every(Number.isFinite) ? c : null);
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const hex = /^#([0-9a-f]{3,8})$/.exec(s);
  if (hex) {
    let h = hex[1];
    if (![3, 4, 6, 8].includes(h.length)) return null;
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? Math.round((n(6) / 255) * 1000) / 1000 : 1 };
  }
  const fn = /^(rgba?|oklch|oklab|color)\((.*)\)$/.exec(s);
  if (!fn) return null;
  const [main, slash] = fn[2].split('/');
  const parts = main.replace(/,/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (parts.length < (fn[1] === 'color' ? 4 : 3) || parts.length > 4) return null; // malformed, e.g. oklch(0.5 0.1)
  const num = (v, scale = 1) => (v === 'none' ? 0 : !v ? NaN : v.endsWith('%') ? (parseFloat(v) / 100) * scale : Number(v.replace(/deg$/, '')));
  const alphaPart = slash !== undefined ? slash.trim() : fn[1] === 'rgba' || (fn[1] === 'rgb' && parts.length === 4) ? parts[3] : undefined;
  const a = alphaPart === undefined ? 1 : num(alphaPart, 1);
  const byte = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255);
  if (fn[1] === 'rgb' || fn[1] === 'rgba') return valid({ r: Math.round(num(parts[0], 255)), g: Math.round(num(parts[1], 255)), b: Math.round(num(parts[2], 255)), a });
  if (fn[1] === 'color') {
    if (parts[0] !== 'srgb') return null;
    return valid({ r: byte(num(parts[1], 1)), g: byte(num(parts[2], 1)), b: byte(num(parts[3], 1)), a });
  }
  const L = num(parts[0], 1);
  let A;
  let B;
  if (fn[1] === 'oklch') {
    const C = num(parts[1], 0.4);
    const h = (num(parts[2]) * Math.PI) / 180;
    A = C * Math.cos(h);
    B = C * Math.sin(h);
  } else {
    A = num(parts[1], 0.4);
    B = num(parts[2], 0.4);
  }
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const k = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const enc = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.max(0, x) ** (1 / 2.4) - 0.055);
  return valid({
    r: byte(enc(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * k)),
    g: byte(enc(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * k)),
    b: byte(enc(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * k)),
    a,
  });
}

export function composite(top, bottom) {
  const a = top.a + bottom.a * (1 - top.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mix = (t, b) => Math.round((t * top.a + b * bottom.a * (1 - top.a)) / a);
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: Math.round(a * 1000) / 1000 };
}

// Every colour named in a background-image value, parsed in order; one that cannot be read is null.
export function imageColors(image) {
  const found = String(image ?? '').match(/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)|#[0-9a-f]{3,8}\b|\btransparent\b/gi);
  return found ? found.map(parseColor) : [];
}

export function gradientAverage(image) {
  const colors = imageColors(image);
  if (colors.length === 0 || colors.some((c) => !c)) return null;
  const avg = (key) => colors.reduce((sum, c) => sum + c[key], 0) / colors.length;
  return { r: Math.round(avg('r')), g: Math.round(avg('g')), b: Math.round(avg('b')), a: Math.round(avg('a') * 1000) / 1000 };
}

export function contrastRatio(fg, bg) {
  const solid = fg.a < 1 ? composite(fg, bg) : fg;
  const lum = (c) => {
    const ch = (v) => {
      const x = v / 255;
      return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  };
  const [hi, lo] = [lum(solid), lum(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function threshold(sizePx, weight) {
  return sizePx >= 24 || (sizePx >= 18.66 && weight >= 700) ? 3 : 4.5;
}

export function formatRatio(ratio) {
  const r = Math.floor(ratio * 10) / 10;
  return (Number.isInteger(r) ? String(r) : r.toFixed(1)) + ':1';
}

// The colour text is drawn in: the gradient behind clipped text, else the text fill, else the text colour.
// Null when that colour cannot be read.
export function textColor(style, clipped) {
  if (clipped && imageColors(style.backgroundImage).length) return gradientAverage(style.backgroundImage);
  const fill = parseColor(style.webkitTextFillColor || style.color);
  if (!fill) return null;
  return fill.a === 0 ? parseColor(style.color) : fill;
}

// One element's own background: its colour with any gradient laid on top. Null when a colour cannot be read.
// An image with no colours in it (url()) is not measurable either way and leaves the colour alone, as before.
export function layerColor(style) {
  const color = parseColor(style.backgroundColor);
  if (!color) return null;
  if (imageColors(style.backgroundImage).length === 0) return color;
  const image = gradientAverage(style.backgroundImage);
  return image ? composite(image, color) : null;
}

// What sits behind the text: computed styles from the nearest element outwards, flattened over white and
// read until the first opaque layer. Null when a visible layer cannot be read.
export function backdropColor(styles) {
  const layers = [];
  for (const style of styles) {
    const layer = layerColor(style);
    if (!layer) return null;
    if (layer.a > 0) layers.push(layer);
    if (layer.a >= 1) break;
  }
  let base = { r: 255, g: 255, b: 255, a: 1 };
  for (let i = layers.length - 1; i >= 0; i--) base = composite(layers[i], base);
  return base;
}

// The Accessibility tag for one [data-contrast] element. ok is true (pass), false (fail) or null (unknown,
// shown as "?"). floor, when given, is the starting ratio held until the step settles; live is the ratio
// measured this frame, null when unknown.
export function contrastTag(fg, bg, sizePx, weight, floor) {
  if (!fg || !bg) return { text: '?', ok: null, live: null };
  const live = contrastRatio(fg, bg);
  const ratio = floor === undefined ? live : Math.max(floor, live);
  const ok = ratio >= threshold(sizePx, weight);
  return { text: formatRatio(ratio) + (ok ? ' AA' : ''), ok, live };
}

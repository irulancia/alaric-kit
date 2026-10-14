// Color math for the configurator: hex/HSL conversion, WCAG 2 and APCA contrast, and the
// "text or outline on a colored fill" decision (onColor/hoverColor/ensureContrast). Pure
// functions of their arguments, except onColor/readsWell, which read the global `state.contrast`
// set by design-system-ui.js (the configurator's "APCA vs WCAG 2 AA" toggle).
function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/.{2}/g).map((h) => parseInt(h, 16));
  return { r: m[0], g: m[1], b: m[2] };
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function adjustLightness(hex, delta) {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  return hslToHex(hsl.h, hsl.s, Math.max(0, Math.min(100, hsl.l + delta)));
}
function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(a, b) {
  const [hi, lo] = luminance(a) > luminance(b) ? [a, b] : [b, a];
  return (luminance(hi) + 0.05) / (luminance(lo) + 0.05);
}
// Text on a coloured fill: white, or a very dark shade of the fill's own hue
// (harmonious, and never pure black), whichever has the better WCAG contrast.
// APCA lightness contrast (Lc), algorithm 0.0.98G-4g. Unlike the WCAG 2 ratio it
// models polarity: light text on a mid-tone reads better than the ratio implies.
// Returns a signed value; |Lc| is the strength (black on white = about 106).
function apcaLc(textHex, bgHex) {
  const Y = (hex) => {
    const { r, g, b } = hexToRgb(hex);
    const y = 0.2126729 * Math.pow(r / 255, 2.4) + 0.7151522 * Math.pow(g / 255, 2.4) + 0.072175 * Math.pow(b / 255, 2.4);
    return y > 0.022 ? y : y + Math.pow(0.022 - y, 1.414);
  };
  const t = Y(textHex), b = Y(bgHex);
  if (Math.abs(b - t) < 0.0005) return 0;
  if (b > t) {
    const sapc = (Math.pow(b, 0.56) - Math.pow(t, 0.57)) * 1.14;
    return (sapc < 0.1 ? 0 : sapc - 0.027) * 100;
  }
  const sapc = (Math.pow(b, 0.65) - Math.pow(t, 0.62)) * 1.14;
  return (sapc > -0.1 ? 0 : sapc + 0.027) * 100;
}

// Text on a coloured fill. WCAG 2 (4.5:1) is the required floor; among the options
// that pass it, APCA picks the one that actually reads best. The dark option is
// the lightest hue-tinted shade that passes, stepping toward near-black only as
// far as needed (never pure black). Radix does the same: white by default,
// dark only on genuinely light fills.
function onColor(bg) {
  const { r, g, b } = hexToRgb(bg);
  const { h, s } = rgbToHsl(r, g, b);
  const shades = [12, 8, 5, 2].map((l) => hslToHex(h, Math.min(s, 35), l));
  if (state.contrast === 'apca') {
    // Perceptual mode: APCA alone decides. Not WCAG 2 compliant on some mid-tones.
    const lc = (c) => Math.abs(apcaLc(c, bg));
    const darkLc = shades.find((c) => lc(c) >= APCA_MIN) || shades[shades.length - 1];
    return lc('#ffffff') >= lc(darkLc) ? '#ffffff' : darkLc;
  }
  const dark = shades.find((c) => contrastRatio(bg, c) >= 4.5) || shades[shades.length - 1];
  const passing = ['#ffffff', dark].filter((c) => contrastRatio(bg, c) >= 4.5);
  if (passing.length === 0) return contrastRatio(bg, '#ffffff') >= contrastRatio(bg, dark) ? '#ffffff' : dark;
  return passing.reduce((best, c) => (Math.abs(apcaLc(c, bg)) > Math.abs(apcaLc(best, bg)) ? c : best));
}

// WCAG 2 and APCA disagree on mid-tone fills: dark text can pass the ratio and
// still read weakly, white can read well and fail the ratio. No text colour
// satisfies both there, so the only fix is the fill. This finds the nearest
// fills (lighter and darker) where the chosen text passes WCAG 4.5 AND reads
// well (APCA |Lc| >= 60, label-sized UI text).
const APCA_MIN = 60;
function readsWell(fill) {
  const on = onColor(fill);
  const lcOk = Math.abs(apcaLc(on, fill)) >= APCA_MIN;
  return state.contrast === 'apca' ? lcOk : lcOk && contrastRatio(fill, on) >= 4.5;
}
function fillAdvice(fill, name) {
  if (readsWell(fill)) return null;
  const on = onColor(fill);
  const options = [-1, 1].map((dir) => {
    for (let step = 1; step <= 40; step++) {
      const c = adjustLightness(fill, dir * step);
      if (readsWell(c)) return `${c} (${onColor(c) === '#ffffff' ? 'white' : 'dark'} text)`;
    }
    return null;
  }).filter(Boolean);
  return `${name} sits in the mid-tone range where button text reads weakly (APCA Lc ${Math.abs(apcaLc(on, fill)).toFixed(0)}, WCAG ${contrastRatio(fill, on).toFixed(1)}:1). Nearby fills that read well: ${options.join(' or ')}.`;
}

// Hover moves the fill away from the text colour so contrast never drops:
// darker under white text, lighter under dark text. At the lightness limit it
// goes the other way, and it backs off if 4.5:1 would be lost.
// It must also stay a BUTTON: a light fill lightened by the full step reached the card's own colour and the button
// vanished on hover (found 2026-10-04 on ELECT: a beige secondary went to #fdfcfb on a #fcfbf8 card). The hover keeps
// at least HOVER_SURFACE_MIN against the surfaces a button sits on (the card, the page) — the step shrinks until it does.
const HOVER_SURFACE_MIN = 1.06;
function hoverColor(fill, on, surfaces = []) {
  const { r, g, b } = hexToRgb(fill);
  const l = rgbToHsl(r, g, b).l;
  const dir = on === '#ffffff' ? (l < 18 ? 1 : -1) : 1;
  const visible = (c) => surfaces.every((s) => contrastRatio(c, s) >= Math.min(HOVER_SURFACE_MIN, contrastRatio(fill, s)));
  for (let step = 10; step >= 2; step -= 1) {
    let c = adjustLightness(fill, dir * step);
    if (c === fill) c = adjustLightness(fill, -dir * step);
    if (contrastRatio(c, on) >= Math.min(4.5, contrastRatio(fill, on)) && visible(c)) return c; // never below the fill's own contrast
  }
  return fill;
}

// Blend a colour with alpha over an opaque background, giving the flat colour it appears as.
function composite(fg, alpha, bg) {
  const f = hexToRgb(fg), k = hexToRgb(bg);
  const mix = (x, y) => Math.round(x * alpha + y * (1 - alpha));
  return '#' + [mix(f.r, k.r), mix(f.g, k.g), mix(f.b, k.b)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// Darken (hue and saturation kept) until the colour reaches `min` contrast on every surface.
function ensureContrast(hex, surfaces, min) {
  let c = hex;
  for (let i = 0; i < 100 && Math.min(...surfaces.map((s) => contrastRatio(c, s))) < min; i++) c = adjustLightness(c, -1);
  return c;
}

function rgba(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

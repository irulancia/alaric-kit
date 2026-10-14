#!/usr/bin/env node
// Builds design-system-icons.js from Phosphor Icons (MIT), in three styles per icon.
// Edit GROUPS to change the set, then run:  node .claude/scripts/generate-icons.js
// Every icon in the output exists in all three styles AND has a duotone that holds up.
// An icon is left out (and reported) when its duotone would look wrong:
//   - no tint layer, or the tint covers under 15% of the icon (a stray patch);
//   - it belongs to the line-glyph families (x, plus, check, arrows, carets, dots ...);
// A tile can still hide in an icon that passes these checks, so the set needs a visual pass.
// So there is one set, identical in outline, filled and duotone, with no per-style fallbacks.
// Roles that need a bare glyph (close, add, confirm, next) use the circled variants
// (x-circle, plus-circle, caret-circle-right ...), whose tint is a natural circle.

const fs = require('fs');
const path = require('path');

const BASE = 'https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2/assets/';
const OUT = path.join(__dirname, 'design-system-icons.js');
const MIN_TINT_PERCENT = 15; // below this the tint reads as a stray patch (folder tab, calendar header)

const GROUPS = {
  'Navigation and arrows': ['house', 'compass', 'map-pin', 'arrow-circle-left', 'arrow-circle-right', 'arrow-circle-up', 'arrow-circle-down', 'arrow-circle-up-right', 'arrow-circle-down-left', 'arrow-fat-right', 'arrow-fat-left', 'arrow-fat-up', 'arrow-fat-down', 'caret-circle-left', 'caret-circle-right', 'caret-circle-up', 'caret-circle-down', 'caret-circle-double-right', 'caret-circle-up-down', 'dots-three-circle', 'dots-three-circle-vertical', 'sidebar-simple', 'squares-four', 'sign-in', 'sign-out', 'arrow-square-out', 'link', 'browser', 'app-window', 'download', 'upload'],
  'Actions': ['plus-circle', 'minus-circle', 'check-circle', 'x-circle', 'check-square', 'x-square', 'plus-square', 'pencil-simple', 'pencil', 'pencil-circle', 'trash', 'copy', 'clipboard', 'scissors', 'share-network', 'share-fat', 'magnifying-glass', 'funnel', 'eye', 'eye-slash', 'lock', 'lock-open', 'bookmark-simple', 'star', 'heart', 'thumbs-up', 'thumbs-down', 'flag', 'push-pin', 'paperclip', 'printer', 'toggle-left', 'power', 'lightning', 'magic-wand'],
  'Files and documents': ['file', 'file-text', 'file-pdf', 'file-doc', 'file-plus', 'file-arrow-down', 'folder', 'folder-open', 'folder-plus', 'note', 'notepad', 'article', 'book-open', 'books', 'archive', 'tray', 'clipboard-text', 'table', 'kanban', 'newspaper'],
  'Communication': ['envelope-simple', 'envelope-simple-open', 'chat-circle', 'chat-text', 'chats', 'bell', 'bell-ringing', 'phone', 'video-camera', 'paper-plane-tilt', 'megaphone', 'at'],
  'People': ['user', 'users', 'user-plus', 'user-circle', 'user-gear', 'identification-card', 'handshake', 'smiley', 'address-book'],
  'Commerce and finance': ['credit-card', 'receipt', 'shopping-cart', 'shopping-bag', 'tag', 'currency-dollar', 'currency-eur', 'wallet', 'bank', 'coins', 'storefront', 'gift', 'package', 'truck', 'percent'],
  'Data and reports': ['presentation-chart', 'chart-bar', 'chart-bar-horizontal', 'chart-line', 'chart-line-up', 'chart-pie', 'chart-pie-slice', 'chart-donut', 'chart-scatter', 'gauge', 'trend-up', 'trend-down', 'database', 'stack', 'cube', 'target'],
  'Status and feedback': ['info', 'warning', 'warning-circle', 'question', 'seal-check', 'shield-check', 'shield-warning', 'bug', 'siren', 'lightbulb', 'spinner', 'hourglass', 'prohibit'],
  'Time': ['calendar-blank', 'calendar-check', 'calendar-plus', 'clock', 'timer', 'alarm', 'clock-counter-clockwise'],
  'System and devices': ['gear', 'cloud', 'cloud-arrow-up', 'cloud-arrow-down', 'wifi-high', 'desktop', 'laptop', 'device-mobile', 'plug', 'globe', 'translate', 'moon', 'sun', 'palette', 'code', 'terminal-window', 'git-branch', 'key', 'fingerprint', 'qr-code', 'shield'],
  'Media and text': ['image', 'images', 'camera', 'play', 'pause', 'stop', 'music-note', 'microphone', 'speaker-high', 'text-b', 'text-italic', 'text-underline', 'text-align-left', 'list-numbers', 'textbox'],
  'Places and objects': ['buildings', 'map-trifold', 'airplane', 'car', 'leaf', 'fire', 'drop', 'trophy', 'rocket', 'graduation-cap', 'briefcase', 'house-line'],
};

// Families drawn with lines only: Phosphor paints an arbitrary tile behind them in duotone.
// Bare glyph names must match exactly: x-circle, plus-circle, check-circle, caret-circle-*
// are enclosed shapes with a natural circular tint and are kept.
const LINE_GLYPH = /^(plus|minus|x|check|equals|dots-three|dots-three-vertical|dots-six|dots-six-vertical|arrow-(left|right|up|down|up-right|down-left|u-up-left|clockwise|counter-clockwise)|arrows-[\w-]+|caret-(left|right|up|down|up-down|double-[\w-]+)|chart-line(-up)?|chart-scatter|list(-[\w-]+)?|sort-[\w-]+|text-align-[\w-]+|sliders(-horizontal)?|spinner|export|percent)$/;

const VARIANTS = { outline: (n) => `regular/${n}`, filled: (n) => `fill/${n}-fill`, duotone: (n) => `duotone/${n}-duotone` };
const inner = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();

// SVG path -> polygons (M L H V C S A Z, absolute and relative); curves and arcs are sampled.
function toPolys(d) {
  const t = d.match(/[MmLlHhVvCcSsAaZz]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, last = null, cur = null; const out = [];
  const num = () => parseFloat(t[i++]);
  const flag = () => { const s = t[i]; if (s.length > 1 && /^[01]/.test(s) && !s.includes('.')) { t[i] = s.slice(1); return +s[0]; } i++; return +s; };
  const pt = (a, b) => cur.push([a, b]);
  const arc = (x1, y1, rx, ry, phi, fa, fs, x2, y2) => {
    if (!rx || !ry) return pt(x2, y2);
    const p = phi * Math.PI / 180, c = Math.cos(p), s = Math.sin(p), dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
    const xp = c * dx + s * dy, yp = -s * dx + c * dy; rx = Math.abs(rx); ry = Math.abs(ry);
    const l = xp * xp / (rx * rx) + yp * yp / (ry * ry); if (l > 1) { rx *= Math.sqrt(l); ry *= Math.sqrt(l); }
    const sg = fa === fs ? -1 : 1, nu = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp, de = rx * rx * yp * yp + ry * ry * xp * xp;
    const co = sg * Math.sqrt(Math.max(0, nu / de)), cxp = co * rx * yp / ry, cyp = -co * ry * xp / rx;
    const cx = c * cxp - s * cyp + (x1 + x2) / 2, cy = s * cxp + c * cyp + (y1 + y2) / 2;
    const an = (a, b, e, f) => Math.atan2(a * f - b * e, a * e + b * f);
    const t1 = an(1, 0, (xp - cxp) / rx, (yp - cyp) / ry); let dt = an((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
    if (!fs && dt > 0) dt -= 2 * Math.PI; if (fs && dt < 0) dt += 2 * Math.PI;
    for (let k = 1; k <= 24; k++) { const q = t1 + dt * k / 24; pt(c * rx * Math.cos(q) - s * ry * Math.sin(q) + cx, s * rx * Math.cos(q) + c * ry * Math.sin(q) + cy); }
  };
  const cubic = (a, b, c1, d1, e, f, g, h) => { for (let k = 1; k <= 16; k++) { const q = k / 16, m = 1 - q; pt(m*m*m*a + 3*m*m*q*c1 + 3*m*q*q*e + q*q*q*g, m*m*m*b + 3*m*m*q*d1 + 3*m*q*q*f + q*q*q*h); } };
  while (i < t.length) {
    if (/[A-Za-z]/.test(t[i])) cmd = t[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === 'M') { if (cur && cur.length > 2) out.push(cur); cur = []; x = ox + num(); y = oy + num(); sx = x; sy = y; pt(x, y); cmd = rel ? 'l' : 'L'; last = null; }
    else if (C === 'L') { x = ox + num(); y = oy + num(); pt(x, y); last = null; }
    else if (C === 'H') { x = (rel ? x : 0) + num(); pt(x, y); last = null; }
    else if (C === 'V') { y = (rel ? y : 0) + num(); pt(x, y); last = null; }
    else if (C === 'C') { const a = [ox + num(), oy + num(), ox + num(), oy + num(), ox + num(), oy + num()]; cubic(x, y, ...a); last = [a[2], a[3]]; x = a[4]; y = a[5]; }
    else if (C === 'S') { const a = [ox + num(), oy + num(), ox + num(), oy + num()]; const r = last ? [2 * x - last[0], 2 * y - last[1]] : [x, y]; cubic(x, y, r[0], r[1], a[0], a[1], a[2], a[3]); last = [a[0], a[1]]; x = a[2]; y = a[3]; }
    else if (C === 'A') { const rx = num(), ry = num(), ph = num(), fa = flag(), f2 = flag(), ex = ox + num(), ey = oy + num(); arc(x, y, rx, ry, ph, fa, f2, ex, ey); x = ex; y = ey; last = null; }
    else if (C === 'Z') { x = sx; y = sy; last = null; }
    else i++;
  }
  if (cur && cur.length > 2) out.push(cur);
  return out;
}
const polyArea = (p) => Math.abs(p.reduce((a, [x1, y1], k) => { const [x2, y2] = p[(k + 1) % p.length]; return a + (x1 * y2 - x2 * y1); }, 0) / 2);
const tintPercent = (duotone) => {
  const ds = [...duotone.matchAll(/<path d="([^"]+)" opacity="0\.2"\/>/g)].map((m) => m[1]);
  return 100 * ds.reduce((s, d) => s + toPolys(d).reduce((t, p) => t + polyArea(p), 0), 0) / (256 * 256);
};

async function fetchIcon(name) {
  const icon = {};
  for (const [style, file] of Object.entries(VARIANTS)) {
    const res = await fetch(`${BASE}${file(name)}.svg`);
    if (!res.ok) return null;
    icon[style] = inner(await res.text());
  }
  return icon;
}

(async () => {
  const all = [...new Set(Object.values(GROUPS).flat())];
  const icons = {}; const dropped = [];
  for (let i = 0; i < all.length; i += 40) {
    await Promise.all(all.slice(i, i + 40).map(async (n) => { const ic = await fetchIcon(n); if (ic) icons[n] = ic; else dropped.push(n); }));
  }
  // Why an icon's duotone would look wrong, or null when it holds up.
  const duotoneProblem = (n) => {
    const ic = icons[n];
    if (!/opacity="0\.2"/.test(ic.duotone)) return 'no tint layer';
    const tint = tintPercent(ic.duotone);
    if (tint < MIN_TINT_PERCENT) return `tint covers only ${tint.toFixed(1)}%`;
    if (LINE_GLYPH.test(n)) return 'line glyph (tile behind it)';
    return null;
  };
  const excluded = [];
  for (const n of Object.keys(icons)) { const why = duotoneProblem(n); if (why) { excluded.push([n, why]); delete icons[n]; } }

  const groups = Object.fromEntries(Object.entries(GROUPS).map(([g, names]) => [g, names.filter((n) => icons[n])]).filter(([, names]) => names.length));
  const ordered = Object.fromEntries(Object.values(groups).flat().map((n) => [n, icons[n]]));
  const header = `// Icons: Phosphor Icons (https://phosphoricons.com), MIT License, Copyright (c) 2023 Phosphor Icons.\n// One geometry in three styles (outline = "regular", filled = "fill", duotone). viewBox 0 0 256 256, fill currentColor.\n// GENERATED by generate-icons.js: edit GROUPS there and rerun, do not edit by hand.\n// Every icon here exists in all three styles and has a duotone that holds up; icons that fail are left out.\n`;
  const body = `window.DS_ICON_GROUPS = ${JSON.stringify(groups)};\nwindow.DS_ICONS = ${JSON.stringify(ordered)};\n`;
  fs.writeFileSync(OUT, header + body, 'utf8');
  console.log(`kept ${Object.keys(ordered).length} icons in ${Object.keys(groups).length} groups (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
  console.log('\nleft out because duotone would look wrong (' + excluded.length + '):');
  for (const [n, why] of excluded.sort()) console.log('  ' + n.padEnd(26) + why);
  console.log('\nnot in Phosphor (skipped):', dropped.length ? dropped.sort().join(', ') : 'none');
  console.log('\nkept, by group:');
  for (const [g, names] of Object.entries(groups)) console.log('  ' + g.padEnd(24) + names.length + ': ' + names.join(', '));
})();

// Functions that run INSIDE the configurator page (the runner serialises each one with toString),
// so every function here must be self-contained: no references to anything outside its own body.

// WCAG contrast of every rendered text element under `rootSel`, on its real (composited) background.
function pageContrastScan(rootSel) {
  const root = document.querySelector(rootSel);
  const parse = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const lin = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const backgroundOf = (el) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    return layers.reduceRight((base, layer) => over(layer, base), { r: 255, g: 255, b: 255, a: 1 });
  };
  // Disabled controls (WCAG 1.4.3), the hidden label of a loading button, and sr-only text are exempt.
  const exempt = (el) => el.closest('[hidden], [aria-hidden=true], .sr-only, option, script, style, .is-loading')
    || el.matches(':disabled, .is-disabled') || el.closest(':disabled, .is-disabled, fieldset:disabled')
    || (el.tagName === 'LABEL' && ((el.control && el.control.disabled) || (el.previousElementSibling && el.previousElementSibling.disabled)));
  const fails = [];
  let checked = 0;
  root.querySelectorAll('*').forEach((el) => {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
    if (!el.getClientRects().length || exempt(el)) return;
    const cs = getComputedStyle(el);
    const fg = parse(cs.color);
    if (!fg) return;
    const bg = backgroundOf(el);
    const r = ratio(over(fg, bg), bg);
    const size = parseFloat(cs.fontSize);
    const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    const need = large ? 3 : 4.5;
    checked++;
    if (r < need) fails.push({ tag: el.tagName.toLowerCase(), cls: String(el.className && el.className.baseVal === undefined ? el.className : '').slice(0, 40), text: el.textContent.trim().slice(0, 30), ratio: +r.toFixed(2), need });
  });
  return { checked, fails };
}

function pageStructure() {
  const preview = document.getElementById('preview');
  const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
  const jump = [...document.querySelectorAll('#jump a')].map((a) => a.getAttribute('href').slice(1));
  return {
    dup: ids.filter((x, i) => ids.indexOf(x) !== i),
    emptyIcons: [...new Set([...document.querySelectorAll('svg[data-icon]')].filter((s) => !s.firstChild).map((s) => s.dataset.icon))],
    sections: [...preview.querySelectorAll('.demo-section')].map((s) => `${s.dataset.view}:${s.id || '-'}`),
    jump,
    brokenJump: jump.filter((id) => !document.getElementById(id)),
    iconCount: document.querySelectorAll('svg[data-icon]').length,
  };
}

function pageOverflow() {
  const doc = document.documentElement;
  const preview = document.getElementById('preview');
  const edge = preview.getBoundingClientRect().right;
  const inScroller = '.table-wrap, .demo-icons, .overlay, .demo-drawer-wrap, pre, [style*="overflow"]'; // pre scrolls its long lines (design.md)
  const wide = [];
  preview.querySelectorAll('*').forEach((el) => {
    if (!el.getClientRects().length || el.closest('[hidden]')) return;
    const r = el.getBoundingClientRect();
    if (r.width && r.right > edge + 1 && !el.closest(inScroller)) {
      wide.push(`${el.tagName.toLowerCase()}.${String(el.className && el.className.baseVal === undefined ? el.className : '').split(' ')[0]}`);
    }
  });
  return { pageOverflow: doc.scrollWidth - doc.clientWidth, previewOverflow: [...new Set(wide)].slice(0, 6) };
}

// Every var(--x) used without a fallback must be defined somewhere (stylesheets, inline styles, root tokens).
function pageUndefinedVars() {
  const defined = new Set();
  const used = new Set();
  const scan = (text) => {
    for (const m of text.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) defined.add(m[1]);
    for (const m of text.matchAll(/var\((--[a-zA-Z0-9-]+)(\s*,)?/g)) if (!m[2]) used.add(m[1]);
  };
  [...document.styleSheets].forEach((ss) => { try { [...ss.cssRules].forEach((r) => scan(r.cssText)); } catch (e) { /* cross-origin sheet */ } });
  document.querySelectorAll('[style]').forEach((e) => scan(e.getAttribute('style')));
  const preview = document.getElementById('preview');
  for (let i = 0; i < preview.style.length; i++) defined.add(preview.style[i]);
  return [...used].filter((u) => !defined.has(u));
}

// The token math over many colour pairs and both contrast rules: contrast targets must hold on every surface.
function pageSweep(count) {
  let seed = 12345;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const hex = () => '#' + [0, 0, 0].map(() => Math.floor(rnd() * 256).toString(16).padStart(2, '0')).join('');
  const colors = ['#000000', '#ffffff', '#808080', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#dd9c2b', '#e08838', '#b8823a', '#56749a', '#111111', '#eeeeee', '#7f7f00', '#003366'];
  while (colors.length < count) colors.push(hex());
  const saved = { ...state };
  const fails = {};
  const add = (k, info) => { (fails[k] = fails[k] || []).push(info); };
  const cr = (a, b) => contrastRatio(a, b);
  const surfaces = ['--bg-primary', '--bg-card', '--bg-surface'];
  const minimums = [['--accent-text', 4.49], ['--accent-ui', 2.99], ['--secondary-ui', 2.99], ['--secondary-text', 4.49], ['--text-primary', 7.99], ['--text-secondary', 4.49], ['--text-label', 4.49], ['--border-control', 2.99],
    ['--success-text', 4.49], ['--error-text', 4.49], ['--warning-text', 4.49], ['--info-text', 4.49]];
  const checkSurface = (t, s, tag) => {
    minimums.forEach(([k, min]) => { if (cr(t[k], t[s]) < min) add(`${k}<${min}`, `${tag} ${s} ${cr(t[k], t[s]).toFixed(2)}`); });
    [['--accent-text', '--accent-ui', 0.22], ['--secondary-text', '--secondary', 0.22], ['--accent-text', '--accent-text', 0.055], ['--secondary-text', '--secondary-text', 0.055]].forEach(([text, base, alpha]) => {
      if (cr(t[text], composite(t[base], alpha, t[s])) < 4.49) add(`${text} on ${alpha} tint of ${base}<4.5`, `${tag} ${s}`);
    });
  };
  colors.forEach((primary, i) => {
    const secondary = colors[(i * 7 + 3) % colors.length];
    ['wcag', 'apca'].forEach((mode) => {
      Object.assign(state, { primary, secondary, contrast: mode });
      const t = computeTokens();
      const tag = `${primary}/${secondary}/${mode}`;
      Object.entries(t).forEach(([k, v]) => { if (/undefined|NaN|Infinity/.test(String(v))) add('badValue', `${k}=${v} @${tag}`); });
      surfaces.forEach((s) => checkSurface(t, s, tag));
      if (mode === 'wcag') {
        [['--accent', '--on-accent'], ['--secondary', '--on-secondary'], ['--accent-hover', '--on-accent'], ['--secondary-hover', '--on-secondary']].forEach(([f, o]) => {
          if (cr(t[f], t[o]) < 4.49) add(`wcag ${o} on ${f}<4.5`, `${tag} ${cr(t[f], t[o]).toFixed(2)}`);
        });
      }
    });
  });
  Object.assign(state, saved);
  applyTokens();
  return { combos: colors.length * 2, fails: Object.fromEntries(Object.entries(fails).map(([k, v]) => [k, { count: v.length, sample: v.slice(0, 3) }])) };
}

// What app.css contains: order, @import, tokens, component styles, and that it parses.
async function pageExportContent() {
  const out = {};
  const css = await dsBuildAppCss();
  const withoutImport = css.replace(/@import url\('[^']*'\);/g, '');
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(withoutImport);
  Object.assign(out, {
    len: css.length,
    startsComment: css.startsWith('/* app.css: generated by'),
    importIdx: css.indexOf('@import url('),
    rootIdx: css.indexOf(':root {'),
    hasComponents: css.includes('.btn-primary') && css.includes('.controls-outline') && css.includes('.controls-duotone'),
    bad: /undefined|NaN|\[object/.test(css),
    importOk: /@import url\('https:\/\/(fonts\.googleapis\.com\/css2\?family=|api\.fontshare\.com\/v2\/css\?f\[\]=)[^']+&display=swap'\);/.test(css),
    onlyCommentBeforeImport: css.slice(0, css.indexOf('@import')).replace(/\/\*[\s\S]*?\*\//g, '').trim() === '',
    rules: sheet.cssRules.length,
    rootHasAccent: [...sheet.cssRules].some((r) => r.selectorText === ':root' && r.style.getPropertyValue('--accent')),
  });
  return JSON.stringify(out);
}

// The three ways of getting the file out (download, save dialog, cancel), plus error and success feedback.
async function pageExportPaths() {
  const out = {};
  const css = await dsBuildAppCss();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const realPicker = window.showSaveFilePicker;
  const status = document.getElementById('export-status');
  // download path: no save dialog available
  delete window.showSaveFilePicker;
  let captured = null;
  const origCreate = URL.createObjectURL;
  URL.createObjectURL = (b) => { captured = b; return origCreate(b); };
  const dl = await dsSaveAppCss();
  URL.createObjectURL = origCreate;
  out.download = { result: dl.result, type: captured && captured.type, sameAsBuild: captured ? (await captured.text()) === css : false };
  // save dialog path
  let written = '';
  window.showSaveFilePicker = async (opts) => {
    out.pickerName = opts.suggestedName;
    return { createWritable: async () => ({ write: async (d) => { written += d; }, close: async () => {} }) };
  };
  const sv = await dsSaveAppCss();
  out.save = { result: sv.result, sameAsBuild: written === css };
  // cancelling ends quietly
  window.showSaveFilePicker = async () => { const e = new Error('cancelled'); e.name = 'AbortError'; throw e; };
  out.cancel = (await dsSaveAppCss()).result;
  // a write error shows in the status line
  window.showSaveFilePicker = async () => ({ createWritable: async () => { throw new Error('disk full'); } });
  document.getElementById('save-btn').click();
  await wait(300);
  Object.assign(out, { errorStatus: status.textContent, errorClass: status.classList.contains('error') });
  // success feedback
  window.showSaveFilePicker = async () => ({ createWritable: async () => ({ write: async () => {}, close: async () => {} }) });
  document.getElementById('save-btn').click();
  await wait(300);
  Object.assign(out, { okStatus: status.textContent, okLabel: document.getElementById('save-btn').textContent });
  window.showSaveFilePicker = realPicker;
  return JSON.stringify(out);
}

// One line of computed styles per element, for a fragment added temporarily to the configurator's preview.
function pageCollectFragment(markup) {
  const props = ['color', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'borderRadius', 'paddingTop', 'paddingLeft', 'boxShadow', 'borderTopWidth', 'borderBottomColor', 'minHeight', 'letterSpacing', 'textDecorationLine'];
  const host = document.createElement('div');
  host.id = 'frag';
  host.append(...new DOMParser().parseFromString(markup, 'text/html').body.childNodes);
  document.getElementById('preview').append(host);
  const lines = [...host.querySelectorAll('*')].map((el) => {
    const cs = getComputedStyle(el);
    return `${el.tagName}.${el.className} ${props.map((p) => cs[p]).join('|')}`;
  });
  host.remove();
  return JSON.stringify(lines);
}

// The same lines for a standalone page (the app.css test page).
function pageCollect(rootSel) {
  const props = ['color', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'borderRadius', 'paddingTop', 'paddingLeft', 'boxShadow', 'borderTopWidth', 'borderBottomColor', 'minHeight', 'letterSpacing', 'textDecorationLine'];
  return JSON.stringify([...document.querySelector(rootSel).querySelectorAll('*')].map((el) => {
    const cs = getComputedStyle(el);
    return `${el.tagName}.${el.className} ${props.map((p) => cs[p]).join('|')}`;
  }));
}

function pageAccessibility() {
  const out = [];
  document.querySelectorAll('button').forEach((b) => {
    if (!b.textContent.trim() && !b.getAttribute('aria-label') && !b.querySelector('svg[aria-label]')) out.push(`button without name: ${b.className}`);
  });
  document.querySelectorAll('input, select, textarea').forEach((i) => {
    const labelled = (i.labels && i.labels.length) || i.getAttribute('aria-label') || i.getAttribute('aria-labelledby');
    if (i.type !== 'hidden' && !labelled) out.push(`unlabelled ${i.tagName}#${i.id || '?'}.${i.className}`);
  });
  document.querySelectorAll('img:not([alt])').forEach(() => out.push('img without alt'));
  return out;
}

// Content that spills out of its own component (a badge poking out of a sidebar row, a label wider than its button).
function pageInnerOverflow() {
  const selector = '.sidebar-item, .menu-item, .btn, .badge, .tab, .navbar, .alert, .card, .list-item, .page, .toggle, .tag';
  const out = [];
  document.querySelectorAll('#preview ' + selector.split(', ').join(', #preview ')).forEach((el) => {
    if (!el.getClientRects().length || el.closest('[hidden]')) return;
    const spill = el.scrollWidth - el.clientWidth;
    if (spill > 1) out.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' "' + el.textContent.trim().slice(0, 20) + '" +' + spill + 'px');
  });
  return [...new Set(out)];
}

module.exports = { pageContrastScan, pageStructure, pageOverflow, pageUndefinedVars, pageSweep, pageExportContent, pageExportPaths, pageCollectFragment, pageCollect, pageAccessibility, pageInnerOverflow };

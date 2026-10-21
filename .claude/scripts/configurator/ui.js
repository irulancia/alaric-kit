// Configurator UI: app state, control wiring, and the two preview views (page / components).
// Loaded last, after configurator/color.js and configurator/tokens.js: applyTokens() below
// calls computeTokens() and the fonts/icons hooks those files and configurator/demo/components-tab.js /
// configurator/icons.js expose on window.

// contrast: how text on a coloured fill is chosen. 'wcag' = WCAG 2 AA 4.5:1 is required
// (legal standard). 'apca' = APCA decides alone (reads better on mid-tones, draft standard).
// customBg: false = the page is automatic, a near-white tinted with Secondary (the default); true = the page is exactly `background`.
// Either way the greys (surfaces, borders, grey text) follow the page.
// Defaults chosen by the owner, 2026-10-14 ("ceva mai modern"): a vivid orange, a warm sand, a cream page, Poppins + Nunito,
// the largest radius (buttons become pills; cards and fields keep their own caps) and duotone icons.
const DEFAULTS = { primary: '#ec5106', secondary: '#e7e1d3', customBg: false, background: '#faf7f1', fontDisplay: 'Poppins', fontBody: 'Nunito', radius: 28, shadow: 'soft', density: 'normal', contrast: 'apca', iconStyle: 'duotone', styleControls: false };
const state = { ...DEFAULTS };

// Segmented controls: highlight the chosen option and expose it to assistive tech.
function markActive(group, value) {
  document.querySelectorAll(`${group} .cfg-btn`).forEach((b) => {
    const on = b.dataset.preset === value;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

// The notes on the chosen colours (mid-tones, darker text shades, a third hue): a warning mark with their count beside
// "Color", the notes in its tooltip — never lost, never pushing the controls down. Nothing shows when there are none.
function renderColorNotes(notes) {
  const host = document.getElementById('color-notes');
  if (!notes.length) { host.replaceChildren(); return; }
  const wasOpen = host.querySelector('.cfg-tip-btn') === document.activeElement;
  const wrap = document.createElement('span');
  wrap.className = 'cfg-tip is-warning';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cfg-tip-btn';
  button.setAttribute('aria-label', `${notes.length} note${notes.length === 1 ? '' : 's'} on your colours`);
  button.setAttribute('aria-describedby', 'tip-color-notes');
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', 'cfg-icon');
  icon.setAttribute('viewBox', '0 0 256 256');
  icon.setAttribute('aria-hidden', 'true');
  icon.dataset.icon = 'warning';
  button.append(icon, String(notes.length));
  const bubble = document.createElement('span');
  bubble.className = 'cfg-tip-bubble';
  bubble.setAttribute('role', 'tooltip');
  bubble.id = 'tip-color-notes';
  bubble.append(...notes.map((text) => { const p = document.createElement('span'); p.textContent = text; return p; }));
  wrap.append(button, bubble);
  host.replaceChildren(wrap);
  window.dsHydrateIcons(host, 'outline');
  if (wasOpen) button.focus();   // re-rendered while it was open (a colour drag): keep it open
}

// One <link> per font stylesheet: #font-link is the first, the others (.font-link-extra) are added and removed as
// needed — never left with an empty href (that resolves to the page itself).
function syncFontLinks(urls) {
  const first = document.getElementById('font-link');
  first.href = urls[0] || 'data:text/css,';
  const extras = [...document.querySelectorAll('link.font-link-extra')];
  urls.slice(1).forEach((u, i) => {
    let link = extras[i];
    if (!link) { link = document.createElement('link'); link.rel = 'stylesheet'; link.className = 'font-link-extra'; first.after(link); }
    link.href = u;
  });
  extras.slice(Math.max(0, urls.length - 1)).forEach((l) => l.remove());
}

function applyTokens() {
  const tokens = computeTokens();
  const preview = document.getElementById('preview');
  Object.entries(tokens).forEach(([k, v]) => preview.style.setProperty(k, v));

  syncFontLinks(window.dsFontsUrls());

  const warnings = [['Primary', state.primary], ['Secondary', state.secondary]]
    .map(([name, fill]) => fillAdvice(fill, name))
    .filter(Boolean);
  if (tokens['--accent-text'].toLowerCase() !== state.primary.toLowerCase()) {
    warnings.push(`Fills keep your exact primary. Text uses ${tokens['--accent-text']} and outlines ${tokens['--accent-ui']}, darker shades of it, so they stay readable on light surfaces.`);
  }
  const thirdHue = pageThirdHue();
  if (thirdHue) warnings.push(thirdHue);
  if (state.contrast === 'apca') {
    [['Primary', state.primary], ['Secondary', state.secondary]].forEach(([name, fill]) => {
      const ratio = contrastRatio(fill, onColor(fill));
      if (ratio < 4.5) warnings.push(`${name} button text is ${ratio.toFixed(1)}:1. Fine by APCA, but below WCAG 2 AA (4.5:1).`);
    });
  }
  renderColorNotes(warnings);
  showHex('primary', state.primary);
  showHex('secondary', state.secondary);
  syncBackgroundField(tokens['--bg-primary']);

  document.getElementById('radius-value').textContent = state.radius + 'px';
  document.getElementById('radius-readout').textContent = radiusReadout(state.radius);
  document.getElementById('radius').value = state.radius;
  markActive('#density-presets', state.density);
  markActive('#shadow-presets', state.shadow);
  markActive('#contrast-presets', state.contrast);
  markActive('#icon-presets', state.iconStyle);
  const canStyle = state.iconStyle !== 'filled'; // filled icons = the solid buttons that are already the default
  document.getElementById('controls-option').hidden = !canStyle;
  document.getElementById('style-controls').checked = state.styleControls;
  preview.classList.toggle('controls-outline', canStyle && state.styleControls && state.iconStyle === 'outline');
  preview.classList.toggle('controls-duotone', canStyle && state.styleControls && state.iconStyle === 'duotone');
  window.dsHydrateIcons(preview, state.iconStyle);

  try { localStorage.setItem('ds-configurator-state', JSON.stringify(state)); } catch (e) {}
  syncResetButton();
}

// The page background field always shows the page's colour: computed from Secondary while "Automatic" is on (and not
// editable then; a small "Auto" at the end of the row, owner: "pune Automatic și atât pe același rând"), the owner's own pick once it is off (owner, 2026-10-14: "de ce nu se calculează automat page background
// de fiecare dată când schimbi secundara… o bifă Automat bifată by default și când o debifezi o poți selecta tu").
function syncBackgroundField(page) {
  const auto = !state.customBg;
  const shown = auto ? page : state.background;
  const input = document.getElementById('background');
  input.disabled = auto;
  input.value = shown;
  document.getElementById('background-hex').disabled = auto;
  showHex('background', shown);
  document.getElementById('auto-bg').checked = auto;
}

// The hex field beside each swatch: it shows the colour, and a pasted or typed one (with or without #, 3 or 6 digits)
// goes to the swatch as soon as it is valid. While someone types in it, it isn't rewritten under them.
function showHex(id, hex) {
  const field = document.getElementById(id + '-hex');
  if (document.activeElement !== field) field.value = hex;
}
function parseHex(text) {
  const digits = text.trim().replace(/^#/, '');
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(digits)) return null;
  const full = digits.length === 3 ? [...digits].map((c) => c + c).join('') : digits;
  return '#' + full.toLowerCase();
}
function bindHexField(id) {
  const field = document.getElementById(id + '-hex');
  const swatch = document.getElementById(id);
  field.addEventListener('input', () => {
    const hex = parseHex(field.value);
    field.setAttribute('aria-invalid', String(!hex));
    if (!hex || hex === swatch.value) return;
    swatch.value = hex;
    swatch.dispatchEvent(new Event('input', { bubbles: true }));
  });
  // Leaving the field (or Enter) shows the colour in use: an unfinished or invalid code goes back to it.
  field.addEventListener('change', () => { field.removeAttribute('aria-invalid'); field.value = swatch.value; });
  field.addEventListener('keydown', (e) => { if (e.key === 'Enter') field.blur(); });
}
['primary', 'secondary', 'background'].forEach(bindHexField);

// A page colour whose hue is far from both Primary and Secondary adds a third hue: every grey takes it. Faint colours
// (a near-white, a near-grey) have no hue worth naming, so they never warn.
const THIRD_HUE_MIN_CHROMA = 2;   // HSL chroma, %: below it a colour reads as white / grey
const THIRD_HUE_MIN_DEG = 60;     // closer than this to Primary's or Secondary's hue, it reads as part of the brand
function hueOf(hex) { const { r, g, b } = hexToRgb(hex); return rgbToHsl(r, g, b); }
function pageThirdHue() {
  if (!state.customBg) return null;
  const page = hueOf(state.background);
  if ((100 - Math.abs(2 * page.l - 100)) * page.s / 100 < THIRD_HUE_MIN_CHROMA) return null;
  const apart = (hex) => { const h = hueOf(hex); const d = Math.abs(h.h - page.h) % 360; return h.s < 10 || Math.min(d, 360 - d) >= THIRD_HUE_MIN_DEG; };
  if (!apart(state.primary) || !apart(state.secondary)) return null;
  return 'The page colour adds a third hue next to Primary and Secondary: surfaces, borders and grey text take it. A near-white, or a page close to one of your two colours, keeps the palette to two.';
}

// The inputs that applyTokens() doesn't set itself (colours, fonts), from the state: on load and after a reset / undo.
function syncInputs() {
  document.getElementById('primary').value = state.primary;
  document.getElementById('secondary').value = state.secondary;
  document.getElementById('background').value = state.background;
  document.getElementById('font-display').value = state.fontDisplay;
  document.getElementById('font-body').value = state.fontBody;
}

// Reset to defaults: off while the choices already are the defaults; after a reset, Undo brings the previous choices back
// for a while — no confirm dialog to click through, and nothing lost to one wrong click.
const UNDO_MS = 10000;
const isDefault = () => Object.keys(DEFAULTS).every((k) => state[k] === DEFAULTS[k]);
function syncResetButton() { document.getElementById('reset-btn').disabled = isDefault(); }
function setChoices(choices) { Object.assign(state, choices); syncInputs(); applyTokens(); }
function offerUndo(previous) {
  const host = document.getElementById('reset-status');
  const undo = document.createElement('button');
  undo.type = 'button';
  undo.className = 'cfg-link-btn';
  undo.textContent = 'Undo';
  undo.addEventListener('click', () => { setChoices(previous); host.replaceChildren('Your choices are back.'); setTimeout(() => host.replaceChildren(), UNDO_MS / 3); });
  host.replaceChildren('Back to the defaults.', undo);
  clearTimeout(offerUndo.timer);
  offerUndo.timer = setTimeout(() => host.replaceChildren(), UNDO_MS);
}
document.getElementById('reset-btn').addEventListener('click', () => {
  const previous = { ...state };
  setChoices(DEFAULTS);
  offerUndo(previous);
});

// Only accept values the current version understands, so an older saved state can't break the page.
function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem('ds-configurator-state'));
    if (!saved) return;
    const hex = /^#[0-9a-fA-F]{6}$/;
    if (hex.test(saved.primary)) state.primary = saved.primary;
    if (hex.test(saved.secondary)) state.secondary = saved.secondary;
    if (typeof saved.customBg === 'boolean') state.customBg = saved.customBg;
    if (hex.test(saved.background)) state.background = saved.background;
    if (fontNames(DISPLAY_FONTS).includes(saved.fontDisplay)) state.fontDisplay = saved.fontDisplay;
    if (fontNames(BODY_FONTS).includes(saved.fontBody)) state.fontBody = saved.fontBody;
    if (Number.isInteger(saved.radius) && saved.radius >= 0 && saved.radius <= 28) state.radius = saved.radius;
    if (SHADOW_NAMES.includes(saved.shadow)) state.shadow = saved.shadow;
    if (TYPE_RATIOS[saved.density]) state.density = saved.density;
    if (['wcag', 'apca'].includes(saved.contrast)) state.contrast = saved.contrast;
    if (['outline', 'filled', 'duotone'].includes(saved.iconStyle)) state.iconStyle = saved.iconStyle;
    if (typeof saved.styleControls === 'boolean') state.styleControls = saved.styleControls;
  } catch (e) {}
}

function fillFontSelect(id, groups) {
  const groupEls = Object.entries(groups).map(([label, names]) => {
    const g = document.createElement('optgroup');
    g.label = label;
    g.append(...names.map((n) => new Option(n, n)));
    return g;
  });
  document.getElementById(id).replaceChildren(...groupEls);
}

document.getElementById('primary').addEventListener('input', (e) => { state.primary = e.target.value; applyTokens(); });
document.getElementById('secondary').addEventListener('input', (e) => { state.secondary = e.target.value; applyTokens(); });
document.getElementById('background').addEventListener('input', (e) => { state.background = e.target.value; state.customBg = true; applyTokens(); });
// Turning "Automatic" off starts from the colour the page has now, so nothing jumps; turning it on recomputes it.
document.getElementById('auto-bg').addEventListener('change', (e) => {
  if (!e.target.checked) state.background = getComputedStyle(document.getElementById('preview')).getPropertyValue('--bg-primary').trim() || state.background;
  state.customBg = !e.target.checked;
  applyTokens();
});
document.getElementById('font-display').addEventListener('change', (e) => { state.fontDisplay = e.target.value; applyTokens(); });
document.getElementById('font-body').addEventListener('change', (e) => { state.fontBody = e.target.value; applyTokens(); });
document.getElementById('radius').addEventListener('input', (e) => { state.radius = Number(e.target.value); applyTokens(); });
document.querySelectorAll('#density-presets .cfg-btn').forEach((b) => {
  b.addEventListener('click', () => { state.density = b.dataset.preset; applyTokens(); });
});
document.querySelectorAll('#shadow-presets .cfg-btn').forEach((b) => {
  b.addEventListener('click', () => { state.shadow = b.dataset.preset; applyTokens(); });
});
document.querySelectorAll('#contrast-presets .cfg-btn').forEach((b) => {
  b.addEventListener('click', () => { state.contrast = b.dataset.preset; applyTokens(); });
});
document.querySelectorAll('#icon-presets .cfg-btn').forEach((b) => {
  b.addEventListener('click', () => { state.iconStyle = b.dataset.preset; applyTokens(); });
});

document.getElementById('style-controls').addEventListener('change', (e) => { state.styleControls = e.target.checked; applyTokens(); });

// Two views of the same preview: one realistic page, or the component reference (with jump links).
function setView(view) {
  const preview = document.getElementById('preview');
  preview.dataset.view = view;
  preview.querySelectorAll('.demo-section').forEach((s) => { s.hidden = s.dataset.view !== view; });
  document.querySelectorAll('.cfg-tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.view === view)));
  document.getElementById('jump').hidden = view !== 'components';
  // A jump link left #sec-… in the address; on the example site it would send a refresh back to that component.
  if (view !== 'components' && location.hash.startsWith('#sec-')) history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo({ top: 0 });
  try { localStorage.setItem('ds-configurator-view', view); } catch (e) {}
}

function renderJumpLinks() {
  const links = [...document.querySelectorAll('#preview .demo-section[data-view=components]')].map((s) => {
    const a = document.createElement('a');
    a.href = `#${s.id}`;
    a.textContent = s.dataset.label;
    return a;
  });
  document.getElementById('jump').replaceChildren(...links);
}

window.dsHydrateIcons(document.querySelector('.cfg-panel'), 'outline');   // the panel's own icons (info, lock) stay outline
fillFontSelect('font-display', DISPLAY_FONTS);
fillFontSelect('font-body', BODY_FONTS);
document.getElementById('preview').innerHTML = window.DS_DEMO_HTML; // trusted-static: hardcoded markup from configurator/demo/components-tab.js, no user input
window.dsDemoApp.mount(document.getElementById('demo-app'), () => state.iconStyle);
renderJumpLinks();
document.querySelectorAll('.cfg-tab').forEach((t) => t.addEventListener('click', () => setView(t.dataset.view)));
let savedView = 'page';
try { savedView = localStorage.getItem('ds-configurator-view') === 'components' ? 'components' : 'page'; } catch (e) {}
if (location.hash.startsWith('#sec-')) savedView = 'components'; // a shared link to one group opens the reference
loadSaved();
syncInputs();
applyTokens();
setView(savedView);
if (location.hash.startsWith('#sec-')) document.getElementById(location.hash.slice(1))?.scrollIntoView();

// Segmented controls in the preview answer a click (the component is CSS only: the app sets aria-pressed), so
// the indicator's slide can be seen. Off options stay off.
// The other pieces the app wires (the components are CSS): a real <dialog> opens, the phone menu folds, a slider and a
// colour show their value, Esc closes an open "i".
document.getElementById('preview').addEventListener('click', (e) => {
  const b = e.target.closest('.segmented > button');
  if (b && !b.disabled) b.parentElement.querySelectorAll(':scope > button').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
  const opener = e.target.closest('[data-open-dialog]');
  if (opener) document.getElementById(opener.dataset.openDialog).showModal();
  const toggle = e.target.closest('.navbar-toggle');
  if (toggle) toggle.setAttribute('aria-expanded', String(toggle.closest('.navbar').classList.toggle('is-open')));
});
// The slider's filled part (Chrome / Safari): the CSS reads --range-pct, 0–1.
function setRangeFill(input) {
  const min = Number(input.min || 0), max = Number(input.max || 100);
  input.style.setProperty('--range-pct', String((Number(input.value) - min) / (max - min || 1)));
}
document.getElementById('preview').addEventListener('input', (e) => {
  const out = e.target.matches('.range') && e.target.closest('.form-row')?.querySelector('.form-row-value');
  if (out) out.textContent = e.target.value + (out.textContent.match(/[^\d.]+$/) || [''])[0];
  if (e.target.matches('.range')) setRangeFill(e.target);
  if (e.target.matches('.color-pick input')) e.target.nextElementSibling.textContent = e.target.value;
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (document.activeElement?.matches('.info-tip')) document.activeElement.blur();
  document.querySelectorAll('.cfg-tip:is(:hover, :focus-within)').forEach((t) => t.classList.add('is-dismissed'));
  document.querySelectorAll('.has-tooltip:is(:hover, :focus-within)').forEach((t) => t.classList.add('is-dismissed'));
});
// A dismissed tooltip comes back the next time the pointer or the focus arrives.
['pointerleave', 'focusout'].forEach((type) => document.addEventListener(type, (e) => {
  e.target.closest?.('.has-tooltip, .cfg-tip')?.classList.remove('is-dismissed');
}, true));

// The panel can be hidden, so the page example gets the full width; the choice is remembered in this browser.
const PANEL_KEY = 'ds-configurator-panel';
function setPanel(open) {
  document.querySelector('.cfg').classList.toggle('is-collapsed', !open);
  document.getElementById('panel-hide').setAttribute('aria-expanded', String(open));
  document.getElementById('panel-show').hidden = open;
  try { localStorage.setItem(PANEL_KEY, open ? 'open' : 'hidden'); } catch (e) {}
}
document.getElementById('panel-hide').addEventListener('click', () => { setPanel(false); document.getElementById('panel-show').focus(); });
document.getElementById('panel-show').addEventListener('click', () => { setPanel(true); document.getElementById('panel-hide').focus(); });
try { if (localStorage.getItem(PANEL_KEY) === 'hidden') setPanel(false); } catch (e) {}

document.getElementById('icon-search').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll('.demo-icon-cell').forEach((c) => { c.hidden = q !== '' && !c.dataset.name.includes(q); });
});

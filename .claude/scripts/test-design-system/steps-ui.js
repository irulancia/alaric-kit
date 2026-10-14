// Test steps for the configurator's interface. Each step receives the context `t` from run.js:
// t.ev / t.fn / t.click / t.sleep drive the page, t.bad(area, message) records a problem and
// t.note(message) records information.
const { pageStructure, pageUndefinedVars } = require('./page-checks.js');

const VIEWS = ['page', 'components'];
const PRESET_GROUPS = [
  ['#density-presets', ['compact', 'normal', 'spacious']],
  ['#shadow-presets', ['flat', 'soft', 'layered']],
  ['#icon-presets', ['outline', 'filled', 'duotone']],
  ['#contrast-presets', ['apca', 'wcag']],
];
const FONT_WEIGHTS = { 'font-display': ['600', '700'], 'font-body': ['400', '600'] };
const FONT_LOAD_ATTEMPTS = 16;
const FONT_LOAD_WAIT_MS = 250;

// On a fresh profile the contrast rule is APCA, listed first and selected.
async function checkDefaults(t) {
  const def = JSON.parse(await t.ev(`JSON.stringify({
    c: state.contrast,
    first: document.querySelector('#contrast-presets .cfg-btn').dataset.preset,
    active: [...document.querySelectorAll('#contrast-presets .cfg-btn')].filter(b => b.classList.contains('active')).map(b => b.dataset.preset) })`));
  if (def.c !== 'apca' || def.first !== 'apca' || def.active.join() !== 'apca') t.bad('default', `APCA is not the first, selected default: ${JSON.stringify(def)}`);
  t.note(`default contrast: ${JSON.stringify(def)}`);
}

async function checkStructure(t) {
  const s = await t.fn(pageStructure);
  if (s.dup.length) t.bad('structure', `duplicate ids: ${s.dup.join(', ')}`);
  if (s.emptyIcons.length) t.bad('icons', `icons that did not render: ${s.emptyIcons.join(', ')}`);
  if (s.brokenJump.length) t.bad('jump', `jump links with no target: ${s.brokenJump.join(', ')}`);
  const components = s.sections.filter((x) => x.startsWith('components')).length;
  if (components !== 10) t.bad('structure', `expected 10 component sections, found ${components}`);
  if (s.sections.filter((x) => x.startsWith('page')).length !== 1) t.bad('structure', 'expected 1 page section');
  t.note(`structure: ${s.sections.length} sections, ${s.iconCount} icon slots, ${s.jump.length} jump links`);
  const undef = await t.fn(pageUndefinedVars);
  if (undef.length) t.bad('css', `var() never defined: ${undef.join(', ')}`);
}

async function viewState(t, view) {
  await t.click(`.cfg-tab[data-view=${view}]`);
  await t.sleep(200);
  return JSON.parse(await t.ev(`JSON.stringify({
    visible: [...document.querySelectorAll('#preview .demo-section')].filter(s => !s.hidden).length,
    jumpHidden: document.getElementById('jump').hidden })`));
}

async function checkTabs(t) {
  const page = await viewState(t, VIEWS[0]);
  const components = await viewState(t, VIEWS[1]);
  if (page.visible !== 1 || page.jumpHidden !== true) t.bad('tabs', `page view wrong: ${JSON.stringify(page)}`);
  if (components.visible !== 10 || components.jumpHidden !== false) t.bad('tabs', `components view wrong: ${JSON.stringify(components)}`);
  await t.ev(`document.querySelector('#jump a[href="#sec-overlays"]').click(), 1`);
  await t.sleep(500);
  const jumped = await t.ev(`Math.round(document.getElementById('sec-overlays').getBoundingClientRect().top)`);
  if (jumped < 0 || jumped > 250) t.bad('jump', `clicking "Overlays" left the section at y=${jumped}`);
  // The owner's bug (2026-10-14): a jump link leaves #sec-… in the address; going back to the example site and
  // refreshing must stay on the example site, not return to that component.
  await t.click('.cfg-tab[data-view=page]');
  await t.load();
  const afterRefresh = await t.ev(`document.getElementById('preview').dataset.view + ' ' + location.hash`);
  if (afterRefresh.trim() !== 'page') t.bad('jump', `after a jump, the example site and a refresh: ${afterRefresh}`);
  t.note(`tabs OK; jump to Overlays lands at y=${jumped}; a refresh after going back stays on the example site`);
}

// Clicking a preset makes exactly that option active, and exposes it through aria-pressed.
async function checkPresetButtons(t) {
  for (const [group, values] of PRESET_GROUPS) {
    for (const value of values) {
      await t.click(`${group} .cfg-btn[data-preset=${value}]`);
      await t.sleep(120);
      const options = JSON.parse(await t.ev(`JSON.stringify([...document.querySelectorAll('${group} .cfg-btn')].map(b => [b.dataset.preset, b.classList.contains('active'), b.getAttribute('aria-pressed')]))`));
      const chosen = options.find((o) => o[0] === value);
      if (options.filter((o) => o[1]).length !== 1 || !chosen[1] || chosen[2] !== 'true') t.bad('controls', `${group} ${value}: active state wrong ${JSON.stringify(options)}`);
    }
  }
}

// The presets must actually change tokens and markup, not just their own highlight.
async function checkPresetEffects(t) {
  await t.click('#density-presets .cfg-btn[data-preset=compact]');
  const compact = await t.readTok('--space-3');
  await t.click('#density-presets .cfg-btn[data-preset=spacious]');
  const spacious = await t.readTok('--space-3');
  if (compact === spacious) t.bad('density', `--space-3 does not change: ${compact} vs ${spacious}`);
  await t.click('#density-presets .cfg-btn[data-preset=normal]');
  await t.click('#shadow-presets .cfg-btn[data-preset=flat]');
  const flat = await t.readTok('--shadow-sm');
  await t.click('#shadow-presets .cfg-btn[data-preset=layered]');
  if (flat === await t.readTok('--shadow-sm')) t.bad('shadow', 'shadow presets produce identical --shadow-sm');
  await t.click('#shadow-presets .cfg-btn[data-preset=soft]');
  const icon = () => t.ev(`document.querySelector('#preview svg[data-icon=house]').innerHTML.length`);
  await t.click('#icon-presets .cfg-btn[data-preset=outline]');
  const outline = await icon();
  await t.click('#icon-presets .cfg-btn[data-preset=filled]');
  if (outline === await icon()) t.bad('icons', 'outline and filled render identical markup');
  await t.click('#icon-presets .cfg-btn[data-preset=outline]');
}

const PERSISTED_RADIUS = 7;

async function checkColorsAndRadius(t) {
  await t.setColor('primary', '#2563eb');
  await t.setColor('secondary', '#9333ea');
  await t.sleep(150);
  const accent = await t.readTok('--accent');
  if (accent !== '#2563eb') t.bad('color', `primary input did not apply: ${accent}`);
  const hex = await t.ev(`document.getElementById('primary-hex').textContent`);
  if (hex.toLowerCase() !== '#2563eb') t.bad('color', `hex readout stale: ${hex}`);
  await t.ev(`(() => { const r = document.getElementById('radius'); for (const v of ['0', '12', '28']) { r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); } return 1; })()`);
  const readout = await t.ev(`[document.getElementById('radius-value').textContent, document.getElementById('radius-readout').textContent]`);
  if (readout[0] !== '28px' || !/dialogs 28/.test(readout[1])) t.bad('radius', `readout wrong at 28: ${readout.join(' | ')}`);
  // End on a value that isn't the default (28), so the persistence check below proves the save, not the default.
  await t.ev(`(() => { const r = document.getElementById('radius'); r.value = '${PERSISTED_RADIUS}'; r.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
}

// Custom page background and the elevation step. On the default (secondary-tinted) page cards stay
// white; on a chosen cream the page is exactly that color, cards sit one elevation step lighter
// (ELEVATION_STEP_L, 2.5 L*), text keeps its contrast targets on both, and status tints are
// opaque (a translucent blue over cream went gray). Unchecking goes back to the secondary tint.
const CUSTOM_BG = '#efe8da';
const ELEVATION_STEP = 2.5;
const ELEVATION_TOLERANCE = 0.4;
async function checkBackgroundAndElevation(t) {
  // The default is Automatic: the field shows the computed page, and can't be edited until Automatic is turned off.
  const start = JSON.parse(await t.ev(`JSON.stringify({ auto: document.getElementById('auto-bg').checked, disabled: document.getElementById('background').disabled, shown: document.getElementById('background').value })`));
  const defaultPage = await t.readTok('--bg-primary');
  if (!start.auto || !start.disabled) t.bad('background', `the page background should start Automatic and not editable: ${JSON.stringify(start)}`);
  if (start.shown.toLowerCase() !== defaultPage) t.bad('background', `the field should show the computed page ${defaultPage}, shows ${start.shown}`);
  // Turning Automatic off starts from the same colour: nothing jumps.
  await t.click('#auto-bg');
  await t.sleep(150);
  const afterOff = await t.readTok('--bg-primary');
  if (afterOff !== defaultPage) t.bad('background', `turning Automatic off changed the page from ${defaultPage} to ${afterOff}`);
  await t.click('#auto-bg');
  await t.sleep(150);
  const defaultCard = await t.readTok('--bg-card');
  if (defaultCard !== '#ffffff') t.bad('background', `default page: cards should stay white, got ${defaultCard}`);
  await t.setColor('background', CUSTOM_BG);
  await t.sleep(150);
  const r = JSON.parse(await t.ev(`(() => {
    const cs = getComputedStyle(document.getElementById('preview'));
    const tok = (n) => cs.getPropertyValue(n).trim();
    const L = (hex) => { const y = luminance(hex); return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y; };
    const page = tok('--bg-primary'), card = tok('--bg-card');
    return JSON.stringify({
      custom: !document.getElementById('auto-bg').checked, page, card,
      step: L(card) - L(page),
      text: Math.min(contrastRatio(tok('--text-primary'), page), contrastRatio(tok('--text-primary'), card)),
      muted: Math.min(contrastRatio(tok('--text-secondary'), page), contrastRatio(tok('--text-secondary'), card)),
      infoBg: tok('--info-bg'),
      accentTints: [tok('--accent-bg'), tok('--accent-bg-subtle'), tok('--secondary-bg')],
      chroma: ['--bg-primary', '--bg-surface', '--bg-hover', '--border'].map((n) => { const { r, g, b } = hexToRgb(tok(n)); const h = rgbToHsl(r, g, b); return (100 - Math.abs(2 * h.l - 100)) * h.s / 100; }),
    });
  })()`));
  if (!r.custom) t.bad('background', 'picking a background did not turn Automatic off');
  if (r.page !== CUSTOM_BG) t.bad('background', `page should be exactly ${CUSTOM_BG}, got ${r.page}`);
  if (Math.abs(r.step - ELEVATION_STEP) > ELEVATION_TOLERANCE) t.bad('background', `card is ${r.step.toFixed(2)} L* above the page, expected ${ELEVATION_STEP}`);
  if (r.text < 8) t.bad('background', `--text-primary ${r.text.toFixed(2)}:1 on page/card, needs 8`);
  if (r.muted < 4.5) t.bad('background', `--text-secondary ${r.muted.toFixed(2)}:1 on page/card, needs 4.5`);
  if (!/^#[0-9a-f]{6}$/i.test(r.infoBg)) t.bad('background', `--info-bg should be an opaque hex, got ${r.infoBg}`);
  // A translucent accent tint over a coloured page mixed into a grey that was neither hue (cyan over lilac, 2026-10-14).
  // The greys follow the page just as faintly as the page itself: holding the HSL saturation while darkening turned a
  // near-white lilac into an intense mauve (2026-10-14). Allowed: a little rounding.
  const [pageC, ...greysC] = r.chroma;
  if (Math.max(...greysC) > pageC * 1.25 + 0.5) t.bad('background', `surfaces / borders are more colourful than the page (chroma ${greysC.map((c) => c.toFixed(1)).join(' / ')} vs page ${pageC.toFixed(1)})`);
  r.accentTints.filter((c) => !/^#[0-9a-f]{6}$/i.test(c)).forEach((c) => t.bad('background', `accent / secondary tints must be opaque, got ${c}`));
  await t.click('#auto-bg');
  await t.sleep(150);
  const back = await t.readTok('--bg-primary');
  if (back !== defaultPage) t.bad('background', `turning Automatic back on should restore the computed page ${defaultPage}, got ${back}`);
  t.note(`background: ${CUSTOM_BG} page, card ${r.card} (+${r.step.toFixed(2)} L*), text ${r.text.toFixed(1)}:1, muted ${r.muted.toFixed(1)}:1, info-bg ${r.infoBg}`);
}

// The font must reach the token and the Google request, and every weight the system asks for must really load.
async function checkOneFont(t, select, font) {
  await t.ev(`(() => { const s = document.getElementById(${JSON.stringify(select)}); s.value = ${JSON.stringify(font)}; s.dispatchEvent(new Event('change', { bubbles: true })); return 1; })()`);
  const token = await t.readTok(select === 'font-display' ? '--font-display' : '--font');
  const href = decodeURIComponent(await t.ev(`[...document.querySelectorAll('#font-link, link.font-link-extra')].map((l) => l.href).join(' ')`));
  const requested = href.includes(font.replace(/ /g, '+')) || href.includes(`f[]=${font.toLowerCase().replace(/ /g, '-')}@`);
  if (!token.includes(font) || !requested) t.bad('fonts', `${select} ${font}: token "${token}" href "${href.slice(0, 120)}"`);
  for (const weight of FONT_WEIGHTS[select]) {
    let loaded = 0;
    for (let i = 0; i < FONT_LOAD_ATTEMPTS && !loaded; i++) {
      loaded = await t.ev(`document.fonts.load('${weight} 24px "${font}"').then(r => r.length)`);
      if (!loaded) await t.sleep(FONT_LOAD_WAIT_MS);
    }
    if (!loaded) t.bad('fonts', `${font} weight ${weight} did not load from its font source`);
  }
}

async function checkFonts(t) {
  const lists = JSON.parse(await t.ev(`JSON.stringify({
    'font-display': [...document.getElementById('font-display').options].map(o => o.value),
    'font-body': [...document.getElementById('font-body').options].map(o => o.value),
    groups: [...document.querySelectorAll('#font-display optgroup, #font-body optgroup')].map(g => g.label) })`));
  for (const select of Object.keys(FONT_WEIGHTS)) {
    for (const font of lists[select]) await checkOneFont(t, select, font);
  }
  t.note(`fonts: ${lists['font-display'].length} heading + ${lists['font-body'].length} body options (${lists.groups.join(', ')}), all loaded for real`);
}

// State survives a reload; an invalid saved state is ignored instead of breaking the page.
async function checkPersistence(t) {
  await t.load();
  const restored = JSON.parse(await t.ev(`JSON.stringify({ p: state.primary, s: state.secondary, r: state.radius })`));
  if (restored.p !== '#2563eb' || restored.s !== '#9333ea' || restored.r !== PERSISTED_RADIUS) t.bad('persistence', `state not restored after reload: ${JSON.stringify(restored)}`);
  await t.ev(`localStorage.setItem('ds-configurator-state', '{"primary":"nope","radius":999,"density":"x"}'), 1`);
  t.consoleMessages.length = 0;
  await t.load();
  const afterBad = JSON.parse(await t.ev(`JSON.stringify({ p: state.primary, r: state.radius, d: state.density })`));
  if (afterBad.p === 'nope') t.bad('persistence', 'invalid saved state accepted');
  t.note(`persistence OK, invalid saved state ignored: ${JSON.stringify(afterBad)}`);
  await t.ev(`localStorage.clear(), 1`);
  await t.load();
  // Reset to defaults: off on the defaults, on after a change; it resets, and Undo brings the choices back.
  const reset = JSON.parse(await t.ev(`(async () => { const wait = (ms) => new Promise((ok) => setTimeout(ok, ms)), btn = document.getElementById('reset-btn'), out = {};
    out.offOnDefaults = btn.disabled;
    const r = document.getElementById('radius'); r.value = '9'; r.dispatchEvent(new Event('input', { bubbles: true })); await wait(50);
    document.getElementById('primary').value = '#2563eb'; document.getElementById('primary').dispatchEvent(new Event('input', { bubbles: true })); await wait(50);
    out.onAfterAChange = !btn.disabled;
    btn.click(); await wait(100);
    out.resets = state.radius === DEFAULTS.radius && state.primary === DEFAULTS.primary && document.getElementById('primary').value === DEFAULTS.primary && btn.disabled;
    document.querySelector('#reset-status button').click(); await wait(100);
    out.undoRestores = state.radius === 9 && state.primary === '#2563eb' && document.getElementById('primary').value === '#2563eb';
    return JSON.stringify(out); })()`));
  Object.entries(reset).forEach(([k, v]) => { if (v !== true) t.bad('reset', `${k}: ${v}`); });
  await t.ev(`localStorage.clear(), 1`);
  await t.load();
}

async function checkSearchAndDetails(t) {
  await t.click('.cfg-tab[data-view=components]');
  await t.sleep(200);
  const counts = await t.ev(`(() => {
    const search = document.getElementById('icon-search');
    const visible = () => [...document.querySelectorAll('.demo-icon-cell')].filter(c => !c.hidden).length;
    const type = (q) => { search.value = q; search.dispatchEvent(new Event('input', { bubbles: true })); return visible(); };
    return [type('trash'), type('zzzzqq'), type('')]; })()`);
  if (!(counts[0] >= 1 && counts[0] < 10 && counts[1] === 0 && counts[2] > 100)) t.bad('search', `icon search behaves wrong: ${counts.join(',')}`);
  // The panel explains with an "i" and its tooltip (owner, 2026-10-14): each opens on focus and Esc closes it; the
  // notes on the colours are a warning mark with their count, which follows the colours.
  const tips = JSON.parse(await t.ev(`(async () => { const wait = (ms) => new Promise((ok) => setTimeout(ok, ms)); const out = { count: 0, closed: 0, open: 0, esc: 0 };
    for (const tip of document.querySelectorAll('.cfg-panel .cfg-tip:not(.is-warning)')) {
      if (!tip.getClientRects().length) continue;
      out.count++;
      const bubble = tip.querySelector('.cfg-tip-bubble'), seen = () => getComputedStyle(bubble).visibility === 'visible';
      if (!seen()) out.closed++;
      tip.querySelector('button').focus(); await wait(200); if (seen()) out.open++;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await wait(200); if (!seen()) out.esc++;
      tip.querySelector('button').blur();
    }
    return JSON.stringify(out); })()`));
  if (tips.count < 6 || tips.closed !== tips.count || tips.open !== tips.count || tips.esc !== tips.count) t.bad('tips', `the panel's "i" tooltips misbehave: ${JSON.stringify(tips)}`);
  await t.setColor('primary', '#dd9c2b');
  await t.sleep(150);
  const notes = await t.ev(`document.querySelector('#color-notes .cfg-tip-btn')?.textContent || ''`);
  if (!/\d/.test(notes)) t.bad('tips', `a mid-tone primary should show a note count beside Color, got "${notes}"`);
  t.note(`search OK (trash=${counts[0]}, none=${counts[1]}, all=${counts[2]}); panel tips: ${JSON.stringify(tips)}, colour notes: ${notes}`);
}

// "Copy tokens only": the clipboard receives the :root block, and the button confirms.
async function checkCopy(t) {
  const copied = await t.ev(`(async () => {
    window.__copied = '';
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text) => { window.__copied = text; } }, configurable: true });
    document.getElementById('copy-btn').click();
    await new Promise(r => setTimeout(r, 200));
    return { text: window.__copied, label: document.getElementById('copy-btn').textContent }; })()`);
  if (!copied.text.startsWith('/* Button text contrast') || !copied.text.includes(':root {') || /undefined|NaN/.test(copied.text)) t.bad('copy', `copied CSS malformed: ${copied.text.slice(0, 120)}`);
  if (copied.label !== 'Copied!') t.bad('copy', `button feedback missing: ${copied.label}`);
  t.note(`copy OK: ${copied.text.split('\n').length} lines`);
}

// Density sets the base text size and the nine button heights (3 sizes x 3 densities), in pixels.
const DENSITY_SCALE = {
  // fontMd = --text-ui (a control's text, 13 / 14 / 16 — amended 2026-10-04: controls no longer take the body size);
  // fontLg = the body size (a large call to action); fontSm = --text-small
  compact: { body: 14, sm: 28, md: 36, lg: 44, row: 32, fontSm: 12, fontMd: 13, fontLg: 14, fontLink: 14, fontBadge: 11, fontCell: 12 },
  normal: { body: 16, sm: 36, md: 44, lg: 52, row: 40, fontSm: 14, fontMd: 14, fontLg: 16, fontLink: 16, fontBadge: 12, fontCell: 14 },
  spacious: { body: 18, sm: 44, md: 52, lg: 60, row: 48, fontSm: 16, fontMd: 16, fontLg: 18, fontLink: 18, fontBadge: 14, fontCell: 16 },
};

async function checkDensityScale(t) {
  await t.click('.cfg-tab[data-view=components]');
  await t.sleep(200);
  for (const [density, want] of Object.entries(DENSITY_SCALE)) {
    await t.click(`#density-presets .cfg-btn[data-preset=${density}]`);
    await t.sleep(150);
    const got = JSON.parse(await t.ev(`JSON.stringify({
      body: parseFloat(getComputedStyle(document.getElementById('preview')).fontSize),
      sm: document.querySelector('#sec-actions .btn-primary.btn-sm').getBoundingClientRect().height,
      md: document.querySelector('#sec-actions .btn-primary:not(.btn-sm):not(.btn-lg)').getBoundingClientRect().height,
      lg: document.querySelector('#sec-actions .btn-primary.btn-lg').getBoundingClientRect().height,
      row: document.querySelector('#sec-navigation .menu-item').getBoundingClientRect().height,
      fontSm: parseFloat(getComputedStyle(document.querySelector('#sec-actions .btn-primary.btn-sm')).fontSize),
      fontMd: parseFloat(getComputedStyle(document.querySelector('#sec-actions .btn-primary:not(.btn-sm):not(.btn-lg)')).fontSize),
      fontLg: parseFloat(getComputedStyle(document.querySelector('#sec-actions .btn-primary.btn-lg')).fontSize),
      fontLink: parseFloat(getComputedStyle(document.querySelector('#sec-actions .link')).fontSize),
      fontBadge: parseFloat(getComputedStyle(document.querySelector('#sec-feedback .badge')).fontSize),
      fontCell: parseFloat(getComputedStyle(document.querySelector('#sec-data-display .table td')).fontSize) })`));
    Object.keys(want).forEach((key) => {
      if (Math.abs(got[key] - want[key]) > 0.5) t.bad('density', `${density}: ${key} is ${got[key]}px, expected ${want[key]}px`);
    });
  }
  await t.click('#density-presets .cfg-btn[data-preset=normal]');
  t.note('density scale: body text, button/link/badge font sizes and 9 button heights (3 sizes x 3 densities) match the table');
}

// Gestalt proximity in the demo card: badge | title + who/when | description + action. The two gaps between
// groups must match and be clearly larger than the gaps inside a group, at every density.
const GROUP_RATIO = 1.5;
const MIN_GROUP_GAP_PX = 8;

async function checkCardGrouping(t) {
  await t.click('.cfg-tab[data-view=page]');
  await t.ev(`document.querySelector('#demo-app [data-go=projects]').click(), 1`);   // the project cards live on Projects
  await t.sleep(200);
  const notes = [];
  for (const density of Object.keys(DENSITY_SCALE)) {
    await t.click(`#density-presets .cfg-btn[data-preset=${density}]`);
    await t.sleep(150);
    const g = JSON.parse(await t.ev(`(() => {
      const card = document.querySelector('#preview .card-interactive');
      const box = (sel) => card.querySelector(sel).getBoundingClientRect();
      const badge = box('.badge'), title = box('h3'), meta = box('.card-meta'), text = box('p'), link = box('.card-group:last-child .link');
      return JSON.stringify({ badgeTitle: title.top - badge.bottom, titleMeta: meta.top - title.bottom, metaText: text.top - meta.bottom, textLink: link.top - text.bottom }); })()`));
    const between = [g.badgeTitle, g.metaText];
    const inside = [g.titleMeta, g.textLink];
    if (Math.abs(between[0] - between[1]) > 0.5) t.bad('grouping', `${density}: the two gaps between groups differ (${between.join(' vs ')}px)`);
    if (Math.abs(inside[0] - inside[1]) > 0.5) t.bad('grouping', `${density}: the two gaps inside groups differ (${inside.join(' vs ')}px)`);
    if (Math.min(...between) < GROUP_RATIO * Math.max(...inside)) t.bad('grouping', `${density}: group gap ${Math.min(...between)}px is not ${GROUP_RATIO}x the inner gap ${Math.max(...inside)}px`);
    if (Math.min(...between) < MIN_GROUP_GAP_PX) t.bad('grouping', `${density}: group gap ${Math.min(...between)}px is under ${MIN_GROUP_GAP_PX}px`);
    notes.push(`${density} ${between[0]}/${inside[0]}px`);
  }
  await t.click('#density-presets .cfg-btn[data-preset=normal]');
  t.note(`card grouping (between/inside): ${notes.join(', ')}`);
}

// Bounds taken from outside references, so the type scale is checked against them and not only against
// itself: body 14 (GitHub, Carbon) to 19 (GOV.UK); H1 about 2.0x body (Apple 34/17, Material 32/16) up to
// 2.5x (GOV.UK 48/19, Bootstrap); no page title above 48 (GOV.UK; larger sizes are display type, e.g. Tailwind
// 60-96, Material Display 57); nothing under 11 (Material label-small).
const SCALE_REFERENCE = { bodyMin: 14, bodyMax: 19, h1RatioMin: 1.9, h1RatioMax: 2.5, h1MaxPx: 48, smallestPx: 11, textStepMin: 1.08, headingStepMin: 1.15 };
// Text steps (11/12/14/16) are close by design: Material's body 16/14/12 and label 11 are 1.09-1.17 apart.
// Headings must step up clearly.
const SCALE_TABLE = { compact: [27, 22, 18], normal: [38, 28, 21], spacious: [43, 32, 24] };

async function checkScaleAgainstReferences(t) {
  const ref = SCALE_REFERENCE;
  const summary = [];
  for (const density of Object.keys(SCALE_TABLE)) {
    await t.click(`#density-presets .cfg-btn[data-preset=${density}]`);
    await t.sleep(120);
    const px = async (name) => Math.round(parseFloat(await t.readTok(name)) * 16);
    const [xs, small, body, h3, h2, h1] = [await px('--text-xs'), await px('--text-small'), await px('--text-body'), await px('--text-h3'), await px('--text-h2'), await px('--text-h1')];
    if (body < ref.bodyMin || body > ref.bodyMax) t.bad('scale', `${density}: body ${body}px is outside ${ref.bodyMin}-${ref.bodyMax}px`);
    if (h1 / body < ref.h1RatioMin || h1 / body > ref.h1RatioMax) t.bad('scale', `${density}: H1 is ${(h1 / body).toFixed(2)}x the body, references are ${ref.h1RatioMin}-${ref.h1RatioMax}x`);
    if (h1 > ref.h1MaxPx) t.bad('scale', `${density}: H1 ${h1}px is display size (over ${ref.h1MaxPx}px)`);
    if (xs < ref.smallestPx) t.bad('scale', `${density}: smallest text ${xs}px is under ${ref.smallestPx}px`);
    const chain = [xs, small, body, h3, h2, h1];
    chain.slice(1).forEach((size, k) => {
      const min = k < 2 ? ref.textStepMin : ref.headingStepMin; // xs->small, small->body are text steps
      if (size / chain[k] < min) t.bad('scale', `${density}: steps ${chain[k]} -> ${size}px are under ${min}x`);
    });
    if ([h1, h2, h3].join() !== SCALE_TABLE[density].join()) t.bad('scale', `${density}: headings are ${[h1, h2, h3].join('/')}px, expected ${SCALE_TABLE[density].join('/')}px`);
    summary.push(`${density} ${chain.reverse().join('/')}`);
  }
  await t.click('#density-presets .cfg-btn[data-preset=normal]');
  t.note(`type scale vs references (H1/H2/H3/body/small/xs): ${summary.join(', ')}`);
}

// Segmented control (added for ELECT, 2026-10-04): at every density the raised indicator sits exactly under the
// chosen option and slides to a newly chosen one; an option that is off can't be chosen; when the chosen option is
// off, no choice is shown (no indicator). Measured on the indicator itself (its ::before geometry).
async function checkSegmented(t) {
  await t.click('.cfg-tab[data-view=components]');
  await t.sleep(200);
  const SLIDE_MS = 400;
  const measure = (pick) => t.ev(`(() => { const s = [...document.querySelectorAll('#sec-actions .segmented')].find((x) => x.getAttribute('aria-label') === ${JSON.stringify(pick)});
    const cs = getComputedStyle(s, '::before'), tx = new DOMMatrix(cs.transform).m41, pad = parseFloat(cs.left);
    const on = s.querySelector(':scope > [aria-pressed="true"]');
    return JSON.stringify({ x: pad + tx, w: parseFloat(cs.width), bx: on.offsetLeft, bw: on.offsetWidth, shown: cs.visibility !== 'hidden' }); })()`).then(JSON.parse);
  for (const density of ['compact', 'normal', 'spacious']) {
    await t.click(`#density-presets .cfg-btn[data-preset=${density}]`);
    await t.sleep(SLIDE_MS);
    const a = await measure('Density');
    if (Math.abs(a.x - a.bx) > 1 || Math.abs(a.w - a.bw) > 1) t.bad('segmented', `${density}: indicator ${a.x}+${a.w} is not under the chosen option ${a.bx}+${a.bw}`);
  }
  await t.ev(`[...document.querySelectorAll('#sec-actions .segmented')].find((x) => x.getAttribute('aria-label') === 'Density').children[2].click(), 1`);
  await t.sleep(SLIDE_MS);
  const b = await measure('Density');
  if (Math.abs(b.x - b.bx) > 1) t.bad('segmented', `after a click the indicator did not slide to the new option: ${b.x} vs ${b.bx}`);
  const off = JSON.parse(await t.ev(`(() => { const all = [...document.querySelectorAll('#sec-actions .segmented')];
    const one = all.find((x) => x.querySelectorAll(':scope > :disabled').length === 1);
    const none = all.find((x) => x.querySelectorAll(':scope > :disabled').length === x.children.length);
    const before = one.querySelector('[aria-pressed="true"]').textContent; one.querySelector(':disabled').click();
    return JSON.stringify({ kept: one.querySelector('[aria-pressed="true"]').textContent === before, noneHidden: getComputedStyle(none, '::before').visibility === 'hidden' }); })()`));
  if (!off.kept) t.bad('segmented', 'an option that is off could be chosen');
  if (!off.noneHidden) t.bad('segmented', 'all options off, but the indicator still shows a choice');
  await t.click('#density-presets .cfg-btn[data-preset=normal]');
  t.note('segmented control: the indicator sits under the chosen option at 3 densities, slides on a click; off options stay off');
}

// The other pieces added from ELECT (2026-10-04), by behaviour: a real <dialog> opens and its buttons close it; the
// phone navbar hides its links until the menu button opens it; the "i" shows its bubble on keyboard focus only; a
// slider shows its value; a disabled link reads as off; a code block keeps its lines (scrolls instead of wrapping).
async function checkElectPieces(t) {
  // a headless window has no focus, so :focus would never match — emulate a focused page
  await t.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await t.click('.cfg-tab[data-view=components]');
  await t.sleep(200);
  const r = JSON.parse(await t.ev(`(async () => { const q = (s) => document.querySelector(s), wait = (ms) => new Promise((ok) => setTimeout(ok, ms)), out = {};
    q('#sec-overlays [data-open-dialog]').click(); await wait(50); const d = q('#demo-real-dialog');
    out.dialogOpens = d.open && d.matches(':modal'); d.querySelector('button[value="cancel"]').click(); await wait(50); out.dialogCloses = !d.open;
    const nav = q('#sec-navigation .navbar.is-folded:not(.is-open)'), links = () => getComputedStyle(nav.querySelector('.navbar-links')).display;
    out.foldedHidden = links() === 'none'; nav.querySelector('.navbar-toggle').click(); out.opens = links() !== 'none' && nav.querySelector('.navbar-toggle').getAttribute('aria-expanded') === 'true';
    nav.querySelector('.navbar-toggle').click();
    const tip = q('#sec-overlays .info-tip:not(.is-open)'), bubble = () => getComputedStyle(tip.querySelector('.tooltip')).visibility;
    out.tipHidden = bubble() === 'hidden'; tip.focus({ focusVisible: true }); await wait(200); out.tipOnFocus = bubble() === 'visible'; tip.blur();
    const range = q('#sec-forms .range:not(:disabled)'); range.value = 7; range.dispatchEvent(new Event('input', { bubbles: true }));
    out.rangeValue = range.closest('.form-row').querySelector('.form-row-value').textContent;
    const link = q('#sec-actions .link:disabled'); out.linkOff = getComputedStyle(link).cursor === 'not-allowed' && getComputedStyle(link).textDecorationLine === 'none';
    const pre = q('#sec-typography pre'); out.preKeepsLines = getComputedStyle(pre).whiteSpace === 'pre' && ['auto', 'scroll'].includes(getComputedStyle(pre).overflowX);
    return JSON.stringify(out); })()`));
  Object.entries(r).forEach(([k, v]) => { if (v !== true && !(k === 'rangeValue' && v === '7 days')) t.bad('elect pieces', `${k}: ${v}`); });
  t.note(`pieces from ELECT: dialog opens + closes, phone menu folds, "i" on focus, slider value, disabled link, code block — ${JSON.stringify(r)}`);
}

module.exports = { checkElectPieces, checkSegmented, checkDefaults, checkStructure, checkTabs, checkPresetButtons, checkPresetEffects, checkColorsAndRadius, checkBackgroundAndElevation, checkFonts, checkDensityScale, checkScaleAgainstReferences, checkCardGrouping, checkPersistence, checkSearchAndDetails, checkCopy };

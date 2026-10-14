// Test steps for colours and styles: the token math, contrast measured on the rendered page, and
// the outline / duotone / filled treatment of buttons and pills.
const { pageContrastScan, pageSweep } = require('./page-checks.js');

const SWEEP_COMBINATIONS = 400;
const VIEWS = ['page', 'components'];
const DENSITIES = ['compact', 'normal', 'spacious'];
const CONTROL_STYLE_SAMPLES = ['.btn-primary', '.btn-secondary', '.btn-destructive', '.badge:not([class*=badge-])', '.badge-success', '.badge-warning', '.badge-error', '.badge-info', '.badge-neutral'];
const TRANSPARENT = 'rgba(0, 0, 0, 0)';
const TRANSITION_MS = 600; // colour transitions run 0.2s; measure only after they end

const presetSelector = (group, value) => `#${group}-presets .cfg-btn[data-preset=${value}]`;

async function checkSweep(t) {
  const sweep = await t.fn(pageSweep, SWEEP_COMBINATIONS);
  t.note(`sweep: ${sweep.combos} color/mode combos`);
  Object.entries(sweep.fails).forEach(([k, v]) => t.bad('sweep', `${k}: ${v.count} failures, e.g. ${v.sample.join(' ; ')}`));
}

// Runs the contrast scan for every mode x density x view, then reports: failures under WCAG are
// problems, failures only under APCA are the known mid-tone limit and are noted.
async function measureContrast(t, { modes, densities = [null], label }) {
  const runs = [];
  for (const mode of modes) {
    for (const density of densities) {
      await t.click(presetSelector('contrast', mode));
      if (density) await t.click(presetSelector('density', density));
      for (const view of VIEWS) {
        await t.click(`.cfg-tab[data-view=${view}]`);
        await t.sleep(150);
        runs.push({ id: [mode, density, view].filter(Boolean).join('/'), mode, ...(await t.fn(pageContrastScan, '#preview')) });
      }
    }
  }
  const byElement = new Map();
  runs.forEach((r) => r.fails.forEach((f) => {
    const key = `${f.tag}.${f.cls}|${f.text}`;
    if (!byElement.has(key)) byElement.set(key, { ...f, runs: [] });
    byElement.get(key).runs.push(r);
  }));
  byElement.forEach((f) => {
    const message = `${f.tag}.${f.cls} "${f.text}" ${f.ratio}:1 (needs ${f.need}) in ${f.runs.map((r) => r.id).join(', ')}`;
    if (f.runs.some((r) => r.mode === 'wcag')) t.bad(label, message);
    else t.note(`(APCA mode only, expected) ${label}: ${message}`);
  });
  return runs.length;
}

async function checkRenderedContrast(t) {
  await t.ev(`(() => { state.primary = '#b8823a'; state.secondary = '#56749a'; applyTokens(); return 1; })()`);
  const runs = await measureContrast(t, { modes: ['wcag', 'apca'], densities: DENSITIES, label: 'contrast' });
  t.note(`rendered contrast: ${runs} runs (contrast rule x density x view)`);
}

const controlsState = (t) => t.ev(`JSON.stringify({
  optionHidden: document.getElementById('controls-option').hidden,
  outline: document.getElementById('preview').classList.contains('controls-outline'),
  duotone: document.getElementById('preview').classList.contains('controls-duotone'),
  buttonBorder: getComputedStyle(document.querySelector('#preview .btn-primary')).borderTopWidth,
  buttonBg: getComputedStyle(document.querySelector('#preview .btn-primary')).backgroundColor,
  badgeBorder: getComputedStyle(document.querySelector('#preview .badge-success')).borderTopWidth,
  badgeBg: getComputedStyle(document.querySelector('#preview .badge-success')).backgroundColor,
  tertiaryBorder: getComputedStyle(document.querySelector('#preview .btn-tertiary')).borderTopWidth })`).then(JSON.parse);

async function checkDuotoneControls(t) {
  await t.click(presetSelector('icon', 'outline'));
  if ((await controlsState(t)).optionHidden) t.bad('duo', 'option should be available for outline');
  await t.click(presetSelector('icon', 'duotone'));
  const off = await controlsState(t);
  if (off.optionHidden || off.duotone) t.bad('duo', `duotone should show the option unchecked and not yet apply it: ${JSON.stringify(off)}`);
  await t.click('#style-controls');
  await t.sleep(150);
  const on = await controlsState(t);
  if (!on.duotone || on.buttonBorder !== '2px' || on.badgeBorder !== '2px') t.bad('duo', `duotone styling not applied: ${JSON.stringify(on)}`);
  if (on.tertiaryBorder === '2px') t.bad('duo', 'tertiary should keep its look (no 2px border) so it differs from primary');
  if (await t.ev(`JSON.parse(localStorage.getItem('ds-configurator-state')).styleControls`) !== true) t.bad('duo', 'option not persisted');
  await t.click(presetSelector('icon', 'outline'));
  if ((await controlsState(t)).duotone) t.bad('duo', 'class stays on after leaving duotone');
  await t.click(presetSelector('icon', 'duotone'));
  const copied = await t.ev(`(async () => { window.__copied = ''; document.getElementById('copy-btn').click(); await new Promise(r => setTimeout(r, 200)); return window.__copied; })()`);
  if (!copied.includes('controls-duotone')) t.bad('duo', 'copied CSS does not mention the controls-duotone class');
}

// Outline: no fill, a 2px border, and text and border are exactly the same colour.
async function checkOutlineControls(t) {
  await t.click(presetSelector('icon', 'outline'));
  await t.sleep(TRANSITION_MS);
  const s = await controlsState(t);
  if (s.optionHidden || !s.outline || s.duotone || s.buttonBorder !== '2px' || s.buttonBg !== TRANSPARENT || s.badgeBg !== TRANSPARENT) t.bad('outline', `outline buttons/pills should be border-only: ${JSON.stringify(s)}`);
  const colors = JSON.parse(await t.ev(`JSON.stringify(${JSON.stringify(CONTROL_STYLE_SAMPLES)}.map((sel) => {
    const el = document.querySelector('#preview ' + sel);
    if (!el) return [sel, 'missing'];
    const cs = getComputedStyle(el);
    return [sel, cs.color === cs.borderTopColor, cs.color, cs.borderTopColor]; }))`));
  colors.forEach(([sel, same, text, border]) => {
    if (same === 'missing') t.bad('outline', `${sel} not found`);
    else if (!same) t.bad('outline', `text and border differ on ${sel}: ${text} vs ${border}`);
  });
}

async function checkFilledControls(t) {
  await t.click(presetSelector('icon', 'filled'));
  await t.sleep(150);
  const s = await controlsState(t);
  if (!s.optionHidden || s.outline || s.duotone || s.buttonBg === TRANSPARENT) t.bad('filled', `filled must keep solid buttons and hide the option: ${JSON.stringify(s)}`);
}

async function checkIconStyleControls(t) {
  await checkDuotoneControls(t);
  await checkOutlineControls(t);
  await checkFilledControls(t);
  await t.click(presetSelector('icon', 'outline'));
  const outlineRuns = await measureContrast(t, { modes: ['apca', 'wcag'], label: 'outline-contrast' });
  await t.click(presetSelector('icon', 'duotone'));
  const duotoneRuns = await measureContrast(t, { modes: ['apca', 'wcag'], label: 'duo-contrast' });
  t.note(`icon-style controls: option, classes, persistence, same-colour outline, ${outlineRuns + duotoneRuns} contrast runs`);
  await t.click(presetSelector('icon', 'outline'));
}

module.exports = { checkSweep, checkRenderedContrast, checkIconStyleControls };

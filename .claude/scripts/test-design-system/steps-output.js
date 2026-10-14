// Test steps for what leaves the configurator (app.css), how the page lays out, and cross-cutting
// checks: the panel's own contrast in both themes, accessibility basics, and the browser console.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { pageExportContent, pageExportPaths, pageOverflow, pageContrastScan, pageAccessibility, pageCollectFragment, pageCollect, pageInnerOverflow } = require('./page-checks.js');

const WIDTHS = [1920, 1440, 1100, 900, 700, 420];
const DESKTOP = { width: 1440, height: 900 };
const STACK_WIDTH = 700;
const FRAGMENT = '<h1>Title</h1><h3>Sub</h3><p>Body text</p><p class="text-muted text-small">Muted</p>'
  + '<button class="btn btn-primary">A</button><button class="btn btn-secondary">B</button><button class="btn btn-tertiary">C</button><button class="btn btn-destructive">D</button>'
  + '<span class="badge badge-success">S</span><span class="badge">P</span><div class="card"><h3>Card</h3></div>'
  + '<div class="field"><input placeholder=" " value="x"><label>Email</label></div>'
  + '<div class="alert alert-error"><div class="alert-body"><span class="alert-title">T</span><span>M</span></div></div>'
  + '<table class="table"><thead><tr><th>H</th></tr></thead><tbody><tr><td>c</td></tr></tbody></table><a class="link" href="#">L</a>';
const MAX_DIFFS_SHOWN = 5;

function checkExportContent(t, e) {
  if (!e.startsComment || e.importIdx < 0 || e.rootIdx < e.importIdx) t.bad('export', `app.css order wrong (comment, @import, :root): ${JSON.stringify({ c: e.startsComment, i: e.importIdx, r: e.rootIdx })}`);
  if (!e.importOk || !e.onlyCommentBeforeImport) t.bad('export', `@import malformed or not first: ${JSON.stringify({ ok: e.importOk, first: e.onlyCommentBeforeImport })}`);
  if (!e.hasComponents) t.bad('export', 'component styles missing from app.css');
  if (e.bad) t.bad('export', 'app.css contains undefined, NaN or [object');
  if (e.rules < 150 || !e.rootHasAccent) t.bad('export', `app.css does not parse into a full stylesheet: rules=${e.rules} accent=${e.rootHasAccent}`);
}

function checkExportPaths(t, p) {
  if (p.download.result !== 'downloaded' || p.download.type !== 'text/css' || !p.download.sameAsBuild) t.bad('export', `download path wrong: ${JSON.stringify(p.download)}`);
  if (p.save.result !== 'saved' || !p.save.sameAsBuild || p.pickerName !== 'app.css') t.bad('export', `save path wrong: ${JSON.stringify({ s: p.save, n: p.pickerName })}`);
  if (p.cancel !== 'cancelled') t.bad('export', `cancelling the dialog should end quietly: ${p.cancel}`);
  if (p.errorStatus.indexOf('Could not save: disk full') !== 0 || !p.errorClass) t.bad('export', `write error not shown: ${p.errorStatus}`);
  if (p.okLabel !== 'Saved!' || p.okStatus.indexOf('Saved app.css (') !== 0) t.bad('export', `success feedback wrong: ${p.okStatus} / ${p.okLabel}`);
}

async function checkExport(t) {
  const content = JSON.parse(await t.fn(pageExportContent));
  checkExportContent(t, content);
  checkExportPaths(t, JSON.parse(await t.fn(pageExportPaths)));
  t.note(`export: app.css ${Math.round(content.len / 1024)} KB, ${content.rules} rules; download, save, cancel and error paths OK`);
}

async function checkLayout(t) {
  await t.click('#contrast-presets .cfg-btn[data-preset=wcag]');
  await t.click('#density-presets .cfg-btn[data-preset=normal]');
  for (const width of WIDTHS) {
    await t.viewport(width, DESKTOP.height);
    for (const view of ['page', 'components']) {
      await t.click(`.cfg-tab[data-view=${view}]`);
      await t.sleep(250);
      const o = await t.fn(pageOverflow);
      if (o.pageOverflow > 1) t.bad('layout', `${width}px ${view}: page scrolls sideways by ${o.pageOverflow}px`);
      if (o.previewOverflow.length) t.bad('layout', `${width}px ${view}: content past the preview edge: ${o.previewOverflow.join(', ')}`);
    }
  }
  await t.viewport(STACK_WIDTH, DESKTOP.height);
  await t.click('.cfg-tab[data-view=components]');
  await t.sleep(250);
  const columns = await t.ev(`getComputedStyle(document.querySelector('.demo-sub')).gridTemplateColumns.split(' ').length`);
  if (columns !== 1) t.bad('layout', `sub-block columns do not stack at ${STACK_WIDTH}px`);
  await t.viewport(DESKTOP.width, DESKTOP.height);
}

// The configurator's own panel and toolbar, in both colour schemes.
async function checkChromeContrast(t) {
  const counts = [];
  for (const scheme of ['dark', 'light']) {
    await t.scheme(scheme);
    await t.sleep(300);
    for (const region of ['.cfg-panel', '.cfg-toolbar']) {
      const r = await t.fn(pageContrastScan, region);
      counts.push(r.checked);
      r.fails.forEach((f) => t.bad(`${scheme}-chrome`, `${f.tag}.${f.cls} "${f.text}" ${f.ratio}:1`));
    }
  }
  t.note(`chrome contrast: ${counts.reduce((a, b) => a + b, 0)} elements in dark and light`);
}

async function checkAccessibility(t) {
  (await t.fn(pageAccessibility)).forEach((m) => t.bad('a11y', m));
}

// The strongest check on app.css: on a blank page with only that file, components must have the
// same computed styles as inside the configurator.
async function checkIntegration(t) {
  await t.click('.cfg-tab[data-view=components]');
  const inConfigurator = JSON.parse(await t.fn(pageCollectFragment, FRAGMENT));
  const rootClasses = await t.ev(`document.getElementById('preview').className`);
  const appCss = await t.ev('dsBuildAppCss()');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-app-'));
  // Fonts only change family names, not computed values, so the page needs no network.
  fs.writeFileSync(path.join(dir, 'app.css'), appCss.replace(/@import url\('[^']*'\);/g, ''));
  fs.writeFileSync(path.join(dir, 'page.html'), `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="app.css"></head><body class="${rootClasses}"><div id="frag">${FRAGMENT}</div></body></html>`);
  await t.send('Page.navigate', { url: pathToFileURL(path.join(dir, 'page.html')).href });
  await t.sleep(1200);
  const standalone = JSON.parse(await t.fn(pageCollect, '#frag'));
  fs.rmSync(dir, { recursive: true, force: true });
  if (inConfigurator.length !== standalone.length) t.bad('integration', `different element counts: ${inConfigurator.length} vs ${standalone.length}`);
  const diffs = inConfigurator.filter((line, i) => line !== standalone[i]);
  diffs.slice(0, MAX_DIFFS_SHOWN).forEach((line) => t.bad('integration', `configurator vs app.css differ on ${line.split(' ')[0]}: ${line}`));
  t.note(`integration: ${inConfigurator.length} elements compared, ${diffs.length} differences`);
}

// "Save app.css" must work with the configurator opened as a file (double-click, or the dashboard's link),
// not only through a server: the component styles come from the generated .js, which must match the .css.
async function checkExportFromFile(t) {
  const scriptsDir = path.join(__dirname, '..');
  const onDisk = ['design-system-components.css', 'design-system-layouts.css'].map((f) => fs.readFileSync(path.join(scriptsDir, f), 'utf8')).join('\n');
  await t.send('Page.navigate', { url: pathToFileURL(path.join(scriptsDir, 'design-system-configurator.html')).href });
  await t.sleep(1500);
  const embedded = await t.ev('window.DS_COMPONENTS_CSS');
  if (embedded !== onDisk) t.bad('export', 'design-system-components.js is out of date: run node .claude/scripts/generate-components-js.js');
  const appCss = await t.ev('dsBuildAppCss().catch((e) => "FAILED: " + e.message)');
  if (appCss.startsWith('FAILED') || !appCss.includes(onDisk.trim())) t.bad('export', `app.css from file:// ${appCss.startsWith('FAILED') ? appCss : 'is missing the component styles'}`);
  t.note(`export from file://: app.css ${Math.round(appCss.length / 1024)} KB, component styles match the .css`);
}

function checkConsole(t) {
  [...new Set(t.consoleMessages)].forEach((m) => t.bad('console', m));
}

// Nothing may spill out of its own component at any density (larger text and wider badges are the usual cause).
async function checkInnerOverflow(t) {
  for (const density of ['compact', 'normal', 'spacious']) {
    await t.click(`#density-presets .cfg-btn[data-preset=${density}]`);
    for (const view of ['page', 'components']) {
      await t.click(`.cfg-tab[data-view=${view}]`);
      await t.sleep(150);
      (await t.fn(pageInnerOverflow)).forEach((m) => t.bad('overflow', `${density}/${view}: ${m}`));
    }
  }
  await t.click('#density-presets .cfg-btn[data-preset=normal]');
}

module.exports = { checkInnerOverflow, checkExport, checkExportFromFile, checkLayout, checkChromeContrast, checkAccessibility, checkIntegration, checkConsole };

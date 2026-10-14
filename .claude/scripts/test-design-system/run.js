// Full test of the design system configurator, in a real browser (Chrome or Edge, headless).
//
//   node .claude/scripts/test-design-system/run.js
//
// It starts its own static server for the project, drives the page through the Chrome DevTools
// Protocol, and checks: every control, fonts loading, saved state, the generated app.css (content,
// save paths, and that it alone reproduces the components), contrast measured on the rendered page
// and over 800 colour combinations, layout at several widths, both themes of the panel,
// accessibility basics and the console. Exit code 1 means a new problem was found.
const path = require('path');
const { startStaticServer, launchBrowser, sleep } = require('./browser.js');
const ui = require('./steps-ui.js');
const style = require('./steps-style.js');
const output = require('./steps-output.js');
const demo = require('./steps-demo.js');
const kit = require('./steps-kit.js');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const CONFIGURATOR_PATH = '/.claude/scripts/design-system-configurator.html';
const PAGE_SETTLE_MS = 2500;

// Problems already recorded in memory/backlog.md. Reported separately and they do not fail the run;
// delete an entry when its backlog item is fixed.
const KNOWN_ISSUES = [];

const STEPS = [
  ['defaults', ui.checkDefaults], ['structure', ui.checkStructure], ['tabs', ui.checkTabs],
  ['preset buttons', ui.checkPresetButtons], ['preset effects', ui.checkPresetEffects], ['density scale', ui.checkDensityScale], ['type scale vs references', ui.checkScaleAgainstReferences], ['card grouping', ui.checkCardGrouping],
  ['colors and radius', ui.checkColorsAndRadius], ['background and elevation', ui.checkBackgroundAndElevation], ['fonts', ui.checkFonts], ['persistence', ui.checkPersistence],
  ['search and details', ui.checkSearchAndDetails], ['segmented control', ui.checkSegmented], ['pieces from ELECT', ui.checkElectPieces], ['page example app', demo.checkDemoApp], ['copy', ui.checkCopy], ['export', output.checkExport],
  ['token sweep', style.checkSweep], ['rendered contrast', style.checkRenderedContrast],
  ['icon-style controls', style.checkIconStyleControls], ['inner overflow', output.checkInnerOverflow], ['layout', output.checkLayout],
  ['chrome contrast', output.checkChromeContrast], ['accessibility', output.checkAccessibility],
  ['integration', output.checkIntegration], ['export from a file', output.checkExportFromFile], ['console', output.checkConsole], ['kit scripts', kit.checkKitScripts],
];

function makeContext(browser, origin) {
  const issues = [];
  const notes = [];
  const ev = async (expression) => {
    const r = await browser.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || `eval error: ${expression.slice(0, 80)}`);
    return r.result.result.value;
  };
  const t = {
    issues, notes, ev, sleep, send: browser.send, consoleMessages: browser.consoleMessages,
    bad: (area, message) => issues.push(`[${area}] ${message}`),
    note: (message) => notes.push(message),
    fn: (f, ...args) => ev(`(${f.toString()})(${args.map((a) => JSON.stringify(a)).join(',')})`),
    click: (selector) => ev(`document.querySelector(${JSON.stringify(selector)}).click(), 1`),
    readTok: (name) => ev(`getComputedStyle(document.getElementById('preview')).getPropertyValue('${name}').trim()`),
    setColor: (id, value) => ev(`(() => { const e = document.getElementById(${JSON.stringify(id)}); e.value = ${JSON.stringify(value)}; e.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`),
    viewport: (width, height) => browser.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }),
    scheme: (value) => browser.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value }] }),
    load: async () => { await browser.send('Page.navigate', { url: origin + CONFIGURATOR_PATH }); await sleep(PAGE_SETTLE_MS); },
  };
  return t;
}

async function runSteps(t) {
  await Promise.all(['Page.enable', 'Runtime.enable', 'Log.enable'].map((m) => t.send(m)));
  await t.viewport(1440, 900);
  await t.scheme('light');
  await t.load();
  await t.ev('try { localStorage.clear() } catch (e) {} 1'); // clear on the real origin, then start fresh
  await t.load();
  for (const [name, step] of STEPS) {
    try { await step(t); } catch (e) { t.bad('harness', `step "${name}" crashed: ${e.message}`); }
  }
}

function report(t) {
  const known = [];
  const unknown = [];
  t.issues.forEach((issue) => {
    const match = KNOWN_ISSUES.find((k) => k.pattern.test(issue));
    if (match) known.push(`${issue}  (known: ${match.reason})`); else unknown.push(issue);
  });
  console.log(`\n=== NOTES ===\n${t.notes.join('\n')}`);
  console.log(`\n=== NEW PROBLEMS (${unknown.length}) ===\n${unknown.length ? unknown.join('\n') : 'none'}`);
  if (known.length) console.log(`\n=== KNOWN, TRACKED IN THE BACKLOG (${known.length}) ===\n${known.join('\n')}`);
  return unknown.length;
}

async function main() {
  const server = await startStaticServer(PROJECT_ROOT);
  const browser = await launchBrowser();
  const t = makeContext(browser, server.origin);
  try {
    await runSteps(t);
  } finally {
    await browser.close();
    server.close();
  }
  process.exit(report(t) ? 1 : 0);
}

main().catch((e) => { console.error(`Test could not run: ${e.message}`); process.exit(2); });

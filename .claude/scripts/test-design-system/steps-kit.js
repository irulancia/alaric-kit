// The kit's own scripts, not just the configurator: every script must parse, and the page generators must run. A broken
// string in generate-dashboard.js once went unnoticed (2026-10-14) because nothing here ran it.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SCRIPTS = path.join(__dirname, '..');
const PROJECT = path.join(SCRIPTS, '..', '..');
const GENERATORS = ['generate-dashboard.js', 'generate-backlog.js', 'generate-git-history.js'];

function checkKitScripts(t) {
  const files = fs.readdirSync(SCRIPTS).filter((f) => f.endsWith('.js')).map((f) => path.join(SCRIPTS, f));
  files.forEach((file) => {
    try {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (e) {
      t.bad('kit scripts', `${path.basename(file)} does not parse: ${String(e.stderr || e.message).split('\n').find((l) => /Error/.test(l)) || ''}`);
    }
  });
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-pages-'));
  GENERATORS.forEach((g) => {
    try {
      execFileSync(process.execPath, [path.join(SCRIPTS, g), path.join(out, g.replace('generate-', '').replace('.js', '.html'))], { cwd: PROJECT, stdio: 'pipe' });
    } catch (e) {
      t.bad('kit scripts', `${g} failed: ${String(e.stderr || e.message).split('\n').find((l) => /Error/.test(l)) || ''}`);
    }
  });
  fs.rmSync(out, { recursive: true, force: true });
  t.note(`kit scripts: ${files.length} parse, ${GENERATORS.length} page generators run`);
}

module.exports = { checkKitScripts };

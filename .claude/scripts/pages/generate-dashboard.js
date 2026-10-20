#!/usr/bin/env node
// Generates a single entry-point page linking to everything this .claude/
// template provides: available commands (scanned live from commands/, so
// it never drifts out of sync) and the other generated pages (git history,
// backlog) if they exist yet.
//
// Usage: node .claude/scripts/pages/generate-dashboard.js [output-path]

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const { getProjectName } = require('./project-name.js');

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const outputPath = path.resolve(projectDir, process.argv[2] || 'dashboard.html');
const commandsDir = path.join(__dirname, '..', '..', 'commands');
const rulesDir = path.join(__dirname, '..', '..', 'rules');
const ICONS_JS = path.join(__dirname, '..', 'configurator', 'icons.js');
// Alaric itself, the kit's workshop: it has tools/package-kit.js, which never ships in the kit.
const IS_ALARIC = fs.existsSync(path.join(__dirname, '..', '..', '..', 'tools', 'package-kit.js'));

// configurator/icons.js's GROUPS (tools/generate-icons.js in Alaric) is a wishlist: an icon with no duotone
// that holds up gets silently dropped from the generated set, so a name that looks right here
// can still not exist. Load the real set and check against it below instead of assuming.
function knownIconNames() {
  const src = fs.readFileSync(ICONS_JS, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(src, sandbox);
  return new Set(Object.keys(sandbox.window.DS_ICONS || {}));
}

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walk(full));
    else if (entry.name.endsWith('.md')) results.push(full);
  }
  return results;
}

function parseFrontmatter(content) {
  // .gitattributes normalizes checked-in files to LF, but this also reads whatever a contributor's
  // editor wrote before that ran, so tolerate CRLF instead of silently returning no frontmatter.
  const match = content.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  match[1].split('\n').forEach((line) => {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  });
  return fm;
}

// One Phosphor icon per item (names from configurator/icons.js's actual generated set — see
// knownIconNames() above, checked below). Keyed by whatever's stable and known upfront (command
// name, rule title, page file); anything added later that isn't in here just gets the fallback
// instead of breaking.
const ICONS = {
  'history.html': 'clock-counter-clockwise',
  'backlog.html': 'clipboard-text',
  inbox: 'tray',
  configurator: 'squares-four',
  'Coding Style': 'code',
  'Commit Categories': 'tag',
  'Design System': 'squares-four',
  'Development Workflow': 'gear',
  Security: 'shield-check',
  'Svelte 5 Conventions': 'cube',
  'project:bootstrap': 'lightning',
  'start-done': 'check-circle',
  'project:plan': 'notepad',
  'project:review': 'magnifying-glass',
  'project:commit': 'check-circle',
  'project:dashboard': 'gauge',
  'project:backlog': 'clipboard-text',
  'project:history': 'clock-counter-clockwise',
  'audit:bugs': 'bug',
  'audit:memory': 'database',
};
const FALLBACK_ICON = 'article';
// Where the clean kit lives (its own repo, not this workshop — owner, 2026-10-14): the dashboard's subtitle links to it.
const KIT_REPO_URL = 'https://github.com/irulancia/alaric-kit';
const iconFor = (key) => ICONS[key] || FALLBACK_ICON;

const KNOWN_ICONS = knownIconNames();
[...new Set(Object.values(ICONS))].concat(FALLBACK_ICON).forEach((name) => {
  if (!KNOWN_ICONS.has(name)) {
    throw new Error(`pages/generate-dashboard.js: icon "${name}" isn't in configurator/icons.js's generated set. Pick one from there instead (it drops icons that don't have a duotone that holds up).`);
  }
});

function commandName(filePath) {
  const rel = path.relative(commandsDir, filePath).replace(/\.md$/, '');
  return rel.split(path.sep).join(':');
}

function getCommands() {
  if (!fs.existsSync(commandsDir)) return [];
  return walk(commandsDir).map((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const fm = parseFrontmatter(content);
    const name = commandName(file);
    return { name, description: fm.description || '', icon: iconFor(name) };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

function getRules() {
  if (!fs.existsSync(rulesDir)) return [];
  return walk(rulesDir).map((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const fm = parseFrontmatter(content);
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const label = titleMatch ? titleMatch[1].trim() : path.basename(file, '.md');
    const rel = path.relative(projectDir, file).split(path.sep).join('/');
    return { label, description: fm.description || '', file: rel, icon: iconFor(label) };
  }).sort((a, b) => a.label.localeCompare(b.label));
}

function fileExists(name) {
  return fs.existsSync(path.join(projectDir, name));
}

const readIfExists = (name) => (fileExists(name) ? fs.readFileSync(path.join(projectDir, name), 'utf8') : '');
const APP_CSS = 'src/app.css';
const CONFIGURATOR_MARK = 'generated by the Design System Configurator';
// Where an app's <body> usually lives: SvelteKit first (the kit's default), then plain / Vite pages.
const BODY_FILES = ['src/app.html', 'index.html', 'public/index.html'];

function hasCommit() {
  try {
    execFileSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: projectDir, stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;   // no repo yet, or a repo with no commit: both mean "not yet"
  }
}

// "Start here": the steps of starting a project from the kit, each checked against what is actually
// in the project when the page is generated (bootstrap regenerates it), never ticked by hand. Hidden
// once all are done, and in Alaric itself — the kit's workshop has no app to set up.
function getStartSteps() {
  if (IS_ALARIC) return [];
  const steps = [
    { title: 'Set up the project', todo: 'Run /project:bootstrap in Claude Code.', done: fileExists('CLAUDE.md') },
    { title: 'Pick the design system', todo: 'Open Design System below, press Save src/app.css and save it in the src folder of this project, then tell Claude "done".', done: readIfExists(APP_CSS).includes(CONFIGURATOR_MARK) },
    { title: 'Connect it to the app', todo: 'Claude adds class="ds-root" to <body> and imports app.css once — ask it to, if it hasn\'t.', done: BODY_FILES.some((f) => readIfExists(f).includes('ds-root')) },
    { title: 'First commit', todo: 'Ask Claude to commit (/project:commit).', done: hasCommit() },
  ];
  if (steps.every((s) => s.done)) return [];
  return steps.map((s) => ({ ...s, icon: s.done ? iconFor('start-done') : null }));
}

// The pillars this kit hands you, one big card each -- not scanned from the filesystem
// like commands/rules below, there are only a few of these and what each one is doesn't change
// project to project. Design System always exists (checked into the kit); the other two are
// generated pages that might not exist yet on a fresh clone, same "not generated yet" state the
// old Pages section had.
function getHero() {
  return [
    {
      href: '.claude/scripts/configurator/configurator.html', icon: iconFor('configurator'), color: 'var(--cat-content)',
      title: 'Design System', desc: 'Colors, type, spacing and shape — configure and export a ready-to-use app.css.', exists: true,
    },
    {
      href: 'backlog.html', icon: iconFor('backlog.html'), color: 'var(--cat-frontend)',
      title: 'Backlog', desc: 'What is shipped and what is open, searchable and filterable by area.',
      exists: fileExists('backlog.html'), regen: '/project:backlog',
    },
    {
      href: '.claude/scripts/pages/inbox.html', icon: iconFor('inbox'), color: 'var(--cat-logic)',
      title: 'Inbox', desc: 'Write a note for Claude, in any language — it goes into the backlog.', exists: true,
    },
    {
      href: 'history.html', icon: iconFor('history.html'), color: 'var(--cat-tooling)',
      title: 'Git History', desc: 'Every commit, searchable by message, file, date and area.',
      exists: fileExists('history.html'), regen: '/project:history',
    },
  ];
}

function build() {
  const commands = getCommands();
  const rules = getRules();
  const hero = getHero();

  const template = fs.readFileSync(path.join(__dirname, 'dashboard.template.html'), 'utf8');
  const html = template
    .replace('/*__PROJECT_NAME__*/', JSON.stringify(getProjectName(projectDir)))
    .replace('/*__COMMANDS_JSON__*/', JSON.stringify(commands))
    .replace('/*__RULES_JSON__*/', JSON.stringify(rules))
    .replace('/*__HERO_JSON__*/', JSON.stringify(hero))
    .replace('/*__START_JSON__*/', JSON.stringify(getStartSteps()))
    .replace('/*__KIT__*/', JSON.stringify({ url: KIT_REPO_URL, isKit: IS_ALARIC }));
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`Wrote dashboard (${commands.length} commands, ${rules.length} rules) to ${outputPath}`);
}

build();

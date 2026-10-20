#!/usr/bin/env node
// Parses memory/backlog.md (## sections, - [ ]/- [x] items with optional
// [category] tags and an optional {S}/{M}/{L} size) into a searchable, filterable HTML page. backlog.md
// stays the single source of truth — this is a regenerated view of it.
//
// Usage: node .claude/scripts/pages/generate-backlog.js [output-path]

const fs = require('fs');
const path = require('path');
const { getProjectName } = require('./project-name.js');

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const inputPath = path.resolve(projectDir, 'memory/backlog.md');
const outputPath = path.resolve(projectDir, process.argv[2] || 'backlog.html');

if (!fs.existsSync(inputPath)) {
  console.error(`No memory/backlog.md found at ${inputPath}`);
  process.exit(1);
}

const md = fs.readFileSync(inputPath, 'utf8');
const lines = md.split('\n');

const items = [];
let currentSection = null;

for (const line of lines) {
  const sectionMatch = line.match(/^##\s+(.*)/);
  if (sectionMatch) {
    currentSection = sectionMatch[1].trim();
    continue;
  }
  const itemMatch = line.match(/^-\s+\[( |x)\]\s*(.*)/i);
  if (itemMatch) {
    const done = itemMatch[1].toLowerCase() === 'x';
    let text = itemMatch[2].trim();
    const categories = new Set();
    text = text.replace(/\[(frontend|logic|content|backend|tooling)\]/gi, (_, cat) => {
      categories.add(cat.toLowerCase());
      return '';
    }).trim();
    // Optional size right after the category tags: {S} / {M} / {L}. Only at the start, so a
    // "{S}" quoted inside an item's text isn't read as its size.
    let size = null;
    text = text.replace(/^\{(S|M|L)\}\s*/, (_, s) => {
      size = s;
      return '';
    });
    // Optional type after the size: {bug} {check} {decision} {idea} {internal} — what kind of work it is.
    let type = null;
    text = text.replace(/^\{(bug|check|decision|idea|internal)\}\s*/, (_, t) => {
      type = t;
      return '';
    });
    items.push({
      section: currentSection,
      done,
      text,
      categories: Array.from(categories),
      size,
      type,
    });
  }
}

const template = fs.readFileSync(path.join(__dirname, 'backlog.template.html'), 'utf8');
const html = template
  .replace('/*__PROJECT_NAME__*/', JSON.stringify(getProjectName(projectDir)))
  .replace('/*__ITEMS_JSON__*/', JSON.stringify(items));
fs.writeFileSync(outputPath, html, 'utf8');
console.log(`Wrote ${items.length} backlog items to ${outputPath}`);

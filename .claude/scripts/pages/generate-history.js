#!/usr/bin/env node
// Generates a self-contained, searchable HTML page from local git history.
// No diffs embedded (metadata only) so it stays small even with thousands
// of commits. Run from the project root (or set CLAUDE_PROJECT_DIR).
//
// Usage: node .claude/scripts/pages/generate-history.js [output-path]

const { execSync, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getProjectName } = require('./project-name.js');

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const outputPath = path.resolve(projectDir, process.argv[2] || 'history.html');

const REC_SEP = '\x03';
const FIELD_SEP = '\x1f';

function git(args) {
  return execSync(`git ${args}`, { cwd: projectDir, maxBuffer: 1024 * 1024 * 64, encoding: 'utf8' });
}

function parseMessages() {
  const format = `%H${FIELD_SEP}%ad${FIELD_SEP}%an${FIELD_SEP}%s${FIELD_SEP}%b${REC_SEP}`;
  const raw = git(`log --date=short --pretty=format:"${format}"`);
  return raw
    .split(REC_SEP)
    .map((chunk) => chunk.replace(/^\n/, ''))
    .filter((chunk) => chunk.trim().length > 0)
    .map((chunk) => {
      const parts = chunk.split(FIELD_SEP);
      const [hash, date, author, subject] = parts;
      const body = parts.slice(4).join(FIELD_SEP).trim();
      return { hash, date, author, subject, body };
    });
}

function parseFiles() {
  const raw = git(`log --name-only --pretty=format:"${REC_SEP}%H"`);
  const map = {};
  raw.split(REC_SEP).forEach((chunk) => {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const hash = lines[0];
    map[hash] = lines.slice(1);
  });
  return map;
}

const CATEGORY_RE = /\[(frontend|logic|content|backend|tooling)\]/gi;
const TYPE_RE = /^(\w+)(\([^)]*\))?:/;

function build() {
  const messages = parseMessages();
  const filesByHash = parseFiles();

  const commits = messages.map((m) => {
    const categories = new Set();
    let match;
    CATEGORY_RE.lastIndex = 0;
    while ((match = CATEGORY_RE.exec(m.body))) {
      categories.add(match[1].toLowerCase());
    }
    const typeMatch = m.subject.match(TYPE_RE);
    return {
      hash: m.hash,
      short: m.hash.slice(0, 7),
      date: m.date,
      author: m.author,
      subject: m.subject,
      body: m.body,
      type: typeMatch ? typeMatch[1] : null,
      categories: Array.from(categories),
      files: filesByHash[m.hash] || [],
    };
  });

  const template = fs.readFileSync(path.join(__dirname, 'history.template.html'), 'utf8');
  const html = template
    .replace('/*__PROJECT_NAME__*/', JSON.stringify(getProjectName(projectDir)))
    .replace('/*__COMMITS_JSON__*/', JSON.stringify(commits));
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`Wrote ${commits.length} commits to ${outputPath}`);
}

build();
// The dashboard links this page only once it exists, so it is regenerated with it.
execFileSync(process.execPath, [path.join(__dirname, 'generate-dashboard.js')], { stdio: 'inherit' });

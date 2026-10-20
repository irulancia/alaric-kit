// Shared by pages/generate-dashboard.js, pages/generate-backlog.js and generate-history.js: the
// project's display name, read from CLAUDE.md's own H1 so it's a single source instead of
// three copies drifting (the same drift --cfg-*/--cat-* already had once). Falls back to the
// folder name before bootstrap has ever run.
const fs = require('fs');
const path = require('path');

function getProjectName(projectDir) {
  const claudeMdPath = path.join(projectDir, 'CLAUDE.md');
  if (fs.existsSync(claudeMdPath)) {
    const content = fs.readFileSync(claudeMdPath, 'utf8');
    const match = content.match(/^#\s+(.+)$/m);
    if (match) return match[1].replace(/—.*$/, '').trim();
  }
  return path.basename(projectDir);
}

module.exports = { getProjectName };

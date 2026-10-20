---
description: Regenerate dashboard.html — the entry point linking to all pages and commands this .claude template provides.
---

# /project:dashboard — Entry Point

Regenerates `dashboard.html` at the project root: lists every command in `.claude/commands/` (scanned live, so it can't drift out of sync) and links to the other generated pages (`history.html`, `backlog.html`) if they exist, with a hint to generate them if not.

## Steps
1. Run: `node .claude/scripts/pages/generate-dashboard.js`
2. Tell the user where the file is and that it's the page to open first when returning to the project

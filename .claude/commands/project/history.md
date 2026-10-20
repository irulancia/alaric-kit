---
description: Regenerate history.html, the searchable page of the local git history.
---

# /project:history — Git History Dashboard

Regenerates `history.html` at the project root from local git history — a searchable, filterable page (by text, file, date, and the 4 commit categories). No diffs embedded, stays small even at thousands of commits.

## Steps
1. Run: `node .claude/scripts/pages/generate-history.js`
2. Tell the user the file was regenerated and where it is (`history.html`, project root) — open it in a browser to use it.
3. If this is the first run and the project has few or no commits tagged with `[frontend]`/`[logic]`/`[content]`/`[backend]`, mention that older commits (from before `commits.md` existed) won't have category badges — only new commits going forward will.

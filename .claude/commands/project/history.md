---
description: Regenerate the searchable local git-history HTML page.
---

# /project:history — Git History Dashboard

Regenerates `git-history.html` at the project root from local git history — a searchable, filterable page (by text, file, date, and the 4 commit categories). No diffs embedded, stays small even at thousands of commits.

## Steps
1. Run: `node .claude/scripts/generate-git-history.js`
2. Tell the user the file was regenerated and where it is (`git-history.html`, project root) — open it in a browser to use it.
3. If this is the first run and the project has few or no commits tagged with `[frontend]`/`[logic]`/`[content]`/`[backend]`, mention that older commits (from before `commit-categories.md` existed) won't have category badges — only new commits going forward will.

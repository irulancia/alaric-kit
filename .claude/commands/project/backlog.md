---
description: Regenerate the searchable backlog.html page from memory/backlog.md.
---

# /project:backlog — Backlog Dashboard

Regenerates `backlog.html` at the project root from `memory/backlog.md` — searchable, filterable by status (open by default / done / all), size (small / medium / large), type (bug / to check / decision / idea / internal) and the 5 commit categories. `memory/backlog.md` stays the source of truth (edit it directly); this is just a generated view. "Pause" on an item is the reader's own, kept only in their browser — it never touches the file.

## Steps
1. Run: `node .claude/scripts/pages/generate-backlog.js`
2. If `memory/backlog.md` doesn't exist yet, create it first (see `/audit:memory` for the expected format: `##` sections, `- [ ]` / `- [x]` items, optional `[category]` tag per item, then an optional size `{S}` small · `{M}` medium · `{L}` large — an item without one simply shows no size; then an optional type `{bug}` · `{check}` (to verify) · `{decision}` (waiting on the owner) · `{idea}` · `{internal}` (how it's built), e.g. `- [ ] [frontend] {M} {bug} …`)
3. Tell the user the file was regenerated and where it is

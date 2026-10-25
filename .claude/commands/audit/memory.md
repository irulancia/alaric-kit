---
description: Review recent changes and bring the project's memory up to date — the backlog in memory/ and Claude Code's own memory.
---

# /audit:memory — Memory Update

Review recent changes and update what the project remembers. There are two places, and only two:
- **`memory/`** in the project — `backlog.md` (what's open and what's done), `inbox.md` (the owner's notes, waiting to be moved), `bugs-audit-{date}.md` (from `/audit:bugs`). In git, the project's own record.
- **Claude Code's memory** — the per-machine memory Claude Code keeps by itself (its `MEMORY.md` index, loaded in every session): who the user is, how they want to work, lessons and gotchas. Not in git, not shared.

The kit keeps no third, committed `MEMORY.md`.

## Steps
1. Run `git log --oneline -20` to see recent commits
2. Run `git diff HEAD~5` (or appropriate range) to see recent changes
3. `memory/backlog.md`:
   - tick what the commits finished (`- [x]`, with the date), and add what they left open or found
   - check the open items: references to deleted files or removed features, bugs already fixed, decisions already taken
4. `memory/inbox.md`: move any waiting note into the backlog (`workflow.md`, Step 5) and delete it from the inbox, keeping the header
5. Claude Code's memory: save what a future session needs and can't read from the code or `CLAUDE.md` — a preference the user stated, a gotcha that cost time; correct or delete a memory that is no longer true
6. Say in a few lines what changed

## Rules
- Stable project info (stack, architecture, commands) belongs in `CLAUDE.md`, not in memory
- Don't duplicate what's in `CLAUDE.md`, the code or the git history
- The backlog's format is the one in `/project:bootstrap` (step 5)

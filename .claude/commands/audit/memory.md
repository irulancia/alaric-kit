---
description: Review recent changes and update the project's committed MEMORY.md and related memory files.
---

# /audit:memory — Memory Update

Review recent changes and update MEMORY.md and related memory files.

## Steps
1. Run `git log --oneline -20` to see recent commits
2. Run `git diff HEAD~5` (or appropriate range) to see recent changes
3. Review current MEMORY.md content
4. Update sections:
   - **Bug audit summaries** — add new audit results, remove fixed items
   - **Architecture changes** — new files, changed patterns, new page types
   - **Known tech debt** — update status of items
   - **NEXT SESSION** — update current focus and priorities
5. Check for outdated information:
   - References to deleted files or removed features
   - Bug statuses that have changed
   - Patterns that no longer apply
6. Keep MEMORY.md under 200 lines (content after line 200 is truncated)
7. Move detailed info to dedicated files (backlog.md, bugs-audit.md, etc.)

## Memory Files
| File | Purpose |
|------|---------|
| `MEMORY.md` | Main memory — workflow rules, session notes, summaries |
| `backlog.md` | Feature backlog with phases |
| `bugs-audit.md` | Bug audit #1 details |
| `bugs-audit-2.md` | Bug audit #2 details |

## Rules
- Keep MEMORY.md concise — summaries and links, not full details
- Stable project info (stack, architecture) belongs in CLAUDE.md, not MEMORY.md
- Don't duplicate what's in CLAUDE.md
- Always preserve workflow rules section
- Update "NEXT SESSION" with current priorities

## Note
This is a project-committed, git-shared memory file — distinct from Claude Code's built-in per-machine auto memory (`~/.claude/projects/.../memory/`), which is personal and not version-controlled. Use this command when the team needs shared, in-repo project memory; the built-in auto memory handles personal preferences automatically without needing this command.

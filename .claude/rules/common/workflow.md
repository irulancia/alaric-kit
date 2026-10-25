---
description: The pipeline from bootstrap to commit, and when a git push needs explicit approval.
---

# Development Workflow

## The Pipeline (always in this order)

### Step -1 — New project? Bootstrap first
- If `CLAUDE.md` doesn't exist yet, the `SessionStart` hook already flagged this — run `/project:bootstrap` before anything else (confirms stack assumptions, generates `CLAUDE.md`)
- Skip if `CLAUDE.md` already exists

### Step 0 — Read Existing Code FIRST (mandatory)
- **NEVER improvise design** — read the existing code line by line
- When building dynamic/generic versions of existing features, copy exact patterns (props, columns, CSS classes, text)
- Source of truth is the CODE, not the conversation plan
- Check Claude Code's memory (MEMORY.md, loaded by itself) for known gotchas before starting

### Step 1 — Plan
- Break the feature into small, atomic tasks
- Identify which files will change
- Identify risks or unknowns upfront
- Use `/project:plan` for structured planning

### Step 2 — Implement
- Follow patterns from existing code
- Keep changes minimal and focused
- Test as you go (manual or svelte-check)

### Step 3 — Verify
- Run `npx svelte-check` — fix all errors
- Review against the code and security rules
- Check for console.log, any types, hardcoded secrets

### Step 4 — Commit
- Use conventional commits: `feat:` `fix:` `refactor:` `docs:` `chore:`
- Use `/project:commit` for guided commit flow

### PUSH — EXPLICIT APPROVAL REQUIRED
- **NEVER `git push` without explicit user request** — commit locally, stop there
- Push only when the user says so explicitly (e.g. "push it", "send it to GitHub", in any language)
- This applies to ALL branches and ALL remotes, including `master` / `main`
- **An earlier approval does NOT cover later pushes** — every push needs its own approval
- **If the user approved a push and more commits are left to push, stop and ask again**
- Never combine commit + push in one command without explicit approval for that specific push
- Every `git push` asks the owner to confirm through `hooks/check-push.sh`, in every mode — the `ask` in `settings.json` alone let a push through in auto mode
- `--no-verify` / `--no-gpg-sign` are blocked mechanically by `settings.json` (`deny`) — not just a written rule

### Step 5 — Update Memory
- After significant tasks: save what a later session needs in Claude Code's memory, and tick the backlog (automatic, don't ask)
- Bug audit results → `memory/bugs-audit-{date}.md`
- Use `/audit:memory` for a thorough update of both
- **The owner's inbox** (`memory/inbox.md`, written from the Inbox page on the dashboard; the SessionStart hook
  says when notes wait): when asked, or when the hook says so, move each note into `memory/backlog.md` — rewritten
  in the project's format, the owner's words quoted, an area tag and a size — and delete it from the inbox (keep the header).
  (A "Pause" on the backlog page is the owner's alone and lives only in their browser — it never reaches the files.)

## Testing Protocol
- **After each coding session:** run svelte-check (automated)
- **Before deploy:** manual smoke test of key flows

## Protected Files — DO NOT MODIFY
- `.env` — edit through environment variables only

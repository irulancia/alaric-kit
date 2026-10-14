---
description: One-time setup for a new project using this shared .claude template — confirms stack assumptions, generates CLAUDE.md, sets up git, the memory files and the generated pages, and starts the project's design system from the configurator.
---

# /project:bootstrap — New Project Setup

Runs automatically the first time a session starts in a project that has this shared `.claude/` template but no `CLAUDE.md` yet (see `hooks/session-start-check.sh`, which injects a reminder to run this). Can also be invoked manually with `/project:bootstrap`.

Goal: turn the generic template into a project-specific setup, without re-litigating from scratch every time.

## Steps
1. Look at what already exists before asking anything — `package.json`, lockfile, existing `src/` structure, `.git` remote, any README. Infer as much as possible.
2. This template defaults to: **SvelteKit + Svelte 5**, design tokens in `src/app.css` (`:root`), English UI text (`coding-style.md`), npm. Confirm these still apply, and only ask the user about what can't be inferred from the repo:
   - Framework/stack (if not Svelte — see step 3)
   - Backend (Supabase? none? something else?)
   - UI language
   - Deploy target

   **Every question can be left for later** — at the start of a project the user often doesn't know yet, and that must never block the setup (owner, 2026-10-14: "mă întreabă cam devreme… ar trebui să am și opțiune că mă decid mai târziu"). Ask in plain words, saying in one line what the choice affects (e.g. "Backend — where the app keeps its data and accounts, if it needs any"), and always offer **Decide later** as an option next to the concrete ones. For anything left for later: keep the default (Svelte, English, npm) or "none yet" (backend, deploy), write "Not decided yet" for it in `CLAUDE.md`, and add a `{decision}` item for it to `memory/backlog.md` (step 5). Don't ask twice in the same session.
3. If the stack is **not** Svelte (decided, not left for later), adjust the template instead of leaving stale assumptions:
   - Rewrite or remove `rules/svelte/svelte-conventions.md`
   - Rewrite or remove `hooks/svelte-check.sh` and its `PostToolUse` entry in `settings.json` (swap in the right type-checker/linter for the actual stack)
   - `hooks/check-design-tokens.sh` and `hooks/check-html-sanitization.sh` target `.svelte`/`.css`/`.ts`/`.js` — adjust the extension filters if the stack uses different file types
4. Write `CLAUDE.md` at the project root:
   ```
   # <Project Name> — Project Context

   ## Tech Stack
   - Framework: ...
   - Backend: ...   (or "Not decided yet — see the backlog")
   - Language: ...
   - Styling: ...
   - Package manager: ...
   - Deploy: ...    (or "Not decided yet — see the backlog")

   ## Key Commands
   (pull from package.json scripts)

   ## Architecture
   ### Key Files
   | File | Purpose |
   |------|---------|
   (leave sparse — fill in as the project grows, don't invent structure that doesn't exist yet)

   ## Protected Files — DO NOT MODIFY
   - `.env` — edit through environment variables only
   ```
5. Set up what the kit's commands, pages and hooks depend on. Create only what's missing, never overwrite (bootstrap may run on a project that already has some of it):
   - **git:** `git init` if there's no `.git`. No commit — commits need the user's go-ahead and the category tags (`commit-categories.md`). `/project:history`, `/project:commit` and `check-commit-tags.sh` need a repo.
   - **git identity:** check `git config user.name` and `git config user.email` (they may be set only per repo, not globally). If either is empty, ask the user for it and set it for this repo only (`git config user.name "…"`); otherwise the first commit fails with "Author identity unknown".
   - **`memory/backlog.md`** — the source `/project:backlog` reads (it fails without it):
     ```
     # Backlog

     <!-- One item per line, under a ## section: - [ ] [area] {S|M|L} {bug|check|decision|idea|internal} text. Size and type are optional. -->
     ```
     Then, under `## Decisions left for later`, one item per question from step 2 the user left for later, e.g. `- [ ] [backend] {S} {decision} Backend: where the app keeps its data and accounts — left for later at bootstrap (default: none yet)`. When it's decided, update `CLAUDE.md` and close the item.
   - **`memory/inbox.md`** — the Inbox page (`.claude/scripts/inbox.html`) opens it with a file picker, so it has to exist; the `SessionStart` hook counts its notes. Exactly this header (the same one the page writes):
     ```
     # Inbox

     Notes for Claude, in any language. Claude moves them into memory/backlog.md and deletes them from here.
     ```
   - **The generated pages, at the project root** (gitignored, regenerated; the root is where every project keeps them): run `node .claude/scripts/generate-backlog.js`, then `node .claude/scripts/generate-dashboard.js` (last, so it sees the backlog page). `git-history.html` waits for the first commit (`/project:history`).
6. **The design system — every project starts from the kit's, not from scratch.** Skip only if `src/app.css` already exists with the configurator's header comment.
   - Open `.claude/scripts/design-system-configurator.html` in the browser for the user (`start "" <path>` on Windows, `open` on macOS, `xdg-open` on Linux; if that fails, give the path). Tell them, in a few short lines: pick colors, fonts, density and shape; press **Save src/app.css** and save it in this project's `src/` folder; then say "done". Wait for that — don't write tokens yourself, and don't hand-edit the file.
   - When it's saved, read its header comment (the choices) and connect it: the stylesheet imported once for the whole app (SvelteKit: `import '../app.css';` in `src/routes/+layout.svelte`), and `class="ds-root"` on `<body>` (SvelteKit: `src/app.html`) — plus `controls-outline` / `controls-duotone` on the same element if the header says so. If the app doesn't exist yet (no `src/routes/`), say the wiring waits for it, and do it when it's created. Then rerun `node .claude/scripts/generate-dashboard.js`: its "Start here" card ticks each step from what's in the project.
   - Reconcile `rules/common/design.md` against the actual token names in `src/app.css` — it's a starting template, not a fixed spec. Don't invent a second, parallel token naming scheme. A variant this project needs goes in its own stylesheet, on top of `app.css`.

## After Bootstrap
Tell the user in a few lines what got set up (point them to `dashboard.html`, the entry point), the design choices from `app.css`'s header, and what (if anything) still needs a decision from them (e.g. stack mismatch, missing deploy target). Don't re-ask what was already inferred.

A gap in the kit found while bootstrapping (or later in the project) goes into Alaric's own `memory/backlog.md`, not fixed in this project's copy of `.claude/` — every project keeps the same kit.

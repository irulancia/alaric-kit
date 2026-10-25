---
description: One-time setup for a new project using this shared .claude template — confirms stack assumptions, generates CLAUDE.md, sets up git, the memory files and the generated pages, and starts the project's design system from the configurator.
---

# /project:bootstrap — New Project Setup

Runs automatically the first time a session starts in a project that has this shared `.claude/` template but no `CLAUDE.md` yet (see `hooks/check-session.sh`, which injects a reminder to run this). Can also be invoked manually with `/project:bootstrap`.

Goal: turn the generic template into a project-specific setup, without re-litigating from scratch every time.

## Steps
1. Look at what already exists before asking anything — `package.json`, lockfile, existing `src/` structure, `.git` remote, any README. Infer as much as possible.
2. This template defaults to: **SvelteKit + Svelte 5**, design tokens in `src/app.css` (`:root`), npm. Confirm these still apply, and only ask the user about what can't be inferred from the repo:
   - Framework/stack (if not Svelte — see step 3)
   - Backend (Supabase? none? something else?)
   - Deploy target

   **The user's language — for every question and message of the bootstrap, and for the app's UI languages below — is the one they write to you in.** When they have written nothing yet (only `/project:bootstrap`), it can't be known for sure — the system's language is often English anyway. Read the region (Windows: `(Get-WinHomeLocation).HomeLocation` in PowerShell; elsewhere the country in `$LANG`): if its language is English, use English and ask nothing; otherwise make **Language** the first of the questions, with the region's language first *(Recommended)* and English second, and write all the questions in the region's language — the one case where it is asked.

   **The UI languages are not asked — they come from the user's language**. English → the app is in English. Any other language → the app is in that language **and** English: a visitor sees the one their browser asks for, and English when it asks for neither. Write it in `CLAUDE.md` (`UI languages: ro (default), en`), say it in the summary in one line, and change it if the user says otherwise. With two languages, every user-facing string goes through the translation files from the first page (`code.md`).

   **Every question can be left for later** — at the start of a project the user often doesn't know yet, and that must never block the setup. Ask in plain words, saying in one line what the choice affects (e.g. "Backend — where the app keeps its data and accounts, if it needs any"), and always offer **Decide later** as an option next to the concrete ones.

   **Every question is laid out the same way**: the concrete options first — the recommended one first and marked *(Recommended)*, only where there really is one (the framework: SvelteKit, which the kit is set up for; none for backend or deploy) — and **Decide later always last**, with the same description every time: "Not chosen yet — it goes in the backlog as a decision." (the framework adds "SvelteKit stays meanwhile"). Every option has a one-line description of what choosing it means. An option that means "nothing" is named for what it is, so it can't be read as Decide later: "No backend — front-end only, nothing stored on a server", not "None". For anything left for later: keep the default (Svelte, npm) or "none yet" (backend, deploy), write "Not decided yet" for it in `CLAUDE.md`, and add a `{decision}` item for it to `memory/backlog.md` (step 5). Don't ask twice in the same session.
3. If the stack is **not** Svelte (decided, not left for later), adjust the template instead of leaving stale assumptions:
   - Rewrite or remove `rules/stack/svelte.md`
   - Rewrite or remove `hooks/check-types.sh` and its `Stop` entry in `settings.json` (swap in the right type-checker/linter for the actual stack)
   - `hooks/check-design-tokens.sh` and `hooks/check-html-sanitization.sh` target `.svelte`/`.css`/`.ts`/`.js` — adjust the extension filters if the stack uses different file types
4. Write `CLAUDE.md` at the project root:
   ```
   # <Project Name> — Project Context

   ## Tech Stack
   - Framework: ...
   - Backend: ...   (or "Not decided yet — see the backlog")
   - UI languages: ...   (e.g. "ro (default), en" — step 2)
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
   - **git:** `git init` if there's no `.git`. **A `.git` that is the kit's own** (its `origin` is the kit's repo, `alaric-kit`) came with a `git clone` of the kit: the project doesn't keep it, and nothing is asked. If every commit is the kit's (`git rev-list HEAD --not --remotes` prints nothing), start a fresh history with git alone — `git remote remove origin`, `git checkout --orphan fresh`, `git rm -r -q --cached .`, delete the old branch and rename `fresh` to it, `git reflog expire --expire=now --all`, `git gc -q --prune=now` — the files stay, the kit's commits go (they are still on GitHub). If the project already has commits of its own, only `git remote remove origin`. Say which in the summary. No commit — commits need the user's go-ahead and the category tags (`commits.md`). `/project:history`, `/project:commit` and `check-commit-tags.sh` need a repo.
   - **the kit's license:** a `LICENSE` at the root that starts with `MIT License` and names Irina Sima is the kit's, not the project's. Move it to `.claude/LICENSE` (it covers the kit's files, and its notice has to stay with them); the root is left for the project's own license, if it wants one. Don't ask, and say it in the summary.
   - **git identity:** check `git config user.name` and `git config user.email` (they may be set only per repo, not globally). If either is empty, ask the user for it and set it for this repo only (`git config user.name "…"`); otherwise the first commit fails with "Author identity unknown".
   - **`memory/backlog.md`** — the source `/project:backlog` reads (it fails without it):
     ```
     # Backlog

     <!-- One item per line, under a ## section: - [ ] [area] {S|M|L} {bug|check|decision|idea|internal} text. Size and type are optional. -->
     ```
     Then, under `## Decisions left for later`, one item per question from step 2 the user left for later, e.g. `- [ ] [backend] {S} {decision} Backend: where the app keeps its data and accounts — left for later at bootstrap (default: none yet)`. When it's decided, update `CLAUDE.md` and close the item.
   - **`memory/inbox.md`** — the Inbox page (`.claude/scripts/pages/inbox.html`) opens it with a file picker, so it has to exist; the `SessionStart` hook counts its notes. Exactly this header (the same one the page writes):
     ```
     # Inbox

     Notes for Claude, in any language. Claude moves them into memory/backlog.md and deletes them from here.
     ```
   - **The generated pages, at the project root** (gitignored, regenerated; the root is where every project keeps them): run `node .claude/scripts/pages/generate-backlog.js`, then `node .claude/scripts/pages/generate-dashboard.js` (last, so it sees the backlog page). `history.html` waits for the first commit (`/project:history`).
6. **Tell the user what got set up and what comes next — before the design system**. In the user's language, short:
   - one line on what was set up (`CLAUDE.md`, git — and what happened to the kit's history —, the license moved, the memory files, the pages), and the UI languages inferred in step 2;
   - **the next steps, numbered**, each one line:
     1. **The design system** — colours, fonts, density and shape, in the configurator; it is saved as `src/app.css` (the question below);
     2. **`dashboard.html`, the home base** — its full path; the backlog, the inbox, the rules, the commands and the configurator are one click away, and its **Start here** card shows which steps are done;
     3. **The app** — say what to build; creating it also connects the design system;
     4. **The decisions left for later**, if any (stack, backend, deploy) — they wait in the backlog;
   - then ask one question: **configure the design system now?** — *Now* (step 7) or *Later* (the dashboard's Start here and the configurator's link stay there; whenever the user asks, run step 7).
7. **The design system — every project starts from the kit's, not from scratch.** Skip only if `src/app.css` already exists with the configurator's header comment.
   - Create the `src/` folder first if it doesn't exist (no app yet is the usual case): the save dialog can only offer a folder that is there.
   - Open `.claude/scripts/configurator/configurator.html` in the browser for the user (`start "" <path>` on Windows, `open` on macOS, `xdg-open` on Linux; if that fails, give the path). Tell them, in a few short lines: pick colors, fonts, density and shape; press **Save src/app.css** and save it in this project's `src/` folder — give that folder's full path; the dialog shows only `.css` files, so the project's other files don't appear in it — then say "done". Wait for that — don't write tokens yourself, and don't hand-edit the file.
   - When it's saved, read its header comment (the choices) and connect it: the stylesheet imported once for the whole app (SvelteKit: `import '../app.css';` in `src/routes/+layout.svelte`), then `src/project.css` right after it (`import '../project.css';`) — create it if it doesn't exist, with only this comment: `/* This project's own shared classes, on top of app.css. Tokens only: a value app.css lacks (a chart or illustration colour) is defined here as a token, --name: value, and used through var(). app.css is rewritten by the configurator, this file never is. A component keeps its styles inside itself. */` — and `class="ds-root"` on `<body>` (SvelteKit: `src/app.html`) — plus `controls-outline` / `controls-duotone` on the same element if the header says so. If the app doesn't exist yet (no `src/routes/`), say the wiring waits for it, and do it when it's created. Then rerun `node .claude/scripts/pages/generate-dashboard.js`: its "Start here" card ticks each step from what's in the project.
   - Reconcile `rules/common/design.md` and `design-reference.md` against the actual token names in `src/app.css` — it's a starting template, not a fixed spec. Don't invent a second, parallel token naming scheme. A variant this project needs goes in `src/project.css`, on top of `app.css`.

## After the design system is saved
A few lines, not the setup summary again (step 6 gave it): the design choices from `app.css`'s header, whether it is connected or waits for the app, and the step that is next now (usually 3, the app). Don't re-ask what was already inferred.

A gap in the kit found while bootstrapping (or later in the project) goes into Alaric's own `memory/backlog.md`, not fixed in this project's copy of `.claude/` — every project keeps the same kit.

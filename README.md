# Alaric

A starter kit for [Claude Code](https://claude.com/claude-code): rules Claude actually follows (several enforced automatically, not just written down), a design system configurator, and a backlog — all wired into one dashboard.

## Starting a new project

1. **Copy this kit folder** and rename the copy to your project's name.
2. **Open Claude Code in it** and type `/project:bootstrap` (Claude offers it on its own the first time). It asks a few questions — stack, backend, UI language, where you deploy; any of them can be left for later, and goes into the backlog as a decision — then sets the project up: `CLAUDE.md`, git, `memory/backlog.md`, `memory/inbox.md` and the pages below.
3. **Pick your design system.** Claude opens the configurator: choose colors, fonts, density and shape, press **Save src/app.css** and save it in your project's `src/` folder. Tell Claude "done" — it connects the file to the app (`class="ds-root"` on `<body>`, the stylesheet imported once).
4. **Open `dashboard.html`** at the project root. Everything starts there: the backlog, the inbox, the rules, the commands, the configurator. Until the project is fully set up, its **Start here** card shows which of these steps are done and what's next. It's generated and gitignored: `/project:dashboard` rebuilds it.

Want to change the design later? Open the configurator again (from the dashboard) and save over `src/app.css`. Never edit that file by hand.

## The rules (`.claude/rules/`)

Rules are plain Markdown, loaded into every session. Several are also **enforced mechanically** by hooks — Claude can't just forget them. `dashboard.html` lists these live too (each one's own `description:` frontmatter, so it never drifts).

| File | Covers | Enforced by |
|---|---|---|
| `common/coding-style.md` | Indentation, immutability, file/function size limits, no magic values, no `console.log`/`any` | `check-code-quality.sh` (blocks finishing a task if violated) |
| `common/security.md` | Secrets, input sanitization, auth fail-closed, RLS checks | `check-html-sanitization.sh` (blocks unsanitized `{@html}`/`innerHTML`) |
| `common/design.md` | The design system: tokens, typography, spacing, color math, components | `check-design-tokens.sh` (blocks hardcoded colors/sizes in `.css`/`.svelte`) |
| `common/commit-categories.md` | Tagging every commit with which area it actually touched: `[frontend]`, `[logic]`, `[content]`, `[backend]`, `[tooling]` | `check-commit-tags.sh` (blocks a `git commit` with none of the 5 tags in the body) |
| `common/development-workflow.md` | The pipeline (bootstrap → plan → implement → verify → commit → memory), and that `git push` always needs explicit approval | — (workflow guidance, not mechanically enforced) |
| `svelte/svelte-conventions.md` | Svelte 5 runes, component structure, common gotchas | Applies automatically to `**/*.svelte`, `**/+page*`, `**/+layout*` |

A few more hooks back the rules above without a rules file of their own:
- `protect-critical-files.sh` — warns before editing files like `.env`
- `session-start-check.sh` — flags a fresh project and points to `/project:bootstrap`
- `rule-reminder.sh` — resurfaces the most-missed rules on every message
- `svelte-check.sh` — runs `svelte-check` after editing Svelte/TS files
- `regenerate-components-js.sh` — after `design-system-components.css` is edited, regenerates `design-system-components.js` (what "Save app.css" reads, so it works with the configurator opened as a file)

## Skills (`.claude/skills/`)

Unlike commands (invoked explicitly with `/name`), a skill can trigger itself mid-task from context — Claude loads it when its `description` matches what's happening, without being asked.

| Skill | Triggers on |
|---|---|
| `design-review` | Finishing a task that touched visual `.svelte`/`.css`/`.html` code, or being asked whether something follows the design system. Reasons about the parts of `design.md` a regex can't check (contrast rule choice, concentric radius, proximity spacing, icon-style consistency) — `check-design-tokens.sh` still catches the simple hardcoded-literal cases on its own |

## Commands (`.claude/commands/`)

Run with `/project:<name>` or `/audit:<name>`. `dashboard.html` lists these live (scanned from the files, so it never drifts), but here's the short version:

| Command | Does |
|---|---|
| `/project:bootstrap` | One-time setup for a new project: confirms the stack, generates `CLAUDE.md`, sets up git and the memory files, starts the design system |
| `/project:plan` | Structured implementation plan before writing code |
| `/project:review` | Full review of uncommitted changes against the rules above |
| `/project:commit` | Prepares and makes a clean, verified, correctly-tagged commit |
| `/project:dashboard` | Regenerates `dashboard.html` |
| `/project:backlog` | Regenerates `backlog.html` from `memory/backlog.md` |
| `/project:history` | Regenerates a searchable local git-history page |
| `/audit:bugs` | Comprehensive bug audit, categorized by severity |
| `/audit:memory` | Reviews recent changes and updates the project's memory files |

## What's generic vs. project-specific

Everything under `.claude/` is the reusable kit. `CLAUDE.md`, `memory/`, and the pages generated from them or from the project's history (`backlog.html`, `dashboard.html`, `git-history.html`), belong to each project — a new project gets its own from `/project:bootstrap`.

# Alaric

A starter kit for [Claude Code](https://claude.com/claude-code): rules Claude actually follows (several enforced automatically, not just written down), a design system configurator, and a backlog — all wired into one dashboard.

## Starting a new project

1. **Copy this kit folder** and rename the copy to your project's name.
2. **Open Claude Code in it** and type `/project:bootstrap` (Claude offers it on its own the first time). It asks a few questions — stack, backend, UI language, where you deploy; any of them can be left for later, and goes into the backlog as a decision — then sets the project up: `CLAUDE.md`, git, `memory/backlog.md`, `memory/inbox.md` and the pages below.
3. **Pick your design system.** Claude opens the configurator: choose colors, fonts, density and shape, press **Save src/app.css** and save it in your project's `src/` folder. Tell Claude "done" — it connects the file to the app (`class="ds-root"` on `<body>`, the stylesheet imported once).
4. **Open `dashboard.html`** at the project root. Everything starts there: the backlog, the inbox, the rules, the commands, the configurator. Until the project is fully set up, its **Start here** card shows which of these steps are done and what's next. It's generated and gitignored: `/project:dashboard` rebuilds it.

Want to change the design later? Open the configurator again (from the dashboard) and save over `src/app.css`. Never edit that file by hand: every save rewrites it whole. What belongs only to your project goes beside it — a component keeps its styles inside itself, and classes shared across pages go in `src/project.css`, loaded right after `app.css`.

## The rules (`.claude/rules/`)

Rules are plain Markdown, loaded into every session. Several are also **enforced mechanically** by hooks — Claude can't just forget them. `dashboard.html` lists these live too (each one's own `description:` frontmatter, so it never drifts).

| File | Covers | Enforced by |
|---|---|---|
| `common/code.md` | Indentation, immutability, file/function size limits, no magic values, no `console.log`/`any` | `check-code-quality.sh` (blocks finishing a task with a `console.log`, an `any` or a hardcoded secret left in it; file and function size are not checked) |
| `common/security.md` | Secrets, input sanitization, auth fail-closed, RLS checks | `check-html-sanitization.sh` (blocks unsanitized `{@html}`/`innerHTML`) |
| `common/design.md` | The design system's rules for any UI work, short and always loaded, with a list of every component `app.css` ships (generated from the component styles, so it can't fall behind) | `check-design-tokens.sh` (blocks hardcoded colors/sizes in `.css`/`.svelte`) |
| `common/design-reference.md` | The design system in full for a project: every token's role, every component and when to use it. Loads only when a `.svelte`/`.css`/`.html` file is read or edited (`paths:` in its frontmatter), so it costs nothing in other sessions | — |
| `common/commits.md` | Tagging every commit with which area it actually touched: `[frontend]`, `[logic]`, `[content]`, `[backend]`, `[tooling]` | `check-commit-tags.sh` (blocks a `git commit` with none of the 5 tags in the body) |
| `common/workflow.md` | The pipeline (bootstrap → plan → implement → verify → commit → memory), and that `git push` always needs explicit approval | `check-push.sh` (every `git push` asks first, in every permission mode — the `ask` in `settings.json` alone let a push through in auto mode); the rest is guidance, not enforced |
| `stack/svelte.md` | Svelte 5 runes, component structure, common gotchas | Applies automatically to `**/*.svelte`, `**/+page*`, `**/+layout*` |

A few more hooks back the rules above without a rules file of their own:
- `check-protected-files.sh` — warns before editing files like `.env`
- `check-session.sh` — flags a fresh project and points to `/project:bootstrap`
- `remind-rules.sh` — resurfaces the most-missed rules on every message
- `check-types.sh` — once, at the end of a task that changed Svelte/TS files: runs `svelte-check` and blocks finishing while it reports errors, so Claude sees them and fixes them (only once per stop, so an error it can't fix never loops)
- `regenerate-components.sh` — after `configurator/styles/components.css` is edited, regenerates `configurator/components.generated.js` (what "Save app.css" reads, so it works with the configurator opened as a file)

## Skills (`.claude/skills/`)

Unlike commands (invoked explicitly with `/name`), a skill can trigger itself mid-task from context — Claude loads it when its `description` matches what's happening, without being asked.

| Skill | Triggers on |
|---|---|
| `design-review` | Finishing a task that touched visual `.svelte`/`.css`/`.html` code, or being asked whether something follows the design system. Reasons about the parts of `design.md` / `design-reference.md` a regex can't check (contrast rule choice, concentric radius, proximity spacing, icon-style consistency) — `check-design-tokens.sh` still catches the simple hardcoded-literal cases on its own |

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
| `/project:history` | Regenerates `history.html`, a searchable page of the git history |
| `/audit:bugs` | Comprehensive bug audit, categorized by severity |
| `/audit:memory` | Reviews recent changes and updates the project's memory files |

## How the files are laid out and named

```
.claude/
├── settings.json        permissions, and which hook runs when
├── rules/
│   ├── common/          rules for any project: code, commits, design, security, workflow
│   └── stack/           rules for the chosen framework (svelte.md; bootstrap swaps it for another stack)
├── hooks/               the locked rules: scripts that run on their own and block a mistake
├── commands/            /project:… and /audit:… — what you type instead of explaining
├── skills/              what Claude starts by itself when it fits (design-review)
└── scripts/             tools for you, never read by Claude unless it works on them
    ├── configurator/    the design system configurator: open configurator.html
    │   ├── styles/      the source of app.css (components.css, layouts.css) — a new component goes here
    │   └── demo/        the example site
    └── pages/           your control panel: dashboard, backlog, history, inbox
```

Every new file follows the same naming convention:

- **Lower case, words joined by hyphens**: `pages-account.js`, `check-types.sh`.
- **A rule is named after its subject**, one noun, no suffix: `code.md`, `commits.md`, `security.md`. A subject in several parts is `subject-part`: `design.md`, `design-reference.md`.
- **A hook is named after what it does, verb first**: `check-…` when it checks or blocks, otherwise `remind-…`, `regenerate-…`.
- **The folder says what a script belongs to, the name says what it does**: `configurator/ui.js`, not `configurator/configurator-ui.js`.
- **A script you run starts with its verb**: `generate-dashboard.js`.
- **What a script writes says so**: `components.generated.js` is never edited by hand; a page's template is `dashboard.template.html`.

## What's generic vs. project-specific

Everything under `.claude/` is the reusable kit. `CLAUDE.md`, `memory/`, and the pages generated from them or from the project's history (`backlog.html`, `dashboard.html`, `history.html`), belong to each project — a new project gets its own from `/project:bootstrap`.

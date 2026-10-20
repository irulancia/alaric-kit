---
description: Prepare and execute a clean, verified commit following project conventions.
disable-model-invocation: true
---

# /project:commit — Standardized Commit

Prepare and execute a clean commit with verification.

## Steps
1. Run `git diff` and `git status` to understand all changes
2. Run `npx svelte-check` — fix any TypeScript errors
3. Scan for issues:
   - `console.log` statements left in code
   - Hardcoded secrets or API keys
   - `any` types introduced
   - Unsanitized `{@html}` usage
4. Stage related changes together (don't mix unrelated fixes)
5. Write commit message following conventional commits, with at least one `[category]`-tagged line in the body per area actually touched — see `rules/common/commits.md` (`[frontend]` / `[logic]` / `[content]` / `[backend]` / `[tooling]`). Blocked by `hooks/check-commit-tags.sh` if missing.

```
<type>: <short description in present tense>

- [category] what changed in that area
- [category] what changed in that other area

Co-Authored-By: <current Claude model, per session attribution instructions> <noreply@anthropic.com>
```

Types: `feat` `fix` `refactor` `docs` `test` `chore` `perf`

## Examples
```
feat: add drag-to-reorder for list items

- [frontend] drag handles + reorder animation on the list component

fix: prevent state loss on page type change

- [logic] preserve unrelated fields when switching page type

refactor: extract status bar into separate component

- [frontend] split StatusBar out of the main editor view

chore: update Claude Code hooks and commands

- [tooling] add commit-tag enforcement hook
```

## Pre-Commit Checks
- [ ] `npx svelte-check` passes (0 new errors)
- [ ] No `console.log` in changed files
- [ ] No `any` types in changed files
- [ ] No hardcoded secrets
- [ ] No unsanitized `{@html}`
- [ ] Commit message follows conventional format
- [ ] At least one `[frontend]`/`[logic]`/`[content]`/`[backend]`/`[tooling]` tag per area touched

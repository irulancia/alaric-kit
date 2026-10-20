---
description: Tag every commit with the area it actually touched — enforced on every git commit.
---

# Commit Categories

Every commit message body must tag at least one of these 5 categories, one line per area actually touched. Enforced by `hooks/check-commit-tags.sh` — a `git commit` with none of the 5 tags is blocked.

## The 5 categories
- `[frontend]` — **Frontend & Design**: UI, information architecture, navigation flows, UX micro-interactions
- `[logic]` — **Funcționalitate & Logică**: business rules, algorithms, features (NOT auth/permissions — that's `[backend]`)
- `[content]` — **Conținut & Date**: text, media, data structure, localization/language
- `[backend]` — **Backend & Infrastructură**: database, servers, security, auth, permissions, external integrations, performance
- `[tooling]` — **Unelte de dezvoltare**: `.claude/` (hooks, commands, rules, scripts), CI, build config — anything about *how we build*, not the shipped app itself

Auth and permissions always go under `[backend]`, never `[logic]` — avoids ambiguity between "business rule" and "who's allowed to do it." Changes to `.claude/` itself always go under `[tooling]`, never `[backend]`, even though both can involve config files.

## Format
```
<type>: <short description>

- [category] what changed in that area
- [category] what changed in that other area
```
Only tag the areas actually touched by this commit — a small single-purpose commit needs just one line, not all 4.

## Why
A single commit can span days of work touching many files. The type prefix (`feat`/`fix`/...) says what kind of change; these tags say which part of the app it touched, independent of that. Together they make history searchable later (e.g. "what backend changes happened in the last month" or "did this commit touch frontend at all") even when one commit covers a lot of ground.

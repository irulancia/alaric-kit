---
description: Indentation, immutability, file/function size limits, no magic values, no console.log/any.
---

# Coding Style

## Indentation
- Spaces (standard 2-space TypeScript/Svelte)

## Immutability
Never mutate existing objects — always return new copies:
```ts
// WRONG
page.title = "new title";

// CORRECT
const updatedPage = { ...page, title: "new title" };
```
Exception: `$state` runes in Svelte 5 are designed for direct mutation.

## File Organization
- 200–400 lines typical, **800 max**
- One concern per file — extract utilities aggressively
- Organize by feature/domain, not by type

## Function Size
- **50 lines max** per function
- If a function needs a comment to explain what a block does → extract that block

## Error Handling
- Handle errors explicitly — never swallow silently
- User-facing: friendly messages, in the project's UI languages

## UI Languages
- The languages are in `CLAUDE.md` ("UI languages"): the user's own, plus English when theirs isn't English (`/project:bootstrap`)
- One language: plain strings are fine. Two or more: every user-facing string — labels, buttons, errors, empty states, page titles — goes through the translation files from the first page, never written into a component; a string added in one language is added in all of them
- The visitor's browser language picks among them; English when it asks for none of them

## Constants Over Magic Values
```ts
// WRONG
if (status === 3) { ... }

// CORRECT
const ORDER_STATUS = { PENDING: 1, ACTIVE: 2, COMPLETE: 3 } as const;
```

## Code Quality Checklist
- [ ] Readable, well-named variables and functions
- [ ] Functions < 50 lines
- [ ] Files < 800 lines
- [ ] No nesting deeper than 4 levels (use early returns)
- [ ] Errors handled explicitly
- [ ] No hardcoded values
- [ ] No `console.log` left in code
- [ ] No `any` type in TypeScript
- [ ] User-facing strings in every UI language (through the translation files, when there are two)

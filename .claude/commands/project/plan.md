---
description: Create a structured implementation plan before writing any code.
---

# /project:plan — Implementation Planning

Create an implementation plan BEFORE writing any code.

## Steps
1. **Read existing code first** — grep relevant patterns, read affected files line by line
2. Understand the requirement fully — ask clarifying questions if ambiguous
3. Identify ALL files that will change
4. Break the work into ordered, atomic tasks (S/M/L complexity)
5. Identify risks, unknowns, and dependencies
6. Check MEMORY.md and CLAUDE.md for relevant gotchas

## Output Format
```
## Feature: [name]

### Summary
One paragraph describing what this does and why.

### Existing Patterns (copied from code)
- Pattern 1: [file:line] — how it works now
- Pattern 2: [file:line] — what to reuse

### Files to Change
- `src/lib/...` — reason
- `src/routes/...` — reason

### Tasks (in order)
1. [ ] Task one (S) — description
2. [ ] Task two (M) — description
3. [ ] Task three (S) — description

### Risks & Unknowns
- Risk: ...
- Unknown: ...

### Checklist
- [ ] Design tokens used (no hardcoded colors/spacing/fonts)
- [ ] Touch targets >= 32px on new interactive elements
- [ ] User-facing text in every UI language listed in CLAUDE.md
```

## Important
- Do NOT skip Step 1 — reading existing code prevents the #1 cause of bugs
- For UI changes: check mobile responsiveness, touch targets

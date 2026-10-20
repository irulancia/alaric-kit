---
description: Run a full code review of uncommitted changes against project rules.
---

# /project:review — Code Review

Run a full code review on recent changes against project rules.

## Steps
1. Run `git diff HEAD` to see all uncommitted changes
2. Check against rules:
   - `rules/common/code.md` — style, immutability, file size
   - `rules/common/design.md` (and `design-reference.md` for the detail) — design tokens, no hardcoded values
   - `rules/common/security.md` — secrets, input handling, auth
   - `rules/common/commits.md` — commit message tagging
   - `rules/stack/svelte.md` — runes, patterns, bind:value
3. Check for common issues:
   - New interactive elements → touch targets >= 32px?
   - `{@html}` usage → sanitized?
4. Report findings by severity
5. Suggest specific fixes for CRITICAL and HIGH

## Output Format
```
## Review Results

### CRITICAL
- [file:line] Issue description + suggested fix

### HIGH
- [file:line] Issue description + suggested fix

### MEDIUM
- [file:line] Issue description

### LOW
- [file:line] Note

### Checks
- [ ] Touch targets (if applicable)
- [ ] Sanitization (if applicable)

### Summary
X issues found (Y critical, Z high). Ready to commit: yes/no
```

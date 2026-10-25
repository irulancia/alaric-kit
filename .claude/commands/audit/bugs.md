---
description: Run a comprehensive bug audit on the codebase, categorized by severity.
---

# /audit:bugs — Bug Audit

Run a comprehensive bug audit on the codebase.

## Steps
1. Run `npx svelte-check` — capture all errors and warnings
2. Scan for common bugs:
   - **Sanitization:** `{@html}` without sanitization
   - **Console.log:** leftover debug statements
   - **Any types:** `any` in TypeScript
   - **Touch targets:** interactive elements < 32px
   - **Design tokens:** hardcoded colors/spacing/font-size instead of tokens
3. Check security:
   - Unsanitized user input
   - Auth bypass possibilities
4. Categorize findings: CRITICAL / HIGH / MEDIUM / LOW
5. Save results to `memory/bugs-audit-{date}.md`
6. Add each finding that isn't fixed now to `memory/backlog.md` (`{bug}`, with its severity)

## Output Format
```
## Bug Audit — [date]

### Summary
X bugs found: Y CRITICAL, Z HIGH, W MEDIUM, V LOW

### CRITICAL
- **C-1:** [description] — [file:line] — Fix: [suggestion]

### HIGH
- **H-1:** [description] — [file:line] — Fix: [suggestion]

### MEDIUM
- **M-1:** [description] — [file:line]

### LOW
- **L-1:** [description] — [file:line]

### svelte-check Results
[paste output]
```

## After Audit
- Fix all CRITICAL immediately
- Fix HIGH before next deploy
- Track MEDIUM in backlog
- LOW = optional improvements

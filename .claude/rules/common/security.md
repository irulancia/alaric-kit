---
description: Secrets, input sanitization, auth, and data access rules.
---

# Security

## Secrets
- Never hardcode API keys, tokens, or passwords in source code
- `.env` is gitignored — load secrets from environment variables
- Before committing: scan changed files for accidental secrets

## Input Handling
- Sanitize any user-generated content before rendering as HTML (never trust `{@html}` / `innerHTML` on raw input)
- Enforced by `hooks/check-html-sanitization.sh` — blocks `{@html}`/`innerHTML` writes with no `sanitize*`/`purify` call on the same line. Name your sanitizer accordingly (or use `DOMPurify.sanitize()`).
- Validate and escape input at every boundary (forms, URL params, API payloads)
- CSV export: prefix cells starting with `=+\-@\t\r` to prevent formula injection

## Auth
- Never auto-grant access on error — fail closed (show a login/error state, not the protected content)
- Set `authenticated = true` only after the protected data has actually loaded, to avoid a flash of content
- Hash passwords before storing; never store or log plaintext

## Data Access
- If using a database with row-level security (RLS) or similar, verify policies whenever a new table or access pattern is added
- Always check for an error before using returned data from any network/DB call

## When Editing Security-Sensitive Code
Stop and double-check when touching:
- Authentication or authorization code
- User input handling or raw HTML rendering
- Database queries or access policies
- Anything involving passwords, tokens, or PII

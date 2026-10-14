---
description: Reviews changed .svelte/.css/.html files against the design system rules in rules/common/design.md — token usage, the contrast rule, spacing scale, radius rules, typography scale, icon style, and component reuse. Trigger BEFORE finishing any task that touched visual/UI code, or when the user asks whether something "follows the design system", is "on-brand", or questions a specific color/spacing/radius/font choice. Complements check-design-tokens.sh, which only catches simple hardcoded literals (hex colors, fixed px) via regex — this reasons about the fuller rules a regex can't check: is the right contrast rule (WCAG vs APCA) being used, does a numeric badge use the min-width-as-height + reduced-padding formula, does a nested container follow the concentric radius rule, do card children use the proximity spacing rule, is the chosen icon style consistent, are duotone tint values used correctly. Does NOT replace /project:review (broader, explicitly-invoked, covers every rules file) — this is narrower and design-specific, and can fire mid-task without being asked.
---

# Design Review

Checks design/UI changes against `rules/common/design.md` — the design system's actual rules, not a
second, drifted copy of them. Read that file (or the sections relevant to what changed) before
reviewing; don't rely on memory of it, it's long and detailed.

## When this applies
- Just edited or about to finish editing a `.svelte`, `.css`, or `.html` file with visual changes
  (new component, new page, restyled existing UI)
- The user asks "does this match the design system", "is this on-brand", or pushes back on a
  specific value ("why is this 13px", "why this color")
- Not for pure logic/backend changes with no visual surface

## Steps
1. `git diff` (or the specific files just touched) to see what actually changed — review the diff,
   not the whole file, unless the file is new.
2. Read `rules/common/design.md`, focusing on the sections relevant to what changed (colors and
   contrast; typography and the type scale; spacing; radius/shadows/z-index; the sidebar/icons/
   primitives sections if those areas were touched).
3. For each changed rule/value, check:
   - **Tokens**: every color, spacing, radius, shadow, font-size and z-index value traces back to
     a token in `app.css`'s `:root` — no literal hex/px/rem that isn't `var(--x)`. (Simple cases
     are already caught by `check-design-tokens.sh`; look for the ones a regex can't catch —
     `color-mix()`/`calc()` built from the wrong token, or a token used for the wrong role.)
   - **Contrast rule**: text/icon color on a fill uses the documented pattern (`--accent-text` for
     text/outlines, never `--accent` itself; `-strong` variants for text on a tint; APCA vs WCAG 2
     AA is a user choice, not something to hardcode a specific ratio for).
   - **Spacing**: uses the `--space-0..12` scale, and follows the proximity rule for grouped
     content (half-gap inside a group vs. between groups) where it applies.
   - **Radius**: follows the concentric rule for anything nested inside a rounded container
     (container radius minus its padding), and uses the right radius token for the element type
     (`--radius-field` / `--radius-chip` / `--radius-surface` / `--radius-overlay` / `--radius-pill`),
     not a single radius reused everywhere.
   - **Typography**: uses the type scale tokens (`--text-h1..xs`, `--text-display`), not a
     one-off size; headings use `--font-display`, body text `--font`.
   - **Icons**: consistent style (outline/filled/duotone) within one view; enclosed-shape
     variants (`x-circle`, `plus-circle`, etc.) for base actions per the icon rules.
   - **Component reuse**: a new pattern isn't reinventing something `design-system-components.css`
     already has (badge, card, alert, etc.) — check there first.
4. Report only what's actually wrong or worth a second look — don't restate rules that were
   followed correctly. For each finding: file:line, what rule it breaks, and the fix (the token or
   pattern that should have been used instead).
5. If nothing's wrong, say so in one line and move on — this isn't meant to produce a report for
   its own sake.

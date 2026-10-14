#!/bin/bash
# Hook: PreToolUse (Edit|Write) — blocks hardcoded CSS values (colors, font-size,
# font-weight, spacing, border-radius) in .svelte/.css files. Forces use of the
# Design System tokens in src/app.css / src/lib/corporate.css instead.
# Files that DEFINE the tokens are exempt (they legitimately contain literal values).

INPUT=$(cat)

PARSED=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data', c => d+=c);
  process.stdin.on('end', () => {
    try {
      const j = JSON.parse(d);
      const filePath = j.tool_input?.file_path || '';
      const content = j.tool_input?.new_string ?? j.tool_input?.content ?? '';
      console.log(filePath);
      console.log(Buffer.from(content, 'utf8').toString('base64'));
    } catch(e) { console.log(''); console.log(''); }
  });
" 2>/dev/null)

FILE_PATH=$(echo "$PARSED" | sed -n '1p')
NEW_CONTENT_B64=$(echo "$PARSED" | sed -n '2p')

# Only .svelte/.css files
if ! echo "$FILE_PATH" | grep -qE '\.(svelte|css)$'; then
  exit 0
fi

# Exempt the files that ARE the design system (they define the literal values)
if echo "$FILE_PATH" | grep -qE 'src/app\.css$|src/lib/corporate\.css$|src/lib/theme\.ts$|src/lib/themes\.ts$|src/lib/brand-theme\.ts$'; then
  exit 0
fi

# Exempt the configurator's own chrome stylesheet: it defines the --cfg-* tokens for the
# tool's UI (panel, controls), separate from the --* design-system tokens it generates.
# Matched on basename only: Windows callers report the path with backslashes.
if echo "$FILE_PATH" | grep -qE 'design-system-configurator\.css$'; then
  exit 0
fi

if [ -z "$NEW_CONTENT_B64" ]; then
  exit 0
fi

CONTENT=$(echo "$NEW_CONTENT_B64" | base64 -d 2>/dev/null)
# Drop comment-only lines to reduce false positives
CODE_LINES=$(echo "$CONTENT" | grep -vE '^\s*(//|/\*|\*)')

VIOLATIONS=""

if echo "$CODE_LINES" | grep -qE '#[0-9a-fA-F]{3,8}\b'; then
  VIOLATIONS="${VIOLATIONS}\n- hardcoded hex color (e.g. #3a3a3a) — use a color token from app.css (--bg-*, --text-*, --accent, --border, etc.)"
fi

if echo "$CODE_LINES" | grep -qE 'rgba?\(\s*[0-9]'; then
  VIOLATIONS="${VIOLATIONS}\n- rgb()/rgba() with literal numeric values — use rgba(var(--fg-rgb), X) or an existing token (--accent-bg, --border-subtle etc.)"
fi

if echo "$CODE_LINES" | grep -qE 'font-size\s*:\s*[0-9]'; then
  VIOLATIONS="${VIOLATIONS}\n- hardcoded font-size — use var(--text-display|heading|title|body|small|xs)"
fi

if echo "$CODE_LINES" | grep -qE 'font-weight\s*:\s*[0-9]'; then
  VIOLATIONS="${VIOLATIONS}\n- hardcoded font-weight — use var(--weight-regular|medium|semibold|bold)"
fi

if echo "$CODE_LINES" | grep -qE '(padding|margin|gap)[a-zA-Z-]*\s*:\s*[0-9]+(\.[0-9]+)?(px|rem|em)'; then
  VIOLATIONS="${VIOLATIONS}\n- padding/margin/gap with a fixed value (px/rem) — use var(--space-0..12)"
fi

if echo "$CODE_LINES" | grep -qE 'border-radius\s*:\s*[0-9]+(\.[0-9]+)?(px|rem)'; then
  VIOLATIONS="${VIOLATIONS}\n- hardcoded border-radius — use var(--radius-sm|--radius|--radius-lg|--radius-pill)"
fi

if [ -z "$VIOLATIONS" ]; then
  exit 0
fi

printf "BLOCKED: hardcoded CSS detected in %s -- use the Design System's tokens (see .claude/rules/common/design.md and src/app.css):%b\n" "$FILE_PATH" "$VIOLATIONS" >&2
exit 2

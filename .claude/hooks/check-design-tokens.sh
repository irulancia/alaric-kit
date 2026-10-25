#!/bin/bash
# Hook: PreToolUse (Edit|Write) — blocks hardcoded CSS values (colors, font-size,
# font-weight, spacing, border-radius) in .svelte/.css files. Forces use of the
# Design System tokens in src/app.css instead.
# src/app.css DEFINES the tokens, so it is exempt. src/project.css may define the project's own (--name: value),
# but not use a literal anywhere else.

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

# Exempt the file that IS the design system (it defines the literal values). Either separator: Windows callers
# report the path with backslashes.
if echo "$FILE_PATH" | grep -qE 'src[/\\]app\.css$'; then
  exit 0
fi

# Exempt the configurator's own chrome stylesheet: it defines the --cfg-* tokens for the
# tool's UI (panel, controls), separate from the --* design-system tokens it generates.
# Either separator: Windows callers report the path with backslashes.
if echo "$FILE_PATH" | grep -qE 'configurator[/\\]configurator\.css$'; then
  exit 0
fi

if [ -z "$NEW_CONTENT_B64" ]; then
  exit 0
fi

CONTENT=$(echo "$NEW_CONTENT_B64" | base64 -d 2>/dev/null)
# Drop comment-only lines to reduce false positives
CODE_LINES=$(echo "$CONTENT" | grep -vE '^\s*(//|/\*|\*)')

# src/project.css holds what only this project has, on top of app.css: a colour for its charts or an illustration is
# defined there as a token (--chart-warm: #f4a582;) and used through var(). The definitions are its tokens; every
# other declaration is checked like any CSS.
if echo "$FILE_PATH" | grep -qE 'src[/\\]project\.css$'; then
  CODE_LINES=$(echo "$CODE_LINES" | sed -E 's/--[a-zA-Z0-9_-]+[[:space:]]*:[^;}]*;?//g')
fi

VIOLATIONS=""

# A hex colour is a value: after a `:` (a property, an inline style), with no selector before it — so an id
# selector (`#feed {`), a link (`href="#add"`, `https://x/#top`) and a Svelte block are not colours.
VALUES=$(echo "$CODE_LINES" | sed 's/^[^{]*{//')
if echo "$VALUES" | grep -qE ':[^;{}"/]*#[0-9a-fA-F]{3,8}\b'; then
  VIOLATIONS="${VIOLATIONS}\n- hardcoded hex color (e.g. #3a3a3a) — use a color token from app.css (--bg-*, --text-*, --accent, --border, etc.)"
fi

if echo "$CODE_LINES" | grep -qE 'rgba?\(\s*[0-9]'; then
  VIOLATIONS="${VIOLATIONS}\n- rgb()/rgba() with literal numeric values — use an existing token (--accent-bg, --border-subtle, --overlay etc.) or rgba(var(--accent-rgb), X)"
fi

if echo "$CODE_LINES" | grep -qE 'font-size\s*:\s*[0-9]'; then
  VIOLATIONS="${VIOLATIONS}\n- hardcoded font-size — use var(--text-display|h1|h2|h3|body|ui|small|xs)"
fi

if echo "$CODE_LINES" | grep -qE 'font-weight\s*:\s*[0-9]'; then
  VIOLATIONS="${VIOLATIONS}\n- hardcoded font-weight — use var(--weight-regular|medium|semibold|bold)"
fi

if echo "$CODE_LINES" | grep -qE '(padding|margin|gap)[a-zA-Z-]*\s*:\s*[0-9]+(\.[0-9]+)?(px|rem|em)'; then
  VIOLATIONS="${VIOLATIONS}\n- padding/margin/gap with a fixed value (px/rem) — use var(--space-0..12)"
fi

if echo "$CODE_LINES" | grep -qE 'border-radius\s*:\s*[0-9]+(\.[0-9]+)?(px|rem)'; then
  VIOLATIONS="${VIOLATIONS}\n- hardcoded border-radius — use var(--radius-control|field|chip|surface|overlay|pill)"
fi

if [ -z "$VIOLATIONS" ]; then
  exit 0
fi

printf "BLOCKED: hardcoded CSS detected in %s -- use the Design System's tokens (see .claude/rules/common/design.md and src/app.css):%b\n" "$FILE_PATH" "$VIOLATIONS" >&2
exit 2

#!/bin/bash
# Hook: PreToolUse (Edit|Write) — blocks {@html ...} (Svelte) and .innerHTML = ...
# assignments that don't show a sanitizer call (name containing "saniti"/"purify")
# on the same line. Forces explicit sanitization instead of relying on memory
# of the rule in rules/common/security.md.

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

# Only .svelte/.ts/.js files
if ! echo "$FILE_PATH" | grep -qE '\.(svelte|ts|js)$'; then
  exit 0
fi

if [ -z "$NEW_CONTENT_B64" ]; then
  exit 0
fi

CONTENT=$(echo "$NEW_CONTENT_B64" | base64 -d 2>/dev/null)

# Lines that render raw HTML: {@html ...} or foo.innerHTML = ...
RISKY_LINES=$(echo "$CONTENT" | grep -nE '\{@html\b|\.innerHTML[[:space:]]*=[^=]')

if [ -z "$RISKY_LINES" ]; then
  exit 0
fi

# Of those, flag lines with no sanitizer call in sight (same line). A line can also be marked
# `trusted-static` instead: for HTML that is a hardcoded template with no user-input path (e.g.
# assigning a string built entirely from literals elsewhere in the same file), which sanitizing
# would not make any safer. Use it sparingly and only when that really is true.
UNSANITIZED=$(echo "$RISKY_LINES" | grep -viE 'saniti[sz]e|purify|dompurify|trusted-static')

if [ -z "$UNSANITIZED" ]; then
  exit 0
fi

LINES=$(echo "$UNSANITIZED" | cut -d: -f1 | tr '\n' ',' | sed 's/,$//')

printf "BLOCKED: %s renders raw HTML with no visible sanitization at line(s) %s.\nUse a sanitizer function (name containing 'sanitize' or 'purify', e.g. DOMPurify.sanitize()) before {@html} / innerHTML, or add the comment 'trusted-static' on the same line if the HTML is a hardcoded template with no path from user input. See .claude/rules/common/security.md.\n" "$FILE_PATH" "$LINES" >&2
exit 2

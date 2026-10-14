#!/bin/bash
# Hook: PostToolUse — after design-system-components.css or design-system-layouts.css is edited, regenerate
# design-system-components.js (the same styles as a string, which "Save app.css" reads; see
# scripts/generate-components-js.js). Any other file: nothing happens.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data', c => d+=c);
  process.stdin.on('end', () => {
    try {
      const j = JSON.parse(d);
      console.log(j.tool_input?.file_path || j.tool_input?.path || '');
    } catch(e) { console.log(''); }
  });
" 2>/dev/null)

if echo "$FILE_PATH" | grep -qE 'design-system-(components|layouts)\.css$'; then
  cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0
  node .claude/scripts/generate-components-js.js 2>&1 | tail -2
fi

exit 0

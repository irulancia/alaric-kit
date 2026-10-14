#!/bin/bash
# Hook: PostToolUse — run svelte-check after editing Svelte/TS files
# Only runs if the edited file is a .svelte or .ts file

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

# Only run svelte-check for Svelte/TS files
if echo "$FILE_PATH" | grep -qE '\.(svelte|ts)$'; then
  cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0
  npx svelte-check --threshold error 2>&1 | tail -5
fi

exit 0

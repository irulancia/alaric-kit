#!/bin/bash
# Hook: PreToolUse — warn when editing critical files
# Reads JSON from stdin, checks file_path against protected patterns

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

# Block .env file edits
if echo "$FILE_PATH" | grep -qiE '\.env($|\.)'; then
  echo "BLOCKED: Do not edit .env files directly. Use environment variables." >&2
  exit 2
fi

# Allow everything else
exit 0

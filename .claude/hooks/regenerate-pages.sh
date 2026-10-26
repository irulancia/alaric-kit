#!/bin/bash
# Hook: PostToolUse (Bash, Edit|Write) — keeps the generated pages current: after a git command that changes the
# history (commit, merge, pull, rebase, revert, cherry-pick, reset), history.html; after an edit of memory/backlog.md,
# backlog.html. Each generator regenerates the dashboard too, so its card links the page as soon as it exists.
# Anything else: nothing happens.

INPUT=$(cat)
field() {
  echo "$INPUT" | node -e "
    let d='';
    process.stdin.on('data', c => d+=c);
    process.stdin.on('end', () => {
      try { const t = JSON.parse(d).tool_input || {}; console.log(process.argv[1].split('|').map((k) => t[k]).find(Boolean) || ''); }
      catch(e) { console.log(''); }
    });
  " "$1" 2>/dev/null
}
COMMAND=$(field command)
FILE_PATH=$(field 'file_path|path')

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0
PAGES="$(dirname "$0")/../scripts/pages"

if echo "$COMMAND" | grep -qE '(^|[;&|]|[[:space:]])git[[:space:]]+(commit|merge|pull|rebase|revert|cherry-pick|reset)([[:space:]]|$)'; then
  git rev-parse --verify HEAD >/dev/null 2>&1 && node "$PAGES/generate-history.js" >/dev/null 2>&1
fi

if echo "$FILE_PATH" | grep -qE '(^|[/\\])memory[/\\]backlog\.md$'; then
  node "$PAGES/generate-backlog.js" >/dev/null 2>&1
fi

exit 0

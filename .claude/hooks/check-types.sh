#!/bin/bash
# Hook: Stop — before a task is considered done, run svelte-check once if .svelte/.ts files changed, and block
# (decision:block) with its errors, so Claude sees them and fixes them before finishing.
# It used to run after every edit as a PostToolUse hook, whose output Claude never saw: it cost time on every edit
# (19 per session in the kit's evaluation) and helped nothing (2026-10-19).

INPUT=$(cat)

# Stop hooks run again after Claude continues: block once, then let it stop, so an error it can't fix
# never keeps the session in a loop.
ACTIVE=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data', c => d+=c);
  process.stdin.on('end', () => {
    try { console.log(JSON.parse(d).stop_hook_active ? 'yes' : 'no'); } catch(e) { console.log('no'); }
  });
" 2>/dev/null)
[ "$ACTIVE" = "yes" ] && exit 0

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

# Only when this task touched Svelte/TS files, and only when svelte-check is installed (npx would otherwise
# try to download it).
git status --porcelain 2>/dev/null | awk '{print $2}' | grep -qE '\.(svelte|ts)$' || exit 0
[ -x node_modules/.bin/svelte-check ] || exit 0

# A fresh checkout has no .svelte-kit types yet: without them every route reports false errors.
[ -x node_modules/.bin/svelte-kit ] && npx svelte-kit sync >/dev/null 2>&1

OUTPUT=$(npx svelte-check --threshold error 2>&1)
[ $? -eq 0 ] && exit 0

REASON="svelte-check found errors before this task can be considered done:
$(echo "$OUTPUT" | tail -40)

Fix them before finishing."

node -e "
  const reason = process.argv[1];
  console.log(JSON.stringify({ decision: 'block', reason }));
" "$REASON"

exit 0

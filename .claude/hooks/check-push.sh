#!/bin/bash
# Hook: PreToolUse (Bash) — every `git push` asks the owner first. The "ask" rule in
# settings.json alone is not enough: in auto mode a push went through with no prompt.
# A hook runs in every mode. See rules/common/workflow.md, "PUSH".

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data', c => d+=c);
  process.stdin.on('end', () => {
    try {
      const j = JSON.parse(d);
      console.log(j.tool_input?.command || '');
    } catch(e) { console.log(''); }
  });
" 2>/dev/null)

# `git push`, also as `git -C <dir> push` or after cd/&&
if ! echo "$COMMAND" | grep -qE '(^|[;&|(]|[[:space:]])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+push([[:space:]]|$)'; then
  exit 0
fi

cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"A push publishes the commits: the owner approves each one (rules/common/workflow.md)."}}
JSON
exit 0

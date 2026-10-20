#!/bin/bash
# Hook: PreToolUse (Bash) — blocks `git commit` unless the message body has
# at least one [frontend]/[logic]/[content]/[backend]/[tooling] tag. See
# rules/common/commits.md. Claude is the only committer in this
# workflow, so this is checked at the Bash-tool level, not a native git hook.

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

# Only check actual `git commit` invocations
if ! echo "$COMMAND" | grep -qE '(^|[;&|]|[[:space:]])git[[:space:]]+commit([[:space:]]|$)'; then
  exit 0
fi

if echo "$COMMAND" | grep -qiE '\[(frontend|logic|content|backend|tooling)\]'; then
  exit 0
fi

echo "BLOCKED: the commit message body has no [frontend]/[logic]/[content]/[backend]/[tooling] tag. Add at least one (see .claude/rules/common/commits.md)." >&2
exit 2

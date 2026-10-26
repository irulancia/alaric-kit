#!/bin/bash
# Hook: Stop — before a task is considered done, scan modified .svelte/.ts/.js files
# for console.log, TypeScript `any`, and hardcoded secrets. Blocks (decision:block)
# if anything is found, so Claude has to fix it before finishing.

INPUT=$(cat)

# Stop hooks run again after Claude continues: block once, then let it stop. A console.log it can't or mustn't
# remove (one the owner left in a file they are working on) would otherwise keep the session in a loop.
ACTIVE=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data', c => d+=c);
  process.stdin.on('end', () => {
    try { console.log(JSON.parse(d).stop_hook_active ? 'yes' : 'no'); } catch(e) { console.log('no'); }
  });
" 2>/dev/null)
[ "$ACTIVE" = "yes" ] && exit 0

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

# -uall lists each file in a new folder: without it git reports only `src/`, and none of a new project's files
# were checked. `cut -c4-` keeps the path, `sed` keeps a renamed file's new name.
# .js too, not only .svelte/.ts. Not in .claude/, tools/ or scripts/: those are command-line scripts,
# where console.log is how they report what they did (the kit's own generators).
FILES=$(git status --porcelain -uall 2>/dev/null | cut -c4- | sed 's/.* -> //' | grep -E '\.(svelte|ts|tsx|js|jsx|mjs|cjs)$' | grep -vE '^(\.claude|tools|scripts)/')

if [ -z "$FILES" ]; then
  exit 0
fi

ISSUES=""

for f in $FILES; do
  [ -f "$f" ] || continue

  CONSOLE_LINES=$(grep -nE 'console\.log\(' "$f" | cut -d: -f1 | tr '\n' ',' | sed 's/,$//')
  if [ -n "$CONSOLE_LINES" ]; then
    ISSUES="${ISSUES}
- ${f}: leftover console.log at line(s) ${CONSOLE_LINES}"
  fi

  ANY_LINES=$(grep -nE '(:\s*any\b|<any>|\bas any\b)' "$f" | cut -d: -f1 | tr '\n' ',' | sed 's/,$//')
  if [ -n "$ANY_LINES" ]; then
    ISSUES="${ISSUES}
- ${f}: 'any' type used at line(s) ${ANY_LINES}"
  fi

  SECRET_LINES=$(grep -nEi '(api[_-]?key|secret|password|token)[[:space:]]*[:=][[:space:]]*["'\''][A-Za-z0-9_\-]{6,}["'\'']' "$f" | grep -vE 'process\.env|import\.meta\.env|PUBLIC_|placeholder|example' | cut -d: -f1 | tr '\n' ',' | sed 's/,$//')
  if [ -n "$SECRET_LINES" ]; then
    ISSUES="${ISSUES}
- ${f}: possible hardcoded secret/key at line(s) ${SECRET_LINES}"
  fi
done

if [ -z "$ISSUES" ]; then
  exit 0
fi

REASON="Automated quality check found issues before this task can be considered done:${ISSUES}

Fix them (remove console.log, replace 'any' with a real type, move secrets into .env) before continuing."

node -e "
  const reason = process.argv[1];
  console.log(JSON.stringify({ decision: 'block', reason }));
" "$REASON"

exit 0

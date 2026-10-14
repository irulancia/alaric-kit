#!/bin/bash
# Hook: UserPromptSubmit — reminds Claude of frequently-missed rules on every message, and says how
# many notes wait in memory/inbox.md (SessionStart says it only once; a session kept open for days
# would otherwise never hear of a note written since).
# Reads (and discards) the stdin JSON payload; doesn't need it for this hook.

cat > /dev/null

NOTES=$(grep -c '^## ' "$CLAUDE_PROJECT_DIR/memory/inbox.md" 2>/dev/null || true)

NOTES="${NOTES:-0}" node -e "
  const rules = [
    'Read the existing code before changing it — don\'t improvise the design.',
    'Check whether the functionality already exists elsewhere in the app before rebuilding it.',
    'Follow the design system — use existing tokens (colors, spacing, fonts), don\'t hardcode new values.',
    'Make small, focused changes, especially in large/fragile files.'
  ];
  const notes = Number(process.env.NOTES) || 0;
  const inbox = notes > 0
    ? '\n\n' + notes + ' note(s) from the owner wait in memory/inbox.md — move them into memory/backlog.md (see development-workflow.md).'
    : '';
  const text = 'Rules to keep in mind for this message:\n' + rules.map((r, i) => (i + 1) + '. ' + r).join('\n') + inbox;
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: text
    }
  }));
"

exit 0

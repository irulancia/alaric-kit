#!/bin/bash
# Hook: SessionStart — detects a fresh project (no CLAUDE.md yet) using this
# shared .claude template, and tells Claude to run /project:bootstrap before
# anything else. Once CLAUDE.md exists: says how many notes wait in memory/inbox.md (written by the
# owner from the Inbox page, .claude/scripts/pages/inbox.html), silent when there are none.

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

if [ -f "CLAUDE.md" ] || [ -f ".claude/CLAUDE.md" ]; then
  NOTES=$(grep -c '^## ' memory/inbox.md 2>/dev/null || true)
  if [ "${NOTES:-0}" -gt 0 ]; then
    node -e "
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: 'memory/inbox.md has $NOTES note(s) from the owner waiting (any language, any shape). Tell the owner, then move each into memory/backlog.md: rewritten in the project format with their words quoted, an area tag and a size. Then delete the moved notes from the inbox (keep its header).'
        }
      }));
    "
  fi
  exit 0
fi

node -e "
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: 'No CLAUDE.md found in this project. This .claude/ setup is a shared template copied from another project. Before doing anything else, run /project:bootstrap: it confirms the tech-stack assumptions (SvelteKit + Svelte 5, design tokens in app.css), generates a project-specific CLAUDE.md, sets up git and the memory files, and starts the design system from the configurator. Tell the user that in one line first.'
    }
  }));
"

exit 0

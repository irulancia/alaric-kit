---
description: Svelte 5 runes, component structure, and common gotchas.
paths:
  - "**/*.svelte"
  - "**/+page*"
  - "**/+layout*"
---

# Svelte 5 Conventions

## Runes (ALWAYS use these, never legacy syntax)
```svelte
let count = $state(0);              // State
let doubled = $derived(count * 2);  // Derived
let { title, count = 0 }: Props = $props();  // Props

$effect(() => {                     // Side effects
  console.log("count changed:", count);
});
```

## Component Structure
```svelte
<script lang="ts">
  // 1. Imports
  // 2. Props ($props())
  // 3. State ($state)
  // 4. Derived ($derived)
  // 5. Effects ($effect)
  // 6. Functions
</script>

<!-- Template -->

<style>
  /* Scoped styles */
</style>
```

## bind:value Gotcha (Svelte 5)
`bind:value={obj[key]}` fails silently if `obj[key]` is `undefined` and the component prop has a fallback.
**Fix:** Pre-initialize ALL answer keys before rendering:
```ts
function initializeAnswers() {
  for (const page of survey.pages) {
    if (!(page.id in answers)) answers[page.id] = '';
    for (const q of page.questions || []) {
      if (!(q.id in answers)) answers[q.id] = '';
    }
  }
}
```

## {@const} Placement
`{@const}` must be directly under `{#if}`, `{:else if}`, or `{#each}` blocks — not nested inside other elements.
```svelte
<!-- WRONG -->
{#if condition}
  <div>
    {@const value = compute()}  <!-- ERROR -->
  </div>
{/if}

<!-- CORRECT -->
{#if condition}
  {@const value = compute()}
  <div>{value}</div>
{/if}
```

## Contenteditable Patterns
- Always pair with `contenteditable={!previewMode}` for defense-in-depth
- Paste handler on `.card`: strip formatting with `document.execCommand('insertText', false, text)`
- Placeholder fix: `onfocusin` saves placeholder to `data-placeholder-text` and clears; `onfocusout` restores if empty

## Translations (two or more UI languages, see `code.md`)
- Paraglide, SvelteKit's own i18n add-on: `npx sv add paraglide` when the app is created; messages in `messages/<lang>.json`, used as `m.save_changes()`
- The browser's language picks the locale, English as the fallback: `baseLocale: "en"`, and `preferredLanguage` before `baseLocale` in the strategy

## The design system's stylesheet, read live
`src/app.css` is served by a route and linked from `src/app.html`, not imported into the bundle: an imported stylesheet is frozen into a build, so a save from the configurator would show only after a rebuild. Read on every request, it shows on the next refresh, in dev and in a built app alike.
```ts
// src/routes/app.css/+server.ts
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RequestHandler } from './$types';
import builtIn from '../../app.css?raw';

// Read from the project on every request, so a save from the configurator shows on refresh. A server running
// without the project's src/ (a deployed copy) serves the version built into the app instead.
export const GET: RequestHandler = async () => {
  const css = await readFile(join(process.cwd(), 'src', 'app.css'), 'utf8').catch(() => builtIn);
  return new Response(css, { headers: { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'no-cache' } });
};
```
- In `src/app.html`, before `%sveltekit.head%` (so `project.css` and the components' styles come after it): `<link rel="stylesheet" href="/app.css" />`
- `src/routes/+layout.svelte` imports only `../project.css` — never `../app.css` as well (two copies, the bundled one stale)
- An app with no server (`adapter-static`) can't have this route: it imports `../app.css` in the layout instead, and a configurator save shows after a rebuild

## TypeScript
- Always type component props with interface + `$props()`
- No `any` — use `unknown` and narrow, or define the type
- Guard optional arrays: `(q.options || [])` before `.filter()` / `.map()`

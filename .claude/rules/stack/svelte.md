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

## TypeScript
- Always type component props with interface + `$props()`
- No `any` — use `unknown` and narrow, or define the type
- Guard optional arrays: `(q.options || [])` before `.filter()` / `.map()`

#!/usr/bin/env node
// Builds design-system-components.js from design-system-components.css + design-system-layouts.css: the same text, as a string
// the configurator loads with a <script>. "Save app.css" needs the component styles as text, and a
// page opened as a file (file://) can't fetch() a file next to it, but it can load a script.
// The two .css files stay the source (components first, then layouts); the PostToolUse hook regenerate-components-js.sh
// reruns this after every edit of it, and the design system test fails if the two drift apart.
//
// Usage: node .claude/scripts/generate-components-js.js

const fs = require('fs');
const path = require('path');

const SOURCES = ['design-system-components.css', 'design-system-layouts.css'].map((f) => path.join(__dirname, f));
const OUT = path.join(__dirname, 'design-system-components.js');

const css = SOURCES.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const js = `// Generated from design-system-components.css + design-system-layouts.css by generate-components-js.js. Do not edit by hand.
window.DS_COMPONENTS_CSS = ${JSON.stringify(css)};
`;
fs.writeFileSync(OUT, js, 'utf8');
console.log(`Wrote ${OUT} (${Math.round(css.length / 1024)} KB of component styles)`);

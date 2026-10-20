#!/usr/bin/env node
// Builds components.generated.js from styles/components.css + styles/layouts.css: the same text, as a string
// the configurator loads with a <script>. "Save app.css" needs the component styles as text, and a
// page opened as a file (file://) can't fetch() a file next to it, but it can load a script.
// The two .css files stay the source (components first, then layouts); the PostToolUse hook regenerate-components.sh
// reruns this after every edit of it, and the design system test fails if the two drift apart. It also rewrites the
// component index in rules/common/design.md from the same styles.
//
// Usage: node .claude/scripts/configurator/generate-components.js

const fs = require('fs');
const path = require('path');

const SOURCES = ['components.css', 'layouts.css'].map((f) => path.join(__dirname, 'styles', f));
const OUT = path.join(__dirname, 'components.generated.js');

const css = SOURCES.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const js = `// Generated from styles/components.css + styles/layouts.css by generate-components.js. Do not edit by hand.
window.DS_COMPONENTS_CSS = ${JSON.stringify(css)};
`;
fs.writeFileSync(OUT, js, 'utf8');
console.log(`Wrote ${OUT} (${Math.round(css.length / 1024)} KB of component styles)`);

// The same styles name every component: design.md's component index is rewritten from them (component-index.js).
const { writeIndex, DESIGN_MD } = require('./component-index.js');
writeIndex();
console.log(`Wrote the component index in ${DESIGN_MD}`);

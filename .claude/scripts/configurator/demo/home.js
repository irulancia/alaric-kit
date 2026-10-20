// The example site's first page: Home, a landing about Alaric itself — a site page, so no sidebar. It is where the
// landing pieces live in use: the hero split in two (the words, and a live collage of real components that follows the
// panel), alternating bands, feature cards, steps, a centred closing call. Adds `home` to window.DS_DEMO_PAGES.
(function () {
  const { icon, btn, sw, seg } = window.DS_DEMO_PARTS;
  const { act, go } = window.DS_DEMO_KIT;
  const join = (items) => items.join('');

  const FEATURES = [
    ['shield-check', 'Contrast that holds', 'Text, outlines and focus rings are pushed to their WCAG or APCA target on every surface, for the colours you pick.'],
    ['stack', 'One density control', 'Compact, Normal or Spacious moves spacing, type and control heights together, so they never fight.'],
    ['palette', 'Your brand, kept', 'Two colours and a page background become fill, text, outline and tint shades that keep their hue.'],
    ['squares-four', 'Every component, every state', 'Buttons, forms, navigation, dialogs, tables and more, from the same tokens — the Components tab shows them all.'],
    ['code', 'One file to ship', 'Save app.css into your project: the tokens, the fonts and every style, with nothing to build.'],
    ['lightning', 'Rules Claude follows', 'The kit ships the rules too, so the next screen Claude builds uses these tokens instead of new values.'],
  ];
  const STEPS = [
    ['Copy the kit', 'Rename the folder to your project and open Claude Code in it.'],
    ['Run /project:bootstrap', 'A few questions — any of them can wait — and the project is set up.'],
    ['Pick your design system', 'Colours, fonts, density and shape in this panel, then save src/app.css.'],
    ['Build', 'Every new screen starts from these components and these rules.'],
  ];

  // The hero's picture is the product itself: real components, drawn by the tokens you are choosing right now. It is a
  // picture, not a form — inert, so it takes no clicks and no focus, and hidden from screen readers.
  const collage = () => `<div class="hero-media" inert aria-hidden="true"><div class="stack">
      <div class="card"><div class="card-header"><h3>Acme workspace</h3><span class="badge badge-success">${icon('check-circle')}On track</span></div>
        <div class="stat"><span class="stat-label">Active projects</span><span class="stat-value">5</span><span class="stat-delta is-up">${icon('arrow-circle-up', 'icon-sm')}1 more than last week</span></div>
        <div class="progress" role="presentation" style="--value:65%"><span></span></div>
        ${seg('Density', ['Compact', 'Normal', 'Spacious'], 1, {}, 'is-block')}
        <div class="choice-group">${sw('Email me when a project changes', 'checked')}</div>
        <div class="card-actions">${btn('primary', `${icon('plus-circle')}New project`)}${btn('secondary', 'Invite')}${btn('ghost', 'Later')}</div></div>
      <div class="toast toast-success">${icon('check-circle')}<div class="alert-body"><span class="alert-title">Created "Hooli: Launch site"</span><span class="text-muted text-small">The team was told.</span></div></div>
    </div></div>`;

  const hero = () => `<section class="hero split">
      <div class="hero-text">
        <span class="text-overline">Design system starter kit for Claude Code</span>
        <h1 class="text-display" tabindex="-1">Choose your design system once. Claude keeps to it.</h1>
        <p class="text-lead">Pick two colours, a page background, two fonts, a density and a corner radius. Alaric turns them into tokens and components that hold their contrast — and ships the rules, so every new screen uses them.</p>
        <div class="hero-actions">${btn('primary', `${icon('lightning')}Start a project`, 'btn-lg', act('open', 'data-dialog="app-dlg-start"'))}${btn('secondary', `See it in an app${icon('arrow-circle-right')}`, 'btn-lg', 'data-go="overview"')}</div>
      </div>
      ${collage()}
    </section>`;

  const features = () => `<section class="band band-alt" id="home-features">
      <div class="section-head"><span class="text-overline">What you get</span><h2>Decided once, used on every screen</h2><p class="text-lead">The choices a team argues about screen after screen are made here, measured, and written down.</p></div>
      <div class="grid grid-3">${join(FEATURES.map(([ic, title, text]) => `<div class="card"><div class="feature"><span class="feature-icon" aria-hidden="true">${icon(ic, 'icon-lg')}</span><h3>${title}</h3><p class="text-muted">${text}</p></div></div>`))}</div>
    </section>`;

  const steps = () => `<section class="band"><div class="split">
      <div class="section-head"><span class="text-overline">How it works</span><h2>From an empty folder to a first screen</h2><p class="text-lead">About ten minutes. Claude does the setup; you make the design choices.</p>
        <div>${go('overview', `See what it builds${icon('arrow-circle-right', 'icon-sm')}`, 'link link-action')}</div></div>
      <ol class="steps">${join(STEPS.map(([title, text]) => `<li><span class="steps-title">${title}</span><span class="steps-text">${text}</span></li>`))}</ol>
    </div></section>`;

  const closing = () => `<section class="band band-alt band-center">
      <div class="section-head"><h2>Try it on this page</h2><p class="text-lead">Change a colour, the density or the corner radius in the panel: this page and every app page behind it follow.</p></div>
      <div class="hero-actions">${btn('primary', 'Open the app', 'btn-lg', 'data-go="overview"')}${btn('ghost', 'Read the design rules', 'btn-lg', act('toast', 'data-msg="The rules live in .claude/rules/common/design.md in your project."'))}</div>
    </section>`;

  window.DS_DEMO_PAGES.home = () => join([hero(), features(), steps(), closing()]);
})();

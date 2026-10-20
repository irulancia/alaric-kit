// Demo page markup for the design system configurator: one realistic page, then a
// reference of every tier-1 component in every state. Sets window.DS_DEMO_HTML.
(function () {
  let uid = 0;
  const nextId = () => 'demo-f' + (++uid);
  const join = (items) => items.join('');

  // Icons are placeholders filled in by dsHydrateIcons, so the style (outline, filled,
  // duotone) can change without rebuilding the page. The set is in configurator/icons.js.
  // Markup is parsed as SVG, never as HTML, so it can't run script (no innerHTML).
  // A third argument pins one style (used to compare the three side by side).
  const icon = (name, cls = '', style = '') => `<svg class="icon ${cls}" data-icon="${name}"${style ? ` data-style="${style}"` : ''} viewBox="0 0 256 256" aria-hidden="true"></svg>`;
  const svgNodes = (markup) => Array.from(new DOMParser()
    .parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, 'image/svg+xml')
    .documentElement.childNodes).map((n) => document.importNode(n, true));
  // Every icon exists in all three styles, so there are no per-style fallbacks.
  window.dsHydrateIcons = (root, style) => {
    root.querySelectorAll('svg[data-icon]').forEach((el) => {
      const set = (window.DS_ICONS || {})[el.dataset.icon];
      el.replaceChildren(...(set ? svgNodes(set[el.dataset.style || style]) : []));
    });
  };

  const cell = (caption, html) => `<div class="demo-cell"><div class="demo-caption">${caption}</div>${html}</div>`;
  // A sub-block is a label column beside its content, like a spec sheet.
  const sub = (title, html) => `<div class="demo-sub"><div class="demo-sub-title">${title}</div><div class="demo-sub-body">${html}</div></div>`;
  // Component sections get an id (the configurator builds its jump links from these).
  const plainTitle = (title) => title.replace(/\s*\(.*\)/, ''); // "Icons (155)" -> "Icons"
  const slug = (title) => 'sec-' + plainTitle(title).toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
  const section = (title, html) => `<section class="demo-section" id="${slug(title)}" data-view="components" data-label="${plainTitle(title)}"><div class="demo-title">${title}</div>${html}</section>`;

  // ---------- form helpers ----------
  // `name` and `required` are for the page example's working forms: a required field always gets its group and
  // message line, so the app can show an error there without changing the layout around it.
  const field = ({ label, value = '', state = '', disabled = false, type = 'text', hint = '', error = '', name = '', required = false }) => {
    const id = nextId();
    const cls = state ? ` class="${state}"` : '';
    const attrs = `${name ? ` name="${name}"` : ''}${required ? ' required' : ''}`;
    const input = `<div class="field"><input id="${id}" type="${type}" placeholder=" " value="${value}"${cls}${attrs}${disabled ? ' disabled' : ''}><label for="${id}">${label}</label></div>`;
    const msg = error || hint;
    if (!msg && !required) return input;
    return `<div class="field-group${error ? ' has-error' : ''}">${input}<div class="field-msg" data-hint="${hint}">${msg}</div></div>`;
  };
  const textarea = ({ label, value = '', name = '' }) => {
    const id = nextId();
    return `<div class="field"><textarea id="${id}" placeholder=" "${name ? ` name="${name}"` : ''}>${value}</textarea><label for="${id}">${label}</label></div>`;
  };
  const select = ({ label, options, disabled = false, name = '', chosen = '' }) => {
    const id = nextId();
    return `<div class="field field-select"><select id="${id}"${name ? ` name="${name}"` : ''}${disabled ? ' disabled' : ''}>${options.map((o) => `<option${o === chosen ? ' selected' : ''}>${o}</option>`).join('')}</select><label for="${id}">${label}</label></div>`;
  };
  const check = (label, attrs = '', cls = '') => `<label class="check"><input type="checkbox" class="${cls}" ${attrs}>${label}</label>`;
  const radio = (label, name, attrs = '', cls = '') => `<label class="radio"><input type="radio" name="${name}" class="${cls}" ${attrs}>${label}</label>`;
  const sw = (label, attrs = '', cls = '') => `<label class="switch"><input type="checkbox" role="switch" class="${cls}" ${attrs}>${label}</label>`;

  // ---------- button helpers ----------
  const btn = (variant, label, extra = '', attrs = '') => `<button class="btn btn-${variant} ${extra}" ${attrs}>${label}</button>`;
  // An icon-only button with its tooltip (the label, for sighted users; aria-label carries it for screen readers).
  // `end` aligns the bubble to the button's end, for the last button of a row.
  const tipBtn = (variant, iconName, label, cls = '', attrs = '', end = false) => `<span class="has-tooltip${end ? ' tooltip-end' : ''}">${btn(variant, icon(iconName), `btn-icon ${cls}`, `aria-label="${label}" ${attrs}`)}<span class="tooltip" aria-hidden="true">${label}</span></span>`;
  // Icon-only ghost buttons for a table row; each label names the row for screen readers.
  const rowActions = (name) => `<div class="row-actions">${tipBtn('ghost', 'note-pencil', `Edit ${name}`, 'btn-sm')}${tipBtn('ghost', 'share-fat', `Share ${name}`, 'btn-sm')}${tipBtn('ghost', 'trash', `Delete ${name}`, 'btn-sm is-danger', '', true)}</div>`;
  // A segmented control: `chosen` is the pressed index; `states` maps an index to a forced state class or 'disabled'.
  const seg = (label, options, chosen, states = {}, cls = '') => `<div class="segmented ${cls}" role="group" aria-label="${label}">${options.map((o, i) => {
    const st = states[i] || '';
    return `<button type="button" aria-pressed="${i === chosen}"${st === 'disabled' ? ' disabled' : st ? ` class="${st}"` : ''}>${o}</button>`;
  }).join('')}</div>`;
  // A form row: the label above a control that isn't a text field, an optional value / "i" at the right.
  const formRow = (label, control, end = '') => `<div class="form-row"><div class="form-row-head"><span>${label}</span>${end ? `<span>${end}</span>` : ''}</div>${control}</div>`;
  const infoTip = (text, cls = '') => { const id = nextId(); return `<button type="button" class="info-tip ${cls}" aria-label="More about this" aria-describedby="${id}">${icon('info')}<span class="tooltip" role="tooltip" id="${id}">${text}</span></button>`; };
  const range = (label, value, min, max, unit = '', disabled = false) => formRow(label, `<input class="range" type="range" min="${min}" max="${max}" value="${value}" style="--range-pct:${(value - min) / (max - min)}" aria-label="${label}"${disabled ? ' disabled' : ''}>`, `<output class="form-row-value">${value}${unit}</output>`);
  const btnStates = (variant, label) => join([
    cell('Default', btn(variant, label)),
    cell('Hover', btn(variant, label, 'is-hover')),
    cell('Focus', btn(variant, label, 'is-focus')),
    cell('Active', btn(variant, label, 'is-active')),
    cell('Disabled', btn(variant, label, '', 'disabled')),
    cell('Loading', btn(variant, label, 'is-loading')),
  ]);

  // ---------- 1. the page example ----------
  // A working app of seven pages (configurator/demo/pages-work.js builds them, configurator/demo/app.js runs them):
  // every link goes somewhere and every button does something, so all the components are seen in use. Here only
  // its frame; the helpers above are shared with those two files.
  window.DS_DEMO_PARTS = { icon, btn, tipBtn, field, textarea, select, check, radio, sw, seg, formRow, infoTip, range, nextId };
  const realPage = '<div class="demo-page" id="demo-app"></div>';

  // ---------- 2. component reference ----------
  const typography = section('Typography', join([sub('Headings and text', `
    <div class="prose demo-prose">
      <h1>Heading 1</h1>
      <p>Body text sits at the base size and line height. The space above a heading grows with its rank, while the space below matches the paragraph gap, so a heading stays closer to what it introduces.</p>
      <p class="text-overline">Section label</p>
      <h2>Heading 2</h2>
      <p>Second-level headings open a major section. <a href="#">A link inside a paragraph</a> and <code>inline code</code> follow the same tokens.</p>
      <h3>Heading 3</h3>
      <p class="text-small text-muted">Small muted text for captions, helper text and metadata.</p>
      <h4>Heading 4 (body size, semibold)</h4>
      <blockquote>A quote is set apart with an accent rule and secondary text colour.</blockquote>
      <ul><li>Unordered list item one</li><li>Unordered list item two</li></ul>
      <pre><code>&lt;link rel="stylesheet" href="app.css"&gt;
&lt;body class="ds-root"&gt;</code></pre>
    </div>`),
    sub('Display and lead (a landing page)', `<div class="stack"><span class="text-overline">Section label</span><p class="text-display">Display title</p><p class="text-lead">A lead introduces a page or a section: one step above body, in the secondary colour, at a readable width.</p></div>`),
  ]));

  const actions = section('Actions', join([
    sub('Primary', `<div class="demo-states">${btnStates('primary', 'Save changes')}</div>`),
    sub('Secondary', `<div class="demo-states">${btnStates('secondary', 'Invite teammate')}</div>`),
    sub('Tertiary', `<div class="demo-states">${btnStates('tertiary', 'View details')}</div>`),
    sub('Destructive', `<div class="demo-states">${btnStates('destructive', 'Delete project')}</div>`),
    sub('Ghost', `<div class="demo-states">${btnStates('ghost', 'Dismiss')}</div>`),
    sub('Ghost icon buttons (table row actions, toolbars)', `<div class="row">${btn('ghost', icon('note-pencil'), 'btn-icon btn-sm', 'aria-label="Edit"')}${btn('ghost', icon('share-fat'), 'btn-icon btn-sm is-hover', 'aria-label="Share"')}${btn('ghost', icon('trash'), 'btn-icon btn-sm is-danger is-hover', 'aria-label="Delete"')}${btn('ghost', icon('note-pencil'), 'btn-icon btn-sm is-focus', 'aria-label="Edit"')}${btn('ghost', icon('trash'), 'btn-icon btn-sm', 'aria-label="Delete" disabled')}</div>`),
    sub('Sizes and icon-only', `<div class="row">
      ${btn('primary', 'Small', 'btn-sm')}${btn('primary', 'Default')}${btn('primary', 'Large', 'btn-lg')}
      ${btn('primary', icon('plus-circle'), 'btn-icon', 'aria-label="Add"')}${btn('secondary', icon('plus-circle'), 'btn-icon btn-sm', 'aria-label="Add"')}
    </div>`),
    sub('With icons', `<div class="row">
      ${btn('primary', icon('plus-circle') + 'New project')}${btn('secondary', icon('user') + 'Invite teammate')}
      ${btn('tertiary', 'Download' + icon('download'))}${btn('destructive', icon('trash') + 'Delete')}
      ${btn('tertiary', icon('note-pencil'), 'btn-icon', 'aria-label="Edit"')}${btn('destructive', icon('trash'), 'btn-icon', 'aria-label="Delete"')}
    </div>`),
    sub('Button group (related actions, one kind of content per group — a choice is a segmented control)', `<div class="row">
      ${cell('Text', `<div class="btn-group" role="group" aria-label="Calendar">${btn('secondary', 'Previous')}${btn('secondary', 'Today')}${btn('secondary', 'Next')}</div>`)}
      ${cell('Icon only, each with a tooltip', `<div class="btn-group" role="group" aria-label="Document">${tipBtn('secondary', 'copy', 'Copy')}${tipBtn('secondary', 'share-fat', 'Share')}${tipBtn('secondary', 'printer', 'Print', '', '', true)}</div>`)}
    </div>`),
    sub('Link', `<div class="row"><a class="link" href="#">Default</a><a class="link is-hover" href="#">Hover</a><a class="link is-focus" href="#">Focus</a><button type="button" class="link" disabled>Disabled (nothing to reset)</button></div>`),
    sub('Link that stands alone: action and quiet', `<div class="row">${cell('Action (at a card\'s end, "See all")', `<a class="link link-action" href="#">See all projects${icon('arrow-circle-right', 'icon-sm')}</a>`)}${cell('Action, hover', '<a class="link link-action is-hover" href="#">View details</a>')}${cell('Quiet (a neutral path)', '<a class="link link-quiet" href="#">Back to projects</a>')}${cell('Quiet, hover', '<a class="link link-quiet is-hover" href="#">Back to projects</a>')}</div>`),
    sub('Toggle', `<div class="row">
      <button class="toggle" aria-pressed="false">Off</button>
      <button class="toggle" aria-pressed="true">On</button>
      <button class="toggle is-hover" aria-pressed="false">Hover</button>
      <button class="toggle is-focus" aria-pressed="false">Focus</button>
      <button class="toggle" aria-pressed="false" disabled>Disabled</button>
    </div>`),
    sub('Segmented control (one choice, it slides)', `<div class="stack">
      <div class="row">
        ${cell('Two', seg('Mode', ['Light', 'Dark'], 0))}
        ${cell('Three, the second chosen', seg('Density', ['Compact', 'Normal', 'Spacious'], 1))}
        ${cell('Hover · focus', seg('View', ['Day', 'Week', 'Month'], 0, { 1: 'is-hover', 2: 'is-focus' }))}
        ${cell('One option off', seg('Shadow', ['Flat', 'Soft', 'Layered'], 1, { 2: 'disabled' }))}
        ${cell('All off: no choice shown', seg('Shadow', ['Flat', 'Soft', 'Layered'], 1, { 0: 'disabled', 1: 'disabled', 2: 'disabled' }))}
      </div>
      ${cell('Full width (.is-block)', seg('View', ['List', 'Board', 'Calendar', 'Timeline'], 1, {}, 'is-block'))}
    </div>`),
  ]));

  const forms = section('Forms', join([
    sub('Input', `<div class="demo-fields">
      ${cell('Default', field({ label: 'Email address', type: 'email' }))}
      ${cell('Hover', field({ label: 'Email address', state: 'is-hover' }))}
      ${cell('Focus', field({ label: 'Email address', state: 'is-focus' }))}
      ${cell('Filled', field({ label: 'Email address', value: 'alex@acme.com' }))}
      ${cell('Error', field({ label: 'Email address', value: 'alex@acme', error: 'Enter a valid email address.' }))}
      ${cell('With hint', field({ label: 'Project name', hint: 'Shown to everyone on the team.' }))}
      ${cell('Disabled', field({ label: 'Workspace', value: 'Acme Corp', disabled: true }))}
    </div>`),
    sub('Textarea and select', `<div class="demo-fields">
      ${cell('Textarea', textarea({ label: 'Description' }))}
      ${cell('Textarea filled', textarea({ label: 'Description', value: 'Final review round before client sign-off next Friday.' }))}
      ${cell('Select', select({ label: 'Status', options: ['In review', 'In progress', 'Blocked'] }))}
      ${cell('Select disabled', select({ label: 'Status', options: ['In review'], disabled: true }))}
    </div>`),
    sub('Input group', `<div class="demo-fields">
      ${cell('Prefix', `<div class="input-group"><span class="input-addon">https://</span>${field({ label: 'Website', value: 'acme.com' })}</div>`)}
      ${cell('Suffix', `<div class="input-group">${field({ label: 'Budget', value: '12000' })}<span class="input-addon">EUR</span></div>`)}
    </div>`),
    sub('Checkbox', `<div class="row">
      ${cell('Unchecked', check('Email me updates'))}${cell('Checked', check('Email me updates', 'checked'))}
      ${cell('Hover', check('Email me updates', '', 'is-hover'))}${cell('Focus', check('Email me updates', 'checked', 'is-focus'))}
      ${cell('Disabled', check('Email me updates', 'disabled'))}${cell('Checked disabled', check('Email me updates', 'checked disabled'))}
    </div>`),
    sub('Radio group', `<div class="row">
      ${cell('Group', `<div class="choice-group" role="radiogroup" aria-label="Plan">${radio('Monthly', 'plan', 'checked')}${radio('Yearly', 'plan')}${radio('Lifetime', 'plan', 'disabled')}</div>`)}
      ${cell('Focus', radio('Focused', 'plan-f', 'checked', 'is-focus'))}
    </div>`),
    sub('Switch', `<div class="row">
      ${cell('Off', sw('Notifications'))}${cell('On', sw('Notifications', 'checked'))}
      ${cell('Focus', sw('Notifications', 'checked', 'is-focus'))}${cell('Disabled', sw('Notifications', 'disabled'))}
    </div>`),
    sub('Slider and colour', `<div class="demo-fields">
      ${cell('Slider', range('Remind me after', 3, 1, 14, ' days'))}
      ${cell('Slider, focus', formRow('Notification volume', '<input class="range is-focus" type="range" min="0" max="100" value="70" aria-label="Notification volume">', '<output class="form-row-value">70%</output>'))}
      ${cell('Slider, disabled', range('Remind me after', 3, 1, 14, ' days', true))}
      ${cell('Colour', formRow('Brand colour', '<label class="color-pick"><input type="color" value="#ec5106" aria-label="Brand colour"><code>#ec5106</code></label>'))}
    </div>`),
    sub('Form row (label above, value or "i" at the right)', `<div class="demo-fields">
      ${cell('A list', formRow('Sort invoices by', `<div class="field field-select"><select aria-label="Sort invoices by"><option>Due date</option><option>Client</option><option>Amount</option></select></div>`))}
      ${cell('A choice', formRow('Density', seg('Density', ['Compact', 'Normal', 'Spacious'], 1, {}, 'is-block'), infoTip('One control: spacing and type change together.')))}
      ${cell('Switches', formRow('Show on cards', `<div class="choice-group">${sw('Owner', 'checked')}${sw('Budget')}</div>`))}
    </div>`),
    sub('Off, with its reason (not hidden)', `<div class="demo-fields">
      ${cell('A switch that does not apply now', '<label class="switch"><input type="checkbox" role="switch" disabled>SMS alerts <span class="reason">— on the Business plan only</span></label>')}
      ${cell('A choice that does not apply now', formRow('Invoice language <span class="reason">— one language on the Starter plan</span>', seg('Invoice language', ['English', 'French', 'German'], 0, { 0: 'disabled', 1: 'disabled', 2: 'disabled' }, 'is-block')))}
    </div>`),
    sub('Label', `<span class="label">Standalone label</span>`),
  ]));

  const navigation = section('Navigation', join([
    sub('Navbar', `<nav class="navbar" aria-label="Demo"><span class="navbar-brand">ALARIC</span><div class="navbar-links"><a href="#" class="is-active">Projects</a><a href="#" class="is-hover">Hover</a><a href="#" class="is-focus">Focus</a><a href="#">Team</a></div></nav>`),
    sub('Navbar on a phone (the menu folds; .is-folded shows it at any width)', `<div class="stack">
      ${cell('Closed', '<nav class="navbar is-folded" aria-label="Demo phone"><span class="navbar-brand">ALARIC</span><button type="button" class="btn btn-ghost btn-sm navbar-toggle" aria-expanded="false">Menu</button><div class="navbar-links"><a href="#" class="is-active">Projects</a><a href="#">Invoices</a><a href="#">Team</a></div></nav>')}
      ${cell('Open', '<nav class="navbar is-folded is-open" aria-label="Demo phone, open"><span class="navbar-brand">ALARIC</span><button type="button" class="btn btn-ghost btn-sm navbar-toggle" aria-expanded="true">Menu</button><div class="navbar-links"><a href="#" class="is-active">Projects</a><a href="#">Invoices</a><a href="#">Team</a></div></nav>')}
    </div>`),
    sub('Sidebar', `<aside class="sidebar" aria-label="Demo"><div class="sidebar-heading">Workspace</div><a href="#" class="sidebar-item is-active">${icon('house')}Active</a><a href="#" class="sidebar-item is-hover">${icon('briefcase')}Hover</a><a href="#" class="sidebar-item is-focus">${icon('receipt')}Focus</a><a href="#" class="sidebar-item">${icon('gear')}Default<span class="badge badge-neutral badge-count">3</span></a></aside>`),
    sub('Tabs', `<div class="tabs" role="tablist"><button class="tab is-active">Active</button><button class="tab is-hover">Hover</button><button class="tab is-focus">Focus</button><button class="tab">Default</button><button class="tab" disabled>Disabled</button></div>`),
    sub('Breadcrumb', `<ol class="breadcrumb"><li><a href="#">Home</a></li><li><a href="#" class="is-hover">Projects</a></li><li>Acme Corp</li></ol>`),
    sub('Pagination', `<div class="pagination" role="navigation" aria-label="Pages"><button class="pagination-item" disabled>&lsaquo;</button><button class="pagination-item is-active">1</button><button class="pagination-item">2</button><button class="pagination-item is-hover">3</button><button class="pagination-item is-focus">4</button><button class="pagination-item">&rsaquo;</button></div>`),
    sub('Dropdown menu', `<div class="menu" role="menu"><button class="menu-item" role="menuitem"><span class="menu-item-label">${icon('note-pencil')}Edit</span></button><button class="menu-item is-hover" role="menuitem"><span class="menu-item-label">${icon('link')}Copy link</span><span class="text-muted text-small">Ctrl L</span></button><button class="menu-item is-focus" role="menuitem"><span class="menu-item-label">${icon('share-fat')}Share</span></button><button class="menu-item" role="menuitem" disabled><span class="menu-item-label">${icon('tray')}Archive</span></button><div class="menu-separator"></div><button class="menu-item is-destructive" role="menuitem"><span class="menu-item-label">${icon('trash')}Delete</span></button></div>`),
  ]));

  // One card per status colour: the four tokens it produces, when to use it, and it in use.
  // Colour is never the only signal: every example pairs it with an icon and text.
  const statuses = [
    { key: 'success', label: 'Success', icon: 'check-circle', use: 'Completed actions, saved changes, healthy status.', sample: 'Changes saved' },
    { key: 'error', label: 'Error', icon: 'x-circle', use: 'Failed actions, invalid input, destructive intent.', sample: 'Payment failed' },
    { key: 'warning', label: 'Warning', icon: 'warning', use: 'Needs attention but does not block: limits, expiring items.', sample: 'Storage almost full' },
    { key: 'info', label: 'Info', icon: 'info', use: 'Neutral news and tips. No action required.', sample: 'New version available' },
  ];
  const chip = (key, token, caption) => `<div class="demo-cell"><span class="demo-chip" style="background:var(--${key}${token})"></span><span class="demo-caption">${caption}</span></div>`;
  const statusCard = (s) => `<div class="card">
      <div class="row"><span class="badge badge-${s.key}">${s.label}</span></div>
      <div class="row">${chip(s.key, '', 'fill')}${chip(s.key, '-strong', 'text')}${chip(s.key, '-bg', 'tint')}${chip(s.key, '-border', 'border')}</div>
      <p class="text-muted text-small">${s.use}</p>
      <div class="alert${s.key === 'info' ? '' : ' alert-' + s.key}" role="status">${icon(s.icon)}<div class="alert-body"><span class="alert-title">${s.sample}</span></div></div>
    </div>`;
  const semantic = section('Semantic colors', join([
    sub('Status colors', `<div class="grid demo-status-grid">${join(statuses.map(statusCard))}</div>`),
    sub('Validation messages on fields', `<div class="grid demo-fields">
      ${cell('Success', `<div class="field-group has-success"><div class="field"><input id="demo-ok" type="email" placeholder=" " value="maria@acme.co"><label for="demo-ok">Work email</label></div><div class="field-msg">${icon('check-circle', 'icon-sm')}Looks good, we will send the invite here.</div></div>`)}
      ${cell('Error', `<div class="field-group has-error"><div class="field"><input id="demo-bad" type="email" placeholder=" " value="maria@acme"><label for="demo-bad">Work email</label></div><div class="field-msg">${icon('x-circle', 'icon-sm')}Enter a full address, like name@company.com.</div></div>`)}
    </div>`),
    sub('Form result banners', `<div class="stack">
      <div class="alert alert-success" role="status">${icon('check-circle')}<div class="alert-body"><span class="alert-title">Invite sent</span><span>Maria will get an email with a link to join Acme Corp.</span></div></div>
      <div class="alert alert-error" role="alert">${icon('x-circle')}<div class="alert-body"><span class="alert-title">We could not send the invite</span><span>Check the email address and try again.</span></div></div>
    </div>`),
  ]));

  const feedback = section('Feedback', join([
    sub('Alert / banner', `<div class="stack">
      <div class="alert" role="status">${icon('info')}<div class="alert-body"><span class="alert-title">New version available</span><span>Refresh the page to get the latest features.</span></div></div>
      <div class="alert alert-success" role="status">${icon('check-circle')}<div class="alert-body"><span class="alert-title">Changes saved</span><span>Your project settings were updated.</span></div></div>
      <div class="alert alert-warning" role="alert">${icon('warning')}<div class="alert-body"><span class="alert-title">Storage almost full</span><span>You have used 92% of your plan. Upgrade to keep uploading.</span></div></div>
      <div class="alert alert-error" role="alert">${icon('x-circle')}<div class="alert-body"><span class="alert-title">Payment failed</span><span>Your card was declined. Update your billing details to continue.</span></div></div>
    </div>`),
    sub('Toast', `<div class="row">
      <div class="toast toast-success" role="status">${icon('check-circle')}<div class="alert-body"><span class="alert-title">Project created</span><span class="text-muted text-small">Acme Corp is ready.</span></div><button class="toast-close" aria-label="Dismiss">&times;</button></div>
      <div class="toast toast-error" role="alert">${icon('x-circle')}<div class="alert-body"><span class="alert-title">Upload failed</span><span class="text-muted text-small">The file is larger than 10 MB.</span></div><button class="toast-close" aria-label="Dismiss">&times;</button></div>
    </div>`),
    sub('Progress', `<div class="stack">
      <div class="progress" role="progressbar" aria-valuenow="65" aria-valuemin="0" aria-valuemax="100" style="--value:65%"><span></span></div>
      <div class="progress progress-success" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="--value:100%"><span></span></div>
      <div class="progress progress-error" role="progressbar" aria-valuenow="30" aria-valuemin="0" aria-valuemax="100" style="--value:30%"><span></span></div>
    </div>`),
    sub('Spinner', `<div class="row"><div class="spinner" role="status" aria-label="Loading"></div></div>`),
    sub('Skeleton', `<div class="row"><div class="skeleton skeleton-circle"></div><div class="stack stack-sm demo-skeleton-lines"><div class="skeleton"></div><div class="skeleton is-short"></div></div></div>`),
    sub('Empty state', `<div class="empty"><div class="empty-icon" aria-hidden="true">${icon('tray', 'icon-lg')}</div><h3>No projects yet</h3><p>Create your first project to start tracking milestones and invoices.</p>${btn('primary', 'New project')}</div>`),
    sub('Badge', `<div class="row"><span class="badge">Default</span><span class="badge badge-success">Success</span><span class="badge badge-warning">Warning</span><span class="badge badge-error">Error</span><span class="badge badge-info">Info</span><span class="badge badge-neutral">Neutral</span><span class="badge badge-lg">Large</span></div>`),
    sub('Tag', `<div class="row"><span class="tag">design<button class="tag-remove" aria-label="Remove design">&times;</button></span><span class="tag">frontend<button class="tag-remove is-hover" aria-label="Remove frontend">&times;</button></span></div>`),
  ]));

  const overlays = section('Overlays', join([
    sub('Dialog (icon, description, close; sizes .dialog-sm / default / .dialog-lg)', `<div class="overlay"><div class="dialog" role="dialog" aria-label="Invite teammate"><div class="dialog-header"><span class="dialog-icon" aria-hidden="true">${icon('user-plus')}</span><h3>Invite teammate</h3><p class="dialog-description">They get an email with a link to join.</p>${tipBtn('ghost', 'x-circle', 'Close', 'btn-sm dialog-close', '', true)}</div><div class="dialog-body">They will get an email with a link to join the Acme Corp workspace.</div><div class="dialog-footer">${btn('tertiary', 'Cancel')}${btn('primary', 'Send invite')}</div></div></div>`),
    sub('Alert dialog (confirmation)', `<div class="overlay"><div class="dialog" role="alertdialog" aria-label="Delete project"><div class="dialog-header"><h3>Delete this project?</h3></div><div class="dialog-body">This permanently removes the project and its invoices. This cannot be undone.</div><div class="dialog-footer">${btn('tertiary', 'Keep project')}${btn('destructive', 'Delete project')}</div></div></div>`),
    sub('Drawer / sheet', `<div class="overlay overlay-end demo-drawer-wrap"><div class="drawer" role="dialog" aria-label="Filters"><div class="dialog-header"><h3>Filters</h3></div><div class="dialog-body"><div class="stack">${select({ label: 'Status', options: ['Any', 'In review', 'Blocked'] })}${check('Only my projects', 'checked')}</div></div><div class="dialog-footer">${btn('tertiary', 'Reset')}${btn('primary', 'Apply')}</div></div></div>`),
    sub('A real dialog (&lt;dialog&gt;: Esc, focus kept inside, the backdrop)', `<div class="row">${btn('primary', 'Open the dialog', '', 'type="button" data-open-dialog="demo-real-dialog"')}
      <dialog class="dialog" id="demo-real-dialog" aria-labelledby="demo-real-dialog-title"><form method="dialog"><div class="dialog-header"><h3 id="demo-real-dialog-title">Invite teammate</h3></div><div class="dialog-body">They will get an email with a link to join the Acme Corp workspace.</div><div class="dialog-footer">${btn('tertiary', 'Cancel', '', 'value="cancel"')}${btn('primary', 'Send invite', '', 'value="send"')}</div></form></dialog></div>`),
    sub('The "i" (opens on hover and keyboard focus)', `<div class="row demo-info-row">${cell('Default', infoTip('An invoice is overdue the day after its due date.'))}${cell('Open', infoTip('An invoice is overdue the day after its due date.', 'is-open'))}</div>`),
    sub('Popover and tooltip', `<div class="row"><div class="popover" role="dialog" aria-label="Details"><h4>Due date</h4><p class="text-small text-muted">Milestones due within 7 days are highlighted on the project page.</p></div><span class="tooltip" role="tooltip">Copy link</span></div>`),
    sub('Tooltip on an icon button (hover or focus; Esc closes it)', `<div class="row demo-info-row">${cell('Default', tipBtn('ghost', 'link', 'Copy link'))}${cell('Open', tipBtn('ghost', 'link', 'Copy link').replace('has-tooltip', 'has-tooltip is-open'))}</div>`),
  ]));

  const data = section('Data display', join([
    sub('Stat', `<div class="grid grid-3">
      <div class="card"><div class="stat"><span class="stat-label">Active projects</span><span class="stat-value">5</span><span class="stat-delta is-up">${icon('arrow-circle-up', 'icon-sm')}1 more than last week</span></div></div>
      <div class="card"><div class="stat"><span class="stat-label">Overdue invoices</span><span class="stat-value">3</span><span class="stat-delta is-down">${icon('arrow-circle-down', 'icon-sm')}2 more than last week</span></div></div>
      <div class="card"><div class="stat"><span class="stat-label">Budget used</span><span class="stat-value">65%</span><span class="stat-delta">${icon('arrow-circle-right', 'icon-sm')}On plan</span></div></div>
    </div>`),
    sub('Card header and description list', `<div class="grid grid-2"><div class="card"><div class="card-header"><h3>Pro</h3><span class="badge badge-info">Current plan</span></div><dl class="dl"><dt>Price</dt><dd>29 EUR a month</dd><dt>Renews</dt><dd>Nov 1</dd><dt>Seats</dt><dd>4 of 10 used</dd></dl><div class="card-actions">${btn('primary', 'Change plan')}${btn('ghost', 'Cancel subscription')}</div></div></div>`),
    sub('Card', `<div class="grid">
      ${cell('Default', `<div class="card"><div class="card-group"><div class="card-label">Invoice #1042</div><h3>Acme Corp</h3></div><p class="text-muted">Marked as paid on Sep 12, three days ahead of the due date.</p></div>`)}
      ${cell('Interactive, hover', `<div class="card card-interactive is-hover"><div class="card-group"><div class="card-label">Invoice #1043</div><h3>Northwind Traders</h3></div><p class="text-muted">Awaiting approval from the finance team.</p></div>`)}
      ${cell('With actions (one row at the bottom, one size)', `<div class="card"><div class="card-group"><div class="card-label">Invoice #1044</div><h3>Globex</h3></div><p class="text-muted">Five days past due.</p><div class="card-actions">${btn('primary', 'Send a reminder')}${btn('ghost', 'Mark as paid')}</div></div>`)}
    </div>`),
    sub('Table', `<div class="table-wrap"><table class="table"><thead><tr><th>Invoice</th><th>Client</th><th>Amount</th><th>Status</th><th class="table-actions"><span class="sr-only">Actions</span></th></tr></thead><tbody>
      <tr><td>#1042</td><td>Acme Corp</td><td>4,200 EUR</td><td><span class="badge badge-success">Paid</span></td><td class="table-actions">${rowActions('#1042')}</td></tr>
      <tr class="is-hover"><td>#1043</td><td>Northwind Traders</td><td>1,850 EUR</td><td><span class="badge badge-warning">Pending</span></td><td class="table-actions">${rowActions('#1043')}</td></tr>
      <tr><td>#1044</td><td>Globex</td><td>920 EUR</td><td><span class="badge badge-error">Overdue</span></td><td class="table-actions">${rowActions('#1044')}</td></tr>
    </tbody></table></div>`),
    sub('List item', `<ul class="list">
      <li class="list-item"><span class="avatar-status"><span class="avatar">AM</span><span class="presence is-online"></span></span><div class="list-item-main"><span class="list-item-title">Alex Morgan</span><span class="list-item-meta">Project lead · Online</span></div></li>
      <li class="list-item is-hover"><span class="avatar-status"><span class="avatar">MS</span><span class="presence is-away"></span></span><div class="list-item-main"><span class="list-item-title">Maria Santos</span><span class="list-item-meta">Designer · Away</span><div class="row"><span class="tag">UI</span><span class="tag">motion</span></div></div>${tipBtn('ghost', 'dots-three-circle', 'More about Maria Santos', '', '', true)}</li>
    </ul>`),
    sub('Avatar', `<div class="row"><span class="avatar avatar-sm">AM</span><span class="avatar">MS</span><span class="avatar avatar-lg">SR</span><div class="avatar-group"><span class="avatar">AM</span><span class="avatar">MS</span><span class="avatar">SR</span><span class="avatar badge-neutral">+4</span></div></div>`),
    sub('Accordion', `<div class="accordion"><details open><summary>What is included in the free plan?</summary><div class="accordion-body">Up to three projects, one workspace and basic reporting.</div></details><details><summary>Can I change plans later?</summary><div class="accordion-body">Yes, you can upgrade or downgrade at any time from Billing.</div></details><details><summary class="is-focus">Focused row</summary><div class="accordion-body">Focus ring is drawn inside the row.</div></details></div>`),
    sub('Separator', `<div class="stack"><p>Above the line</p><hr class="separator"><p>Below the line</p></div>`),
  ]));

  const layout = section('Layout', join([
    sub('Page header and section header', `<div class="stack stack-lg"><div class="page-header"><div class="page-header-text"><h2>Projects</h2><p class="text-muted">The page's title and its lead; the actions wrap under on a narrow screen.</p></div><div class="page-header-actions">${btn('secondary', 'Export')}${btn('primary', 'New project')}</div></div>
      <div class="section-header"><h3>Recent projects</h3><a class="link link-action" href="#">See all${icon('arrow-circle-right', 'icon-sm')}</a></div></div>`),
    sub('Form section, fieldset, form actions', `<form class="card" onsubmit="return false"><div class="form-section"><div class="form-section-head"><h3>Notifications</h3><p>What reaches your inbox, and how soon.</p></div><div class="form-section-body"><fieldset class="fieldset"><legend>Email</legend><div class="choice-group">${sw('When a project changes', 'checked')}${sw('A weekly digest')}</div></fieldset></div></div>
      <div class="form-section"><div class="form-section-head"><h3>Profile</h3><p>How the team sees you.</p></div><div class="form-section-body">${field({ label: 'Full name', value: 'Alex Morgan' })}</div></div>
      <div class="form-actions">${btn('ghost', 'Discard changes', '', 'type="button"')}${btn('primary', 'Save changes', '', 'type="button"')}</div></form>`),
    sub('Hero (split), band, feature, steps', `<div class="stack stack-lg"><section class="hero split"><div class="hero-text"><span class="text-overline">Overline</span><p class="text-display">A display title</p><p class="text-lead">The lead says what this is in one or two sentences.</p><div class="hero-actions">${btn('primary', 'Call to action', 'btn-lg')}${btn('secondary', 'Second path', 'btn-lg')}</div></div><div class="hero-media"><div class="card"><p class="text-muted">.hero-media: an image, an illustration or a live preview</p></div></div></section>
      <section class="band band-alt"><div class="section-head"><span class="text-overline">.band.band-alt</span><h3>A band of a landing page</h3></div><div class="grid grid-3">${['shield-check', 'stack', 'palette'].map((n) => `<div class="card"><div class="feature"><span class="feature-icon" aria-hidden="true">${icon(n, 'icon-lg')}</span><h3>Feature</h3><p class="text-muted">One sentence on what it gives you.</p></div></div>`).join('')}</div></section>
      <ol class="steps"><li class="is-current"><span class="steps-title">The step you are on</span><span class="steps-text">Filled; the others are tinted, joined by a line.</span></li><li><span class="steps-title">Next step</span><span class="steps-text">One sentence each.</span></li><li><span class="steps-title">Last step</span><span class="steps-text">The line stops here.</span></li></ol></div>`),
    sub('Site footer', `<footer class="footer-site"><div class="footer-brand"><span class="navbar-brand">ALARIC</span><p>The brand, and what it is in one sentence.</p></div><nav class="footer-col" aria-label="Product"><span class="text-overline">Product</span><a href="#">Features</a><a href="#" class="is-hover">The app</a></nav><nav class="footer-col" aria-label="About"><span class="text-overline">About</span><a href="#">Privacy</a><a href="#">Contact</a></nav><div class="footer-bottom"><span>© 2026 Acme</span><span>The small print</span></div></footer>`),
    sub('Footer (an app\'s pages)', `<footer class="footer"><span>© 2026 Acme Corp</span><nav class="footer-links" aria-label="Footer"><a href="#">Privacy</a><a href="#" class="is-hover">Terms</a><a href="#">Contact</a></nav></footer>`),
    sub('Container, grid (.grid-2 / -3 / -4: at most that many columns) and stack', `<div class="container demo-container"><div class="grid grid-3">
      <div class="card"><div class="card-group"><div class="card-label">grid item</div><p>Auto-fit columns with a token gap.</p></div></div>
      <div class="card"><div class="card-group"><div class="card-label">grid item</div><p>Wraps to fewer columns as space shrinks.</p></div></div>
      <div class="card"><div class="card-group"><div class="card-label">stack</div><div class="stack stack-sm"><span class="badge">One</span><span class="badge">Two</span><span class="badge">Three</span></div></div></div>
    </div></div>`),
  ]));

  const iconGroups = window.DS_ICON_GROUPS || {};
  const iconCount = Object.keys(window.DS_ICONS || {}).length;
  const compare = ['house', 'briefcase', 'receipt', 'presentation-chart', 'gear', 'credit-card', 'user', 'bell', 'trash', 'star', 'heart', 'lock', 'clock', 'tag', 'globe', 'lightbulb'];
  const icons = section(`Icons (${iconCount})`, join([
    sub('Sizes', `<div class="row">${icon('house', 'icon-sm')}${icon('house')}${icon('house', 'icon-lg')}<span class="text-muted text-small">next to text:</span><span class="row">${icon('bell')}<span>Notifications</span></span></div>`),
    sub('Three styles', join(['outline', 'filled', 'duotone'].map((s) => cell(s, `<div class="row demo-compare">${compare.map((n) => icon(n, 'icon-lg', s)).join('')}</div>`)))),
    `<input id="icon-search" class="demo-search" type="search" placeholder="Search ${iconCount} icons" aria-label="Search icons">`,
    join(Object.entries(iconGroups).map(([group, names]) => sub(`${group} (${names.length})`,
      `<div class="demo-icons">${names.map((n) => `<div class="demo-icon-cell" data-name="${n}">${icon(n, 'icon-lg')}<span>${n}</span></div>`).join('')}</div>`))),
  ]));

  window.DS_DEMO_HTML = join([
    `<section class="demo-section" data-view="page">${realPage}</section>`,
    typography, actions, forms, navigation, semantic, feedback, overlays, data, layout, icons,
  ]);
})();

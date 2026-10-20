// The page example's starting data and its fixed frame: the navbar, the sidebar, the footer and every dialog the
// pages open. configurator/demo/app.js copies the data into its state (so a reload starts clean) and mounts the frame.
// Sets window.DS_DEMO_DATA and window.DS_DEMO_FRAME.
(function () {
  const { icon, btn, tipBtn, field, textarea, select, check, radio } = window.DS_DEMO_PARTS;
  const join = (items) => items.join('');

  window.DS_DEMO_DATA = {
    projects: [
      { id: 'p1', name: 'Acme Corp: Website redesign', client: 'Acme Corp', owner: 'Alex Morgan', status: 'review', updated: '2 hours ago', done: 85, budget: 24000, text: 'Checkout flow and the updated pricing page are the last two milestones before client sign-off.' },
      { id: 'p2', name: 'Northwind Traders: Mobile app', client: 'Northwind Traders', owner: 'Maria Santos', status: 'progress', updated: 'yesterday', done: 60, budget: 38000, text: 'Onboarding is done. Push notifications and offline sync are still in development.' },
      { id: 'p3', name: 'Globex: Brand refresh', client: 'Globex', owner: 'Alex Morgan', status: 'blocked', updated: '5 days ago', done: 30, budget: 12000, text: 'Waiting on final logo approval from the client before the design system can move forward.' },
      { id: 'p4', name: 'Initech: Intranet search', client: 'Initech', owner: 'Sam Reed', status: 'progress', updated: '3 days ago', done: 45, budget: 9000, text: 'The index covers wiki and tickets; file shares come next.' },
      { id: 'p5', name: 'Umbrella: Annual report', client: 'Umbrella', owner: 'Maria Santos', status: 'review', updated: 'this morning', done: 95, budget: 6000, text: 'Final proofs are with the client; print is booked for Friday.' },
    ],
    invoices: [
      { no: 1042, client: 'Globex', amount: '4,200 EUR', due: 'Oct 9', status: 'overdue' },
      { no: 1043, client: 'Northwind Traders', amount: '1,850 EUR', due: 'Oct 20', status: 'pending' },
      { no: 1044, client: 'Acme Corp', amount: '6,400 EUR', due: 'Oct 2', status: 'paid' },
      { no: 1045, client: 'Initech', amount: '920 EUR', due: 'Oct 6', status: 'overdue' },
      { no: 1046, client: 'Acme Corp', amount: '3,100 EUR', due: 'Oct 28', status: 'pending' },
      { no: 1047, client: 'Umbrella', amount: '2,000 EUR', due: 'Sep 30', status: 'paid' },
      { no: 1048, client: 'Northwind Traders', amount: '5,750 EUR', due: 'Sep 15', status: 'paid' },
      { no: 1049, client: 'Globex', amount: '1,300 EUR', due: 'Oct 1', status: 'overdue' },
    ],
    team: [
      { initials: 'AM', name: 'Alex Morgan', role: 'Project lead', email: 'alex@acme.example', status: 'online', skills: ['strategy', 'research'] },
      { initials: 'MS', name: 'Maria Santos', role: 'Designer', email: 'maria@acme.example', status: 'online', skills: ['UI', 'prototyping', 'motion'] },
      { initials: 'SR', name: 'Sam Reed', role: 'Developer', email: 'sam@acme.example', status: 'away', skills: ['frontend', 'search'] },
      { initials: 'JL', name: 'Jo Lee', role: 'Account manager', email: 'jo@acme.example', status: 'away', skills: ['billing'] },
    ],
    activity: [
      { initials: 'MS', who: 'Maria Santos', what: 'uploaded new screens to Northwind Traders', when: '2 hours ago' },
      { initials: 'AM', who: 'Alex Morgan', what: 'sent Acme Corp the pricing page for review', when: 'Yesterday' },
      { initials: 'SR', who: 'Sam Reed', what: 'closed 6 tickets on Initech', when: '3 days ago' },
    ],
    reportData: {
      Week: { hours: 142, hoursPct: 71, onTime: 92, budget: 18 },
      Month: { hours: 610, hoursPct: 76, onTime: 88, budget: 64 },
      Quarter: { hours: 1730, hoursPct: 72, onTime: 85, budget: 81 },
    },
    profile: { name: 'Alex Morgan', email: 'alex@acme.example', bio: 'Project lead at Acme. Ask me about timelines.' },
    plans: { Starter: 9, Pro: 29, Business: 79 },
    legal: {
      privacy: ['Privacy', '<p>This is a demo, so nothing you type here leaves your browser.</p><h4>What a real policy covers</h4><ul><li>What is collected, and why</li><li>How long it is kept</li><li>How to ask for it to be deleted</li></ul>'],
      terms: ['Terms', '<p>Using the demo is free. A real page lists the rules of the service in plain words.</p><h4>In short</h4><p>Be kind, keep your password safe, and tell us when something breaks.</p>'],
    },
  };

  // ---------- the frame ----------
  const NAV = [['overview', 'Overview'], ['projects', 'Projects'], ['invoices', 'Invoices'], ['team', 'Team']];
  const SIDE = [
    ['Workspace', [['overview', 'house', 'Overview'], ['projects', 'briefcase', 'Projects'], ['invoices', 'receipt', 'Invoices', 'overdue'], ['reports', 'presentation-chart', 'Reports'], ['team', 'user', 'Team']]],
    ['Account', [['settings', 'gear', 'Settings'], ['billing', 'credit-card', 'Billing']]],
  ];
  const navbar = `<nav class="navbar" aria-label="Main">
      <a href="#home" class="navbar-brand" data-go="home">ALARIC</a>
      <button type="button" class="btn btn-ghost btn-sm navbar-toggle" aria-expanded="false">Menu</button>
      <div class="navbar-links" data-layout="site">
        <a href="#home-features" data-act="scroll" data-target="home-features">Features</a>
        <a href="#overview" data-go="overview">The app</a>
        ${btn('primary', 'Start a project', 'btn-sm', 'data-act="open" data-dialog="app-dlg-start"')}
      </div>
      <div class="navbar-links" data-layout="app">
        ${join(NAV.map(([p, label]) => `<a href="#${p}" data-go="${p}">${label}</a>`))}
        ${btn('secondary', 'Upgrade', 'btn-sm', 'data-go="billing"')}
        <button type="button" class="avatar avatar-sm" aria-label="Your account, Alex Morgan" aria-haspopup="menu" data-act="menu" data-menu="app-menu-account">AM</button>
      </div>
    </nav>
    <div class="menu" role="menu" popover id="app-menu-account">
      <button class="menu-item" role="menuitem" data-go="settings"><span class="menu-item-label">${icon('gear')}Settings</span></button>
      <button class="menu-item" role="menuitem" data-go="billing"><span class="menu-item-label">${icon('credit-card')}Billing</span></button>
      <div class="menu-separator"></div>
      <button class="menu-item" role="menuitem" data-act="toast" data-msg="Signed out — this is a demo, so you're still here."><span class="menu-item-label">${icon('sign-out')}Sign out</span></button>
    </div>`;
  const sidebar = `<aside class="sidebar" aria-label="Sections">${join(SIDE.map(([heading, items]) => `<div class="sidebar-heading">${heading}</div>${join(items.map(([p, ic, label, count]) => `<a href="#${p}" class="sidebar-item" data-go="${p}">${icon(ic)}${label}${count ? '<span class="badge badge-neutral badge-count" data-count="overdue"></span>' : ''}</a>`))}`))}</aside>`;
  // Two footers: the site's (Home) with columns, the app's plain row; render() shows the one for the layout.
  const col = (title, links) => `<nav class="footer-col" aria-label="${title}"><span class="text-overline">${title}</span>${links}</nav>`;
  const siteFooter = `<footer class="footer-site" data-layout="site">
      <div class="footer-brand"><a href="#home" class="navbar-brand" data-go="home">ALARIC</a><p>A design system starter kit for Claude Code: your choices become tokens, components and the rules that keep them.</p></div>
      ${col('Product', '<a href="#home-features" data-act="scroll" data-target="home-features">Features</a><a href="#overview" data-go="overview">The example app</a><a href="#start" data-act="open" data-dialog="app-dlg-start">Start a project</a>')}
      ${col('Resources', '<a href="#rules" data-act="toast" data-msg="The rules live in .claude/rules/common/design.md in your project.">Design rules</a><a href="#readme" data-act="toast" data-msg="README.md in the kit walks through every command.">The README</a>')}
      ${col('About', '<a href="#privacy" data-act="legal" data-doc="privacy">Privacy</a><a href="#terms" data-act="legal" data-doc="terms">Terms</a><a href="#contact" data-act="open" data-dialog="app-dlg-contact">Contact</a>')}
      <div class="footer-bottom"><span>© 2026 Alaric</span><span>This page is built only from Alaric's own components.</span></div>
    </footer>`;
  const footer = `<footer class="footer" data-layout="app"><span>© 2026 · Built with Alaric</span><nav class="footer-links" aria-label="Footer">
      <a href="#privacy" data-act="legal" data-doc="privacy">Privacy</a><a href="#terms" data-act="legal" data-doc="terms">Terms</a><a href="#contact" data-act="open" data-dialog="app-dlg-contact">Contact</a></nav></footer>`;

  // ---------- the dialogs ----------
  // Every dialog: a header (optional icon, the title, an optional description, the close button), a body that scrolls on
  // its own, the actions. `size` is '' (default), 'dialog-sm' (a confirmation) or 'dialog-lg' (a form, reading).
  const closeBtn = tipBtn('ghost', 'x-circle', 'Close', 'btn-sm dialog-close', 'value="cancel" formnovalidate', true);
  const dialog = (id, title, body, footerHtml, { attrs = '', size = '', description = '', iconName = '' } = {}) => `<dialog class="dialog ${size}" id="${id}" aria-labelledby="${id}-title"${description ? ` aria-describedby="${id}-desc"` : ''} ${attrs}><form method="dialog" novalidate>
      <div class="dialog-header">${iconName ? `<span class="dialog-icon" aria-hidden="true">${icon(iconName)}</span>` : ''}<h3 id="${id}-title">${title}</h3>${description ? `<p class="dialog-description" id="${id}-desc">${description}</p>` : ''}${closeBtn}</div>
      <div class="dialog-body"><div class="stack">${body}</div></div>
      <div class="dialog-footer">${footerHtml}</div></form></dialog>`;
  const cancel = (label = 'Cancel') => btn('ghost', label, '', 'value="cancel" formnovalidate');
  const ok = (label, variant = 'primary') => btn(variant, label, '', 'value="ok"');
  const dialogs = join([
    dialog('app-dlg-project', 'New project', join([
      field({ label: 'Project name', name: 'name', required: true, hint: 'Shown on the card and in the table.' }),
      select({ label: 'Client', name: 'client', options: ['Acme Corp', 'Northwind Traders', 'Globex', 'Initech', 'Umbrella'] }),
      select({ label: 'Status', name: 'status', options: ['In progress', 'In review', 'Blocked', 'Archived'] }),
      `<div class="input-group">${field({ label: 'Budget', name: 'budget', value: '10000' })}<span class="input-addon">EUR</span></div>`,
      textarea({ label: 'What is it about?', name: 'text' }),
      check('Tell the team', 'checked name="notify"'),
    ]), cancel() + ok('Create project'), { description: 'It shows up on Projects and in Reports right away.' }),
    dialog('app-dlg-confirm', 'Delete this?', '<p id="app-dlg-confirm-text"></p>', cancel('Keep it') + ok('Delete', 'destructive'), { attrs: 'role="alertdialog" aria-describedby="app-dlg-confirm-text"', size: 'dialog-sm' }),
    dialog('app-dlg-invite', 'Invite teammate', join([
      field({ label: 'Work email', type: 'email', name: 'email', required: true, hint: 'They get a link to join the workspace.' }),
      `<div class="choice-group" role="radiogroup" aria-label="Role">${radio('Member — works on projects', 'app-role', 'checked value="Member"')}${radio('Admin — also billing and people', 'app-role', 'value="Admin"')}${radio('Viewer — read only', 'app-role', 'value="Viewer"')}</div>`,
    ]), cancel() + ok('Send invite'), { description: 'They get an email with a link to join Acme.' }),
    dialog('app-dlg-plan', 'Change plan', `<div class="choice-group" role="radiogroup" aria-label="Plan">${join(Object.entries(window.DS_DEMO_DATA.plans).map(([name, price]) => radio(`${name} — ${price} EUR a month`, 'app-plan', `value="${name}"${name === 'Pro' ? ' checked' : ''}`)))}</div>`, cancel() + ok('Switch plan'), { description: 'The new price applies from the next invoice.' }),
    dialog('app-dlg-contact', 'Contact us', join([field({ label: 'Subject', name: 'subject', required: true, hint: 'One line on what it is about.' }), textarea({ label: 'Message', name: 'message' })]), cancel() + ok('Send'), { description: 'We answer within one working day.' }),
    dialog('app-dlg-start', 'Start a project with Alaric', `<ol class="steps">${join([
      ['Copy the kit', 'Rename the folder to your project and open Claude Code in it.'],
      ['Run /project:bootstrap', 'It asks a few questions; any of them can wait.'],
      ['Pick your design system', 'Here, in the panel. Save it as src/app.css.'],
      ['Open dashboard.html', 'Its Start here card shows what is left.'],
    ].map(([t, x], i) => `<li${i === 0 ? ' class="is-current"' : ''}><span class="steps-title">${t}</span><span class="steps-text">${x}</span></li>`))}</ol>`,
      btn('primary', `Open the app${icon('arrow-circle-right')}`, '', 'type="button" data-go="overview"'),   // the × closes it; a second Close would repeat it
      { iconName: 'lightning', description: 'Four steps, about ten minutes. Claude does most of the work; you choose the design.' }),
    dialog('app-dlg-legal', 'Privacy', '<div class="prose" id="app-dlg-legal-text"></div>', ok('Close'), { size: 'dialog-lg' }),
    `<dialog class="drawer" id="app-drawer-filters" aria-labelledby="app-drawer-filters-title"><form method="dialog" novalidate>
      <div class="dialog-header"><h3 id="app-drawer-filters-title">Filters</h3>${closeBtn}</div>
      <div class="dialog-body"><div class="stack">${select({ label: 'Status', name: 'status', options: ['Any', 'Paid', 'Pending', 'Overdue'] })}${check('Only overdue', 'name="overdueOnly"')}</div></div>
      <div class="dialog-footer">${btn('tertiary', 'Reset', '', 'value="reset" formnovalidate')}${ok('Apply')}</div></form></dialog>`,
  ]);

  window.DS_DEMO_FRAME = `${navbar}<div class="app-shell">${sidebar}<main class="stack stack-lg app-main" id="app-main"></main></div>${siteFooter}${footer}${dialogs}
    <div class="toast-region" popover="manual" id="app-toasts" role="region" aria-label="Notifications"></div>`;
})();

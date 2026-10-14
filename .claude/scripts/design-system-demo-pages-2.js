// The page example's other four pages: Team, Reports, Settings, Billing. Same rules as design-system-demo-pages.js
// (every link has data-go or data-act; typed text goes through esc()). Adds them to window.DS_DEMO_PAGES.
(function () {
  const { icon, btn, tipBtn, field, textarea, check, radio, sw, seg, formRow, infoTip, range } = window.DS_DEMO_PARTS;
  const { esc, go, act, header } = window.DS_DEMO_KIT;
  const join = (items) => items.join('');

  // ---------- Team ----------
  // The person is the row: name, role and presence together (a dot on the avatar AND a word), skills as read-only
  // tags; the details open from the end of the row. Names are links only inside sentences and tables.
  const PRESENCE = { online: 'Online', away: 'Away' };
  const member = (m) => `<li class="list-item"><span class="avatar-status"><span class="avatar">${m.initials}</span><span class="presence is-${m.status}"></span></span>
    <div class="list-item-main"><span class="list-item-title">${m.name}</span><span class="list-item-meta">${m.role} · ${PRESENCE[m.status]}</span>
      <div class="row">${join(m.skills.map((s) => `<span class="tag">${s}</span>`))}</div></div>
    ${tipBtn('ghost', 'dots-three-circle', `More about ${m.name}`, '', act('popover', `data-pop="app-pop-${m.initials}"`), true)}
    <div class="popover" popover id="app-pop-${m.initials}" role="dialog" aria-label="${m.name}"><h4>${m.name}</h4><p class="text-small text-muted">${m.role} · ${m.email}</p>
      <div class="row">${btn('secondary', `${icon('envelope-simple-open')}Message`, 'btn-sm', act('toast', `data-msg="Message to ${m.name} sent (demo)."`))}${go('projects', 'Their projects')}</div></div></li>`;

  function team(S) {
    const online = S.team.filter((m) => m.status === 'online').length;
    return join([
      header('Workspace', 'Team', `${S.team.length} people, ${online} online now. Open the details of a person from the end of the row.`,
        btn('primary', `${icon('user-plus')}Invite teammate`, '', act('open', 'data-dialog="app-dlg-invite"'))),
      `<div class="row"><span class="label">Roles</span>${infoTip('Admins manage billing and people. Members work on projects. Viewers can only read.')}</div>`,
      `<ul class="list">${join(S.team.map(member))}</ul>`,
    ]);
  }

  // ---------- Reports ----------
  const PERIODS = ['Week', 'Month', 'Quarter'];
  const reportStat = (label, value, pct, tip = '') => `<div class="card"><div class="stat"><div class="row"><span class="stat-label">${label}</span>${tip}</div><span class="stat-value">${value}</span></div>
    <div class="progress" role="progressbar" aria-label="${label}" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" style="--value:${pct}%"><span></span></div></div>`;
  const loadingStats = () => `<div class="grid" aria-busy="true">${join([1, 2, 3].map(() => '<div class="card"><div class="skeleton"></div><div class="skeleton is-short"></div></div>'))}</div>
    <div class="row"><div class="spinner" role="status" aria-label="Loading the report"></div><span class="text-muted text-small">Loading the report…</span></div>`;

  function reports(S) {
    const r = S.reportData[S.period];
    const stats = S.loading ? loadingStats() : `<div class="grid">${reportStat('Hours logged', r.hours, r.hoursPct)}${reportStat('On-time rate', `${r.onTime}%`, r.onTime, infoTip('Milestones delivered on or before their due date.'))}${reportStat('Budget used', `${r.budget}%`, r.budget)}</div>`;
    return join([
      header('Workspace', 'Reports', 'How the work is going. Pick a period; the numbers reload.',
        btn('secondary', `${icon('download')}Export${icon('caret-circle-down', 'icon-sm')}`, '', `aria-haspopup="menu" ${act('menu', 'data-menu="app-menu-export"')}`)),
      `<div class="menu" role="menu" popover id="app-menu-export">
        <button class="menu-item" role="menuitem" ${act('toast', 'data-msg="report.csv is ready (demo)."')}><span class="menu-item-label">${icon('article')}As CSV, for a spreadsheet</span></button>
        <button class="menu-item" role="menuitem" ${act('toast', 'data-msg="report.pdf is ready (demo)."')}><span class="menu-item-label">${icon('printer')}As PDF, to print or send</span></button></div>`,
      formRow('Period', `<div ${act('period')}>${seg('Period', PERIODS, PERIODS.indexOf(S.period))}</div>`),
      stats,
      `<h2>Completion by project</h2><div class="table-wrap"><table class="table"><thead><tr><th>Project</th><th>Done</th><th>Progress</th></tr></thead><tbody>
        ${join(S.projects.filter((p) => p.status !== 'archived').map((p) => `<tr><td>${esc(p.name)}</td><td>${p.done}%</td><td><div class="progress${p.status === 'blocked' ? ' progress-error' : ''}" role="progressbar" aria-label="${esc(p.name)}" aria-valuenow="${p.done}" aria-valuemin="0" aria-valuemax="100" style="--value:${p.done}%"><span></span></div></td></tr>`))}
      </tbody></table></div>`,
    ]);
  }

  // ---------- Settings ----------
  // Four form sections, each saying what it is for on the left and holding only its own controls on the right; one row
  // of actions at the end. Deleting the workspace is apart, in its own card.
  const savedBanner = (result) => (result === 'ok'
    ? `<div class="alert alert-success" role="status">${icon('check-circle')}<div class="alert-body"><span class="alert-title">Settings saved</span><span>Your changes apply right away.</span></div></div>`
    : result === 'error' ? `<div class="alert alert-error" role="alert">${icon('x-circle')}<div class="alert-body"><span class="alert-title">Not saved</span><span>Fix the fields marked in red, then save again.</span></div></div>` : '');
  const formSection = (title, text, body) => `<div class="form-section"><div class="form-section-head"><h3>${title}</h3><p>${text}</p></div><div class="form-section-body">${body}</div></div>`;

  function settingsSections(S) {
    const profile = formSection('Profile', 'How you appear to the team on projects and invoices.', join([
      field({ label: 'Full name', value: S.profile.name, name: 'name', required: true, hint: 'Shown on your projects.' }),
      field({ label: 'Email', type: 'email', value: S.profile.email, name: 'email', required: true, hint: 'Where invites and invoices go.' }),
      textarea({ label: 'About you', name: 'bio', value: S.profile.bio }),
    ]));
    const notify = formSection('Notifications', 'What reaches your inbox, and how soon.', join([
      `<fieldset class="fieldset"><legend>Email</legend><div class="choice-group">${sw('When a project changes', 'checked')}${sw('A weekly digest on Mondays')}</div></fieldset>`,
      `<fieldset class="fieldset"><legend>Text messages</legend><label class="switch"><input type="checkbox" role="switch" disabled>SMS alerts <span class="reason">— on the Business plan only</span></label><div>${go('billing', 'See the plans', 'link link-quiet')}</div></fieldset>`,
      range('Remind me about an overdue invoice after', 3, 1, 14, ' days'),
    ]));
    const look = formSection('Appearance', 'How Acme looks for you. In this demo the real density is chosen in the panel.', join([
      `<fieldset class="fieldset"><legend>Theme</legend><div class="choice-group" role="radiogroup" aria-label="Theme">${radio('Light', 'app-theme', 'checked')}${radio('Dark', 'app-theme')}${radio('Same as the system', 'app-theme')}</div></fieldset>`,
      formRow('Density', seg('Density', ['Compact', 'Normal', 'Spacious'], 1, {}, 'is-block'), infoTip('Only in this demo: the real density is set in the configurator panel.')),
      formRow('Brand colour', '<label class="color-pick"><input type="color" value="#ec5106" aria-label="Brand colour"><code>#ec5106</code></label>'),
      check('Show archived projects in search', 'checked'),
    ]));
    const dev = formSection('Developer', 'Read your projects from another tool. Keep the key secret.', `<pre><code>curl https://api.acme.example/v1/projects \\
  -H "Authorization: Bearer demo_4f9a…"</code></pre><div>${btn('secondary', `${icon('copy')}Copy the example`, 'btn-sm', act('toast', 'data-msg="Copied to the clipboard."'))}</div>`);
    return join([profile, notify, look, dev]);
  }

  function settings(S) {
    const danger = `<div class="card"><div class="form-section"><div class="form-section-head"><h3>Delete the workspace</h3><p>Every project and invoice in Acme goes with it. This cannot be undone.</p></div>
      <div class="form-section-body"><div>${btn('destructive', `${icon('trash')}Delete workspace`, '', act('confirm', 'data-confirm="workspace"'))}</div></div></div></div>`;
    return join([
      header('Account', 'Settings', 'Your profile, how Acme reaches you, and how it looks.'),
      `<div id="app-settings-result">${savedBanner(S.saved)}</div>`,
      `<form class="card" id="app-settings" novalidate>${settingsSections(S)}
        <div class="form-actions">${btn('ghost', 'Discard changes', '', `type="button" ${act('discard-settings')}`)}${btn('primary', 'Save changes', '', 'type="submit"')}</div></form>`,
      danger,
    ]);
  }

  // ---------- Billing ----------
  const FAQ = [
    ['What is included in the Pro plan?', 'Unlimited projects, three workspaces and reports with PDF export.'],
    ['Can I change plans later?', 'Yes. Upgrade or downgrade at any time; the price is adjusted on the next invoice.'],
    ['What happens if I cancel?', 'Your projects stay readable for 30 days, then the workspace is deleted.'],
  ];

  function billing(S) {
    const price = S.plan.annual ? S.plan.price * 10 : S.plan.price;
    const plan = `<div class="card"><div class="card-header"><h3>${S.plan.name}</h3><span class="badge badge-info">Current plan</span></div>
        <dl class="dl"><dt>Price</dt><dd>${price} EUR a ${S.plan.annual ? 'year — two months free' : 'month'}</dd><dt>Renews</dt><dd>Nov 1</dd><dt>Seats</dt><dd>4 of 10 used</dd></dl>
      ${formRow('Billed', `<div ${act('billing-period')}>${seg('Billing period', ['Monthly', 'Yearly'], S.plan.annual ? 1 : 0)}</div>`)}
      <div class="card-actions">${btn('primary', `${icon('lightning')}Change plan`, '', act('open', 'data-dialog="app-dlg-plan"'))}${btn('ghost', 'Cancel subscription', '', act('confirm', 'data-confirm="subscription"'))}</div></div>`;
    const limit = `<div class="card"><div class="card-header"><h3>Spending limit</h3></div><p class="text-muted">We warn you before the month's usage passes it.</p>
      <div class="input-group"><span class="input-addon">EUR</span>${field({ label: 'Monthly limit', value: String(S.limit), name: 'limit' })}</div>
      <div class="card-actions">${btn('secondary', 'Save the limit', '', act('save-limit'))}</div></div>`;
    const history = `<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Amount</th><th>Status</th><th class="table-actions"><span class="sr-only">Actions</span></th></tr></thead><tbody>
      ${join(['Oct 1', 'Sep 1', 'Aug 1'].map((d) => `<tr><td>${d}</td><td>${S.plan.price} EUR</td><td><span class="badge badge-success">Paid</span></td><td class="table-actions">${tipBtn('ghost', 'download', `Download the ${d} receipt`, 'btn-sm', act('toast', `data-msg="Receipt for ${d} downloaded (demo)."`), true)}</td></tr>`))}</tbody></table></div>`;
    return join([
      header('Account', 'Billing', 'Your plan, what it costs, and every receipt.'),
      `<div class="grid">${plan}${limit}</div>`,
      `<div class="section-header"><h2>Receipts</h2>${btn('ghost', `${icon('download')}Download all`, 'btn-sm', act('toast', 'data-msg="receipts-2026.zip downloaded (demo)."'))}</div>`, history,
      '<h2>Questions</h2>', `<div class="accordion">${join(FAQ.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${q}</summary><div class="accordion-body">${a}</div></details>`))}</div>`,
    ]);
  }

  Object.assign(window.DS_DEMO_PAGES, { team, reports, settings, billing });
  window.DS_DEMO_KIT.savedBanner = savedBanner;
})();

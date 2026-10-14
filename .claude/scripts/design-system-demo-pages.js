// The page example's seven pages, built from the app's state (design-system-demo-app.js runs them). Every link carries
// data-go (a page) or data-act (an action), so nothing on these pages is a dead end; the test checks that. Text a
// visitor typed (a new project's name) goes through esc(), never in as markup. Sets window.DS_DEMO_PAGES.
(function () {
  const { icon, btn, tipBtn } = window.DS_DEMO_PARTS;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const join = (items) => items.join('');

  const STATUS = {
    review: ['In review', 'badge-info'], progress: ['In progress', 'badge-success'],
    blocked: ['Blocked', 'badge-error'], archived: ['Archived', 'badge-neutral'],
  };
  const INVOICE_STATUS = { paid: ['Paid', 'badge-success'], pending: ['Pending', 'badge-warning'], overdue: ['Overdue', 'badge-error'] };
  const go = (page, label, cls = 'link') => `<a href="#${page}" class="${cls}" data-go="${page}">${label}</a>`;
  const act = (name, attrs = '') => `data-act="${name}" ${attrs}`;
  const badge = ([label, cls]) => `<span class="badge ${cls}">${label}</span>`;

  // `crumb` names the page in the breadcrumb when its heading says something else (Overview greets you).
  const header = (section, title, lead, actions = '', crumb = title) => `
    <ol class="breadcrumb"><li>${go('home', 'Home', '')}</li><li>${go(section === 'Account' ? 'settings' : 'overview', section, '')}</li><li>${crumb}</li></ol>
    <div class="page-header">
      <div class="page-header-text"><h1 tabindex="-1">${title}</h1><p class="text-muted">${lead}</p></div>
      ${actions ? `<div class="page-header-actions">${actions}</div>` : ''}
    </div>`;

  // ---------- Overview ----------
  const projectCard = (p) => `
    <div class="card card-interactive" ${act('edit-project', `data-id="${p.id}"`)}>
      <div>${badge(STATUS[p.status])}</div>
      <div class="card-group"><h3>${esc(p.name)}</h3><div class="card-meta">${icon('clock', 'icon-sm')}<span>Updated ${p.updated} by ${go('team', p.owner)}</span></div></div>
      <div class="card-group"><p class="text-muted">${esc(p.text)}</p><div class="row"><a href="#project" class="link link-action" ${act('edit-project', `data-id="${p.id}"`)}>View details${icon('arrow-circle-right', 'icon-sm')}</a></div></div>
    </div>`;
  // A stat card: label, value, how it moved (in words and with an arrow), and one way in.
  const MOVES = { up: 'arrow-circle-up', down: 'arrow-circle-down', flat: 'arrow-circle-right' };
  const stat = (label, value, [dir, text], extra = '') => `<div class="card"><div class="stat"><span class="stat-label">${label}</span><span class="stat-value">${value}</span>
      <span class="stat-delta${dir === 'flat' ? '' : ` is-${dir}`}">${icon(MOVES[dir], 'icon-sm')}${text}</span></div>${extra}</div>`;
  const sectionHeader = (title, action) => `<div class="section-header"><h2>${title}</h2>${action}</div>`;

  function overview(S) {
    const live = S.projects.filter((p) => p.status !== 'archived');
    const overdue = S.invoices.filter((i) => i.status === 'overdue').length;
    return join([
      header('Workspace', 'Good morning, Alex', `${live.length} projects are moving and ${overdue} invoices need a nudge. Here is the week at a glance.`,
        btn('secondary', `${icon('user-plus')}Invite teammate`, '', act('open', 'data-dialog="app-dlg-invite"')) + btn('primary', `${icon('plus-circle')}New project`, '', act('new-project')), 'Overview'),
      `<div class="alert" role="status">${icon('info')}<div class="alert-body"><span class="alert-title">New version available</span><span>Reports now export to PDF. <a href="#news" class="link" ${act('toast', 'data-msg="Release notes are a demo — nothing to read yet."')}>See what's new</a></span></div></div>`,
      `<div class="grid grid-3">${stat('Active projects', live.length, ['up', '1 more than last week'])}
        ${stat('Open invoices', overdue + S.invoices.filter((i) => i.status === 'pending').length, ['down', `${overdue} of them overdue`])}
        ${stat('Budget used', '65%', ['flat', 'On plan for October'], '<div class="progress" role="progressbar" aria-label="Budget used" aria-valuenow="65" aria-valuemin="0" aria-valuemax="100" style="--value:65%"><span></span></div>')}</div>`,
      sectionHeader('Recent projects', go('projects', `See all projects${icon('arrow-circle-right', 'icon-sm')}`, 'link link-action')),
      `<div class="grid grid-3">${join(live.slice(0, 3).map(projectCard))}</div>`,
      sectionHeader('Activity', `<div class="row"><div class="avatar-group">${join(S.team.slice(0, 3).map((m) => `<span class="avatar avatar-sm">${m.initials}</span>`))}</div>${go('team', 'See the team', 'link link-action')}</div>`),
      `<ul class="list">${join(S.activity.map((a) => `<li class="list-item"><span class="avatar">${a.initials}</span><div class="list-item-main"><span>${go('team', a.who, 'link link-quiet')} ${a.what}</span><span class="list-item-meta">${a.when}</span></div></li>`))}</ul>`,
    ]);
  }

  // ---------- Projects ----------
  const TABS = [['active', 'Active'], ['review', 'In review'], ['archived', 'Archived']];
  const inTab = (tab) => (p) => (tab === 'active' ? p.status !== 'archived' : p.status === tab);
  const projectRow = (p) => `<tr><td>${esc(p.name)}</td><td>${go('team', p.owner)}</td><td>${badge(STATUS[p.status])}</td><td class="table-actions"><div class="row-actions">
    ${tipBtn('ghost', 'pencil-circle', `Edit ${esc(p.name)}`, 'btn-sm', act('edit-project', `data-id="${p.id}"`))}
    ${tipBtn('ghost', 'share-fat', `Share ${esc(p.name)}`, 'btn-sm', act('toast', 'data-msg="Link copied to the clipboard."'))}
    ${tipBtn('ghost', 'trash', `Delete ${esc(p.name)}`, 'btn-sm is-danger', act('delete-project', `data-id="${p.id}"`), true)}</div></td></tr>`;
  const projectsEmpty = () => `<div class="empty"><div class="empty-icon" aria-hidden="true">${icon('tray', 'icon-lg')}</div><h3>Nothing here yet</h3><p>No project is in this list right now.</p>${btn('primary', 'New project', '', act('new-project'))}</div>`;
  const moreMenu = `<div class="menu" role="menu" popover id="app-menu-projects">
      <button class="menu-item" role="menuitem" ${act('toast', 'data-msg="projects.csv is ready (demo)."')}><span class="menu-item-label">${icon('download')}Export as CSV</span></button>
      <button class="menu-item" role="menuitem" ${act('toast', 'data-msg="Link copied to the clipboard."')}><span class="menu-item-label">${icon('link')}Copy link</span><span class="text-muted text-small">Ctrl L</span></button>
      <div class="menu-separator"></div>
      <button class="menu-item" role="menuitem" disabled><span class="menu-item-label">${icon('archive')}Archive finished <span class="reason">— none finished</span></span></button>
    </div>`;

  function projects(S) {
    const shown = S.projects.filter(inTab(S.tab));
    const count = (tab) => S.projects.filter(inTab(tab)).length;
    return join([
      header('Workspace', 'Projects', `${count('active')} projects in the works, ${count('review')} waiting for review. Click a card or a row to see a project.`,
        tipBtn('ghost', 'dots-three-circle', 'More actions', '', `aria-haspopup="menu" ${act('menu', 'data-menu="app-menu-projects"')}`) + btn('primary', `${icon('plus-circle')}New project`, '', act('new-project'))),
      moreMenu,
      `<div class="alert alert-warning" role="alert">${icon('warning')}<div class="alert-body"><span class="alert-title">Invoice overdue</span><span>Invoice #1042 for Globex is 5 days past due. <a href="#remind" class="link" ${act('toast', 'data-msg="Reminder sent to Globex."')}>Send a reminder</a></span></div></div>`,
      `<div class="tabs" role="tablist" aria-label="Project lists">${join(TABS.map(([k, label]) => `<button class="tab${S.tab === k ? ' is-active' : ''}" role="tab" aria-selected="${S.tab === k}" ${act('tab', `data-tab="${k}"`)}>${label} <span class="badge badge-neutral badge-count">${count(k)}</span></button>`))}</div>`,
      shown.length ? `<div class="grid">${join(shown.map(projectCard))}</div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Project</th><th>Owner</th><th>Status</th><th class="table-actions"><span class="sr-only">Actions</span></th></tr></thead><tbody>${join(shown.map(projectRow))}</tbody></table></div>` : projectsEmpty(),
    ]);
  }

  // ---------- Invoices ----------
  const PER_PAGE = 4;
  const invoiceMatches = (f) => (i) => (f.status === 'Any' || INVOICE_STATUS[i.status][0] === f.status) && (!f.overdueOnly || i.status === 'overdue');
  const invoiceRow = (i) => `<tr><td>#${i.no}</td><td>${i.client}</td><td>${i.amount}</td><td>${i.due}</td><td>${badge(INVOICE_STATUS[i.status])}</td><td class="table-actions"><div class="row-actions">
    ${tipBtn('ghost', 'bell', `Send a reminder for #${i.no}`, 'btn-sm', i.status === 'paid' ? 'disabled' : act('toast', `data-msg="Reminder sent for invoice #${i.no}."`))}
    ${tipBtn('ghost', 'download', `Download #${i.no}`, 'btn-sm', act('toast', `data-msg="invoice-${i.no}.pdf downloaded (demo)."`), true)}</div></td></tr>`;
  const filterTags = (f) => join([
    f.status !== 'Any' ? `<span class="tag">Status: ${f.status}<button class="tag-remove" aria-label="Remove the status filter" ${act('clear-filter', 'data-filter="status"')}>&times;</button></span>` : '',
    f.overdueOnly ? `<span class="tag">Only overdue<button class="tag-remove" aria-label="Remove the overdue filter" ${act('clear-filter', 'data-filter="overdueOnly"')}>&times;</button></span>` : '',
  ]);
  const pagination = (page, pages) => `<div class="pagination" role="navigation" aria-label="Invoice pages">
    <button class="page" aria-label="Previous page" ${page === 1 ? 'disabled' : act('page', `data-page="${page - 1}"`)}>&lsaquo;</button>
    ${join(Array.from({ length: pages }, (_, n) => `<button class="page${n + 1 === page ? ' is-active' : ''}" ${n + 1 === page ? 'aria-current="page"' : ''} ${act('page', `data-page="${n + 1}"`)}>${n + 1}</button>`))}
    <button class="page" aria-label="Next page" ${page === pages ? 'disabled' : act('page', `data-page="${page + 1}"`)}>&rsaquo;</button></div>`;

  function invoices(S) {
    const all = S.invoices.filter(invoiceMatches(S.filters));
    const pages = Math.max(1, Math.ceil(all.length / PER_PAGE));
    const page = Math.min(S.invoicePage, pages);
    const rows = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const tags = filterTags(S.filters);
    return join([
      header('Workspace', 'Invoices', 'What clients owe, what is paid, and what is late. Filter the list or send a reminder from a row.',
        btn('secondary', `${icon('funnel')}Filters`, '', act('open', 'data-dialog="app-drawer-filters"')) + btn('primary', `${icon('download')}Export`, '', act('toast', 'data-msg="invoices.csv is ready (demo)."'))),
      tags ? `<div class="row">${tags}</div>` : '',
      all.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Invoice</th><th>Client</th><th>Amount</th><th>Due</th><th>Status</th><th class="table-actions"><span class="sr-only">Actions</span></th></tr></thead><tbody>${join(rows.map(invoiceRow))}</tbody></table></div>
        <div class="section-header"><span class="text-small text-muted">${all.length} invoices · page ${page} of ${pages}</span>${pagination(page, pages)}</div>`
        : `<div class="empty"><div class="empty-icon" aria-hidden="true">${icon('receipt', 'icon-lg')}</div><h3>No invoice matches</h3><p>Nothing fits these filters.</p>${btn('secondary', 'Reset filters', '', act('reset-filters'))}</div>`,
    ]);
  }

  window.DS_DEMO_PAGES = { overview, projects, invoices };
  window.DS_DEMO_KIT = { esc, go, act, badge, header, STATUS, INVOICE_STATUS, PER_PAGE };
})();

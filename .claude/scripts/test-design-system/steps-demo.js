// The page example is a working app (design-system-demo-app.js): every page is visited, every link and button must
// lead somewhere, and each kind of interaction is tried for real — dialogs and their validation, the confirm before a
// delete, the menu, the drawer, pagination, the loading state, the Settings save. Plus the configurator's panel can be
// hidden and shown again.
const { pageContrastScan, pageInnerOverflow, pageOverflow } = require('./page-checks.js');

const PAGES = ['home', 'overview', 'projects', 'invoices', 'team', 'reports', 'settings', 'billing'];
const PHONE_WIDTH = 420;
const DESKTOP = { width: 1440, height: 900 };

// Runs in the page: links and buttons in the app that don't lead anywhere. Self-contained (serialised by the runner).
function pageDeadEnds() {
  const app = document.getElementById('demo-app');
  const pages = ['home', 'overview', 'projects', 'invoices', 'team', 'reports', 'settings', 'billing'];
  const handled = '[data-go], [data-act], .navbar-toggle, .segmented > button, form button, .info-tip';
  const out = [];
  const live = (el) => !el.closest('[inert]');   // the hero's collage is a picture of components, not controls
  app.querySelectorAll('a').forEach((a) => {
    if (!live(a)) return;
    if (a.dataset.go && !pages.includes(a.dataset.go)) out.push(`link to a missing page: ${a.dataset.go}`);
    if (!a.dataset.go && !a.dataset.act) out.push(`dead link: "${a.textContent.trim().slice(0, 30)}"`);
  });
  // Only design system classes on the example site: a demo-* class means a component is missing (report it, add it).
  [...new Set([...app.querySelectorAll('[class]')].flatMap((el) => [...el.classList]).filter((c) => c.startsWith('demo-')))].forEach((c) => out.push(`a demo-only class instead of a component: .${c}`));
  app.querySelectorAll('button:not(:disabled)').forEach((b) => {
    if (!live(b)) return;
    if (!b.matches(handled)) out.push(`button that does nothing: "${(b.textContent.trim() || b.getAttribute('aria-label') || '').slice(0, 30)}"`);
  });
  return out;
}

async function visit(t, page) {
  await t.ev(`document.querySelector('#demo-app [data-go=${page}]').click(), 1`);
  await t.sleep(150);
}

async function checkEveryPage(t) {
  const notes = [];
  for (const page of PAGES) {
    await visit(t, page);
    const layout = await t.ev(`JSON.stringify({ here: document.querySelector('#demo-app .sidebar-item.is-active')?.dataset.go || null, sidebar: getComputedStyle(document.querySelector('#demo-app .sidebar')).display })`).then(JSON.parse);
    if (page === 'home' && layout.sidebar !== 'none') t.bad('demo app', 'home: the site page shows the app sidebar');
    if (page !== 'home' && layout.here !== page) t.bad('demo app', `${page}: the sidebar marks ${layout.here} as current`);
    (await t.fn(pageDeadEnds)).forEach((m) => t.bad('demo app', `${page}: ${m}`));
    const c = await t.fn(pageContrastScan, '#demo-app');
    c.fails.slice(0, 3).forEach((f) => t.bad('demo app', `${page}: contrast ${f.ratio}:1 on ${f.tag} "${f.text}" (needs ${f.need})`));
    (await t.fn(pageInnerOverflow)).forEach((m) => t.bad('demo app', `${page}: spills out: ${m}`));
    const empty = await t.ev(`[...document.querySelectorAll('#demo-app svg[data-icon]')].filter((s) => !s.firstChild).map((s) => s.dataset.icon).join(', ')`);
    if (empty) t.bad('demo app', `${page}: icons that did not render: ${empty}`);
    notes.push(`${page} ${c.checked}`);
  }
  t.note(`demo app pages (text elements checked): ${notes.join(', ')}`);
}

async function checkPhoneWidth(t) {
  await t.viewport(PHONE_WIDTH, DESKTOP.height);
  for (const page of PAGES) {
    await visit(t, page);
    const o = await t.fn(pageOverflow);
    if (o.pageOverflow > 1) t.bad('demo app', `${PHONE_WIDTH}px ${page}: the page scrolls sideways by ${o.pageOverflow}px`);
    if (o.previewOverflow.length) t.bad('demo app', `${PHONE_WIDTH}px ${page}: past the preview edge: ${o.previewOverflow.join(', ')}`);
  }
  await t.viewport(DESKTOP.width, DESKTOP.height);
}

// Each interaction returns true when it behaved; the names say what was expected.
const INTERACTIONS = `(async () => {
  const q = (s) => document.querySelector('#demo-app ' + s), qa = (s) => document.querySelectorAll('#demo-app ' + s);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms)), go = async (p) => { q('.sidebar [data-go=' + p + ']').click(); await wait(100); };
  const out = {};
  await go('projects');
  const cards = qa('#app-main .card-interactive').length;
  q('[data-act=new-project]').click(); await wait(50);
  const dlg = q('#app-dlg-project'); dlg.querySelector('button[value=ok]').click(); await wait(50);
  out.emptyNameStopsTheDialog = dlg.open && !!dlg.querySelector('.field-group.has-error');
  dlg.querySelector('input[name=name]').value = 'Test <b>project</b>'; dlg.querySelector('button[value=ok]').click(); await wait(100);
  out.createAddsACard = !dlg.open && qa('#app-main .card-interactive').length === cards + 1;
  out.typedTextIsNotMarkup = !q('#app-main h3 b') && [...qa('#app-main h3')].some((h) => h.textContent === 'Test <b>project</b>');
  out.toastShows = q('#app-toasts').matches(':popover-open') && !!q('#app-toasts .toast');
  const rows = qa('#app-main tbody tr').length;
  q('#app-main [data-act=delete-project]').click(); await wait(50);
  const confirm = q('#app-dlg-confirm'); out.deleteAsksFirst = confirm.open && confirm.matches(':modal');
  confirm.querySelector('button[value=ok]').click(); await wait(100);
  out.deleteRemovesTheRow = qa('#app-main tbody tr').length === rows - 1;
  q('[data-act=tab][data-tab=archived]').click(); await wait(50);
  out.tabsFilter = [...qa('#app-main tbody .badge')].every((b) => b.textContent === 'Archived');
  q('[data-act=menu][data-menu=app-menu-projects]').click(); await wait(50);
  out.menuOpens = q('#app-menu-projects').matches(':popover-open');
  q('#app-menu-projects [data-act=toast]').click(); await wait(50);
  out.menuClosesOnAChoice = !q('#app-menu-projects').matches(':popover-open');
  return out; })()`;

const INTERACTIONS_2 = `(async () => {
  const q = (s) => document.querySelector('#demo-app ' + s), qa = (s) => document.querySelectorAll('#demo-app ' + s);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms)), go = async (p) => { q('.sidebar [data-go=' + p + ']').click(); await wait(100); };
  const out = {};
  await go('invoices');
  const first = q('#app-main tbody td').textContent;
  q('[data-act=page][data-page="2"]').click(); await wait(50);
  out.paginationTurns = q('#app-main tbody td').textContent !== first;
  q('[data-dialog=app-drawer-filters]').click(); await wait(50);
  const drawer = q('#app-drawer-filters'); out.drawerOpens = drawer.open && drawer.matches(':modal');
  drawer.querySelector('select[name=status]').value = 'Overdue'; drawer.querySelector('button[value=ok]').click(); await wait(100);
  out.filterApplies = !drawer.open && [...qa('#app-main tbody .badge')].every((b) => b.textContent === 'Overdue');
  q('[data-act=clear-filter]').click(); await wait(50);
  out.filterTagClears = !q('[data-act=clear-filter]');
  await go('team');
  const tipped = q('#app-main .has-tooltip button'), bubble = () => getComputedStyle(tipped.nextElementSibling).visibility;
  tipped.focus({ focusVisible: true }); await wait(250); out.tooltipOnKeyboardFocus = bubble() === 'visible';
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await wait(250); out.tooltipEscCloses = bubble() === 'hidden';
  tipped.blur();
  q('#app-main [data-act=popover]').click(); await wait(50);
  out.popoverOpens = !!document.querySelector('#demo-app .popover:popover-open');
  document.querySelector('#demo-app .popover:popover-open')?.hidePopover();
  await go('reports');
  [...qa('[data-act=period] button')].find((b) => b.textContent === 'Quarter').click(); await wait(50);
  out.periodShowsLoading = !!q('#app-main .skeleton') && !!q('#app-main .spinner');
  await wait(900); out.periodLoads = q('#app-main .stat-value').textContent === '1730';
  return out; })()`;

const INTERACTIONS_3 = `(async () => {
  const q = (s) => document.querySelector('#demo-app ' + s);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms)), go = async (p) => { q('.sidebar [data-go=' + p + ']').click(); await wait(100); };
  const out = {};
  await go('settings');
  q('input[name=name]').value = ''; q('#app-settings button[type=submit]').click(); await wait(50);
  out.saveShowsItIsWorking = q('#app-settings button[type=submit]').classList.contains('is-loading');
  await wait(800); out.emptyNameIsRefused = !!q('#app-settings-result .alert-error') && !!q('#app-settings .field-group.has-error');
  q('input[name=name]').value = 'Alex M.'; q('input[name=name]').dispatchEvent(new Event('input', { bubbles: true }));
  out.fixedFieldClears = !q('#app-settings .field-group.has-error');
  q('#app-settings button[type=submit]').click(); await wait(900); out.saveSucceeds = !!q('#app-settings-result .alert-success');
  await go('billing');
  [...document.querySelectorAll('#demo-app [data-act=billing-period] button')].find((b) => b.textContent === 'Yearly').click(); await wait(50);
  out.yearlyBillingApplies = q('#app-main .card .dl dd').textContent.startsWith('290') && q('[data-act=billing-period] [aria-pressed=true]').textContent === 'Yearly';
  q('[data-dialog=app-dlg-plan]').click(); await wait(50);
  const plan = q('#app-dlg-plan'); plan.querySelector('input[value=Business]').checked = true; plan.querySelector('button[value=ok]').click(); await wait(100);
  out.planChanges = !plan.open && q('#app-main .card h3').textContent === 'Business';
  q('[data-act=legal][data-doc=terms]').click(); await wait(50);
  out.footerLinkOpens = q('#app-dlg-legal').open && q('#app-dlg-legal-title').textContent === 'Terms';
  q('#app-dlg-legal button[value=ok]').click(); await wait(50);
  q('[data-act=menu][data-menu=app-menu-account]').click(); await wait(50);
  q('#app-menu-account [data-go=settings]').click(); await wait(100);
  out.accountMenuNavigates = q('#app-main h1').textContent === 'Settings' && !q('#app-menu-account').matches(':popover-open');
  return out; })()`;

async function checkInteractions(t) {
  const results = {};
  for (const script of [INTERACTIONS, INTERACTIONS_2, INTERACTIONS_3]) Object.assign(results, await t.ev(script));
  Object.entries(results).forEach(([k, v]) => { if (v !== true) t.bad('demo app', `${k}: ${v}`); });
  t.note(`demo app interactions: ${Object.keys(results).length} tried, ${Object.values(results).filter((v) => v === true).length} behaved`);
}

async function checkPanelToggle(t) {
  const r = await t.ev(`(async () => {
    const wait = (ms) => new Promise((ok) => setTimeout(ok, ms)), panel = document.getElementById('cfg-panel'), out = {};
    document.getElementById('panel-hide').click(); await wait(50);
    out.hides = getComputedStyle(panel).display === 'none' && !document.getElementById('panel-show').hidden;
    out.previewTakesTheWidth = document.getElementById('preview').getBoundingClientRect().left < 100;
    document.getElementById('panel-show').click(); await wait(50);
    out.showsAgain = getComputedStyle(panel).display !== 'none' && document.getElementById('panel-show').hidden;
    return out; })()`);
  Object.entries(r).forEach(([k, v]) => { if (v !== true) t.bad('panel', `${k}: ${v}`); });
  t.note(`configurator panel: hides and shows — ${JSON.stringify(r)}`);
}

async function checkDemoApp(t) {
  await t.click('.cfg-tab[data-view=page]');
  await t.sleep(200);
  await checkEveryPage(t);
  await checkInteractions(t);
  await checkPhoneWidth(t);
  await checkPanelToggle(t);
  await visit(t, 'projects');
}

module.exports = { checkDemoApp };

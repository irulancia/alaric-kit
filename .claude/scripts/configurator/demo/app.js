// Runs the page example as a small working app: the pages (configurator/demo/pages-*.js), the frame and its dialogs
// (configurator/demo/data.js). Every link has data-go (a page) or data-act (an action, below), so nothing is a dead
// end. The components stay CSS only; this file is the "app" a project would write, kept to plain DOM. The state lives
// in memory, so a reload starts clean; only the page you were on is remembered. Sets window.dsDemoApp.
(function () {
  const PAGE_KEY = 'ds-demo-page';
  const TOAST_MS = 4000;
  const LOADING_MS = 700;
  const SAVING_MS = 600;
  const MENU_GAP_PX = 4;            // between a button and the menu it opens
  const REOPEN_GUARD_MS = 150;      // a click on the trigger of a just light-dismissed menu shouldn't reopen it
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const PROJECT_STATUS = { 'In progress': 'progress', 'In review': 'review', Blocked: 'blocked', Archived: 'archived' };

  let root = null;
  let iconStyle = () => 'outline';
  let pendingConfirm = null;
  let editingId = null;
  const closedAt = new WeakMap();
  const fresh = () => JSON.parse(JSON.stringify(window.DS_DEMO_DATA));
  const S = {
    ...fresh(), page: 'home', tab: 'active', invoicePage: 1, filters: { status: 'Any', overdueOnly: false },
    period: 'Month', loading: false, saved: null, limit: 500, plan: { name: 'Pro', price: 29, annual: false },
  };

  const $ = (sel) => root.querySelector(sel);
  const hydrate = (el) => window.dsHydrateIcons(el, iconStyle());

  // ---------- pages ----------
  function render() {
    const main = $('#app-main');
    main.innerHTML = window.DS_DEMO_PAGES[S.page](S); // trusted-static: page templates; visitor text goes through esc()
    // Home is a site page (no sidebar, the site's links); the rest are app pages.
    root.dataset.layout = S.page === 'home' ? 'site' : 'app';
    root.querySelectorAll('.navbar-links[data-layout], footer[data-layout]').forEach((l) => { l.hidden = l.dataset.layout !== root.dataset.layout; });
    root.querySelectorAll('[data-go]').forEach((a) => {
      const here = a.dataset.go === S.page && !a.closest('#app-main, .menu, .breadcrumb') && !a.matches('.navbar-brand, .btn');
      a.classList.toggle('is-active', here);
      if (here) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    root.querySelectorAll('[data-count=overdue]').forEach((b) => { b.textContent = S.invoices.filter((i) => i.status === 'overdue').length; });
    hydrate(root);
  }

  function goTo(page) {
    if (!window.DS_DEMO_PAGES[page]) return;
    S.page = page;
    S.saved = null;
    root.querySelector('.navbar').classList.remove('is-open');
    root.querySelector('.navbar-toggle').setAttribute('aria-expanded', 'false');
    render();
    try { localStorage.setItem(PAGE_KEY, page); } catch (e) { /* remembering the page is a convenience */ }
    if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: 'start' });
    $('#app-main h1')?.focus({ preventScroll: true });
  }

  // ---------- toasts, menus, popovers ----------
  function svgIcon(name, cls = 'icon') {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', cls);
    svg.setAttribute('viewBox', '0 0 256 256');
    svg.setAttribute('aria-hidden', 'true');
    svg.dataset.icon = name;
    return svg;
  }

  function toast(message, kind = 'success') {
    const region = $('#app-toasts');
    const box = document.createElement('div');
    box.className = `toast toast-${kind}`;
    box.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    const body = document.createElement('div');
    body.className = 'alert-body';
    const title = document.createElement('span');
    title.className = 'alert-title';
    title.textContent = message;   // textContent: a message can carry a name the visitor typed
    body.append(title);
    const close = document.createElement('button');
    close.className = 'toast-close';
    close.setAttribute('aria-label', 'Dismiss');
    close.dataset.act = 'dismiss-toast';
    close.textContent = '×';
    box.append(svgIcon(kind === 'error' ? 'x-circle' : 'check-circle'), body, close);
    region.append(box);
    hydrate(box);
    if (!region.matches(':popover-open')) region.showPopover();
    setTimeout(() => dismissToast(box), TOAST_MS);
  }

  function dismissToast(box) {
    const region = box.parentElement;
    box.remove();
    if (region && !region.children.length && region.matches(':popover-open')) region.hidePopover();
  }

  // A menu or popover in the top layer (above the table's scroll box), placed under its trigger, end-aligned.
  function openNear(el, trigger) {
    if (el.matches(':popover-open')) { el.hidePopover(); return; }
    if (Date.now() - (closedAt.get(el) || 0) < REOPEN_GUARD_MS) return;
    el.showPopover();
    const r = trigger.getBoundingClientRect();
    el.style.top = `${r.bottom + MENU_GAP_PX}px`;
    el.style.left = `${Math.max(MENU_GAP_PX, Math.min(r.right - el.offsetWidth, window.innerWidth - el.offsetWidth - MENU_GAP_PX))}px`;
    el.querySelector('.menu-item:not(:disabled), button, a')?.focus();
  }

  // ---------- forms ----------
  function setMessage(group, text, isError) {
    const msg = group.querySelector('.field-msg');
    group.classList.toggle('has-error', isError);
    msg.replaceChildren(...(isError ? [svgIcon('x-circle', 'icon icon-sm'), text] : [msg.dataset.hint || '']));
    hydrate(msg);
  }

  function errorFor(input) {
    const label = input.labels?.[0]?.textContent || 'This field';
    if (!input.value.trim()) return `${label} can't be empty.`;
    if (input.type === 'email') return 'Enter a full address, like name@company.com.';
    return `Check ${label.toLowerCase()}.`;
  }

  // Marks every required field in `form`; returns true when all are fine. The first wrong one gets the focus.
  function validate(form) {
    let first = null;
    form.querySelectorAll('input[required], textarea[required]').forEach((input) => {
      const ok = input.value.trim() !== '' && input.checkValidity();
      setMessage(input.closest('.field-group'), ok ? '' : errorFor(input), !ok);
      if (!ok && !first) first = input;
    });
    first?.focus();
    return !first;
  }

  function resetForm(form) {
    form.reset();
    form.querySelectorAll('.field-group.has-error').forEach((g) => setMessage(g, '', false));
  }

  window.DS_DEMO_APP_PARTS = { S, $, render, goTo, toast, dismissToast, openNear, validate, resetForm, setMessage, hydrate, PROJECT_STATUS, LOADING_MS, SAVING_MS, closedAt };
  window.dsDemoApp = {
    mount(el, getIconStyle) {
      root = el;
      iconStyle = getIconStyle;
      root.innerHTML = window.DS_DEMO_FRAME; // trusted-static: the frame is a fixed template from configurator/demo/data.js
      try { const saved = localStorage.getItem(PAGE_KEY); if (window.DS_DEMO_PAGES[saved]) S.page = saved; } catch (e) { /* start on Home */ }
      root.querySelectorAll('[popover]').forEach((p) => p.addEventListener('toggle', (e) => { if (e.newState === 'closed') closedAt.set(p, Date.now()); }));
      window.dsDemoActions.wire(root);
      render();
    },
    set editing(id) { editingId = id; },
    get editing() { return editingId; },
    set confirmThen(fn) { pendingConfirm = fn; },
    get confirmThen() { return pendingConfirm; },
  };
})();

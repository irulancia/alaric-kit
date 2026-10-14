// What each data-act in the page example does, and what each of its forms does when sent. design-system-demo-app.js
// holds the state and the helpers; this file only answers clicks and submits. Sets window.dsDemoActions.
(function () {
  const A = () => window.DS_DEMO_APP_PARTS;
  const app = () => window.dsDemoApp;
  const byId = (id) => A().$(`#${id}`);
  const project = (id) => A().S.projects.find((p) => p.id === id);
  const statusLabel = (key) => Object.keys(A().PROJECT_STATUS).find((k) => A().PROJECT_STATUS[k] === key);

  function openProject(id) {
    const dlg = byId('app-dlg-project');
    const form = dlg.querySelector('form');
    A().resetForm(form);
    const p = id ? project(id) : null;
    app().editing = p ? p.id : null;
    byId('app-dlg-project-title').textContent = p ? 'Edit project' : 'New project';
    dlg.querySelector('button[value=ok]').textContent = p ? 'Save changes' : 'Create project';
    if (p) {
      form.elements.name.value = p.name;
      form.elements.client.value = p.client;
      form.elements.status.value = statusLabel(p.status);
      form.elements.budget.value = p.budget;
      form.elements.text.value = p.text;
    }
    dlg.showModal();
  }

  function confirm(title, text, label, then) {
    byId('app-dlg-confirm-title').textContent = title;
    byId('app-dlg-confirm-text').textContent = text;
    byId('app-dlg-confirm').querySelector('button[value=ok]').textContent = label;
    app().confirmThen = then;
    byId('app-dlg-confirm').showModal();
  }

  const CONFIRMS = {
    workspace: ['Delete the workspace?', 'Every project and invoice in Acme goes with it. This cannot be undone.', 'Delete workspace', () => A().toast('The workspace would be gone now — this is a demo, so it is still here.', 'error')],
    subscription: ['Cancel the subscription?', 'Projects stay readable for 30 days, then the workspace is deleted.', 'Cancel subscription', () => A().toast('Subscription cancelled (demo).')],
  };

  function deleteProject(id) {
    const p = project(id);
    confirm('Delete this project?', `"${p.name}" and its invoices are removed. This cannot be undone.`, 'Delete project', () => {
      A().S.projects = A().S.projects.filter((x) => x.id !== id);
      A().render();
      A().toast(`Deleted "${p.name}".`);
    });
  }

  function choosePeriod(target) {
    const b = target.closest('.segmented > button');
    if (!b || b.disabled || b.textContent === A().S.period) return;
    Object.assign(A().S, { period: b.textContent, loading: true });
    A().render();
    setTimeout(() => { A().S.loading = false; A().render(); }, A().LOADING_MS);
  }

  function showLegal(doc) {
    const [title, html] = A().S.legal[doc];
    byId('app-dlg-legal-title').textContent = title;
    byId('app-dlg-legal-text').innerHTML = html; // trusted-static: fixed text from design-system-demo-data.js
    byId('app-dlg-legal').showModal();
  }

  function saveLimit() {
    const input = A().$('#app-main input[name=limit]');
    const value = Number(input.value.replace(/[^\d.]/g, ''));
    const group = input.closest('.field-group') || input.closest('.input-group');
    if (!value) { input.focus(); A().toast('Enter a limit above 0 EUR.', 'error'); return; }
    A().S.limit = value;
    if (group) group.classList.remove('has-error');
    A().toast(`Spending limit set to ${value} EUR.`);
  }

  // data-act name → what it does. `el` is the element carrying data-act, `e` the click.
  const ACTIONS = {
    open: (el) => byId(el.dataset.dialog).showModal(),
    scroll: (el) => byId(el.dataset.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    'new-project': () => openProject(null),
    'edit-project': (el) => openProject(el.dataset.id),
    'delete-project': (el) => deleteProject(el.dataset.id),
    confirm: (el) => confirm(...CONFIRMS[el.dataset.confirm]),
    toast: (el) => A().toast(el.dataset.msg),
    'dismiss-toast': (el) => A().dismissToast(el.closest('.toast')),
    tab: (el) => { A().S.tab = el.dataset.tab; A().render(); },
    menu: (el) => A().openNear(byId(el.dataset.menu), el),
    popover: (el) => A().openNear(byId(el.dataset.pop), el),
    page: (el) => { A().S.invoicePage = Number(el.dataset.page); A().render(); },
    'clear-filter': (el) => { A().S.filters = { ...A().S.filters, [el.dataset.filter]: el.dataset.filter === 'status' ? 'Any' : false }; A().render(); },
    'reset-filters': () => { A().S.filters = { status: 'Any', overdueOnly: false }; A().render(); },
    period: (el, e) => choosePeriod(e.target),
    'billing-period': (el, e) => {
      const b = e.target.closest('.segmented > button');
      if (!b) return;
      A().S.plan = { ...A().S.plan, annual: b.textContent === 'Yearly' };
      A().render();
    },
    'save-limit': saveLimit,
    'discard-settings': () => { A().S.saved = null; A().render(); A().toast('Changes discarded.'); },
    legal: (el) => showLegal(el.dataset.doc),
  };

  function onClick(e) {
    const el = e.target.closest('[data-go], [data-act]');
    if (!el || el.disabled) return;
    const inMenu = el.closest('.menu[popover]');
    if (el.matches('a')) e.preventDefault();
    if (el.dataset.go) {
      el.closest('dialog[open]')?.close();   // "Open the app" in a dialog: the dialog goes, the page changes
      A().goTo(el.dataset.go);
    } else ACTIONS[el.dataset.act]?.(el, e);
    if (inMenu && inMenu.matches(':popover-open')) inMenu.hidePopover();
  }

  window.dsDemoActions = { wire(root) { root.addEventListener('click', onClick); window.dsDemoForms.wire(root); } };
})();

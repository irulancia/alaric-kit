// What each form in the page example does when sent: the dialogs' forms (method="dialog": a valid send closes the
// dialog on its own; an invalid one is stopped and marked) and the Settings page. Sets window.dsDemoForms.
(function () {
  const A = () => window.DS_DEMO_APP_PARTS;
  const app = () => window.dsDemoApp;
  const value = (form, name) => form.elements[name]?.value.trim() || '';
  const checked = (form, name) => form.querySelector(`input[name="${name}"]:checked`)?.value || '';

  function saveProject(form) {
    const S = A().S;
    const fields = {
      name: value(form, 'name'), client: value(form, 'client'), status: A().PROJECT_STATUS[value(form, 'status')],
      budget: Number(value(form, 'budget').replace(/[^\d]/g, '')) || 0, text: value(form, 'text') || 'No description yet.',
    };
    const id = app().editing;
    if (id) {
      S.projects = S.projects.map((p) => (p.id === id ? { ...p, ...fields, updated: 'just now' } : p));
      A().toast(`Saved "${fields.name}".`);
    } else {
      S.projects = [{ id: `p${Date.now()}`, owner: 'Alex Morgan', updated: 'just now', done: 0, ...fields }, ...S.projects];
      A().toast(`Created "${fields.name}"${form.elements.notify.checked ? ' — the team was told' : ''}.`);
    }
    S.tab = fields.status === 'archived' ? 'archived' : fields.status === 'review' ? 'review' : 'active';
    if (S.page === 'projects') A().render(); else A().goTo('projects');
  }

  // Dialog form id → what a valid send does.
  const SENDS = {
    'app-dlg-project': saveProject,
    'app-dlg-invite': (form) => A().toast(`Invite sent to ${value(form, 'email')} as ${checked(form, 'app-role')}.`),
    'app-dlg-plan': (form) => {
      const name = checked(form, 'app-plan');
      A().S.plan = { ...A().S.plan, name, price: A().S.plans[name] };
      A().render();
      A().toast(`You are on ${name} now.`);
    },
    'app-dlg-contact': (form) => { A().toast(`Sent: "${value(form, 'subject')}". We answer within a day.`); A().resetForm(form); },
    'app-dlg-confirm': () => { const then = app().confirmThen; app().confirmThen = null; then?.(); },
    'app-drawer-filters': (form) => {
      A().S.filters = { status: value(form, 'status'), overdueOnly: form.elements.overdueOnly.checked };
      A().S.invoicePage = 1;
      A().render();
    },
  };

  function onDialogSubmit(e, dialog) {
    const form = e.target;
    const how = e.submitter?.value;
    if (how === 'cancel') return;
    if (how === 'reset' && dialog.id === 'app-drawer-filters') {
      form.reset();
      A().S.filters = { status: 'Any', overdueOnly: false };
      A().render();
      return;
    }
    if (!A().validate(form)) { e.preventDefault(); return; }
    SENDS[dialog.id]?.(form);
  }

  // Settings: the button shows it is working, then the fields are checked and the result shown at the top.
  function onSettingsSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const save = form.querySelector('button[type=submit]');
    save.classList.add('is-loading');
    save.disabled = true;
    setTimeout(() => {
      save.classList.remove('is-loading');
      save.disabled = false;
      const ok = A().validate(form);
      if (ok) A().S.profile = { name: value(form, 'name'), email: value(form, 'email'), bio: value(form, 'bio') };
      const slot = A().$('#app-settings-result');
      slot.innerHTML = window.DS_DEMO_KIT.savedBanner(ok ? 'ok' : 'error'); // trusted-static: a fixed banner template
      A().hydrate(slot);
      slot.scrollIntoView({ block: 'nearest' });
    }, A().SAVING_MS);
  }

  function onSubmit(e) {
    const dialog = e.target.closest('dialog');
    if (dialog) onDialogSubmit(e, dialog);
    else if (e.target.id === 'app-settings') onSettingsSubmit(e);
  }

  // A field that was marked wrong clears as soon as it is fixed.
  function onInput(e) {
    const input = e.target;
    const group = input.closest('.field-group.has-error');
    if (group && input.required && input.value.trim() && input.checkValidity()) A().setMessage(group, '', false);
  }

  window.dsDemoForms = { wire(root) { root.addEventListener('submit', onSubmit); root.addEventListener('input', onInput); } };
})();

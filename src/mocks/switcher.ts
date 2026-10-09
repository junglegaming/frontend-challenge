import { buttonVariants } from '@/components/ui/button';
import { http } from '@/lib/http/client';
import { SCENARIO_IDS } from '@/lib/http/schemas';
export async function mountSwitcher() {
  const panel = document.createElement('aside');
  panel.setAttribute('aria-label', 'Controle dos mocks');
  panel.className =
    'fixed right-3 bottom-3 z-50 max-w-[calc(100vw-24px)] rounded-md border border-border bg-surface-card p-3 text-caption text-foreground shadow-lg';
  const content = document.createElement('div');
  content.id = 'mock-switcher-content';
  const label = document.createElement('label');
  label.textContent = 'Cenário ';
  const select = document.createElement('select');
  select.className =
    'bg-surface-raised rounded-sm p-1 focus-visible:outline-primary';
  for (const id of SCENARIO_IDS) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = id;
    select.append(option);
  }
  label.append(select);
  content.append(label);
  const status = document.createElement('p');
  status.setAttribute('aria-live', 'polite');
  content.append(status);
  const reset = document.createElement('button');
  reset.textContent = 'Reset cenário';
  reset.className =
    'rounded-sm bg-primary p-2 text-ink focus-visible:outline-primary';
  content.append(reset);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = buttonVariants({ variant: 'secondary', size: 'icon-sm' });
  toggle.setAttribute('aria-controls', content.id);
  function updateToggle() {
    const expanded = !content.hidden;
    toggle.textContent = expanded ? '▾' : '▴';
    toggle.setAttribute('aria-expanded', String(expanded));
    const action = expanded
      ? 'Ocultar controle dos mocks'
      : 'Mostrar controle dos mocks';
    toggle.setAttribute('aria-label', action);
    toggle.title = action;
  }
  toggle.addEventListener('click', () => {
    content.hidden = !content.hidden;
    updateToggle();
  });
  updateToggle();
  panel.append(toggle, content);
  async function refresh() {
    const { data } = await http.get('/api/_mock/scenario');
    select.value = data.id;
    status.textContent =
      data.id === 'offline' ? 'Rede: offline simulado' : 'Rede: online';
  }
  select.addEventListener('change', () => {
    const url = new URL(location.href);
    url.searchParams.delete('scenario');
    history.replaceState(history.state, '', url);
    void http.post('/api/_mock/scenario', { id: select.value }).then(refresh);
  });
  reset.addEventListener('click', () => {
    void http.post('/api/_mock/reset').then(() => location.reload());
  });
  document.body.append(panel);
  await refresh();
}

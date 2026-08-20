import { getUser, isLoggedIn } from '../api.js';
import { navigate } from '../router.js';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'dashboard', href: '/dashboard', fill: true },
  { label: 'Employees', icon: 'group', href: '/employees' },
  { label: 'Leave Management', icon: 'event_busy', href: '/leave' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
];

export function renderSidebar(activePath = '') {
  const user = getUser();
  return `
    <nav class="bg-surface border-r border-outline-variant fixed left-0 top-0 h-full w-[260px] flex flex-col py-lg z-50">
      <div class="px-gutter mb-xl flex items-center gap-sm">
        <div class="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-on-primary font-bold text-sm">EH</div>
        <div>
          <h1 class="font-title-lg text-title-lg font-bold text-primary">EmployeeHub</h1>
          <p class="font-label-sm text-label-sm text-secondary">HR Admin Tool</p>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto px-sm flex flex-col gap-xs">
        ${NAV_ITEMS.map(item => {
          const isActive = activePath === item.href || (item.href !== '/dashboard' && activePath.startsWith(item.href));
          return `
            <a data-link="${item.href}" href="${item.href}"
               class="${isActive
                ? 'bg-secondary-container text-on-secondary-container border-l-4 border-primary px-3 py-2 flex items-center gap-3 transition-colors rounded-r-md'
                : 'text-secondary hover:bg-surface-container px-3 py-2 flex items-center gap-3 transition-colors rounded-md hover:text-on-surface'}">
              <span class="material-symbols-outlined" ${isActive && item.fill ? "style=\"font-variation-settings: 'FILL' 1;\"" : ''}>${item.icon}</span>
              <span class="font-title-md text-title-md">${item.label}</span>
            </a>
          `;
        }).join('')}
      </div>
      <div class="px-sm mt-auto border-t border-outline-variant pt-md">
        <div class="flex items-center gap-sm px-3 py-2">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-bold">
            ${user ? user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : 'HR'}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-label-sm text-label-sm text-on-surface font-semibold truncate">${user?.name || 'HR Admin'}</p>
            <p class="font-label-sm text-label-sm text-secondary truncate text-[10px]">${user?.email || ''}</p>
          </div>
          <button id="logout-btn" class="text-secondary hover:text-error transition-colors" title="Logout">
            <span class="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </nav>
  `;
}

export function attachSidebarEvents() {
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    import('../api.js').then(({ clearToken }) => {
      clearToken();
      navigate('/');
    });
  });

  document.querySelectorAll('[data-link]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(link.getAttribute('data-link'));
    });
  });
}

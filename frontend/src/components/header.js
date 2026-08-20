import { navigate } from '../router.js';

export function renderHeader(title, actions = '') {
  return `
    <header class="bg-surface border-b border-outline-variant fixed top-0 right-0 h-header_height z-40 shadow-sm flex items-center justify-between px-lg ml-[260px] w-[calc(100%-260px)]">
      <div class="flex items-center gap-4 flex-1">
        <h2 class="font-headline-md text-headline-md font-semibold text-on-surface">${title}</h2>
        ${actions}
      </div>
      <div class="flex items-center gap-md">
        <button id="notif-btn" class="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container transition-colors relative">
          <span class="material-symbols-outlined">notifications</span>
        </button>
      </div>
    </header>
  `;
}

export function renderSearchHeader(title, placeholder = 'Search...') {
  return `
    <header class="bg-surface border-b border-outline-variant fixed top-0 right-0 h-header_height z-40 shadow-sm flex items-center justify-between px-lg ml-[260px] w-[calc(100%-260px)]">
      <div class="flex items-center gap-4 flex-1">
        <h2 class="font-headline-md text-headline-md font-semibold text-on-surface">${title}</h2>
      </div>
      <div class="flex items-center gap-md">
        <div class="relative hidden sm:block w-64">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">search</span>
          <input id="header-search" class="w-full bg-surface-container-low border border-outline-variant text-on-surface pl-10 pr-4 py-2 rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" placeholder="${placeholder}" type="text">
        </div>
        <button id="notif-btn" class="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container transition-colors relative">
          <span class="material-symbols-outlined">notifications</span>
        </button>
      </div>
    </header>
  `;
}

export function statusBadge(status) {
  const map = {
    active: 'bg-[#D1FAE5] text-[#065F46]',
    inactive: 'bg-[#F3F4F6] text-[#374151]',
    on_leave: 'bg-[#FEF3C7] text-[#92400E]',
    pending: 'bg-[#FEF3C7] text-[#92400E]',
    approved: 'bg-[#D1FAE5] text-[#065F46]',
    rejected: 'bg-[#FEE2E2] text-[#991B1B]',
    verified: 'bg-[#D1FAE5] text-[#065F46]',
    expired: 'bg-[#FEE2E2] text-[#991B1B]',
    complete: 'bg-[#D1FAE5] text-[#065F46]',
    in_progress: 'bg-[#DBEAFE] text-[#1E40AF]',
  };
  const label = status?.replace(/_/g, ' ') || 'unknown';
  return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-700'}">${label.charAt(0).toUpperCase() + label.slice(1)}</span>`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

export function avatarInitials(name) {
  if (!name) return 'EM';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export function getAvatarColor(name) {
  const colors = [
    ['#DBEAFE', '#1E40AF'], ['#D1FAE5', '#065F46'], ['#FEF3C7', '#92400E'],
    ['#FCE7F3', '#9D174D'], ['#EDE9FE', '#5B21B6'], ['#FEE2E2', '#991B1B'],
    ['#D0E1FB', '#004ac6'], ['#FFEDD5', '#9A3412'],
  ];
  const idx = (name || '').charCodeAt(0) % colors.length;
  return colors[idx];
}

export function pageLayout(content, sidebar, header) {
  return `
    ${sidebar}
    ${header}
    <main class="ml-[260px] mt-header_height w-full p-2xl overflow-y-auto pb-32">
      ${content}
    </main>
  `;
}

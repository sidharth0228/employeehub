import api from '../api.js';
import { navigate } from '../router.js';
import { renderSidebar, attachSidebarEvents } from '../components/sidebar.js';
import { renderSearchHeader, statusBadge, formatDate, avatarInitials, getAvatarColor } from '../components/header.js';
import { showToast, showModal } from '../components/toast.js';

export default async function employeesPage() {
  const app = document.getElementById('app');
  let allEmployees = [];
  let departments = [];
  let currentFilter = { status: '', department: '', search: '' };

  // Get URL params
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('status')) currentFilter.status = urlParams.get('status');

  app.innerHTML = `
    ${renderSidebar('/employees')}
    ${renderSearchHeader('Employees', 'Search by name, email, department...')}
    <main class="ml-[260px] mt-header_height w-full p-2xl pb-32">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-xl gap-4">
        <div>
          <p class="font-body-md text-secondary" id="emp-count">Loading employees...</p>
        </div>
        <div class="flex gap-sm flex-wrap">
          <div id="dept-filter-wrap"></div>
          <button id="view-toggle" class="bg-surface border border-outline-variant text-secondary px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-surface-container transition-colors">
            <span class="material-symbols-outlined text-sm" id="view-icon">grid_view</span>
          </button>
          <button id="add-emp-btn" class="bg-primary text-on-primary font-title-md text-title-md px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-on-primary-fixed-variant transition-colors shadow-soft">
            <span class="material-symbols-outlined text-sm">person_add</span>Add Employee
          </button>
        </div>
      </div>

      <!-- Status Filter Tabs -->
      <div class="flex gap-2 mb-xl overflow-x-auto pb-1">
        ${['', 'active', 'on_leave', 'inactive'].map(s => {
          const labels = { '': 'All', 'active': 'Active', 'on_leave': 'On Leave', 'inactive': 'Inactive' };
          return `<button class="status-tab px-4 py-2 rounded-full font-label-md text-label-md border transition-colors whitespace-nowrap ${currentFilter.status === s ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-outline-variant text-secondary hover:bg-surface-container'}" data-status="${s}">${labels[s]}</button>`;
        }).join('')}
      </div>

      <div id="employee-list" class="flex items-center justify-center h-40">
        <span class="material-symbols-outlined text-primary text-4xl animate-spin">autorenew</span>
      </div>
    </main>
  `;

  attachSidebarEvents();

  let isGridView = true;

  try {
    const result = await api.employees.list({ limit: 100 });
    allEmployees = result.employees;
    departments = result.departments;
    renderDeptFilter();
    renderList();
  } catch (err) {
    showToast('Failed to load employees: ' + err.message, 'error');
  }

  // Search with debounce
  let searchTimer;
  document.getElementById('header-search')?.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentFilter.search = e.target.value;
      renderList();
    }, 300);
  });

  document.getElementById('add-emp-btn').addEventListener('click', () => navigate('/employees/new'));

  document.getElementById('view-toggle').addEventListener('click', () => {
    isGridView = !isGridView;
    document.getElementById('view-icon').textContent = isGridView ? 'grid_view' : 'view_list';
    renderList();
  });

  // Status tab filtering
  document.querySelectorAll('.status-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentFilter.status = tab.dataset.status;
      document.querySelectorAll('.status-tab').forEach(t => {
        t.className = `status-tab px-4 py-2 rounded-full font-label-md text-label-md border transition-colors whitespace-nowrap ${t.dataset.status === currentFilter.status ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-outline-variant text-secondary hover:bg-surface-container'}`;
      });
      renderList();
    });
  });

  function renderDeptFilter() {
    const wrap = document.getElementById('dept-filter-wrap');
    if (!wrap || departments.length === 0) return;
    wrap.innerHTML = `
      <select id="dept-filter" class="bg-surface border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none">
        <option value="">All Departments</option>
        ${departments.map(d => `<option value="${d}" ${currentFilter.department === d ? 'selected' : ''}>${d}</option>`).join('')}
      </select>
    `;
    document.getElementById('dept-filter').addEventListener('change', (e) => {
      currentFilter.department = e.target.value;
      renderList();
    });
  }

  function filterEmployees() {
    return allEmployees.filter(e => {
      if (currentFilter.status && e.status !== currentFilter.status) return false;
      if (currentFilter.department && e.department !== currentFilter.department) return false;
      if (currentFilter.search) {
        const s = currentFilter.search.toLowerCase();
        if (!(`${e.first_name} ${e.last_name}`.toLowerCase().includes(s) ||
          e.email.toLowerCase().includes(s) ||
          (e.department || '').toLowerCase().includes(s) ||
          (e.designation || '').toLowerCase().includes(s) ||
          e.employee_id.toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }

  function renderList() {
    const filtered = filterEmployees();
    const countEl = document.getElementById('emp-count');
    if (countEl) countEl.textContent = `${filtered.length} employee${filtered.length !== 1 ? 's' : ''}${currentFilter.status ? ` (${currentFilter.status.replace('_', ' ')})` : ''}`;

    const listEl = document.getElementById('employee-list');
    if (!listEl) return;

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
          <span class="material-symbols-outlined text-5xl text-secondary mb-4">search_off</span>
          <p class="font-title-lg text-on-surface mb-2">No employees found</p>
          <p class="font-body-md text-secondary">Try adjusting your filters or search term</p>
        </div>
      `;
      return;
    }

    if (isGridView) {
      listEl.className = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg';
      listEl.innerHTML = filtered.map(e => {
        const [bg, color] = getAvatarColor(`${e.first_name} ${e.last_name}`);
        return `
          <div class="bg-surface rounded-xl border border-outline-variant p-md shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all cursor-pointer emp-card" data-id="${e._id}">
            <div class="flex items-start justify-between mb-md">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0" style="background:${bg};color:${color}">
                  ${avatarInitials(`${e.first_name} ${e.last_name}`)}
                </div>
                <div>
                  <h3 class="font-title-md text-on-surface">${e.first_name} ${e.last_name}</h3>
                  <p class="font-body-md text-secondary text-sm">${e.employee_id}</p>
                </div>
              </div>
              ${statusBadge(e.status)}
            </div>
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 text-secondary">
                <span class="material-symbols-outlined text-[16px]">work</span>
                <span class="font-body-md text-body-md">${e.designation || '—'}</span>
              </div>
              <div class="flex items-center gap-2 text-secondary">
                <span class="material-symbols-outlined text-[16px]">corporate_fare</span>
                <span class="font-body-md text-body-md">${e.department || '—'}</span>
              </div>
              <div class="flex items-center gap-2 text-secondary">
                <span class="material-symbols-outlined text-[16px]">mail</span>
                <span class="font-body-md text-body-md truncate">${e.email}</span>
              </div>
            </div>
            <div class="mt-md pt-md border-t border-outline-variant flex justify-between items-center">
              <span class="font-label-md text-label-md text-secondary">Joined ${formatDate(e.date_of_joining)}</span>
              <div class="flex gap-2">
                ${e.pending_docs > 0 ? `<span class="bg-[#FEF3C7] text-[#92400E] text-xs font-medium px-2 py-0.5 rounded-full">${e.pending_docs} docs</span>` : ''}
                ${e.pending_leaves > 0 ? `<span class="bg-[#FEE2E2] text-error text-xs font-medium px-2 py-0.5 rounded-full">${e.pending_leaves} leaves</span>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      listEl.className = 'bg-surface rounded-xl border border-outline-variant shadow-soft overflow-hidden';
      listEl.innerHTML = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-outline-variant">
              <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Employee</th>
              <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Department</th>
              <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Type</th>
              <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Joined</th>
              <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Status</th>
              <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F3F4F6] font-body-md text-on-surface">
            ${filtered.map(e => {
              const [bg, color] = getAvatarColor(`${e.first_name} ${e.last_name}`);
              return `
                <tr class="hover:bg-surface-container-low transition-colors cursor-pointer emp-card" data-id="${e._id}">
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style="background:${bg};color:${color}">
                        ${avatarInitials(`${e.first_name} ${e.last_name}`)}
                      </div>
                      <div>
                        <p class="font-medium">${e.first_name} ${e.last_name}</p>
                        <p class="text-xs text-secondary">${e.employee_id} · ${e.designation || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4">${e.department || '—'}</td>
                  <td class="py-3 px-4 capitalize">${(e.employment_type || '').replace('_', ' ')}</td>
                  <td class="py-3 px-4">${formatDate(e.date_of_joining)}</td>
                  <td class="py-3 px-4">${statusBadge(e.status)}</td>
                  <td class="py-3 px-4 text-right">
                    <button class="text-primary hover:text-primary-container font-medium text-sm view-btn" data-id="${e._id}">View Profile</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    // Attach click handlers
    document.querySelectorAll('.emp-card').forEach(card => {
      card.addEventListener('click', () => navigate(`/employees/${card.dataset.id}`));
    });
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); navigate(`/employees/${btn.dataset.id}`); });
    });
  }
}

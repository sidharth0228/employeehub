import api from '../api.js';
import { navigate } from '../router.js';
import { renderSidebar, attachSidebarEvents } from '../components/sidebar.js';
import { renderSearchHeader, statusBadge, formatDate, avatarInitials, getAvatarColor } from '../components/header.js';
import { showToast, showInputModal } from '../components/toast.js';

export default async function leavePage() {
  const app = document.getElementById('app');
  let currentStatus = '';
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('status')) currentStatus = urlParams.get('status');

  app.innerHTML = `
    ${renderSidebar('/leave')}
    ${renderSearchHeader('Leave Management', 'Search employee name...')}
    <main class="ml-[260px] mt-header_height w-full p-2xl pb-32">
      <div class="mb-xl">
        <div class="flex gap-2 overflow-x-auto pb-1">
          ${[
            { val: '', label: 'All Applications' },
            { val: 'pending', label: 'Pending Review' },
            { val: 'approved', label: 'Approved' },
            { val: 'rejected', label: 'Rejected' },
          ].map(f => `
            <button class="leave-tab px-5 py-2 rounded-full font-label-md text-label-md border transition-colors whitespace-nowrap ${currentStatus === f.val ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-outline-variant text-secondary hover:bg-surface-container'}" data-status="${f.val}">${f.label}</button>
          `).join('')}
        </div>
      </div>
      <div id="leave-list" class="flex items-center justify-center h-40">
        <span class="material-symbols-outlined text-primary text-4xl animate-spin">autorenew</span>
      </div>
    </main>
  `;

  attachSidebarEvents();

  let allLeaves = [];
  let counts = {};

  async function loadLeaves() {
    try {
      const result = await api.leave.list({ status: currentStatus, limit: 100 });
      allLeaves = result.leaves;
      counts = result.counts || {};
      renderLeaves(allLeaves);
      updateTabCounts();
    } catch (err) { showToast('Failed to load leaves: ' + err.message, 'error'); }
  }

  function updateTabCounts() {
    const tabs = document.querySelectorAll('.leave-tab');
    tabs.forEach(tab => {
      const s = tab.dataset.status;
      const labels = { '': 'All Applications', 'pending': `Pending (${counts.pending || 0})`, 'approved': `Approved (${counts.approved || 0})`, 'rejected': `Rejected (${counts.rejected || 0})` };
      tab.textContent = labels[s] || tab.textContent;
    });
  }

  function renderLeaves(leaves) {
    const list = document.getElementById('leave-list');
    if (!list) return;

    // Search filter
    const search = document.getElementById('header-search')?.value?.toLowerCase() || '';
    const filtered = search ? leaves.filter(l => (l.employee_name || '').toLowerCase().includes(search) || (l.department || '').toLowerCase().includes(search)) : leaves;

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <span class="material-symbols-outlined text-5xl text-secondary mb-4">event_available</span>
          <p class="font-title-lg text-on-surface mb-2">No leave applications</p>
          <p class="font-body-md text-secondary">No applications match your current filter</p>
        </div>
      `;
      list.className = '';
      return;
    }

    list.className = 'bg-surface rounded-xl border border-outline-variant shadow-soft overflow-hidden';
    list.innerHTML = `
      <div class="p-md border-b border-outline-variant flex justify-between items-center">
        <h3 class="font-title-lg text-title-lg text-on-surface">${filtered.length} Application${filtered.length !== 1 ? 's' : ''}</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-outline-variant">
              <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Employee</th>
              <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Type</th>
              <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Duration</th>
              <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Days</th>
              <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Reason</th>
              <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Applied On</th>
              <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Status</th>
              <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold text-right">Decision Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F3F4F6] font-body-md text-on-surface">
            ${filtered.map(l => {
              const [bg, color] = getAvatarColor(l.employee_name || '');
              return `
                <tr class="hover:bg-surface-container-low transition-colors">
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style="background:${bg};color:${color}">
                        ${avatarInitials(l.employee_name || '')}
                      </div>
                      <div>
                        <p class="font-medium text-on-surface">${l.employee_name || 'Unknown'}</p>
                        <p class="text-xs text-secondary">${l.emp_code || ''} · ${l.department || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4 font-medium text-sm">${l.leave_type}</td>
                  <td class="py-3 px-4 text-xs font-medium">${formatDate(l.start_date)} – ${formatDate(l.end_date)}</td>
                  <td class="py-3 px-4 font-bold text-sm">${l.days_count}d</td>
                  <td class="py-3 px-4">
                    <div class="max-w-[220px]">
                      <p class="text-xs text-on-surface font-medium leading-tight" title="${l.reason || ''}">${l.reason || '—'}</p>
                      ${l.notes ? `<p class="text-[11px] text-secondary italic mt-0.5">Admin note: ${l.notes}</p>` : ''}
                    </div>
                  </td>
                  <td class="py-3 px-4 text-secondary text-xs">${formatDate(l.applied_at)}</td>
                  <td class="py-3 px-4">${statusBadge(l.status)}</td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex gap-2 justify-end items-center">
                      ${l.status === 'pending' ? `
                        <button class="approve-btn bg-[#065F46] text-white hover:bg-[#047857] px-3.5 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-soft cursor-pointer" data-id="${l._id}" title="Accept and Approve Leave">
                          Accept
                        </button>
                        <button class="reject-btn bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FECACA] px-3.5 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer" data-id="${l._id}" title="Reject Leave">
                          Reject
                        </button>
                      ` : `
                        <span class="text-xs text-secondary font-medium">${l.status === 'approved' ? '✓ Accepted' : '✕ Rejected'}</span>
                      `}
                      <button class="view-emp-btn text-secondary hover:text-primary font-medium text-xs p-1" data-emp="${l.employee_id}" title="View Employee Profile">
                        <span class="material-symbols-outlined text-[18px]">open_in_new</span>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Approve
    document.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await api.leave.updateStatus(btn.dataset.id, 'approved');
          showToast('Leave approved', 'success');
          await loadLeaves();
        } catch (err) { showToast('Failed: ' + err.message, 'error'); }
      });
    });

    // Reject with notes
    document.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showInputModal({
          title: 'Reject Leave Application',
          placeholder: 'Reason for rejection (optional)',
          onConfirm: async (notes) => {
            try {
              await api.leave.updateStatus(btn.dataset.id, 'rejected', notes);
              showToast('Leave rejected', 'info');
              await loadLeaves();
            } catch (err) { showToast('Failed: ' + err.message, 'error'); }
          }
        });
      });
    });

    // View employee profile
    document.querySelectorAll('.view-emp-btn').forEach(btn => {
      btn.addEventListener('click', () => navigate(`/employees/${btn.dataset.emp}`));
    });
  }

  // Tab switching
  document.querySelectorAll('.leave-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentStatus = tab.dataset.status;
      document.querySelectorAll('.leave-tab').forEach(t => {
        t.className = `leave-tab px-5 py-2 rounded-full font-label-md text-label-md border transition-colors whitespace-nowrap ${t.dataset.status === currentStatus ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-outline-variant text-secondary hover:bg-surface-container'}`;
      });
      loadLeaves();
    });
  });

  // Search
  let searchTimer;
  document.getElementById('header-search')?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => renderLeaves(allLeaves), 300);
  });

  await loadLeaves();
}

import api from '../api.js';
import { navigate } from '../router.js';
import { renderSidebar, attachSidebarEvents } from '../components/sidebar.js';
import { renderHeader, statusBadge, formatDate, timeAgo } from '../components/header.js';
import { showToast, showInputModal } from '../components/toast.js';

export default async function dashboardPage() {
  const app = document.getElementById('app');

  // Show skeleton loading
  app.innerHTML = `
    ${renderSidebar('/dashboard')}
    ${renderHeader('Dashboard')}
    <main class="ml-[260px] mt-header_height w-full p-2xl pb-32">
      <div class="flex items-center justify-center h-64">
        <div class="flex flex-col items-center gap-4">
          <span class="material-symbols-outlined text-primary text-5xl animate-spin" style="animation:spin 1s linear infinite">autorenew</span>
          <p class="text-secondary font-body-md">Loading dashboard...</p>
        </div>
      </div>
    </main>
  `;
  attachSidebarEvents();

  let dashboardStats = null;
  let dashboardAlerts = null;

  async function loadDashboardData() {
    try {
      const [stats, alerts] = await Promise.all([
        api.dashboard.stats(),
        api.dashboard.alerts(),
      ]);
      dashboardStats = stats;
      dashboardAlerts = alerts;
      render();
    } catch (err) {
      showToast('Failed to load dashboard: ' + err.message, 'error');
    }
  }

  function render() {
    const stats = dashboardStats;
    const alerts = dashboardAlerts;
    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    app.innerHTML = `
      ${renderSidebar('/dashboard')}
      ${renderHeader('Dashboard')}
      <main class="ml-[260px] mt-header_height w-full p-2xl overflow-y-auto max-w-[1440px] mx-auto pb-32">

        <!-- Welcome Section -->
        <section class="mb-2xl flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 class="font-headline-lg text-headline-lg text-on-surface mb-xs">${greeting}, HR 👋</h2>
            <p class="font-body-lg text-body-lg text-secondary">Here's an overview of your workforce and today's HR activities.</p>
          </div>
          <div class="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant shadow-soft">
            <span class="material-symbols-outlined text-secondary text-sm">calendar_today</span>
            <span class="font-label-md text-label-md text-on-surface-variant font-medium">${today}</span>
          </div>
        </section>

        <!-- Quick Actions -->
        <section class="mb-xl flex gap-sm overflow-x-auto pb-2 items-center">
          <button id="qa-add-emp" class="bg-primary-container text-on-primary font-title-md text-title-md px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary transition-colors shadow-soft whitespace-nowrap cursor-pointer">
            <span class="material-symbols-outlined text-sm">add</span>Add Employee
          </button>
          <button id="qa-review-leaves" class="bg-surface border border-outline-variant text-on-surface font-title-md text-title-md px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-surface-container transition-colors shadow-soft whitespace-nowrap cursor-pointer">
            <span class="material-symbols-outlined text-sm text-amber-600">fact_check</span>Review Leave Requests ${stats.pendingLeaves > 0 ? `<span class="bg-[#FEF3C7] text-[#92400E] text-xs px-2 py-0.5 rounded-full font-bold">${stats.pendingLeaves}</span>` : ''}
          </button>
          <button id="qa-payslips" class="bg-surface border border-outline-variant text-on-surface font-title-md text-title-md px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-surface-container transition-colors shadow-soft whitespace-nowrap cursor-pointer">
            <span class="material-symbols-outlined text-sm text-primary">receipt_long</span>Payslips & Payroll
          </button>
          <button id="qa-doc-cats" class="bg-surface border border-outline-variant text-on-surface font-title-md text-title-md px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-surface-container transition-colors shadow-soft whitespace-nowrap cursor-pointer">
            <span class="material-symbols-outlined text-sm">folder_managed</span>Document Categories
          </button>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-2xl">
          <!-- Left Column -->
          <div class="lg:col-span-1 flex flex-col gap-lg">
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-md">
              ${[
                { label: 'Total Employees', value: stats.total, icon: 'group', color: 'bg-primary-container/10 text-primary', link: '/employees', cta: 'Directory →' },
                { label: 'Active Employees', value: stats.active, icon: 'person_check', color: 'bg-[#D1FAE5] text-[#065F46]', link: '/employees?status=active', cta: 'View Active →' },
                { label: 'Pending Documents', value: stats.pendingDocs, icon: 'description', color: 'bg-[#FEF3C7] text-[#92400E]', link: '/employees', cta: 'Track →' },
                { label: 'Pending Leaves', value: stats.pendingLeaves, icon: 'event_busy', color: 'bg-[#FEE2E2] text-error', link: '/leave?status=pending', cta: 'Manage →' },
                { label: 'On Leave Today', value: stats.onLeave, icon: 'flight_takeoff', color: 'bg-secondary-container/20 text-secondary', link: '/employees?status=on_leave', cta: 'View →' },
                { label: 'Incomplete Onboarding', value: stats.incompleteOnboarding, icon: 'assignment_ind', color: 'bg-primary-container/10 text-primary', link: '/employees', cta: 'Review →' },
              ].map(s => `
                <a href="${s.link}" data-link="${s.link}" class="bg-surface rounded-xl border border-outline-variant p-md shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all flex items-center justify-between group cursor-pointer">
                  <div class="flex items-center gap-md">
                    <div class="w-12 h-12 rounded-lg ${s.color} flex items-center justify-center">
                      <span class="material-symbols-outlined text-2xl">${s.icon}</span>
                    </div>
                    <div>
                      <p class="font-label-md text-secondary">${s.label}</p>
                      <h4 class="font-headline-md text-on-surface font-bold">${s.value}</h4>
                    </div>
                  </div>
                  <span class="text-primary font-label-md group-hover:translate-x-1 transition-transform">${s.cta}</span>
                </a>
              `).join('')}
            </div>

            <!-- HR Attention Alerts -->
            ${alerts.docAlerts.length > 0 ? `
            <div class="bg-surface rounded-xl border border-error-container p-md shadow-soft bg-gradient-to-br from-surface to-[#fff5f5]">
              <h3 class="font-title-lg text-title-lg text-on-surface mb-md flex items-center gap-2">
                <span class="material-symbols-outlined text-error">warning</span>Requires Attention
              </h3>
              <div class="flex flex-col gap-4">
                <p class="font-label-sm text-secondary uppercase mb-1">Documents</p>
                <div class="flex flex-col gap-2">
                  ${alerts.docAlerts.slice(0, 4).map(d => `
                    <div class="flex items-center justify-between bg-surface p-3 rounded-lg border border-outline-variant/50 shadow-sm">
                      <div class="flex items-start gap-3">
                        <div class="w-2 h-2 mt-2 rounded-full ${d.status === 'expired' ? 'bg-error' : 'bg-[#f59e0b]'} shrink-0"></div>
                        <p class="font-body-md text-on-surface text-sm"><strong>${d.employee_name}:</strong> ${d.category_name || d.file_name} ${d.status === 'expired' ? 'Expired' : d.status === 'rejected' ? 'Rejected' : 'Expiring Soon'}</p>
                      </div>
                      <button class="text-primary font-label-md hover:underline doc-review-btn text-xs font-semibold" data-emp="${d.employee_id}">Review</button>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
            ` : ''}

            <!-- Onboarding Progress -->
            ${alerts.onboardingPending.length > 0 ? `
            <div class="bg-surface rounded-xl border border-outline-variant p-md shadow-soft">
              <h3 class="font-title-lg text-title-lg text-on-surface mb-md">Onboarding Progress</h3>
              <div class="flex flex-col gap-4">
                ${alerts.onboardingPending.map(e => {
                  const pct = Math.round((e.onboarding_step / 4) * 100);
                  const steps = ['Info', 'Docs', 'Review', 'Complete'];
                  return `
                    <div class="p-3 bg-surface-container-low rounded-lg cursor-pointer hover:bg-surface-container transition-colors" data-link="/employees/${e._id}/onboarding">
                      <div class="flex justify-between items-center mb-2">
                        <p class="font-title-md text-on-surface text-sm font-semibold">${e.first_name} ${e.last_name}</p>
                        <span class="text-xs text-primary font-bold">${pct}% Complete</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-2 bg-outline-variant rounded-full overflow-hidden">
                          <div class="h-full bg-primary transition-all" style="width:${pct}%"></div>
                        </div>
                      </div>
                      <div class="flex justify-between mt-2 text-[10px] uppercase font-bold text-secondary">
                        ${steps.map((s, i) => `<span class="${i < e.onboarding_step ? 'text-primary' : ''}">${s}</span>`).join('')}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            ` : ''}

            <!-- Recent Activity -->
            <div class="bg-surface rounded-xl border border-outline-variant p-md shadow-soft">
              <h3 class="font-title-lg text-title-lg text-on-surface mb-md">Recent Activity</h3>
              <div class="flex flex-col gap-4">
                ${alerts.recentActivity.slice(0, 5).map(a => {
                  const icons = { verified: 'verified', added: 'add', approved: 'check_circle', rejected: 'cancel', uploaded: 'upload_file', onboarding_update: 'assignment_ind', salary_update: 'payments', payslip_generated: 'receipt' };
                  return `
                    <div class="flex gap-3 items-start">
                      <div class="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-sm text-primary">${icons[a.action] || 'history'}</span>
                      </div>
                      <div>
                        <p class="font-body-md text-on-surface text-xs leading-relaxed">${a.details}</p>
                        <p class="text-[10px] text-secondary mt-0.5">${timeAgo(a.created_at)}</p>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="lg:col-span-2 flex flex-col gap-lg">
            <!-- Recent Leave Applications Table with Direct Inline Accept/Reject -->
            <div class="bg-surface rounded-xl border border-outline-variant shadow-soft overflow-hidden flex flex-col">
              <div class="p-md border-b border-outline-variant bg-surface flex justify-between items-center">
                <div>
                  <h3 class="font-title-lg text-title-lg text-on-surface">Recent Leave Applications</h3>
                  <p class="text-xs text-secondary mt-0.5">Review reasons and accept or reject requests directly</p>
                </div>
                <div class="flex gap-4">
                  <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-[#92400E]"></div><span class="font-label-md text-label-md text-secondary">Pending (${stats.pendingLeaves})</span></div>
                  <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-[#065F46]"></div><span class="font-label-md text-label-md text-secondary">Approved</span></div>
                </div>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-gray-50 border-b border-outline-variant">
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Employee</th>
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Leave Type & Dates</th>
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Reason</th>
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Status</th>
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#F3F4F6] font-body-md text-on-surface">
                    ${alerts.recentLeaves.map(l => `
                      <tr class="hover:bg-surface-container-low transition-colors">
                        <td class="py-3 px-4">
                          <p class="font-medium text-on-surface text-sm">${l.employee_name || 'Unknown'}</p>
                          <p class="text-xs text-secondary">${l.emp_code || ''} · ${l.department || ''}</p>
                        </td>
                        <td class="py-3 px-4">
                          <p class="text-sm font-medium">${l.leave_type}</p>
                          <p class="text-xs text-secondary">${formatDate(l.start_date)} - ${formatDate(l.end_date)} (${l.days_count}d)</p>
                        </td>
                        <td class="py-3 px-4">
                          <p class="text-xs text-on-surface max-w-[200px] truncate" title="${l.reason || 'No reason provided'}">${l.reason || '—'}</p>
                        </td>
                        <td class="py-3 px-4">${statusBadge(l.status)}</td>
                        <td class="py-3 px-4 text-right">
                          ${l.status === 'pending'
                            ? `
                              <div class="flex items-center gap-1.5 justify-end">
                                <button class="dash-accept-leave bg-[#D1FAE5] hover:bg-[#A7F3D0] text-[#065F46] px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer" data-id="${l._id}" title="Accept Leave Request">Accept</button>
                                <button class="dash-reject-leave bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B] px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer" data-id="${l._id}" title="Reject Leave Request">Reject</button>
                              </div>
                            `
                            : `
                              <button class="text-secondary hover:text-primary font-medium text-xs leave-view-btn cursor-pointer" data-id="${l._id}">View Details</button>
                            `
                          }
                        </td>
                      </tr>
                    `).join('')}
                    ${alerts.recentLeaves.length === 0 ? '<tr><td colspan="5" class="py-8 text-center text-secondary font-body-md">No leave applications yet</td></tr>' : ''}
                  </tbody>
                </table>
              </div>
              <div class="p-3 border-t border-outline-variant flex justify-between items-center">
                <button data-link="/leave" class="text-primary font-label-md hover:underline cursor-pointer">View all leave applications →</button>
                <span class="text-xs text-secondary">${stats.pendingLeaves} pending approvals</span>
              </div>
            </div>

            <!-- Document & Compliance Alerts -->
            <div class="bg-surface rounded-xl border border-outline-variant shadow-soft overflow-hidden flex flex-col">
              <div class="p-md border-b border-outline-variant bg-surface">
                <h3 class="font-title-lg text-title-lg text-on-surface">Document & Compliance Alerts</h3>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-gray-50 border-b border-outline-variant">
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Employee</th>
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Document</th>
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Expiry</th>
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Status</th>
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#F3F4F6] font-body-md text-on-surface">
                    ${alerts.docAlerts.map(d => `
                      <tr class="hover:bg-surface-container-low transition-colors">
                        <td class="py-3 px-4 font-medium">${d.employee_name}</td>
                        <td class="py-3 px-4">${d.category_name || d.file_name}</td>
                        <td class="py-3 px-4">${formatDate(d.expiry_date)}</td>
                        <td class="py-3 px-4">${statusBadge(d.status)}</td>
                        <td class="py-3 px-4 text-right">
                          <button class="text-primary hover:text-primary-container font-medium text-sm doc-review-btn cursor-pointer" data-emp="${d.employee_id}">Review</button>
                        </td>
                      </tr>
                    `).join('')}
                    ${alerts.docAlerts.length === 0 ? '<tr><td colspan="5" class="py-8 text-center text-secondary font-body-md">No document alerts 🎉</td></tr>' : ''}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Leave Review Modal Container -->
      <div id="dash-modal-container"></div>
    `;

    attachSidebarEvents();

    // Quick Action Buttons
    document.getElementById('qa-add-emp')?.addEventListener('click', () => navigate('/employees/new'));
    document.getElementById('qa-payslips')?.addEventListener('click', () => navigate('/payroll'));
    document.getElementById('qa-doc-cats')?.addEventListener('click', () => navigate('/settings/document-categories'));

    // Review Leave Requests Quick Action Button (Opens Review Modal with all pending requests & reasons)
    document.getElementById('qa-review-leaves')?.addEventListener('click', async () => {
      await openLeaveReviewModal();
    });

    // Stat card links
    document.querySelectorAll('[data-link]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(el.getAttribute('data-link'));
      });
    });

    // Inline Accept Leave Action on Dashboard
    document.querySelectorAll('.dash-accept-leave').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          await api.leave.updateStatus(id, 'approved');
          showToast('Leave request accepted successfully', 'success');
          loadDashboardData();
        } catch (err) {
          showToast('Failed to accept leave: ' + err.message, 'error');
        }
      });
    });

    // Inline Reject Leave Action on Dashboard
    document.querySelectorAll('.dash-reject-leave').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        showInputModal({
          title: 'Reject Leave Request',
          placeholder: 'Provide reason for rejection...',
          onConfirm: async (notes) => {
            try {
              await api.leave.updateStatus(id, 'rejected', notes);
              showToast('Leave request rejected', 'info');
              loadDashboardData();
            } catch (err) {
              showToast('Failed to reject leave: ' + err.message, 'error');
            }
          }
        });
      });
    });

    // Doc review buttons → navigate to employee documents
    document.querySelectorAll('.doc-review-btn').forEach(btn => {
      btn.addEventListener('click', () => navigate(`/employees/${btn.dataset.emp}/documents`));
    });

    // Leave view details buttons → navigate to leave page
    document.querySelectorAll('.leave-view-btn').forEach(btn => {
      btn.addEventListener('click', () => navigate('/leave'));
    });
  }

  // Interactive Leave Review Modal for all pending leaves
  async function openLeaveReviewModal() {
    const modalContainer = document.getElementById('dash-modal-container');
    const res = await api.leave.list({ status: 'pending' });
    const pendingList = res.leaves || [];

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box max-w-2xl w-full p-6 bg-white rounded-2xl shadow-2xl relative max-h-[85vh] overflow-y-auto">
          <div class="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
            <div>
              <h3 class="font-title-lg text-title-lg font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-600">fact_check</span>
                Review Pending Leave Requests
              </h3>
              <p class="text-xs text-secondary">${pendingList.length} request(s) awaiting your decision</p>
            </div>
            <button id="close-leave-modal" class="text-secondary hover:text-on-surface"><span class="material-symbols-outlined">close</span></button>
          </div>

          ${pendingList.length === 0 ? `
            <div class="py-12 text-center text-secondary">
              <span class="material-symbols-outlined text-4xl text-[#065F46] mb-2">check_circle</span>
              <p class="font-title-md">All leave requests have been reviewed!</p>
            </div>
          ` : `
            <div class="space-y-3">
              ${pendingList.map(l => `
                <div class="p-4 rounded-xl border border-outline-variant bg-surface-container-low flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-title-md text-on-surface font-bold text-sm">${l.employee_name}</span>
                      <span class="bg-primary/10 text-primary text-[11px] px-2 py-0.5 rounded font-semibold">${l.emp_code} · ${l.department}</span>
                      <span class="bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 rounded font-semibold">${l.leave_type}</span>
                    </div>
                    <p class="text-xs text-secondary"><strong>Duration:</strong> ${formatDate(l.start_date)} – ${formatDate(l.end_date)} (${l.days_count} days)</p>
                    <div class="mt-2 p-2 bg-white rounded border border-gray-200">
                      <span class="text-[11px] text-secondary block uppercase font-bold">Reason:</span>
                      <p class="text-xs text-on-surface font-medium">${l.reason || 'No reason provided'}</p>
                    </div>
                  </div>
                  <div class="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                    <button class="modal-accept-leave flex-1 sm:flex-none bg-[#065F46] text-white hover:bg-[#047857] px-4 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-soft" data-id="${l._id}">
                      Accept
                    </button>
                    <button class="modal-reject-leave flex-1 sm:flex-none bg-[#FEE2E2] text-error hover:bg-[#FECACA] px-4 py-1.5 rounded-lg text-xs font-bold transition-colors" data-id="${l._id}">
                      Reject
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    document.getElementById('close-leave-modal').onclick = () => modalContainer.innerHTML = '';

    modalContainer.querySelectorAll('.modal-accept-leave').forEach(btn => {
      btn.onclick = async () => {
        try {
          await api.leave.updateStatus(btn.dataset.id, 'approved');
          showToast('Leave request accepted', 'success');
          modalContainer.innerHTML = '';
          loadDashboardData();
        } catch (err) { showToast('Error: ' + err.message, 'error'); }
      };
    });

    modalContainer.querySelectorAll('.modal-reject-leave').forEach(btn => {
      btn.onclick = () => {
        showInputModal({
          title: 'Reject Leave Request',
          placeholder: 'Reason for rejection...',
          onConfirm: async (notes) => {
            try {
              await api.leave.updateStatus(btn.dataset.id, 'rejected', notes);
              showToast('Leave request rejected', 'info');
              modalContainer.innerHTML = '';
              loadDashboardData();
            } catch (err) { showToast('Error: ' + err.message, 'error'); }
          }
        });
      };
    });
  }

  await loadDashboardData();
}

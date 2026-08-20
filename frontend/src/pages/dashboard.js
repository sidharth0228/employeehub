import api from '../api.js';
import { navigate } from '../router.js';
import { renderSidebar, attachSidebarEvents } from '../components/sidebar.js';
import { renderHeader, statusBadge, formatDate, timeAgo } from '../components/header.js';
import { showToast } from '../components/toast.js';

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

  try {
    const [stats, alerts] = await Promise.all([
      api.dashboard.stats(),
      api.dashboard.alerts(),
    ]);
    render(stats, alerts);
  } catch (err) {
    showToast('Failed to load dashboard: ' + err.message, 'error');
  }

  function render(stats, alerts) {
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
        <section class="mb-xl flex gap-sm overflow-x-auto pb-2">
          <button id="qa-add-emp" class="bg-primary-container text-on-primary font-title-md text-title-md px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary transition-colors shadow-soft whitespace-nowrap">
            <span class="material-symbols-outlined text-sm">add</span>Add Employee
          </button>
          <button id="qa-review-leaves" class="bg-surface border border-outline-variant text-on-surface font-title-md text-title-md px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-surface-container transition-colors shadow-soft whitespace-nowrap">
            <span class="material-symbols-outlined text-sm">fact_check</span>Review Leave Requests
          </button>
          <button id="qa-doc-cats" class="bg-surface border border-outline-variant text-on-surface font-title-md text-title-md px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-surface-container transition-colors shadow-soft whitespace-nowrap">
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
                      <h4 class="font-headline-md text-on-surface">${s.value}</h4>
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
                        <p class="font-body-md text-on-surface"><strong>${d.employee_name}:</strong> ${d.category_name || d.file_name} ${d.status === 'expired' ? 'Expired' : d.status === 'rejected' ? 'Rejected' : 'Expiring Soon'}</p>
                      </div>
                      <button class="text-primary font-label-md hover:underline doc-review-btn" data-emp="${d.employee_id}">Review</button>
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
                    <div class="p-3 bg-surface-container-low rounded-lg">
                      <div class="flex justify-between items-center mb-3">
                        <p class="font-title-md text-on-surface">${e.first_name} ${e.last_name}</p>
                        <span class="text-xs text-secondary">${pct}% Complete</span>
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
                  const icons = { verified: 'verified', added: 'add', approved: 'check_circle', rejected: 'cancel', uploaded: 'upload_file', onboarding_update: 'assignment_ind' };
                  return `
                    <div class="flex gap-3 items-start">
                      <div class="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-sm">${icons[a.action] || 'history'}</span>
                      </div>
                      <div>
                        <p class="font-body-md text-on-surface">${a.details}</p>
                        <p class="text-xs text-secondary">${timeAgo(a.created_at)}</p>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="lg:col-span-2 flex flex-col gap-lg">
            <!-- Recent Leave Applications -->
            <div class="bg-surface rounded-xl border border-outline-variant shadow-soft overflow-hidden flex flex-col">
              <div class="p-md border-b border-outline-variant bg-surface flex justify-between items-center">
                <h3 class="font-title-lg text-title-lg text-on-surface">Recent Leave Applications</h3>
                <div class="flex gap-4">
                  <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-[#92400E]"></div><span class="font-label-md text-label-md text-secondary">Pending (${stats.pendingLeaves})</span></div>
                  <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-[#065F46]"></div><span class="font-label-md text-label-md text-secondary">Approved</span></div>
                </div>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-gray-50 border-b border-outline-variant">
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Employee</th>
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Type</th>
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Duration</th>
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Status</th>
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#F3F4F6] font-body-md text-on-surface">
                    ${alerts.recentLeaves.map(l => `
                      <tr class="hover:bg-surface-container-low transition-colors">
                        <td class="py-3 px-4 font-medium">${l.employee_name || 'Unknown'}</td>
                        <td class="py-3 px-4">${l.leave_type}</td>
                        <td class="py-3 px-4">${formatDate(l.start_date)} – ${formatDate(l.end_date)} (${l.days_count}d)</td>
                        <td class="py-3 px-4">${statusBadge(l.status)}</td>
                        <td class="py-3 px-4 text-right">
                          ${l.status === 'pending'
                            ? `<button class="text-primary hover:text-primary-container font-medium text-sm leave-review-btn" data-id="${l._id}">Review</button>`
                            : `<button class="text-secondary hover:text-on-surface font-medium text-sm leave-view-btn" data-id="${l._id}">View</button>`
                          }
                        </td>
                      </tr>
                    `).join('')}
                    ${alerts.recentLeaves.length === 0 ? '<tr><td colspan="5" class="py-8 text-center text-secondary font-body-md">No leave applications yet</td></tr>' : ''}
                  </tbody>
                </table>
              </div>
              <div class="p-3 border-t border-outline-variant">
                <button data-link="/leave" class="text-primary font-label-md hover:underline">View all leave applications →</button>
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
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Employee</th>
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Document</th>
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Expiry</th>
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Status</th>
                      <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">Action</th>
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
                          <button class="text-primary hover:text-primary-container font-medium text-sm doc-review-btn" data-emp="${d.employee_id}">Review</button>
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
    `;

    attachSidebarEvents();

    // Wire quick action buttons
    document.getElementById('qa-add-emp')?.addEventListener('click', () => navigate('/employees/new'));
    document.getElementById('qa-review-leaves')?.addEventListener('click', () => navigate('/leave?status=pending'));
    document.getElementById('qa-doc-cats')?.addEventListener('click', () => navigate('/settings/document-categories'));

    // Wire stat card links
    document.querySelectorAll('[data-link]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(el.getAttribute('data-link'));
      });
    });

    // Leave review buttons → navigate to leave page
    document.querySelectorAll('.leave-review-btn, .leave-view-btn').forEach(btn => {
      btn.addEventListener('click', () => navigate('/leave'));
    });

    // Doc review buttons → navigate to employee documents
    document.querySelectorAll('.doc-review-btn').forEach(btn => {
      btn.addEventListener('click', () => navigate(`/employees/${btn.dataset.emp}`));
    });
  }
}

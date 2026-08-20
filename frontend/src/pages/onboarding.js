import api from '../api.js';
import { navigate } from '../router.js';
import { renderSidebar, attachSidebarEvents } from '../components/sidebar.js';
import { renderHeader, formatDate, avatarInitials, getAvatarColor, statusBadge } from '../components/header.js';
import { showToast } from '../components/toast.js';

export default async function onboardingPage({ id }) {
  const app = document.getElementById('app');
  let employee = null;

  // If no ID passed, get first incomplete onboarding employee or first employee
  if (!id) {
    try {
      const emps = await api.employees.list({ limit: 10 });
      const pendingOnboarding = emps.employees.find(e => e.onboarding_status !== 'complete');
      id = pendingOnboarding ? pendingOnboarding._id : emps.employees[0]?._id;
    } catch {}
  }

  app.innerHTML = `
    ${renderSidebar('/employees')}
    ${renderHeader('Review & Complete Onboarding')}
    <main class="ml-[260px] mt-header_height w-full p-2xl pb-32 max-w-[1440px]">
      <div class="flex items-center justify-center h-40">
        <span class="material-symbols-outlined text-primary text-4xl animate-spin">autorenew</span>
      </div>
    </main>
  `;
  attachSidebarEvents();

  try {
    employee = await api.employees.get(id);
    render();
  } catch (err) {
    showToast('Failed to load employee onboarding: ' + err.message, 'error');
  }

  function render() {
    const [bg, color] = getAvatarColor(`${employee.first_name} ${employee.last_name}`);
    const docs = employee.documents || [];
    const verifiedDocs = docs.filter(d => d.status === 'verified');
    const pendingDocs = docs.filter(d => d.status === 'pending');
    const isComplete = employee.onboarding_status === 'complete';

    app.innerHTML = `
      ${renderSidebar('/employees')}
      ${renderHeader('Review Employee', `
        <button id="back-btn" class="flex items-center gap-1 text-secondary hover:text-on-surface font-body-md text-body-md transition-colors ml-4">
          <span class="material-symbols-outlined text-sm">arrow_back</span> Back
        </button>
      `)}
      <main class="ml-[260px] mt-header_height w-full p-2xl pb-32 max-w-[1440px]">
        <!-- Breadcrumb & Header Section -->
        <div class="mb-xl">
          <nav class="flex items-center gap-sm text-secondary font-label-md text-label-md mb-xs">
            <a class="hover:text-primary transition-colors cursor-pointer" id="bc-employees">Employees</a>
            <span class="material-symbols-outlined text-[16px]">chevron_right</span>
            <a class="hover:text-primary transition-colors cursor-pointer" id="bc-profile">${employee.first_name} ${employee.last_name}</a>
            <span class="material-symbols-outlined text-[16px]">chevron_right</span>
            <span class="text-on-surface font-semibold">Review & Onboarding</span>
          </nav>
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-md mt-sm">
            <div>
              <h2 class="font-headline-lg text-headline-lg text-on-surface">Review Employee Onboarding</h2>
              <p class="font-body-md text-body-md text-secondary">Review the employee information and documents before completing onboarding.</p>
            </div>
            <!-- Stepper -->
            <div class="flex items-center gap-sm">
              <div class="flex items-center gap-xs text-primary font-label-md text-label-md bg-primary-fixed px-3 py-1.5 rounded-full">
                <span class="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Info</span>
              </div>
              <div class="w-4 h-[1px] bg-outline-variant"></div>
              <div class="flex items-center gap-xs text-primary font-label-md text-label-md bg-primary-fixed px-3 py-1.5 rounded-full">
                <span class="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Docs</span>
              </div>
              <div class="w-4 h-[1px] bg-outline-variant"></div>
              <div class="flex items-center gap-xs ${isComplete ? 'bg-[#065F46] text-white' : 'text-on-primary bg-primary'} font-label-md text-label-md px-3 py-1.5 rounded-full shadow-sm">
                <span class="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px]">${isComplete ? '✓' : '3'}</span>
                <span>${isComplete ? 'Complete' : 'Review'}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-lg">
          <!-- Employee Information Card -->
          <section class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-soft overflow-hidden">
            <div class="p-md border-b border-outline-variant bg-surface flex justify-between items-center">
              <div class="flex items-center gap-md">
                <div class="w-12 h-12 rounded-full flex items-center justify-center font-title-lg text-title-lg font-bold" style="background:${bg};color:${color}">
                  ${avatarInitials(`${employee.first_name} ${employee.last_name}`)}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-title-lg text-title-lg text-on-surface leading-tight">${employee.first_name} ${employee.last_name}</h3>
                    ${statusBadge(employee.onboarding_status)}
                  </div>
                  <span class="font-label-sm text-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded-md inline-block mt-1">${employee.employee_id}</span>
                </div>
              </div>
              <button id="edit-emp-btn" class="flex items-center gap-xs text-primary hover:text-on-primary-fixed-variant font-label-md text-label-md px-3 py-1.5 rounded-lg border border-transparent hover:border-primary transition-colors">
                <span class="material-symbols-outlined text-[18px]">edit</span>
                Edit Info
              </button>
            </div>
            <div class="p-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-lg gap-x-xl">
              <div class="space-y-1">
                <p class="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Full Name</p>
                <p class="font-body-md text-body-md text-on-surface font-medium">${employee.first_name} ${employee.last_name}</p>
              </div>
              <div class="space-y-1">
                <p class="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Work Email</p>
                <p class="font-body-md text-body-md text-on-surface font-medium">${employee.email}</p>
              </div>
              <div class="space-y-1">
                <p class="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Phone</p>
                <p class="font-body-md text-body-md text-on-surface font-medium">${employee.phone || '—'}</p>
              </div>
              <div class="col-span-full h-px bg-outline-variant/40"></div>
              <div class="space-y-1">
                <p class="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Department</p>
                <p class="font-body-md text-body-md text-on-surface font-medium flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-primary"></span>
                  ${employee.department || '—'}
                </p>
              </div>
              <div class="space-y-1">
                <p class="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Designation</p>
                <p class="font-body-md text-body-md text-on-surface font-medium">${employee.designation || '—'}</p>
              </div>
              <div class="space-y-1">
                <p class="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Employment Type</p>
                <p class="font-body-md text-body-md text-on-surface font-medium capitalize">${(employee.employment_type || 'full_time').replace('_', ' ')}</p>
              </div>
              <div class="space-y-1">
                <p class="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Joining Date</p>
                <p class="font-body-md text-body-md text-on-surface font-medium">${formatDate(employee.date_of_joining)}</p>
              </div>
              <div class="space-y-1">
                <p class="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Date of Birth</p>
                <p class="font-body-md text-body-md text-on-surface font-medium">${formatDate(employee.date_of_birth)}</p>
              </div>
              <div class="space-y-1">
                <p class="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Nationality</p>
                <p class="font-body-md text-body-md text-on-surface font-medium">${employee.nationality || '—'}</p>
              </div>
            </div>
          </section>

          <!-- Document Verification Summary -->
          <section class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-soft overflow-hidden">
            <div class="p-md border-b border-outline-variant bg-surface flex flex-col md:flex-row md:justify-between md:items-center gap-md">
              <div>
                <h3 class="font-title-lg text-title-lg text-on-surface">Document Verification</h3>
                <p class="font-body-md text-body-md text-secondary mt-1">Review uploaded documents and compliance status.</p>
              </div>
              <div class="flex items-center gap-4 bg-surface p-3 rounded-lg border border-outline-variant">
                <div class="flex gap-3 font-label-sm text-label-sm">
                  <span class="flex items-center gap-1 text-[#065F46]"><span class="w-2 h-2 rounded-full bg-[#10B981]"></span> ${verifiedDocs.length} Verified</span>
                  <span class="flex items-center gap-1 text-[#92400E]"><span class="w-2 h-2 rounded-full bg-[#F59E0B]"></span> ${pendingDocs.length} Pending</span>
                </div>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50 border-b border-outline-variant font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                    <th class="p-md font-medium">Document Type</th>
                    <th class="p-md font-medium">Status</th>
                    <th class="p-md font-medium">File Details</th>
                    <th class="p-md font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#F3F4F6]">
                  ${docs.map(d => `
                    <tr class="hover:bg-surface-container-low transition-colors">
                      <td class="p-md font-body-md text-on-surface font-medium flex items-center gap-2">
                        <span class="material-symbols-outlined text-secondary text-[20px]">description</span>
                        ${d.category_name || d.file_name}
                      </td>
                      <td class="p-md">
                        ${statusBadge(d.status)}
                      </td>
                      <td class="p-md font-body-md text-secondary text-sm">
                        ${d.file_name} ${d.expiry_date ? `· Expires ${formatDate(d.expiry_date)}` : ''}
                      </td>
                      <td class="p-md text-right">
                        ${d.status === 'pending' ? `
                          <button class="onb-v-btn px-3 py-1 bg-[#D1FAE5] text-[#065F46] hover:bg-[#A7F3D0] rounded font-medium text-xs transition-colors mr-2" data-id="${d._id}">Verify</button>
                          <button class="onb-r-btn px-3 py-1 bg-[#FEE2E2] text-error hover:bg-[#FECACA] rounded font-medium text-xs transition-colors" data-id="${d._id}">Reject</button>
                        ` : `
                          <span class="text-xs text-secondary">Verified</span>
                        `}
                      </td>
                    </tr>
                  `).join('')}
                  ${docs.length === 0 ? `
                    <tr>
                      <td colspan="4" class="p-8 text-center text-secondary">No documents uploaded for this employee</td>
                    </tr>
                  ` : ''}
                </tbody>
              </table>
            </div>
          </section>

          <!-- Complete Onboarding Actions Bar -->
          <div class="flex flex-col sm:flex-row justify-between items-center gap-md bg-surface rounded-xl border border-outline-variant p-lg shadow-soft">
            <div>
              <h4 class="font-title-md text-on-surface">${isComplete ? 'Onboarding is Complete 🎉' : 'Ready to Complete Onboarding?'}</h4>
              <p class="font-body-md text-secondary text-sm">${isComplete ? 'All checklist items and review steps have been marked complete.' : 'Once completed, the employee status will be set to Active and onboarding to Complete.'}</p>
            </div>
            <div class="flex gap-sm">
              <button id="goto-docs-btn" class="bg-surface border border-outline-variant text-on-surface px-5 py-2.5 rounded-lg font-title-md text-title-md text-sm hover:bg-surface-container transition-colors">
                Manage Documents
              </button>
              ${!isComplete ? `
                <button id="complete-onboarding-btn" class="bg-[#065F46] text-white px-6 py-2.5 rounded-lg font-title-md text-title-md text-sm hover:bg-[#047857] transition-colors shadow-soft flex items-center gap-2">
                  <span class="material-symbols-outlined text-[18px]">check_circle</span>
                  Complete Onboarding
                </button>
              ` : `
                <button id="reopen-onboarding-btn" class="bg-surface border border-outline-variant text-secondary px-5 py-2.5 rounded-lg font-title-md text-title-md text-sm hover:bg-surface-container transition-colors">
                  Re-open Onboarding
                </button>
              `}
            </div>
          </div>
        </div>
      </main>
    `;

    attachSidebarEvents();

    document.getElementById('back-btn')?.addEventListener('click', () => navigate(`/employees/${id}`));
    document.getElementById('bc-employees')?.addEventListener('click', () => navigate('/employees'));
    document.getElementById('bc-profile')?.addEventListener('click', () => navigate(`/employees/${id}`));
    document.getElementById('edit-emp-btn')?.addEventListener('click', () => navigate(`/employees/${id}`));
    document.getElementById('goto-docs-btn')?.addEventListener('click', () => navigate(`/employees/${id}/documents`));

    // Complete Onboarding button
    document.getElementById('complete-onboarding-btn')?.addEventListener('click', async () => {
      try {
        await api.employees.updateOnboarding(id, { onboarding_status: 'complete', onboarding_step: 4 });
        await api.employees.update(id, { status: 'active' });
        showToast('🎉 Onboarding completed successfully! Employee is now Active.', 'success');
        employee = await api.employees.get(id);
        render();
      } catch (err) { showToast('Failed: ' + err.message, 'error'); }
    });

    document.getElementById('reopen-onboarding-btn')?.addEventListener('click', async () => {
      try {
        await api.employees.updateOnboarding(id, { onboarding_status: 'in_progress', onboarding_step: 2 });
        showToast('Onboarding re-opened', 'info');
        employee = await api.employees.get(id);
        render();
      } catch (err) { showToast('Failed: ' + err.message, 'error'); }
    });

    // Verification buttons
    document.querySelectorAll('.onb-v-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await api.documents.updateStatus(btn.dataset.id, 'verified');
          showToast('Document verified', 'success');
          employee = await api.employees.get(id);
          render();
        } catch (err) { showToast('Failed: ' + err.message, 'error'); }
      });
    });

    document.querySelectorAll('.onb-r-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await api.documents.updateStatus(btn.dataset.id, 'rejected', 'Rejected during onboarding review');
          showToast('Document rejected', 'info');
          employee = await api.employees.get(id);
          render();
        } catch (err) { showToast('Failed: ' + err.message, 'error'); }
      });
    });
  }
}

import api from '../api.js';
import { navigate } from '../router.js';
import { renderSidebar, attachSidebarEvents } from '../components/sidebar.js';
import { renderHeader, formatDate, avatarInitials, getAvatarColor, statusBadge } from '../components/header.js';
import { showToast, showModal, showInputModal } from '../components/toast.js';

export default async function documentsPage({ id }) {
  const app = document.getElementById('app');
  let employee = null;
  let allCategories = [];

  // If no ID is passed, default to first employee or show selector
  if (!id) {
    try {
      const emps = await api.employees.list({ limit: 1 });
      if (emps.employees && emps.employees.length > 0) {
        id = emps.employees[0]._id;
      }
    } catch {}
  }

  app.innerHTML = `
    ${renderSidebar('/employees')}
    ${renderHeader('Document Management')}
    <main class="ml-[260px] mt-header_height w-full p-2xl pb-32 max-w-[1440px]">
      <div class="flex items-center justify-center h-40">
        <span class="material-symbols-outlined text-primary text-4xl animate-spin">autorenew</span>
      </div>
    </main>
  `;
  attachSidebarEvents();

  try {
    const [emp, cats] = await Promise.all([
      api.employees.get(id),
      api.categories.list(),
    ]);
    employee = emp;
    allCategories = cats;
    render();
  } catch (err) {
    showToast('Failed to load documents: ' + err.message, 'error');
  }

  function render() {
    const [bg, color] = getAvatarColor(`${employee.first_name} ${employee.last_name}`);
    const docs = employee.documents || [];

    // Calculate progress
    const reqCats = allCategories.filter(c => c.is_required);
    const verifiedCount = docs.filter(d => d.status === 'verified').length;
    const pendingCount = docs.filter(d => d.status === 'pending').length;
    const uploadedCatIds = docs.map(d => d.category_id);
    const missingCats = reqCats.filter(c => !uploadedCatIds.includes(c._id));
    const missingCount = missingCats.length;
    const progressPct = reqCats.length > 0 ? Math.min(100, Math.round((verifiedCount / reqCats.length) * 100)) : 100;

    app.innerHTML = `
      ${renderSidebar('/employees')}
      ${renderHeader('Employee Document Management', `
        <button id="back-to-profile-btn" class="flex items-center gap-1 text-secondary hover:text-on-surface font-body-md text-body-md transition-colors ml-4">
          <span class="material-symbols-outlined text-sm">arrow_back</span> Back to Profile
        </button>
      `)}
      <main class="ml-[260px] mt-header_height w-full p-2xl pb-32 max-w-[1440px]">
        <!-- Breadcrumb / Stepper -->
        <nav class="flex items-center gap-sm text-secondary font-label-md text-label-md mb-md">
          <a class="hover:text-primary transition-colors cursor-pointer" id="bc-employees">Employees</a>
          <span class="material-symbols-outlined text-[16px]">chevron_right</span>
          <a class="hover:text-primary transition-colors cursor-pointer" id="bc-profile">${employee.first_name} ${employee.last_name}</a>
          <span class="material-symbols-outlined text-[16px]">chevron_right</span>
          <span class="text-on-surface font-semibold">Documents</span>
        </nav>

        <!-- Employee Context Card -->
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md mb-xl shadow-soft flex items-center justify-between">
          <div class="flex items-center gap-md">
            <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0" style="background:${bg};color:${color}">
              ${avatarInitials(`${employee.first_name} ${employee.last_name}`)}
            </div>
            <div>
              <div class="flex items-center gap-sm">
                <h2 class="font-title-md text-title-md text-on-surface">${employee.first_name} ${employee.last_name}</h2>
                <span class="bg-surface-container px-2 py-0.5 rounded text-label-sm text-on-surface-variant">${employee.employee_id}</span>
                ${statusBadge(employee.status)}
              </div>
              <p class="font-body-md text-body-md text-on-surface-variant">${employee.designation || 'Staff'} · ${employee.department || 'General'} | ${employee.nationality || 'Indian'} · ${(employee.employment_type || 'full_time').replace('_', ' ')}</p>
            </div>
          </div>

          <div class="flex items-center gap-sm">
            <button id="quick-onboarding-btn" class="bg-surface border border-outline-variant text-on-surface hover:bg-surface-container px-4 py-2 rounded-lg font-title-md text-title-md text-sm transition-colors flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">assignment_ind</span> Onboarding Review
            </button>
            <button id="upload-doc-modal-btn" class="bg-primary text-on-primary hover:bg-on-primary-fixed-variant px-4 py-2 rounded-lg font-title-md text-title-md text-sm transition-colors flex items-center gap-2 shadow-soft">
              <span class="material-symbols-outlined text-sm">upload</span> Upload Document
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-xl">
          <!-- Left Column: Document Lists -->
          <div class="lg:col-span-2 space-y-xl">
            <!-- Progress Summary -->
            <div class="bg-surface-container-low rounded-lg p-md border border-outline-variant border-dashed">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-sm gap-2">
                <span class="font-title-md text-title-md text-on-surface">Required Progress</span>
                <div class="flex items-center gap-md flex-wrap">
                  <div class="flex items-center gap-sm">
                    <span class="w-2 h-2 rounded-full bg-[#10B981]"></span>
                    <span class="font-label-sm text-on-surface-variant">${verifiedCount} Verified</span>
                  </div>
                  <div class="flex items-center gap-sm">
                    <span class="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                    <span class="font-label-sm text-on-surface-variant">${pendingCount} Pending</span>
                  </div>
                  <div class="flex items-center gap-sm">
                    <span class="w-2 h-2 rounded-full bg-error"></span>
                    <span class="font-label-sm text-on-surface-variant">${missingCount} Missing</span>
                  </div>
                  <span class="font-label-md text-label-md text-primary font-bold ml-md">${verifiedCount} of ${reqCats.length} Required Complete</span>
                </div>
              </div>
              <div class="w-full bg-surface-container-highest rounded-full h-2">
                <div class="bg-primary h-2 rounded-full transition-all" style="width: ${progressPct}%"></div>
              </div>
              <div class="mt-sm flex items-start gap-xs text-on-surface-variant">
                <span class="material-symbols-outlined text-[16px] mt-[2px]">info</span>
                <p class="font-label-sm text-label-sm">Document requirements are based on active rules. <a class="text-primary hover:underline ml-sm cursor-pointer" id="link-doc-cats">Manage Document Categories</a></p>
              </div>
            </div>

            <!-- Upload Box (Hidden by default) -->
            <div id="inline-upload-box" class="hidden bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-soft">
              <h4 class="font-title-md text-on-surface mb-md">Upload Document</h4>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-md mb-md">
                <div>
                  <label class="block font-label-md text-label-md text-secondary mb-1">Category</label>
                  <select id="inline-cat-select" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary outline-none">
                    ${allCategories.map(c => `<option value="${c._id}">${c.name}${c.is_required ? ' (Required)' : ''}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="block font-label-md text-label-md text-secondary mb-1">Expiry Date (optional)</label>
                  <input type="date" id="inline-expiry" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary outline-none"/>
                </div>
                <div>
                  <label class="block font-label-md text-label-md text-secondary mb-1">File</label>
                  <input type="file" id="inline-file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" class="w-full font-body-md text-body-md text-on-surface text-sm"/>
                </div>
              </div>
              <div class="flex gap-sm">
                <button id="inline-upload-submit" class="bg-primary text-on-primary px-4 py-2 rounded-lg font-title-md text-sm hover:bg-on-primary-fixed-variant transition-colors">Upload</button>
                <button id="inline-upload-cancel" class="bg-surface border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-title-md text-sm hover:bg-surface-container transition-colors">Cancel</button>
              </div>
            </div>

            <!-- Uploaded Documents List -->
            <div>
              <div class="flex items-center justify-between mb-md">
                <h3 class="font-title-lg text-title-lg text-on-surface">Uploaded Documents (${docs.length})</h3>
              </div>
              <div class="space-y-sm">
                ${docs.map(d => `
                  <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex flex-col sm:flex-row sm:items-center justify-between gap-md shadow-sm">
                    <div class="flex items-start gap-md">
                      <div class="w-10 h-10 rounded ${d.status === 'verified' ? 'bg-[#D1FAE5] text-[#065F46]' : d.status === 'rejected' ? 'bg-[#FEE2E2] text-error' : 'bg-[#FEF3C7] text-[#92400E]'} flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-[20px]">${d.file_name?.endsWith('.pdf') ? 'picture_as_pdf' : 'description'}</span>
                      </div>
                      <div>
                        <h4 class="font-title-md text-title-md text-on-surface flex items-center gap-sm">
                          ${d.category_name || d.file_name}
                          ${statusBadge(d.status)}
                        </h4>
                        <div class="flex items-center gap-md mt-xs text-secondary text-sm">
                          <span class="flex items-center gap-xs"><span class="material-symbols-outlined text-[14px]">attachment</span> ${d.file_name}</span>
                          ${d.expiry_date ? `<span class="text-outline-variant">|</span><span>Expires: ${formatDate(d.expiry_date)}</span>` : ''}
                          <span class="text-outline-variant">|</span>
                          <span>Uploaded: ${formatDate(d.uploaded_at)}</span>
                        </div>
                        ${d.notes ? `<p class="text-xs text-secondary mt-1 italic">Note: ${d.notes}</p>` : ''}
                      </div>
                    </div>
                    <div class="flex items-center gap-sm sm:ml-auto">
                      ${d.status === 'pending' ? `
                        <button class="doc-v-btn px-md py-[6px] bg-[#10B981] text-white hover:bg-[#059669] rounded transition-colors font-label-md flex items-center gap-xs shadow-sm" data-id="${d._id}">Verify</button>
                        <button class="doc-r-btn px-md py-[6px] border border-error text-error hover:bg-error-container/50 rounded transition-colors font-label-md flex items-center gap-xs" data-id="${d._id}">Reject</button>
                      ` : ''}
                      <button class="doc-del-btn p-[6px] text-error hover:bg-error-container/50 rounded transition-colors" data-id="${d._id}" title="Remove">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                `).join('')}

                ${docs.length === 0 ? `
                  <div class="p-8 text-center bg-surface-container-lowest rounded-lg border border-outline-variant">
                    <p class="font-body-md text-secondary">No documents uploaded yet</p>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Missing Required Documents -->
            ${missingCats.length > 0 ? `
              <div>
                <div class="flex items-center justify-between mb-md">
                  <h3 class="font-title-lg text-title-lg text-error flex items-center gap-2">
                    <span class="material-symbols-outlined text-error">warning</span>
                    Missing Required Documents (${missingCats.length})
                  </h3>
                </div>
                <div class="space-y-sm">
                  ${missingCats.map(mc => `
                    <div class="bg-surface-container-lowest border border-error border-dashed rounded-lg p-md flex flex-col sm:flex-row sm:items-center justify-between gap-md bg-error-container/10">
                      <div class="flex items-start gap-md">
                        <div class="w-10 h-10 rounded bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
                          <span class="material-symbols-outlined text-error">upload_file</span>
                        </div>
                        <div>
                          <h4 class="font-title-md text-title-md text-on-surface flex items-center gap-sm">
                            ${mc.name}
                            <span class="border border-error text-error px-2 py-0.5 rounded-full font-label-sm">Missing</span>
                            <span class="bg-error-container text-error px-2 py-0.5 rounded font-label-sm font-bold">REQUIRED</span>
                          </h4>
                          <p class="font-body-md text-body-md text-secondary mt-xs text-sm">${mc.description || 'Mandatory compliance document.'}</p>
                        </div>
                      </div>
                      <div class="flex items-center gap-sm sm:ml-auto">
                        <button class="upload-missing-btn bg-primary hover:bg-primary/90 text-on-primary px-md py-sm rounded transition-colors font-label-md flex items-center gap-xs shadow-sm" data-cat="${mc._id}">
                          <span class="material-symbols-outlined text-[18px]">upload</span> Upload
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Right Column: Compliance Summary Card -->
          <div class="space-y-lg">
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-soft p-md">
              <h3 class="font-title-lg text-title-lg text-on-surface mb-md">Compliance Status</h3>
              <div class="space-y-4">
                <div class="flex justify-between items-center py-2 border-b border-outline-variant">
                  <span class="text-secondary text-sm">Total Required</span>
                  <span class="font-semibold text-on-surface">${reqCats.length}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-outline-variant">
                  <span class="text-[#065F46] text-sm">Verified</span>
                  <span class="font-semibold text-[#065F46]">${verifiedCount}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-outline-variant">
                  <span class="text-[#92400E] text-sm">Pending Verification</span>
                  <span class="font-semibold text-[#92400E]">${pendingCount}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-outline-variant">
                  <span class="text-error text-sm">Missing</span>
                  <span class="font-semibold text-error">${missingCount}</span>
                </div>
                <div class="pt-2">
                  <button id="go-onboarding-btn" class="w-full bg-primary text-on-primary py-2.5 rounded-lg font-title-md text-sm hover:bg-on-primary-fixed-variant transition-colors shadow-soft">
                    Proceed to Onboarding Review →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    `;

    attachSidebarEvents();

    // Navigation buttons
    document.getElementById('back-to-profile-btn')?.addEventListener('click', () => navigate(`/employees/${id}`));
    document.getElementById('bc-employees')?.addEventListener('click', () => navigate('/employees'));
    document.getElementById('bc-profile')?.addEventListener('click', () => navigate(`/employees/${id}`));
    document.getElementById('quick-onboarding-btn')?.addEventListener('click', () => navigate(`/employees/${id}/onboarding`));
    document.getElementById('go-onboarding-btn')?.addEventListener('click', () => navigate(`/employees/${id}/onboarding`));
    document.getElementById('link-doc-cats')?.addEventListener('click', () => navigate('/settings/document-categories'));

    // Upload box toggle
    document.getElementById('upload-doc-modal-btn')?.addEventListener('click', () => {
      document.getElementById('inline-upload-box')?.classList.toggle('hidden');
    });
    document.getElementById('inline-upload-cancel')?.addEventListener('click', () => {
      document.getElementById('inline-upload-box')?.classList.add('hidden');
    });

    document.querySelectorAll('.upload-missing-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const box = document.getElementById('inline-upload-box');
        box.classList.remove('hidden');
        document.getElementById('inline-cat-select').value = btn.dataset.cat;
        box.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Upload submit
    document.getElementById('inline-upload-submit')?.addEventListener('click', async () => {
      const file = document.getElementById('inline-file').files[0];
      const category_id = document.getElementById('inline-cat-select').value;
      const expiry_date = document.getElementById('inline-expiry').value;

      if (!file) { showToast('Please select a file to upload', 'error'); return; }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category_id', category_id);
      if (expiry_date) formData.append('expiry_date', expiry_date);

      try {
        await api.documents.upload(id, formData);
        showToast('Document uploaded successfully', 'success');
        employee = await api.employees.get(id);
        render();
      } catch (err) { showToast('Upload failed: ' + err.message, 'error'); }
    });

    // Verify button
    document.querySelectorAll('.doc-v-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await api.documents.updateStatus(btn.dataset.id, 'verified');
          showToast('Document verified', 'success');
          employee = await api.employees.get(id);
          render();
        } catch (err) { showToast('Failed: ' + err.message, 'error'); }
      });
    });

    // Reject button
    document.querySelectorAll('.doc-r-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showInputModal({
          title: 'Reject Document',
          placeholder: 'Reason for rejection',
          onConfirm: async (notes) => {
            try {
              await api.documents.updateStatus(btn.dataset.id, 'rejected', notes);
              showToast('Document rejected', 'info');
              employee = await api.employees.get(id);
              render();
            } catch (err) { showToast('Failed: ' + err.message, 'error'); }
          }
        });
      });
    });

    // Delete button
    document.querySelectorAll('.doc-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showModal({
          title: 'Delete Document',
          body: 'Are you sure you want to delete this document?',
          confirmText: 'Delete',
          danger: true,
          onConfirm: async () => {
            try {
              await api.documents.delete(btn.dataset.id);
              showToast('Document deleted', 'success');
              employee = await api.employees.get(id);
              render();
            } catch (err) { showToast('Failed: ' + err.message, 'error'); }
          }
        });
      });
    });
  }
}

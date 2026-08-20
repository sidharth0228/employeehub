import api from '../api.js';
import { navigate } from '../router.js';
import { renderSidebar, attachSidebarEvents } from '../components/sidebar.js';
import { renderHeader, statusBadge, formatDate, avatarInitials, getAvatarColor } from '../components/header.js';
import { showToast, showModal, showInputModal } from '../components/toast.js';

export default async function employeeProfilePage({ id }) {
  const app = document.getElementById('app');
  let employee = null;
  let activeTab = 'info';

  app.innerHTML = `
    ${renderSidebar('/employees')}
    ${renderHeader('Employee Profile')}
    <main class="ml-[260px] mt-header_height w-full p-2xl pb-32">
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
    showToast('Failed to load employee: ' + err.message, 'error');
  }

  function render() {
    const [bg, color] = getAvatarColor(`${employee.first_name} ${employee.last_name}`);
    const tabs = [
      { id: 'info', label: 'Personal Info', icon: 'person' },
      { id: 'payroll', label: 'Salary & Payslips', icon: 'payments' },
      { id: 'documents', label: 'Documents', icon: 'folder' },
      { id: 'leaves', label: 'Leave History', icon: 'event_busy' },
      { id: 'onboarding', label: 'Onboarding', icon: 'assignment_ind' },
    ];

    app.innerHTML = `
      ${renderSidebar('/employees')}
      ${renderHeader('Employee Profile', `
        <button id="back-btn" class="flex items-center gap-1 text-secondary hover:text-on-surface font-body-md text-body-md transition-colors ml-4">
          <span class="material-symbols-outlined text-sm">arrow_back</span> Back
        </button>
      `)}
      <main class="ml-[260px] mt-header_height w-full p-2xl pb-32 max-w-[1440px]">

        <!-- Profile Header -->
        <div class="bg-surface rounded-xl border border-outline-variant shadow-soft p-xl mb-xl">
          <div class="flex flex-col md:flex-row items-start md:items-center gap-lg">
            <div class="w-20 h-20 rounded-full flex items-center justify-center font-bold text-3xl shrink-0" style="background:${bg};color:${color}">
              ${avatarInitials(`${employee.first_name} ${employee.last_name}`)}
            </div>
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-3 mb-1">
                <h2 class="font-headline-md text-headline-md text-on-surface">${employee.first_name} ${employee.last_name}</h2>
                ${statusBadge(employee.status)}
                ${statusBadge(employee.onboarding_status)}
              </div>
              <p class="font-body-md text-secondary mb-1">${employee.designation || ''} · ${employee.department || ''}</p>
              <p class="font-label-md text-label-md text-secondary">${employee.employee_id} · ${employee.email}</p>
            </div>
            <div class="flex gap-sm flex-wrap">
              <select id="status-select" class="bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                ${['active', 'inactive', 'on_leave'].map(s => `<option value="${s}" ${employee.status === s ? 'selected' : ''}>${s.replace('_', ' ')}</option>`).join('')}
              </select>
              <button id="save-status-btn" class="bg-primary text-on-primary px-4 py-2 rounded-lg font-title-md text-title-md hover:bg-on-primary-fixed-variant transition-colors shadow-soft">
                Update Status
              </button>
              <button id="delete-emp-btn" class="bg-surface border border-error text-error px-4 py-2 rounded-lg font-title-md text-title-md hover:bg-error-container transition-colors">
                <span class="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 mb-xl border-b border-outline-variant overflow-x-auto">
          ${tabs.map(t => `
            <button class="profile-tab px-5 py-3 font-title-md text-title-md border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'}" data-tab="${t.id}">
              <span class="material-symbols-outlined text-[18px]">${t.icon}</span>${t.label}
            </button>
          `).join('')}
        </div>

        <!-- Tab Content -->
        <div id="tab-content"></div>
      </main>
    `;

    attachSidebarEvents();

    document.getElementById('back-btn').addEventListener('click', () => navigate('/employees'));

    document.getElementById('save-status-btn').addEventListener('click', async () => {
      const newStatus = document.getElementById('status-select').value;
      try {
        await api.employees.update(id, { status: newStatus });
        employee.status = newStatus;
        showToast('Status updated successfully', 'success');
        render();
      } catch (err) { showToast('Update failed: ' + err.message, 'error'); }
    });

    document.getElementById('delete-emp-btn').addEventListener('click', () => {
      showModal({
        title: 'Delete Employee',
        body: `Are you sure you want to delete <strong>${employee.first_name} ${employee.last_name}</strong>? This action cannot be undone.`,
        confirmText: 'Delete',
        danger: true,
        onConfirm: async () => {
          try {
            await api.employees.delete(id);
            showToast('Employee deleted', 'success');
            navigate('/employees');
          } catch (err) { showToast('Delete failed: ' + err.message, 'error'); }
        }
      });
    });

    document.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        document.querySelectorAll('.profile-tab').forEach(t => {
          t.className = `profile-tab px-5 py-3 font-title-md text-title-md border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${t.dataset.tab === activeTab ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'}`;
        });
        renderTabContent();
      });
    });

    renderTabContent();
  }

  function renderTabContent() {
    const content = document.getElementById('tab-content');
    if (!content) return;

    if (activeTab === 'info') renderInfoTab(content);
    else if (activeTab === 'payroll') renderPayrollTab(content);
    else if (activeTab === 'documents') renderDocumentsTab(content);
    else if (activeTab === 'leaves') renderLeavesTab(content);
    else if (activeTab === 'onboarding') renderOnboardingTab(content);
  }

  function field(label, value, editable = false, fieldName = '') {
    if (editable) {
      return `
        <div>
          <label class="block font-label-md text-label-md text-secondary mb-1">${label}</label>
          <input class="info-field w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" data-field="${fieldName}" value="${value || ''}" placeholder="${label}"/>
        </div>
      `;
    }
    return `
      <div>
        <label class="block font-label-md text-label-md text-secondary mb-1">${label}</label>
        <p class="font-body-md text-on-surface bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant">${value || '—'}</p>
      </div>
    `;
  }

  function renderInfoTab(content) {
    content.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        <!-- Personal Info -->
        <div class="bg-surface rounded-xl border border-outline-variant p-xl shadow-soft">
          <div class="flex justify-between items-center mb-lg">
            <h3 class="font-title-lg text-title-lg text-on-surface">Personal Information</h3>
            <button id="save-info-btn" class="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-on-primary-fixed-variant transition-colors text-sm">Save Changes</button>
          </div>
          <div class="grid grid-cols-2 gap-md">
            ${field('First Name', employee.first_name, true, 'first_name')}
            ${field('Last Name', employee.last_name, true, 'last_name')}
            ${field('Email', employee.email, true, 'email')}
            ${field('Phone', employee.phone, true, 'phone')}
            ${field('Date of Birth', employee.date_of_birth, true, 'date_of_birth')}
            ${field('Gender', employee.gender, true, 'gender')}
            ${field('Nationality', employee.nationality, true, 'nationality')}
          </div>
          <div class="mt-md">
            ${field('Address', employee.address, true, 'address')}
          </div>
        </div>

        <!-- Employment Details -->
        <div class="bg-surface rounded-xl border border-outline-variant p-xl shadow-soft">
          <div class="flex justify-between items-center mb-lg">
            <h3 class="font-title-lg text-title-lg text-on-surface">Employment Details</h3>
          </div>
          <div class="grid grid-cols-2 gap-md">
            ${field('Employee ID', employee.employee_id)}
            ${field('Department', employee.department, true, 'department')}
            ${field('Designation', employee.designation, true, 'designation')}
            ${field('Employment Type', employee.employment_type)}
            ${field('Date of Joining', employee.date_of_joining, true, 'date_of_joining')}
            ${field('Status', employee.status)}
          </div>
        </div>

        <!-- Emergency Contact -->
        <div class="bg-surface rounded-xl border border-outline-variant p-xl shadow-soft">
          <h3 class="font-title-lg text-title-lg text-on-surface mb-lg">Emergency Contact</h3>
          <div class="grid grid-cols-2 gap-md">
            ${field('Contact Name', employee.emergency_contact_name, true, 'emergency_contact_name')}
            ${field('Contact Phone', employee.emergency_contact_phone, true, 'emergency_contact_phone')}
          </div>
        </div>

        <!-- Bank Details -->
        <div class="bg-surface rounded-xl border border-outline-variant p-xl shadow-soft">
          <h3 class="font-title-lg text-title-lg text-on-surface mb-lg">Bank Details</h3>
          <div class="grid grid-cols-2 gap-md">
            ${field('Bank Name', employee.bank_name, true, 'bank_name')}
            ${field('Account Number', employee.bank_account_number, true, 'bank_account_number')}
            ${field('IFSC Code', employee.ifsc_code, true, 'ifsc_code')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('save-info-btn').addEventListener('click', async () => {
      const updates = {};
      document.querySelectorAll('.info-field').forEach(input => {
        updates[input.dataset.field] = input.value;
      });
      try {
        employee = { ...employee, ...updates };
        await api.employees.update(id, updates);
        showToast('Profile updated successfully', 'success');
      } catch (err) { showToast('Save failed: ' + err.message, 'error'); }
    });
  }

  function renderDocumentsTab(content) {
    const docs = employee.documents || [];
    content.innerHTML = `
      <div class="bg-surface rounded-xl border border-outline-variant shadow-soft overflow-hidden">
        <div class="p-md border-b border-outline-variant flex justify-between items-center">
          <h3 class="font-title-lg text-title-lg text-on-surface">Documents (${docs.length})</h3>
          <button id="upload-doc-btn" class="bg-primary text-on-primary px-4 py-2 rounded-lg font-title-md text-title-md text-sm hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">upload_file</span>Upload Document
          </button>
        </div>

        <!-- Upload Form (hidden) -->
        <div id="upload-form-wrap" class="hidden p-md border-b border-outline-variant bg-surface-container-low">
          <h4 class="font-title-md text-on-surface mb-md">Upload New Document</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-md mb-md">
            <div id="doc-cat-wrap"></div>
            <div>
              <label class="block font-label-md text-label-md text-secondary mb-1">Expiry Date (optional)</label>
              <input type="date" id="doc-expiry" class="w-full bg-white border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"/>
            </div>
            <div>
              <label class="block font-label-md text-label-md text-secondary mb-1">File</label>
              <input type="file" id="doc-file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" class="w-full font-body-md text-body-md text-on-surface"/>
            </div>
          </div>
          <div class="flex gap-sm">
            <button id="upload-submit-btn" class="bg-primary text-on-primary px-4 py-2 rounded-lg font-title-md text-title-md text-sm hover:bg-on-primary-fixed-variant transition-colors">Upload</button>
            <button id="upload-cancel-btn" class="bg-surface border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-title-md text-title-md text-sm hover:bg-surface-container transition-colors">Cancel</button>
          </div>
        </div>

        ${docs.length === 0 ? `
          <div class="p-8 text-center">
            <span class="material-symbols-outlined text-4xl text-secondary mb-3">folder_open</span>
            <p class="font-body-md text-secondary">No documents uploaded yet</p>
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b border-outline-variant">
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Document</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Category</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Expiry</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Status</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#F3F4F6] font-body-md text-on-surface">
                ${docs.map(d => `
                  <tr class="hover:bg-surface-container-low transition-colors" data-doc-id="${d._id}">
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-secondary text-[18px]">${d.file_name?.endsWith('.pdf') ? 'picture_as_pdf' : 'image'}</span>
                        <span class="font-medium">${d.file_name}</span>
                      </div>
                    </td>
                    <td class="py-3 px-4">${d.category_name || '—'}</td>
                    <td class="py-3 px-4">${formatDate(d.expiry_date)}</td>
                    <td class="py-3 px-4">${statusBadge(d.status)}</td>
                    <td class="py-3 px-4 text-right">
                      <div class="flex gap-2 justify-end">
                        ${d.status === 'pending' ? `
                          <button class="doc-action-btn text-[#065F46] hover:underline font-medium text-sm" data-doc="${d._id}" data-action="verified">Verify</button>
                          <button class="doc-action-btn text-error hover:underline font-medium text-sm" data-doc="${d._id}" data-action="rejected">Reject</button>
                        ` : ''}
                        <button class="doc-delete-btn text-secondary hover:text-error font-medium text-sm" data-doc="${d._id}">Delete</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    // Upload form toggle
    document.getElementById('upload-doc-btn').addEventListener('click', async () => {
      const wrap = document.getElementById('upload-form-wrap');
      wrap.classList.toggle('hidden');
      if (!wrap.classList.contains('hidden')) {
        // Load categories
        const catWrap = document.getElementById('doc-cat-wrap');
        catWrap.innerHTML = '<label class="block font-label-md text-label-md text-secondary mb-1">Category</label><select id="doc-cat" class="w-full bg-white border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"><option value="">Loading...</option></select>';
        try {
          const cats = await api.categories.list();
          document.getElementById('doc-cat').innerHTML = `<option value="">Select category</option>${cats.map(c => `<option value="${c._id}">${c.name}</option>`).join('')}`;
        } catch {}
      }
    });

    document.getElementById('upload-cancel-btn').addEventListener('click', () => {
      document.getElementById('upload-form-wrap').classList.add('hidden');
    });

    document.getElementById('upload-submit-btn').addEventListener('click', async () => {
      const file = document.getElementById('doc-file').files[0];
      const category_id = document.getElementById('doc-cat')?.value;
      const expiry_date = document.getElementById('doc-expiry').value;

      if (!file) { showToast('Please select a file', 'error'); return; }

      const formData = new FormData();
      formData.append('file', file);
      if (category_id) formData.append('category_id', category_id);
      if (expiry_date) formData.append('expiry_date', expiry_date);

      try {
        await api.documents.upload(id, formData);
        showToast('Document uploaded successfully', 'success');
        employee = await api.employees.get(id);
        renderTabContent();
      } catch (err) { showToast('Upload failed: ' + err.message, 'error'); }
    });

    // Doc action buttons
    document.querySelectorAll('.doc-action-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const docId = btn.dataset.doc;
        const action = btn.dataset.action;
        if (action === 'rejected') {
          showInputModal({
            title: 'Reject Document',
            placeholder: 'Reason for rejection (optional)',
            onConfirm: async (notes) => {
              try {
                await api.documents.updateStatus(docId, 'rejected', notes);
                showToast('Document rejected', 'info');
                employee = await api.employees.get(id);
                renderTabContent();
              } catch (err) { showToast('Failed: ' + err.message, 'error'); }
            }
          });
        } else {
          try {
            await api.documents.updateStatus(docId, action);
            showToast('Document verified', 'success');
            employee = await api.employees.get(id);
            renderTabContent();
          } catch (err) { showToast('Failed: ' + err.message, 'error'); }
        }
      });
    });

    document.querySelectorAll('.doc-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showModal({
          title: 'Delete Document',
          body: 'Are you sure you want to delete this document?',
          confirmText: 'Delete',
          danger: true,
          onConfirm: async () => {
            try {
              await api.documents.delete(btn.dataset.doc);
              showToast('Document deleted', 'success');
              employee = await api.employees.get(id);
              renderTabContent();
            } catch (err) { showToast('Failed: ' + err.message, 'error'); }
          }
        });
      });
    });
  }

  function renderLeavesTab(content) {
    const leaves = employee.leaves || [];
    content.innerHTML = `
      <div class="bg-surface rounded-xl border border-outline-variant shadow-soft overflow-hidden">
        <div class="p-md border-b border-outline-variant flex justify-between items-center">
          <h3 class="font-title-lg text-title-lg text-on-surface">Leave History (${leaves.length})</h3>
          <button id="apply-leave-btn" class="bg-primary text-on-primary px-4 py-2 rounded-lg font-title-md text-title-md text-sm hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">add</span>Apply Leave
          </button>
        </div>

        <!-- Apply Leave Form (hidden) -->
        <div id="leave-form-wrap" class="hidden p-md border-b border-outline-variant bg-surface-container-low">
          <h4 class="font-title-md text-on-surface mb-md">Apply for Leave</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-md">
            <div>
              <label class="block font-label-md text-label-md text-secondary mb-1">Leave Type</label>
              <select id="leave-type" class="w-full bg-white border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                <option>Annual Leave</option>
                <option>Sick Leave</option>
                <option>Casual Leave</option>
                <option>Maternity Leave</option>
                <option>Paternity Leave</option>
                <option>Emergency Leave</option>
              </select>
            </div>
            <div>
              <label class="block font-label-md text-label-md text-secondary mb-1">Start Date</label>
              <input type="date" id="leave-start" class="w-full bg-white border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"/>
            </div>
            <div>
              <label class="block font-label-md text-label-md text-secondary mb-1">End Date</label>
              <input type="date" id="leave-end" class="w-full bg-white border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"/>
            </div>
            <div>
              <label class="block font-label-md text-label-md text-secondary mb-1">Reason</label>
              <input type="text" id="leave-reason" placeholder="Brief reason" class="w-full bg-white border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"/>
            </div>
          </div>
          <div class="flex gap-sm">
            <button id="leave-submit-btn" class="bg-primary text-on-primary px-4 py-2 rounded-lg font-title-md text-title-md text-sm hover:bg-on-primary-fixed-variant transition-colors">Submit</button>
            <button id="leave-cancel-btn" class="bg-surface border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-title-md text-title-md text-sm hover:bg-surface-container transition-colors">Cancel</button>
          </div>
        </div>

        ${leaves.length === 0 ? `
          <div class="p-8 text-center">
            <span class="material-symbols-outlined text-4xl text-secondary mb-3">event_available</span>
            <p class="font-body-md text-secondary">No leave applications</p>
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b border-outline-variant">
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Type</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Start</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">End</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Days</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Status</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#F3F4F6] font-body-md text-on-surface">
                ${leaves.map(l => `
                  <tr class="hover:bg-surface-container-low transition-colors">
                    <td class="py-3 px-4">${l.leave_type}</td>
                    <td class="py-3 px-4">${formatDate(l.start_date)}</td>
                    <td class="py-3 px-4">${formatDate(l.end_date)}</td>
                    <td class="py-3 px-4">${l.days_count}d</td>
                    <td class="py-3 px-4">${statusBadge(l.status)}</td>
                    <td class="py-3 px-4 text-secondary">${l.reason || '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    document.getElementById('apply-leave-btn').addEventListener('click', () => {
      document.getElementById('leave-form-wrap').classList.toggle('hidden');
    });
    document.getElementById('leave-cancel-btn').addEventListener('click', () => {
      document.getElementById('leave-form-wrap').classList.add('hidden');
    });
    document.getElementById('leave-submit-btn').addEventListener('click', async () => {
      const leave_type = document.getElementById('leave-type').value;
      const start_date = document.getElementById('leave-start').value;
      const end_date = document.getElementById('leave-end').value;
      const reason = document.getElementById('leave-reason').value;

      if (!start_date || !end_date) { showToast('Please select start and end dates', 'error'); return; }

      const days = Math.max(1, Math.ceil((new Date(end_date) - new Date(start_date)) / 86400000) + 1);
      try {
        await api.leave.create({ employee_id: id, leave_type, start_date, end_date, days_count: days, reason });
        showToast('Leave application submitted', 'success');
        employee = await api.employees.get(id);
        renderTabContent();
      } catch (err) { showToast('Failed: ' + err.message, 'error'); }
    });
  }

  function renderOnboardingTab(content) {
    const steps = [
      { num: 1, label: 'Personal Information', icon: 'person' },
      { num: 2, label: 'Employment & Documents', icon: 'folder' },
      { num: 3, label: 'Verification & Review', icon: 'fact_check' },
      { num: 4, label: 'Complete', icon: 'check_circle' },
    ];
    const currentStep = employee.onboarding_step || 1;
    const pct = Math.round((currentStep / 4) * 100);

    content.innerHTML = `
      <div class="bg-surface rounded-xl border border-outline-variant shadow-soft p-xl">
        <div class="flex justify-between items-center mb-xl">
          <h3 class="font-title-lg text-title-lg text-on-surface">Onboarding Status</h3>
          <div class="flex gap-sm">
            <select id="onboarding-status-select" class="bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none">
              ${['pending', 'in_progress', 'complete'].map(s => `<option value="${s}" ${employee.onboarding_status === s ? 'selected' : ''}>${s.replace('_', ' ')}</option>`).join('')}
            </select>
            <button id="save-onboarding-btn" class="bg-primary text-on-primary px-4 py-2 rounded-lg font-title-md text-title-md text-sm hover:bg-on-primary-fixed-variant transition-colors">Save</button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mb-xl">
          <div class="flex justify-between items-center mb-2">
            <span class="font-body-md text-secondary">Overall Progress</span>
            <span class="font-title-md text-primary">${pct}%</span>
          </div>
          <div class="h-3 bg-outline-variant rounded-full overflow-hidden">
            <div class="h-full bg-primary rounded-full transition-all" style="width:${pct}%"></div>
          </div>
        </div>

        <!-- Steps -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
          ${steps.map(s => {
            const done = currentStep > s.num;
            const active = currentStep === s.num;
            return `
              <div class="p-4 rounded-xl border-2 ${done ? 'border-[#065F46] bg-[#D1FAE5]' : active ? 'border-primary bg-primary/5' : 'border-outline-variant bg-surface-container-low'} transition-all">
                <div class="flex items-center gap-3 mb-2">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center ${done ? 'bg-[#065F46] text-white' : active ? 'bg-primary text-white' : 'bg-outline-variant text-secondary'}">
                    <span class="material-symbols-outlined text-[18px]">${done ? 'check' : s.icon}</span>
                  </div>
                  <span class="font-label-md text-label-md ${done ? 'text-[#065F46]' : active ? 'text-primary' : 'text-secondary'} uppercase">Step ${s.num}</span>
                </div>
                <p class="font-title-md text-on-surface">${s.label}</p>
                <p class="font-label-md text-label-md mt-1 ${done ? 'text-[#065F46]' : active ? 'text-primary' : 'text-secondary'}">${done ? '✓ Completed' : active ? '● In Progress' : '○ Pending'}</p>
              </div>
            `;
          })}
        </div>

        <!-- Step Controls -->
        <div class="flex gap-sm flex-wrap">
          ${currentStep < 4 ? `
            <button id="advance-step-btn" class="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-title-md text-title-md hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">arrow_forward</span>Advance to Step ${currentStep + 1}
            </button>
          ` : ''}
          ${currentStep > 1 ? `
            <button id="back-step-btn" class="bg-surface border border-outline-variant text-on-surface px-5 py-2.5 rounded-lg font-title-md text-title-md hover:bg-surface-container transition-colors flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">arrow_back</span>Back to Step ${currentStep - 1}
            </button>
          ` : ''}
          ${currentStep === 3 ? `
            <button id="approve-onboarding-btn" class="bg-[#065F46] text-white px-5 py-2.5 rounded-lg font-title-md text-title-md hover:bg-[#047857] transition-colors flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">check_circle</span>Approve & Complete Onboarding
            </button>
          ` : ''}
        </div>
      </div>
    `;

    document.getElementById('save-onboarding-btn').addEventListener('click', async () => {
      const onboarding_status = document.getElementById('onboarding-status-select').value;
      try {
        const updated = await api.employees.updateOnboarding(id, { onboarding_status, onboarding_step: employee.onboarding_step });
        employee = { ...employee, ...updated };
        showToast('Onboarding status updated', 'success');
        renderTabContent();
      } catch (err) { showToast('Failed: ' + err.message, 'error'); }
    });

    document.getElementById('advance-step-btn')?.addEventListener('click', async () => {
      const nextStep = Math.min(4, (employee.onboarding_step || 1) + 1);
      const newStatus = nextStep === 4 ? 'complete' : 'in_progress';
      try {
        const updated = await api.employees.updateOnboarding(id, { onboarding_step: nextStep, onboarding_status: newStatus });
        employee = { ...employee, ...updated };
        showToast(`Advanced to Step ${nextStep}`, 'success');
        renderTabContent();
      } catch (err) { showToast('Failed: ' + err.message, 'error'); }
    });

    document.getElementById('back-step-btn')?.addEventListener('click', async () => {
      const prevStep = Math.max(1, (employee.onboarding_step || 1) - 1);
      try {
        const updated = await api.employees.updateOnboarding(id, { onboarding_step: prevStep, onboarding_status: 'in_progress' });
        employee = { ...employee, ...updated };
        renderTabContent();
      } catch (err) { showToast('Failed: ' + err.message, 'error'); }
    });

    document.getElementById('approve-onboarding-btn')?.addEventListener('click', async () => {
      try {
        const updated = await api.employees.updateOnboarding(id, { onboarding_step: 4, onboarding_status: 'complete' });
        employee = { ...employee, ...updated };
        showToast('🎉 Onboarding completed!', 'success');
        renderTabContent();
      } catch (err) { showToast('Failed: ' + err.message, 'error'); }
    });
  }

  async function renderPayrollTab(content) {
    content.innerHTML = `<div class="flex justify-center p-8"><span class="material-symbols-outlined text-primary text-4xl animate-spin">autorenew</span></div>`;

    function formatINR(val) {
      if (val === undefined || val === null || isNaN(val)) return '₹0';
      return '₹' + Number(val).toLocaleString('en-IN');
    }

    try {
      const data = await api.payroll.getEmployee(id);
      const emp = data.employee;
      const payslips = data.payslips || [];

      const ctc = emp.ctc_annual || 600000;
      const gross = emp.monthly_gross || Math.round(ctc / 12);
      const inHand = emp.in_hand_monthly || Math.round(gross * 0.85);

      content.innerHTML = `
        <div class="space-y-xl">
          <!-- Compensation Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div class="bg-surface rounded-xl border border-outline-variant p-md shadow-soft">
              <span class="text-xs text-secondary font-semibold uppercase block mb-1">Annual CTC</span>
              <h3 class="font-headline-md text-on-surface font-bold text-2xl">${formatINR(ctc)}</h3>
              <p class="text-xs text-secondary mt-1">Cost to Company (Per Annum)</p>
            </div>
            <div class="bg-surface rounded-xl border border-outline-variant p-md shadow-soft">
              <span class="text-xs text-secondary font-semibold uppercase block mb-1">Monthly Gross</span>
              <h3 class="font-headline-md text-primary font-bold text-2xl">${formatINR(gross)}</h3>
              <p class="text-xs text-secondary mt-1">Before tax and deductions</p>
            </div>
            <div class="bg-surface rounded-xl border border-outline-variant p-md shadow-soft bg-[#D1FAE5]/30 border-[#065F46]/30">
              <span class="text-xs text-[#065F46] font-semibold uppercase block mb-1">Net Monthly In-Hand</span>
              <h3 class="font-headline-md text-[#065F46] font-bold text-2xl">${formatINR(inHand)}</h3>
              <p class="text-xs text-[#065F46] mt-1">Estimated Take-home payout</p>
            </div>
          </div>

          <!-- Salary Structure & Bank Breakdown -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-xl">
            <!-- Salary Components -->
            <div class="bg-surface rounded-xl border border-outline-variant shadow-soft p-xl">
              <div class="flex justify-between items-center mb-lg">
                <h3 class="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary text-[20px]">payments</span>
                  Salary Components
                </h3>
                <button id="edit-salary-pkg-btn" class="bg-primary text-on-primary px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-on-primary-fixed-variant transition-colors shadow-soft">
                  Edit Package
                </button>
              </div>

              <div class="space-y-3 divide-y divide-gray-100 text-sm">
                <div class="flex justify-between pt-2">
                  <span class="text-secondary">Basic Salary</span>
                  <span class="font-semibold text-on-surface">${formatINR(emp.basic_salary || Math.round(gross * 0.5))}</span>
                </div>
                <div class="flex justify-between pt-2">
                  <span class="text-secondary">House Rent Allowance (HRA)</span>
                  <span class="font-semibold text-on-surface">${formatINR(emp.hra || Math.round(gross * 0.2))}</span>
                </div>
                <div class="flex justify-between pt-2">
                  <span class="text-secondary">Special / Other Allowances</span>
                  <span class="font-semibold text-on-surface">${formatINR(emp.special_allowance || 0)}</span>
                </div>
                <div class="flex justify-between pt-2">
                  <span class="text-secondary">Provident Fund (PF Deduction)</span>
                  <span class="font-semibold text-error">-${formatINR(emp.pf_deduction || 1800)}</span>
                </div>
                <div class="flex justify-between pt-2">
                  <span class="text-secondary">Tax / TDS</span>
                  <span class="font-semibold text-error">-${formatINR(emp.tax_deduction || 0)}</span>
                </div>
                <div class="flex justify-between pt-2">
                  <span class="text-secondary">Professional Tax</span>
                  <span class="font-semibold text-error">-${formatINR(emp.prof_tax || 200)}</span>
                </div>
              </div>
            </div>

            <!-- Bank & Disbursal Details -->
            <div class="bg-surface rounded-xl border border-outline-variant shadow-soft p-xl">
              <h3 class="font-title-lg text-title-lg text-on-surface mb-lg flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[20px]">account_balance</span>
                Disbursal & Bank Account
              </h3>

              <div class="space-y-4">
                <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant">
                  <span class="text-xs text-secondary uppercase block font-semibold">Bank Name</span>
                  <p class="font-title-md text-on-surface font-bold mt-0.5">${emp.bank_name || 'HDFC Bank'}</p>
                </div>
                <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant">
                  <span class="text-xs text-secondary uppercase block font-semibold">Account Number</span>
                  <p class="font-title-md text-on-surface font-bold mt-0.5">${emp.bank_account_number || '50100432198765'}</p>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant">
                    <span class="text-xs text-secondary uppercase block font-semibold">IFSC Code</span>
                    <p class="font-title-md text-on-surface font-bold mt-0.5">${emp.ifsc_code || 'HDFC0001234'}</p>
                  </div>
                  <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant">
                    <span class="text-xs text-secondary uppercase block font-semibold">Payment Mode</span>
                    <p class="font-title-md text-on-surface font-bold mt-0.5">${emp.payment_mode || 'Bank Transfer'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Generated Payslips History -->
          <div class="bg-surface rounded-xl border border-outline-variant shadow-soft overflow-hidden">
            <div class="p-md border-b border-outline-variant flex justify-between items-center">
              <div>
                <h3 class="font-title-lg text-title-lg text-on-surface">Payslip History</h3>
                <p class="text-xs text-secondary mt-0.5">Past payslips generated for this employee</p>
              </div>
              <button id="profile-generate-ps-btn" class="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-1.5 shadow-soft">
                <span class="material-symbols-outlined text-[16px]">add</span> Generate New Payslip
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50 border-b border-outline-variant">
                    <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Pay Period</th>
                    <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Gross Pay</th>
                    <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Net In-Hand</th>
                    <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Status</th>
                    <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#F3F4F6] font-body-md text-on-surface">
                  ${payslips.map(ps => `
                    <tr class="hover:bg-surface-container-low transition-colors">
                      <td class="py-3 px-4">
                        <div class="flex items-center gap-2">
                          <span class="material-symbols-outlined text-primary text-[18px]">receipt</span>
                          <span class="font-semibold">${ps.month_year}</span>
                        </div>
                        <span class="text-xs text-secondary ml-6">${ps.pay_period || 'Monthly'}</span>
                      </td>
                      <td class="py-3 px-4 font-medium">${formatINR(ps.monthly_gross)}</td>
                      <td class="py-3 px-4 font-bold text-[#065F46]">${formatINR(ps.in_hand_monthly)}</td>
                      <td class="py-3 px-4">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ps.status === 'paid' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEF3C7] text-[#92400E]'}">
                          ${ps.status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-right">
                        <button class="profile-view-ps bg-primary/10 hover:bg-primary text-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors" data-id="${ps._id}">
                          View & Print
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                  ${payslips.length === 0 ? `
                    <tr>
                      <td colspan="5" class="py-8 text-center text-secondary">No payslips generated yet. Click "Generate New Payslip" above.</td>
                    </tr>
                  ` : ''}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div id="profile-modal-root"></div>
      `;

      // Wire edit salary package
      document.getElementById('edit-salary-pkg-btn')?.addEventListener('click', () => {
        openEditSalaryModal(emp);
      });

      // Wire generate payslip
      document.getElementById('profile-generate-ps-btn')?.addEventListener('click', async () => {
        try {
          await api.payroll.generate({ employee_id: id, month_year: 'August 2026' });
          showToast('Payslip generated successfully for August 2026', 'success');
          renderPayrollTab(content);
        } catch (err) {
          showToast('Failed: ' + err.message, 'error');
        }
      });

      // Wire view payslip
      document.querySelectorAll('.profile-view-ps').forEach(btn => {
        btn.addEventListener('click', async () => {
          await showPayslipPopup(btn.dataset.id);
        });
      });

    } catch (err) {
      content.innerHTML = `<div class="p-8 text-center text-error">Failed to load salary details: ${err.message}</div>`;
    }
  }

  function openEditSalaryModal(emp) {
    const modalRoot = document.getElementById('profile-modal-root');
    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box max-w-md w-full p-6 bg-white rounded-2xl shadow-2xl relative">
          <div class="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
            <h3 class="font-title-lg text-title-lg font-bold text-on-surface">Update Annual CTC</h3>
            <button id="close-ctc-modal" class="text-secondary hover:text-on-surface"><span class="material-symbols-outlined">close</span></button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block font-label-md text-label-md text-secondary mb-1">Annual CTC (₹) *</label>
              <input type="number" id="modal-ctc-input" value="${emp.ctc_annual || 600000}" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-bold text-lg focus:border-primary outline-none"/>
            </div>
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button id="cancel-ctc-modal" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface text-sm">Cancel</button>
              <button id="save-ctc-modal" class="bg-primary text-on-primary px-5 py-2 rounded-lg font-title-md text-sm hover:bg-on-primary-fixed-variant shadow-soft">Update Package</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('close-ctc-modal').onclick = () => modalRoot.innerHTML = '';
    document.getElementById('cancel-ctc-modal').onclick = () => modalRoot.innerHTML = '';
    document.getElementById('save-ctc-modal').onclick = async () => {
      const newCtc = Number(document.getElementById('modal-ctc-input').value);
      try {
        await api.payroll.updateEmployee(id, { ctc_annual: newCtc });
        showToast('Compensation package updated', 'success');
        modalRoot.innerHTML = '';
        const content = document.getElementById('tab-content');
        renderPayrollTab(content);
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    };
  }

  async function showPayslipPopup(psId) {
    const modalRoot = document.getElementById('profile-modal-root');
    try {
      const data = await api.payroll.getPayslip(psId);
      const { payslip, company } = data;

      function formatINR(val) {
        if (val === undefined || val === null || isNaN(val)) return '₹0';
        return '₹' + Number(val).toLocaleString('en-IN');
      }

      modalRoot.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-box max-w-2xl w-full p-8 bg-white rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center pb-4 border-b border-gray-200 mb-4 print:hidden">
              <span class="font-title-lg font-bold text-on-surface">Payslip – ${payslip.month_year}</span>
              <div class="flex gap-2">
                <button id="ps-popup-print" class="bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">print</span> Print</button>
                <button id="ps-popup-close" class="text-secondary p-1"><span class="material-symbols-outlined">close</span></button>
              </div>
            </div>

            <div class="border border-gray-300 rounded-xl p-6 bg-[#fafafa]">
              <div class="flex justify-between items-start pb-4 border-b-2 border-primary">
                <div>
                  <h2 class="text-xl font-bold text-primary">${company.name}</h2>
                  <p class="text-xs text-secondary">${company.address}</p>
                </div>
                <div class="text-right">
                  <span class="bg-primary text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded">Payslip</span>
                  <p class="font-bold text-sm mt-1">${payslip.month_year}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 py-3 border-b border-gray-200 text-xs">
                <div><strong>Employee:</strong> ${payslip.employee_name} (${payslip.emp_code})</div>
                <div><strong>Designation:</strong> ${payslip.designation}</div>
                <div><strong>Department:</strong> ${payslip.department}</div>
                <div><strong>Bank:</strong> ${payslip.bank_name} (${payslip.bank_account_number || '—'})</div>
              </div>

              <div class="grid grid-cols-2 gap-4 my-4 text-xs">
                <div class="bg-white p-3 rounded border border-gray-200">
                  <span class="font-bold text-primary block mb-2 uppercase">Earnings</span>
                  <div class="flex justify-between py-1"><span>Basic Salary</span><span>${formatINR(payslip.basic_salary)}</span></div>
                  <div class="flex justify-between py-1"><span>HRA</span><span>${formatINR(payslip.hra)}</span></div>
                  <div class="flex justify-between py-1"><span>Special Allowance</span><span>${formatINR(payslip.special_allowance)}</span></div>
                  <div class="flex justify-between pt-2 font-bold border-t border-gray-100"><span>Gross</span><span>${formatINR(payslip.monthly_gross)}</span></div>
                </div>
                <div class="bg-white p-3 rounded border border-gray-200">
                  <span class="font-bold text-error block mb-2 uppercase">Deductions</span>
                  <div class="flex justify-between py-1"><span>PF</span><span>${formatINR(payslip.pf_deduction)}</span></div>
                  <div class="flex justify-between py-1"><span>Tax (TDS)</span><span>${formatINR(payslip.tax_deduction)}</span></div>
                  <div class="flex justify-between py-1"><span>PT</span><span>${formatINR(payslip.prof_tax || 200)}</span></div>
                  <div class="flex justify-between pt-2 font-bold border-t border-gray-100"><span>Total Deductions</span><span>${formatINR(payslip.total_deductions)}</span></div>
                </div>
              </div>

              <div class="bg-[#D1FAE5] p-3 rounded-lg flex justify-between items-center">
                <span class="text-xs font-bold text-[#065F46] uppercase">Net In-Hand Pay</span>
                <span class="text-2xl font-extrabold text-[#065F46]">${formatINR(payslip.in_hand_monthly)}</span>
              </div>
            </div>
          </div>
        </div>
      `;

      document.getElementById('ps-popup-close').onclick = () => modalRoot.innerHTML = '';
      document.getElementById('ps-popup-print').onclick = () => window.print();
    } catch (err) {
      showToast('Error loading payslip: ' + err.message, 'error');
    }
  }
}

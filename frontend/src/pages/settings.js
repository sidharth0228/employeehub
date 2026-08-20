import api from '../api.js';
import { navigate } from '../router.js';
import { renderSidebar, attachSidebarEvents } from '../components/sidebar.js';
import { renderHeader, timeAgo } from '../components/header.js';
import { showToast, showModal } from '../components/toast.js';

export default async function settingsPage() {
  const app = document.getElementById('app');
  let activeTab = 'general';

  app.innerHTML = `
    ${renderSidebar('/settings')}
    ${renderHeader('Settings')}
    <main class="ml-[260px] mt-header_height w-full p-2xl pb-32 max-w-[1100px]">
      <!-- Tabs -->
      <div class="flex gap-1 mb-xl border-b border-outline-variant overflow-x-auto">
        ${[
          { id: 'general', label: 'Organization', icon: 'business' },
          { id: 'leave', label: 'Leave Policy', icon: 'event_busy' },
          { id: 'documents', label: 'Document Categories', icon: 'folder_managed' },
          { id: 'activity', label: 'Activity Log', icon: 'history' },
        ].map(t => `
          <button class="settings-tab px-5 py-3 font-title-md text-title-md border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'}" data-tab="${t.id}">
            <span class="material-symbols-outlined text-[18px]">${t.icon}</span>${t.label}
          </button>
        `).join('')}
      </div>
      <div id="settings-content"></div>
    </main>
  `;

  attachSidebarEvents();

  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      document.querySelectorAll('.settings-tab').forEach(t => {
        t.className = `settings-tab px-5 py-3 font-title-md text-title-md border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${t.dataset.tab === activeTab ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'}`;
      });
      renderTab();
    });
  });

  async function renderTab() {
    const content = document.getElementById('settings-content');
    if (!content) return;

    if (activeTab === 'general') await renderGeneral(content);
    else if (activeTab === 'leave') await renderLeavePolicy(content);
    else if (activeTab === 'documents') await renderDocCategories(content);
    else if (activeTab === 'activity') await renderActivity(content);
  }

  async function renderGeneral(content) {
    content.innerHTML = `<div class="flex justify-center"><span class="material-symbols-outlined text-primary text-3xl animate-spin">autorenew</span></div>`;
    let settings = {};
    try { settings = await api.settings.get(); } catch {}

    content.innerHTML = `
      <div class="bg-surface rounded-xl border border-outline-variant shadow-soft p-xl max-w-2xl">
        <div class="flex justify-between items-center mb-xl">
          <h3 class="font-title-lg text-title-lg text-on-surface">Organization Settings</h3>
          <button id="save-general-btn" class="bg-primary text-on-primary px-5 py-2 rounded-lg font-title-md text-title-md hover:bg-on-primary-fixed-variant transition-colors shadow-soft">Save Changes</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
          ${settingInput('Organization Name', 'org_name', settings.org_name || '')}
          ${settingInput('HR Email', 'org_email', settings.org_email || '', 'email')}
          ${settingInput('Phone Number', 'org_phone', settings.org_phone || '')}
          ${settingInput('Website', 'org_website', settings.org_website || '', 'url')}
        </div>
        <div class="mt-md">
          ${settingInput('Address', 'org_address', settings.org_address || '')}
        </div>
      </div>
    `;

    document.getElementById('save-general-btn').addEventListener('click', async () => {
      const updates = {};
      document.querySelectorAll('[data-setting]').forEach(el => { updates[el.dataset.setting] = el.value; });
      try {
        await api.settings.update(updates);
        showToast('Settings saved successfully', 'success');
      } catch (err) { showToast('Save failed: ' + err.message, 'error'); }
    });
  }

  async function renderLeavePolicy(content) {
    content.innerHTML = `<div class="flex justify-center"><span class="material-symbols-outlined text-primary text-3xl animate-spin">autorenew</span></div>`;
    let settings = {};
    try { settings = await api.settings.get(); } catch {}

    content.innerHTML = `
      <div class="bg-surface rounded-xl border border-outline-variant shadow-soft p-xl max-w-2xl">
        <div class="flex justify-between items-center mb-xl">
          <h3 class="font-title-lg text-title-lg text-on-surface">Leave Policy Settings</h3>
          <button id="save-leave-btn" class="bg-primary text-on-primary px-5 py-2 rounded-lg font-title-md text-title-md hover:bg-on-primary-fixed-variant transition-colors shadow-soft">Save Policy</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-md">
          ${settingInput('Annual Leave Quota (days/year)', 'leave_annual_quota', settings.leave_annual_quota || '21', 'number')}
          ${settingInput('Sick Leave Quota (days/year)', 'leave_sick_quota', settings.leave_sick_quota || '10', 'number')}
          ${settingInput('Casual Leave Quota (days/year)', 'leave_casual_quota', settings.leave_casual_quota || '7', 'number')}
        </div>
        <p class="mt-md font-body-md text-secondary flex items-center gap-2">
          <span class="material-symbols-outlined text-[16px]">info</span>
          These quotas are used for leave planning and reports.
        </p>
      </div>
    `;

    document.getElementById('save-leave-btn').addEventListener('click', async () => {
      const updates = {};
      document.querySelectorAll('[data-setting]').forEach(el => { updates[el.dataset.setting] = el.value; });
      try {
        await api.settings.update(updates);
        showToast('Leave policy saved', 'success');
      } catch (err) { showToast('Save failed: ' + err.message, 'error'); }
    });
  }

  async function renderDocCategories(content) {
    content.innerHTML = `<div class="flex justify-center"><span class="material-symbols-outlined text-primary text-3xl animate-spin">autorenew</span></div>`;
    let cats = [];
    try { cats = await api.categories.list(); } catch {}

    content.innerHTML = `
      <div class="bg-surface rounded-xl border border-outline-variant shadow-soft overflow-hidden">
        <div class="p-md border-b border-outline-variant flex justify-between items-center">
          <h3 class="font-title-lg text-title-lg text-on-surface">Document Categories (${cats.length})</h3>
          <button id="add-cat-btn" class="bg-primary text-on-primary px-4 py-2 rounded-lg font-title-md text-title-md text-sm hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">add</span>Add Category
          </button>
        </div>

        <!-- Add/Edit form (hidden) -->
        <div id="cat-form" class="hidden p-md border-b border-outline-variant bg-surface-container-low">
          <h4 class="font-title-md text-on-surface mb-md" id="cat-form-title">Add New Category</h4>
          <input type="hidden" id="cat-edit-id"/>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-md mb-md">
            <div>
              <label class="block font-label-md text-label-md text-secondary mb-1">Category Name *</label>
              <input type="text" id="cat-name" placeholder="e.g., Passport" class="w-full bg-white border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"/>
            </div>
            <div>
              <label class="block font-label-md text-label-md text-secondary mb-1">Description</label>
              <input type="text" id="cat-desc" placeholder="Optional description" class="w-full bg-white border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"/>
            </div>
            <div class="flex flex-col justify-end">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" id="cat-required" class="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"/>
                <span class="font-body-md text-body-md text-on-surface">Required for onboarding</span>
              </label>
            </div>
          </div>
          <div class="flex gap-sm">
            <button id="cat-save-btn" class="bg-primary text-on-primary px-4 py-2 rounded-lg font-title-md text-title-md text-sm hover:bg-on-primary-fixed-variant transition-colors">Save</button>
            <button id="cat-cancel-btn" class="bg-surface border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-title-md text-title-md text-sm hover:bg-surface-container transition-colors">Cancel</button>
          </div>
        </div>

        ${cats.length === 0 ? `
          <div class="p-8 text-center">
            <span class="material-symbols-outlined text-4xl text-secondary mb-3">folder_open</span>
            <p class="font-body-md text-secondary">No document categories yet</p>
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b border-outline-variant">
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Category</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Description</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider">Required</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#F3F4F6] font-body-md text-on-surface">
                ${cats.map(c => `
                  <tr class="hover:bg-surface-container-low transition-colors" data-cat-id="${c._id}">
                    <td class="py-3 px-4 font-medium">${c.name}</td>
                    <td class="py-3 px-4 text-secondary">${c.description || '—'}</td>
                    <td class="py-3 px-4">
                      ${c.is_required ? '<span class="bg-[#D1FAE5] text-[#065F46] text-xs font-medium px-2 py-0.5 rounded-full">Required</span>' : '<span class="bg-[#F3F4F6] text-[#374151] text-xs font-medium px-2 py-0.5 rounded-full">Optional</span>'}
                    </td>
                    <td class="py-3 px-4 text-right">
                      <div class="flex gap-3 justify-end">
                        <button class="cat-edit-btn text-primary hover:underline font-medium text-sm" data-id="${c._id}" data-name="${c.name}" data-desc="${c.description || ''}" data-req="${c.is_required}">Edit</button>
                        <button class="cat-delete-btn text-error hover:underline font-medium text-sm" data-id="${c._id}">Delete</button>
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

    // Add button
    document.getElementById('add-cat-btn').addEventListener('click', () => {
      const form = document.getElementById('cat-form');
      document.getElementById('cat-form-title').textContent = 'Add New Category';
      document.getElementById('cat-edit-id').value = '';
      document.getElementById('cat-name').value = '';
      document.getElementById('cat-desc').value = '';
      document.getElementById('cat-required').checked = false;
      form.classList.toggle('hidden');
    });

    document.getElementById('cat-cancel-btn').addEventListener('click', () => {
      document.getElementById('cat-form').classList.add('hidden');
    });

    document.getElementById('cat-save-btn').addEventListener('click', async () => {
      const name = document.getElementById('cat-name').value.trim();
      if (!name) { showToast('Category name is required', 'error'); return; }

      const payload = {
        name,
        description: document.getElementById('cat-desc').value,
        is_required: document.getElementById('cat-required').checked,
      };
      const editId = document.getElementById('cat-edit-id').value;

      try {
        if (editId) {
          await api.categories.update(editId, payload);
          showToast('Category updated', 'success');
        } else {
          await api.categories.create(payload);
          showToast('Category added', 'success');
        }
        renderTab();
      } catch (err) { showToast('Failed: ' + err.message, 'error'); }
    });

    // Edit buttons
    document.querySelectorAll('.cat-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('cat-form').classList.remove('hidden');
        document.getElementById('cat-form-title').textContent = 'Edit Category';
        document.getElementById('cat-edit-id').value = btn.dataset.id;
        document.getElementById('cat-name').value = btn.dataset.name;
        document.getElementById('cat-desc').value = btn.dataset.desc;
        document.getElementById('cat-required').checked = btn.dataset.req === 'true';
      });
    });

    // Delete buttons
    document.querySelectorAll('.cat-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showModal({
          title: 'Delete Category',
          body: 'Are you sure you want to delete this document category?',
          confirmText: 'Delete',
          danger: true,
          onConfirm: async () => {
            try {
              await api.categories.delete(btn.dataset.id);
              showToast('Category deleted', 'success');
              renderTab();
            } catch (err) { showToast('Failed: ' + err.message, 'error'); }
          }
        });
      });
    });
  }

  async function renderActivity(content) {
    content.innerHTML = `<div class="flex justify-center"><span class="material-symbols-outlined text-primary text-3xl animate-spin">autorenew</span></div>`;
    let logs = [];
    try { logs = await api.settings.activityLog(); } catch {}

    const icons = { verified: 'verified', added: 'add_circle', approved: 'check_circle', rejected: 'cancel', uploaded: 'upload_file', onboarding_update: 'assignment_ind', pending: 'hourglass_empty' };
    const colors = { verified: 'text-[#065F46] bg-[#D1FAE5]', added: 'text-primary bg-[#D0E1FB]', approved: 'text-[#065F46] bg-[#D1FAE5]', rejected: 'text-error bg-[#FEE2E2]', uploaded: 'text-[#1E40AF] bg-[#DBEAFE]', default: 'text-secondary bg-surface-container' };

    content.innerHTML = `
      <div class="bg-surface rounded-xl border border-outline-variant shadow-soft overflow-hidden">
        <div class="p-md border-b border-outline-variant">
          <h3 class="font-title-lg text-title-lg text-on-surface">Activity Log (Last 50 actions)</h3>
        </div>
        ${logs.length === 0 ? `
          <div class="p-8 text-center">
            <span class="material-symbols-outlined text-4xl text-secondary mb-3">history</span>
            <p class="font-body-md text-secondary">No activity recorded yet</p>
          </div>
        ` : `
          <div class="divide-y divide-[#F3F4F6]">
            ${logs.map(l => {
              const colorClass = colors[l.action] || colors.default;
              return `
                <div class="flex items-start gap-4 p-4 hover:bg-surface-container-low transition-colors">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${colorClass}">
                    <span class="material-symbols-outlined text-[18px]">${icons[l.action] || 'history'}</span>
                  </div>
                  <div class="flex-1">
                    <p class="font-body-md text-on-surface">${l.details}</p>
                    <p class="text-xs text-secondary mt-1">${l.actor_name || 'System'} · ${timeAgo(l.created_at)}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  function settingInput(label, key, value, type = 'text') {
    return `
      <div>
        <label class="block font-label-md text-label-md text-secondary mb-1">${label}</label>
        <input type="${type}" data-setting="${key}" value="${value}"
          class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          placeholder="${label}"/>
      </div>
    `;
  }

  await renderTab();
}

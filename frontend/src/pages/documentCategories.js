import api from '../api.js';
import { navigate } from '../router.js';
import { renderSidebar, attachSidebarEvents } from '../components/sidebar.js';
import { renderSearchHeader } from '../components/header.js';
import { showToast, showModal } from '../components/toast.js';

export default async function documentCategoriesPage() {
  const app = document.getElementById('app');
  let currentTab = 'all'; // 'all', 'required', 'optional'
  let categories = [];
  let searchQuery = '';

  app.innerHTML = `
    ${renderSidebar('/settings')}
    ${renderSearchHeader('Document Categories', 'Find categories...')}
    <main class="ml-[260px] mt-header_height w-full p-2xl pb-32 max-w-[1440px]">
      <!-- Page Header Section -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-md mb-2xl">
        <div>
          <h2 class="font-headline-lg text-headline-lg text-on-surface">Document Categories</h2>
          <p class="font-body-md text-body-md text-on-surface-variant mt-xs max-w-2xl">
            Configure the documents required for employees and define which documents are mandatory based on specific conditions.
          </p>
        </div>
        <div>
          <button id="add-cat-btn" class="bg-primary text-on-primary font-title-md text-title-md px-md py-sm rounded-DEFAULT flex items-center gap-xs hover:bg-on-primary-fixed-variant transition-colors shadow-soft">
            <span class="material-symbols-outlined text-[20px]">add</span>
            Add Document Category
          </button>
        </div>
      </div>

      <!-- Filters & Search Section -->
      <div class="flex flex-col sm:flex-row gap-md items-center justify-between bg-surface-container-lowest p-md rounded-lg border border-surface-variant shadow-soft mb-xl">
        <div class="flex gap-sm w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <button class="cat-filter-btn px-md py-[6px] rounded-full font-label-md text-label-md whitespace-nowrap bg-primary text-on-primary" data-tab="all">All</button>
          <button class="cat-filter-btn px-md py-[6px] rounded-full font-label-md text-label-md whitespace-nowrap bg-surface-container-low text-on-surface-variant border border-outline-variant hover:bg-surface-container transition-colors" data-tab="required">Required</button>
          <button class="cat-filter-btn px-md py-[6px] rounded-full font-label-md text-label-md whitespace-nowrap bg-surface-container-low text-on-surface-variant border border-outline-variant hover:bg-surface-container transition-colors" data-tab="optional">Optional</button>
        </div>
        <div class="relative w-full sm:w-64">
          <span class="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input id="cat-search" class="w-full pl-lg pr-sm py-sm rounded-DEFAULT border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-md text-sm transition-all h-[36px]" placeholder="Find categories..." type="text"/>
        </div>
      </div>

      <!-- Add/Edit Category Modal / Form Drawer -->
      <div id="cat-modal-wrap" class="hidden mb-xl bg-surface-container-lowest border border-outline-variant rounded-xl p-xl shadow-soft">
        <div class="flex justify-between items-center mb-lg">
          <h3 class="font-title-lg text-title-lg text-on-surface" id="cat-modal-title">Add Document Category</h3>
          <button id="cat-close-btn" class="text-secondary hover:text-on-surface"><span class="material-symbols-outlined">close</span></button>
        </div>
        <input type="hidden" id="edit-cat-id" />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-md mb-md">
          <div>
            <label class="block font-label-md text-label-md text-secondary mb-1">Document Category Name *</label>
            <input type="text" id="cat-name-input" placeholder="e.g., Aadhaar Card, Passport, Degree Certificate" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"/>
          </div>
          <div>
            <label class="block font-label-md text-label-md text-secondary mb-1">Description</label>
            <input type="text" id="cat-desc-input" placeholder="Purpose or compliance notes" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"/>
          </div>
        </div>
        <div class="flex items-center gap-2 mb-lg">
          <input type="checkbox" id="cat-req-input" class="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"/>
          <label for="cat-req-input" class="font-body-md text-body-md text-on-surface cursor-pointer">Mark as mandatory / required for employee onboarding</label>
        </div>
        <div class="flex gap-sm">
          <button id="cat-save-btn" class="bg-primary text-on-primary px-5 py-2 rounded-lg font-title-md text-title-md hover:bg-on-primary-fixed-variant transition-colors shadow-soft">Save Category</button>
          <button id="cat-cancel-btn" class="bg-surface border border-outline-variant text-on-surface px-5 py-2 rounded-lg font-title-md text-title-md hover:bg-surface-container transition-colors">Cancel</button>
        </div>
      </div>

      <!-- Categories Table Section -->
      <div id="cat-table-wrap" class="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-soft overflow-hidden">
        <div class="flex items-center justify-center p-12">
          <span class="material-symbols-outlined text-primary text-4xl animate-spin">autorenew</span>
        </div>
      </div>
    </main>
  `;

  attachSidebarEvents();

  // Load categories
  async function loadCategories() {
    try {
      categories = await api.categories.list();
      renderTable();
    } catch (err) {
      showToast('Failed to load categories: ' + err.message, 'error');
    }
  }

  function getFilteredCategories() {
    return categories.filter(c => {
      if (currentTab === 'required' && !c.is_required) return false;
      if (currentTab === 'optional' && c.is_required) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (c.name || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
      }
      return true;
    });
  }

  function renderTable() {
    const wrap = document.getElementById('cat-table-wrap');
    if (!wrap) return;

    const filtered = getFilteredCategories();

    if (filtered.length === 0) {
      wrap.innerHTML = `
        <div class="p-12 text-center">
          <span class="material-symbols-outlined text-5xl text-secondary mb-3">folder_open</span>
          <p class="font-title-md text-on-surface mb-1">No categories found</p>
          <p class="font-body-md text-secondary">Try changing the filter or add a new category above</p>
        </div>
      `;
      return;
    }

    wrap.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-low border-b border-surface-variant">
              <th class="py-sm px-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Document Details</th>
              <th class="py-sm px-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold w-32">Status</th>
              <th class="py-sm px-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Description</th>
              <th class="py-sm px-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-variant">
            ${filtered.map(c => `
              <tr class="hover:bg-surface-container-low transition-colors group">
                <td class="py-md px-md align-top">
                  <div class="flex items-start gap-sm">
                    <div class="mt-xs text-primary">
                      <span class="material-symbols-outlined text-[24px]">description</span>
                    </div>
                    <div>
                      <div class="flex items-center gap-xs">
                        <p class="font-title-md text-title-md text-on-surface font-semibold">${c.name}</p>
                        ${c.is_required ? `<span class="material-symbols-outlined text-[16px] text-amber-500" style="font-variation-settings: 'FILL' 1;" title="Mandatory">star</span>` : ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="py-md px-md align-top">
                  ${c.is_required ? `
                    <span class="inline-flex items-center px-[8px] py-[4px] rounded-full text-[11px] font-semibold bg-[#D1FAE5] text-[#065F46] leading-none">
                      Required
                    </span>
                  ` : `
                    <span class="inline-flex items-center px-[8px] py-[4px] rounded-full text-[11px] font-semibold bg-surface-container text-secondary leading-none">
                      Optional
                    </span>
                  `}
                </td>
                <td class="py-md px-md align-top">
                  <p class="font-body-md text-body-md text-on-surface-variant">${c.description || '—'}</p>
                </td>
                <td class="py-md px-md align-top text-right">
                  <div class="flex gap-2 justify-end">
                    <button class="edit-cat-btn text-primary hover:underline font-medium text-sm" data-id="${c._id}" data-name="${c.name}" data-desc="${c.description || ''}" data-req="${c.is_required}">Edit</button>
                    <button class="del-cat-btn text-error hover:underline font-medium text-sm" data-id="${c._id}" data-name="${c.name}">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Attach row edit/delete actions
    document.querySelectorAll('.edit-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('cat-modal-wrap').classList.remove('hidden');
        document.getElementById('cat-modal-title').textContent = 'Edit Category';
        document.getElementById('edit-cat-id').value = btn.dataset.id;
        document.getElementById('cat-name-input').value = btn.dataset.name;
        document.getElementById('cat-desc-input').value = btn.dataset.desc;
        document.getElementById('cat-req-input').checked = btn.dataset.req === 'true' || btn.dataset.req === true;
        document.getElementById('cat-name-input').focus();
      });
    });

    document.querySelectorAll('.del-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showModal({
          title: 'Delete Document Category',
          body: `Are you sure you want to delete category <strong>${btn.dataset.name}</strong>?`,
          confirmText: 'Delete',
          danger: true,
          onConfirm: async () => {
            try {
              await api.categories.delete(btn.dataset.id);
              showToast('Category deleted', 'success');
              await loadCategories();
            } catch (err) { showToast('Delete failed: ' + err.message, 'error'); }
          }
        });
      });
    });
  }

  // Filter tabs
  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      document.querySelectorAll('.cat-filter-btn').forEach(b => {
        if (b.dataset.tab === currentTab) {
          b.className = 'cat-filter-btn px-md py-[6px] rounded-full font-label-md text-label-md whitespace-nowrap bg-primary text-on-primary';
        } else {
          b.className = 'cat-filter-btn px-md py-[6px] rounded-full font-label-md text-label-md whitespace-nowrap bg-surface-container-low text-on-surface-variant border border-outline-variant hover:bg-surface-container transition-colors';
        }
      });
      renderTable();
    });
  });

  // Search input
  document.getElementById('cat-search')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTable();
  });

  // Add button
  document.getElementById('add-cat-btn').addEventListener('click', () => {
    const modal = document.getElementById('cat-modal-wrap');
    document.getElementById('cat-modal-title').textContent = 'Add Document Category';
    document.getElementById('edit-cat-id').value = '';
    document.getElementById('cat-name-input').value = '';
    document.getElementById('cat-desc-input').value = '';
    document.getElementById('cat-req-input').checked = true;
    modal.classList.remove('hidden');
    document.getElementById('cat-name-input').focus();
  });

  document.getElementById('cat-close-btn').addEventListener('click', () => {
    document.getElementById('cat-modal-wrap').classList.add('hidden');
  });
  document.getElementById('cat-cancel-btn').addEventListener('click', () => {
    document.getElementById('cat-modal-wrap').classList.add('hidden');
  });

  document.getElementById('cat-save-btn').addEventListener('click', async () => {
    const name = document.getElementById('cat-name-input').value.trim();
    if (!name) { showToast('Category name is required', 'error'); return; }

    const payload = {
      name,
      description: document.getElementById('cat-desc-input').value.trim(),
      is_required: document.getElementById('cat-req-input').checked,
    };
    const editId = document.getElementById('edit-cat-id').value;

    try {
      if (editId) {
        await api.categories.update(editId, payload);
        showToast('Category updated successfully', 'success');
      } else {
        await api.categories.create(payload);
        showToast('Category added successfully', 'success');
      }
      document.getElementById('cat-modal-wrap').classList.add('hidden');
      await loadCategories();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });

  await loadCategories();
}

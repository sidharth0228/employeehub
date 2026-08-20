import api from '../api.js';
import { navigate } from '../router.js';
import { renderSidebar, attachSidebarEvents } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { showToast } from '../components/toast.js';

export default async function addEmployeePage() {
  const app = document.getElementById('app');
  let currentStep = 1;
  const totalSteps = 4;
  const formData = {};

  const stepConfig = [
    { num: 1, label: 'Personal Info', icon: 'person' },
    { num: 2, label: 'Employment', icon: 'work' },
    { num: 3, label: 'Bank & Emergency', icon: 'account_balance' },
    { num: 4, label: 'Review & Submit', icon: 'check_circle' },
  ];

  function renderShell() {
    app.innerHTML = `
      ${renderSidebar('/employees')}
      ${renderHeader('Add Employee', `
        <button id="back-btn" class="flex items-center gap-1 text-secondary hover:text-on-surface font-body-md text-body-md transition-colors ml-4">
          <span class="material-symbols-outlined text-sm">arrow_back</span> Back to Employees
        </button>
      `)}
      <main class="ml-[260px] mt-header_height w-full p-2xl pb-32">
        <div class="max-w-3xl mx-auto">
          <!-- Step Indicator -->
          <div class="flex items-center mb-2xl">
            ${stepConfig.map((s, i) => `
              <div class="flex items-center ${i < stepConfig.length - 1 ? 'flex-1' : ''}">
                <div class="flex flex-col items-center">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${currentStep > s.num ? 'bg-[#065F46] text-white' : currentStep === s.num ? 'bg-primary text-white' : 'bg-outline-variant text-secondary'}">
                    ${currentStep > s.num ? '<span class="material-symbols-outlined text-[18px]">check</span>' : s.num}
                  </div>
                  <span class="mt-1 font-label-md text-label-md ${currentStep === s.num ? 'text-primary' : 'text-secondary'} hidden sm:block whitespace-nowrap">${s.label}</span>
                </div>
                ${i < stepConfig.length - 1 ? `<div class="flex-1 h-0.5 mx-2 mt-[-18px] ${currentStep > s.num ? 'bg-[#065F46]' : 'bg-outline-variant'} transition-all"></div>` : ''}
              </div>
            `).join('')}
          </div>

          <!-- Step Content -->
          <div id="step-content" class="bg-surface rounded-xl border border-outline-variant shadow-soft p-xl"></div>

          <!-- Navigation -->
          <div class="flex justify-between mt-xl">
            <button id="prev-btn" class="bg-surface border border-outline-variant text-on-surface px-6 py-2.5 rounded-lg font-title-md text-title-md hover:bg-surface-container transition-colors flex items-center gap-2 ${currentStep === 1 ? 'invisible' : ''}">
              <span class="material-symbols-outlined text-sm">arrow_back</span>Previous
            </button>
            <button id="next-btn" class="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-title-md text-title-md hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2 shadow-soft">
              ${currentStep === totalSteps ? 'Submit Employee' : 'Next'}<span class="material-symbols-outlined text-sm">${currentStep === totalSteps ? 'check' : 'arrow_forward'}</span>
            </button>
          </div>
        </div>
      </main>
    `;

    attachSidebarEvents();
    document.getElementById('back-btn').addEventListener('click', () => navigate('/employees'));
    document.getElementById('prev-btn').addEventListener('click', () => { if (currentStep > 1) { saveCurrentStep(); currentStep--; renderShell(); } });
    document.getElementById('next-btn').addEventListener('click', handleNext);

    renderStep();
  }

  function renderStep() {
    const content = document.getElementById('step-content');

    if (currentStep === 1) {
      content.innerHTML = `
        <h3 class="font-title-lg text-title-lg text-on-surface mb-xl">Personal Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
          ${inputField('First Name *', 'first_name', 'text', formData.first_name)}
          ${inputField('Last Name *', 'last_name', 'text', formData.last_name)}
          ${inputField('Email Address *', 'email', 'email', formData.email)}
          ${inputField('Phone Number', 'phone', 'tel', formData.phone)}
          ${inputField('Date of Birth', 'date_of_birth', 'date', formData.date_of_birth)}
          ${selectField('Gender', 'gender', ['', 'Male', 'Female', 'Other', 'Prefer not to say'], formData.gender)}
          ${inputField('Nationality', 'nationality', 'text', formData.nationality)}
        </div>
        <div class="mt-md">
          ${inputField('Address', 'address', 'text', formData.address)}
        </div>
      `;
    } else if (currentStep === 2) {
      content.innerHTML = `
        <h3 class="font-title-lg text-title-lg text-on-surface mb-xl">Employment Details</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
          ${inputField('Department *', 'department', 'text', formData.department)}
          ${inputField('Designation / Job Title *', 'designation', 'text', formData.designation)}
          ${selectField('Employment Type *', 'employment_type', ['full_time', 'part_time', 'contract', 'intern'], formData.employment_type || 'full_time')}
          ${inputField('Date of Joining', 'date_of_joining', 'date', formData.date_of_joining || new Date().toISOString().split('T')[0])}
        </div>
      `;
    } else if (currentStep === 3) {
      content.innerHTML = `
        <h3 class="font-title-lg text-title-lg text-on-surface mb-xl">Bank & Emergency Contact</h3>
        <div class="mb-xl">
          <h4 class="font-title-md text-on-surface mb-md flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[20px]">account_balance</span>Bank Details</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
            ${inputField('Bank Name', 'bank_name', 'text', formData.bank_name)}
            ${inputField('Account Number', 'bank_account_number', 'text', formData.bank_account_number)}
            ${inputField('IFSC Code', 'ifsc_code', 'text', formData.ifsc_code)}
          </div>
        </div>
        <div>
          <h4 class="font-title-md text-on-surface mb-md flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[20px]">emergency</span>Emergency Contact</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
            ${inputField('Contact Name', 'emergency_contact_name', 'text', formData.emergency_contact_name)}
            ${inputField('Contact Phone', 'emergency_contact_phone', 'tel', formData.emergency_contact_phone)}
          </div>
        </div>
      `;
    } else if (currentStep === 4) {
      content.innerHTML = `
        <h3 class="font-title-lg text-title-lg text-on-surface mb-xl">Review & Submit</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-xl mb-xl">
          <div class="space-y-3">
            <h4 class="font-title-md text-primary border-b border-outline-variant pb-2">Personal Information</h4>
            ${reviewRow('Full Name', `${formData.first_name || ''} ${formData.last_name || ''}`)}
            ${reviewRow('Email', formData.email)}
            ${reviewRow('Phone', formData.phone)}
            ${reviewRow('Date of Birth', formData.date_of_birth)}
            ${reviewRow('Gender', formData.gender)}
            ${reviewRow('Nationality', formData.nationality)}
          </div>
          <div class="space-y-3">
            <h4 class="font-title-md text-primary border-b border-outline-variant pb-2">Employment</h4>
            ${reviewRow('Department', formData.department)}
            ${reviewRow('Designation', formData.designation)}
            ${reviewRow('Employment Type', formData.employment_type)}
            ${reviewRow('Date of Joining', formData.date_of_joining)}
            <h4 class="font-title-md text-primary border-b border-outline-variant pb-2 mt-4">Bank Details</h4>
            ${reviewRow('Bank', formData.bank_name)}
            ${reviewRow('Account', formData.bank_account_number)}
            ${reviewRow('IFSC', formData.ifsc_code)}
          </div>
        </div>
        <div class="p-4 bg-[#D1FAE5] rounded-xl border border-[#065F46]/20">
          <p class="font-body-md text-[#065F46] flex items-center gap-2">
            <span class="material-symbols-outlined">info</span>
            The employee will be added with <strong>Pending</strong> onboarding status. You can complete onboarding from their profile.
          </p>
        </div>
      `;
    }
  }

  function inputField(label, name, type, value = '') {
    return `
      <div>
        <label class="block font-label-md text-label-md text-secondary mb-1">${label}</label>
        <input type="${type}" name="${name}" id="field-${name}" value="${value || ''}"
          class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          placeholder="${label.replace(' *', '')}"/>
      </div>
    `;
  }

  function selectField(label, name, options, value = '') {
    return `
      <div>
        <label class="block font-label-md text-label-md text-secondary mb-1">${label}</label>
        <select name="${name}" id="field-${name}" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none">
          ${options.map(o => `<option value="${o.toLowerCase().replace(' ', '_')}" ${(value || '').toLowerCase() === o.toLowerCase() || value === o ? 'selected' : ''}>${o || 'Select...'}</option>`).join('')}
        </select>
      </div>
    `;
  }

  function reviewRow(label, value) {
    return `
      <div class="flex justify-between items-start py-1 border-b border-outline-variant/50">
        <span class="font-label-md text-label-md text-secondary">${label}</span>
        <span class="font-body-md text-on-surface text-right ml-4">${value || '—'}</span>
      </div>
    `;
  }

  function saveCurrentStep() {
    document.querySelectorAll('[id^="field-"]').forEach(el => {
      formData[el.name || el.id.replace('field-', '')] = el.value;
    });
  }

  async function handleNext() {
    saveCurrentStep();

    // Validation
    if (currentStep === 1) {
      if (!formData.first_name || !formData.last_name || !formData.email) {
        showToast('First name, last name, and email are required', 'error'); return;
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        showToast('Please enter a valid email address', 'error'); return;
      }
    }
    if (currentStep === 2) {
      if (!formData.department || !formData.designation) {
        showToast('Department and designation are required', 'error'); return;
      }
    }

    if (currentStep === totalSteps) {
      // Submit
      const btn = document.getElementById('next-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">autorenew</span> Saving...';

      try {
        const emp = await api.employees.create(formData);
        showToast(`Employee ${emp.first_name} ${emp.last_name} added successfully!`, 'success');
        navigate(`/employees/${emp._id}`);
      } catch (err) {
        showToast('Failed to create employee: ' + err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = 'Submit Employee <span class="material-symbols-outlined text-sm">check</span>';
      }
      return;
    }

    currentStep++;
    renderShell();
  }

  renderShell();
}

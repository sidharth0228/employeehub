import api from '../api.js';
import { navigate } from '../router.js';
import { renderSidebar, attachSidebarEvents } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { showToast } from '../components/toast.js';

export default async function addEmployeePage() {
  const app = document.getElementById('app');
  let currentStep = 1;
  const totalSteps = 4;
  const formData = {
    ctc_annual: 850000,
    payment_mode: 'Bank Transfer'
  };

  const stepConfig = [
    { num: 1, label: 'Personal Info', icon: 'person' },
    { num: 2, label: 'Employment', icon: 'work' },
    { num: 3, label: 'Salary & Bank', icon: 'payments' },
    { num: 4, label: 'Review & Submit', icon: 'check_circle' },
  ];

  function formatINR(val) {
    if (val === undefined || val === null || isNaN(val)) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  function renderShell() {
    app.innerHTML = `
      ${renderSidebar('/employees')}
      ${renderHeader('Add Employee', `
        <button id="back-btn" class="flex items-center gap-1 text-secondary hover:text-on-surface font-body-md text-body-md transition-colors ml-4">
          <span class="material-symbols-outlined text-sm">arrow_back</span> Back to Employees
        </button>
      `)}
      <main class="ml-[260px] mt-header_height w-full p-2xl pb-32 max-w-[1440px]">
        <div class="max-w-3xl mx-auto">
          <!-- Step Indicator -->
          <div class="flex items-center mb-2xl">
            ${stepConfig.map((s, i) => `
              <div class="flex items-center ${i < stepConfig.length - 1 ? 'flex-1' : ''}">
                <div class="flex flex-col items-center">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${currentStep > s.num ? 'bg-[#065F46] text-white' : currentStep === s.num ? 'bg-primary text-white' : 'bg-outline-variant text-secondary'}">
                    ${currentStep > s.num ? '<span class="material-symbols-outlined text-[18px]">check</span>' : s.num}
                  </div>
                  <span class="mt-1 font-label-md text-label-md ${currentStep === s.num ? 'text-primary font-bold' : 'text-secondary'} hidden sm:block whitespace-nowrap">${s.label}</span>
                </div>
                ${i < stepConfig.length - 1 ? `<div class="flex-1 h-0.5 mx-2 mt-[-18px] ${currentStep > s.num ? 'bg-[#065F46]' : 'bg-outline-variant'} transition-all"></div>` : ''}
              </div>
            `).join('')}
          </div>

          <!-- Step Content -->
          <div id="step-content" class="bg-surface rounded-xl border border-outline-variant shadow-soft p-xl"></div>

          <!-- Navigation Controls -->
          <div class="flex justify-between mt-xl">
            <button id="prev-btn" class="bg-surface border border-outline-variant text-on-surface px-6 py-2.5 rounded-lg font-title-md text-title-md hover:bg-surface-container transition-colors flex items-center gap-2 ${currentStep === 1 ? 'invisible' : ''}">
              <span class="material-symbols-outlined text-sm">arrow_back</span>Previous
            </button>
            <button id="next-btn" class="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-title-md text-title-md hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2 shadow-soft cursor-pointer">
              ${currentStep === totalSteps ? 'Complete & Submit' : 'Next Step'}<span class="material-symbols-outlined text-sm">${currentStep === totalSteps ? 'check' : 'arrow_forward'}</span>
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
          ${inputField('Nationality', 'nationality', 'text', formData.nationality || 'Indian')}
        </div>
        <div class="mt-md">
          ${inputField('Residential Address', 'address', 'text', formData.address)}
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
      const ctc = Number(formData.ctc_annual) || 850000;
      const gross = Math.round(ctc / 12);
      const inHand = Math.round(gross * 0.85);

      content.innerHTML = `
        <h3 class="font-title-lg text-title-lg text-on-surface mb-xl">Compensation & Bank Details</h3>

        <!-- Salary Package Section -->
        <div class="mb-xl p-4 bg-primary/5 rounded-xl border border-primary/20">
          <h4 class="font-title-md text-primary mb-md flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px]">payments</span>
            Salary Package & CTC
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-md mb-md">
            <div>
              <label class="block font-label-md text-label-md text-secondary mb-1">Annual CTC (₹) *</label>
              <input type="number" name="ctc_annual" id="field-ctc_annual" value="${formData.ctc_annual || 850000}" class="w-full bg-white border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-bold text-base focus:border-primary outline-none" placeholder="e.g. 1200000"/>
            </div>
            <div>
              <label class="block font-label-md text-label-md text-secondary mb-1">Payment Mode</label>
              <select name="payment_mode" id="field-payment_mode" class="w-full bg-white border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md focus:border-primary outline-none">
                <option value="Bank Transfer" ${formData.payment_mode === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                <option value="Cheque" ${formData.payment_mode === 'Cheque' ? 'selected' : ''}>Cheque</option>
                <option value="Direct Deposit" ${formData.payment_mode === 'Direct Deposit' ? 'selected' : ''}>Direct Deposit</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-primary/20">
            <div>
              <span class="text-xs text-secondary block">Monthly Gross Salary</span>
              <span class="text-base font-bold text-on-surface" id="calc-wizard-gross">${formatINR(gross)}</span>
            </div>
            <div>
              <span class="text-xs text-secondary block">Estimated In-Hand (Net)</span>
              <span class="text-base font-bold text-[#065F46]" id="calc-wizard-inhand">${formatINR(inHand)}</span>
            </div>
          </div>
        </div>

        <!-- Bank Details Section -->
        <div class="mb-xl">
          <h4 class="font-title-md text-on-surface mb-md flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[20px]">account_balance</span>
            Bank Account Details
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-md">
            ${inputField('Bank Name', 'bank_name', 'text', formData.bank_name || 'HDFC Bank')}
            ${inputField('Account Number', 'bank_account_number', 'text', formData.bank_account_number)}
            ${inputField('IFSC Code', 'ifsc_code', 'text', formData.ifsc_code)}
          </div>
        </div>

        <!-- Emergency Contact Section -->
        <div>
          <h4 class="font-title-md text-on-surface mb-md flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[20px]">emergency</span>
            Emergency Contact
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
            ${inputField('Emergency Contact Name', 'emergency_contact_name', 'text', formData.emergency_contact_name)}
            ${inputField('Emergency Contact Phone', 'emergency_contact_phone', 'tel', formData.emergency_contact_phone)}
          </div>
        </div>
      `;

      // Live calculate on CTC change
      const ctcInp = document.getElementById('field-ctc_annual');
      ctcInp?.addEventListener('input', () => {
        const c = Number(ctcInp.value) || 0;
        const g = Math.round(c / 12);
        const ih = Math.round(g * 0.85);
        document.getElementById('calc-wizard-gross').textContent = formatINR(g);
        document.getElementById('calc-wizard-inhand').textContent = formatINR(ih);
      });

    } else if (currentStep === 4) {
      const ctc = Number(formData.ctc_annual) || 850000;
      const gross = Math.round(ctc / 12);
      const inHand = Math.round(gross * 0.85);

      content.innerHTML = `
        <h3 class="font-title-lg text-title-lg text-on-surface mb-xl">Review & Confirm Onboarding Details</h3>
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
            <h4 class="font-title-md text-primary border-b border-outline-variant pb-2">Employment & Role</h4>
            ${reviewRow('Department', formData.department)}
            ${reviewRow('Designation', formData.designation)}
            ${reviewRow('Employment Type', formData.employment_type)}
            ${reviewRow('Date of Joining', formData.date_of_joining)}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-xl mb-xl">
          <div class="space-y-3">
            <h4 class="font-title-md text-primary border-b border-outline-variant pb-2">Compensation & Package</h4>
            ${reviewRow('Annual CTC', formatINR(formData.ctc_annual))}
            ${reviewRow('Monthly Gross', formatINR(gross))}
            ${reviewRow('Estimated In-Hand', formatINR(inHand))}
            ${reviewRow('Payment Mode', formData.payment_mode || 'Bank Transfer')}
          </div>
          <div class="space-y-3">
            <h4 class="font-title-md text-primary border-b border-outline-variant pb-2">Bank & Emergency</h4>
            ${reviewRow('Bank Name', formData.bank_name)}
            ${reviewRow('Account Number', formData.bank_account_number)}
            ${reviewRow('IFSC Code', formData.ifsc_code)}
            ${reviewRow('Emergency Contact', `${formData.emergency_contact_name || '—'} (${formData.emergency_contact_phone || '—'})`)}
          </div>
        </div>

        <div class="p-4 bg-[#D1FAE5] rounded-xl border border-[#065F46]/20">
          <p class="font-body-md text-[#065F46] flex items-center gap-2 text-sm">
            <span class="material-symbols-outlined text-[18px]">verified</span>
            The employee will be created with salary records auto-configured. You can manage their documents, payslips, and onboarding progress immediately.
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
        <span class="font-body-md text-on-surface text-right ml-4 font-medium">${value || '—'}</span>
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
    if (currentStep === 3) {
      if (!formData.ctc_annual || Number(formData.ctc_annual) <= 0) {
        showToast('Please enter a valid annual CTC amount', 'error'); return;
      }
    }

    if (currentStep === totalSteps) {
      // Submit
      const btn = document.getElementById('next-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">autorenew</span> Saving...';

      try {
        formData.ctc_annual = Number(formData.ctc_annual);
        const emp = await api.employees.create(formData);
        showToast(`Employee ${emp.first_name} ${emp.last_name} onboarded successfully!`, 'success');
        navigate(`/employees/${emp._id}`);
      } catch (err) {
        showToast('Failed to create employee: ' + err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = 'Complete & Submit <span class="material-symbols-outlined text-sm">check</span>';
      }
      return;
    }

    currentStep++;
    renderShell();
  }

  renderShell();
}

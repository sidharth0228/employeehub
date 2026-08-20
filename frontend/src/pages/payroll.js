import api from '../api.js';
import { navigate } from '../router.js';
import { renderSidebar, attachSidebarEvents } from '../components/sidebar.js';
import { renderSearchHeader, formatDate, avatarInitials, getAvatarColor } from '../components/header.js';
import { showToast, showModal } from '../components/toast.js';

export default async function payrollPage() {
  const app = document.getElementById('app');
  let currentMonth = 'August 2026';
  let currentDept = '';
  let searchQuery = '';
  let payrollData = null;

  app.innerHTML = `
    ${renderSidebar('/payroll')}
    ${renderSearchHeader('Payroll & Payslips', 'Search employee, department...')}
    <main class="ml-[260px] mt-header_height w-full p-2xl pb-32 max-w-[1440px]">
      <div class="flex items-center justify-center h-40">
        <span class="material-symbols-outlined text-primary text-4xl animate-spin">autorenew</span>
      </div>
    </main>
  `;
  attachSidebarEvents();

  // Helper: Number to Indian currency format
  function formatINR(val) {
    if (val === undefined || val === null) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  // Helper: Number to words (Indian numbering system)
  function numberToWords(num) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees Only' : 'Rupees Only';
    return str;
  }

  async function loadPayroll() {
    try {
      payrollData = await api.payroll.list({ month_year: currentMonth, department: currentDept, search: searchQuery });
      render();
    } catch (err) {
      showToast('Failed to load payroll: ' + err.message, 'error');
    }
  }

  function render() {
    const { employees = [], metrics = {}, months = [] } = payrollData;
    const depts = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();

    app.innerHTML = `
      ${renderSidebar('/payroll')}
      ${renderSearchHeader('Payroll & Payslips', 'Search employee, department...')}
      <main class="ml-[260px] mt-header_height w-full p-2xl pb-32 max-w-[1440px]">
        <!-- Page Title & Header Actions -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-md mb-2xl">
          <div>
            <h2 class="font-headline-lg text-headline-lg text-on-surface">Payroll & Compensation</h2>
            <p class="font-body-md text-body-md text-secondary mt-xs">
              Manage employee salary packages, CTC, in-hand calculations, and generate official payslips.
            </p>
          </div>
          <div class="flex items-center gap-sm flex-wrap">
            <select id="month-selector" class="bg-surface-container-low border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-title-md text-title-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none">
              ${months.map(m => `<option value="${m}" ${currentMonth === m ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
            <button id="generate-bulk-btn" class="bg-primary text-on-primary font-title-md text-title-md text-sm px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-on-primary-fixed-variant transition-colors shadow-soft">
              <span class="material-symbols-outlined text-[18px]">receipt</span>
              Generate ${currentMonth} Payslips
            </button>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-2xl">
          <div class="bg-surface rounded-xl border border-outline-variant p-md shadow-soft">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-[22px]">payments</span>
              </div>
              <span class="font-label-md text-secondary">Monthly Payroll</span>
            </div>
            <h3 class="font-headline-md text-on-surface font-bold">${formatINR(metrics.totalMonthlyGross || metrics.totalMonthlyPayroll)}</h3>
            <p class="text-xs text-secondary mt-1">Gross payout for ${currentMonth}</p>
          </div>

          <div class="bg-surface rounded-xl border border-outline-variant p-md shadow-soft">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-[#D1FAE5] text-[#065F46] flex items-center justify-center">
                <span class="material-symbols-outlined text-[22px]">account_balance_wallet</span>
              </div>
              <span class="font-label-md text-secondary">Net In-Hand Disbursed</span>
            </div>
            <h3 class="font-headline-md text-[#065F46] font-bold">${formatINR(metrics.totalMonthlyInHand)}</h3>
            <p class="text-xs text-secondary mt-1">Total take-home salary</p>
          </div>

          <div class="bg-surface rounded-xl border border-outline-variant p-md shadow-soft">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-secondary-container/20 text-secondary flex items-center justify-center">
                <span class="material-symbols-outlined text-[22px]">trending_up</span>
              </div>
              <span class="font-label-md text-secondary">Average Annual CTC</span>
            </div>
            <h3 class="font-headline-md text-on-surface font-bold">${formatINR(metrics.averageAnnualCtc)}</h3>
            <p class="text-xs text-secondary mt-1">Across ${metrics.totalEmployees} employees</p>
          </div>

          <div class="bg-surface rounded-xl border border-outline-variant p-md shadow-soft">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-[#FEF3C7] text-[#92400E] flex items-center justify-center">
                <span class="material-symbols-outlined text-[22px]">task_alt</span>
              </div>
              <span class="font-label-md text-secondary">Payslip Status</span>
            </div>
            <div class="flex items-baseline gap-2">
              <h3 class="font-headline-md text-on-surface font-bold">${metrics.paidCount} Paid</h3>
              <span class="text-xs text-secondary">/ ${metrics.pendingCount} Pending</span>
            </div>
            <p class="text-xs text-secondary mt-1">${Math.round((metrics.paidCount / (metrics.totalEmployees || 1)) * 100)}% Disbursed</p>
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="flex flex-col sm:flex-row gap-md items-center justify-between bg-surface p-md rounded-lg border border-outline-variant shadow-soft mb-xl">
          <div class="flex gap-sm w-full sm:w-auto items-center flex-wrap">
            <select id="payroll-dept-filter" class="bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md text-sm focus:border-primary outline-none">
              <option value="">All Departments</option>
              ${depts.map(d => `<option value="${d}" ${currentDept === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
            <span class="text-secondary text-sm font-label-md">${employees.length} Employees found</span>
          </div>
          <div class="relative w-full sm:w-64">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">search</span>
            <input id="payroll-search-input" class="w-full pl-9 pr-4 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-md text-sm" placeholder="Search employee..." type="text" value="${searchQuery}"/>
          </div>
        </div>

        <!-- Employee Compensation Table -->
        <div class="bg-surface rounded-xl border border-outline-variant shadow-soft overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b border-outline-variant">
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Employee</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Designation</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Annual CTC</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Monthly Gross</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">In-Hand / Net</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Deductions</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Status</th>
                  <th class="py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#F3F4F6] font-body-md text-on-surface">
                ${employees.map(e => {
                  const [bg, color] = getAvatarColor(e.name);
                  const isPaid = e.payslip_status === 'paid';
                  return `
                    <tr class="hover:bg-surface-container-low transition-colors">
                      <td class="py-3.5 px-4">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style="background:${bg};color:${color}">
                            ${avatarInitials(e.name)}
                          </div>
                          <div>
                            <p class="font-medium text-on-surface">${e.name}</p>
                            <p class="text-xs text-secondary">${e.employee_id} · ${e.department || 'General'}</p>
                          </div>
                        </div>
                      </td>
                      <td class="py-3.5 px-4 text-secondary text-sm">${e.designation || '—'}</td>
                      <td class="py-3.5 px-4 font-semibold text-on-surface">${formatINR(e.ctc_annual)}</td>
                      <td class="py-3.5 px-4 font-medium text-on-surface">${formatINR(e.monthly_gross)}</td>
                      <td class="py-3.5 px-4 font-bold text-[#065F46]">${formatINR(e.in_hand_monthly)}</td>
                      <td class="py-3.5 px-4 text-secondary text-sm">${formatINR(e.total_deductions)}</td>
                      <td class="py-3.5 px-4">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isPaid ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEF3C7] text-[#92400E]'}">
                          <span class="w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-[#10B981]' : 'bg-[#F59E0B]'} mr-1.5"></span>
                          ${isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td class="py-3.5 px-4 text-right">
                        <div class="flex items-center gap-2 justify-end">
                          <button class="view-payslip-btn bg-primary/10 hover:bg-primary text-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1" data-emp="${e._id}" data-ps="${e.payslip_id || ''}">
                            <span class="material-symbols-outlined text-[16px]">visibility</span>
                            Payslip
                          </button>
                          <button class="edit-salary-btn border border-outline-variant hover:bg-surface-container text-secondary hover:text-on-surface p-1.5 rounded-lg text-xs transition-colors" data-emp="${e._id}" title="Edit Salary Package">
                            <span class="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
                ${employees.length === 0 ? `
                  <tr>
                    <td colspan="8" class="py-12 text-center text-secondary">
                      <span class="material-symbols-outlined text-4xl mb-2 text-secondary">payments</span>
                      <p class="font-title-md">No compensation records found</p>
                    </td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <!-- Modal Mount Container -->
      <div id="payroll-modal-root"></div>
    `;

    attachSidebarEvents();

    // Month Selector Change
    document.getElementById('month-selector')?.addEventListener('change', (e) => {
      currentMonth = e.target.value;
      loadPayroll();
    });

    // Department Filter
    document.getElementById('payroll-dept-filter')?.addEventListener('change', (e) => {
      currentDept = e.target.value;
      loadPayroll();
    });

    // Search
    let timer;
    document.getElementById('payroll-search-input')?.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        searchQuery = e.target.value;
        loadPayroll();
      }, 300);
    });

    // Bulk Generate Payslips
    document.getElementById('generate-bulk-btn')?.addEventListener('click', async () => {
      try {
        const res = await api.payroll.generate({ month_year: currentMonth });
        showToast(res.message, 'success');
        loadPayroll();
      } catch (err) {
        showToast('Generation failed: ' + err.message, 'error');
      }
    });

    // View Payslip Modal trigger
    document.querySelectorAll('.view-payslip-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const empId = btn.dataset.emp;
        const psId = btn.dataset.ps;
        await openPayslipModal(empId, psId);
      });
    });

    // Edit Salary Package trigger
    document.querySelectorAll('.edit-salary-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const empId = btn.dataset.emp;
        await openEditPackageModal(empId);
      });
    });
  }

  // Modal: View / Print Official Payslip
  async function openPayslipModal(empId, psId) {
    const modalRoot = document.getElementById('payroll-modal-root');
    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box max-w-2xl w-full p-8 bg-white rounded-2xl shadow-2xl relative">
          <div class="flex justify-center p-8"><span class="material-symbols-outlined text-primary text-4xl animate-spin">autorenew</span></div>
        </div>
      </div>
    `;

    try {
      let data = null;
      if (psId) {
        data = await api.payroll.getPayslip(psId);
      } else {
        // Generate or get for employee
        const gen = await api.payroll.generate({ employee_id: empId, month_year: currentMonth });
        const newPsId = gen.payslips[0]._id;
        data = await api.payroll.getPayslip(newPsId);
      }

      const { payslip, employee, company } = data;
      const [bg, color] = getAvatarColor(payslip.employee_name);

      modalRoot.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-box max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 bg-white rounded-2xl shadow-2xl relative" id="printable-payslip">
            <!-- Header Actions -->
            <div class="flex justify-between items-center pb-4 border-b border-gray-200 mb-6 print:hidden">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
                <span class="font-title-lg text-title-lg font-bold text-on-surface">Employee Salary Payslip</span>
              </div>
              <div class="flex items-center gap-3">
                <button id="print-ps-btn" class="bg-primary text-on-primary px-4 py-2 rounded-lg font-title-md text-sm flex items-center gap-1.5 hover:bg-on-primary-fixed-variant transition-colors shadow-soft">
                  <span class="material-symbols-outlined text-[18px]">print</span>
                  Print / Save PDF
                </button>
                <button id="close-ps-btn" class="text-secondary hover:text-on-surface p-1 rounded-full"><span class="material-symbols-outlined text-[22px]">close</span></button>
              </div>
            </div>

            <!-- Payslip Content Sheet -->
            <div class="border border-gray-300 rounded-xl p-6 bg-[#fafafa]">
              <!-- Company Header -->
              <div class="flex justify-between items-start pb-6 border-b-2 border-primary">
                <div>
                  <h1 class="text-2xl font-bold text-primary font-headline-md">${company.name}</h1>
                  <p class="text-xs text-secondary mt-1">${company.address}</p>
                  <p class="text-xs text-secondary">${company.email} · ${company.phone}</p>
                </div>
                <div class="text-right">
                  <span class="inline-block bg-primary text-white text-xs uppercase tracking-widest font-bold px-3 py-1 rounded">Payslip</span>
                  <p class="font-bold text-on-surface text-lg mt-2">${payslip.month_year}</p>
                  <p class="text-xs text-secondary">${payslip.pay_period || 'Monthly Cycle'}</p>
                </div>
              </div>

              <!-- Employee Details Grid -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b border-gray-200 text-xs">
                <div>
                  <span class="text-secondary font-semibold uppercase block">Employee Name</span>
                  <span class="font-bold text-on-surface text-sm">${payslip.employee_name}</span>
                </div>
                <div>
                  <span class="text-secondary font-semibold uppercase block">Employee ID</span>
                  <span class="font-bold text-on-surface text-sm">${payslip.emp_code}</span>
                </div>
                <div>
                  <span class="text-secondary font-semibold uppercase block">Department</span>
                  <span class="font-bold text-on-surface text-sm">${payslip.department}</span>
                </div>
                <div>
                  <span class="text-secondary font-semibold uppercase block">Designation</span>
                  <span class="font-bold text-on-surface text-sm">${payslip.designation}</span>
                </div>
                <div>
                  <span class="text-secondary font-semibold uppercase block">Bank Name</span>
                  <span class="font-medium text-on-surface">${payslip.bank_name || 'HDFC Bank'}</span>
                </div>
                <div>
                  <span class="text-secondary font-semibold uppercase block">Account Number</span>
                  <span class="font-medium text-on-surface">${payslip.bank_account_number || '50100432198765'}</span>
                </div>
                <div>
                  <span class="text-secondary font-semibold uppercase block">IFSC Code</span>
                  <span class="font-medium text-on-surface">${payslip.ifsc_code || 'HDFC0001234'}</span>
                </div>
                <div>
                  <span class="text-secondary font-semibold uppercase block">Payment Mode</span>
                  <span class="font-medium text-on-surface">${payslip.payment_mode || 'Bank Transfer'}</span>
                </div>
              </div>

              <!-- Earnings & Deductions Table -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                <!-- Earnings Column -->
                <div class="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div class="bg-gray-100 px-4 py-2 border-b border-gray-200 font-bold text-xs uppercase tracking-wider text-on-surface">
                    Earnings
                  </div>
                  <div class="divide-y divide-gray-100 text-sm">
                    <div class="flex justify-between px-4 py-2.5">
                      <span class="text-secondary">Basic Salary</span>
                      <span class="font-semibold">${formatINR(payslip.basic_salary)}</span>
                    </div>
                    <div class="flex justify-between px-4 py-2.5">
                      <span class="text-secondary">House Rent Allowance (HRA)</span>
                      <span class="font-semibold">${formatINR(payslip.hra)}</span>
                    </div>
                    <div class="flex justify-between px-4 py-2.5">
                      <span class="text-secondary">Special / Other Allowance</span>
                      <span class="font-semibold">${formatINR(payslip.special_allowance)}</span>
                    </div>
                    <div class="flex justify-between px-4 py-3 bg-gray-50 font-bold text-primary">
                      <span>Total Gross Earnings</span>
                      <span>${formatINR(payslip.monthly_gross)}</span>
                    </div>
                  </div>
                </div>

                <!-- Deductions Column -->
                <div class="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div class="bg-gray-100 px-4 py-2 border-b border-gray-200 font-bold text-xs uppercase tracking-wider text-on-surface">
                    Deductions
                  </div>
                  <div class="divide-y divide-gray-100 text-sm">
                    <div class="flex justify-between px-4 py-2.5">
                      <span class="text-secondary">Provident Fund (PF)</span>
                      <span class="font-semibold">${formatINR(payslip.pf_deduction)}</span>
                    </div>
                    <div class="flex justify-between px-4 py-2.5">
                      <span class="text-secondary">Income Tax (TDS)</span>
                      <span class="font-semibold">${formatINR(payslip.tax_deduction)}</span>
                    </div>
                    <div class="flex justify-between px-4 py-2.5">
                      <span class="text-secondary">Professional Tax (PT)</span>
                      <span class="font-semibold">${formatINR(payslip.prof_tax || 200)}</span>
                    </div>
                    <div class="flex justify-between px-4 py-3 bg-gray-50 font-bold text-error">
                      <span>Total Deductions</span>
                      <span>${formatINR(payslip.total_deductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Net Payable Summary -->
              <div class="bg-[#D1FAE5] border border-[#065F46]/30 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span class="text-xs uppercase tracking-wider text-[#065F46] font-bold block">Net Take-Home Pay (In-Hand)</span>
                  <p class="text-xs text-secondary mt-1">Amount in words: <strong class="text-on-surface">${numberToWords(payslip.in_hand_monthly)}</strong></p>
                </div>
                <div class="text-right">
                  <span class="text-3xl font-extrabold text-[#065F46]">${formatINR(payslip.in_hand_monthly)}</span>
                  <span class="block text-[11px] text-[#065F46] font-semibold">Disbursed successfully</span>
                </div>
              </div>

              <div class="mt-6 pt-4 border-t border-gray-200 text-center text-secondary text-[11px]">
                <p>This is a computer-generated payslip and does not require a physical signature. For queries, contact ${company.email}.</p>
              </div>
            </div>
          </div>
        </div>
      `;

      document.getElementById('close-ps-btn').onclick = () => modalRoot.innerHTML = '';
      document.getElementById('print-ps-btn').onclick = () => window.print();
    } catch (err) {
      showToast('Could not load payslip: ' + err.message, 'error');
      modalRoot.innerHTML = '';
    }
  }

  // Modal: Edit Salary Package
  async function openEditPackageModal(empId) {
    const modalRoot = document.getElementById('payroll-modal-root');
    const empData = await api.payroll.getEmployee(empId);
    const emp = empData.employee;

    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box max-w-xl w-full p-6 bg-white rounded-2xl shadow-2xl relative">
          <div class="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
            <div>
              <h3 class="font-title-lg text-title-lg font-bold text-on-surface">Edit Compensation Package</h3>
              <p class="text-xs text-secondary">${emp.first_name} ${emp.last_name} (${emp.employee_id}) · ${emp.designation}</p>
            </div>
            <button id="close-edit-pkg" class="text-secondary hover:text-on-surface"><span class="material-symbols-outlined">close</span></button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block font-label-md text-label-md text-secondary mb-1">Annual CTC (₹) *</label>
              <input type="number" id="edit-ctc" value="${emp.ctc_annual || 600000}" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg font-title-md text-title-md font-bold focus:border-primary outline-none"/>
            </div>

            <div class="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <span class="text-xs text-secondary block">Calculated Monthly Gross</span>
                <span class="text-base font-bold text-on-surface" id="calc-gross">${formatINR(emp.monthly_gross)}</span>
              </div>
              <div>
                <span class="text-xs text-secondary block">Estimated In-Hand / Net</span>
                <span class="text-base font-bold text-[#065F46]" id="calc-inhand">${formatINR(emp.in_hand_monthly)}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-label-md text-xs text-secondary mb-1">Basic Salary (Monthly)</label>
                <input type="number" id="edit-basic" value="${emp.basic_salary || 25000}" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg text-sm outline-none"/>
              </div>
              <div>
                <label class="block font-label-md text-xs text-secondary mb-1">HRA (Monthly)</label>
                <input type="number" id="edit-hra" value="${emp.hra || 10000}" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg text-sm outline-none"/>
              </div>
              <div>
                <label class="block font-label-md text-xs text-secondary mb-1">PF Deduction (Monthly)</label>
                <input type="number" id="edit-pf" value="${emp.pf_deduction || 1800}" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg text-sm outline-none"/>
              </div>
              <div>
                <label class="block font-label-md text-xs text-secondary mb-1">Tax / TDS (Monthly)</label>
                <input type="number" id="edit-tax" value="${emp.tax_deduction || 0}" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg text-sm outline-none"/>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-label-md text-xs text-secondary mb-1">Bank Name</label>
                <input type="text" id="edit-bank" value="${emp.bank_name || 'HDFC Bank'}" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg text-sm outline-none"/>
              </div>
              <div>
                <label class="block font-label-md text-xs text-secondary mb-1">Account Number</label>
                <input type="text" id="edit-acc" value="${emp.bank_account_number || ''}" class="w-full bg-surface-container-low border border-outline-variant text-on-surface px-3 py-2 rounded-lg text-sm outline-none"/>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button id="cancel-edit-pkg" class="px-5 py-2 rounded-lg border border-outline-variant text-on-surface font-title-md text-sm hover:bg-surface-container">Cancel</button>
              <button id="save-edit-pkg" class="bg-primary text-on-primary px-6 py-2 rounded-lg font-title-md text-sm hover:bg-on-primary-fixed-variant shadow-soft">Save Package</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Live recalculate on changing CTC
    const ctcInput = document.getElementById('edit-ctc');
    ctcInput.addEventListener('input', () => {
      const ctc = Number(ctcInput.value) || 0;
      const gross = Math.round(ctc / 12);
      const basic = Math.round(gross * 0.5);
      const hra = Math.round(basic * 0.4);
      const pf = Math.min(1800, Math.round(basic * 0.12));
      const tax = ctc > 700000 ? Math.round((ctc - 700000) * 0.1 / 12) : 0;
      const inhand = gross - pf - tax - 200;

      document.getElementById('edit-basic').value = basic;
      document.getElementById('edit-hra').value = hra;
      document.getElementById('edit-pf').value = pf;
      document.getElementById('edit-tax').value = tax;
      document.getElementById('calc-gross').textContent = formatINR(gross);
      document.getElementById('calc-inhand').textContent = formatINR(inhand);
    });

    document.getElementById('close-edit-pkg').onclick = () => modalRoot.innerHTML = '';
    document.getElementById('cancel-edit-pkg').onclick = () => modalRoot.innerHTML = '';

    document.getElementById('save-edit-pkg').onclick = async () => {
      const payload = {
        ctc_annual: Number(ctcInput.value),
        basic_salary: Number(document.getElementById('edit-basic').value),
        hra: Number(document.getElementById('edit-hra').value),
        pf_deduction: Number(document.getElementById('edit-pf').value),
        tax_deduction: Number(document.getElementById('edit-tax').value),
        bank_name: document.getElementById('edit-bank').value,
        bank_account_number: document.getElementById('edit-acc').value,
      };

      try {
        await api.payroll.updateEmployee(empId, payload);
        showToast('Salary package updated successfully', 'success');
        modalRoot.innerHTML = '';
        loadPayroll();
      } catch (err) {
        showToast('Failed to save package: ' + err.message, 'error');
      }
    };
  }

  await loadPayroll();
}

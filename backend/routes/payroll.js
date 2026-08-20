const express = require('express');
const router = express.Router();
const { db, calculateSalaryBreakdown } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/payroll
// Returns all employees with their salary packages, CTC, in-hand, and latest payslip status
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { month_year = 'August 2026', department = '', search = '' } = req.query;

    let query = {};
    if (department) query.department = department;

    let employees = await db.employees.find(query).sort({ employee_id: 1 });

    if (search) {
      const s = search.toLowerCase();
      employees = employees.filter(e =>
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(s) ||
        (e.employee_id || '').toLowerCase().includes(s) ||
        (e.department || '').toLowerCase().includes(s) ||
        (e.designation || '').toLowerCase().includes(s)
      );
    }

    // Get payslips for selected month
    const payslips = await db.payslips.find({ month_year });
    const payslipMap = {};
    payslips.forEach(p => { payslipMap[p.employee_id] = p; });

    // Enrich employees with salary package & payslip status
    const enriched = employees.map(emp => {
      const ps = payslipMap[emp._id];
      const salary = {
        ctc_annual: emp.ctc_annual || 600000,
        monthly_gross: emp.monthly_gross || Math.round((emp.ctc_annual || 600000) / 12),
        in_hand_monthly: emp.in_hand_monthly || Math.round((emp.ctc_annual || 600000) * 0.85 / 12),
        basic_salary: emp.basic_salary || Math.round((emp.ctc_annual || 600000) * 0.5 / 12),
        hra: emp.hra || Math.round((emp.ctc_annual || 600000) * 0.2 / 12),
        special_allowance: emp.special_allowance || 0,
        pf_deduction: emp.pf_deduction || 1800,
        tax_deduction: emp.tax_deduction || 0,
        prof_tax: emp.prof_tax || 200,
        total_deductions: emp.total_deductions || 2000,
        payment_mode: emp.payment_mode || 'Bank Transfer',
        bank_name: emp.bank_name || 'HDFC Bank',
        bank_account_number: emp.bank_account_number || '—',
        ifsc_code: emp.ifsc_code || '—',
      };

      return {
        _id: emp._id,
        employee_id: emp.employee_id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        department: emp.department,
        designation: emp.designation,
        status: emp.status,
        ...salary,
        payslip_id: ps ? ps._id : null,
        payslip_status: ps ? ps.status : 'pending',
        disbursed_at: ps ? ps.disbursed_at : null
      };
    });

    // Calculate aggregated metrics
    const totalPayroll = enriched.reduce((sum, e) => sum + (e.monthly_gross || 0), 0);
    const totalInHand = enriched.reduce((sum, e) => sum + (e.in_hand_monthly || 0), 0);
    const totalCtc = enriched.reduce((sum, e) => sum + (e.ctc_annual || 0), 0);
    const avgCtc = enriched.length > 0 ? Math.round(totalCtc / enriched.length) : 0;
    const paidCount = enriched.filter(e => e.payslip_status === 'paid').length;
    const pendingCount = enriched.filter(e => e.payslip_status !== 'paid').length;

    // Available months list
    const allPayslips = await db.payslips.find({});
    const months = [...new Set(['August 2026', 'July 2026', ...allPayslips.map(p => p.month_year)])];

    res.json({
      employees: enriched,
      metrics: {
        totalEmployees: enriched.length,
        totalMonthlyPayroll: totalPayroll,
        totalMonthlyInHand: totalInHand,
        averageAnnualCtc: avgCtc,
        paidCount,
        pendingCount
      },
      months,
      currentMonth: month_year
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payroll/employee/:id
// Get employee salary details and past payslips
router.get('/employee/:id', authenticateToken, async (req, res) => {
  try {
    const employee = await db.employees.findOne({ _id: req.params.id });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const payslips = await db.payslips.find({ employee_id: req.params.id }).sort({ created_at: -1 });

    res.json({
      employee,
      payslips
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/payroll/employee/:id
// Update salary package for an employee
router.put('/employee/:id', authenticateToken, async (req, res) => {
  try {
    const employee = await db.employees.findOne({ _id: req.params.id });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const { ctc_annual, basic_salary, hra, special_allowance, pf_deduction, tax_deduction, prof_tax, in_hand_monthly, payment_mode, bank_name, bank_account_number, ifsc_code } = req.body;

    let updates = {};
    if (ctc_annual !== undefined) {
      const breakdown = calculateSalaryBreakdown(ctc_annual);
      updates = { ...breakdown };
    }

    // Allow manual overrides
    if (basic_salary !== undefined) updates.basic_salary = Number(basic_salary);
    if (hra !== undefined) updates.hra = Number(hra);
    if (special_allowance !== undefined) updates.special_allowance = Number(special_allowance);
    if (pf_deduction !== undefined) updates.pf_deduction = Number(pf_deduction);
    if (tax_deduction !== undefined) updates.tax_deduction = Number(tax_deduction);
    if (prof_tax !== undefined) updates.prof_tax = Number(prof_tax);
    if (in_hand_monthly !== undefined) updates.in_hand_monthly = Number(in_hand_monthly);
    if (payment_mode !== undefined) updates.payment_mode = payment_mode;
    if (bank_name !== undefined) updates.bank_name = bank_name;
    if (bank_account_number !== undefined) updates.bank_account_number = bank_account_number;
    if (ifsc_code !== undefined) updates.ifsc_code = ifsc_code;

    // Recalculate monthly gross & in hand if parts were overridden
    if (updates.basic_salary && updates.hra) {
      const gross = (updates.basic_salary || 0) + (updates.hra || 0) + (updates.special_allowance || 0);
      const totalDed = (updates.pf_deduction || 0) + (updates.tax_deduction || 0) + (updates.prof_tax || 0);
      updates.monthly_gross = gross;
      updates.total_deductions = totalDed;
      updates.in_hand_monthly = gross - totalDed;
    }

    updates.updated_at = new Date().toISOString();

    await db.employees.update({ _id: req.params.id }, { $set: updates });

    await db.activity_log.insert({
      actor_id: req.user.id,
      actor_name: req.user.name,
      action: 'salary_update',
      entity_type: 'employee',
      entity_id: req.params.id,
      details: `Salary package updated for ${employee.first_name} ${employee.last_name}: CTC ₹${(updates.ctc_annual || employee.ctc_annual || 0).toLocaleString('en-IN')}`,
      created_at: new Date().toISOString()
    });

    const updated = await db.employees.findOne({ _id: req.params.id });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payroll/payslip/:id
// Get single detailed payslip
router.get('/payslip/:id', authenticateToken, async (req, res) => {
  try {
    const payslip = await db.payslips.findOne({ _id: req.params.id });
    if (!payslip) return res.status(404).json({ error: 'Payslip not found' });

    const employee = await db.employees.findOne({ _id: payslip.employee_id });
    const settingsRows = await db.settings.find({});
    const settings = {};
    settingsRows.forEach(r => { settings[r.key] = r.value; });

    res.json({
      payslip,
      employee,
      company: {
        name: settings.org_name || 'EmployeeHub Inc.',
        address: settings.org_address || '123 Business Park, Mumbai, India',
        email: settings.org_email || 'hr@employeehub.com',
        phone: settings.org_phone || '+91-1234567890',
        website: settings.org_website || 'https://employeehub.com'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payroll/generate
// Generate payslips for a given month/year
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { month_year, employee_id } = req.body;
    if (!month_year) return res.status(400).json({ error: 'Month and year are required (e.g. "August 2026")' });

    let targetEmployees = [];
    if (employee_id) {
      const emp = await db.employees.findOne({ _id: employee_id });
      if (!emp) return res.status(404).json({ error: 'Employee not found' });
      targetEmployees = [emp];
    } else {
      targetEmployees = await db.employees.find({ status: { $in: ['active', 'on_leave'] } });
    }

    const generated = [];
    for (const emp of targetEmployees) {
      const breakdown = calculateSalaryBreakdown(emp.ctc_annual || 600000);

      // Check if payslip already exists
      const existing = await db.payslips.findOne({ employee_id: emp._id, month_year });
      if (existing) {
        await db.payslips.update({ _id: existing._id }, {
          $set: {
            ...breakdown,
            employee_name: `${emp.first_name} ${emp.last_name}`,
            emp_code: emp.employee_id,
            department: emp.department,
            designation: emp.designation,
            bank_name: emp.bank_name || 'HDFC Bank',
            bank_account_number: emp.bank_account_number || '—',
            ifsc_code: emp.ifsc_code || '—',
            payment_mode: emp.payment_mode || 'Bank Transfer',
            updated_at: new Date().toISOString()
          }
        });
        generated.push(await db.payslips.findOne({ _id: existing._id }));
      } else {
        const doc = await db.payslips.insert({
          employee_id: emp._id,
          employee_name: `${emp.first_name} ${emp.last_name}`,
          emp_code: emp.employee_id,
          department: emp.department,
          designation: emp.designation,
          month_year,
          pay_period: `${month_year} Pay Cycle`,
          ...breakdown,
          bank_name: emp.bank_name || 'HDFC Bank',
          bank_account_number: emp.bank_account_number || '—',
          ifsc_code: emp.ifsc_code || '—',
          payment_mode: emp.payment_mode || 'Bank Transfer',
          status: 'paid',
          disbursed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
        generated.push(doc);
      }
    }

    await db.activity_log.insert({
      actor_id: req.user.id,
      actor_name: req.user.name,
      action: 'payslip_generated',
      entity_type: 'payroll',
      entity_id: null,
      details: `Generated ${generated.length} payslip(s) for ${month_year}`,
      created_at: new Date().toISOString()
    });

    res.json({ message: `Successfully generated ${generated.length} payslips for ${month_year}`, count: generated.length, payslips: generated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/payroll/payslip/:id/status
// Mark payslip as paid / pending / processing
router.put('/payslip/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['paid', 'pending', 'processing'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const ps = await db.payslips.findOne({ _id: req.params.id });
    if (!ps) return res.status(404).json({ error: 'Payslip not found' });

    await db.payslips.update({ _id: req.params.id }, {
      $set: {
        status,
        disbursed_at: status === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }
    });

    const updated = await db.payslips.findOne({ _id: req.params.id });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

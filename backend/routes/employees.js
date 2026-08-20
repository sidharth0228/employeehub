const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/employees
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search = '', status = '', department = '', page = 1, limit = 20 } = req.query;
    let query = {};

    if (status) query.status = status;
    if (department) query.department = department;

    let employees = await db.employees.find(query).sort({ created_at: -1 });

    // JS-side search filter (NeDB has limited regex support)
    if (search) {
      const s = search.toLowerCase();
      employees = employees.filter(e =>
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(s) ||
        (e.email || '').toLowerCase().includes(s) ||
        (e.employee_id || '').toLowerCase().includes(s) ||
        (e.department || '').toLowerCase().includes(s) ||
        (e.designation || '').toLowerCase().includes(s)
      );
    }

    const total = employees.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const paginated = employees.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    // Add doc/leave counts
    const enriched = await Promise.all(paginated.map(async e => {
      const [doc_count, pending_docs, pending_leaves] = await Promise.all([
        db.documents.count({ employee_id: e._id }),
        db.documents.count({ employee_id: e._id, status: 'pending' }),
        db.leave_applications.count({ employee_id: e._id, status: 'pending' }),
      ]);
      return { ...e, doc_count, pending_docs, pending_leaves };
    }));

    const allDepts = await db.employees.find({});
    const departments = [...new Set(allDepts.map(e => e.department).filter(Boolean))].sort();

    res.json({ employees: enriched, total, page: pageNum, limit: limitNum, departments });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/employees/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const employee = await db.employees.findOne({ _id: req.params.id });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const [documents, leaves] = await Promise.all([
      db.documents.find({ employee_id: req.params.id }).sort({ uploaded_at: -1 }),
      db.leave_applications.find({ employee_id: req.params.id }).sort({ applied_at: -1 }),
    ]);

    res.json({ ...employee, documents, leaves });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/employees
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required.' });
    }

    const existing = await db.employees.findOne({ email });
    if (existing) return res.status(400).json({ error: 'An employee with this email already exists.' });

    const lastEmp = await db.employees.find({}).sort({ created_at: -1 }).limit(1);
    let nextNum = 1;
    if (lastEmp.length > 0) {
      const parts = lastEmp[0].employee_id.split('-');
      nextNum = parseInt(parts[parts.length - 1]) + 1;
    }
    const employee_id = `EH-${String(nextNum).padStart(3, '0')}`;

    const newEmp = await db.employees.insert({
      ...req.body,
      employee_id,
      status: 'active',
      onboarding_status: 'pending',
      onboarding_step: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await db.activity_log.insert({
      actor_id: req.user.id, actor_name: req.user.name,
      action: 'added', entity_type: 'employee', entity_id: newEmp._id,
      details: `New employee ${first_name} ${last_name} added`,
      created_at: new Date().toISOString()
    });

    res.status(201).json(newEmp);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/employees/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const emp = await db.employees.findOne({ _id: req.params.id });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const updates = { ...req.body, updated_at: new Date().toISOString() };
    delete updates._id;

    await db.employees.update({ _id: req.params.id }, { $set: updates });
    const updated = await db.employees.findOne({ _id: req.params.id });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/employees/:id/onboarding
router.put('/:id/onboarding', authenticateToken, async (req, res) => {
  try {
    const { onboarding_status, onboarding_step, notes } = req.body;
    const emp = await db.employees.findOne({ _id: req.params.id });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    await db.employees.update({ _id: req.params.id }, {
      $set: {
        onboarding_status: onboarding_status || emp.onboarding_status,
        onboarding_step: onboarding_step || emp.onboarding_step,
        updated_at: new Date().toISOString()
      }
    });

    await db.activity_log.insert({
      actor_id: req.user.id, actor_name: req.user.name,
      action: 'onboarding_update', entity_type: 'employee', entity_id: req.params.id,
      details: `Onboarding ${onboarding_status} for ${emp.first_name} ${emp.last_name}. ${notes || ''}`,
      created_at: new Date().toISOString()
    });

    const updated = await db.employees.findOne({ _id: req.params.id });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/employees/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const emp = await db.employees.findOne({ _id: req.params.id });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    await db.employees.remove({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

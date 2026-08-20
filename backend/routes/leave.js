const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/leave
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status = '', employee_id = '', page = 1, limit = 20 } = req.query;
    let query = {};
    if (status) query.status = status;
    if (employee_id) query.employee_id = employee_id;

    let leaves = await db.leave_applications.find(query).sort({ applied_at: -1 });
    const total = leaves.length;

    // Enrich with employee info if not already embedded
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const paginated = leaves.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    const enriched = await Promise.all(paginated.map(async l => {
      if (!l.employee_name) {
        const emp = await db.employees.findOne({ _id: l.employee_id });
        return {
          ...l,
          employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
          emp_code: emp?.employee_id || '',
          department: emp?.department || '',
          designation: emp?.designation || ''
        };
      }
      return l;
    }));

    const [pendingC, approvedC, rejectedC] = await Promise.all([
      db.leave_applications.count({ status: 'pending' }),
      db.leave_applications.count({ status: 'approved' }),
      db.leave_applications.count({ status: 'rejected' }),
    ]);

    res.json({ leaves: enriched, total, counts: { pending: pendingC, approved: approvedC, rejected: rejectedC }, page: pageNum, limit: limitNum });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/leave
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { employee_id, leave_type, start_date, end_date, days_count, reason } = req.body;
    if (!employee_id || !leave_type || !start_date || !end_date) {
      return res.status(400).json({ error: 'Employee, leave type, start and end dates are required.' });
    }

    const emp = await db.employees.findOne({ _id: employee_id });
    const leave = await db.leave_applications.insert({
      employee_id, leave_type, start_date, end_date,
      days_count: days_count || 1, reason: reason || '',
      status: 'pending',
      employee_name: emp ? `${emp.first_name} ${emp.last_name}` : '',
      emp_code: emp?.employee_id || '',
      department: emp?.department || '',
      applied_at: new Date().toISOString(),
      reviewed_by: null, reviewed_at: null, notes: ''
    });
    res.status(201).json(leave);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/leave/:id/status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['approved', 'rejected', 'pending'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    const leave = await db.leave_applications.findOne({ _id: req.params.id });
    if (!leave) return res.status(404).json({ error: 'Leave application not found' });

    await db.leave_applications.update({ _id: req.params.id }, {
      $set: { status, notes: notes || '', reviewed_by: req.user.id, reviewed_at: new Date().toISOString() }
    });

    const emp = await db.employees.findOne({ _id: leave.employee_id });
    if (status === 'approved' && emp) {
      const today = new Date().toISOString().split('T')[0];
      if (leave.start_date <= today && leave.end_date >= today) {
        await db.employees.update({ _id: leave.employee_id }, { $set: { status: 'on_leave' } });
      }
    }

    await db.activity_log.insert({
      actor_id: req.user.id, actor_name: req.user.name,
      action: status, entity_type: 'leave', entity_id: req.params.id,
      details: `Leave ${status} for ${emp ? emp.first_name + ' ' + emp.last_name : 'employee'}. ${notes || ''}`,
      created_at: new Date().toISOString()
    });

    const updated = await db.leave_applications.findOne({ _id: req.params.id });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/leave/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.leave_applications.remove({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

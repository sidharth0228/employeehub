const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [total, active, onLeave, inactive, pendingDocs, pendingLeaves, incompleteOnboarding] = await Promise.all([
      db.employees.count({}),
      db.employees.count({ status: 'active' }),
      db.employees.count({ status: 'on_leave' }),
      db.employees.count({ status: 'inactive' }),
      db.documents.count({ status: 'pending' }),
      db.leave_applications.count({ status: 'pending' }),
      db.employees.count({ onboarding_status: { $ne: 'complete' } }),
    ]);
    res.json({ total, active, onLeave, inactive, pendingDocs, pendingLeaves, incompleteOnboarding });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/dashboard/alerts
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const in60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [docAlerts, recentLeaves, onboardingPending, recentActivity] = await Promise.all([
      db.documents.find({
        $or: [
          { status: 'expired' },
          { status: 'rejected' },
          { expiry_date: { $exists: true, $ne: null, $lte: in60Days } }
        ]
      }).sort({ expiry_date: 1 }).limit(10),
      db.leave_applications.find({}).sort({ applied_at: -1 }).limit(8),
      db.employees.find({ onboarding_status: { $ne: 'complete' } }).sort({ created_at: -1 }).limit(5),
      db.activity_log.find({}).sort({ created_at: -1 }).limit(10),
    ]);

    // Enrich with employee data
    const empIds = [...new Set([
      ...docAlerts.map(d => d.employee_id),
      ...recentLeaves.map(l => l.employee_id),
    ])];
    const employees = await db.employees.find({ _id: { $in: empIds } });
    const empMap = {};
    employees.forEach(e => { empMap[e._id] = e; });

    const enrichedDocAlerts = docAlerts.map(d => ({
      ...d,
      employee_name: empMap[d.employee_id] ? `${empMap[d.employee_id].first_name} ${empMap[d.employee_id].last_name}` : 'Unknown',
      emp_code: empMap[d.employee_id]?.employee_id || '',
    }));

    res.json({ docAlerts: enrichedDocAlerts, recentLeaves, onboardingPending, recentActivity });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

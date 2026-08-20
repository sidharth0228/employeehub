const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rows = await db.settings.find({});
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/settings
router.put('/', authenticateToken, async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      const existing = await db.settings.findOne({ key });
      if (existing) {
        await db.settings.update({ key }, { $set: { value: String(value), updated_at: new Date().toISOString() } });
      } else {
        await db.settings.insert({ key, value: String(value), updated_at: new Date().toISOString() });
      }
    }
    const rows = await db.settings.find({});
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/settings/activity
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const logs = await db.activity_log.find({}).sort({ created_at: -1 }).limit(50);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

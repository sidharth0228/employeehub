const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await db.users.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.users.findOne({ _id: decoded.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user._id, email: user.email, name: user.name, role: user.role });
  } catch { res.status(403).json({ error: 'Invalid token' }); }
});

module.exports = router;
